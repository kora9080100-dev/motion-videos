import { randomInt, randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { createServer, type Server as HttpServer } from 'node:http';
import path from 'node:path';
import express, { type Request, type Response } from 'express';
import { Server } from 'socket.io';
import { normalizeRoomCode } from '../shared/text';
import { MAX_PLAYERS, MIN_PLAYERS, type PublicConfig } from '../shared/types';
import type { AppConfig } from './config';
import type { GameRepository } from './db/repository';
import type { RoomDeps } from './game/room';
import type { Catalog } from './game/types';
import { resolveFeatures } from './monetization';
import { registerHandlers, type Guards } from './net/handlers';
import { RoomManager, type GameServer } from './net/manager';
import { Persistence } from './net/persistence';
import { WindowLimiter, clientIp } from './net/rateLimit';

/** Cryptographically strong float in [0, 1) for liar selection and shuffles. */
export const secureRandom = () => randomInt(0, 2 ** 47) / 2 ** 47;

export interface GameServerHandle {
  http: HttpServer;
  io: GameServer;
  manager: RoomManager;
  persistence: Persistence;
  close(): Promise<void>;
}

export function createGameServer(opts: {
  config: AppConfig;
  repo: GameRepository;
  catalog: Catalog;
  rng?: () => number;
}): GameServerHandle {
  const { config, repo, catalog } = opts;
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self' ws: wss:",
        "manifest-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ].join('; '),
    );
    if (config.production) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  const http = createServer(app);
  const io: GameServer = new Server(http, {
    serveClient: false,
    maxHttpBufferSize: 16 * 1024,
    // Notice dropped phones within ~20s so turns and host duties move on quickly.
    pingInterval: 10_000,
    pingTimeout: 10_000,
    allowRequest: (req, cb) => {
      const origin = req.headers.origin;
      if (!origin) return cb(null, true); // non-browser clients (tests, health checks)
      try {
        if (new URL(origin).host === req.headers.host || config.allowedOrigins.includes(origin)) return cb(null, true);
      } catch {
        /* fallthrough */
      }
      cb('origin not allowed', false);
    },
  });
  // Cap simultaneous connections per IP (a whole family on one Wi-Fi stays far below this).
  const MAX_CONNECTIONS_PER_IP = 30;
  const connectionsPerIp = new Map<string, number>();
  io.use((socket, next) => {
    const ip = clientIp(socket.handshake.headers, socket.handshake.address, config.trustProxy);
    const count = connectionsPerIp.get(ip) ?? 0;
    if (count >= MAX_CONNECTIONS_PER_IP) return next(new Error('too many connections'));
    connectionsPerIp.set(ip, count + 1);
    socket.once('disconnect', () => {
      const n = (connectionsPerIp.get(ip) ?? 1) - 1;
      if (n <= 0) connectionsPerIp.delete(ip);
      else connectionsPerIp.set(ip, n);
    });
    socket.data.ip = ip;
    next();
  });

  const deps: RoomDeps = {
    catalog,
    rng: opts.rng ?? secureRandom,
    newId: randomUUID,
    features: resolveFeatures(config),
  };
  const persistence = new Persistence(repo);
  const manager = new RoomManager(io, deps, persistence);
  const guards: Guards = { badCodes: new WindowLimiter(20, 10 * 60_000) };
  registerHandlers(io, manager, randomUUID, guards);

  // ------------------------------------------------------------- HTTP API
  const previewLimiter = new WindowLimiter(60, 60_000);

  app.get('/healthz', (_req, res) => {
    res.json({ ok: true, rooms: manager.size });
  });

  app.get('/api/config', (_req, res) => {
    const body: PublicConfig = {
      packs: catalog.packs(),
      minPlayers: MIN_PLAYERS,
      maxPlayers: MAX_PLAYERS,
      adsEnabled: config.adsEnabled,
    };
    res.setHeader('Cache-Control', 'no-cache');
    res.json(body);
  });

  app.get('/api/rooms/:code', (req: Request<{ code: string }>, res: Response) => {
    const ip = clientIp(req.headers, req.socket.remoteAddress, config.trustProxy);
    if (!previewLimiter.hit(ip) || guards.badCodes.blocked(ip)) {
      res.status(429).json({ exists: false });
      return;
    }
    const preview = manager.preview(normalizeRoomCode(req.params.code));
    if (!preview.exists) guards.badCodes.hit(ip);
    res.setHeader('Cache-Control', 'no-store');
    res.json(preview);
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'not found' });
  });

  // ------------------------------------------------------------- web client
  const clientDir = path.resolve(config.clientDir);
  const indexHtml = path.join(clientDir, 'index.html');
  if (existsSync(indexHtml)) {
    app.use(
      '/assets',
      express.static(path.join(clientDir, 'assets'), { immutable: true, maxAge: '365d', index: false, fallthrough: false }),
    );
    app.use(express.static(clientDir, { index: false, maxAge: '1h' }));
    const template = readFileSync(indexHtml, 'utf8');
    const escapeAttr = (s: string) => s.replace(/[&"<>]/g, (c) => `&#${c.charCodeAt(0)};`);
    app.get(/.*/, (req, res) => {
      // Link previews (WhatsApp, X…) need absolute URLs; room links get an invite title.
      const origin = config.publicUrl ?? `${req.protocol}://${req.get('host')}`;
      const room = req.path.match(/^\/r\/(\d{6})\/?$/);
      let html = template.replaceAll('__ORIGIN__', escapeAttr(origin)).replaceAll('__PATH__', escapeAttr(room ? `/r/${room[1]}` : '/'));
      if (room) {
        html = html.replace(
          /<meta property="og:title" content="[^"]*" \/>/,
          `<meta property="og:title" content="تعال العب معي «اكشف الكذبة» 🕵️ غرفة ${room[1]}" />`,
        );
      }
      res.setHeader('Cache-Control', 'no-cache');
      res.type('html').send(html);
    });
  } else {
    app.get('/', (_req, res) => {
      res.type('text/plain').send('Client not built. Run `npm run build` or use `npm run dev`.');
    });
  }

  return {
    http,
    io,
    manager,
    persistence,
    async close() {
      manager.snapshotAll();
      manager.stopTimers();
      await new Promise<void>((resolve) => io.close(() => resolve()));
      await persistence.flush();
    },
  };
}
