import { NICKNAME_MAX, NICKNAME_MIN, ROOM_CODE_LENGTH } from './types';

// Control characters, zero-width characters and bidi overrides that could be used to
// spoof names or break the layout.
const UNSAFE_CHARS = /[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁠-⁩﻿]/g;

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
    .replace(/[ً-ٰٟـ]/g, '')
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
