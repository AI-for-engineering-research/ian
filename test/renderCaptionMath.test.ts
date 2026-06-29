import assert from 'node:assert/strict';
import test from 'node:test';
import { renderCaptionMath } from '../src/lib/renderCaptionMath.ts';

test('renders inline dollar math in VegaLite captions with KaTeX', () => {
  const html = renderCaptionMath('Environmental parameters: $T = 225 \\mathrm{K}$ and $p = 300 \\mathrm{hPa}$.');

  assert.match(html, /class="katex"/);
  assert.doesNotMatch(html, /\$T = 225/);
  assert.match(html, /Environmental parameters:/);
});

test('renders multiline caption math and escapes non-math caption text', () => {
  const html = renderCaptionMath('A <caption> with $w \\in \\{0.01, 0.1, 1.0\\}\n\\mathrm{m s^{-1}}$.');

  assert.match(html, /A &lt;caption&gt; with/);
  assert.match(html, /class="katex"/);
  assert.doesNotMatch(html, /\$w \\in/);
});

test('renders parenthesized inline math delimiters', () => {
  const html = renderCaptionMath('Pressure \\(p = 300 \\mathrm{hPa}\\).');

  assert.match(html, /class="katex"/);
  assert.doesNotMatch(html, /\\\\\(p = 300/);
});

test('leaves unmatched math delimiters escaped as literal text', () => {
  const html = renderCaptionMath('Incomplete $T = 225');

  assert.equal(html, 'Incomplete $T = 225');
});
