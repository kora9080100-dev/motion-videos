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

describe('mentionsWord (chat)', () => {
  it('catches the secret word as a whole word, with prefixes or spelled out', async () => {
    const { mentionsWord } = await import('../src/shared/text');
    expect(mentionsWord('هي الكبسة أكيد', 'كبسة')).toBe(true);
    expect(mentionsWord('وكبسه', 'كبسة')).toBe(true);
    expect(mentionsWord('ك ب س ة', 'كبسة')).toBe(true);
    expect(mentionsWord('اكيد حمار وحشي', 'حمار وحشي')).toBe(true);
    expect(mentionsWord('شي وحشي', 'حمار وحشي')).toBe(true);
  });

  it('allows normal chat that merely contains the letters', async () => {
    const { mentionsWord } = await import('../src/shared/text');
    expect(mentionsWord('شايف كلامك غريب', 'شاي')).toBe(false);
    expect(mentionsWord('مستمر يكذب', 'تمر')).toBe(false);
    expect(mentionsWord('رجلي تعبت', 'كرة قدم')).toBe(false);
    expect(mentionsWord('هههه', 'كبسة')).toBe(false);
  });
});

describe('hintRepeats', () => {
  it('flags hints that add no new word', async () => {
    const { hintRepeats } = await import('../src/shared/text');
    expect(hintRepeats('رز', ['رز ولحم'])).toBe(true);
    expect(hintRepeats('الرز', ['رز'])).toBe(true);
    expect(hintRepeats('ولحم', ['لحم'])).toBe(true);
    expect(hintRepeats('لحم رز', ['رز ولحم'])).toBe(true);
    expect(hintRepeats('رز بخاري', ['رز ولحم'])).toBe(false);
    expect(hintRepeats('بحر', ['حر'])).toBe(false);
    expect(hintRepeats('مطعم', [])).toBe(false);
  });
});
