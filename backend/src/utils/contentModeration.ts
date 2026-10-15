/**
 * Backend Content Moderation Utility for StudyBuddy
 * Filters out vulgar, profane, 18+, adult, pornographic, and harmful terms
 * while preventing false positives on legitimate academic vocabulary (e.g., Data Analytics, Essex, Magna Cum Laude).
 */

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

function normalizeForModeration(input: string): string {
  let text = input.toLowerCase();
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

export function isSafeEducationalContent(text: string): { isSafe: boolean; reason?: string } {
  if (!text || typeof text !== 'string') return { isSafe: true };

  const raw = text.trim().toLowerCase();
  if (!raw) return { isSafe: true };

  if (ACADEMIC_SAFE_WHITELIST.has(raw)) {
    return { isSafe: true };
  }

  const normalized = normalizeForModeration(raw);
  const collapsed = normalized.replace(/[\s._\-\/\\]+/g, '');

  for (const pattern of STRICT_SUBSTRING_PATTERNS) {
    if (normalized.includes(pattern) || collapsed.includes(pattern)) {
      return {
        isSafe: false,
        reason: 'Inappropriate, adult, or vulgar content is strictly prohibited in academic profiles.',
      };
    }
  }

  const words = raw.split(/[\s,./&()+#'"\-_]+/).filter(Boolean);

  for (const restricted of RESTRICTED_WORDS) {
    const termClean = restricted.toLowerCase();

    const wordRegex = new RegExp(`\\b${termClean}\\b`, 'i');
    if (wordRegex.test(raw) || wordRegex.test(normalized)) {
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
