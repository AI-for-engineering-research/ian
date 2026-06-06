const ESCAPE_LOOKUP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ESCAPE_LOOKUP[character] ?? character);
}

export function renderSanitizedMarkdown(markdown: string): string {
  const normalized = markdown.replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');
  const html: string[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let blockquote: string[] = [];
  let inCodeFence = false;
  let codeFenceLanguage = '';
  let codeFenceLines: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    html.push(`<p>${renderInline(paragraph.join('\n'))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    html.push(`<ul>${listItems.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`);
    listItems = [];
  };

  const flushBlockquote = () => {
    if (blockquote.length === 0) return;
    html.push(`<blockquote>${renderSanitizedMarkdown(blockquote.join('\n'))}</blockquote>`);
    blockquote = [];
  };

  const flushCodeFence = () => {
    const languageClass = codeFenceLanguage ? ` class="language-${escapeHtml(codeFenceLanguage)}"` : '';
    html.push(`<pre><code${languageClass}>${escapeHtml(codeFenceLines.join('\n'))}</code></pre>`);
    inCodeFence = false;
    codeFenceLanguage = '';
    codeFenceLines = [];
  };

  for (const line of lines) {
    const fence = line.match(/^```\s*([A-Za-z0-9_-]*)\s*$/);
    if (fence) {
      if (inCodeFence) {
        flushCodeFence();
      } else {
        flushParagraph();
        flushList();
        flushBlockquote();
        inCodeFence = true;
        codeFenceLanguage = fence[1] ?? '';
        codeFenceLines = [];
      }
      continue;
    }

    if (inCodeFence) {
      codeFenceLines.push(line);
      continue;
    }

    if (/^\s*$/.test(line)) {
      flushParagraph();
      flushList();
      flushBlockquote();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      flushBlockquote();
      const level = heading[1].length + 2;
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const listItem = line.match(/^[-*]\s+(.+)$/);
    if (listItem) {
      flushParagraph();
      flushBlockquote();
      listItems.push(listItem[1]);
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      flushList();
      blockquote.push(quote[1]);
      continue;
    }

    flushList();
    flushBlockquote();
    paragraph.push(line);
  }

  if (inCodeFence) flushCodeFence();
  flushParagraph();
  flushList();
  flushBlockquote();

  return html.join('\n');
}

function renderInline(value: string): string {
  const codePlaceholders: string[] = [];
  let escaped = escapeHtml(value).replace(/`([^`]+)`/g, (_match, code) => {
    const token = `\u0000CODE${codePlaceholders.length}\u0000`;
    codePlaceholders.push(`<code>${code}</code>`);
    return token;
  });

  escaped = escaped.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (_match, text, href) => {
    const safeHref = sanitizeHref(unescapeBasicEntities(href));
    if (!safeHref) return text;
    return `<a href="${escapeHtml(safeHref)}">${text}</a>`;
  });

  escaped = escaped.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  escaped = escaped.replace(/\n/g, '<br>');

  return codePlaceholders.reduce((output, code, index) => output.replace(`\u0000CODE${index}\u0000`, code), escaped);
}

function sanitizeHref(href: string): string | undefined {
  if (href.startsWith('/') || href.startsWith('#')) return href;
  try {
    const url = new URL(href);
    return SAFE_PROTOCOLS.has(url.protocol) ? href : undefined;
  } catch {
    return undefined;
  }
}

function unescapeBasicEntities(value: string): string {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
