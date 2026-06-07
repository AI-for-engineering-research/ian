#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parsePiJsonlSession, type NormalizedSessionTranscript } from '../src/lib/piSessionParser.ts';
import {
  analyzeSessionWithOptionalPiJson,
  type PiJsonAnalysisRequest,
  type PiJsonAnalysisRunner,
  type SessionAnalysisResult,
  type SessionHighlightCandidate,
} from '../src/lib/sessionAnalysis.ts';

export interface AddLogOptions {
  jsonlPath: string;
  slug: string;
  title?: string;
  date?: string;
  noAnalysis?: boolean;
  requireAnalysis?: boolean;
  force?: boolean;
  dryRun?: boolean;
  model?: string;
  cwd?: string;
  workRoot?: string;
  importedAt?: string;
  piJsonRunner?: PiJsonAnalysisRunner;
}

export interface AddLogResult {
  slug: string;
  dryRun: boolean;
  workDir: string;
  rawSessionPath: string;
  normalizedSessionPath: string;
  analysisResultPath: string;
  sessionOutputPath: string;
  logOutputPath: string;
  transcript: NormalizedSessionTranscript;
  analysis: SessionAnalysisResult;
  mdx: string;
}

interface ParsedCliOptions extends Omit<AddLogOptions, 'jsonlPath'> {
  jsonlPath?: string;
  help?: boolean;
}

const DEFAULT_WORK_ROOT = '.research-log-work';
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const PI_SESSION_FILENAME_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z(?:_|\.jsonl$)/;

export function inferPiSessionStartedAtFromPath(jsonlPath: string): string | undefined {
  const match = path.basename(jsonlPath).match(PI_SESSION_FILENAME_DATE_PATTERN);
  if (!match) return undefined;
  const [, year, month, day, hour, minute, second, millisecond] = match;
  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}.${millisecond}Z`;
  return Number.isNaN(Date.parse(iso)) ? undefined : iso;
}

export async function addLog(options: AddLogOptions): Promise<AddLogResult> {
  const cwd = options.cwd ?? process.cwd();
  validateImportOptions(options);

  const jsonlInputPath = path.resolve(cwd, options.jsonlPath);
  const workRoot = path.resolve(cwd, options.workRoot ?? DEFAULT_WORK_ROOT);
  const workDir = path.join(workRoot, options.slug);
  const rawSessionPath = path.join(workDir, 'raw-session.jsonl');
  const normalizedSessionPath = path.join(workDir, 'normalized-session.json');
  const analysisResultPath = path.join(workDir, 'analysis-result.json');
  const sessionOutputPath = path.join(cwd, 'src', 'content', 'sessions', `${options.slug}.json`);
  const logOutputPath = path.join(cwd, 'src', 'content', 'log', `${options.slug}.mdx`);

  if (!options.force) {
    await assertPublicOutputAvailable(sessionOutputPath, '--force is required to overwrite an existing public transcript JSON file');
    await assertPublicOutputAvailable(logOutputPath, '--force is required to overwrite an existing public research-log MDX file');
  }

  const jsonl = await readFile(jsonlInputPath, 'utf8');
  const title = options.title ?? titleFromSlug(options.slug);
  const transcript = parsePiJsonlSession(jsonl, {
    title,
    importedAt: options.importedAt ?? new Date().toISOString(),
    sessionStartedAt: inferPiSessionStartedAtFromPath(jsonlInputPath),
  });

  const runner = options.noAnalysis ? undefined : options.piJsonRunner ?? piJsonRunnerFromEnvironment();
  if (options.requireAnalysis && !runner) {
    throw new Error('--require-analysis was supplied, but no Pi JSON analysis runner is configured. Set ADD_LOG_PI_JSON_COMMAND or provide a runner.');
  }

  const analysis = await analyzeSessionWithOptionalPiJson(transcript, {
    slug: options.slug,
    workRoot,
    model: options.model,
    piJsonRunner: runner,
    requireAnalysis: options.requireAnalysis,
  });

  const publicTranscript = transcript;
  const mdx = generateDraftMdx({ slug: options.slug, title, date: options.date ?? todayIsoDate(), transcript: publicTranscript, analysis });

  validatePublicTranscript(publicTranscript);
  validateDraftMdx(mdx, options.slug);

  if (!options.dryRun) {
    await mkdir(workDir, { recursive: true });
    await mkdir(path.dirname(sessionOutputPath), { recursive: true });
    await mkdir(path.dirname(logOutputPath), { recursive: true });
    await copyFile(jsonlInputPath, rawSessionPath);
    await writeFile(normalizedSessionPath, `${JSON.stringify(publicTranscript, null, 2)}\n`);
    await writeFile(analysisResultPath, `${JSON.stringify(analysis, null, 2)}\n`);
    await writeFile(sessionOutputPath, `${JSON.stringify(publicTranscript, null, 2)}\n`);
    await writeFile(logOutputPath, mdx);
  }

  return {
    slug: options.slug,
    dryRun: Boolean(options.dryRun),
    workDir,
    rawSessionPath,
    normalizedSessionPath,
    analysisResultPath,
    sessionOutputPath,
    logOutputPath,
    transcript: publicTranscript,
    analysis,
    mdx,
  };
}

export function parseAddLogArgs(argv: string[]): AddLogOptions {
  const parsed: ParsedCliOptions = { slug: '' };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') return { ...parsed, jsonlPath: '', slug: '', help: true } as AddLogOptions & { help: boolean };
    if (arg === '--no-analysis') {
      parsed.noAnalysis = true;
      continue;
    }
    if (arg === '--require-analysis') {
      parsed.requireAnalysis = true;
      continue;
    }
    if (arg === '--force') {
      parsed.force = true;
      continue;
    }
    if (arg === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }
    if (arg.startsWith('--')) {
      const [name, inlineValue] = arg.split('=', 2);
      const value = inlineValue ?? argv[++index];
      if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
      if (name === '--slug') parsed.slug = value;
      else if (name === '--title') parsed.title = value;
      else if (name === '--date') parsed.date = value;
      else if (name === '--model') parsed.model = value;
      else throw new Error(`Unknown option: ${name}`);
      continue;
    }
    if (parsed.jsonlPath) throw new Error(`Unexpected extra argument: ${arg}`);
    parsed.jsonlPath = arg;
  }

  return parsed as AddLogOptions;
}

export function generateDraftMdx({
  slug,
  title,
  date,
  transcript,
  analysis,
}: {
  slug: string;
  title: string;
  date: string;
  transcript: NormalizedSessionTranscript;
  analysis: SessionAnalysisResult;
}): string {
  const spans = analysis.highlights.flatMap((highlight) =>
    highlight.entries.map((entryId) => ({ entryId, label: `${highlight.kind}: ${highlight.title}` })),
  );
  const uniqueSpans = Array.from(new Map(spans.map((span) => [`${span.entryId}:${span.label}`, span])).values());
  const transcriptHref = `/sessions/${slug}/`;
  const highlightSection = analysis.highlights.length > 0 ? renderHighlightSection(slug, analysis.highlights) : renderTodoSection(slug, transcript);

  return `---\ntitle: ${yamlString(title)}\ndate: ${date}\ntags:\n  - agent-logs\nagents:\n  - Pi\ndraft: true\ntranscript:\n  session: ${yamlString(slug)}\n  title: ${yamlString(transcript.title)}\n  href: ${yamlString(transcriptHref)}\n  spans:\n${renderFrontmatterSpans(uniqueSpans)}---\n\n> TODO: Review the generated transcript, redactions, and highlights before publishing.\n\n## Transcript metadata\n\n- Transcript: [${slug}](${transcriptHref})\n- Imported at: ${transcript.source.importedAt}\n- Entries: ${transcript.entries.length}\n- Participants: ${transcript.participants.map((participant) => participant.name).join(', ')}\n- Redaction status: ${transcript.redaction.status}\n- Analysis status: ${analysis.status}\n\n${highlightSection}\n\n## Notes\n\nTODO: Add interpretation, methodological context, and takeaways.\n`;
}

function renderFrontmatterSpans(spans: Array<{ entryId: string; label: string }>): string {
  if (spans.length === 0) return '    []\n';
  return spans.map((span) => `    - entryId: ${yamlString(span.entryId)}\n      label: ${yamlString(span.label)}\n`).join('');
}

function renderHighlightSection(slug: string, highlights: SessionHighlightCandidate[]): string {
  return `## Generated highlight candidates\n\n${highlights
    .map((highlight) => {
      const links = highlight.entries.map((entryId) => `[${entryId}](/sessions/${slug}/#${entryId})`).join(', ');
      return `### ${highlight.title}\n\n- Kind: ${highlight.kind}\n- Confidence: ${highlight.confidence}\n- Source: ${highlight.source}\n- Transcript spans: ${links}\n\n${highlight.summary}\n\nTODO: Decide whether this span supports a claim in the final log entry.`;
    })
    .join('\n\n')}\n`;
}

function renderTodoSection(slug: string, transcript: NormalizedSessionTranscript): string {
  const firstEntry = transcript.entries[0]?.id ?? 'entry-1';
  return `## Highlight TODOs\n\n- TODO: Select noteworthy transcript spans, starting with [${firstEntry}](/sessions/${slug}/#${firstEntry}).\n`;
}

function validateImportOptions(options: AddLogOptions): void {
  if (!options.jsonlPath) throw new Error('A Pi JSONL path is required.');
  if (!options.slug) throw new Error('An explicit --slug value is required.');
  if (!SLUG_PATTERN.test(options.slug)) throw new Error('--slug must contain only lowercase letters, numbers, and hyphens, and start with a letter or number.');
  if (options.date && !/^\d{4}-\d{2}-\d{2}$/.test(options.date)) throw new Error('--date must use YYYY-MM-DD format.');
  if (options.noAnalysis && options.requireAnalysis) throw new Error('--no-analysis and --require-analysis cannot be used together.');
}

async function assertPublicOutputAvailable(filePath: string, message: string): Promise<void> {
  try {
    await access(filePath, fsConstants.F_OK);
    throw new Error(message);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
}

function validatePublicTranscript(transcript: NormalizedSessionTranscript): void {
  if (transcript.schemaVersion !== 1) throw new Error('Generated transcript schemaVersion must be 1.');
  if (!transcript.title.trim()) throw new Error('Generated transcript requires a title.');
  if (transcript.source.kind !== 'pi') throw new Error('Generated transcript source.kind must be pi.');
  if (Number.isNaN(Date.parse(transcript.source.importedAt))) throw new Error('Generated transcript importedAt must be a valid date.');
  if (transcript.source.sessionStartedAt && Number.isNaN(Date.parse(transcript.source.sessionStartedAt))) throw new Error('Generated transcript sessionStartedAt must be a valid date.');
  if (transcript.participants.length === 0) throw new Error('Generated transcript requires participants.');
  if (transcript.entries.length === 0) throw new Error('Generated transcript requires entries.');
  const entryIds = new Set<string>();
  const entryIndexes = new Set<number>();
  for (const entry of transcript.entries) {
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(entry.id)) throw new Error(`Invalid transcript entry id: ${entry.id}`);
    if (entryIds.has(entry.id)) throw new Error(`Duplicate transcript entry id: ${entry.id}`);
    if (entryIndexes.has(entry.index)) throw new Error(`Duplicate transcript entry index: ${entry.index}`);
    if (entry.content.length === 0) throw new Error(`Transcript entry ${entry.id} has no content.`);
    entryIds.add(entry.id);
    entryIndexes.add(entry.index);
  }
}

function validateDraftMdx(mdx: string, slug: string): void {
  if (!/^draft: true$/m.test(mdx)) throw new Error('Generated MDX must be draft: true.');
  if (!mdx.includes(`/sessions/${slug}/`)) throw new Error('Generated MDX must link to the transcript page.');
  if (!/^transcript:$/m.test(mdx)) throw new Error('Generated MDX must include transcript metadata.');
}

function piJsonRunnerFromEnvironment(): PiJsonAnalysisRunner | undefined {
  const command = process.env.ADD_LOG_PI_JSON_COMMAND;
  if (!command) return undefined;
  return async (request: PiJsonAnalysisRequest) => runJsonCommand(command, request);
}

async function runJsonCommand(command: string, request: PiJsonAnalysisRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { shell: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`ADD_LOG_PI_JSON_COMMAND exited with ${code}: ${stderr || stdout}`));
    });
    child.stdin.end(JSON.stringify(request));
  });
}

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

async function main(): Promise<void> {
  const parsed = parseAddLogArgs(process.argv.slice(2)) as AddLogOptions & { help?: boolean };
  if (parsed.help) {
    process.stdout.write(usage());
    return;
  }
  const result = await addLog(parsed);
  const verb = result.dryRun ? 'Validated dry run' : 'Imported';
  process.stdout.write(`${verb} ${result.slug}\n`);
  process.stdout.write(`Transcript: ${path.relative(process.cwd(), result.sessionOutputPath)}\n`);
  process.stdout.write(`Draft log: ${path.relative(process.cwd(), result.logOutputPath)}\n`);
  process.stdout.write(`Work artifacts: ${path.relative(process.cwd(), result.workDir)}\n`);
}

function usage(): string {
  return `Usage: npm run add-log -- <session.jsonl> --slug <slug> [options]\n\nOptions:\n  --slug <slug>          Required public slug for transcript JSON and log MDX\n  --title <title>        Optional title for transcript and draft log\n  --date <YYYY-MM-DD>    Optional log date (defaults to today)\n  --no-analysis          Skip Pi JSON-mode analysis and use heuristic highlights only\n  --require-analysis     Fail if Pi JSON-mode analysis is unavailable or malformed\n  --force                Overwrite existing public transcript/log files\n  --dry-run              Validate and report without writing files\n  --model <model>        Optional model name passed to the Pi JSON analysis runner\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
