import type { PackInfo } from '../shared/types';
import { createGameServer } from './app';
import { loadConfig } from './config';
import { WordCatalog } from './content/catalog';
import { BUILTIN_PACKS } from './content/index';
import { openDatabase } from './db/client';
import { migrate } from './db/migrations';
import { Repository } from './db/repository';
import type { Catalog, Rng } from './game/types';

/** Lets the catalog be reloaded from the database without restarting rooms. */
class LiveCatalog implements Catalog {
  constructor(public current: WordCatalog) {}
  packs(): PackInfo[] {
    return this.current.packs();
  }
  pickWord(packIds: string[], exclude: ReadonlySet<string>, rng: Rng) {
    return this.current.pickWord(packIds, exclude, rng);
  }
  guessOptions(packId: string, word: string, count: number, rng: Rng) {
    return this.current.guessOptions(packId, word, count, rng);
  }
}

async function main(): Promise<void> {
  const config = loadConfig();
  const db = await openDatabase({ url: config.databaseUrl, ssl: config.databaseSsl, pgliteDir: config.pgliteDir });
  const applied = await migrate(db);
  console.log(`[db] ${db.kind} ready${applied.length ? `, applied migrations ${applied.join(', ')}` : ''}`);

  const repo = new Repository(db);
  await repo.seedPacks(BUILTIN_PACKS);
  const catalog = new LiveCatalog(new WordCatalog(await repo.loadCatalog()));
  console.log(`[content] ${catalog.packs().length} packs loaded`);

  const server = createGameServer({ config, repo, catalog });

  const snapshots = await repo.loadSnapshots(config.restoreMaxAgeMinutes);
  const restored = server.manager.restore(snapshots);
  const closed = await repo.closeOrphanRooms(server.manager.all().map((r) => r.id));
  if (restored || closed) console.log(`[rooms] restored ${restored}, closed ${closed} stale`);

  const reload = setInterval(
    () => {
      repo
        .loadCatalog()
        .then((packs) => {
          catalog.current = new WordCatalog(packs);
        })
        .catch((err) => console.error('[content] reload failed', err));
    },
    10 * 60_000,
  );
  reload.unref();

  server.http.listen(config.port, config.host, () => {
    console.log(`[http] اكشف الكذبة running on http://localhost:${config.port}`);
  });

  let stopping = false;
  const shutdown = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    console.log(`[app] ${signal} received, saving rooms…`);
    const force = setTimeout(() => process.exit(1), 10_000);
    force.unref();
    try {
      await server.close();
      await db.close();
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[app] failed to start', err);
  process.exit(1);
});
