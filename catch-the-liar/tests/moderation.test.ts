import { describe, expect, it } from 'vitest';
import { isOffensive } from '../src/server/moderation';

describe('profanity filter', () => {
  it('blocks offensive words, including stretched and spaced-out spellings', () => {
    for (const bad of ['شرموطه', 'يا شرموووطة', 'ش ر م و ط ه', 'كس', 'قحبة', 'منيوك', 'fuck you', 'F*U*C*K', 'sh!t', 'ابن الكلب', 'son of a bitch']) {
      expect(isOffensive(bad), bad).toBe(true);
    }
  });

  it('does not block normal words that merely contain the same letters', () => {
    for (const ok of ['عكس', 'كسلان', 'زبدة', 'زبون', 'ميكانيكي', 'رزق', 'class', 'pass', 'كلب', 'حمار وحشي', 'عكس مكان', 'أبو فهد', 'Sussex', 'أسد الغابة']) {
      expect(isOffensive(ok), ok).toBe(false);
    }
  });
});
