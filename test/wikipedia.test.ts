import assert from 'node:assert/strict';
import { test } from 'node:test';
import { wikipediaSearchHref, wikipediaSearchTermFromSlotHtml } from '../src/lib/wikipedia.ts';

test('builds Wikipedia search links like a browser Wikipedia search shortcut', () => {
  assert.equal(
    wikipediaSearchHref('Markov chain Monte Carlo'),
    'https://en.wikipedia.org/w/index.php?search=Markov%20chain%20Monte%20Carlo',
  );
});

test('supports language subdomains and trims search terms', () => {
  assert.equal(
    wikipediaSearchHref('  bifurcation theory  ', { lang: 'de' }),
    'https://de.wikipedia.org/w/index.php?search=bifurcation%20theory',
  );
});

test('uses slot HTML text as a Wikipedia search term', () => {
  assert.equal(wikipediaSearchTermFromSlotHtml('  Monte <em>Carlo</em> &amp; simulation  '), 'Monte Carlo & simulation');
});

test('rejects empty search terms and unsafe language codes', () => {
  assert.throws(() => wikipediaSearchHref('   '), /must not be empty/);
  assert.throws(() => wikipediaSearchTermFromSlotHtml('<strong> </strong>'), /must not be empty/);
  assert.throws(() => wikipediaSearchHref('test', { lang: 'en.evil.example' }), /Invalid Wikipedia language code/);
});
