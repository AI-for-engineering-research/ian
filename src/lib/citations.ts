import { citations } from '../data/auto/citations.ts';

export const citationKeyPattern = /^[A-Za-z0-9:_-]+$/;

export type CitationMode = 'narrative' | 'parenthetical';
export type CitationEntry = (typeof citations)[keyof typeof citations];

export interface CitationRenderState {
  __aiResearchCitationsSeen?: Set<string>;
}

export interface FormattedCitation {
  inlineText: string;
  newCitationHtml: string[];
}

export function parseCitationSlot(slotHtml: string): string[] {
  const trimmed = slotHtml.trim();
  if (trimmed.length === 0) throw new Error('Citation component requires a plain-text BibTeX key.');
  if (/[<>]/.test(trimmed)) throw new Error(`Citation component children must be plain text, not HTML: ${trimmed}`);

  const normalized = trimmed
    .split(';')
    .map((key) => key.trim().replace(/\s+/g, ' '))
    .filter(Boolean);

  if (normalized.length === 0) throw new Error('Citation component requires at least one BibTeX key.');

  for (const key of normalized) {
    if (!citationKeyPattern.test(key)) {
      throw new Error(`Malformed citation key "${key}". Keys must match ${citationKeyPattern}.`);
    }
  }

  return normalized;
}

export function assertCitationKeys(keys: string[]): asserts keys is Array<keyof typeof citations> {
  for (const key of keys) {
    if (!(key in citations)) {
      throw new Error(`Missing citation key "${key}". Run npm run citations after adding it to src/data/references.bib.`);
    }
  }
}

export function formatInlineCitation(mode: CitationMode, keys: Array<keyof typeof citations>, page?: string | number): string {
  if (page !== undefined && keys.length !== 1) {
    throw new Error('Citation page locators are only supported for single-key citations.');
  }

  const pageText = page === undefined ? undefined : String(page).trim();
  if (pageText !== undefined && pageText.length === 0) throw new Error('Citation page locator must not be empty.');

  if (mode === 'narrative') {
    if (keys.length !== 1) throw new Error('<Cite> supports exactly one citation key. Use <Citep> for multi-citations.');
    const citation = citations[keys[0]];
    return `${citation.authorLabel} (${citation.year}${pageText ? `, ${pageText}` : ''})`;
  }

  const rendered = keys.map((key) => {
    const citation = citations[key];
    return `${citation.authorLabel} ${citation.year}${pageText ? `, ${pageText}` : ''}`;
  });
  return `(${rendered.join('; ')})`;
}

export function firstUnseenCitationHtml(renderState: CitationRenderState, keys: Array<keyof typeof citations>): string[] {
  const seen = (renderState.__aiResearchCitationsSeen ??= new Set<string>());
  const newCitationHtml: string[] = [];

  for (const key of keys) {
    if (seen.has(key)) continue;
    seen.add(key);
    newCitationHtml.push(citations[key].fullHtml);
  }

  return newCitationHtml;
}

export function formatCitation(mode: CitationMode, keys: string[], renderState: CitationRenderState, page?: string | number): FormattedCitation {
  assertCitationKeys(keys);
  return {
    inlineText: formatInlineCitation(mode, keys, page),
    newCitationHtml: firstUnseenCitationHtml(renderState, keys),
  };
}
