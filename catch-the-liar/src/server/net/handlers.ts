import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { isValidRoomCode, normalizeRoomCode, validateNickname } from '../../shared/text';
import type { Ack, AckResult } from '../../shared/types';
import type { GameRoom } from '../game/room';
import type { OpResult } from '../game/types';
import type { GameServer, GameSocket, RoomManager } from './manager';
import { TokenBucket, WindowLimiter } from './rateLimit';

const createLimiter = new WindowLimiter(10, 60_000);
const joinLimiter = new WindowLimiter(40, 60_000);

const empty = z.object({}).passthrough();
const schemas = {
  create: z.object({ nickname: z.string().max(100) }),
  join: z.object({ code: z.string().max(20), nickname: z.string().max(100) }),
  resume: z.object({ code: z.string().max(20), playerId: z.string().uuid(), token: z.string().min(20).max(100) }),
  kick: z.object({ playerId: z.string().uuid() }),
  settings: z
    .object({
      packIds: z.array(z.string().max(40)).max(50),
      hintRounds: z.number().int(),
      hintSeconds: z.number().int(),
      voteSeconds: z.number().int(),
      liarSeesCategory: z.boolean(),
    })
    .partial(),
  hint: z.object({ text: z.string().max(200) }),
  vote: z.object({ targetId: z.string().uuid() }),
  guess: z.object({ word: z.string().max(100) }),
};

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function sameHash(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

const MSG = {
  invalid: 'الطلب غير صالح',
  slowDown: 'شوي شوي! حاول بعد ثواني',
  noRoom: 'ما لقينا الغرفة، تأكد من الرمز أو أنشئ غرفة جديدة',
  noSession: 'انقطع اتصالك بالغرفة، حدّث الصفحة وادخل من جديد',
  badCode: 'رمز الغرفة لازم يكون 6 أرقام',
  banned: 'تم إخراجك من هذي الغرفة',
  sessionGone: 'ما لقينا جلستك في الغرفة، ادخل باسمك من جديد',
} as const;

export function registerHandlers(io: GameServer, manager: RoomManager, newId: () => string): void {
  io.on('connection', (socket: GameSocket) => {
    const bucket = new TokenBucket(20, 8);

    /** Wraps a handler with flood protection, payload validation and a safe ack. */
    function on<S extends z.ZodTypeAny>(
      event: string,
      schema: S,
      handler: (payload: z.infer<S>, ack: (res: AckResult<object>) => void) => void,
    ): void {
      socket.on(event as never, ((payload: unknown, maybeAck: unknown) => {
        const ack: Ack<object> = typeof maybeAck === 'function' ? (maybeAck as Ack<object>) : () => {};
        if (!bucket.take()) return ack({ ok: false, error: MSG.slowDown });
        const parsed = schema.safeParse(payload ?? {});
        if (!parsed.success) return ack({ ok: false, error: MSG.invalid });
        try {
          handler(parsed.data, ack);
        } catch (err) {
          console.error(`[socket] ${event} failed`, err);
          ack({ ok: false, error: 'صار خطأ غير متوقع، حاول مرة ثانية' });
        }
      }) as never);
    }

    /** Runs an in-room action for the attached player, then commits the room. */
    function act(event: string, schema: z.ZodTypeAny, fn: (room: GameRoom, playerId: string, payload: never, now: number) => OpResult) {
      on(event, schema, (payload, ack) => {
        const ctx = manager.context(socket);
        if (!ctx) return ack({ ok: false, error: MSG.noSession });
        const res = fn(ctx.room, ctx.playerId, payload as never, Date.now());
        manager.commit(ctx.room);
        ack(res);
      });
    }

    /** Adds a new player, acks their session, then broadcasts (so the ack arrives first). */
    function newSession(room: GameRoom, nickname: string, ack: Ack<{ code: string; playerId: string; token: string }>): boolean {
      const token = randomBytes(24).toString('base64url');
      const playerId = newId();
      const res = room.addPlayer({ id: playerId, nickname, tokenHash: hashToken(token), now: Date.now() });
      if (!res.ok) {
        ack(res);
        return false;
      }
      manager.attach(socket, room, playerId);
      ack({ ok: true, code: room.code, playerId, token });
      manager.commit(room);
      return true;
    }

    on('room:create', schemas.create, (p, ack) => {
      const name = validateNickname(p.nickname);
      if (!name.ok) return ack(name);
      if (!createLimiter.hit(socket.data.ip)) return ack({ ok: false, error: MSG.slowDown });
      const room = manager.createRoom();
      if (!newSession(room, name.value, ack)) manager.discardIfEmpty(room);
    });

    on('room:join', schemas.join, (p, ack) => {
      if (!joinLimiter.hit(socket.data.ip)) return ack({ ok: false, error: MSG.slowDown });
      const code = normalizeRoomCode(p.code);
      if (!isValidRoomCode(code)) return ack({ ok: false, error: MSG.badCode });
      const room = manager.get(code);
      if (!room || room.closed) return ack({ ok: false, error: MSG.noRoom });
      newSession(room, p.nickname, ack);
    });

    on('room:resume', schemas.resume, (p, ack) => {
      if (!joinLimiter.hit(socket.data.ip)) return ack({ ok: false, error: MSG.slowDown });
      const code = normalizeRoomCode(p.code);
      const room = manager.get(code);
      if (!room || room.closed) return ack({ ok: false, error: MSG.noRoom });
      const hash = hashToken(p.token);
      if (room.isBanned(hash)) return ack({ ok: false, error: MSG.banned });
      const player = room.getPlayer(p.playerId);
      if (!player || !sameHash(player.tokenHash, hash)) return ack({ ok: false, error: MSG.sessionGone });
      manager.attach(socket, room, player.id);
      ack({ ok: true });
      manager.commit(room);
    });

    on('room:leave', empty, (_p, ack) => {
      const ctx = manager.context(socket);
      if (!ctx) return ack({ ok: true });
      const res = ctx.room.leave(ctx.playerId, Date.now());
      manager.commit(ctx.room);
      ack(res);
    });

    on('room:detach', empty, (_p, ack) => {
      manager.detach(socket);
      ack({ ok: true });
    });

    act('room:kick', schemas.kick, (room, by, p: { playerId: string }, now) => room.kick(by, p.playerId, now));
    act('room:settings', schemas.settings, (room, by, p: z.infer<typeof schemas.settings>) =>
      room.updateSettings(by, p as never),
    );
    act('room:lobby', empty, (room, by, _p, now) => room.toLobby(by, now));
    act('scores:reset', empty, (room, by) => room.resetScores(by));
    act('round:start', empty, (room, by, _p, now) => room.startRound(by, now));
    act('round:ready', empty, (room, by, _p, now) => room.markReady(by, now));
    act('hint:submit', schemas.hint, (room, by, p: { text: string }, now) => room.submitHint(by, p.text, now));
    act('turn:skip', empty, (room, by, _p, now) => room.skipTurn(by, now));
    act('vote:cast', schemas.vote, (room, by, p: { targetId: string }, now) => room.castVote(by, p.targetId, now));
    act('guess:submit', schemas.guess, (room, by, p: { word: string }, now) => room.submitGuess(by, p.word, now));

    socket.on('disconnect', () => manager.detach(socket));
  });
}
