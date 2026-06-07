import path from 'node:path';
import { parse } from 'acorn';
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

const globalMdxComponents = [
  ['Cite', 'src/components/Cite.astro'],
  ['Citep', 'src/components/Citep.astro'],
  ['Figure', 'src/components/Figure.astro'],
  ['MarginNote', 'src/components/MarginNote.astro'],
  ['MediaGrid', 'src/components/MediaGrid.astro'],
  ['Sidenote', 'src/components/Sidenote.astro'],
  ['Wikipedia', 'src/components/Wikipedia.astro'],
];

function remarkGlobalMdxComponents() {
  return (tree, file) => {
    const filePath = String(file.path ?? '');
    if (!filePath.endsWith('.mdx')) return;

    const existingEsm = tree.children.filter((child) => child.type === 'mdxjsEsm').map((child) => child.value).join('\n');
    const componentsToInject = globalMdxComponents.filter(([name]) => !new RegExp(`\\b${name}\\b`).test(existingEsm));
    if (componentsToInject.length === 0) return;

    const fileDir = path.dirname(filePath);
    const imports = componentsToInject
      .map(([name, componentPath]) => {
        let relativePath = path.relative(fileDir, path.resolve(componentPath)).replaceAll(path.sep, '/');
        if (!relativePath.startsWith('.')) relativePath = `./${relativePath}`;
        return `import ${name} from '${relativePath}';`;
      })
      .join('\n');
    const componentNames = componentsToInject.map(([name]) => name).join(', ');
    const value = `${imports}\nexport const components = { ${componentNames} };`;

    tree.children.unshift({
      type: 'mdxjsEsm',
      value,
      data: { estree: parse(value, { ecmaVersion: 'latest', sourceType: 'module' }) },
    });
  };
}

export default defineConfig({
  output: 'static',
  markdown: {
    processor: unified({
      remarkPlugins: [remarkGlobalMdxComponents, remarkMath],
      rehypePlugins: [rehypeKatex],
      shikiConfig: { theme: 'github-light' },
    }),
  },
  integrations: [mdx()],
});
