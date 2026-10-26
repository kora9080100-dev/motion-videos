import type { PackInfo, PackKind, PackTier } from '../../shared/types';
import { normalizeForCompare } from '../../shared/text';
import { shuffle } from '../game/room';
import type { Catalog, Rng, WordPick } from '../game/types';

export interface CatalogPack {
  id: string;
  name: string;
  emoji: string;
  description: string;
  tier: PackTier;
  kind: PackKind;
  sortOrder: number;
  availableFrom: Date | null;
  availableUntil: Date | null;
  words: { id: string; text: string }[];
}

/**
 * In-memory word catalog loaded from the database. Pack availability is the single
 * place where future entitlements (Plus packs, occasion windows) are enforced.
 */
export class WordCatalog implements Catalog {
  private readonly byId: Map<string, CatalogPack>;

  constructor(
    private readonly list: CatalogPack[],
    private readonly now: () => number = Date.now,
  ) {
    this.byId = new Map(list.map((p) => [p.id, p]));
  }

  private isAvailable(p: CatalogPack): boolean {
    if (p.tier !== 'free') return false; // Plus packs unlock once entitlements are wired up.
    const t = this.now();
    if (p.availableFrom && t < p.availableFrom.getTime()) return false;
    if (p.availableUntil && t > p.availableUntil.getTime()) return false;
    return p.words.length >= 2;
  }

  packs(): PackInfo[] {
    return this.list
      // Locked packs stay hidden until there is a real way to unlock them.
      .filter((p) => this.isAvailable(p))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        description: p.description,
        wordCount: p.words.length,
        tier: p.tier,
        kind: p.kind,
        available: this.isAvailable(p),
      }));
  }

  pickWord(packIds: string[], excludeWordIds: ReadonlySet<string>, rng: Rng): WordPick | null {
    const packs = shuffle(
      packIds.map((id) => this.byId.get(id)).filter((p): p is CatalogPack => !!p && this.isAvailable(p)),
      rng,
    );
    // Pick a pack first (so big packs don't dominate), then a fresh word from it.
    for (const pack of packs) {
      const fresh = pack.words.filter((w) => !excludeWordIds.has(w.id));
      if (fresh.length === 0) continue;
      const word = fresh[Math.floor(rng() * fresh.length)]!;
      return {
        packId: pack.id,
        category: { id: pack.id, name: pack.name, emoji: pack.emoji },
        wordId: word.id,
        word: word.text,
      };
    }
    return null;
  }

  guessOptions(packId: string, word: string, count: number, rng: Rng): string[] {
    const pack = this.byId.get(packId);
    const key = normalizeForCompare(word);
    const others = (pack?.words ?? []).map((w) => w.text).filter((t) => normalizeForCompare(t) !== key);
    const picked = shuffle(others, rng).slice(0, Math.max(0, count - 1));
    return shuffle([...picked, word], rng);
  }
}
