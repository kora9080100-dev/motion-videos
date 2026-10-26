import { NICKNAME_MAX, NICKNAME_MIN, ROOM_CODE_LENGTH } from './types';

// Control characters, zero-width characters and bidi overrides that could be used to
// spoof names or break the layout.
const UNSAFE_CHARS = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g;

/** Trims, collapses whitespace, strips unsafe characters and caps length by code point. */
export function cleanText(input: unknown, maxLen: number): string {
  if (typeof input !== 'string') return '';
  const s = input.normalize('NFC').replace(UNSAFE_CHARS, '').replace(/\s+/g, ' ').trim();
  return Array.from(s).slice(0, maxLen).join('');
}

export function textLength(s: string): number {
  return Array.from(s).length;
}

export function validateNickname(input: unknown): { ok: true; value: string } | { ok: false; error: string } {
  const value = cleanText(input, NICKNAME_MAX + 1);
  if (textLength(value) < NICKNAME_MIN) return { ok: false, error: `الاسم لازم يكون ${NICKNAME_MIN} حروف على الأقل` };
  if (textLength(value) > NICKNAME_MAX) return { ok: false, error: `الاسم طويل، الحد الأقصى ${NICKNAME_MAX} حرف` };
  return { ok: true, value };
}

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_INDIC = '۰۱۲۳۴۵۶۷۸۹';

/** Converts Arabic/Persian digits to ASCII and keeps digits only. */
export function normalizeRoomCode(input: unknown): string {
  if (typeof input !== 'string') return '';
  let out = '';
  for (const ch of input) {
    const a = ARABIC_INDIC.indexOf(ch);
    const p = PERSIAN_INDIC.indexOf(ch);
    if (a >= 0) out += String(a);
    else if (p >= 0) out += String(p);
    else if (ch >= '0' && ch <= '9') out += ch;
  }
  return out.slice(0, ROOM_CODE_LENGTH);
}

export function isValidRoomCode(code: string): boolean {
  return new RegExp(`^[1-9][0-9]{${ROOM_CODE_LENGTH - 1}}$`).test(code);
}

/**
 * Loose Arabic normalisation for comparisons: removes diacritics/tatweel, unifies
 * alef/yaa/taa-marbuta forms, lowercases Latin and drops spaces & punctuation.
 */
export function normalizeForCompare(input: string): string {
  return input
    .normalize('NFC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]/gu, '');
}

/** True when the hint gives away the secret word (used for non-liars only). */
export function hintRevealsWord(hint: string, word: string): boolean {
  const h = normalizeForCompare(hint);
  if (!h) return false;
  const withoutAl = (s: string) => (s.startsWith('ال') && s.length > 4 ? s.slice(2) : s);
  const full = normalizeForCompare(word);
  const fullCores = new Set([full, withoutAl(full)]);
  for (const core of fullCores) {
    if (core.length >= 3 ? h.includes(core) : h === core) return true;
  }
  // For multi-word answers ("حمار وحشي") also block the distinctive single words.
  const parts = word.split(/\s+/).map(normalizeForCompare).filter(Boolean);
  if (parts.length > 1) {
    for (const p of parts) {
      const core = withoutAl(p);
      if (core.length >= 4 && h.includes(core)) return true;
    }
  }
  return false;
}

const PREFIXES = ['وال', 'بال', 'فال', 'كال', 'لل', 'ال', 'و', 'ب', 'ف', 'ل', 'ك'];

function wordForms(token: string): string[] {
  const forms = [token];
  for (const p of PREFIXES) {
    if (token.startsWith(p) && token.length - p.length >= 2) forms.push(token.slice(p.length));
  }
  return forms;
}

/**
 * Whole-word check used for chat: true when a message names the secret word ("الكبسة",
 * "وكبسة", "ك ب س ة"), but not when the word is just part of a longer one ("شايف" vs "شاي").
 */
export function mentionsWord(text: string, word: string): boolean {
  const split = (s: string) => s.split(/\s+/).map(normalizeForCompare).filter(Boolean);
  const tokens = split(text);
  const target = split(word).map((t) => (t.startsWith('ال') && t.length > 3 ? t.slice(2) : t));
  if (tokens.length === 0 || target.length === 0) return false;
  const singles = tokens.filter((t) => Array.from(t).length === 1);
  if (singles.length >= 3 && tokens.join('').includes(target.join(''))) return true;
  const forms = tokens.map(wordForms);
  for (let i = 0; i + target.length <= tokens.length; i++) {
    if (target.every((t, j) => forms[i + j]!.includes(t))) return true;
  }
  // Distinctive part of a multi-word answer ("وحشي" in "حمار وحشي").
  if (target.length > 1) {
    for (const t of target) if (t.length >= 4 && forms.some((f) => f.includes(t))) return true;
  }
  return false;
}

const STOPWORDS = new Set(
  ['في', 'من', 'على', 'عن', 'مع', 'الى', 'إلى', 'او', 'أو', 'ثم', 'ما', 'لا', 'هو', 'هي', 'شي', 'شيء', 'حق', 'يا', 'اللي', 'ذا', 'هذا', 'هذي', 'كل', 'بس'].map(
    normalizeForCompare,
  ),
);

/** Comparable core of a word: normalised, with common prefixes (ال، و، ب…) removed. */
export function canonicalWord(token: string): string {
  let t = normalizeForCompare(token);
  for (const p of ['وال', 'بال', 'فال', 'كال', 'لل', 'ال']) {
    if (t.startsWith(p) && t.length - p.length >= 2) {
      t = t.slice(p.length);
      break;
    }
  }
  if (t.length >= 4 && 'وب'.includes(t[0]!)) t = t.slice(1);
  return t;
}

function significantWords(text: string): string[] {
  return text
    .split(/\s+/)
    .map(canonicalWord)
    .filter((w) => w && !STOPWORDS.has(w));
}

/**
 * True when a hint brings no new word compared with hints already given this round
 * ("رز" after "رز ولحم", "الرز" after "رز"). Every hint must add at least one new word.
 */
export function hintRepeats(hint: string, previous: readonly string[]): boolean {
  const words = significantWords(hint);
  if (words.length === 0) return false;
  const used = new Set(previous.flatMap(significantWords));
  return words.every((w) => used.has(w));
}
