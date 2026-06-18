const rightDoubleQuote = '”';
const leftDoubleQuote = '“';

function firstTextNode(node) {
  if (!node || typeof node !== 'object') return undefined;
  if (node.type === 'text') return node;
  if (!Array.isArray(node.children)) return undefined;

  for (const child of node.children) {
    const textNode = firstTextNode(child);
    if (textNode) return textNode;
  }

  return undefined;
}

export function repairHeadingOpeningQuotes() {
  return (tree) => {
    if (!Array.isArray(tree?.children)) return;

    for (const node of tree.children) {
      if (node?.type !== 'heading') continue;

      const textNode = firstTextNode(node);
      if (typeof textNode?.value !== 'string') continue;
      if (!textNode.value.startsWith(rightDoubleQuote)) continue;

      textNode.value = `${leftDoubleQuote}${textNode.value.slice(rightDoubleQuote.length)}`;
    }
  };
}
