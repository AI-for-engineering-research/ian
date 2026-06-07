import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  firstUnseenCitationHtml,
  formatCitation,
  formatInlineCitation,
  parseCitationSlot,
  type CitationRenderState,
} from '../src/lib/citations.ts';

const renderStateFor = (): CitationRenderState => ({});

test('parses plain child citation keys and rejects markup', () => {
  assert.deepEqual(parseCitationSlot('  berton-2023  '), ['berton-2023']);
  assert.deepEqual(parseCitationSlot('\n  berton-2023; kaercher-corcos-2025\n'), ['berton-2023', 'kaercher-corcos-2025']);
  assert.throws(() => parseCitationSlot('<em>berton-2023</em>'), /plain text/);
  assert.throws(() => parseCitationSlot('bad key'), /Malformed citation key/);
});

test('formats narrative and parenthetical author-year citations with page locators', () => {
  assert.equal(formatInlineCitation('narrative', ['berton-2023']), 'Berton (2023)');
  assert.equal(formatInlineCitation('narrative', ['berton-2023'], 42), 'Berton (2023, 42)');
  assert.equal(formatInlineCitation('parenthetical', ['berton-2023', 'kaercher-corcos-2025']), '(Berton 2023; Kärcher and Corcos 2025)');
  assert.equal(formatInlineCitation('parenthetical', ['berton-2023'], '42–43'), '(Berton 2023, 42–43)');
});

test('rejects unsupported citation shapes', () => {
  assert.throws(() => formatInlineCitation('narrative', ['berton-2023', 'kaercher-corcos-2025']), /exactly one/);
  assert.throws(() => formatInlineCitation('parenthetical', ['berton-2023', 'kaercher-corcos-2025'], 42), /single-key/);
  assert.throws(() => formatCitation('parenthetical', ['missing-key'], renderStateFor()), /Missing citation key/);
});

test('tracks first citation within one render but resets across render states', () => {
  const firstRender = renderStateFor();
  assert.equal(firstUnseenCitationHtml(firstRender, ['berton-2023']).length, 1);
  assert.equal(firstUnseenCitationHtml(firstRender, ['berton-2023']).length, 0);
  assert.equal(firstUnseenCitationHtml(firstRender, ['berton-2023', 'kaercher-corcos-2025']).length, 1);

  const secondRender = renderStateFor();
  assert.equal(firstUnseenCitationHtml(secondRender, ['berton-2023']).length, 1);
});
