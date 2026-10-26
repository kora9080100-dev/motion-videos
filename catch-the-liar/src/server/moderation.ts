// Basic profanity filter for nicknames and hints (Arabic + English).
// Short words are matched as whole words only (so "كس" doesn't block "عكس" and "ass"
// doesn't block "class"); longer, unambiguous ones are matched inside any word, also when
// stretched ("شرمووووط") or spelled out letter by letter ("ش ر م و ط"). Phrases are
// matched as consecutive words.
// Animal names (كلب، حمار…) are deliberately NOT blocked: they are real game words.
// Repeated Arabic letters are collapsed before matching, so an entry like "انيكك" would
// become "انيك" and also hit "ميكانيكي": keep such entries in WHOLE_WORDS only.
// Extend the lists below as needed.

const WHOLE_WORDS = [
  // Arabic
  'كس', 'زب', 'زبي', 'زبك', 'طيز', 'طيزك', 'طيزي', 'نيك', 'نيكك', 'انيك', 'انيكك', 'نياك', 'لوطي', 'خول', 'عرص',
  // English
  'ass', 'dick', 'cock', 'sex', 'sexy', 'xxx', 'fag', 'tits',
];

const ANYWHERE = [
  // Arabic
  'شرموط', 'شراميط', 'قحبه', 'قحاب', 'منيوك', 'متناك', 'معرص', 'مخنث', 'عاهره', 'داعره', 'دعاره', 'سكس', 'بورنو',
  'كسمك', 'كسامك', 'كسختك', 'كسخت', 'نيكني', 'يلعنك',
  // English
  'fuck', 'fck', 'fuk', 'shit', 'bitch', 'cunt', 'pussy', 'whore', 'slut', 'porn', 'nigger', 'nigga', 'faggot',
  'motherf', 'asshole', 'bastard', 'dickhead', 'penis', 'vagina',
];

const PHRASES = ['كس امك', 'يلعن ابو', 'يلعن امك', 'ابن الكلب', 'بنت الكلب', 'ولد الكلب', 'ابن الحرام', 'بنت الحرام', 'son of a bitch'];

function normalize(input: string): string {
  return (
    input
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      // common look-alike symbols
      .replace(/@/g, 'a')
      .replace(/\$/g, 's')
      .replace(/0/g, 'o')
      .replace(/!/g, 'i')
      // collapse stretched Arabic letters: شرمووووط → شرموط
      .replace(/([\u0600-\u06FF])\1+/g, '$1')
  );
}

const tokenize = (s: string) => normalize(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const wholeSet = new Set(WHOLE_WORDS.flatMap(tokenize));
const anywhereList = ANYWHERE.map(normalize);
const phraseList = PHRASES.map((p) => ` ${tokenize(p).join(' ')} `);

/** True when the text contains an offensive word. */
export function isOffensive(text: string): boolean {
  const tokens = tokenize(text);
  if (tokens.some((t) => wholeSet.has(t))) return true;
  const chunks = [...tokens];
  // Letters typed with spaces between them: check them glued back together too.
  if (tokens.filter((t) => Array.from(t).length === 1).length >= 3) chunks.push(tokens.join(''));
  if (chunks.some((c) => anywhereList.some((w) => c.includes(w)))) return true;
  const spaced = ` ${tokens.join(' ')} `;
  return phraseList.some((p) => spaced.includes(p));
}
