import { z } from 'zod';
import animals from './packs/animals.json';
import characters from './packs/characters.json';
import drinks from './packs/drinks.json';
import food from './packs/food.json';
import jobs from './packs/jobs.json';
import movies from './packs/movies.json';
import places from './packs/places.json';
import produce from './packs/produce.json';
import ramadanEid from './packs/ramadan-eid.json';
import sports from './packs/sports.json';
import things from './packs/things.json';

// To add a pack: create packs/<id>.json (same shape) and add it to this list.
// Packs can also be inserted directly in the database (word_packs / words tables).
const RAW_PACKS: unknown[] = [food, drinks, animals, places, things, characters, movies, sports, produce, jobs, ramadanEid];

export const packSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{2,40}$/),
  name: z.string().min(2).max(40),
  emoji: z.string().min(1).max(8),
  description: z.string().max(120).default(''),
  tier: z.enum(['free', 'plus']).default('free'),
  kind: z.enum(['standard', 'occasion', 'exclusive']).default('standard'),
  sortOrder: z.number().int().default(100),
  availableFrom: z.string().datetime().optional(),
  availableUntil: z.string().datetime().optional(),
  words: z.array(z.string().min(1).max(40)).min(8),
});

export type PackDefinition = z.infer<typeof packSchema>;

export const BUILTIN_PACKS: PackDefinition[] = RAW_PACKS.map((raw) => packSchema.parse(raw));
