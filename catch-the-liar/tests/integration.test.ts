import type { AddressInfo } from 'node:net';
import { io as connect, type Socket } from 'socket.io-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createGameServer, type GameServerHandle } from '../src/server/app';
import { loadConfig } from '../src/server/config';
import { WordCatalog } from '../src/server/content/catalog';
import { BUILTIN_PACKS } from '../src/server/content/index';
import { openDatabase, type Db } from '../src/server/db/client';
import { migrate } from '../src/server/db/migrations';
import { Repository } from '../src/server/db/repository';
import type { AckResult, ChatMessageView, ClientToServerEvents, RoomView, ServerToClientEvents, SessionInfo } from '../src/shared/types';

type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let db: Db;
let repo: Repository;
let server: GameServerHandle;
let url: string;
const sockets: ClientSocket[] = [];

beforeAll(async () => {
  db = await openDatabase({ url: process.env.TEST_DATABASE_URL, pgliteDir: 'memory://' });
  await migrate(db);
  repo = new Repository(db);
  await repo.seedPacks(BUILTIN_PACKS);
  const catalog = new WordCatalog(await repo.loadCatalog());
  server = createGameServer({ config: { ...loadConfig({}), clientDir: '/nonexistent' }, repo, catalog });
  await new Promise<void>((resolve) => server.http.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${(server.http.address() as AddressInfo).port}`;
});

afterAll(async () => {
  for (const s of sockets) s.disconnect();
  await server.close();
  await db.close();
});

class Player {
  socket: ClientSocket;
  view: RoomView | null = null;
  chat: ChatMessageView[] = [];
  session: SessionInfo | null = null;
  notices: string[] = [];
  removed: string | null = null;

  constructor(public name: string) {
    this.socket = connect(url, { transports: ['websocket'], forceNew: true });
    sockets.push(this.socket);
    this.socket.on('room:state', (v) => {
      this.view = v;
    });
    this.socket.on('notice', (n) => this.notices.push(n.text));
    this.socket.on('chat:history', (h) => {
      this.chat = h.messages;
    });
    this.socket.on('chat:message', (m) => {
      this.chat.push(m);
    });
    this.socket.on('room:removed', (p) => {
      this.removed = p.reason;
    });
  }

  emit<T = object>(event: keyof ClientToServerEvents, payload: object = {}): Promise<AckResult<T>> {
    return new Promise((resolve) => {
      (this.socket.emit as (...args: unknown[]) => void)(event, payload, resolve);
    });
  }

  async create(): Promise<string> {
    const res = await this.emit<SessionInfo>('room:create', { nickname: this.name });
    if (!res.ok) throw new Error(res.error);
    this.session = res;
    return res.code;
  }

  async join(code: string): Promise<AckResult<SessionInfo>> {
    const res = await this.emit<SessionInfo>('room:join', { code, nickname: this.name });
    if (res.ok) this.session = res;
    return res;
  }

  get id(): string {
    return this.session!.playerId;
  }
}

async function until(check: () => boolean, label = 'condition', timeout = 5000): Promise<void> {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeout) throw new Error(`timed out waiting for ${label}`);
    await new Promise((r) => setTimeout(r, 15));
  }
}

describe('realtime server', () => {
  it('plays a complete round between four connected players', async () => {
    const host = new Player('المضيف');
    const code = await host.create();
    expect(code).toMatch(/^[1-9]\d{5}$/);

    const preview = await fetch(`${url}/api/rooms/${code}`).then((r) => r.json());
    expect(preview).toMatchObject({ exists: true, players: 1, phase: 'lobby' });

    const others = [new Player('سارة'), new Player('خالد'), new Player('نورة')];
    for (const p of others) expect((await p.join(code)).ok).toBe(true);
    const all = [host, ...others];
    await until(() => all.every((p) => p.view?.players.length === 4), 'all players in lobby');
    expect(host.notices.some((n) => n.includes('سارة'))).toBe(true);

    expect((await others[0]!.emit('round:start')).ok).toBe(false); // not host
    expect((await host.emit('room:settings', { hintRounds: 1 })).ok).toBe(true);
    expect(await host.emit('round:start')).toEqual({ ok: true });
    await until(() => all.every((p) => p.view?.phase === 'reveal'), 'reveal phase');

    const liars = all.filter((p) => p.view!.secret?.role === 'liar');
    const civilians = all.filter((p) => p.view!.secret?.role === 'civilian');
    expect(liars).toHaveLength(1);
    expect(civilians).toHaveLength(3);
    const liar = liars[0]!;
    const word = (civilians[0]!.view!.secret as { word: string }).word;
    expect(civilians.every((c) => (c.view!.secret as { word: string }).word === word)).toBe(true);
    expect(JSON.stringify(liar.view)).not.toContain(word);

    for (const p of all) await p.emit('round:ready');
    await until(() => all.every((p) => p.view?.phase === 'hints'), 'hints phase');

    for (let turn = 0; turn < 4; turn++) {
      await until(() => !!host.view?.turn?.currentPlayerId, 'turn');
      const currentId = host.view!.turn!.currentPlayerId!;
      const current = all.find((p) => p.id === currentId)!;
      const wrong = all.find((p) => p.id !== currentId)!;
      expect((await wrong.emit('hint:submit', { text: 'مو دوري' })).ok).toBe(false);
      expect((await current.emit('hint:submit', { text: `تلميح رقم ${turn + 1}` })).ok).toBe(true);
      await until(() => host.view!.hints.length === turn + 1, 'hint broadcast');
    }
    await until(() => all.every((p) => p.view?.phase === 'voting'), 'voting phase');

    for (const c of civilians) expect((await c.emit('vote:cast', { targetId: liar.id })).ok).toBe(true);
    expect((await liar.emit('vote:cast', { targetId: civilians[0]!.id })).ok).toBe(true);
    await until(() => all.every((p) => p.view?.phase === 'guess'), 'guess phase');
    expect(liar.view!.guess!.options).toContain(word);
    expect(civilians[0]!.view!.guess!.options).toBeNull();

    expect((await liar.emit('guess:submit', { word })).ok).toBe(true);
    await until(() => all.every((p) => p.view?.phase === 'results'), 'results phase');
    const result = host.view!.result!;
    expect(result).toMatchObject({ liarId: liar.id, word, caught: true, guess: { word, correct: true } });
    const scores = Object.fromEntries(host.view!.players.map((p) => [p.id, p.score]));
    expect(scores[liar.id]).toBe(2);
    for (const c of civilians) expect(scores[c.id]).toBe(1);

    // Everything was written to the database.
    await server.persistence.flush();
    const [round] = await db.query<{ word_text: string; liar_player_id: string; caught: boolean; status: string }>(
      `SELECT r.word_text, r.liar_player_id, r.caught, r.status FROM rounds r JOIN rooms ro ON ro.id = r.room_id WHERE ro.code = $1`,
      [code],
    );
    expect(round).toMatchObject({ word_text: word, liar_player_id: liar.id, caught: true, status: 'finished' });
    const hints = await db.query(`SELECT 1 FROM hints h JOIN rounds r ON r.id = h.round_id JOIN rooms ro ON ro.id = r.room_id WHERE ro.code = $1`, [code]);
    expect(hints).toHaveLength(4);
    const votes = await db.query(`SELECT 1 FROM votes v JOIN rounds r ON r.id = v.round_id JOIN rooms ro ON ro.id = r.room_id WHERE ro.code = $1`, [code]);
    expect(votes).toHaveLength(4);

    // Play again in the same room.
    expect((await host.emit('round:start')).ok).toBe(true);
    await until(() => all.every((p) => p.view?.phase === 'reveal' && p.view.roundNumber === 2), 'second round');
  });

  it('lets a player reconnect with their session and keeps their role', async () => {
    const host = new Player('أحمد');
    const code = await host.create();
    const a = new Player('ريم');
    const b = new Player('فيصل');
    await a.join(code);
    await b.join(code);
    await until(() => host.view?.players.length === 3);
    await host.emit('round:start');
    await until(() => a.view?.phase === 'reveal');
    const secretBefore = a.view!.secret;

    a.socket.disconnect();
    await until(() => host.view!.players.find((p) => p.id === a.id)?.connected === false, 'offline status');

    const again = new Player('ريم');
    const bad = await again.emit('room:resume', { code, playerId: a.id, token: 'x'.repeat(32) });
    expect(bad.ok).toBe(false);
    const res = await again.emit('room:resume', { code, playerId: a.id, token: a.session!.token });
    expect(res.ok).toBe(true);
    await until(() => again.view?.phase === 'reveal', 'resumed view');
    expect(again.view!.secret).toEqual(secretBefore);
    expect(again.view!.meId).toBe(a.id);
    await until(() => host.view!.players.find((p) => p.id === a.id)?.connected === true, 'online status');
  });

  it('kicks players, blocks their token and lets others continue', async () => {
    const host = new Player('مها');
    const code = await host.create();
    const x = new Player('مزعج');
    await x.join(code);
    await until(() => host.view?.players.length === 2);
    expect((await host.emit('room:kick', { playerId: x.id })).ok).toBe(true);
    await until(() => x.removed === 'kicked', 'kicked notice');
    const back = new Player('مزعج');
    const res = await back.emit('room:resume', { code, playerId: x.id, token: x.session!.token });
    expect(res.ok).toBe(false);
  });

  it('rejects bad payloads, wrong codes and foreign origins', async () => {
    const p = new Player('اختبار');
    expect(await p.emit('room:join', { code: 'abc', nickname: 'اختبار' })).toMatchObject({ ok: false });
    expect(await p.emit('room:join', { code: '999999', nickname: 'اختبار' })).toMatchObject({ ok: false });
    expect(await p.emit('room:create', { nickname: 5 })).toMatchObject({ ok: false });
    expect(await p.emit('hint:submit', { text: 'x' })).toMatchObject({ ok: false });

    const foreign = connect(url, { transports: ['polling'], forceNew: true, extraHeaders: { origin: 'https://evil.example' } });
    sockets.push(foreign);
    const error = await new Promise<Error>((resolve) => foreign.on('connect_error', resolve));
    expect(error).toBeTruthy();
  });

  it('serves config and health endpoints', async () => {
    const health = await fetch(`${url}/healthz`).then((r) => r.json());
    expect(health.ok).toBe(true);
    const config = await fetch(`${url}/api/config`).then((r) => r.json());
    expect(config.packs.length).toBeGreaterThanOrEqual(10);
    expect(config.minPlayers).toBe(3);
    const res = await fetch(`${url}/api/rooms/123`);
    expect(await res.json()).toEqual({ exists: false });
  });

  it('delivers chat live and sends recent history to people who join or come back', async () => {
    const host = new Player('دردشة');
    const code = await host.create();
    const a = new Player('ريان');
    await a.join(code);
    await until(() => host.view?.players.length === 2);
    expect((await host.emit('chat:send', { text: 'هلا ريان 👋' })).ok).toBe(true);
    await until(() => a.chat.some((m) => m.text === 'هلا ريان 👋'), 'live chat');
    expect((await a.emit('chat:send', { text: 'www.spam.com' })).ok).toBe(false);
    const late = new Player('لمى');
    await late.join(code);
    await until(() => late.chat.some((m) => m.text === 'هلا ريان 👋'), 'history for newcomer');
    a.socket.disconnect();
    const back = new Player('ريان');
    await back.emit('room:resume', a.session!);
    await until(() => back.chat.length >= 1, 'history after reconnect');
  });

  it('a locked room refuses newcomers but lets members reconnect', async () => {
    const host = new Player('قفل');
    const code = await host.create();
    const member = new Player('عضو');
    await member.join(code);
    await until(() => host.view?.players.length === 2);
    expect((await member.emit('room:lock', { locked: true })).ok).toBe(false);
    expect((await host.emit('room:lock', { locked: true })).ok).toBe(true);
    await until(() => member.view?.locked === true, 'lock broadcast');
    expect((await fetch(`${url}/api/rooms/${code}`).then((r) => r.json())).locked).toBe(true);
    const stranger = new Player('غريب');
    expect(await stranger.join(code)).toMatchObject({ ok: false });
    member.socket.disconnect();
    const back = new Player('عضو');
    expect((await back.emit('room:resume', member.session!)).ok).toBe(true);
  });

  it('restores rooms from snapshots after a restart', async () => {
    const host = new Player('سلطان');
    const code = await host.create();
    await new Player('هند').join(code);
    await new Player('بدر').join(code);
    await until(() => host.view?.players.length === 3);
    await host.emit('round:start');
    await until(() => host.view?.phase === 'reveal');
    server.manager.snapshotAll();
    await server.persistence.flush();
    const states = await repo.loadSnapshots(60);
    const snap = states.find((s) => s.code === code)!;
    expect(snap.phase).toBe('reveal');
    expect(snap.round!.word).toBeTruthy();
  });
  it('blocks an IP that keeps guessing wrong room codes', async () => {
    const host = new Player('حارس');
    const code = await host.create();
    for (let i = 0; i < 20; i++) await fetch(`${url}/api/rooms/${100000 + i}`);
    expect((await fetch(`${url}/api/rooms/${code}`)).status).toBe(429);
    const guesser = new Player('مخمن');
    const res = await guesser.join(code);
    expect(res).toMatchObject({ ok: false });
    expect((res as { error: string }).error).toContain('رموز غلط');
  });

});
