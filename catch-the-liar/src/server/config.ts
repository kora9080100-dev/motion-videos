export interface AppConfig {
  port: number;
  host: string;
  production: boolean;
  databaseUrl?: string;
  databaseSsl?: string;
  /** Embedded PGlite folder; undefined means no database (memory only). */
  pgliteDir?: string;
  trustProxy: boolean;
  allowedOrigins: string[];
  clientDir: string;
  /** Public site address (e.g. https://catchtheliar.onrender.com); detected from requests when unset. */
  publicUrl?: string;
  adsEnabled: boolean;
  /** How old a room snapshot may be and still be restored after a restart. */
  restoreMaxAgeMinutes: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const production = env.NODE_ENV === 'production';
  return {
    port: Number(env.PORT ?? 3000),
    host: env.HOST ?? '0.0.0.0',
    production,
    databaseUrl: env.DATABASE_URL || undefined,
    databaseSsl: env.DATABASE_SSL || undefined,
    // Embedded PGlite needs ~650MB RAM, too much for small/free hosts, so production
    // defaults to memory-only unless PGLITE_DIR or DATABASE_URL is set.
    pgliteDir: env.PGLITE_DIR || (production ? undefined : '.data/pglite'),
    trustProxy: env.TRUST_PROXY ? env.TRUST_PROXY === '1' || env.TRUST_PROXY === 'true' : production,
    allowedOrigins: (env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    clientDir: env.CLIENT_DIR ?? 'dist/client',
    publicUrl: env.PUBLIC_URL?.replace(/\/+$/, '') || undefined,
    adsEnabled: env.ADS_ENABLED === 'true',
    restoreMaxAgeMinutes: Number(env.RESTORE_MAX_AGE_MINUTES ?? 120),
  };
}
