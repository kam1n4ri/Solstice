/**
 * Markdown to HTML parser supporting GFM tables, ordered lists,
 * task lists, code blocks, blockquotes, headings, and inline formatting.
 */

export function formatInlineMarkdown(text: string): string {
  const tagPlaceholders: string[] = [];
  const withTagsMasked = text.replace(/<\/?[a-zA-Z][^>]*>/g, (match) => {
    tagPlaceholders.push(match);
    return `\uE000${tagPlaceholders.length - 1}\uE000`;
  });

  const escaped = withTagsMasked
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const formatted = escaped
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/~~(.*?)~~/g, '<s>$1</s>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  return formatted.replace(/\uE000(\d+)\uE000/g, (_, idx) => tagPlaceholders[Number(idx)] || '');
}

export function markdownToHtml(md: string): string {
  if (!md) return '<p></p>';
  if (/^\s*<!DOCTYPE/i.test(md) || /^\s*<html/i.test(md)) {
    return md;
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

    if (/^###\s+(.*$)/.test(line)) {
      closeList();
      htmlLines.push(`<h3>${formatInlineMarkdown(line.replace(/^###\s+/, ''))}</h3>`);
      continue;
    }
    if (/^##\s+(.*$)/.test(line)) {
      closeList();
      htmlLines.push(`<h2>${formatInlineMarkdown(line.replace(/^##\s+/, ''))}</h2>`);
      continue;
    }
    if (/^#\s+(.*$)/.test(line)) {
      closeList();
      htmlLines.push(`<h1>${formatInlineMarkdown(line.replace(/^#\s+/, ''))}</h1>`);
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
      htmlLines.push(trimmed);
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
