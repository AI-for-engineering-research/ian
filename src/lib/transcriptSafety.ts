import type { NormalizedSessionTranscript, NormalizedTranscriptEntry, TranscriptContentBlock } from './piSessionParser.ts';

// Public transcript safety thresholds: medium tool outputs are marked for collapsed UI rendering,
// while very large outputs are shortened before they can be written to public JSON or LLM prompts.
export const TOOL_OUTPUT_COLLAPSE_THRESHOLD = 4_000;
export const TOOL_OUTPUT_TRUNCATE_THRESHOLD = 12_000;
export const TOOL_OUTPUT_TRUNCATE_HEAD = 8_000;
export const TOOL_OUTPUT_TRUNCATE_TAIL = 2_000;

export type RedactionKind = 'secret' | 'path' | 'pi-session-path' | 'temporary-path' | 'long-blob' | 'environment-value' | 'other';

export interface TranscriptRedaction {
  kind: RedactionKind;
  replacement: string;
  count: number;
}

export interface TranscriptRedactionMetadata {
  status: 'processed' | 'needs_review';
  reviewNotes: string[];
}

interface RedactionCounter {
  counts: Map<string, TranscriptRedaction>;
  add(kind: RedactionKind, replacement: string, count?: number): void;
}

export function processTranscriptForPublicSafety(transcript: NormalizedSessionTranscript): NormalizedSessionTranscript {
  const sessionCounter = createRedactionCounter();
  const entries = transcript.entries.map((entry) => processEntry(entry, sessionCounter));
  const redactionSummary = Array.from(sessionCounter.counts.values());
  const hasCollapsedEntries = entries.some((entry) => entry.content.some((block) => block.type === 'tool_result' && block.collapsed));
  const hasTruncatedEntries = entries.some((entry) => entry.truncated || entry.content.some((block) => block.type === 'tool_result' && block.truncated));
  const hasRedactions = redactionSummary.length > 0;

  return {
    ...transcript,
    entries,
    redactionSummary,
    redaction: {
      status: hasRedactions || hasCollapsedEntries || hasTruncatedEntries ? 'needs_review' : 'processed',
      reviewNotes: buildReviewNotes(hasRedactions, hasCollapsedEntries, hasTruncatedEntries),
    },
  };
}

function processEntry(entry: NormalizedTranscriptEntry, sessionCounter: RedactionCounter): NormalizedTranscriptEntry {
  const entryCounter = createRedactionCounter();
  const content = entry.content.map((block) => processContentBlock(block, entryCounter, sessionCounter));
  const entryRedactions = Array.from(entryCounter.counts.values());
  const truncated = entry.truncated || content.some((block) => block.type === 'tool_result' && block.truncated);

  return {
    ...entry,
    content,
    redactions: entryRedactions,
    truncated,
  };
}

function processContentBlock(block: TranscriptContentBlock, entryCounter: RedactionCounter, sessionCounter: RedactionCounter): TranscriptContentBlock {
  switch (block.type) {
    case 'text':
      return { ...block, text: redactString(block.text, entryCounter, sessionCounter) };
    case 'tool_call':
      return { ...block, ...(block.arguments === undefined ? {} : { arguments: redactUnknown(block.arguments, entryCounter, sessionCounter) }) };
    case 'tool_result': {
      const redactedContent = redactString(block.content, entryCounter, sessionCounter);
      const processedOutput = processToolOutput(redactedContent);
      const collapsed = block.collapsed || processedOutput.collapsed;
      return {
        ...block,
        content: processedOutput.content,
        ...(collapsed ? { collapsed } : {}),
        truncated: block.truncated || processedOutput.truncated,
      };
    }
    case 'error':
      return {
        ...block,
        message: redactString(block.message, entryCounter, sessionCounter),
        ...(block.code ? { code: redactString(block.code, entryCounter, sessionCounter) } : {}),
      };
  }
}

function redactUnknown(value: unknown, entryCounter: RedactionCounter, sessionCounter: RedactionCounter): unknown {
  if (typeof value === 'string') return redactString(value, entryCounter, sessionCounter);
  if (Array.isArray(value)) return value.map((item) => redactUnknown(item, entryCounter, sessionCounter));
  if (!value || typeof value !== 'object') return value;

  const redacted: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (isSuspiciousKey(key) && typeof nested === 'string' && nested.length > 0) {
      const replacement = `[REDACTED_ENV:${key}]`;
      entryCounter.add('environment-value', replacement);
      sessionCounter.add('environment-value', replacement);
      redacted[key] = replacement;
    } else {
      redacted[key] = redactUnknown(nested, entryCounter, sessionCounter);
    }
  }
  return redacted;
}

function redactString(input: string, entryCounter: RedactionCounter, sessionCounter: RedactionCounter): string {
  let output = input;

  output = replaceMatches(output, /\b([A-Z][A-Z0-9_]*(?:API[_-]?KEY|TOKEN|SECRET|PASSWORD|PASSWD|AUTH)[A-Z0-9_]*)\s*=\s*([^\s'\"`]+)/g, 'environment-value', (match) => `[REDACTED_ENV:${match[1]}]`, entryCounter, sessionCounter);
  output = replaceMatches(output, /([\"']?)([A-Za-z0-9_.-]*(?:api[_-]?key|token|secret|password|passwd|auth)[A-Za-z0-9_.-]*)\1\s*:\s*([\"'])([^\"']+)\3/gi, 'environment-value', (match) => `${match[1]}${match[2]}${match[1]}: ${match[3]}[REDACTED_ENV:${match[2]}]${match[3]}`, entryCounter, sessionCounter);
  output = replaceMatches(output, /\b(?:sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}|(?:Bearer\s+)[A-Za-z0-9._~+/-]{20,})\b/g, 'secret', '[REDACTED_SECRET]', entryCounter, sessionCounter);
  output = replaceMatches(output, /(?:~|\/Users\/[A-Za-z0-9._-]+|\/home\/[A-Za-z0-9._-]+|[A-Za-z]:\\Users\\[A-Za-z0-9._-]+)(?:\/.pi\/sessions|\\.pi\\sessions)(?:[^\s'\"`,;)]*)?/g, 'pi-session-path', '[REDACTED_PI_SESSION_PATH]', entryCounter, sessionCounter);
  output = replaceMatches(output, /(?:\/tmp|\/var\/folders|\/private\/tmp|[A-Za-z]:\\(?:Temp|Windows\\Temp))(?:[^\s'\"`,;)]*)?/g, 'temporary-path', '[REDACTED_TEMP_PATH]', entryCounter, sessionCounter);
  output = replaceMatches(output, /(?:~|\/Users\/[A-Za-z0-9._-]+|\/home\/[A-Za-z0-9._-]+|[A-Za-z]:\\Users\\[A-Za-z0-9._-]+)(?:[^\s'\"`,;)]*)?/g, 'path', '[REDACTED_LOCAL_PATH]', entryCounter, sessionCounter);
  output = replaceMatches(output, /\b(?:[A-Fa-f0-9]{64,}|[A-Za-z0-9+/]{96,}={0,2}|[A-Za-z0-9_-]{128,})\b/g, 'long-blob', '[REDACTED_LONG_BLOB]', entryCounter, sessionCounter);

  return output;
}

function replaceMatches(
  input: string,
  pattern: RegExp,
  kind: RedactionKind,
  replacement: string | ((match: RegExpMatchArray) => string),
  entryCounter: RedactionCounter,
  sessionCounter: RedactionCounter,
): string {
  return input.replace(pattern, (...args: unknown[]) => {
    const match = args.slice(0, -2) as RegExpMatchArray;
    const replacementText = typeof replacement === 'string' ? replacement : replacement(match);
    entryCounter.add(kind, replacementText);
    sessionCounter.add(kind, replacementText);
    return replacementText;
  });
}

function processToolOutput(content: string): { content: string; collapsed: boolean; truncated: boolean } {
  if (content.length <= TOOL_OUTPUT_COLLAPSE_THRESHOLD) return { content, collapsed: false, truncated: false };
  if (content.length <= TOOL_OUTPUT_TRUNCATE_THRESHOLD) return { content, collapsed: true, truncated: false };

  const omitted = content.length - TOOL_OUTPUT_TRUNCATE_HEAD - TOOL_OUTPUT_TRUNCATE_TAIL;
  return {
    content: `${content.slice(0, TOOL_OUTPUT_TRUNCATE_HEAD)}\n\n[Tool output truncated: ${omitted} characters omitted. Full private output retained only in the raw session artifact.]\n\n${content.slice(-TOOL_OUTPUT_TRUNCATE_TAIL)}`,
    collapsed: true,
    truncated: true,
  };
}

function createRedactionCounter(): RedactionCounter {
  const counts = new Map<string, TranscriptRedaction>();
  return {
    counts,
    add(kind: RedactionKind, replacement: string, count = 1) {
      const key = `${kind}\u0000${replacement}`;
      const existing = counts.get(key);
      if (existing) {
        existing.count += count;
      } else {
        counts.set(key, { kind, replacement, count });
      }
    },
  };
}

function isSuspiciousKey(key: string): boolean {
  return /(?:api[_-]?key|token|secret|password|passwd|auth|credential|private[_-]?key)/i.test(key);
}

function buildReviewNotes(hasRedactions: boolean, hasCollapsedEntries: boolean, hasTruncatedEntries: boolean): string[] {
  const notes = ['Automated public-safety pass completed. Review generated transcript before publishing.'];
  if (hasRedactions) notes.push('One or more sensitive-looking values were replaced with explicit redaction markers.');
  if (hasCollapsedEntries || hasTruncatedEntries) notes.push(`Tool outputs over ${TOOL_OUTPUT_COLLAPSE_THRESHOLD} characters are marked for collapsed UI rendering; outputs over ${TOOL_OUTPUT_TRUNCATE_THRESHOLD} characters were truncated.`);
  return notes;
}
