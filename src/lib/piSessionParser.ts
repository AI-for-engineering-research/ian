import { processTranscriptForPublicSafety } from './transcriptSafety.ts';
import type { TranscriptRedaction, TranscriptRedactionMetadata } from './transcriptSafety.ts';

export type TranscriptRole = 'user' | 'assistant' | 'system' | 'tool';
export type TranscriptContentBlock =
  | { type: 'text'; text: string; format?: 'markdown' | 'plain' }
  | { type: 'tool_call'; toolCallId: string; name: string; arguments?: unknown }
  | { type: 'tool_result'; toolCallId: string; content: string; status?: 'success' | 'error'; truncated?: boolean; collapsed?: boolean }
  | { type: 'error'; message: string; code?: string };

export interface TranscriptOmission {
  kind: 'thinking';
  count: number;
  reason: string;
}

export interface NormalizedTranscriptEntry {
  id: string;
  index: number;
  role: TranscriptRole;
  source?: 'pi' | 'importer';
  sourceId?: string;
  createdAt?: string;
  parentId?: string;
  branch?: string;
  title?: string;
  content: TranscriptContentBlock[];
  omissions?: TranscriptOmission[];
  redactions?: TranscriptRedaction[];
  truncated?: boolean;
}

export interface NormalizedSessionTranscript {
  schemaVersion: 1;
  title: string;
  summary?: string;
  source: {
    kind: 'pi';
    sessionId?: string;
    importedAt: string;
  };
  participants: Array<{ id: string; name: string; role: TranscriptRole }>;
  entries: NormalizedTranscriptEntry[];
  highlights: unknown[];
  redactionSummary: TranscriptRedaction[];
  redaction: TranscriptRedactionMetadata;
}

export interface ParsePiJsonlOptions {
  title?: string;
  summary?: string;
  sessionId?: string;
  importedAt?: string | Date;
}

interface ParsedRecord {
  raw: Record<string, unknown>;
  lineNumber: number;
}

const ROLE_BY_AUTHOR: Record<string, TranscriptRole> = {
  human: 'user',
  user: 'user',
  assistant: 'assistant',
  ai: 'assistant',
  system: 'system',
  tool: 'tool',
};

export function parsePiJsonlSession(jsonl: string, options: ParsePiJsonlOptions = {}): NormalizedSessionTranscript {
  if (looksLikeHtml(jsonl)) {
    throw new Error('Unsupported Pi session input: HTML exports are not supported. Please provide the original JSONL session file.');
  }

  const records = parseJsonlRecords(jsonl);
  const entries = assignStableEntryIds(records.flatMap((record) => normalizeRecord(record)));

  if (entries.length === 0) {
    throw new Error('No transcript entries found in Pi JSONL input.');
  }

  const importedAt = options.importedAt instanceof Date ? options.importedAt.toISOString() : options.importedAt;

  return processTranscriptForPublicSafety({
    schemaVersion: 1,
    title: options.title ?? inferTitle(entries),
    ...(options.summary ? { summary: options.summary } : {}),
    source: {
      kind: 'pi',
      ...(options.sessionId ? { sessionId: options.sessionId } : inferSessionId(records)),
      importedAt: importedAt ?? new Date().toISOString(),
    },
    participants: inferParticipants(entries),
    entries,
    highlights: [],
    redactionSummary: [],
    redaction: { status: 'processed', reviewNotes: [] },
  });
}

function parseJsonlRecords(jsonl: string): ParsedRecord[] {
  return jsonl
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter(({ line }) => line.length > 0)
    .map(({ line, lineNumber }) => {
      try {
        const raw = JSON.parse(line);
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
          throw new Error('record is not an object');
        }
        return { raw: raw as Record<string, unknown>, lineNumber };
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid Pi JSONL at line ${lineNumber}: ${reason}`);
      }
    });
}

function normalizeRecord(record: ParsedRecord): NormalizedTranscriptEntry[] {
  const message = objectValue(record.raw.message) ?? objectValue(record.raw.record) ?? record.raw;
  const role =
    normalizeRole(firstString(message.role, record.raw.role, message.author, record.raw.author, message.type, record.raw.type)) ??
    (isCompactionRecord(message, record.raw) ? 'system' : undefined);

  if (!role) return [];

  const content: TranscriptContentBlock[] = [];

  const rawContent = message.content ?? message.parts ?? message.blocks ?? message.text ?? message.markdown;
  collectContentBlocks(rawContent, content);

  collectToolCalls(message.tool_calls ?? message.toolCalls ?? record.raw.tool_calls ?? record.raw.toolCalls, content);
  collectToolResults(message.tool_results ?? message.toolResults ?? record.raw.tool_results ?? record.raw.toolResults, content);
  collectError(message.error ?? record.raw.error, content);

  const branch = firstString(message.branch, message.branchId, record.raw.branch, record.raw.branchId);
  const compactionNote = firstString(message.compactionNote, record.raw.compactionNote, message.summary, record.raw.summary);
  if (compactionNote && isCompactionRecord(message, record.raw)) {
    content.push({ type: 'text', text: compactionNote, format: 'plain' });
  }

  if (content.length === 0) return [];

  const index = -1; // assigned after filtering so IDs are stable in render order
  const entry: NormalizedTranscriptEntry = {
    id: '',
    index,
    role,
    source: 'pi',
    ...sourceIdFields(message, record.raw),
    ...timestampField(message, record.raw),
    ...(branch ? { branch } : {}),
    ...titleField(message, record.raw),
    content,
    omissions: [],
    redactions: [],
    truncated: false,
  };

  return [entry];
}

function collectContentBlocks(rawContent: unknown, content: TranscriptContentBlock[]): void {
  if (typeof rawContent === 'string') {
    if (rawContent.length > 0) content.push({ type: 'text', text: rawContent, format: 'markdown' });
    return;
  }

  if (!Array.isArray(rawContent)) return;

  for (const block of rawContent) {
    if (typeof block === 'string') {
      if (block.length > 0) content.push({ type: 'text', text: block, format: 'markdown' });
      continue;
    }

    const obj = objectValue(block);
    if (!obj) continue;

    const type = firstString(obj.type, obj.kind, obj.name)?.toLowerCase();
    if (type && ['thinking', 'reasoning', 'thought', 'chain_of_thought'].includes(type)) {
      continue;
    }

    if (type && ['text', 'markdown', 'message'].includes(type)) {
      const text = firstString(obj.text, obj.content, obj.markdown);
      if (text) content.push({ type: 'text', text, format: type === 'text' ? 'plain' : 'markdown' });
      continue;
    }

    if (type && ['tool_call', 'tool_use', 'function_call'].includes(type)) {
      content.push({
        type: 'tool_call',
        toolCallId: firstString(obj.id, obj.toolCallId, obj.tool_call_id, obj.callId) ?? stableOpaqueId('tool-call', content.length),
        name: firstString(obj.tool, obj.name, obj.functionName) ?? 'unknown_tool',
        ...(obj.arguments !== undefined ? { arguments: obj.arguments } : obj.input !== undefined ? { arguments: obj.input } : {}),
      });
      continue;
    }

    if (type && ['tool_result', 'tool_response'].includes(type)) {
      content.push({
        type: 'tool_result',
        toolCallId: firstString(obj.toolCallId, obj.tool_call_id, obj.callId, obj.id) ?? stableOpaqueId('tool-result', content.length),
        content: stringifyPublicValue(obj.content ?? obj.output ?? obj.result ?? ''),
        status: firstString(obj.status) === 'error' || obj.error ? 'error' : 'success',
        truncated: false,
      });
    }
  }
}

function collectToolCalls(rawCalls: unknown, content: TranscriptContentBlock[]): void {
  const calls = Array.isArray(rawCalls) ? rawCalls : rawCalls ? [rawCalls] : [];
  for (const call of calls) {
    const obj = objectValue(call);
    if (!obj) continue;
    content.push({
      type: 'tool_call',
      toolCallId: firstString(obj.id, obj.toolCallId, obj.tool_call_id, obj.callId) ?? stableOpaqueId('tool-call', content.length),
      name: firstString(obj.name, obj.tool, obj.functionName) ?? 'unknown_tool',
      ...(obj.arguments !== undefined ? { arguments: obj.arguments } : obj.input !== undefined ? { arguments: obj.input } : {}),
    });
  }
}

function collectToolResults(rawResults: unknown, content: TranscriptContentBlock[]): void {
  const results = Array.isArray(rawResults) ? rawResults : rawResults ? [rawResults] : [];
  for (const result of results) {
    const obj = objectValue(result);
    if (!obj) continue;
    content.push({
      type: 'tool_result',
      toolCallId: firstString(obj.toolCallId, obj.tool_call_id, obj.callId, obj.id) ?? stableOpaqueId('tool-result', content.length),
      content: stringifyPublicValue(obj.content ?? obj.output ?? obj.result ?? ''),
      status: firstString(obj.status) === 'error' || obj.error ? 'error' : 'success',
      truncated: false,
    });
  }
}

function collectError(rawError: unknown, content: TranscriptContentBlock[]): void {
  if (!rawError) return;
  const obj = objectValue(rawError);
  if (!obj) {
    content.push({ type: 'error', message: String(rawError) });
    return;
  }
  content.push({
    type: 'error',
    message: firstString(obj.message, obj.error, obj.detail) ?? stringifyPublicValue(obj),
    ...(firstString(obj.code) ? { code: firstString(obj.code) } : {}),
  });
}

function sourceIdFields(message: Record<string, unknown>, raw: Record<string, unknown>): Pick<NormalizedTranscriptEntry, 'sourceId' | 'parentId'> {
  const sourceId = firstString(message.id, message.uuid, message.messageId, message.message_id, raw.id, raw.uuid, raw.messageId, raw.message_id);
  const parentId = firstString(message.parentId, message.parent_id, message.parentUuid, message.parent_uuid, raw.parentId, raw.parent_id, raw.parentUuid, raw.parent_uuid);
  return { ...(sourceId ? { sourceId } : {}), ...(parentId ? { parentId } : {}) };
}

function timestampField(message: Record<string, unknown>, raw: Record<string, unknown>): Pick<NormalizedTranscriptEntry, 'createdAt'> {
  const value = firstString(message.createdAt, message.created_at, message.timestamp, message.time, raw.createdAt, raw.created_at, raw.timestamp, raw.time);
  if (!value) return {};
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? {} : { createdAt: date.toISOString() };
}

function titleField(message: Record<string, unknown>, raw: Record<string, unknown>): Pick<NormalizedTranscriptEntry, 'title'> {
  const title = firstString(message.title, raw.title, message.event, raw.event);
  return title ? { title } : {};
}

function inferParticipants(entries: NormalizedTranscriptEntry[]): NormalizedSessionTranscript['participants'] {
  const seen = new Set<TranscriptRole>();
  const participants: NormalizedSessionTranscript['participants'] = [];
  for (const entry of entries) {
    if (seen.has(entry.role)) continue;
    seen.add(entry.role);
    participants.push({ id: entry.role, name: participantName(entry.role), role: entry.role });
  }
  return participants;
}

function inferTitle(entries: NormalizedTranscriptEntry[]): string {
  const firstText = entries.flatMap((entry) => entry.content).find((block) => block.type === 'text');
  if (firstText?.type === 'text' && firstText.text.trim()) {
    return firstText.text.trim().replace(/\s+/g, ' ').slice(0, 80);
  }
  return 'Imported Pi session transcript';
}

function inferSessionId(records: ParsedRecord[]): { sessionId?: string } {
  for (const { raw } of records) {
    const sessionId = firstString(raw.sessionId, raw.session_id, objectValue(raw.session)?.id);
    if (sessionId) return { sessionId };
  }
  return {};
}

function normalizeRole(value: string | undefined): TranscriptRole | undefined {
  if (!value) return undefined;
  return ROLE_BY_AUTHOR[value.toLowerCase()];
}

function participantName(role: TranscriptRole): string {
  return role === 'assistant' ? 'Pi' : role[0].toUpperCase() + role.slice(1);
}

function looksLikeHtml(input: string): boolean {
  return /^\s*(?:<!doctype\s+html|<html[\s>]|<head[\s>]|<body[\s>])/i.test(input);
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) return value;
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function stringifyPublicValue(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

function stableOpaqueId(prefix: string, index: number): string {
  return `${prefix}-${index + 1}`;
}

function isCompactionRecord(message: Record<string, unknown>, raw: Record<string, unknown>): boolean {
  const type = firstString(message.type, message.kind, raw.type, raw.kind)?.toLowerCase();
  return type === 'compaction' || type === 'summary' || Boolean(message.compactionNote ?? raw.compactionNote);
}

export function assignStableEntryIds(entries: NormalizedTranscriptEntry[]): NormalizedTranscriptEntry[] {
  return entries.map((entry, index) => ({ ...entry, id: `entry-${index + 1}`, index }));
}
