import type { CatalogPack } from '../content/catalog';
import type { PackDefinition } from '../content/index';
import type { LeaveReason, PlayerState, RoomState, RoundState } from '../game/types';
import type { RoundEndReason } from '../../shared/types';
import type { Db } from './client';

/** Everything the game server reads from / writes to storage. */
export interface GameRepository {
  seedPacks(packs: PackDefinition[]): Promise<void>;
  loadCatalog(): Promise<CatalogPack[]>;
  insertRoom(state: RoomState): Promise<void>;
  updateRoomSettings(state: RoomState): Promise<void>;
  closeRoom(roomId: string): Promise<void>;
  insertPlayer(roomId: string, p: PlayerState): Promise<void>;
  markPlayerLeft(playerId: string, reason: LeaveReason): Promise<void>;
  updateScores(players: PlayerState[]): Promise<void>;
  insertRound(roomId: string, r: RoundState): Promise<void>;
  insertHint(roundId: string, h: { playerId: string; hintRound: number; text: string | null; at: number }): Promise<void>;
  finishRound(r: RoundState, reason: RoundEndReason): Promise<void>;
  saveSnapshot(roomId: string, json: string): Promise<void>;
  loadSnapshots(maxAgeMinutes: number): Promise<RoomState[]>;
  closeOrphanRooms(keepIds: string[]): Promise<number>;
}

/** PostgreSQL / PGlite implementation. */
export class Repository implements GameRepository {
  constructor(private readonly db: Db) {}

  // ------------------------------------------------------------- content

  async seedPacks(packs: PackDefinition[]): Promise<void> {
    for (const p of packs) {
      await this.db.query(
        `INSERT INTO word_packs (id, name_ar, emoji, description_ar, tier, kind, sort_order, available_from, available_until, source, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'builtin', true)
         ON CONFLICT (id) DO UPDATE SET
           name_ar = excluded.name_ar, emoji = excluded.emoji, description_ar = excluded.description_ar,
           tier = excluded.tier, kind = excluded.kind, sort_order = excluded.sort_order,
           available_from = excluded.available_from, available_until = excluded.available_until,
           is_active = true, updated_at = now()
         WHERE word_packs.source = 'builtin'`,
        [p.id, p.name, p.emoji, p.description, p.tier, p.kind, p.sortOrder, p.availableFrom ?? null, p.availableUntil ?? null],
      );
      await this.db.query(
        `INSERT INTO words (pack_id, text_ar)
         SELECT $1, w FROM unnest($2::text[]) AS w
         ON CONFLICT (pack_id, text_ar) DO UPDATE SET is_active = true`,
        [p.id, p.words],
      );
      await this.db.query(`UPDATE words SET is_active = false WHERE pack_id = $1 AND NOT (text_ar = ANY($2::text[]))`, [
        p.id,
        p.words,
      ]);
    }
  }

  async loadCatalog(): Promise<CatalogPack[]> {
    const packs = await this.db.query<{
      id: string;
      name_ar: string;
      emoji: string;
      description_ar: string;
      tier: 'free' | 'plus';
      kind: 'standard' | 'occasion' | 'exclusive';
      sort_order: number;
      available_from: Date | string | null;
      available_until: Date | string | null;
    }>(
      `SELECT id, name_ar, emoji, description_ar, tier, kind, sort_order, available_from, available_until
       FROM word_packs WHERE is_active ORDER BY sort_order, id`,
    );
    const words = await this.db.query<{ id: string; pack_id: string; text_ar: string }>(
      `SELECT id::text AS id, pack_id, text_ar FROM words WHERE is_active ORDER BY id`,
    );
    const byPack = new Map<string, { id: string; text: string }[]>();
    for (const w of words) {
      const list = byPack.get(w.pack_id) ?? [];
      list.push({ id: w.id, text: w.text_ar });
      byPack.set(w.pack_id, list);
    }
    const toDate = (v: Date | string | null) => (v === null ? null : new Date(v));
    return packs.map((p) => ({
      id: p.id,
      name: p.name_ar,
      emoji: p.emoji,
      description: p.description_ar,
      tier: p.tier,
      kind: p.kind,
      sortOrder: Number(p.sort_order),
      availableFrom: toDate(p.available_from),
      availableUntil: toDate(p.available_until),
      words: byPack.get(p.id) ?? [],
    }));
  }

  // ------------------------------------------------------------- rooms

  async insertRoom(state: RoomState): Promise<void> {
    await this.db.query(`INSERT INTO rooms (id, code, settings, created_at) VALUES ($1, $2, $3::jsonb, to_timestamp($4 / 1000.0))`, [
      state.id,
      state.code,
      JSON.stringify(state.settings),
      state.createdAt,
    ]);
  }

  async updateRoomSettings(state: RoomState): Promise<void> {
    await this.db.query(`UPDATE rooms SET settings = $2::jsonb, updated_at = now() WHERE id = $1`, [
      state.id,
      JSON.stringify(state.settings),
    ]);
  }

  async closeRoom(roomId: string): Promise<void> {
    await this.db.query(`UPDATE rooms SET status = 'closed', closed_at = now(), updated_at = now() WHERE id = $1`, [roomId]);
    await this.db.query(`DELETE FROM room_snapshots WHERE room_id = $1`, [roomId]);
  }

  async insertPlayer(roomId: string, p: PlayerState): Promise<void> {
    await this.db.query(
      `INSERT INTO players (id, room_id, nickname, token_hash, score, joined_at) VALUES ($1, $2, $3, $4, $5, to_timestamp($6 / 1000.0))`,
      [p.id, roomId, p.nickname, p.tokenHash, p.score, p.joinedAt],
    );
  }

  async markPlayerLeft(playerId: string, reason: LeaveReason): Promise<void> {
    await this.db.query(`UPDATE players SET left_at = now(), leave_reason = $2 WHERE id = $1`, [playerId, reason]);
  }

  async updateScores(players: PlayerState[]): Promise<void> {
    if (players.length === 0) return;
    await this.db.query(
      `UPDATE players AS p SET score = s.score
       FROM (SELECT unnest($1::uuid[]) AS id, unnest($2::int[]) AS score) AS s
       WHERE p.id = s.id`,
      [players.map((p) => p.id), players.map((p) => p.score)],
    );
  }

  // ------------------------------------------------------------- rounds

  async insertRound(roomId: string, r: RoundState): Promise<void> {
    const wordId = /^\d+$/.test(r.wordId) ? r.wordId : null;
    await this.db.query(
      `INSERT INTO rounds (id, room_id, number, pack_id, word_id, word_text, liar_player_id, participant_ids, started_at)
       VALUES ($1, $2, $3, $4, $5::bigint, $6, $7, $8::uuid[], to_timestamp($9 / 1000.0))`,
      [r.id, roomId, r.number, r.packId, wordId, r.word, r.liarId, r.participants, r.startedAt],
    );
  }

  async insertHint(roundId: string, h: { playerId: string; hintRound: number; text: string | null; at: number }): Promise<void> {
    await this.db.query(
      `INSERT INTO hints (round_id, player_id, hint_round, text, created_at) VALUES ($1, $2, $3, $4, to_timestamp($5 / 1000.0))`,
      [roundId, h.playerId, h.hintRound, h.text, h.at],
    );
  }

  async finishRound(r: RoundState, reason: RoundEndReason): Promise<void> {
    await this.db.query(
      `UPDATE rounds SET status = $2, end_reason = $3, caught = $4, liar_guess = $5, liar_guess_correct = $6,
         points = $7::jsonb, ended_at = now()
       WHERE id = $1`,
      [
        r.id,
        reason === 'normal' ? 'finished' : 'aborted',
        reason,
        r.caught,
        r.guess,
        r.guessCorrect,
        JSON.stringify(r.result?.points ?? []),
      ],
    );
    const votes = Object.entries(r.votes);
    if (votes.length > 0) {
      await this.db.query(
        `INSERT INTO votes (round_id, voter_id, target_id)
         SELECT $1, v, t FROM unnest($2::uuid[], $3::uuid[]) AS x(v, t)
         ON CONFLICT (round_id, voter_id) DO UPDATE SET target_id = excluded.target_id`,
        [r.id, votes.map(([v]) => v), votes.map(([, t]) => t)],
      );
    }
  }

  // ------------------------------------------------------------- snapshots

  async saveSnapshot(roomId: string, json: string): Promise<void> {
    await this.db.query(
      `INSERT INTO room_snapshots (room_id, state, updated_at) VALUES ($1, $2::jsonb, now())
       ON CONFLICT (room_id) DO UPDATE SET state = excluded.state, updated_at = now()`,
      [roomId, json],
    );
  }

  async loadSnapshots(maxAgeMinutes: number): Promise<RoomState[]> {
    const rows = await this.db.query<{ state: RoomState | string }>(
      `SELECT s.state FROM room_snapshots s JOIN rooms r ON r.id = s.room_id
       WHERE r.status = 'open' AND s.updated_at > now() - make_interval(mins => $1)`,
      [maxAgeMinutes],
    );
    return rows.map((r) => (typeof r.state === 'string' ? (JSON.parse(r.state) as RoomState) : r.state));
  }

  /** Closes rooms left open by a crash that are not being restored. */
  async closeOrphanRooms(keepIds: string[]): Promise<number> {
    const rows = await this.db.query<{ id: string }>(
      `UPDATE rooms SET status = 'closed', closed_at = now() WHERE status = 'open' AND NOT (id = ANY($1::uuid[])) RETURNING id`,
      [keepIds],
    );
    await this.db.query(`DELETE FROM room_snapshots WHERE NOT (room_id = ANY($1::uuid[]))`, [keepIds]);
    return rows.length;
  }

  async stats(): Promise<{ rooms: number; rounds: number; players: number }> {
    const [row] = await this.db.query<{ rooms: string; rounds: string; players: string }>(
      `SELECT (SELECT count(*) FROM rooms) AS rooms, (SELECT count(*) FROM rounds) AS rounds, (SELECT count(*) FROM players) AS players`,
    );
    return { rooms: Number(row?.rooms ?? 0), rounds: Number(row?.rounds ?? 0), players: Number(row?.players ?? 0) };
  }
}
