import type { PGlite } from '@electric-sql/pglite';
import type { Pool } from 'pg';

/** Minimal database interface shared by real PostgreSQL (pg) and embedded PGlite. */
export interface Db {
  readonly kind: 'postgres' | 'pglite';
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  /** Runs one or more statements without parameters (used for migrations). */
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
}

export interface DbOptions {
  /** PostgreSQL connection string (Supabase, Neon, Render…). When absent PGlite is used. */
  url?: string;
  /** 'disable' | 'no-verify' | 'verify'. Defaults to no-verify for remote hosts. */
  ssl?: string;
  /** Directory for embedded PGlite data, or 'memory://' for an in-memory database. */
  pgliteDir?: string;
}

export async function openDatabase(opts: DbOptions): Promise<Db> {
  if (opts.url) return openPostgres(opts.url, opts.ssl);
  return openPglite(opts.pgliteDir ?? 'memory://');
}

async function openPostgres(rawUrl: string, sslMode?: string): Promise<Db> {
  const { default: pg } = await import('pg');
  const url = new URL(rawUrl);
  const urlSslMode = url.searchParams.get('sslmode');
  url.searchParams.delete('sslmode');
  const local = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  const mode = sslMode ?? (urlSslMode === 'disable' || local ? 'disable' : urlSslMode?.startsWith('verify') ? 'verify' : 'no-verify');
  const ssl = mode === 'disable' ? false : mode === 'verify' ? { rejectUnauthorized: true } : { rejectUnauthorized: false };

  const pool: Pool = new pg.Pool({
    connectionString: url.toString(),
    ssl,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  pool.on('error', (err) => console.error('[db] idle client error', err.message));
  await pool.query('select 1');

  return {
    kind: 'postgres',
    async query<T>(sql: string, params?: unknown[]) {
      const res = await pool.query(sql, params as unknown[] | undefined);
      return res.rows as T[];
    },
    async exec(sql: string) {
      await pool.query(sql);
    },
    async close() {
      await pool.end();
    },
  };
}

async function openPglite(dataDir: string): Promise<Db> {
  const { PGlite } = await import('@electric-sql/pglite');
  if (dataDir !== 'memory://') {
    const { mkdir } = await import('node:fs/promises');
    await mkdir(dataDir, { recursive: true });
  }
  const db: PGlite = await PGlite.create(dataDir);
  return {
    kind: 'pglite',
    async query<T>(sql: string, params?: unknown[]) {
      const res = await db.query<T>(sql, params);
      return res.rows;
    },
    async exec(sql: string) {
      await db.exec(sql);
    },
    async close() {
      await db.close();
    },
  };
}
