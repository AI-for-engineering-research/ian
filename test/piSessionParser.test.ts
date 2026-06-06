import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { parsePiJsonlSession } from '../src/lib/piSessionParser.ts';
import { TOOL_OUTPUT_COLLAPSE_THRESHOLD, TOOL_OUTPUT_TRUNCATE_THRESHOLD } from '../src/lib/transcriptSafety.ts';

const representativePiJsonlFixture = readFileSync(new URL('./fixtures/pi-session-representative.jsonl', import.meta.url), 'utf8');

test('representative Pi JSONL fixture contains only synthetic non-private data', () => {
  assert.doesNotMatch(representativePiJsonlFixture, /\/home\/iross|\/Users\/|ghp_|github_pat_|sk-[A-Za-z0-9_-]{20,}/);
});

test('converts representative Pi JSONL fixture into the normalized transcript schema', () => {
  const transcript = parsePiJsonlSession(representativePiJsonlFixture, {
    title: 'Fixture session',
    importedAt: '2026-06-06T20:10:00.000Z',
  });

  assert.equal(transcript.schemaVersion, 1);
  assert.equal(transcript.title, 'Fixture session');
  assert.equal(transcript.source.sessionId, 'fixture-session-001');
  assert.equal(transcript.source.importedAt, '2026-06-06T20:10:00.000Z');
  assert.deepEqual(
    transcript.participants.map((participant) => participant.role),
    ['user', 'assistant', 'tool', 'system'],
  );
  assert.equal(transcript.entries.length, 10);
  assert.deepEqual(transcript.entries[1].content[1], {
    type: 'tool_call',
    toolCallId: 'call-read',
    name: 'read',
    arguments: { path: 'README.md' },
  });
  assert.deepEqual(transcript.entries[2].content[0], {
    type: 'tool_result',
    toolCallId: 'call-read',
    content: '# Synthetic README fixture',
    status: 'success',
    truncated: false,
  });
  assert.deepEqual(transcript.entries[4].content[0], {
    type: 'tool_result',
    toolCallId: 'edit-1',
    content: 'Patch failed in the synthetic fixture',
    status: 'error',
    truncated: false,
  });
  assert.equal(transcript.entries[5].branch, 'alternate');
  assert.equal(transcript.entries[8].role, 'system');
  assert.match(transcript.entries[8].content[0].type === 'text' ? transcript.entries[8].content[0].text : '', /branch notes were compacted/);
});

test('representative fixture omits thinking and redacts synthetic sensitive-looking values', () => {
  const transcript = parsePiJsonlSession(representativePiJsonlFixture, { importedAt: '2026-06-06T20:10:00.000Z' });

  assert.deepEqual(transcript.entries[1].omissions, [
    { kind: 'thinking', count: 1, reason: 'Thinking content is omitted from public transcripts.' },
  ]);
  assert.equal(JSON.stringify(transcript).includes('Synthetic private reasoning'), false);

  const redactedEntry = transcript.entries[9];
  const textBlock = redactedEntry.content[0];
  assert.equal(textBlock.type, 'text');
  if (textBlock.type === 'text') {
    assert.doesNotMatch(textBlock.text, /\/home\/example-user|not-a-real-token-value/);
    assert.match(textBlock.text, /\[REDACTED_LOCAL_PATH\]/);
    assert.match(textBlock.text, /\[REDACTED_PI_SESSION_PATH\]/);
    assert.match(textBlock.text, /\[REDACTED_ENV:FAKE_API_TOKEN\]/);
  }
  assert.equal(transcript.redaction.status, 'needs_review');
  assert.ok(redactedEntry.redactions?.some((redaction) => redaction.kind === 'environment-value'));
});

test('assigns stable display IDs in render order while preserving source IDs and parents', () => {
  const jsonl = [
    JSON.stringify({ id: 'msg-b', parentId: 'msg-a', role: 'assistant', content: 'second in source tree' }),
    JSON.stringify({ id: 'msg-a', role: 'user', content: 'first rendered entry' }),
  ].join('\n');

  const transcript = parsePiJsonlSession(jsonl, { importedAt: '2026-06-06T20:10:00.000Z' });

  assert.deepEqual(
    transcript.entries.map((entry) => ({ id: entry.id, index: entry.index, sourceId: entry.sourceId, parentId: entry.parentId })),
    [
      { id: 'entry-1', index: 0, sourceId: 'msg-b', parentId: 'msg-a' },
      { id: 'entry-2', index: 1, sourceId: 'msg-a', parentId: undefined },
    ],
  );
});

test('omits thinking blocks from public content and records omission metadata', () => {
  const jsonl = JSON.stringify({
    id: 'assistant-thinking',
    role: 'assistant',
    content: [
      { type: 'thinking', text: 'private chain of thought' },
      { type: 'text', text: 'Public answer.' },
    ],
  });

  const transcript = parsePiJsonlSession(jsonl, { importedAt: '2026-06-06T20:10:00.000Z' });
  const [entry] = transcript.entries;

  assert.deepEqual(entry.content, [{ type: 'text', text: 'Public answer.', format: 'plain' }]);
  assert.deepEqual(entry.omissions, [
    { kind: 'thinking', count: 1, reason: 'Thinking content is omitted from public transcripts.' },
  ]);
  assert.equal(JSON.stringify(entry).includes('private chain of thought'), false);
});

test('redacts sensitive paths, secrets, environment values, and long blobs while preserving email addresses', () => {
  const longBlob = 'a'.repeat(130);
  const jsonl = JSON.stringify({
    role: 'user',
    content:
      `Contact me at teacher@example.edu. Read /home/iross/project/file.ts and /home/iross/.pi/sessions/session.jsonl from /tmp/pi-run. ` +
      `OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456 and token: \"ghp_abcdefghijklmnopqrstuvwxyz123456\" blob ${longBlob}`,
  });

  const transcript = parsePiJsonlSession(jsonl, { importedAt: '2026-06-06T20:10:00.000Z' });
  const [entry] = transcript.entries;
  const [block] = entry.content;

  assert.equal(block.type, 'text');
  assert.match(block.text, /teacher@example\.edu/);
  assert.doesNotMatch(block.text, /\/home\/iross|\/tmp\/pi-run|sk-abcdefghijklmnopqrstuvwxyz|ghp_abcdefghijklmnopqrstuvwxyz|a{96}/);
  assert.match(block.text, /\[REDACTED_LOCAL_PATH\]/);
  assert.match(block.text, /\[REDACTED_PI_SESSION_PATH\]/);
  assert.match(block.text, /\[REDACTED_TEMP_PATH\]/);
  assert.match(block.text, /\[REDACTED_ENV:OPENAI_API_KEY\]/);
  assert.match(block.text, /\[REDACTED_ENV:token\]/);
  assert.match(block.text, /\[REDACTED_LONG_BLOB\]/);
  assert.deepEqual(
    entry.redactions?.map((redaction) => redaction.kind).sort(),
    ['environment-value', 'environment-value', 'long-blob', 'path', 'pi-session-path', 'temporary-path'],
  );
  assert.equal(transcript.redaction.status, 'needs_review');
  assert.equal(transcript.redactionSummary.length, entry.redactions?.length);
  assert.ok(transcript.redaction.reviewNotes.some((note) => note.includes('Automated public-safety pass')));
});

test('redacts sensitive string values inside tool call arguments', () => {
  const jsonl = JSON.stringify({
    role: 'assistant',
    content: [{ type: 'tool_call', id: 'call-1', name: 'bash', arguments: { env: { GITHUB_TOKEN: 'ghp_abcdefghijklmnopqrstuvwxyz123456' }, cwd: '/Users/irene/site' } }],
  });

  const transcript = parsePiJsonlSession(jsonl, { importedAt: '2026-06-06T20:10:00.000Z' });
  const block = transcript.entries[0].content[0];

  assert.equal(block.type, 'tool_call');
  assert.deepEqual(block.arguments, { env: { GITHUB_TOKEN: '[REDACTED_ENV:GITHUB_TOKEN]' }, cwd: '[REDACTED_LOCAL_PATH]' });
});

test('marks medium tool outputs for collapsed rendering without truncating content', () => {
  const output = 'line\n'.repeat(Math.ceil((TOOL_OUTPUT_COLLAPSE_THRESHOLD + 100) / 5));
  const jsonl = JSON.stringify({
    role: 'tool',
    content: [{ type: 'tool_result', toolCallId: 'call-1', content: output, status: 'success' }],
  });

  const transcript = parsePiJsonlSession(jsonl, { importedAt: '2026-06-06T20:10:00.000Z' });
  const [block] = transcript.entries[0].content;

  assert.equal(block.type, 'tool_result');
  assert.equal(block.content, output);
  assert.equal(block.collapsed, true);
  assert.equal(block.truncated, false);
  assert.equal(transcript.redaction.status, 'needs_review');
});

test('truncates oversized tool outputs and records review metadata', () => {
  const largeOutput = `${'line of output\n'.repeat(Math.ceil((TOOL_OUTPUT_TRUNCATE_THRESHOLD + 500) / 15))}END`;
  const jsonl = JSON.stringify({
    role: 'tool',
    content: [{ type: 'tool_result', toolCallId: 'call-1', content: largeOutput, status: 'success' }],
  });

  const transcript = parsePiJsonlSession(jsonl, { importedAt: '2026-06-06T20:10:00.000Z' });
  const [entry] = transcript.entries;
  const [block] = entry.content;

  assert.equal(block.type, 'tool_result');
  assert.equal(block.truncated, true);
  assert.equal(entry.truncated, true);
  assert.ok(block.content.length < largeOutput.length);
  assert.match(block.content, /Tool output truncated:/);
  assert.ok(block.content.endsWith('END'));
  assert.equal(transcript.redaction.status, 'needs_review');
  assert.ok(transcript.redaction.reviewNotes.some((note) => note.includes('Tool outputs over')));
});

test('rejects unsupported HTML inputs with a clear message', () => {
  assert.throws(
    () => parsePiJsonlSession('<!doctype html><html><body>export</body></html>'),
    /HTML exports are not supported.*original JSONL session file/,
  );
});
