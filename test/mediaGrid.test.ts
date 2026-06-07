import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const componentPath = new URL('../src/components/MediaGrid.astro', import.meta.url);
const cssPath = new URL('../src/styles/global.css', import.meta.url);
const overviewPath = new URL('../src/content/project/overview.mdx', import.meta.url);

test('MediaGrid is a slot-only component with configurable layout variables', async () => {
  const source = await readFile(componentPath, 'utf8');

  assert.match(source, /<slot\s*\/>/);
  assert.doesNotMatch(source, /<figcaption|caption\??:|src:\s*string|simulation/i);
  assert.match(source, /layout = 'inline'/);
  assert.match(source, /columns = 3/);
  assert.match(source, /tabletColumns = 2/);
  assert.match(source, /mobileColumns = 1/);
  assert.match(source, /aspectRatio = '4 \/ 3'/);
  assert.match(source, /--media-grid-aspect-ratio/);
});

test('MediaGrid CSS supports wide placement, responsive columns, and opt-in aspect frames', async () => {
  const css = await readFile(cssPath, 'utf8');

  assert.match(css, /\.article-layout > .*\.media-grid--wide.*grid-column: 1 \/ -1/);
  assert.match(css, /grid-template-columns: repeat\(var\(--media-grid-columns, 3\)/);
  assert.match(css, /repeat\(var\(--media-grid-tablet-columns, 2\)/);
  assert.match(css, /repeat\(var\(--media-grid-mobile-columns, 1\)/);
  assert.match(css, /\.media-grid :where\(\.media-grid__frame\)/);
  assert.match(css, /aspect-ratio: var\(--media-grid-aspect-ratio, 4 \/ 3\)/);
  assert.match(css, /\.media-card \{/);
  assert.match(css, /background: white/);
  assert.match(css, /box-shadow: none/);
  assert.match(css, /\.visualization-click-hint/);
  assert.match(css, /@keyframes visualization-click-hint-waggle/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('Project overview demonstrates MediaGrid without moving captions into the grid component', async () => {
  const overview = await readFile(overviewPath, 'utf8');

  assert.match(overview, /import MediaGrid/);
  assert.match(overview, /<MediaGrid layout="wide"/);
  assert.match(overview, /class="media-grid__frame/);
  assert.match(overview, /<figure class="media-card">/);
  assert.match(overview, /<figcaption>Lorenz attractor/);
  assert.doesNotMatch(overview, /placeholder\.svg|Placeholder geometric figure|Research artifact placeholder/);
});
