import { randomInt } from 'node:crypto';
import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, RemovedReason, RoomPreview, ServerToClientEvents } from '../../shared/types';
import { GameRoom, type RoomDeps } from '../game/room';
import type { RoomState } from '../game/types';
import type { Persistence } from './persistence';

export interface SocketData {
  ip: string;
  code?: string;
  playerId?: string;
}

export type GameServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
export type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

const playerChannel = (playerId: string) => `p:${playerId}`;

/**
 * Owns every live room in this process: presence (which sockets belong to which player),
 * timers, per-player broadcasts and handing domain events to persistence.
 */
export class RoomManager {
  private rooms = new Map<string, GameRoom>();
  private presence = new Map<string, number>();
  private timers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly io: GameServer,
    private readonly deps: RoomDeps,
    private readonly persistence: Persistence,
    private readonly now: () => number = Date.now,
  ) {}

  get size(): number {
    return this.rooms.size;
  }

  get(code: string): GameRoom | undefined {
    return this.rooms.get(code);
  }

  all(): GameRoom[] {
    return [...this.rooms.values()];
  }

  createRoom(): GameRoom {
    const room = GameRoom.create({ id: this.deps.newId(), code: this.generateCode(), now: this.now() }, this.deps);
    this.rooms.set(room.code, room);
    this.persistence.roomCreated(room);
    return room;
  }

  /** Drops a room nobody managed to join (e.g. creation failed half-way). */
  discardIfEmpty(room: GameRoom): void {
    if (room.state.players.length === 0 && this.rooms.get(room.code) === room) this.rooms.delete(room.code);
  }

  restore(states: RoomState[]): number {
    let count = 0;
    for (const state of states) {
      if (state.closed || this.rooms.has(state.code)) continue;
      const room = GameRoom.restore(state, this.deps, this.now());
      this.rooms.set(room.code, room);
      this.schedule(room);
      count++;
    }
    return count;
  }

  preview(code: string): RoomPreview {
    const room = this.rooms.get(code);
    if (!room || room.closed) return { exists: false };
    const s = room.state;
    return {
      exists: true,
      code: s.code,
      players: s.players.length,
      phase: s.phase,
      full: s.players.length >= 10,
      locked: !!s.locked,
      hostName: room.getPlayer(s.hostId)?.nickname,
    };
  }

  private generateCode(): string {
    for (let i = 0; i < 1000; i++) {
      const code = String(randomInt(100_000, 1_000_000));
      if (!this.rooms.has(code)) return code;
    }
    throw new Error('could not allocate a room code');
  }

  // ------------------------------------------------------------- presence

  attach(socket: GameSocket, room: GameRoom, playerId: string): void {
    // Switching rooms: let the previous room know this player went away.
    if (socket.data.playerId) this.detach(socket, { silent: socket.data.code === room.code });
    socket.data.code = room.code;
    socket.data.playerId = playerId;
    void socket.join(playerChannel(playerId));
    const n = (this.presence.get(playerId) ?? 0) + 1;
    this.presence.set(playerId, n);
    if (n === 1) room.setConnected(playerId, true, this.now());
  }

  /** Called when a socket disconnects or switches rooms. */
  detach(socket: GameSocket, opts: { silent?: boolean } = {}): void {
    const { code, playerId } = socket.data;
    if (!playerId) return;
    void socket.leave(playerChannel(playerId));
    socket.data.code = undefined;
    socket.data.playerId = undefined;
    const n = (this.presence.get(playerId) ?? 1) - 1;
    const room = code ? this.rooms.get(code) : undefined;
    if (n <= 0) {
      this.presence.delete(playerId);
      room?.setConnected(playerId, false, this.now());
    } else {
      this.presence.set(playerId, n);
    }
    if (room && !opts.silent) this.commit(room);
  }

  context(socket: GameSocket): { room: GameRoom; playerId: string } | null {
    const { code, playerId } = socket.data;
    if (!code || !playerId) return null;
    const room = this.rooms.get(code);
    if (!room || room.closed || !room.getPlayer(playerId)) return null;
    return { room, playerId };
  }

  // ------------------------------------------------------------- commit & broadcast

  /** Flushes engine events (DB + notices), broadcasts fresh views and reschedules timers. */
  commit(room: GameRoom): void {
    const events = room.drainEvents();
    if (events.length) this.persistence.handleEvents(room, events);
    for (const e of events) {
      if (e.type === 'player_left') {
        this.evict(e.playerId, e.reason === 'kicked' ? 'kicked' : e.reason === 'timeout' ? 'timeout' : 'left');
      }
    }
    if (room.closed) {
      this.dispose(room);
      return;
    }
    for (const e of events) {
      if (e.type !== 'notice') continue;
      for (const p of room.state.players) {
        if (p.id !== e.exclude) this.io.to(playerChannel(p.id)).emit('notice', { text: e.text, kind: e.kind });
      }
    }
    this.broadcast(room);
    this.persistence.scheduleSnapshot(room);
    this.schedule(room);
  }

  private broadcast(room: GameRoom): void {
    const now = this.now();
    for (const p of room.state.players) {
      if (this.presence.has(p.id)) this.io.to(playerChannel(p.id)).emit('room:state', room.viewFor(p.id, now));
    }
  }

  /** Detaches every socket of a removed player and tells them why. */
  private evict(playerId: string, reason: RemovedReason): void {
    const sockets = this.io.sockets.adapter.rooms.get(playerChannel(playerId));
    for (const sid of sockets ? [...sockets] : []) {
      const s = this.io.sockets.sockets.get(sid);
      if (!s) continue;
      s.emit('room:removed', { reason });
      void s.leave(playerChannel(playerId));
      s.data.code = undefined;
      s.data.playerId = undefined;
    }
    this.presence.delete(playerId);
  }

  private dispose(room: GameRoom): void {
    const t = this.timers.get(room.code);
    if (t) clearTimeout(t);
    this.timers.delete(room.code);
    for (const p of room.state.players) this.evict(p.id, 'closed');
    if (this.rooms.get(room.code) === room) this.rooms.delete(room.code);
  }

  private schedule(room: GameRoom): void {
    const prev = this.timers.get(room.code);
    if (prev) clearTimeout(prev);
    const wake = room.nextWakeAt();
    if (wake === null) {
      this.timers.delete(room.code);
      return;
    }
    const delay = Math.min(Math.max(0, wake - this.now()) + 15, 2_000_000_000);
    const timer = setTimeout(() => {
      this.timers.delete(room.code);
      if (room.tick(this.now())) this.commit(room);
      else this.schedule(room);
    }, delay);
    timer.unref?.();
    this.timers.set(room.code, timer);
  }

  /** Delivers new chat messages without re-sending the whole room state. */
  commitChat(room: GameRoom): void {
    for (const e of room.drainEvents()) {
      if (e.type !== 'chat') continue;
      for (const p of room.state.players) this.io.to(playerChannel(p.id)).emit('chat:message', e.message);
    }
    this.persistence.scheduleSnapshot(room);
  }

  sendChatHistory(socket: GameSocket, room: GameRoom): void {
    socket.emit('chat:history', { code: room.code, messages: room.chatHistory() });
  }

  /** Saves every room immediately (graceful shutdown). */
  snapshotAll(): void {
    for (const room of this.rooms.values()) this.persistence.snapshotNow(room);
  }

  stopTimers(): void {
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
  }
}
