import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { test } from 'node:test';
import { renderSafeMarkdown, renderSanitizedMarkdown } from '../src/lib/sanitizedMarkdown.ts';

const execFileAsync = promisify(execFile);

test('renders transcript message Markdown as sanitized HTML without allowing MDX or scripts', () => {
  const html = renderSafeMarkdown("# Heading\n\nHello **world** and [safe](/project/).\n\n<script>alert('x')</script>\n\n[bad](javascript:alert(1))");

  assert.match(html, /<h3>Heading<\/h3>/);
  assert.match(html, /<strong>world<\/strong>/);
  assert.match(html, /<a href="\/project\/">safe<\/a>/);
  assert.match(html, /&lt;script&gt;alert\(&#39;x&#39;\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /javascript:alert/);
});

test('keeps legacy sanitized Markdown export as an alias for the single safe renderer', () => {
  const markdown = 'Alias **check** with [link](https://example.edu).';

  assert.equal(renderSanitizedMarkdown(markdown), renderSafeMarkdown(markdown));
});

test('supports common transcript Markdown blocks and inline code safely', () => {
  const html = renderSafeMarkdown([
    'Intro prose with `const value = "<safe>"`.',
    '',
    '#### Deeper heading',
    '',
    '---',
    '',
    '  - first item',
    '  - second **item**',
    '',
    '  1. ordered item',
    '  2. next ordered item',
    '',
    '> quoted [relative](#entry-1) text',
    '',
    '```ts',
    '<script>alert("inside code fence")</script>',
    '```',
  ].join('\n'));

  assert.match(html, /<p>Intro prose with <code>const value = &quot;&lt;safe&gt;&quot;<\/code>\.<\/p>/);
  assert.match(html, /<h6>Deeper heading<\/h6>/);
  assert.match(html, /<hr>/);
  assert.match(html, /<ul><li>first item<\/li><li>second <strong>item<\/strong><\/li><\/ul>/);
  assert.match(html, /<ol><li>ordered item<\/li><li>next ordered item<\/li><\/ol>/);
  assert.match(html, /<blockquote><p>quoted <a href="#entry-1">relative<\/a> text<\/p><\/blockquote>/);
  assert.match(html, /<pre><code class="language-ts">&lt;script&gt;alert\(&quot;inside code fence&quot;\)&lt;\/script&gt;<\/code><\/pre>/);
  assert.doesNotMatch(html, /<script>/);
});

test('removes unsafe links and escapes raw HTML attributes', () => {
  const html = renderSafeMarkdown([
    '[script](javascript:alert(1))',
    '[data](data:text/html;base64,PHNjcmlwdA==)',
    '[spaced](java\nscript:alert(1))',
    '[external](https://example.edu/path?q=1)',
    '<img src=x onerror="alert(1)">',
  ].join('\n'));

  assert.match(html, /script\)/);
  assert.match(html, /data/);
  assert.match(html, /spaced\)/);
  assert.match(html, /<a href="https:\/\/example\.edu\/path\?q=1">external<\/a>/);
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.doesNotMatch(html, /javascript:/i);
  assert.doesNotMatch(html, /data:text/i);
  assert.doesNotMatch(html, /<img/i);
  assert.doesNotMatch(html, /onerror="alert/);
});

test('Astro build generates session transcript pages with stable anchors and transcript states', async () => {
  await execFileAsync('npm', ['run', 'build'], { timeout: 120_000, maxBuffer: 1024 * 1024 * 20 });

  const html = await readFile('dist/sessions/001-first-session/index.html', 'utf8');
  assert.match(html, /id="entry-1"/);
  assert.match(html, /June 5, 2026 at 8:39 PM UTC/);
  assert.match(html, /class="session-entry session-entry--user"/);
  assert.match(html, /class="session-entry session-entry--assistant"/);
  assert.match(html, /class="session-entry session-entry--tool"/);
  assert.match(html, /Entry 1/);
  assert.match(html, /Entry 2/);
  assert.doesNotMatch(html, />#entry-1</);
  assert.doesNotMatch(html, /Parent source ID/);
  assert.match(html, /Show remaining 2 lines/);
  assert.doesNotMatch(html, /Transcript highlights/);
  assert.doesNotMatch(html, /<h2>Highlights<\/h2>/);
  assert.match(html, /Redaction review required/);
  assert.doesNotMatch(html, /<h2 id="session-transcript-heading">Transcript<\/h2>/);
  assert.doesNotMatch(html, /<dt>Source<\/dt>/);
  assert.doesNotMatch(html, /<dt>Imported<\/dt>/);
  assert.doesNotMatch(html, /<dt>Entries<\/dt>/);
  assert.match(html, /Branch:<\/strong> main/);
  assert.match(html, /Tool call/);
  assert.match(html, /Tool result/);
  assert.match(html, /collapsed output/);
  assert.match(html, /truncated/);
  assert.match(html, /Failure/);
  assert.match(html, /&lt;script&gt;alert\(&#39;no&#39;\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert\('no'\)<\/script>/);
});
