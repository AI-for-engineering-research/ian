import katex from 'katex';

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function findUnescapedDollar(text: string, start: number): number {
  for (let i = start; i < text.length; i += 1) {
    if (text[i] !== '$') continue;

    let backslashCount = 0;
    for (let j = i - 1; j >= 0 && text[j] === '\\'; j -= 1) {
      backslashCount += 1;
    }

    if (backslashCount % 2 === 0) return i;
  }

  return -1;
}

function renderInlineMath(math: string): string {
  return katex.renderToString(math, {
    displayMode: false,
    throwOnError: false,
    strict: false,
  });
}

export function renderCaptionMath(caption: string): string {
  let html = '';
  let cursor = 0;

  while (cursor < caption.length) {
    const dollarStart = findUnescapedDollar(caption, cursor);
    const parenStart = caption.indexOf('\\(', cursor);

    const starts = [
      dollarStart === -1 ? undefined : { index: dollarStart, delimiter: '$' as const },
      parenStart === -1 ? undefined : { index: parenStart, delimiter: '\\(' as const },
    ].filter((start): start is { index: number; delimiter: '$' | '\\(' } => Boolean(start));

    starts.sort((a, b) => a.index - b.index);
    const start = starts[0];

    if (!start) {
      html += escapeHtml(caption.slice(cursor));
      break;
    }

    html += escapeHtml(caption.slice(cursor, start.index));

    if (start.delimiter === '$') {
      const end = findUnescapedDollar(caption, start.index + 1);
      if (end === -1) {
        html += escapeHtml(caption.slice(start.index));
        break;
      }
      html += renderInlineMath(caption.slice(start.index + 1, end));
      cursor = end + 1;
    } else {
      const end = caption.indexOf('\\)', start.index + 2);
      if (end === -1) {
        html += escapeHtml(caption.slice(start.index));
        break;
      }
      html += renderInlineMath(caption.slice(start.index + 2, end));
      cursor = end + 2;
    }
  }

  return html;
}
