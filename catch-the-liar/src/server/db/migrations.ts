import type { Db } from './client';

interface Migration {
  version: number;
  name: string;
  sql: string;
}

// Each migration runs as one multi-statement query, which PostgreSQL executes atomically.
// Never edit a released migration; append a new one instead.
export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial schema',
    sql: /* sql */ `
-- Word content -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS word_packs (
  id              text PRIMARY KEY,
  name_ar         text NOT NULL,
  emoji           text NOT NULL DEFAULT '🎲',
  description_ar  text NOT NULL DEFAULT '',
  tier            text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'plus')),
  kind            text NOT NULL DEFAULT 'standard' CHECK (kind IN ('standard', 'occasion', 'exclusive')),
  available_from  timestamptz,
  available_until timestamptz,
  sort_order      int NOT NULL DEFAULT 100,
  is_active       boolean NOT NULL DEFAULT true,
  source          text NOT NULL DEFAULT 'builtin',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS words (
  id          bigserial PRIMARY KEY,
  pack_id     text NOT NULL REFERENCES word_packs(id) ON DELETE CASCADE,
  text_ar     text NOT NULL,
  difficulty  smallint NOT NULL DEFAULT 1,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pack_id, text_ar)
);

-- Rooms & players ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rooms (
  id          uuid PRIMARY KEY,
  code        text NOT NULL,
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  settings    jsonb NOT NULL DEFAULT '{}'::jsonb,
  tier        text NOT NULL DEFAULT 'free',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  closed_at   timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS rooms_open_code_idx ON rooms (code) WHERE status = 'open';

CREATE TABLE IF NOT EXISTS players (
  id            uuid PRIMARY KEY,
  room_id       uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  nickname      text NOT NULL,
  token_hash    text NOT NULL,
  score         int NOT NULL DEFAULT 0,
  joined_at     timestamptz NOT NULL DEFAULT now(),
  left_at       timestamptz,
  leave_reason  text
);
CREATE INDEX IF NOT EXISTS players_room_idx ON players (room_id);

-- Rounds (secret word and liar live here, server-side only) -------------------
CREATE TABLE IF NOT EXISTS rounds (
  id                  uuid PRIMARY KEY,
  room_id             uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  number              int NOT NULL,
  pack_id             text NOT NULL,
  word_id             bigint REFERENCES words(id) ON DELETE SET NULL,
  word_text           text NOT NULL,
  liar_player_id      uuid NOT NULL,
  participant_ids     uuid[] NOT NULL,
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finished', 'aborted')),
  end_reason          text,
  caught              boolean,
  liar_guess          text,
  liar_guess_correct  boolean,
  points              jsonb,
  started_at          timestamptz NOT NULL DEFAULT now(),
  ended_at            timestamptz,
  UNIQUE (room_id, number)
);

CREATE TABLE IF NOT EXISTS hints (
  id          bigserial PRIMARY KEY,
  round_id    uuid NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  player_id   uuid NOT NULL,
  hint_round  smallint NOT NULL,
  text        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hints_round_idx ON hints (round_id);

CREATE TABLE IF NOT EXISTS votes (
  round_id    uuid NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  voter_id    uuid NOT NULL,
  target_id   uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (round_id, voter_id)
);

-- Live room state for recovery after a restart or deploy -----------------------
CREATE TABLE IF NOT EXISTS room_snapshots (
  room_id     uuid PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
  state       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Monetization-ready (not used yet): who has Plus / no-ads / exclusive packs ----
CREATE TABLE IF NOT EXISTS entitlements (
  id            bigserial PRIMARY KEY,
  subject_type  text NOT NULL CHECK (subject_type IN ('device', 'room', 'account')),
  subject_id    text NOT NULL,
  feature       text NOT NULL,
  source        text NOT NULL,
  starts_at     timestamptz NOT NULL DEFAULT now(),
  ends_at       timestamptz,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS entitlements_subject_idx ON entitlements (subject_type, subject_id);

-- Security ------------------------------------------------------------------
-- Only the game server (the table owner) talks to the database. Row level security is
-- enabled with no policies, so any other role (e.g. Supabase's public "anon" and
-- "authenticated" API roles) can read or write nothing — secrets never leave the server.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['word_packs','words','rooms','players','rounds','hints','votes','room_snapshots','entitlements'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated';
  END IF;
END $$;
`,
  },
];

export async function migrate(db: Db): Promise<number[]> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version     int PRIMARY KEY,
      name        text NOT NULL,
      applied_at  timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
  `);
  const rows = await db.query<{ version: number }>('SELECT version FROM schema_migrations');
  const done = new Set(rows.map((r) => Number(r.version)));
  const applied: number[] = [];
  for (const m of MIGRATIONS) {
    if (done.has(m.version)) continue;
    const name = m.name.replace(/'/g, "''");
    await db.exec(`${m.sql}\nINSERT INTO schema_migrations (version, name) VALUES (${m.version}, '${name}');`);
    applied.push(m.version);
  }
  return applied;
}
