/**
 * Markdown to HTML parser supporting GFM tables, ordered lists,
 * task lists, code blocks, blockquotes, headings, and inline formatting.
 */

const SAFE_INLINE_TAGS = new Set([
  'span', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del',
  'code', 'mark', 'sup', 'sub', 'br', 'hr', 'a', 'img',
]);

const SAFE_BLOCK_TAGS = new Set([
  'p', 'div', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'pre', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
]);

function escapeAttr(val: string): string {
  return val
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sanitizeUrl(raw: string, allowDataImage = false): string | null {
  const decoded = raw.replace(/[\u0000-\u0020]+/g, '').trim();
  if (!decoded) return null;
  if (decoded.startsWith('#') || decoded.startsWith('/') || decoded.startsWith('./') || decoded.startsWith('../')) {
    return decoded;
  }
  const lower = decoded.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('mailto:')) {
    return decoded;
  }
  if (allowDataImage && /^data:image\/(png|jpeg|jpg|gif|webp);base64,[a-z0-9+/=]+$/i.test(decoded)) {
    return decoded;
  }
  return null;
}

function sanitizeInlineHtmlTag(rawTag: string, allowBlocks = false): string | null {
  const tagMatch = rawTag.match(/^<(\/?)([a-zA-Z0-9-]+)([\s\S]*?)(\/?)>$/);
  if (!tagMatch) return null;
  const [, isClosing, rawName, rawAttrs, selfClose] = tagMatch;
  const name = rawName.toLowerCase();

  if (!SAFE_INLINE_TAGS.has(name) && !(allowBlocks && SAFE_BLOCK_TAGS.has(name))) {
    return null;
  }
  if (isClosing) {
    return `</${name}>`;
  }

  let safeAttrs = '';
  const attrRegex = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let attrMatch: RegExpExecArray | null;
  while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
    const attrName = attrMatch[1].toLowerCase();
    const attrVal = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';

    if (attrName.startsWith('on') || attrName === 'srcdoc' || attrName === 'formaction') {
      continue;
    }
    if (attrName === 'href' || attrName === 'src') {
      const safe = sanitizeUrl(attrVal, attrName === 'src' && name === 'img');
      if (safe) safeAttrs += ` ${attrName}="${escapeAttr(safe)}"`;
    } else if (attrName === 'style') {
      if (!/(expression\s*\(|javascript:|vbscript:|@import|url\s*\()/i.test(attrVal)) {
        safeAttrs += ` style="${escapeAttr(attrVal)}"`;
      }
    } else if (['alt', 'title', 'class', 'data-type', 'data-checked', 'colspan', 'rowspan', 'align'].includes(attrName)) {
      safeAttrs += ` ${attrName}="${escapeAttr(attrVal)}"`;
    }
  }

  return `<${name}${safeAttrs}${selfClose ? ' /' : ''}>`;
}

function unescapeBasicEntities(val: string): string {
  return val
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function sanitizeHtmlBlock(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/?[a-zA-Z][^>]*>/g, (tag) => sanitizeInlineHtmlTag(tag, true) ?? '');
}

export function formatInlineMarkdown(text: string): string {
  const tagPlaceholders: string[] = [];
  const maskToken = (html: string): string => {
    tagPlaceholders.push(html);
    return `\uE000${tagPlaceholders.length - 1}\uE000`;
  };

  let working = text.replace(/<\/?[a-zA-Z][^>]*>/g, (match) => {
    const sanitized = sanitizeInlineHtmlTag(match);
    return sanitized ? maskToken(sanitized) : match;
  });

  working = working
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Mask inline code spans before emphasis/links so underscores & asterisks inside code are preserved verbatim
  working = working.replace(/`([^`]+)`/g, (_m, codeInner: string) => maskToken(`<code>${codeInner}</code>`));

  const stripOptionalTitle = (urlSpec: string): string => {
    const trimmed = urlSpec.trim();
    const titleMatch = trimmed.match(/^([^\s]+)\s+(?:"[^"]*"|'[^']*')$/);
    return titleMatch ? titleMatch[1] : trimmed;
  };

  // Mask generated img/a tags so underscores in URLs are never turned into <em>
  working = working
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt: string, rawSrc: string) => {
      const cleanSrc = stripOptionalTitle(unescapeBasicEntities(rawSrc));
      const cleanAlt = unescapeBasicEntities(alt);
      const safeSrc = sanitizeUrl(cleanSrc, true);
      if (!safeSrc) return alt;
      return maskToken(`<img src="${escapeAttr(safeSrc)}" alt="${escapeAttr(cleanAlt)}" />`);
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, rawHref: string) => {
      const cleanHref = stripOptionalTitle(unescapeBasicEntities(rawHref));
      const safeHref = sanitizeUrl(cleanHref, false);
      if (!safeHref) return label;
      return maskToken(`<a href="${escapeAttr(safeHref)}">${label}</a>`);
    });

  const formatted = working
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
    .replace(/(^|[^\w])_([^_\n]+?)_(?=[^\w]|$)/g, '$1<em>$2</em>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>');

  return formatted.replace(/\uE000(\d+)\uE000/g, (_, idx) => tagPlaceholders[Number(idx)] || '');
}

export function markdownToHtml(md: string): string {
  if (!md) return '<p></p>';
  if (/^\s*<!DOCTYPE/i.test(md) || /^\s*<html/i.test(md)) {
    return sanitizeHtmlBlock(md);
  }

  const lines = md.split(/\r?\n/);
  const htmlLines: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let inCodeBlock = false;
  const codeBuffer: string[] = [];

  let inTable = false;
  let tableHeader: string[] | null = null;
  const tableRows: string[][] = [];

  const flushTable = () => {
    if (!inTable) return;
    let tableHtml = '<table>';
    if (tableHeader) {
      tableHtml += `<thead><tr>${tableHeader.map((h) => `<th>${formatInlineMarkdown(h)}</th>`).join('')}</tr></thead>`;
    }
    if (tableRows.length > 0) {
      tableHtml += `<tbody>${tableRows.map((r) => `<tr>${r.map((c) => `<td>${formatInlineMarkdown(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
    }
    tableHtml += '</table>';
    htmlLines.push(tableHtml);
    inTable = false;
    tableHeader = null;
    tableRows.length = 0;
  };

  const closeList = () => {
    if (listType) {
      htmlLines.push(`</${listType}>`);
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      closeList();
      flushTable();
      if (inCodeBlock) {
        htmlLines.push(`<pre><code>${codeBuffer.join('\n')}</code></pre>`);
        codeBuffer.length = 0;
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      continue;
    }

    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      flushTable();
      continue;
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 1) {
      closeList();
      const rawCells = trimmed.slice(1, -1).split('|').map((c) => c.trim());
      const isSep = rawCells.every((c) => /^:?-+:?$/.test(c));
      if (isSep) {
        if (!tableHeader && tableRows.length > 0) {
          tableHeader = tableRows.pop()!;
        }
      } else {
        tableRows.push(rawCells);
      }
      inTable = true;
      continue;
    } else {
      flushTable();
    }

    if (/^(\*\*\*|---|___)$/.test(trimmed)) {
      closeList();
      htmlLines.push('<hr>');
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      htmlLines.push(`<h${level}>${formatInlineMarkdown(headingMatch[2])}</h${level}>`);
      continue;
    }

    if (/^>\s+(.*$)/.test(line)) {
      closeList();
      htmlLines.push(`<blockquote><p>${formatInlineMarkdown(line.replace(/^>\s+/, ''))}</p></blockquote>`);
      continue;
    }

    const taskMatch = trimmed.match(/^[-*+]\s+\[([ xX])\]\s+(.*$)/);
    if (taskMatch) {
      if (listType !== 'ul') {
        closeList();
        htmlLines.push('<ul data-type="taskList">');
        listType = 'ul';
      }
      const checked = taskMatch[1].toLowerCase() === 'x';
      htmlLines.push(`<li data-type="taskItem" data-checked="${checked}"><p>${formatInlineMarkdown(taskMatch[2])}</p></li>`);
      continue;
    }

    if (/^[-*+]\s+(.*$)/.test(trimmed)) {
      if (listType !== 'ul') {
        closeList();
        htmlLines.push('<ul>');
        listType = 'ul';
      }
      htmlLines.push(`<li>${formatInlineMarkdown(trimmed.replace(/^[-*+]\s+/, ''))}</li>`);
      continue;
    }

    const olMatch = trimmed.match(/^(\d+)\.\s+(.*$)/);
    if (olMatch) {
      if (listType !== 'ol') {
        closeList();
        htmlLines.push('<ol>');
        listType = 'ol';
      }
      htmlLines.push(`<li>${formatInlineMarkdown(olMatch[2])}</li>`);
      continue;
    }

    closeList();
    if (/^<(p|div|blockquote|table|pre|hr|h[1-6]|ul|ol|li)[^>]*>/i.test(trimmed)) {
      htmlLines.push(sanitizeHtmlBlock(trimmed));
    } else {
      htmlLines.push(`<p>${formatInlineMarkdown(trimmed)}</p>`);
    }
  }

  closeList();
  flushTable();

  if (inCodeBlock) {
    htmlLines.push(`<pre><code>${codeBuffer.join('\n')}</code></pre>`);
  }

  return htmlLines.join('\n') || '<p></p>';
}
