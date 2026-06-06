import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { addLog, parseAddLogArgs } from '../scripts/add-log.ts';

const fixtureJsonl = [
  JSON.stringify({ sessionId: 'session-add-log', id: 'u1', role: 'user', createdAt: '2026-06-06T20:00:00.000Z', content: 'Please fix the failing tests.' }),
  JSON.stringify({ id: 'a1', parentId: 'u1', role: 'assistant', content: [{ type: 'tool_call', id: 'test-1', name: 'bash', arguments: { command: 'npm test' } }] }),
  JSON.stringify({ id: 't1', parentId: 'a1', role: 'tool', content: [{ type: 'tool_result', toolCallId: 'test-1', content: 'tests passed', status: 'success' }] }),
].join('\n');

test('parses the npm add-log CLI options required by TASK-1.5', () => {
  assert.deepEqual(parseAddLogArgs(['session.jsonl', '--slug', '002-fixture', '--title', 'Fixture', '--date', '2026-06-06', '--no-analysis', '--force', '--dry-run', '--model', 'pi-model']), {
    jsonlPath: 'session.jsonl',
    slug: '002-fixture',
    title: 'Fixture',
    date: '2026-06-06',
    noAnalysis: true,
    force: true,
    dryRun: true,
    model: 'pi-model',
  });

  assert.deepEqual(parseAddLogArgs(['session.jsonl', '--slug=002-fixture', '--require-analysis']), {
    jsonlPath: 'session.jsonl',
    slug: '002-fixture',
    requireAnalysis: true,
  });
});

test('imports a JSONL session into private work artifacts, public transcript JSON, and draft MDX after validation', async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), 'add-log-'));
  try {
    const inputPath = path.join(cwd, 'fixture.jsonl');
    await writeFile(inputPath, fixtureJsonl);

    const result = await addLog({
      cwd,
      jsonlPath: inputPath,
      slug: '002-add-log-fixture',
      title: 'Add Log Fixture',
      date: '2026-06-06',
      noAnalysis: true,
      importedAt: '2026-06-06T20:10:00.000Z',
    });

    assert.equal(result.sessionOutputPath, path.join(cwd, 'src/content/sessions/002-add-log-fixture.json'));
    assert.equal(result.logOutputPath, path.join(cwd, 'src/content/log/002-add-log-fixture.mdx'));
    assert.equal(await readFile(path.join(cwd, '.research-log-work/002-add-log-fixture/raw-session.jsonl'), 'utf8'), fixtureJsonl);
    assert.match(await readFile(path.join(cwd, '.research-log-work/002-add-log-fixture/normalized-session.json'), 'utf8'), /"schemaVersion": 1/);
    assert.match(await readFile(path.join(cwd, '.research-log-work/002-add-log-fixture/analysis-result.json'), 'utf8'), /"heuristicHighlights"/);

    const publicTranscript = JSON.parse(await readFile(result.sessionOutputPath, 'utf8'));
    assert.equal(publicTranscript.title, 'Add Log Fixture');
    assert.equal(publicTranscript.source.sessionId, 'session-add-log');
    assert.ok(publicTranscript.highlights.some((highlight: { entries: string[] }) => highlight.entries.includes('entry-2')));

    const mdx = await readFile(result.logOutputPath, 'utf8');
    assert.match(mdx, /^draft: true$/m);
    assert.match(mdx, /^transcript:$/m);
    assert.match(mdx, /Imported at: 2026-06-06T20:10:00.000Z/);
    assert.match(mdx, /\/sessions\/002-add-log-fixture\/#entry-2/);
    assert.match(mdx, /TODO: Decide whether this span supports a claim/);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('dry run validates generated outputs without writing work or public files', async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), 'add-log-dry-run-'));
  try {
    const inputPath = path.join(cwd, 'fixture.jsonl');
    await writeFile(inputPath, fixtureJsonl);

    const result = await addLog({
      cwd,
      jsonlPath: inputPath,
      slug: '003-dry-run',
      title: 'Dry Run',
      noAnalysis: true,
      dryRun: true,
      importedAt: '2026-06-06T20:10:00.000Z',
    });

    assert.equal(result.dryRun, true);
    await assert.rejects(() => access(path.join(cwd, '.research-log-work/003-dry-run/raw-session.jsonl')), /ENOENT/);
    await assert.rejects(() => access(path.join(cwd, 'src/content/sessions/003-dry-run.json')), /ENOENT/);
    await assert.rejects(() => access(path.join(cwd, 'src/content/log/003-dry-run.mdx')), /ENOENT/);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test('does not overwrite existing public files unless force is supplied', async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), 'add-log-force-'));
  try {
    const inputPath = path.join(cwd, 'fixture.jsonl');
    const sessionPath = path.join(cwd, 'src/content/sessions/004-existing.json');
    await writeFile(inputPath, fixtureJsonl);
    await writeFile(sessionPath, '{"existing":true}', { flag: 'wx' }).catch(async (error) => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await import('node:fs/promises').then(({ mkdir }) => mkdir(path.dirname(sessionPath), { recursive: true }));
        await writeFile(sessionPath, '{"existing":true}');
        return;
      }
      throw error;
    });

    await assert.rejects(
      () =>
        addLog({
          cwd,
          jsonlPath: inputPath,
          slug: '004-existing',
          noAnalysis: true,
          importedAt: '2026-06-06T20:10:00.000Z',
        }),
      /--force is required to overwrite/,
    );
    assert.equal(await readFile(sessionPath, 'utf8'), '{"existing":true}');

    await addLog({
      cwd,
      jsonlPath: inputPath,
      slug: '004-existing',
      noAnalysis: true,
      force: true,
      importedAt: '2026-06-06T20:10:00.000Z',
    });
    assert.match(await readFile(sessionPath, 'utf8'), /"schemaVersion": 1/);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
