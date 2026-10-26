import { describe, expect, it } from 'vitest';
import { cleanText, hintRevealsWord, isValidRoomCode, normalizeRoomCode, validateNickname } from '../src/shared/text';

describe('text helpers', () => {
  it('cleans unsafe characters and whitespace', () => {
    expect(cleanText('  مرحبا \n\t  بكم‏ ', 20)).toBe('مرحبا بكم');
    expect(cleanText(123, 10)).toBe('');
    expect(cleanText('😀😀😀😀', 2)).toBe('😀😀');
  });

  it('validates nicknames', () => {
    expect(validateNickname('أ').ok).toBe(false);
    expect(validateNickname('أبو فهد').ok).toBe(true);
    expect(validateNickname('x'.repeat(30)).ok).toBe(false);
  });

  it('normalises room codes typed with Arabic digits', () => {
    expect(normalizeRoomCode('٤٥٦ ٧٨٩')).toBe('456789');
    expect(normalizeRoomCode('۱۲۳۴۵۶')).toBe('123456');
    expect(isValidRoomCode('456789')).toBe(true);
    expect(isValidRoomCode('056789')).toBe(false);
    expect(isValidRoomCode('12345')).toBe(false);
  });

  it('detects hints that reveal the word', () => {
    expect(hintRevealsWord('كبسة', 'كبسة')).toBe(true);
    expect(hintRevealsWord('أحب الكبسه', 'كبسة')).toBe(true);
    expect(hintRevealsWord('القهوه', 'القهوة')).toBe(true);
    expect(hintRevealsWord('قهوة', 'القهوة')).toBe(true);
    expect(hintRevealsWord('حمار مخطط', 'حمار وحشي')).toBe(true);
    expect(hintRevealsWord('رز ولحم', 'كبسة')).toBe(false);
    expect(hintRevealsWord('سماء', 'ماء غازي')).toBe(false);
    expect(hintRevealsWord('شاي', 'شاي')).toBe(true);
    expect(hintRevealsWord('مشروب', 'شاي')).toBe(false);
  });
});
