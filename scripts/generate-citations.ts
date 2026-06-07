import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const sourcePath = 'src/data/references.bib';
const outputPath = 'src/data/auto/citations.ts';
const citationKeyPattern = /^[A-Za-z0-9:_-]+$/;

interface BibEntry {
  key: string;
  body: string;
  fields: Record<string, string>;
}

function fail(message: string): never {
  throw new Error(`[generate-citations] ${message}`);
}

function findEntryEnd(input: string, openBraceIndex: number): number {
  let depth = 0;
  for (let index = openBraceIndex; index < input.length; index += 1) {
    const char = input[index];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  fail('Unclosed BibTeX entry.');
}

function parseEntries(input: string): BibEntry[] {
  const entries: BibEntry[] = [];
  const entryPattern = /@([A-Za-z]+)\s*\{\s*([^,\s]+)\s*,/g;
  let match: RegExpExecArray | null;

  while ((match = entryPattern.exec(input)) !== null) {
    const key = match[2];
    const openBraceIndex = input.indexOf('{', match.index);
    const end = findEntryEnd(input, openBraceIndex);
    const bodyStart = match.index + match[0].length;
    const body = input.slice(bodyStart, end);
    entries.push({ key, body, fields: parseFields(body) });
    entryPattern.lastIndex = end + 1;
  }

  if (entries.length === 0) fail(`No BibTeX entries found in ${sourcePath}.`);
  return entries;
}

function parseFields(body: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let index = 0;

  while (index < body.length) {
    while (index < body.length && /[\s,]/.test(body[index])) index += 1;
    const nameMatch = /^[A-Za-z][A-Za-z0-9_-]*/.exec(body.slice(index));
    if (!nameMatch) {
      index += 1;
      continue;
    }

    const name = nameMatch[0].toLowerCase();
    index += nameMatch[0].length;
    while (index < body.length && /\s/.test(body[index])) index += 1;
    if (body[index] !== '=') continue;
    index += 1;
    while (index < body.length && /\s/.test(body[index])) index += 1;

    const { value, nextIndex } = readFieldValue(body, index);
    fields[name] = cleanBibValue(value);
    index = nextIndex;
  }

  return fields;
}

function readFieldValue(input: string, start: number): { value: string; nextIndex: number } {
  if (input[start] === '{') {
    let depth = 0;
    for (let index = start; index < input.length; index += 1) {
      if (input[index] === '{') depth += 1;
      if (input[index] === '}') {
        depth -= 1;
        if (depth === 0) return { value: input.slice(start + 1, index), nextIndex: index + 1 };
      }
    }
    fail('Unclosed braced BibTeX field value.');
  }

  if (input[start] === '"') {
    for (let index = start + 1; index < input.length; index += 1) {
      if (input[index] === '"' && input[index - 1] !== '\\') return { value: input.slice(start + 1, index), nextIndex: index + 1 };
    }
    fail('Unclosed quoted BibTeX field value.');
  }

  const endMatch = /[,\n}]/.exec(input.slice(start));
  const end = endMatch ? start + endMatch.index : input.length;
  return { value: input.slice(start, end), nextIndex: end };
}

function cleanBibValue(value: string): string {
  return value
    .replace(/[{}]/g, '')
    .replace(/\\["'`^~=.uvHckbBdtr]?\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDoiValue(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .trim();
}

function normalizeDoiFields(input: string): string {
  return input.replace(/(doi\s*=\s*)([{"])(.*?)([}"])/gis, (_match, prefix: string, opener: string, value: string, closer: string) => {
    return `${prefix}${opener}${normalizeDoiValue(value)}${closer}`;
  });
}

function firstFourDigitYear(value: string | undefined): string | undefined {
  return value?.match(/\b(\d{4})\b/)?.[1];
}

function labelSource(entry: BibEntry): string {
  const source = entry.fields.author ?? entry.fields.editor ?? entry.fields.organization ?? entry.fields.institution ?? entry.fields.publisher;
  if (!source) fail(`Entry "${entry.key}" must have author, editor, organization, institution, or publisher for inline citations.`);
  return source;
}

function authorLabelFromSource(source: string): string {
  const authors = source.split(/\s+and\s+/i).map((author) => author.trim()).filter(Boolean);
  if (authors.length === 0) fail('Empty citation name source.');
  const surnames = authors.map(surnameFromName);
  if (surnames.length === 1) return surnames[0];
  if (surnames.length === 2) return `${surnames[0]} and ${surnames[1]}`;
  return `${surnames[0]} et al.`;
}

function surnameFromName(name: string): string {
  const cleaned = name.replace(/\s+/g, ' ').trim();
  if (cleaned.includes(',')) return cleaned.split(',')[0].trim();
  const parts = cleaned.split(' ');
  return parts[parts.length - 1];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractFullHtmlByKey(html: string, key: string): string {
  const pattern = new RegExp(`<div id="ref-${escapeRegExp(key)}"[^>]*>\\s*([\\s\\S]*?)\\s*</div>`, 'm');
  const match = pattern.exec(html);
  if (!match) fail(`Pandoc did not produce a bibliography entry for "${key}".`);
  return match[1].trim();
}

function pandocFullReferences(normalizedBib: string): string {
  const workDir = mkdtempSync(path.join(tmpdir(), 'ai-research-citations-'));
  try {
    const bibPath = path.join(workDir, 'references.bib');
    const markdownPath = path.join(workDir, 'references.md');
    writeFileSync(bibPath, normalizedBib);
    writeFileSync(markdownPath, `---\nbibliography: ${bibPath}\nnocite: |\n  @*\n---\n\n::: {#refs}\n:::\n`);
    return execFileSync('pandoc', [markdownPath, '--citeproc', '-t', 'html', '--wrap=none'], { encoding: 'utf8' });
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

function tsString(value: string): string {
  return JSON.stringify(value);
}

function main() {
  const source = readFileSync(sourcePath, 'utf8');
  const normalizedBib = normalizeDoiFields(source);
  const entries = parseEntries(normalizedBib);
  const keys = new Set<string>();

  for (const entry of entries) {
    if (!citationKeyPattern.test(entry.key)) fail(`Entry key "${entry.key}" must match ${citationKeyPattern}.`);
    if (keys.has(entry.key)) fail(`Duplicate BibTeX key "${entry.key}".`);
    keys.add(entry.key);
  }

  const fullHtml = pandocFullReferences(normalizedBib);
  const rows = entries.map((entry) => {
    const year = entry.fields.year ?? firstFourDigitYear(entry.fields.date);
    if (!year) fail(`Entry "${entry.key}" must have a year field or a date containing a four-digit year.`);
    return {
      key: entry.key,
      authorLabel: authorLabelFromSource(labelSource(entry)),
      year,
      fullHtml: extractFullHtmlByKey(fullHtml, entry.key),
    };
  });

  rows.sort((a, b) => a.key.localeCompare(b.key));
  mkdirSync(path.dirname(outputPath), { recursive: true });
  const body = rows
    .map((row) => `  ${tsString(row.key)}: { authorLabel: ${tsString(row.authorLabel)}, year: ${tsString(row.year)}, fullHtml: ${tsString(row.fullHtml)} },`)
    .join('\n');
  writeFileSync(
    outputPath,
    `// Generated by scripts/generate-citations.ts from ${sourcePath}.\n// Do not edit directly.\n\nexport const citations = {\n${body}\n} as const;\n\nexport type CitationKey = keyof typeof citations;\n`,
  );
  console.log(`Generated ${outputPath} with ${rows.length} citation${rows.length === 1 ? '' : 's'}.`);
}

main();
