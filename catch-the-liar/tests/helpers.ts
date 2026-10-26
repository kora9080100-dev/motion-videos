import { WordCatalog, type CatalogPack } from '../src/server/content/catalog';
import { GameRoom, type RoomDeps } from '../src/server/game/room';

export function seededRng(seed = 42): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function testPacks(): CatalogPack[] {
  const mk = (id: string, name: string, words: string[], extra: Partial<CatalogPack> = {}): CatalogPack => ({
    id,
    name,
    emoji: '🎲',
    description: '',
    tier: 'free',
    kind: 'standard',
    sortOrder: 1,
    availableFrom: null,
    availableUntil: null,
    words: words.map((text, i) => ({ id: `${id}-${i}`, text })),
    ...extra,
  });
  return [
    mk('food', 'الأكلات', ['كبسة', 'مندي', 'شاورما', 'برجر', 'بيتزا', 'سمبوسة', 'جريش', 'مرقوق', 'هريس', 'فلافل']),
    mk('animals', 'الحيوانات', ['جمل', 'أسد', 'نمر', 'فيل', 'زرافة', 'حصان', 'قطة', 'كلب', 'حمار وحشي']),
    mk('secret', 'حصري', ['أ', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح'], { tier: 'plus' }),
  ];
}

let idCounter = 0;
export function testDeps(seed = 7, packs = testPacks()): RoomDeps {
  return {
    catalog: new WordCatalog(packs),
    rng: seededRng(seed),
    newId: () => `00000000-0000-4000-8000-${String(++idCounter).padStart(12, '0')}`,
  };
}

export const T0 = 1_700_000_000_000;

/** Room with `n` connected players named p1..pn; returns ids in join order. */
export function roomWith(n: number, seed = 7): { room: GameRoom; ids: string[]; deps: RoomDeps } {
  const deps = testDeps(seed);
  const room = GameRoom.create({ id: deps.newId(), code: '123456', now: T0 }, deps);
  const ids: string[] = [];
  for (let i = 1; i <= n; i++) {
    const id = deps.newId();
    const res = room.addPlayer({ id, nickname: `لاعب${i}`, tokenHash: `hash-${i}`, now: T0 });
    if (!res.ok) throw new Error(res.error);
    room.setConnected(id, true, T0);
    ids.push(id);
  }
  room.drainEvents();
  return { room, ids, deps };
}

export function liarOf(room: GameRoom): string {
  return room.state.round!.liarId;
}

export function currentTurn(room: GameRoom): string {
  const r = room.state.round!;
  return r.turnQueue[r.turnIndex]!.playerId;
}

/** Plays every hint turn with a harmless hint. */
export function playAllHints(room: GameRoom, now = T0): void {
  let guard = 0;
  while (room.state.phase === 'hints' && guard++ < 100) {
    const res = room.submitHint(currentTurn(room), `تلميح ${guard}`, now);
    if (!res.ok) throw new Error(res.error);
  }
}

export function startToHints(room: GameRoom, ids: string[], now = T0): void {
  const res = room.startRound(room.state.hostId, now);
  if (!res.ok) throw new Error(res.error);
  for (const id of room.state.round!.participants) room.markReady(id, now);
  void ids;
}
