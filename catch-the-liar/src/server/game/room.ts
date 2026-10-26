import {
  CHAT_HISTORY,
  CHAT_MAX,
  DEFAULT_SETTINGS,
  GUESS_OPTIONS,
  HINT_MAX,
  MAX_PLAYERS,
  MIN_PLAYERS,
  POINTS,
  SETTINGS_LIMITS,
  type ChatMessageView,
  type HintRounds,
  type Phase,
  type PointReason,
  type RoomFeatures,
  type RoomSettings,
  type RoomView,
  type RoundEndReason,
  type RoundResultView,
  type SecretView,
} from '../../shared/types';
import { cleanText, hintRevealsWord, mentionsWord, validateNickname } from '../../shared/text';
import { isOffensive } from '../moderation';
import {
  AVATAR_COUNT,
  GUESS_MS,
  HOST_GRACE_MS,
  OFFLINE_GUESS_GRACE_MS,
  OFFLINE_REMOVE_MS,
  OFFLINE_TURN_GRACE_MS,
  REVEAL_MS,
  ROOM_IDLE_CLOSE_MS,
} from './constants';
import type {
  Catalog,
  HintState,
  LeaveReason,
  OpResult,
  PlayerState,
  Rng,
  RoomEvent,
  RoomState,
  RoundState,
  TurnSlot,
} from './types';

export interface RoomDeps {
  catalog: Catalog;
  rng: Rng;
  newId: () => string;
  features?: (state: RoomState) => RoomFeatures;
}

const ACTIVE_PHASES: readonly Phase[] = ['reveal', 'hints', 'voting', 'guess'];
const LINK_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|me|sa|ly|gg|xyz|app|link|ru|tk|info|co)\b)/i;
/** Chat flood guard: at most this many messages per player within the window. */
const CHAT_BURST = 4;
const CHAT_WINDOW_MS = 6_000;
const OK: OpResult = { ok: true };
const fail = (error: string): OpResult => ({ ok: false, error });

const ERR = {
  closed: 'الغرفة انتهت',
  notHost: 'هذي الحركة للمضيف بس',
  wrongPhase: 'ما تقدر تسوي هذا الحين',
  notInRound: 'أنت تتفرج على هذي الجولة',
} as const;

/**
 * Authoritative game engine for one room. All randomness and time come from the caller,
 * so the engine is deterministic and fully testable. Mutating methods validate the move,
 * update state, bump `rev` and queue domain events (see drainEvents).
 */
export class GameRoom {
  private events: RoomEvent[] = [];

  constructor(
    public readonly state: RoomState,
    private readonly deps: RoomDeps,
  ) {}

  static create(opts: { id: string; code: string; now: number }, deps: RoomDeps): GameRoom {
    return new GameRoom(
      {
        version: 1,
        id: opts.id,
        code: opts.code,
        createdAt: opts.now,
        hostId: '',
        players: [],
        bannedTokenHashes: [],
        locked: false,
        settings: { ...DEFAULT_SETTINGS },
        phase: 'lobby',
        phaseEndsAt: null,
        phaseStartedAt: opts.now,
        roundCounter: 0,
        round: null,
        usedWordIds: [],
        lastLiarId: null,
        lastActiveAt: opts.now,
        closed: false,
        rev: 0,
      },
      deps,
    );
  }

  /** Rebuilds a room from a persisted snapshot after a server restart. */
  static restore(state: RoomState, deps: RoomDeps, now: number): GameRoom {
    const room = new GameRoom(state, deps);
    for (const p of state.players) {
      p.connected = false;
      p.disconnectedAt = now;
    }
    state.lastActiveAt = now;
    // Give everyone a moment to reconnect before timers fire.
    if (state.phaseEndsAt !== null) state.phaseEndsAt = Math.max(state.phaseEndsAt, now + 20_000);
    state.phaseStartedAt = now;
    return room;
  }

  get id(): string {
    return this.state.id;
  }
  get code(): string {
    return this.state.code;
  }
  get closed(): boolean {
    return this.state.closed;
  }

  drainEvents(): RoomEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  getPlayer(id: string): PlayerState | undefined {
    return this.state.players.find((p) => p.id === id);
  }

  isBanned(tokenHash: string): boolean {
    return this.state.bannedTokenHashes.includes(tokenHash);
  }

  isActivePhase(): boolean {
    return ACTIVE_PHASES.includes(this.state.phase);
  }

  // ---------------------------------------------------------------- membership

  addPlayer(input: { id: string; nickname: string; tokenHash: string; now: number }): OpResult {
    const s = this.state;
    if (s.closed) return fail(ERR.closed);
    if (s.locked) return fail('الغرفة مقفلة 🔒 اطلب من المضيف يفتحها');
    if (s.players.length >= MAX_PLAYERS) return fail(`الغرفة مليانة، الحد الأقصى ${MAX_PLAYERS} لاعبين`);
    const name = validateNickname(input.nickname);
    if (!name.ok) return name;
    if (isOffensive(name.value)) return fail('الاسم فيه كلمة غير لائقة، اختر اسم ثاني 🙏');
    const key = nameKey(name.value);
    if (s.players.some((p) => nameKey(p.nickname) === key)) return fail('هذا الاسم مستخدم في الغرفة، اختر اسم ثاني');

    const used = new Set(s.players.map((p) => p.avatar));
    let avatar = 0;
    while (used.has(avatar) && avatar < AVATAR_COUNT - 1) avatar++;

    const player: PlayerState = {
      id: input.id,
      nickname: name.value,
      tokenHash: input.tokenHash,
      score: 0,
      joinedAt: input.now,
      connected: false,
      disconnectedAt: input.now,
      avatar,
    };
    s.players.push(player);
    if (!s.hostId) s.hostId = player.id;
    this.emit({ type: 'player_joined', player });
    if (s.players.length > 1) this.emit({ type: 'notice', text: `انضم ${player.nickname} 👋`, kind: 'info', exclude: player.id });
    this.touch();
    return OK;
  }

  setConnected(playerId: string, connected: boolean, now: number): void {
    const p = this.getPlayer(playerId);
    if (!p || p.connected === connected) return;
    p.connected = connected;
    p.disconnectedAt = connected ? null : now;
    if (connected) this.state.lastActiveAt = now;
    this.touch();
    this.checkProgress(now);
  }

  leave(playerId: string, now: number): OpResult {
    return this.removePlayer(playerId, 'left', now);
  }

  kick(byId: string, targetId: string, now: number): OpResult {
    if (!this.isHost(byId)) return fail(ERR.notHost);
    if (byId === targetId) return fail('ما تقدر تطلع نفسك، استخدم زر الخروج');
    if (!this.getPlayer(targetId)) return fail('اللاعب مو موجود');
    return this.removePlayer(targetId, 'kicked', now);
  }

  private removePlayer(playerId: string, reason: LeaveReason, now: number): OpResult {
    const s = this.state;
    const idx = s.players.findIndex((p) => p.id === playerId);
    if (idx < 0) return fail('اللاعب مو موجود');
    const [p] = s.players.splice(idx, 1) as [PlayerState];
    if (reason === 'kicked') s.bannedTokenHashes.push(p.tokenHash);
    this.emit({ type: 'player_left', playerId: p.id, nickname: p.nickname, reason });
    const verb = reason === 'kicked' ? 'تم إخراج' : 'طلع';
    this.emit({ type: 'notice', text: `${verb} ${p.nickname}`, kind: 'warn' });
    this.touch();

    if (s.players.length === 0) {
      this.close();
      return OK;
    }
    if (s.hostId === p.id) this.transferHost();

    const r = s.round;
    if (r && this.isActivePhase() && r.participants.includes(p.id)) {
      if (r.liarId === p.id) {
        this.endRound(now, 'liar_left');
        return OK;
      }
      r.participants = r.participants.filter((id) => id !== p.id);
      r.ready = r.ready.filter((id) => id !== p.id);
      r.speakingOrder = r.speakingOrder.filter((id) => id !== p.id);
      delete r.votes[p.id];
      for (const [voter, target] of Object.entries(r.votes)) {
        if (target === p.id) delete r.votes[voter];
      }
      if (s.phase !== 'guess' && r.participants.length < MIN_PLAYERS) {
        this.endRound(now, 'not_enough_players');
        return OK;
      }
      if (s.phase === 'hints') {
        const wasCurrent = r.turnQueue[r.turnIndex]?.playerId === p.id;
        r.turnQueue = r.turnQueue.filter((slot, i) => i < r.turnIndex || slot.playerId !== p.id);
        if (wasCurrent) this.beginTurn(now);
      }
      this.checkProgress(now);
    }
    return OK;
  }

  private transferHost(): void {
    const s = this.state;
    const next = s.players.find((p) => p.connected && p.id !== s.hostId) ?? s.players.find((p) => p.id !== s.hostId);
    if (!next) return;
    s.hostId = next.id;
    this.emit({ type: 'host_changed', hostId: next.id });
    this.emit({ type: 'notice', text: `${next.nickname} صار المضيف 👑`, kind: 'info' });
    this.touch();
  }

  private close(): void {
    if (this.state.closed) return;
    this.state.closed = true;
    this.state.phaseEndsAt = null;
    this.emit({ type: 'room_closed' });
    this.touch();
  }

  // ---------------------------------------------------------------- chat

  /** Posts a chat message. Does not change game state, so it does not bump `rev`. */
  postChat(byId: string, text: unknown, now: number): OpResult {
    const s = this.state;
    const p = this.getPlayer(byId);
    if (s.closed || !p) return fail(ERR.closed);
    const clean = cleanText(text, CHAT_MAX);
    if (!clean) return fail('اكتب رسالة أول');
    if (LINK_RE.test(clean)) return fail('ممنوع الروابط في الدردشة 🔗');
    if (isOffensive(clean)) return fail('الرسالة فيها كلمة غير لائقة 🙏');
    const r = s.round;
    // Civilians must not leak the word. The liar is never checked, so a rejection can't
    // tell them they guessed right.
    if (r && this.isActivePhase() && r.participants.includes(byId) && byId !== r.liarId && mentionsWord(clean, r.word)) {
      return fail('لا تكتب الكلمة السرية في الدردشة 😅');
    }
    const chat = (s.chat ??= []);
    if (chat.filter((m) => m.playerId === byId && now - m.at < CHAT_WINDOW_MS).length >= CHAT_BURST) {
      return fail('شوي شوي على الدردشة 😅');
    }
    const message: ChatMessageView = {
      id: this.deps.newId(),
      playerId: byId,
      nickname: p.nickname,
      avatar: p.avatar,
      text: clean,
      at: now,
    };
    chat.push(message);
    if (chat.length > CHAT_HISTORY) chat.splice(0, chat.length - CHAT_HISTORY);
    this.emit({ type: 'chat', message });
    return OK;
  }

  chatHistory(): ChatMessageView[] {
    return this.state.chat ?? [];
  }

  // ---------------------------------------------------------------- host controls

  setLocked(byId: string, locked: boolean): OpResult {
    const s = this.state;
    if (!this.isHost(byId)) return fail(ERR.notHost);
    if (!!s.locked === locked) return OK;
    s.locked = locked;
    this.emit({
      type: 'notice',
      text: locked ? '🔒 المضيف قفل الغرفة، ما أحد جديد يقدر يدخل' : '🔓 المضيف فتح الغرفة',
      kind: 'info',
    });
    this.touch();
    return OK;
  }

  updateSettings(byId: string, patch: Partial<RoomSettings>): OpResult {
    const s = this.state;
    if (!this.isHost(byId)) return fail(ERR.notHost);
    if (s.phase !== 'lobby' && s.phase !== 'results') return fail('تقدر تغيّر الإعدادات بين الجولات بس');
    const next: RoomSettings = { ...s.settings };
    if (patch.packIds !== undefined) {
      const available = new Set(
        this.deps.catalog
          .packs()
          .filter((p) => p.available)
          .map((p) => p.id),
      );
      next.packIds = [...new Set(patch.packIds)].filter((id) => available.has(id));
    }
    if (patch.hintRounds !== undefined && (SETTINGS_LIMITS.hintRounds as readonly number[]).includes(patch.hintRounds)) {
      next.hintRounds = patch.hintRounds as HintRounds;
    }
    if (patch.hintSeconds !== undefined && (SETTINGS_LIMITS.hintSeconds as readonly number[]).includes(patch.hintSeconds)) {
      next.hintSeconds = patch.hintSeconds;
    }
    if (patch.voteSeconds !== undefined && (SETTINGS_LIMITS.voteSeconds as readonly number[]).includes(patch.voteSeconds)) {
      next.voteSeconds = patch.voteSeconds;
    }
    if (typeof patch.liarSeesCategory === 'boolean') next.liarSeesCategory = patch.liarSeesCategory;
    s.settings = next;
    this.emit({ type: 'settings_changed' });
    this.touch();
    return OK;
  }

  resetScores(byId: string): OpResult {
    const s = this.state;
    if (!this.isHost(byId)) return fail(ERR.notHost);
    if (s.phase !== 'lobby' && s.phase !== 'results') return fail(ERR.wrongPhase);
    for (const p of s.players) p.score = 0;
    this.emit({ type: 'scores_changed' });
    this.emit({ type: 'notice', text: 'تم تصفير النقاط', kind: 'info' });
    this.touch();
    return OK;
  }

  toLobby(byId: string, now: number): OpResult {
    const s = this.state;
    if (!this.isHost(byId)) return fail(ERR.notHost);
    if (s.phase !== 'results') return fail(ERR.wrongPhase);
    s.phase = 'lobby';
    s.round = null;
    this.setDeadline(null, now);
    this.touch();
    return OK;
  }

  // ---------------------------------------------------------------- round flow

  startRound(byId: string, now: number): OpResult {
    const s = this.state;
    if (s.closed) return fail(ERR.closed);
    if (!this.isHost(byId)) return fail(ERR.notHost);
    if (s.phase !== 'lobby' && s.phase !== 'results') return fail('فيه جولة شغالة الحين');
    const online = s.players.filter((p) => p.connected);
    if (online.length < MIN_PLAYERS) {
      return fail(`تحتاجون ${MIN_PLAYERS} لاعبين متصلين على الأقل (متصل الحين ${online.length})`);
    }

    const { catalog, rng } = this.deps;
    const packIds = s.settings.packIds.length
      ? s.settings.packIds
      : catalog
          .packs()
          .filter((p) => p.available)
          .map((p) => p.id);
    let pick = catalog.pickWord(packIds, new Set(s.usedWordIds), rng);
    if (!pick) {
      // Every word in the selection was used: start the cycle again.
      s.usedWordIds = [];
      pick = catalog.pickWord(packIds, new Set(), rng);
    }
    if (!pick) return fail('ما فيه كلمات في التصنيفات المختارة');

    const participants = online.map((p) => p.id);
    const liarId = weightedPick(participants, (id) => (id === s.lastLiarId ? 0.4 : 1), rng);
    let order = shuffle(participants, rng);
    // Make it unlikely (not impossible, so it gives nothing away) that the liar speaks first.
    if (order[0] === liarId) order = shuffle(participants, rng);
    const turnQueue: TurnSlot[] = [];
    for (let r = 1; r <= s.settings.hintRounds; r++) {
      for (const id of order) turnQueue.push({ playerId: id, hintRound: r });
    }

    s.roundCounter += 1;
    const round: RoundState = {
      id: this.deps.newId(),
      number: s.roundCounter,
      packId: pick.packId,
      category: pick.category,
      wordId: pick.wordId,
      word: pick.word,
      liarId,
      liarName: this.getPlayer(liarId)?.nickname ?? '',
      participants,
      ready: [],
      speakingOrder: order,
      hintRounds: s.settings.hintRounds,
      turnQueue,
      turnIndex: 0,
      hints: [],
      votes: {},
      caught: null,
      guessOptions: [],
      guess: null,
      guessCorrect: null,
      startedAt: now,
      endedAt: null,
      result: null,
    };
    s.round = round;
    s.lastLiarId = liarId;
    s.phase = 'reveal';
    this.setDeadline(now + REVEAL_MS, now);
    this.emit({ type: 'round_started', round });
    this.touch();
    return OK;
  }

  markReady(byId: string, now: number): OpResult {
    const r = this.state.round;
    if (this.state.phase !== 'reveal' || !r) return fail(ERR.wrongPhase);
    if (!r.participants.includes(byId)) return fail(ERR.notInRound);
    if (!r.ready.includes(byId)) {
      r.ready.push(byId);
      this.touch();
      this.checkProgress(now);
    }
    return OK;
  }

  submitHint(byId: string, text: unknown, now: number): OpResult {
    const r = this.state.round;
    if (this.state.phase !== 'hints' || !r) return fail('مو وقت التلميحات');
    const slot = r.turnQueue[r.turnIndex];
    if (!slot || slot.playerId !== byId) return fail('مو دورك الحين');
    const clean = cleanText(text, HINT_MAX);
    if (!clean) return fail('اكتب تلميح أول');
    if (isOffensive(clean)) return fail('التلميح فيه كلمة غير لائقة 🙏 جرّب غيره');
    if (byId !== r.liarId && hintRevealsWord(clean, r.word)) {
      return fail('لا تكتب الكلمة نفسها 😅 جرّب تلميح ثاني');
    }
    this.recordHint(slot, clean, now);
    return OK;
  }

  skipTurn(byId: string, now: number): OpResult {
    const r = this.state.round;
    if (this.state.phase !== 'hints' || !r) return fail(ERR.wrongPhase);
    const slot = r.turnQueue[r.turnIndex];
    if (!slot) return fail(ERR.wrongPhase);
    if (slot.playerId !== byId && !this.isHost(byId)) return fail('تخطي الدور للمضيف أو لصاحب الدور');
    this.recordHint(slot, null, now);
    return OK;
  }

  castVote(byId: string, targetId: string, now: number): OpResult {
    const r = this.state.round;
    if (this.state.phase !== 'voting' || !r) return fail('مو وقت التصويت');
    if (!r.participants.includes(byId)) return fail(ERR.notInRound);
    if (byId === targetId) return fail('ما تقدر تصوّت لنفسك');
    if (!r.participants.includes(targetId)) return fail('هذا اللاعب مو في الجولة');
    r.votes[byId] = targetId;
    this.touch();
    this.checkProgress(now);
    return OK;
  }

  submitGuess(byId: string, word: unknown, now: number): OpResult {
    const r = this.state.round;
    if (this.state.phase !== 'guess' || !r) return fail(ERR.wrongPhase);
    if (byId !== r.liarId) return fail('التخمين للكذّاب بس');
    if (typeof word !== 'string' || !r.guessOptions.includes(word)) return fail('اختر كلمة من الخيارات');
    r.guess = word;
    r.guessCorrect = word === r.word;
    this.endRound(now, 'normal');
    this.touch();
    return OK;
  }

  private recordHint(slot: TurnSlot, text: string | null, now: number): void {
    const r = this.state.round!;
    const hint: HintState = {
      playerId: slot.playerId,
      nickname: this.getPlayer(slot.playerId)?.nickname ?? '',
      text,
      hintRound: slot.hintRound,
      at: now,
    };
    r.hints.push(hint);
    this.emit({ type: 'hint_added', roundId: r.id, hint });
    r.turnIndex += 1;
    this.beginTurn(now);
    this.touch();
  }

  private startHints(now: number): void {
    const r = this.state.round!;
    this.state.phase = 'hints';
    r.turnIndex = 0;
    this.beginTurn(now);
    this.touch();
  }

  private beginTurn(now: number): void {
    const r = this.state.round!;
    while (r.turnIndex < r.turnQueue.length && !r.participants.includes(r.turnQueue[r.turnIndex]!.playerId)) {
      r.turnIndex += 1;
    }
    if (r.turnIndex >= r.turnQueue.length) {
      this.startVoting(now);
      return;
    }
    this.setDeadline(now + this.state.settings.hintSeconds * 1000, now);
  }

  private startVoting(now: number): void {
    const r = this.state.round!;
    this.state.phase = 'voting';
    r.votes = {};
    this.setDeadline(now + this.state.settings.voteSeconds * 1000, now);
    this.touch();
  }

  private finishVoting(now: number): void {
    const r = this.state.round!;
    const tally = this.tally(r);
    const max = Math.max(0, ...tally.map((t) => t.votes));
    const leaders = tally.filter((t) => t.votes === max && max > 0);
    r.caught = leaders.length === 1 && leaders[0]!.playerId === r.liarId;
    if (r.caught) {
      r.guessOptions = this.deps.catalog.guessOptions(r.packId, r.word, GUESS_OPTIONS, this.deps.rng);
      this.state.phase = 'guess';
      this.setDeadline(now + GUESS_MS, now);
    } else {
      this.endRound(now, 'normal');
    }
    this.touch();
  }

  private tally(r: RoundState): { playerId: string; nickname: string; votes: number }[] {
    const counts = new Map<string, number>();
    for (const id of r.participants) counts.set(id, 0);
    for (const [voter, target] of Object.entries(r.votes)) {
      if (r.participants.includes(voter) && counts.has(target)) counts.set(target, counts.get(target)! + 1);
    }
    return [...counts.entries()]
      .map(([playerId, votes]) => ({ playerId, nickname: this.getPlayer(playerId)?.nickname ?? '', votes }))
      .sort((a, b) => b.votes - a.votes);
  }

  private endRound(now: number, reason: RoundEndReason): void {
    const s = this.state;
    const r = s.round!;
    const deltas = new Map<string, { delta: number; reasons: PointReason[] }>();
    const award = (playerId: string, why: PointReason) => {
      if (!this.getPlayer(playerId)) return;
      const entry = deltas.get(playerId) ?? { delta: 0, reasons: [] };
      entry.delta += POINTS[why];
      entry.reasons.push(why);
      deltas.set(playerId, entry);
    };
    if (reason === 'normal') {
      for (const [voter, target] of Object.entries(r.votes)) {
        if (voter !== r.liarId && target === r.liarId && r.participants.includes(voter)) award(voter, 'correct_vote');
      }
      if (!r.caught) award(r.liarId, 'liar_escaped');
      else if (r.guessCorrect) award(r.liarId, 'liar_guessed');
    }
    for (const [id, d] of deltas) {
      const p = this.getPlayer(id);
      if (p) p.score += d.delta;
    }

    const name = (id: string) => this.getPlayer(id)?.nickname ?? (id === r.liarId ? r.liarName : '');
    const result: RoundResultView = {
      roundNumber: r.number,
      liarId: r.liarId,
      liarName: r.liarName,
      word: r.word,
      category: r.category,
      caught: reason === 'normal' ? !!r.caught : false,
      votes: Object.entries(r.votes).map(([voterId, targetId]) => ({
        voterId,
        voterName: name(voterId),
        targetId,
        targetName: name(targetId),
      })),
      tally: reason === 'normal' ? this.tally(r) : [],
      guess: r.caught && reason === 'normal' ? { word: r.guess, correct: !!r.guessCorrect } : null,
      points: r.participants
        .filter((id) => this.getPlayer(id))
        .map((id) => ({
          playerId: id,
          nickname: name(id),
          delta: deltas.get(id)?.delta ?? 0,
          reasons: deltas.get(id)?.reasons ?? [],
        }))
        .sort((a, b) => b.delta - a.delta),
      reason,
    };
    r.result = result;
    r.endedAt = now;
    s.phase = 'results';
    this.setDeadline(null, now);
    s.usedWordIds.push(r.wordId);
    if (s.usedWordIds.length > 1000) s.usedWordIds.splice(0, s.usedWordIds.length - 1000);
    this.emit({ type: 'round_ended', round: r, reason });
    if (deltas.size > 0) this.emit({ type: 'scores_changed' });
    this.touch();
  }

  // ---------------------------------------------------------------- time & presence

  /** Applies due deadlines and presence rules. Returns true when the state changed. */
  tick(now: number): boolean {
    const s = this.state;
    if (s.closed) return false;
    const before = s.rev;
    if (s.players.some((p) => p.connected)) s.lastActiveAt = now;

    const due = this.phaseDeadline();
    if (due !== null && now >= due) this.onPhaseTimeout(now);

    const host = this.getPlayer(s.hostId);
    if (
      host &&
      !host.connected &&
      host.disconnectedAt !== null &&
      now - host.disconnectedAt >= HOST_GRACE_MS &&
      s.players.some((p) => p.connected)
    ) {
      this.transferHost();
    }

    for (const p of [...s.players]) {
      if (!s.closed && !p.connected && p.disconnectedAt !== null && now - p.disconnectedAt >= OFFLINE_REMOVE_MS) {
        this.removePlayer(p.id, 'timeout', now);
      }
    }

    if (!s.closed && !s.players.some((p) => p.connected) && now - s.lastActiveAt >= ROOM_IDLE_CLOSE_MS) {
      this.close();
    }
    return s.rev !== before;
  }

  /** Earliest moment `tick` has something to do, or null. */
  nextWakeAt(): number | null {
    const s = this.state;
    if (s.closed) return null;
    const times: number[] = [];
    const due = this.phaseDeadline();
    if (due !== null) times.push(due);
    const host = this.getPlayer(s.hostId);
    if (host && !host.connected && host.disconnectedAt !== null) times.push(host.disconnectedAt + HOST_GRACE_MS);
    for (const p of s.players) {
      if (!p.connected && p.disconnectedAt !== null) times.push(p.disconnectedAt + OFFLINE_REMOVE_MS);
    }
    if (!s.players.some((p) => p.connected)) times.push(s.lastActiveAt + ROOM_IDLE_CLOSE_MS);
    return times.length ? Math.min(...times) : null;
  }

  private phaseDeadline(): number | null {
    const s = this.state;
    const r = s.round;
    if (s.phaseEndsAt === null) return null;
    const graceFor = (playerId: string, grace: number): number | null => {
      const p = this.getPlayer(playerId);
      if (!p || p.connected || p.disconnectedAt === null) return null;
      return Math.max(p.disconnectedAt, s.phaseStartedAt) + grace;
    };
    if (s.phase === 'hints' && r) {
      const slot = r.turnQueue[r.turnIndex];
      const g = slot ? graceFor(slot.playerId, OFFLINE_TURN_GRACE_MS) : null;
      if (g !== null) return Math.min(s.phaseEndsAt, g);
    }
    if (s.phase === 'guess' && r) {
      const g = graceFor(r.liarId, OFFLINE_GUESS_GRACE_MS);
      if (g !== null) return Math.min(s.phaseEndsAt, g);
    }
    return s.phaseEndsAt;
  }

  private onPhaseTimeout(now: number): void {
    const s = this.state;
    const r = s.round;
    if (!r) return;
    switch (s.phase) {
      case 'reveal':
        this.startHints(now);
        break;
      case 'hints': {
        const slot = r.turnQueue[r.turnIndex];
        if (slot) this.recordHint(slot, null, now);
        else this.startVoting(now);
        break;
      }
      case 'voting':
        this.finishVoting(now);
        break;
      case 'guess':
        r.guess = null;
        r.guessCorrect = false;
        this.endRound(now, 'normal');
        break;
      default:
        break;
    }
  }

  private checkProgress(now: number): void {
    const s = this.state;
    const r = s.round;
    if (!r) return;
    const online = r.participants.filter((id) => this.getPlayer(id)?.connected);
    if (s.phase === 'reveal' && online.length > 0 && online.every((id) => r.ready.includes(id))) {
      this.startHints(now);
    } else if (s.phase === 'voting' && online.length > 0 && online.every((id) => r.votes[id])) {
      this.finishVoting(now);
    }
  }

  private setDeadline(endsAt: number | null, now: number): void {
    this.state.phaseEndsAt = endsAt;
    this.state.phaseStartedAt = now;
  }

  // ---------------------------------------------------------------- views

  /** Builds exactly what one player is allowed to see. */
  viewFor(playerId: string, now: number): RoomView {
    const s = this.state;
    const r = s.round;
    const active = this.isActivePhase();
    const roundVisible = !!r && (active || s.phase === 'results');
    const inRound = (id: string) => roundVisible && r!.participants.includes(id);

    let secret: SecretView | null = null;
    if (roundVisible) {
      if (!inRound(playerId)) secret = { role: 'spectator' };
      else if (playerId === r!.liarId) secret = { role: 'liar', category: s.settings.liarSeesCategory ? r!.category : null };
      else secret = { role: 'civilian', word: r!.word, category: r!.category };
    }

    const slot = r && s.phase === 'hints' ? r.turnQueue[r.turnIndex] : undefined;
    const showHints = !!r && (s.phase === 'hints' || s.phase === 'voting' || s.phase === 'guess' || s.phase === 'results');

    return {
      rev: s.rev,
      code: s.code,
      phase: s.phase,
      roundNumber: s.roundCounter,
      hostId: s.hostId,
      meId: playerId,
      players: s.players.map((p) => ({
        id: p.id,
        nickname: p.nickname,
        score: p.score,
        connected: p.connected,
        isHost: p.id === s.hostId,
        inRound: inRound(p.id),
        ready: s.phase === 'reveal' && !!r && r.ready.includes(p.id),
        hasVoted: s.phase === 'voting' && !!r && !!r.votes[p.id],
        avatar: p.avatar,
      })),
      settings: s.settings,
      packs: this.deps.catalog.packs(),
      phaseEndsAt: s.phaseEndsAt,
      serverNow: now,
      secret,
      turn:
        r && s.phase === 'hints'
          ? {
              order: r.speakingOrder,
              currentPlayerId: slot?.playerId ?? null,
              hintRound: slot?.hintRound ?? r.hintRounds,
              hintRounds: r.hintRounds,
              turnNumber: Math.min(r.turnIndex + 1, r.turnQueue.length),
              totalTurns: r.turnQueue.length,
            }
          : null,
      hints: showHints
        ? r!.hints.map((h) => ({ playerId: h.playerId, nickname: h.nickname, text: h.text, hintRound: h.hintRound }))
        : [],
      myVote: s.phase === 'voting' && r ? (r.votes[playerId] ?? null) : null,
      guess:
        s.phase === 'guess' && r
          ? { liarId: r.liarId, liarName: r.liarName, options: playerId === r.liarId ? r.guessOptions : null }
          : null,
      result: s.phase === 'results' && r ? r.result : null,
      locked: !!s.locked,
      features: this.deps.features?.(s) ?? { tier: 'free', adsEnabled: false },
    };
  }

  // ---------------------------------------------------------------- helpers

  private isHost(id: string): boolean {
    return this.state.hostId === id && !!this.getPlayer(id);
  }

  private emit(e: RoomEvent): void {
    this.events.push(e);
  }

  private touch(): void {
    this.state.rev += 1;
  }
}

function nameKey(name: string): string {
  return name.toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/\s+/g, ' ');
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function weightedPick<T>(items: readonly T[], weight: (item: T) => number, rng: Rng): T {
  const weights = items.map(weight);
  const total = weights.reduce((a, b) => a + b, 0);
  let x = rng() * total;
  for (let i = 0; i < items.length; i++) {
    x -= weights[i]!;
    if (x < 0) return items[i]!;
  }
  return items[items.length - 1]!;
}
