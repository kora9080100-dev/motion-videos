import type { CatalogPack } from '../content/catalog';
import type { PackDefinition } from '../content/index';
import type { RoomState } from '../game/types';
import type { GameRepository } from './repository';

/**
 * Storage-free mode used when no DATABASE_URL is configured in production: the game runs
 * entirely in memory (small hosts can't fit an embedded database). Nothing survives a
 * restart; connect PostgreSQL for history and room recovery.
 */
export class MemoryRepository implements GameRepository {
  private packs: CatalogPack[] = [];

  async seedPacks(packs: PackDefinition[]): Promise<void> {
    this.packs = packs.map((p) => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      description: p.description,
      tier: p.tier,
      kind: p.kind,
      sortOrder: p.sortOrder,
      availableFrom: p.availableFrom ? new Date(p.availableFrom) : null,
      availableUntil: p.availableUntil ? new Date(p.availableUntil) : null,
      words: p.words.map((text) => ({ id: `${p.id}:${text}`, text })),
    }));
  }

  async loadCatalog(): Promise<CatalogPack[]> {
    return this.packs;
  }

  async loadSnapshots(): Promise<RoomState[]> {
    return [];
  }

  async closeOrphanRooms(): Promise<number> {
    return 0;
  }

  async insertRoom(): Promise<void> {}
  async updateRoomSettings(): Promise<void> {}
  async closeRoom(): Promise<void> {}
  async insertPlayer(): Promise<void> {}
  async markPlayerLeft(): Promise<void> {}
  async updateScores(): Promise<void> {}
  async insertRound(): Promise<void> {}
  async insertHint(): Promise<void> {}
  async finishRound(): Promise<void> {}
  async saveSnapshot(): Promise<void> {}
}
