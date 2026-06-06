import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { NormalizedSessionTranscript, NormalizedTranscriptEntry, TranscriptContentBlock } from './piSessionParser.ts';

export const SESSION_ANALYSIS_SCHEMA_VERSION = 1;

export type SessionHighlightKind = 'correction' | 'backtrack' | 'error' | 'failed_tool' | 'repeated_edit' | 'branch' | 'verification';
export type SessionHighlightSource = 'heuristic' | 'pi-json';

export interface SessionHighlightCandidate {
  id: string;
  kind: SessionHighlightKind;
  title: string;
  summary: string;
  entries: string[];
  confidence: 'low' | 'medium' | 'high';
  source: SessionHighlightSource;
}

export interface SessionAnalysisResult {
  schemaVersion: typeof SESSION_ANALYSIS_SCHEMA_VERSION;
  status: 'heuristic-only' | 'pi-json' | 'heuristic-fallback';
  highlights: SessionHighlightCandidate[];
  heuristicHighlights: SessionHighlightCandidate[];
  piJson?: {
    model?: string;
    status: 'not-run' | 'parsed' | 'failed' | 'malformed';
    artifacts?: SessionAnalysisArtifacts;
    error?: string;
  };
}

export interface SessionAnalysisArtifacts {
  promptPath: string;
  inputPath: string;
  outputPath?: string;
  parsedPath?: string;
  errorPath?: string;
}

export interface PiJsonAnalysisRequest {
  prompt: string;
  transcript: NormalizedSessionTranscript;
  heuristicHighlights: SessionHighlightCandidate[];
  model?: string;
}

export type PiJsonAnalysisRunner = (request: PiJsonAnalysisRequest) => Promise<string>;

export interface AnalyzeSessionOptions {
  slug: string;
  workRoot?: string;
  promptPath?: string;
  model?: string;
  piJsonRunner?: PiJsonAnalysisRunner;
  requireAnalysis?: boolean;
}

interface HighlightSeed {
  kind: SessionHighlightKind;
  title: string;
  summary: string;
  entries: string[];
  confidence: 'low' | 'medium' | 'high';
}

const DEFAULT_PROMPT_PATH = path.join(process.cwd(), 'prompts', 'analyze-session-log.md');
const DEFAULT_WORK_ROOT = path.join(process.cwd(), '.research-log-work');

export function analyzeSessionHeuristically(transcript: NormalizedSessionTranscript): SessionHighlightCandidate[] {
  const seeds: HighlightSeed[] = [];
  seeds.push(...detectCorrections(transcript.entries));
  seeds.push(...detectBacktracks(transcript.entries));
  seeds.push(...detectErrors(transcript.entries));
  seeds.push(...detectFailedTools(transcript.entries));
  seeds.push(...detectRepeatedEdits(transcript.entries));
  seeds.push(...detectBranches(transcript.entries));
  seeds.push(...detectVerification(transcript.entries));

  return seeds.map((seed, index) => ({
    id: `heuristic-${seed.kind.replaceAll('_', '-')}-${index + 1}`,
    source: 'heuristic',
    ...seed,
  }));
}

export async function analyzeSessionWithOptionalPiJson(transcript: NormalizedSessionTranscript, options: AnalyzeSessionOptions): Promise<SessionAnalysisResult> {
  const heuristicHighlights = analyzeSessionHeuristically(transcript);

  if (!options.piJsonRunner) {
    return {
      schemaVersion: SESSION_ANALYSIS_SCHEMA_VERSION,
      status: 'heuristic-only',
      highlights: heuristicHighlights,
      heuristicHighlights,
      piJson: { model: options.model, status: 'not-run' },
    };
  }

  const workDir = path.join(options.workRoot ?? DEFAULT_WORK_ROOT, options.slug);
  await mkdir(workDir, { recursive: true });

  const prompt = await readFile(options.promptPath ?? DEFAULT_PROMPT_PATH, 'utf8');
  const artifacts: SessionAnalysisArtifacts = {
    promptPath: path.join(workDir, 'analysis-prompt.md'),
    inputPath: path.join(workDir, 'analysis-input.json'),
  };
  await writeFile(artifacts.promptPath, prompt);
  await writeFile(
    artifacts.inputPath,
    JSON.stringify({ schemaVersion: SESSION_ANALYSIS_SCHEMA_VERSION, transcript, heuristicHighlights }, null, 2),
  );

  try {
    const output = await options.piJsonRunner({ prompt, transcript, heuristicHighlights, model: options.model });
    artifacts.outputPath = path.join(workDir, 'pi-json-output.json');
    await writeFile(artifacts.outputPath, output);

    const parsed = parsePiJsonAnalysis(output);
    artifacts.parsedPath = path.join(workDir, 'parsed-analysis.json');
    await writeFile(artifacts.parsedPath, JSON.stringify(parsed, null, 2));

    const highlights = mergeHighlights(heuristicHighlights, parsed.highlights);
    return {
      schemaVersion: SESSION_ANALYSIS_SCHEMA_VERSION,
      status: 'pi-json',
      highlights,
      heuristicHighlights,
      piJson: { model: options.model, status: 'parsed', artifacts },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    artifacts.errorPath = path.join(workDir, 'analysis-error.txt');
    await writeFile(artifacts.errorPath, message);
    if (options.requireAnalysis) throw error;
    return {
      schemaVersion: SESSION_ANALYSIS_SCHEMA_VERSION,
      status: 'heuristic-fallback',
      highlights: heuristicHighlights,
      heuristicHighlights,
      piJson: {
        model: options.model,
        status: message.startsWith('Malformed Pi JSON analysis') ? 'malformed' : 'failed',
        artifacts,
        error: message,
      },
    };
  }
}

function detectCorrections(entries: NormalizedTranscriptEntry[]): HighlightSeed[] {
  return entries
    .filter((entry) => entry.role === 'user' || entry.role === 'assistant')
    .filter((entry) => /\b(actually|correction|i meant|not what i meant|you're right|you are right|that was wrong|typo|fix that|fix this)\b/i.test(entryText(entry)))
    .map((entry) => ({ kind: 'correction', title: 'Correction or clarification', summary: summarizeEntry(entry), entries: [entry.id], confidence: 'medium' }));
}

function detectBacktracks(entries: NormalizedTranscriptEntry[]): HighlightSeed[] {
  return entries
    .filter((entry) => /\b(backtrack|revert|undo|start over|different approach|instead of|abandon|roll back)\b/i.test(entryText(entry)))
    .map((entry) => ({ kind: 'backtrack', title: 'Backtrack or change of approach', summary: summarizeEntry(entry), entries: [entry.id], confidence: 'medium' }));
}

function detectErrors(entries: NormalizedTranscriptEntry[]): HighlightSeed[] {
  return entries
    .filter((entry) => entry.content.some((block) => block.type === 'error') || /\b(error|exception|traceback|failed|failure|cannot|can't|enoent|eacces)\b/i.test(entryText(entry)))
    .map((entry) => ({ kind: 'error', title: 'Error surfaced in transcript', summary: summarizeEntry(entry), entries: [entry.id], confidence: 'high' }));
}

function detectFailedTools(entries: NormalizedTranscriptEntry[]): HighlightSeed[] {
  return entries
    .filter((entry) => entry.content.some((block) => block.type === 'tool_result' && block.status === 'error'))
    .map((entry) => ({ kind: 'failed_tool', title: 'Failed tool call', summary: summarizeEntry(entry), entries: [entry.id], confidence: 'high' }));
}

function detectRepeatedEdits(entries: NormalizedTranscriptEntry[]): HighlightSeed[] {
  const byPath = new Map<string, string[]>();
  for (const entry of entries) {
    for (const block of entry.content) {
      if (block.type !== 'tool_call' || !/^(edit|write|apply_patch|patch)$/i.test(block.name)) continue;
      const editedPath = extractEditedPath(block);
      if (!editedPath) continue;
      byPath.set(editedPath, [...(byPath.get(editedPath) ?? []), entry.id]);
    }
  }

  return Array.from(byPath.entries())
    .filter(([, entryIds]) => new Set(entryIds).size > 1)
    .map(([editedPath, entryIds]) => ({
      kind: 'repeated_edit',
      title: `Repeated edits to ${editedPath}`,
      summary: `Multiple edit/write tool calls targeted ${editedPath}.`,
      entries: Array.from(new Set(entryIds)),
      confidence: 'high',
    }));
}

function detectBranches(entries: NormalizedTranscriptEntry[]): HighlightSeed[] {
  const branchEntries = entries.filter((entry) => entry.branch || entry.parentId);
  const branchNames = new Set(branchEntries.map((entry) => entry.branch).filter(Boolean));
  const parentCounts = new Map<string, number>();
  for (const entry of entries) if (entry.parentId) parentCounts.set(entry.parentId, (parentCounts.get(entry.parentId) ?? 0) + 1);
  const hasForkedParent = Array.from(parentCounts.values()).some((count) => count > 1);
  if (branchNames.size < 2 && !hasForkedParent) return [];

  return [
    {
      kind: 'branch',
      title: 'Branching conversation structure',
      summary: 'The session includes branch metadata or multiple replies sharing a parent, suggesting alternate conversation paths.',
      entries: branchEntries.map((entry) => entry.id),
      confidence: branchNames.size > 1 || hasForkedParent ? 'high' : 'medium',
    },
  ];
}

function detectVerification(entries: NormalizedTranscriptEntry[]): HighlightSeed[] {
  return entries
    .filter((entry) => entry.content.some(isVerificationBlock) || /\b(tests? pass(?:ed)?|verified|verification|npm test|npm run build|pytest|bun test|full test suite)\b/i.test(entryText(entry)))
    .map((entry) => ({ kind: 'verification', title: 'Notable verification step', summary: summarizeEntry(entry), entries: [entry.id], confidence: 'high' }));
}

function isVerificationBlock(block: TranscriptContentBlock): boolean {
  if (block.type !== 'tool_call') return false;
  const text = `${block.name} ${JSON.stringify(block.arguments ?? {})}`;
  return /\b(npm test|npm run build|astro check|pytest|bun test|pnpm test|yarn test|node --test|vitest|cargo test|go test)\b/i.test(text);
}

function extractEditedPath(block: Extract<TranscriptContentBlock, { type: 'tool_call' }>): string | undefined {
  const args = block.arguments;
  if (!args || typeof args !== 'object' || Array.isArray(args)) return undefined;
  const record = args as Record<string, unknown>;
  for (const key of ['path', 'file', 'filePath', 'target']) {
    if (typeof record[key] === 'string' && record[key].length > 0) return record[key] as string;
  }
  return undefined;
}

function entryText(entry: NormalizedTranscriptEntry): string {
  return entry.content
    .map((block) => {
      if (block.type === 'text') return block.text;
      if (block.type === 'tool_result') return block.content;
      if (block.type === 'error') return `${block.code ?? ''} ${block.message}`;
      return `${block.name} ${JSON.stringify(block.arguments ?? {})}`;
    })
    .join('\n');
}

function summarizeEntry(entry: NormalizedTranscriptEntry): string {
  const text = entryText(entry).replace(/\s+/g, ' ').trim();
  return text.length > 180 ? `${text.slice(0, 177)}...` : text || `Transcript entry ${entry.id}`;
}

function parsePiJsonAnalysis(raw: string): { highlights: SessionHighlightCandidate[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Malformed Pi JSON analysis: ${reason}`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Malformed Pi JSON analysis: top-level value must be an object');
  }

  const highlights = (parsed as { highlights?: unknown }).highlights;
  if (!Array.isArray(highlights)) {
    throw new Error('Malformed Pi JSON analysis: highlights must be an array');
  }

  return { highlights: highlights.map(validatePiHighlight) };
}

function validatePiHighlight(value: unknown, index: number): SessionHighlightCandidate {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Malformed Pi JSON analysis: highlight ${index + 1} must be an object`);
  }
  const record = value as Record<string, unknown>;
  const kind = record.kind;
  const entries = record.entries;
  if (!isHighlightKind(kind)) throw new Error(`Malformed Pi JSON analysis: highlight ${index + 1} has invalid kind`);
  if (typeof record.title !== 'string' || record.title.length === 0) throw new Error(`Malformed Pi JSON analysis: highlight ${index + 1} needs a title`);
  if (typeof record.summary !== 'string' || record.summary.length === 0) throw new Error(`Malformed Pi JSON analysis: highlight ${index + 1} needs a summary`);
  if (!Array.isArray(entries) || entries.length === 0 || !entries.every((entry) => typeof entry === 'string' && entry.length > 0)) {
    throw new Error(`Malformed Pi JSON analysis: highlight ${index + 1} needs entry ids`);
  }
  const confidence = record.confidence === 'low' || record.confidence === 'medium' || record.confidence === 'high' ? record.confidence : 'medium';
  return {
    id: typeof record.id === 'string' && record.id.length > 0 ? record.id : `pi-json-${String(kind).replaceAll('_', '-')}-${index + 1}`,
    kind,
    title: record.title,
    summary: record.summary,
    entries,
    confidence,
    source: 'pi-json',
  };
}

function isHighlightKind(value: unknown): value is SessionHighlightKind {
  return (
    value === 'correction' ||
    value === 'backtrack' ||
    value === 'error' ||
    value === 'failed_tool' ||
    value === 'repeated_edit' ||
    value === 'branch' ||
    value === 'verification'
  );
}

function mergeHighlights(heuristicHighlights: SessionHighlightCandidate[], piHighlights: SessionHighlightCandidate[]): SessionHighlightCandidate[] {
  const seen = new Set<string>();
  const merged: SessionHighlightCandidate[] = [];
  for (const highlight of [...heuristicHighlights, ...piHighlights]) {
    const key = `${highlight.kind}:${highlight.entries.join(',')}:${highlight.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(highlight);
  }
  return merged;
}
