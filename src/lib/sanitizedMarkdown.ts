const ESCAPE_LOOKUP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);
const CODE_PLACEHOLDER_PREFIX = '\u0000CODE';

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ESCAPE_LOOKUP[character] ?? character);
}

/**
 * Render untrusted transcript Markdown to a deliberately small, sanitized HTML subset.
 *
 * This is intentionally dependency-free for now: transcript text only needs common prose
 * Markdown, and keeping the renderer constrained makes the URL and raw-HTML behavior
 * explicit. Raw HTML is always escaped. Links are emitted only for relative, hash,
 * http(s), and mailto targets; unsafe schemes such as javascript: and data: are
 * rendered as plain link text.
 */
export function renderSafeMarkdown(markdown: string): string {
  const normalized = markdown.replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');
  const html: string[] = [];
  let paragraph: string[] = [];
  let unorderedItems: string[] = [];
  let orderedItems: string[] = [];
  let blockquote: string[] = [];
  let inCodeFence = false;
  let codeFenceLanguage = '';
  let codeFenceLines: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    html.push(`<p>${renderInline(paragraph.join('\n'))}</p>`);
    paragraph = [];
  };

  const flushUnorderedList = () => {
    if (unorderedItems.length === 0) return;
    html.push(`<ul>${unorderedItems.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`);
    unorderedItems = [];
  };

  const flushOrderedList = () => {
    if (orderedItems.length === 0) return;
    html.push(`<ol>${orderedItems.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ol>`);
    orderedItems = [];
  };

  const flushLists = () => {
    flushUnorderedList();
    flushOrderedList();
  };

  const flushBlockquote = () => {
    if (blockquote.length === 0) return;
    html.push(`<blockquote>${renderSafeMarkdown(blockquote.join('\n'))}</blockquote>`);
    blockquote = [];
  };

  const flushCodeFence = () => {
    const language = sanitizeCodeFenceLanguage(codeFenceLanguage);
    const languageClass = language ? ` class="language-${language}"` : '';
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
        flushLists();
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
      flushLists();
      flushBlockquote();
      continue;
    }

    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushLists();
      flushBlockquote();
      const level = Math.min(6, heading[1].length + 2);
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushParagraph();
      flushLists();
      flushBlockquote();
      html.push('<hr>');
      continue;
    }

    const unorderedItem = line.match(/^\s{0,3}[-*+]\s+(.+)$/);
    if (unorderedItem) {
      flushParagraph();
      flushOrderedList();
      flushBlockquote();
      unorderedItems.push(unorderedItem[1]);
      continue;
    }

    const orderedItem = line.match(/^\s{0,3}\d+[.)]\s+(.+)$/);
    if (orderedItem) {
      flushParagraph();
      flushUnorderedList();
      flushBlockquote();
      orderedItems.push(orderedItem[1]);
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) {
      flushParagraph();
      flushLists();
      blockquote.push(quote[1]);
      continue;
    }

    flushLists();
    flushBlockquote();
    paragraph.push(line);
  }

  if (inCodeFence) flushCodeFence();
  flushParagraph();
  flushLists();
  flushBlockquote();

  return html.join('\n');
}

export const renderSanitizedMarkdown = renderSafeMarkdown;

function renderInline(value: string): string {
  const codePlaceholders: string[] = [];
  let escaped = escapeHtml(value).replace(/`([^`]+)`/g, (_match, code) => {
    const token = `${CODE_PLACEHOLDER_PREFIX}${codePlaceholders.length}\u0000`;
    codePlaceholders.push(`<code>${code}</code>`);
    return token;
  });

  escaped = escaped.replace(/\[([^\]\n]+)\]\(([^)]*)\)/g, (_match, text, href) => {
    const safeHref = sanitizeHref(unescapeBasicEntities(href));
    if (!safeHref) return text;
    return `<a href="${escapeHtml(safeHref)}">${text}</a>`;
  });

  escaped = escaped.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  escaped = escaped.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  escaped = escaped.replace(/\n/g, '<br>');

  return codePlaceholders.reduce((output, code, index) => output.replace(`${CODE_PLACEHOLDER_PREFIX}${index}\u0000`, code), escaped);
}

function sanitizeHref(href: string): string | undefined {
  const trimmed = href.trim();
  const normalized = removeAsciiControlCharacters(trimmed);
  if (normalized.startsWith('/') || normalized.startsWith('#')) return normalized;
  try {
    const url = new URL(normalized);
    return SAFE_PROTOCOLS.has(url.protocol) ? normalized : undefined;
  } catch {
    return undefined;
  }
}

function sanitizeCodeFenceLanguage(language: string): string {
  return language.replace(/[^A-Za-z0-9_-]/g, '');
}

function removeAsciiControlCharacters(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F\s]+/g, '');
}

function unescapeBasicEntities(value: string): string {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
