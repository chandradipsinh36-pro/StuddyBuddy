import { ALL_DEGREES, ALL_SUBJECTS, POPULAR_SUBJECTS } from '../constants/academicData';

// In-memory cache for external OpenAlex concepts
const openAlexCache = new Map<string, string[]>();

export interface DegreeOption {
  code: string;
  name: string;
  level: string;
  category: string;
  description?: string;
}

// In-memory cache for external Wikidata/OpenAlex degree & topic queries
const degreeApiCache = new Map<string, DegreeOption[]>();

export const academicSearchService = {
  /**
   * Search degrees locally with fuzzy/case-insensitive matching
   */
  searchDegrees(query: string): DegreeOption[] {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      // Return popular degrees first, then the rest
      return ALL_DEGREES.slice(0, 15);
    }

    return ALL_DEGREES.filter((d) => {
      return (
        d.code.toLowerCase().includes(trimmed) ||
        d.name.toLowerCase().includes(trimmed) ||
        d.category.toLowerCase().includes(trimmed)
      );
    });
  },

  /**
   * Live search degrees and specialized qualifications using Wikidata & OpenAlex APIs
   * Recognizes degree prefixes (e.g. B.Sc. in, M.Sc in, Ph.D. in, Diploma in)
   * and queries global academic fields like "Cosmetology and Perfumery".
   */
  async searchDegreesGlobal(query: string): Promise<DegreeOption[]> {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 3) {
      return [];
    }

    const cacheKey = trimmed.toLowerCase();
    if (degreeApiCache.has(cacheKey)) {
      return degreeApiCache.get(cacheKey) || [];
    }

    const options: DegreeOption[] = [];

    // 1. Detect degree prefix pattern: e.g. "B.Sc. in ...", "M.Sc in ...", "Ph.D. in ..."
    const prefixRegex = /^(b\.?sc\.?|b\.?tech\.?|b\.?e\.?|bca|b\.?com\.?|b\.?a\.?|m\.?sc\.?|m\.?tech\.?|m\.?e\.?|mca|mba|ph\.?d\.?|phd|doctorate|doctor of [a-z]+|bachelor of [a-z]+|master of [a-z]+|diploma|pg diploma|associate)(\s+in\s+|\s*[-–:]\s*|\s+)/i;
    const match = trimmed.match(prefixRegex);

    let prefix = '';
    let specialization = trimmed;

    if (match) {
      prefix = match[1].trim();
      specialization = trimmed.substring(match[0].length).trim();
    }

    // Capitalize specialization words nicely
    const formatTitle = (str: string) =>
      str
        .split(' ')
        .map((w) => {
          const lower = w.toLowerCase();
          if (['in', 'and', 'of', '&'].includes(lower)) return lower;
          return w.charAt(0).toUpperCase() + w.slice(1);
        })
        .join(' ');

    const formattedSpecialization = formatTitle(specialization);

    // Standardize prefix if present
    const normalizePrefix = (p: string): { code: string; level: string; category: string } => {
      const lower = p.toLowerCase().replace(/\./g, '');
      if (lower.startsWith('bsc') || lower.startsWith('bachelor of science')) {
        return { code: 'B.Sc.', level: "Bachelor's", category: "Bachelor's Degrees" };
      }
      if (lower.startsWith('btech') || lower.startsWith('be') || lower.startsWith('bachelor of tech')) {
        return { code: 'B.Tech', level: "Bachelor's", category: "Bachelor's Degrees" };
      }
      if (lower.startsWith('bca') || lower.startsWith('bachelor of computer')) {
        return { code: 'BCA', level: "Bachelor's", category: "Bachelor's Degrees" };
      }
      if (lower.startsWith('bcom') || lower.startsWith('bachelor of commerce')) {
        return { code: 'B.Com', level: "Bachelor's", category: "Bachelor's Degrees" };
      }
      if (lower.startsWith('ba') || lower.startsWith('bachelor of arts')) {
        return { code: 'B.A.', level: "Bachelor's", category: "Bachelor's Degrees" };
      }
      if (lower.startsWith('msc') || lower.startsWith('master of science')) {
        return { code: 'M.Sc', level: "Master's", category: "Master's Degrees" };
      }
      if (lower.startsWith('mtech') || lower.startsWith('me') || lower.startsWith('master of tech')) {
        return { code: 'M.Tech', level: "Master's", category: "Master's Degrees" };
      }
      if (lower.startsWith('mca') || lower.startsWith('master of computer')) {
        return { code: 'MCA', level: "Master's", category: "Master's Degrees" };
      }
      if (lower.startsWith('mba') || lower.startsWith('master of business')) {
        return { code: 'MBA', level: "Master's", category: "Master's Degrees" };
      }
      if (lower.startsWith('phd') || lower.startsWith('doctor')) {
        return { code: 'Ph.D.', level: 'Doctorate', category: 'Doctorate & Post-Doctoral' };
      }
      if (lower.startsWith('diploma') || lower.startsWith('pg diploma')) {
        return { code: 'Diploma', level: 'Diploma', category: 'Diplomas & Professional Certifications' };
      }
      return { code: p, level: 'Specialized Degree', category: "Bachelor's Degrees" };
    };

    // If a prefix was explicitly typed by the user, add the exact typed degree first
    if (prefix && formattedSpecialization) {
      const norm = normalizePrefix(prefix);
      options.push({
        code: `${norm.code} in ${formattedSpecialization}`,
        name: `${norm.code} in ${formattedSpecialization}`,
        level: norm.level,
        category: norm.category,
        description: `Specialized degree in ${formattedSpecialization}`,
      });
    }

    // 2. Query Wikidata API for the specialization or full query (CORS enabled, 100% Free)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      // Search terms to query: the specialization, or sub-parts if compound like "Cosmetology and Perfumery"
      const searchTerms = [specialization];
      if (specialization.includes(' and ') || specialization.includes(' & ')) {
        const parts = specialization.split(/\s+(?:and|&)\s+/i);
        searchTerms.push(...parts.filter((p) => p.trim().length > 2));
      }

      for (const term of searchTerms) {
        const wikiRes = await fetch(
          `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
            term.trim()
          )}&language=en&format=json&type=item&origin=*`,
          { signal: controller.signal }
        );

        if (wikiRes.ok) {
          const data = await wikiRes.json();
          if (Array.isArray(data?.search)) {
            data.search.slice(0, 3).forEach((item: any) => {
              const label = item.display?.label?.value || item.label;
              const desc = item.display?.description?.value || item.description || '';
              if (!label) return;

              const titleLabel = formatTitle(label);

              // If user specified prefix (e.g. B.Sc.), generate degree with that prefix
              if (prefix) {
                const norm = normalizePrefix(prefix);
                const fullDegree = `${norm.code} in ${titleLabel}`;
                if (!options.some((o) => o.code.toLowerCase() === fullDegree.toLowerCase())) {
                  options.push({
                    code: fullDegree,
                    name: fullDegree,
                    level: norm.level,
                    category: norm.category,
                    description: desc ? `${desc}` : `Specialized academic qualification`,
                  });
                }
              } else {
                // Generate standard degree options for this recognized field
                const degrees = [
                  { code: `B.Sc. in ${titleLabel}`, level: "Bachelor's", category: "Bachelor's Degrees" },
                  { code: `M.Sc. in ${titleLabel}`, level: "Master's", category: "Master's Degrees" },
                  { code: `Diploma in ${titleLabel}`, level: 'Diploma', category: 'Diplomas & Professional Certifications' },
                  { code: `Ph.D. in ${titleLabel}`, level: 'Doctorate', category: 'Doctorate & Post-Doctoral' },
                ];
                degrees.forEach((d) => {
                  if (!options.some((o) => o.code.toLowerCase() === d.code.toLowerCase())) {
                    options.push({
                      ...d,
                      name: d.code,
                      description: desc ? `${desc}` : undefined,
                    });
                  }
                });
              }
            });
          }
        }
      }

      clearTimeout(timeoutId);
    } catch {
      // Ignore network timeout/error safely
    }

    // 3. If user typed a compound degree like "B.Sc. in Cosmetology and Perfumery", also offer Master's & Diploma variations
    if (prefix && formattedSpecialization) {
      const variations = [
        { code: `M.Sc. in ${formattedSpecialization}`, level: "Master's", category: "Master's Degrees" },
        { code: `Diploma in ${formattedSpecialization}`, level: 'Diploma', category: 'Diplomas & Professional Certifications' },
        { code: `Ph.D. in ${formattedSpecialization}`, level: 'Doctorate', category: 'Doctorate & Post-Doctoral' },
      ];
      variations.forEach((v) => {
        if (!options.some((o) => o.code.toLowerCase() === v.code.toLowerCase())) {
          options.push({
            ...v,
            name: v.code,
            description: `Advanced academic program in ${formattedSpecialization}`,
          });
        }
      });
    }

    // Save to cache
    degreeApiCache.set(cacheKey, options);
    return options;
  },

  /**
   * Search subjects locally with instant matching and token/punctuation normalization
   */
  searchSubjectsLocal(query: string): string[] {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return POPULAR_SUBJECTS;
    }

    const normalizedQuery = trimmed.replace(/[\s._\-\/]/g, '');
    const tokens = trimmed.split(/\s+/).filter(Boolean);

    return ALL_SUBJECTS.filter((s) => {
      const lower = s.toLowerCase();
      const normalizedSubject = lower.replace(/[\s._\-\/]/g, '');

      // 1. Direct substring match
      if (lower.includes(trimmed)) return true;

      // 2. Normalized match (e.g. "reactjs" matches "react.js / react js")
      if (normalizedSubject.includes(normalizedQuery)) return true;

      // 3. Multi-token match (all words in query must be present in subject)
      if (tokens.length > 1 && tokens.every((token) => lower.includes(token))) return true;

      return false;
    });
  },

  /**
   * Live search subjects & programming languages using Wikipedia Opensearch & OpenAlex APIs
   * Covers 100% of global academic disciplines, software frameworks (React, Node, Vue, Next), and programming languages.
   * Falls back seamlessly to local search on any error/timeout.
   */
  async searchSubjectsGlobal(query: string): Promise<string[]> {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      return this.searchSubjectsLocal(query);
    }

    const localMatches = this.searchSubjectsLocal(query);

    // Check memory cache
    const cacheKey = trimmed.toLowerCase();
    if (openAlexCache.has(cacheKey)) {
      const cached = openAlexCache.get(cacheKey) || [];
      return Array.from(new Set([...localMatches, ...cached]));
    }

    const apiResults: string[] = [];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s timeout

      // Query both Wikipedia (for programming frameworks & tech) and OpenAlex (for academic disciplines)
      const [wikiRes, openAlexRes] = await Promise.allSettled([
        fetch(
          `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
            trimmed
          )}&limit=8&namespace=0&format=json&origin=*`,
          { signal: controller.signal }
        ),
        fetch(
          `https://api.openalex.org/concepts?search=${encodeURIComponent(trimmed)}&per-page=6`,
          { signal: controller.signal }
        ),
      ]);
      clearTimeout(timeoutId);

      // Process Wikipedia Opensearch results
      if (wikiRes.status === 'fulfilled' && wikiRes.value.ok) {
        const wikiData = await wikiRes.value.json();
        if (Array.isArray(wikiData) && Array.isArray(wikiData[1])) {
          wikiData[1].forEach((title: any) => {
            if (typeof title === 'string' && title.trim()) {
              const cleanTitle = title.trim();
              if (
                !cleanTitle.toLowerCase().includes('disambiguation') &&
                !cleanTitle.toLowerCase().includes('list of')
              ) {
                apiResults.push(cleanTitle);
              }
            }
          });
        }
      }

      // Process OpenAlex results
      if (openAlexRes.status === 'fulfilled' && openAlexRes.value.ok) {
        const alexData = await openAlexRes.value.json();
        if (Array.isArray(alexData?.results)) {
          alexData.results.forEach((item: any) => {
            if (typeof item?.display_name === 'string' && item.display_name.trim()) {
              apiResults.push(item.display_name.trim());
            }
          });
        }
      }

      if (apiResults.length > 0) {
        openAlexCache.set(cacheKey, apiResults);
      }
    } catch {
      // Fallback silently to local matches on network error/timeout/abort
    }

    return Array.from(new Set([...localMatches, ...apiResults]));
  },
};
