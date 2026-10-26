import { io, type Socket } from 'socket.io-client';
import { useSyncExternalStore } from 'react';
import type {
  AckResult,
  ClientToServerEvents,
  RemovedReason,
  RoomView,
  ServerToClientEvents,
  SessionInfo,
} from '../../shared/types';
import { clearSession, markActive, saveNickname, saveSession, touchSession } from './session';
import { toast } from './toasts';

export interface GameState {
  connected: boolean;
  /** True once the first connection attempt finished (success or failure). */
  ready: boolean;
  session: SessionInfo | null;
  view: RoomView | null;
  clockOffset: number;
  removed: { code: string; reason: RemovedReason } | null;
  resuming: boolean;
}

type Listener = () => void;

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnectionDelay: 400,
  reconnectionDelayMax: 3000,
});

let state: GameState = {
  connected: false,
  ready: false,
  session: null,
  view: null,
  clockOffset: 0,
  removed: null,
  resuming: false,
};
const listeners = new Set<Listener>();

function set(patch: Partial<GameState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function useGame(): GameState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}

export function getGame(): GameState {
  return state;
}

socket.on('connect', () => {
  set({ connected: true, ready: true });
  if (state.session) void resume(state.session);
});
socket.on('disconnect', () => set({ connected: false }));
socket.on('connect_error', () => set({ ready: true }));
// A state update can arrive just before the ack that tells us which room we're in.
let lastUnclaimedView: RoomView | null = null;
socket.on('room:state', (view) => {
  if (!state.session || view.code !== state.session.code) {
    lastUnclaimedView = view;
    return;
  }
  set({ view, clockOffset: view.serverNow - Date.now() });
});
socket.on('notice', (n) => toast(n.text, n.kind));
socket.on('room:removed', ({ reason }) => {
  const code = state.session?.code ?? state.view?.code ?? '';
  if (code) clearSession(code);
  set({ session: null, view: null, removed: { code, reason } });
});

export function ensureConnected(): void {
  if (!socket.connected && !socket.active) socket.connect();
  else if (!socket.connected) socket.connect();
}

function emit<T = object>(event: keyof ClientToServerEvents, payload: object = {}): Promise<AckResult<T>> {
  ensureConnected();
  return new Promise((resolve) => {
    (socket.timeout(10_000).emit as (...args: unknown[]) => void)(event, payload, (err: unknown, res: AckResult<T>) => {
      if (err) resolve({ ok: false, error: 'الاتصال بطيء، حاول مرة ثانية' });
      else resolve(res);
    });
  });
}

async function resume(session: SessionInfo): Promise<AckResult> {
  set({ resuming: true });
  const res = await emit('room:resume', { code: session.code, playerId: session.playerId, token: session.token });
  if (!res.ok && state.session?.code === session.code) {
    // The server no longer knows this player (removed, room closed…): start fresh.
    clearSession(session.code);
    set({ session: null, view: null, resuming: false });
    return res;
  }
  if (res.ok) touchSession(session.code);
  set({ resuming: false });
  return res;
}

export const game = {
  async create(nickname: string): Promise<AckResult<SessionInfo>> {
    const res = await emit<SessionInfo>('room:create', { nickname });
    if (res.ok) adopt(res, nickname);
    return res;
  },

  async join(code: string, nickname: string): Promise<AckResult<SessionInfo>> {
    const res = await emit<SessionInfo>('room:join', { code, nickname });
    if (res.ok) adopt(res, nickname);
    return res;
  },

  /** Re-attach to a room with a stored session. */
  async resume(session: SessionInfo): Promise<AckResult> {
    set({ session, view: state.view?.code === session.code ? state.view : null, removed: null });
    markActive(session.code);
    if (!socket.connected) {
      ensureConnected();
      return { ok: true }; // 'connect' handler resumes
    }
    return resume(session);
  },

  async leave(): Promise<void> {
    const code = state.session?.code;
    if (code) {
      await emit('room:leave');
      clearSession(code);
    }
    set({ session: null, view: null, removed: null });
  },

  /** Forget the current room locally (e.g. navigating home) without leaving it. */
  detachLocal(): void {
    if (state.session && socket.connected) void emit('room:detach');
    set({ session: null, view: null, removed: null });
  },

  clearRemoved(): void {
    set({ removed: null });
  },

  send(event: keyof ClientToServerEvents, payload: object = {}): Promise<AckResult> {
    return emit(event, payload);
  },
};

function adopt(s: SessionInfo, nickname: string): void {
  saveNickname(nickname);
  saveSession(s, nickname);
  const early = lastUnclaimedView?.code === s.code && lastUnclaimedView.meId === s.playerId ? lastUnclaimedView : null;
  lastUnclaimedView = null;
  set({
    session: { code: s.code, playerId: s.playerId, token: s.token },
    removed: null,
    ...(early ? { view: early, clockOffset: early.serverNow - Date.now() } : { view: null }),
  });
}

/** Server time estimate, used for countdowns. */
export function serverNow(): number {
  return Date.now() + state.clockOffset;
}
