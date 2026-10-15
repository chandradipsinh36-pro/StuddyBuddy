/**
 * Content Moderation Utility for StudyBuddy
 * Filters out vulgar, profane, 18+, adult, pornographic, and harmful terms
 * while preventing false positives on legitimate academic vocabulary (e.g., Data Analytics, Essex, Magna Cum Laude).
 */

// Legitimate academic terms that might contain substrings of sensitive words
const ACADEMIC_SAFE_WHITELIST = new Set([
  'analytics',
  'analyst',
  'analysis',
  'analytical',
  'analyze',
  'assessment',
  'asset',
  'assets',
  'assistant',
  'associate',
  'association',
  'class',
  'classes',
  'classical',
  'classic',
  'classification',
  'pass',
  'passage',
  'passive',
  'passion',
  'compass',
  'compassion',
  'sussex',
  'essex',
  'middlesex',
  'wessex',
  'cum laude',
  'summa cum laude',
  'magna cum laude',
  'dickens',
  'dickinson',
  'cockpit',
  'penetration testing',
  'pen testing',
  'securing',
  'securities',
  'security',
  'document',
  'documentation',
  'title',
  'titled',
  'titles',
  'entity',
  'quantitative',
  'quantity',
  'asphalt',
]);

// Substrings that are NEVER part of legitimate academic disciplines
const STRICT_SUBSTRING_PATTERNS = [
  'porn',
  'porno',
  'pornograph',
  'pornhub',
  'xvideos',
  'redtube',
  'brazzers',
  'onlyfans',
  'fansly',
  'chaturbate',
  'hentai',
  'erotic',
  'blowjob',
  'handjob',
  'deepthroat',
  'titfuck',
  'boobjob',
  'dildo',
  'vibrator',
  'fleshlight',
  'buttplug',
  'striptease',
  'camgirl',
  'incest',
  'pedophil',
  'paedophil',
  'bestiality',
  'beastiality',
  'zoophilia',
  'fellatio',
  'cunnilingus',
  'analingus',
  'gloryhole',
  'creampie',
  'bukkake',
  'sadomasochis',
  'prostitut',
  'brothel',
  'motherfucker',
  'dickhead',
  'masturbat',
  'slut',
  'whore',
  'cunt',
];

// Discrete word boundaries for standalone sensitive / 18+ terms
const RESTRICTED_WORDS = [
  'xxx',
  'sex',
  'sexy',
  'sexx',
  'sexual',
  'sexuality',
  'intercourse',
  'orgasm',
  'escort',
  'escorts',
  'milf',
  'bdsm',
  'penis',
  'vagina',
  'clitoris',
  'nude',
  'nudity',
  'naked',
  'stripper',
  'strippers',
  'playboy',
  'playgirl',
  'adult film',
  'adult movie',
  'adult video',
  'adult entertainment',
  'adult content',
  'sex film',
  'sex movie',
  'sex video',
  'sex worker',
  'sex work',
  'hardcore',
  'softcore',
  'rape',
  'rapist',
  'fetish',
  'swinger',
  'threesome',
  'gangbang',
  'sodomy',
  'boobs',
  'tits',
  'titties',
  'fuck',
  'fucker',
  'fucking',
  'fucked',
  'shit',
  'bullshit',
  'bitch',
  'bitches',
  'asshole',
  'assholes',
  'pussy',
  'cock',
  'cocks',
  'dick',
  'dicks',
  'twat',
  'wanker',
  'bastard',
  'bastards',
  'suicide',
  'kill yourself',
  'terrorist',
  'terrorism',
  'nazi',
  'hitler',
  'cocaine',
  'heroin',
  'methamphetamine',
];

/**
 * Normalizes text to defeat leetspeak and obfuscation tricks
 * e.g., "p0rn" -> "porn", "s.e.x" -> "sex", "f*ck" -> "fuck"
 */
function normalizeForModeration(input: string): string {
  let text = input.toLowerCase();

  // Common leetspeak substitutions
  text = text
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/\$/g, 's')
    .replace(/@/g, 'a')
    .replace(/!/g, 'i')
    .replace(/[*_~`]/g, '');

  return text;
}

/**
 * Validates whether text is clean and appropriate for an academic environment
 */
export function isSafeEducationalContent(text: string): { isSafe: boolean; reason?: string } {
  if (!text || typeof text !== 'string') return { isSafe: true };

  const raw = text.trim().toLowerCase();
  if (!raw) return { isSafe: true };

  // Check if entire input is an explicitly whitelisted academic phrase
  if (ACADEMIC_SAFE_WHITELIST.has(raw)) {
    return { isSafe: true };
  }

  // Normalize for leetspeak checking
  const normalized = normalizeForModeration(raw);
  // Also check without intra-word punctuation: e.g. "p.o.r.n" or "p-o-r-n" -> "porn"
  const collapsed = normalized.replace(/[\s._\-\/\\]+/g, '');

  // 1. Strict substring check on normalized and collapsed text
  for (const pattern of STRICT_SUBSTRING_PATTERNS) {
    if (normalized.includes(pattern) || collapsed.includes(pattern)) {
      return {
        isSafe: false,
        reason: 'Inappropriate, adult, or vulgar content is strictly prohibited in academic profiles.',
      };
    }
  }

  // 2. Discrete word-boundary match on words
  const words = raw.split(/[\s,./&()+#'"\-_]+/).filter(Boolean);

  for (const restricted of RESTRICTED_WORDS) {
    const termClean = restricted.toLowerCase();

    // Check raw boundary
    const wordRegex = new RegExp(`\\b${termClean}\\b`, 'i');
    if (wordRegex.test(raw) || wordRegex.test(normalized)) {
      // Check if it's part of a whitelisted phrase (e.g. "cum laude")
      let isWhitelisted = false;
      for (const safe of ACADEMIC_SAFE_WHITELIST) {
        if (raw.includes(safe)) {
          isWhitelisted = true;
          break;
        }
      }
      if (!isWhitelisted) {
        return {
          isSafe: false,
          reason: 'Inappropriate, adult, or vulgar content is strictly prohibited in academic profiles.',
        };
      }
    }

    // Check individual normalized tokens
    for (const word of words) {
      if (ACADEMIC_SAFE_WHITELIST.has(word)) continue;

      const normWord = normalizeForModeration(word);
      if (normWord === termClean || normWord.replace(/(.)\1+/g, '$1') === termClean) {
        return {
          isSafe: false,
          reason: 'Inappropriate, adult, or vulgar content is strictly prohibited in academic profiles.',
        };
      }
    }

    // Check collapsed punctuation for sensitive keywords
    if (['xxx', 'sex', 'nude', 'fuck', 'shit', 'bitch', 'cunt', 'pussy', 'cock'].includes(termClean)) {
      if (collapsed === termClean || (termClean.length >= 3 && collapsed.includes(termClean))) {
        let isWhitelisted = false;
        for (const safe of ACADEMIC_SAFE_WHITELIST) {
          if (collapsed.includes(safe.replace(/[\s._\-\/\\]+/g, ''))) {
            isWhitelisted = true;
            break;
          }
        }
        if (!isWhitelisted) {
          return {
            isSafe: false,
            reason: 'Inappropriate, adult, or vulgar content is strictly prohibited in academic profiles.',
          };
        }
      }
    }
  }

  return { isSafe: true };
}
