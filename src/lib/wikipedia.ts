const WIKIPEDIA_LANGUAGE_PATTERN = /^[a-z][a-z0-9-]{1,11}$/i;

export interface WikipediaSearchOptions {
  lang?: string;
}

export function wikipediaSearchHref(search: string, options: WikipediaSearchOptions = {}): string {
  const term = normalizeWikipediaSearchTerm(search);

  const lang = options.lang ?? 'en';
  if (!WIKIPEDIA_LANGUAGE_PATTERN.test(lang)) throw new Error(`Invalid Wikipedia language code: ${lang}`);

  return `https://${lang.toLowerCase()}.wikipedia.org/w/index.php?search=${encodeURIComponent(term)}`;
}

export function normalizeWikipediaSearchTerm(search: string): string {
  const term = search.trim().replace(/\s+/g, ' ');
  if (!term) throw new Error('Wikipedia search term must not be empty.');
  return term;
}

export function wikipediaSearchTermFromSlotHtml(html: string): string {
  return normalizeWikipediaSearchTerm(
    html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'"),
  );
}
