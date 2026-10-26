import type { GameRepository } from '../db/repository';
import type { GameRoom } from '../game/room';
import type { RoomEvent } from '../game/types';

const SNAPSHOT_DEBOUNCE_MS = 400;

/**
 * Writes game activity to the database without blocking the realtime loop. Writes for a
 * room run strictly in order (a per-room promise chain); failures are logged, never thrown
 * into the game.
 */
export class Persistence {
  private chains = new Map<string, Promise<void>>();
  private snapshotTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly repo: GameRepository,
    private readonly log: (msg: string, err?: unknown) => void = (m, e) => console.error(m, e),
  ) {}

  private enqueue(roomId: string, label: string, fn: () => Promise<void>): void {
    const prev = this.chains.get(roomId) ?? Promise.resolve();
    const next = prev.then(fn).catch((err) => this.log(`[db] ${label} failed for room ${roomId}`, err));
    this.chains.set(roomId, next);
    void next.finally(() => {
      if (this.chains.get(roomId) === next) this.chains.delete(roomId);
    });
  }

  roomCreated(room: GameRoom): void {
    const snapshot = structuredClone(room.state);
    this.enqueue(room.id, 'insertRoom', () => this.repo.insertRoom(snapshot));
  }

  handleEvents(room: GameRoom, events: RoomEvent[]): void {
    const id = room.id;
    for (const e of events) {
      switch (e.type) {
        case 'player_joined': {
          const p = { ...e.player };
          this.enqueue(id, 'insertPlayer', () => this.repo.insertPlayer(id, p));
          break;
        }
        case 'player_left':
          this.enqueue(id, 'markPlayerLeft', () => this.repo.markPlayerLeft(e.playerId, e.reason));
          break;
        case 'settings_changed': {
          const state = structuredClone(room.state);
          this.enqueue(id, 'updateRoomSettings', () => this.repo.updateRoomSettings(state));
          break;
        }
        case 'round_started': {
          const r = structuredClone(e.round);
          this.enqueue(id, 'insertRound', () => this.repo.insertRound(id, r));
          break;
        }
        case 'hint_added': {
          const h = { ...e.hint };
          this.enqueue(id, 'insertHint', () => this.repo.insertHint(e.roundId, h));
          break;
        }
        case 'round_ended': {
          const r = structuredClone(e.round);
          this.enqueue(id, 'finishRound', () => this.repo.finishRound(r, e.reason));
          break;
        }
        case 'scores_changed': {
          const players = room.state.players.map((p) => ({ ...p }));
          this.enqueue(id, 'updateScores', () => this.repo.updateScores(players));
          break;
        }
        case 'room_closed':
          this.cancelSnapshot(id);
          this.enqueue(id, 'closeRoom', () => this.repo.closeRoom(id));
          break;
        default:
          break;
      }
    }
  }

  /** Debounced save of the full room state, used to recover rooms after a restart. */
  scheduleSnapshot(room: GameRoom): void {
    if (room.closed || this.snapshotTimers.has(room.id)) return;
    const timer = setTimeout(() => {
      this.snapshotTimers.delete(room.id);
      this.snapshotNow(room);
    }, SNAPSHOT_DEBOUNCE_MS);
    timer.unref?.();
    this.snapshotTimers.set(room.id, timer);
  }

  snapshotNow(room: GameRoom): void {
    this.cancelSnapshot(room.id);
    if (room.closed) return;
    const json = JSON.stringify(room.state);
    this.enqueue(room.id, 'saveSnapshot', () => this.repo.saveSnapshot(room.id, json));
  }

  private cancelSnapshot(roomId: string): void {
    const t = this.snapshotTimers.get(roomId);
    if (t) clearTimeout(t);
    this.snapshotTimers.delete(roomId);
  }

  /** Waits for all queued writes (used on shutdown and in tests). */
  async flush(): Promise<void> {
    while (this.chains.size > 0) {
      await Promise.all([...this.chains.values()]);
    }
  }
}
