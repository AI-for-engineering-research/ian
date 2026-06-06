import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { parsePiJsonlSession } from '../src/lib/piSessionParser.ts';
import { analyzeSessionHeuristically, analyzeSessionWithOptionalPiJson } from '../src/lib/sessionAnalysis.ts';

const representativePiJsonlFixture = readFileSync(new URL('./fixtures/pi-session-representative.jsonl', import.meta.url), 'utf8');

function fixtureTranscript() {
  return parsePiJsonlSession(representativePiJsonlFixture, { importedAt: '2026-06-06T20:10:00.000Z' });
}

test('heuristic analysis identifies correction, backtrack, error, failed tool, repeated edit, branch, and verification candidates', () => {
  const highlights = analyzeSessionHeuristically(fixtureTranscript());
  const kinds = new Set(highlights.map((highlight) => highlight.kind));

  assert.equal(kinds.has('correction'), true);
  assert.equal(kinds.has('backtrack'), true);
  assert.equal(kinds.has('error'), true);
  assert.equal(kinds.has('failed_tool'), true);
  assert.equal(kinds.has('repeated_edit'), true);
  assert.equal(kinds.has('branch'), true);
  assert.equal(kinds.has('verification'), true);
  assert.ok(highlights.every((highlight) => highlight.entries.length > 0));
  assert.ok(highlights.every((highlight) => highlight.source === 'heuristic'));
});

test('Pi JSON-mode analysis saves prompt, input, raw output, and parsed artifacts under work root', async () => {
  const workRoot = await mkdtemp(path.join(tmpdir(), 'session-analysis-'));
  try {
    const result = await analyzeSessionWithOptionalPiJson(fixtureTranscript(), {
      slug: '002-analysis-fixture',
      workRoot,
      model: 'pi-json-test-model',
      piJsonRunner: async ({ prompt, transcript, heuristicHighlights, model }) => {
        assert.match(prompt, /Return strict JSON only/);
        assert.equal(transcript.entries.length, 10);
        assert.ok(heuristicHighlights.length > 0);
        assert.equal(model, 'pi-json-test-model');
        return JSON.stringify({
          schemaVersion: 1,
          highlights: [
            {
              id: 'pi-json-verification-1',
              kind: 'verification',
              title: 'Tests were run',
              summary: 'The assistant ran the project test suite after editing.',
              entries: ['entry-6', 'entry-7'],
              confidence: 'high',
            },
          ],
        });
      },
    });

    assert.equal(result.status, 'pi-json');
    assert.equal(result.piJson?.status, 'parsed');
    assert.ok(result.highlights.some((highlight) => highlight.source === 'pi-json'));
    assert.ok(result.piJson?.artifacts?.promptPath.endsWith('.research-log-work/002-analysis-fixture/analysis-prompt.md') || result.piJson?.artifacts?.promptPath.includes('002-analysis-fixture/analysis-prompt.md'));

    const artifacts = result.piJson?.artifacts;
    assert.ok(artifacts?.promptPath);
    assert.ok(artifacts?.inputPath);
    assert.ok(artifacts?.outputPath);
    assert.ok(artifacts?.parsedPath);
    assert.match(await readFile(artifacts.promptPath, 'utf8'), /Version: 1/);
    assert.match(await readFile(artifacts.inputPath, 'utf8'), /heuristicHighlights/);
    assert.match(await readFile(artifacts.outputPath, 'utf8'), /pi-json-verification-1/);
    assert.match(await readFile(artifacts.parsedPath, 'utf8'), /Tests were run/);
  } finally {
    await rm(workRoot, { recursive: true, force: true });
  }
});

test('malformed Pi JSON-mode output falls back to heuristic-only data by default and records the failure', async () => {
  const workRoot = await mkdtemp(path.join(tmpdir(), 'session-analysis-'));
  try {
    const result = await analyzeSessionWithOptionalPiJson(fixtureTranscript(), {
      slug: '003-malformed-fixture',
      workRoot,
      piJsonRunner: async () => 'not json',
    });

    assert.equal(result.status, 'heuristic-fallback');
    assert.equal(result.piJson?.status, 'malformed');
    assert.deepEqual(result.highlights, result.heuristicHighlights);
    assert.ok(result.piJson?.error?.includes('Malformed Pi JSON analysis'));
    assert.ok(result.piJson?.artifacts?.outputPath);
    assert.ok(result.piJson?.artifacts?.errorPath);
    assert.match(await readFile(result.piJson.artifacts.errorPath, 'utf8'), /Malformed Pi JSON analysis/);
  } finally {
    await rm(workRoot, { recursive: true, force: true });
  }
});

test('failed Pi JSON-mode analysis falls back unless analysis is required', async () => {
  const workRoot = await mkdtemp(path.join(tmpdir(), 'session-analysis-'));
  try {
    const fallback = await analyzeSessionWithOptionalPiJson(fixtureTranscript(), {
      slug: '004-failed-fixture',
      workRoot,
      piJsonRunner: async () => {
        throw new Error('Pi provider unavailable');
      },
    });
    assert.equal(fallback.status, 'heuristic-fallback');
    assert.equal(fallback.piJson?.status, 'failed');

    await assert.rejects(
      () =>
        analyzeSessionWithOptionalPiJson(fixtureTranscript(), {
          slug: '005-required-fixture',
          workRoot,
          requireAnalysis: true,
          piJsonRunner: async () => {
            throw new Error('Pi provider unavailable');
          },
        }),
      /Pi provider unavailable/,
    );
  } finally {
    await rm(workRoot, { recursive: true, force: true });
  }
});
