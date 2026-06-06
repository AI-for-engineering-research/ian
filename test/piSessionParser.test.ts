import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parsePiJsonlSession } from '../src/lib/piSessionParser.ts';

test('converts valid Pi JSONL into the normalized transcript schema', () => {
  const jsonl = [
    JSON.stringify({
      sessionId: 'session-abc',
      id: 'source-user-1',
      role: 'user',
      createdAt: '2026-06-06T20:00:00.000Z',
      content: 'Please inspect the files.',
    }),
    JSON.stringify({
      id: 'source-assistant-1',
      parentId: 'source-user-1',
      role: 'assistant',
      createdAt: '2026-06-06T20:00:01.000Z',
      branch: 'main',
      content: [
        { type: 'text', text: 'I will inspect them.' },
        { type: 'tool_call', id: 'call-read', name: 'read', arguments: { path: 'README.md' } },
      ],
    }),
    JSON.stringify({
      id: 'source-tool-1',
      parentId: 'source-assistant-1',
      role: 'tool',
      content: [{ type: 'tool_result', toolCallId: 'call-read', content: '# README', status: 'success' }],
    }),
  ].join('\n');

  const transcript = parsePiJsonlSession(jsonl, {
    title: 'Fixture session',
    importedAt: '2026-06-06T20:10:00.000Z',
  });

  assert.equal(transcript.schemaVersion, 1);
  assert.equal(transcript.title, 'Fixture session');
  assert.equal(transcript.source.sessionId, 'session-abc');
  assert.equal(transcript.source.importedAt, '2026-06-06T20:10:00.000Z');
  assert.deepEqual(
    transcript.participants.map((participant) => participant.role),
    ['user', 'assistant', 'tool'],
  );
  assert.equal(transcript.entries.length, 3);
  assert.deepEqual(transcript.entries[1].content[1], {
    type: 'tool_call',
    toolCallId: 'call-read',
    name: 'read',
    arguments: { path: 'README.md' },
  });
  assert.deepEqual(transcript.entries[2].content[0], {
    type: 'tool_result',
    toolCallId: 'call-read',
    content: '# README',
    status: 'success',
    truncated: false,
  });
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

test('rejects unsupported HTML inputs with a clear message', () => {
  assert.throws(
    () => parsePiJsonlSession('<!doctype html><html><body>export</body></html>'),
    /HTML exports are not supported.*original JSONL session file/,
  );
});
