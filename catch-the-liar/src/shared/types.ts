// Shared protocol types between the realtime server and the web client.
// Anything the server sends to a player is shaped by `RoomView`; the server builds a
// separate view per player so secrets (the word, the liar) only reach those allowed.

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 10;
export const ROOM_CODE_LENGTH = 6;
export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 16;
export const HINT_MAX = 40;
export const GUESS_OPTIONS = 8;
export const GUESS_OPTIONS_HARD = 12;
export const CHAT_MAX = 200;
export const CHAT_HISTORY = 50;

export type Phase = 'lobby' | 'reveal' | 'hints' | 'voting' | 'guess' | 'results';

export type HintRounds = 1 | 2 | 3;

/**
 * normal: the liar knows they are the liar (category per setting).
 * hard:   the liar never sees the category, hints are one word, 12 guess options.
 * expert: the liar gets a different word from the same category and doesn't know
 *         they are the liar; one-word hints, 12 guess options.
 */
export type Difficulty = 'normal' | 'hard' | 'expert';

export interface RoomSettings {
  /** Selected word packs; empty means "all free packs". */
  packIds: string[];
  hintRounds: HintRounds;
  hintSeconds: number;
  voteSeconds: number;
  liarSeesCategory: boolean;
  difficulty: Difficulty;
}

export const SETTINGS_LIMITS = {
  hintSeconds: [20, 30, 45, 60, 90],
  voteSeconds: [30, 45, 60, 90, 120],
  hintRounds: [1, 2, 3] as HintRounds[],
  difficulty: ['normal', 'hard', 'expert'] as Difficulty[],
} as const;

export const DEFAULT_SETTINGS: RoomSettings = {
  packIds: [],
  hintRounds: 2,
  hintSeconds: 45,
  voteSeconds: 60,
  liarSeesCategory: true,
  difficulty: 'hard',
};

export type PackTier = 'free' | 'plus';
export type PackKind = 'standard' | 'occasion' | 'exclusive';

export interface PackInfo {
  id: string;
  name: string;
  emoji: string;
  description: string;
  wordCount: number;
  tier: PackTier;
  kind: PackKind;
  /** False when the room has no entitlement for this pack (future Plus packs). */
  available: boolean;
}

export interface CategoryView {
  id: string;
  name: string;
  emoji: string;
}

export interface PlayerView {
  id: string;
  nickname: string;
  score: number;
  connected: boolean;
  isHost: boolean;
  /** Takes part in the current round (false for spectators who joined mid-round). */
  inRound: boolean;
  ready: boolean;
  hasVoted: boolean;
  avatar: number;
}

export interface HintView {
  playerId: string;
  nickname: string;
  text: string | null;
  hintRound: number;
}

export type SecretView =
  | { role: 'spectator' }
  | { role: 'civilian'; word: string; category: CategoryView }
  | { role: 'liar'; category: CategoryView | null };

export interface TurnView {
  /** Unique participants in speaking order. */
  order: string[];
  currentPlayerId: string | null;
  hintRound: number;
  hintRounds: number;
  turnNumber: number;
  totalTurns: number;
}

export type RoundEndReason = 'normal' | 'liar_left' | 'not_enough_players';

export interface RoundResultView {
  roundNumber: number;
  liarId: string;
  liarName: string;
  word: string;
  /** Expert mode: the different word the liar was given. */
  decoyWord: string | null;
  difficulty: Difficulty;
  category: CategoryView;
  caught: boolean;
  votes: { voterId: string; voterName: string; targetId: string; targetName: string }[];
  tally: { playerId: string; nickname: string; votes: number }[];
  guess: { word: string | null; correct: boolean } | null;
  points: { playerId: string; nickname: string; delta: number; reasons: PointReason[] }[];
  reason: RoundEndReason;
}

export type PointReason = 'correct_vote' | 'liar_escaped' | 'liar_guessed';

export const POINTS: Record<PointReason, number> = {
  correct_vote: 1,
  liar_escaped: 3,
  liar_guessed: 2,
};

export interface RoomView {
  rev: number;
  code: string;
  phase: Phase;
  roundNumber: number;
  hostId: string;
  meId: string;
  players: PlayerView[];
  settings: RoomSettings;
  packs: PackInfo[];
  phaseEndsAt: number | null;
  serverNow: number;
  secret: SecretView | null;
  turn: TurnView | null;
  hints: HintView[];
  myVote: string | null;
  guess: { liarId: string; options: string[] | null; liarName: string } | null;
  result: RoundResultView | null;
  /** Host locked the room: no new players can join (existing ones can still reconnect). */
  locked: boolean;
  features: RoomFeatures;
}

/** Monetization-ready flags resolved on the server. Everything is off/free for now. */
export interface RoomFeatures {
  tier: 'free' | 'plus';
  adsEnabled: boolean;
}

export interface ChatMessageView {
  id: string;
  playerId: string;
  nickname: string;
  avatar: number;
  text: string;
  at: number;
}

export interface SessionInfo {
  code: string;
  playerId: string;
  token: string;
}

export type AckResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };
export type Ack<T = object> = (res: AckResult<T>) => void;

export interface ClientToServerEvents {
  'room:create': (p: { nickname: string }, ack: Ack<SessionInfo>) => void;
  'room:join': (p: { code: string; nickname: string }, ack: Ack<SessionInfo>) => void;
  'room:resume': (p: { code: string; playerId: string; token: string }, ack: Ack) => void;
  'room:leave': (p: Record<string, never>, ack: Ack) => void;
  /** Stop receiving updates for the room without leaving it (e.g. went back to home). */
  'room:detach': (p: Record<string, never>, ack: Ack) => void;
  'room:kick': (p: { playerId: string }, ack: Ack) => void;
  'room:lock': (p: { locked: boolean }, ack: Ack) => void;
  'room:settings': (p: Partial<RoomSettings>, ack: Ack) => void;
  'room:lobby': (p: Record<string, never>, ack: Ack) => void;
  'scores:reset': (p: Record<string, never>, ack: Ack) => void;
  'round:start': (p: Record<string, never>, ack: Ack) => void;
  'round:ready': (p: Record<string, never>, ack: Ack) => void;
  'hint:submit': (p: { text: string }, ack: Ack) => void;
  'turn:skip': (p: Record<string, never>, ack: Ack) => void;
  'vote:cast': (p: { targetId: string }, ack: Ack) => void;
  'guess:submit': (p: { word: string }, ack: Ack) => void;
  'chat:send': (p: { text: string }, ack: Ack) => void;
}

export type RemovedReason = 'kicked' | 'closed' | 'left' | 'timeout';

export interface ServerToClientEvents {
  'room:state': (view: RoomView) => void;
  'room:removed': (p: { reason: RemovedReason }) => void;
  notice: (p: { text: string; kind: 'info' | 'warn' }) => void;
  'chat:message': (m: ChatMessageView) => void;
  /** Recent messages, sent when a player enters or returns to a room. */
  'chat:history': (p: { code: string; messages: ChatMessageView[] }) => void;
}

export interface RoomPreview {
  exists: boolean;
  code?: string;
  players?: number;
  phase?: Phase;
  full?: boolean;
  locked?: boolean;
  hostName?: string;
}

export interface PublicConfig {
  packs: PackInfo[];
  minPlayers: number;
  maxPlayers: number;
  adsEnabled: boolean;
}
