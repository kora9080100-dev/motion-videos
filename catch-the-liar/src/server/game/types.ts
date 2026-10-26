import type { CategoryView, PackInfo, Phase, RoomSettings, RoundEndReason, RoundResultView } from '../../shared/types';

/** Full server-side state of a room. Never sent to clients as-is (see GameRoom.viewFor). */
export interface RoomState {
  version: 1;
  id: string;
  code: string;
  createdAt: number;
  hostId: string;
  players: PlayerState[];
  bannedTokenHashes: string[];
  settings: RoomSettings;
  phase: Phase;
  phaseEndsAt: number | null;
  /** When the current phase (or hint turn) started; used for offline grace periods. */
  phaseStartedAt: number;
  roundCounter: number;
  round: RoundState | null;
  usedWordIds: string[];
  lastLiarId: string | null;
  /** Last time at least one player was connected. */
  lastActiveAt: number;
  closed: boolean;
  rev: number;
}

export interface PlayerState {
  id: string;
  nickname: string;
  tokenHash: string;
  score: number;
  joinedAt: number;
  connected: boolean;
  disconnectedAt: number | null;
  avatar: number;
}

export interface TurnSlot {
  playerId: string;
  hintRound: number;
}

export interface HintState {
  playerId: string;
  nickname: string;
  text: string | null;
  hintRound: number;
  at: number;
}

export interface RoundState {
  id: string;
  number: number;
  packId: string;
  category: CategoryView;
  wordId: string;
  word: string;
  liarId: string;
  liarName: string;
  participants: string[];
  ready: string[];
  speakingOrder: string[];
  hintRounds: number;
  turnQueue: TurnSlot[];
  turnIndex: number;
  hints: HintState[];
  votes: Record<string, string>;
  caught: boolean | null;
  guessOptions: string[];
  guess: string | null;
  guessCorrect: boolean | null;
  startedAt: number;
  endedAt: number | null;
  result: RoundResultView | null;
}

export interface WordPick {
  packId: string;
  category: CategoryView;
  wordId: string;
  word: string;
}

/** Word content source (backed by the database catalog in production). */
export interface Catalog {
  packs(): PackInfo[];
  pickWord(packIds: string[], excludeWordIds: ReadonlySet<string>, rng: Rng): WordPick | null;
  guessOptions(packId: string, word: string, count: number, rng: Rng): string[];
}

export type Rng = () => number;

export type LeaveReason = 'left' | 'kicked' | 'timeout';

/** Domain events emitted by the engine; the server turns them into DB writes and notices. */
export type RoomEvent =
  | { type: 'player_joined'; player: PlayerState }
  | { type: 'player_left'; playerId: string; nickname: string; reason: LeaveReason }
  | { type: 'host_changed'; hostId: string }
  | { type: 'settings_changed' }
  | { type: 'round_started'; round: RoundState }
  | { type: 'hint_added'; roundId: string; hint: HintState }
  | { type: 'round_ended'; round: RoundState; reason: RoundEndReason }
  | { type: 'scores_changed' }
  | { type: 'notice'; text: string; kind: 'info' | 'warn'; exclude?: string }
  | { type: 'room_closed' };

export type OpResult = { ok: true } | { ok: false; error: string };
