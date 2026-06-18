import assert from 'node:assert/strict';
import { test } from 'node:test';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkSmartypants from 'remark-smartypants';
import { repairHeadingOpeningQuotes } from '../src/lib/remarkHeadingOpeningQuotes.js';

async function transformedHeadingTexts(markdown: string): Promise<string[]> {
  const processor = unified().use(remarkParse).use(remarkSmartypants).use(repairHeadingOpeningQuotes);
  const tree: any = processor.parse(markdown);
  await processor.run(tree);
  return tree.children
    .filter((node: any) => node.type === 'heading')
    .map((node: any) => node.children.map((child: any) => child.value ?? '').join(''));
}

test('repairs smartypants closing double quotes at the start of repeated headings', async () => {
  assert.deepEqual(
    await transformedHeadingTexts(`## "Please commit the changes"

Text.

## "Please make a backlog issue/task to ..."

Text.

## "Please record that in the project documentation"`),
    [
      '“Please commit the changes”',
      '“Please make a backlog issue/task to …”',
      '“Please record that in the project documentation”',
    ],
  );
});

test('leaves non-heading text that starts with a right double quote untouched', async () => {
  const processor = unified().use(remarkParse).use(remarkSmartypants).use(repairHeadingOpeningQuotes);
  const tree: any = processor.parse(`”Already a right quote.”`);
  await processor.run(tree);

  assert.equal(tree.children[0].children[0].value, '”Already a right quote.”');
});
