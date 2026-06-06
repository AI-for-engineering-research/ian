import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { test } from 'node:test';
import { renderSanitizedMarkdown } from '../src/lib/sanitizedMarkdown.ts';

const execFileAsync = promisify(execFile);

test('renders transcript message Markdown as sanitized HTML without allowing MDX or scripts', () => {
  const html = renderSanitizedMarkdown("# Heading\n\nHello **world** and [safe](/project/).\n\n<script>alert('x')</script>\n\n[bad](javascript:alert(1))");

  assert.match(html, /<h3>Heading<\/h3>/);
  assert.match(html, /<strong>world<\/strong>/);
  assert.match(html, /<a href="\/project\/">safe<\/a>/);
  assert.match(html, /&lt;script&gt;alert\(&#39;x&#39;\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /javascript:alert/);
});

test('Astro build generates session transcript pages with stable anchors and transcript states', async () => {
  await execFileAsync('npm', ['run', 'build'], { timeout: 120_000, maxBuffer: 1024 * 1024 * 20 });

  const html = await readFile('dist/sessions/001-first-session/index.html', 'utf8');
  assert.match(html, /id="entry-1"/);
  assert.match(html, /href="\/sessions\/001-first-session\/#entry-2"/);
  assert.match(html, /Redaction review required/);
  assert.match(html, /Branch:<\/strong> main/);
  assert.match(html, /Tool call/);
  assert.match(html, /Tool result/);
  assert.match(html, /collapsed output/);
  assert.match(html, /truncated/);
  assert.match(html, /Failure/);
  assert.match(html, /&lt;script&gt;alert\(&#39;no&#39;\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert\('no'\)<\/script>/);
});
