/**
 * Bidirectional conversion utilities between HTML (TipTap format),
 * Markdown (.md), and Plain Text (.txt).
 */

export { markdownToHtml } from './markdownParser';

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function imgTagToMd(tag: string): string {
  const srcMatch = tag.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  const altMatch = tag.match(/\balt\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  const src = srcMatch ? (srcMatch[1] ?? srcMatch[2] ?? '') : '';
  const alt = altMatch ? (altMatch[1] ?? altMatch[2] ?? '') : '';
  return src ? `![${alt}](${src})` : '';
}

function inlineHtmlToMd(fragment: string): string {
  const codeSpans: string[] = [];
  let res = fragment.replace(/<code[^>]*>(.*?)<\/code>/gis, (_, inner: string) => {
    codeSpans.push(`\`${decodeHtmlEntities(inner.replace(/<[^>]+>/g, ''))}\``);
    return `\uE001${codeSpans.length - 1}\uE001`;
  });

  res = res
    .replace(/<strong[^>]*>(.*?)<\/strong>/gis, '**$1**')
    .replace(/<b\b[^>]*>(.*?)<\/b>/gis, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gis, '*$1*')
    .replace(/<i\b[^>]*>(.*?)<\/i>/gis, '*$1*')
    .replace(/<(s|strike|del)[^>]*>(.*?)<\/\1>/gis, '~~$2~~')
    .replace(/<a\s+[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gis, '[$2]($1)')
    .replace(/<img\s+[^>]*\/?>/gi, (tag) => imgTagToMd(tag))
    .replace(/<br\s*\/?>/gi, ' ');

  return res.replace(/\uE001(\d+)\uE001/g, (_, idx) => codeSpans[Number(idx)] || '');
}

function tableHtmlToMd(tableHtml: string): string {
  const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gis;
  const rows: string[][] = [];
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const cellRegex = /<(th|td)[^>]*>(.*?)<\/\1>/gis;
    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      const cellText = inlineHtmlToMd(cellMatch[2])
        .replace(/<[^>]+>/g, '')
        .replace(/\|/g, '\\|')
        .trim();
      cells.push(decodeHtmlEntities(cellText));
    }
    if (cells.length > 0) rows.push(cells);
  }

  if (rows.length === 0) return '';
  const maxCols = Math.max(...rows.map((r) => r.length));
  if (maxCols === 0) return '';

  const padRow = (cells: string[]) => {
    const padded = [...cells];
    while (padded.length < maxCols) padded.push('');
    return '| ' + padded.join(' | ') + ' |';
  };

  const mdRows: string[] = [
    padRow(rows[0]),
    '| ' + Array(maxCols).fill('---').join(' | ') + ' |',
  ];
  for (let i = 1; i < rows.length; i++) {
    mdRows.push(padRow(rows[i]));
  }
  return '\n\n' + mdRows.join('\n') + '\n\n';
}

function convertInnermostLists(html: string): string {
  const innerListRegex = /<(ul|ol)([^>]*)>((?:(?!<(?:ul|ol)[\s>]).)*?)<\/\1>/gis;
  let current = html;
  let changed = true;

  while (changed) {
    changed = false;
    current = current.replace(innerListRegex, (_m, tag: string, attrs: string, content: string) => {
      changed = true;
      const isTask = attrs.includes('taskList') || content.includes('taskItem');
      const isOrdered = tag.toLowerCase() === 'ol';
      let idx = 1;
      const lines = content.replace(
        /<li([^>]*)>(.*?)<\/li>/gis,
        (__: string, liAttrs: string, item: string) => {
          const cleanItem = item
            .replace(/<label[^>]*>.*?<\/label>/gis, '')
            .replace(/<\/?(p|div)[^>]*>/gi, ' ')
            .trim();
          const indented = cleanItem.replace(/\n([^\n]+)/g, '\n  $1');
          if (isTask) {
            const isChecked = liAttrs.includes('data-checked="true"') || /\bchecked\b/i.test(liAttrs);
            return `- [${isChecked ? 'x' : ' '}] ${indented}\n`;
          }
          return isOrdered ? `${idx++}. ${indented}\n` : `- ${indented}\n`;
        }
      );
      return '\n' + lines.trim() + '\n';
    });
  }
  return current;
}

export function htmlToMarkdown(html: string): string {
  if (!html) return '';

  const codeBlocks: string[] = [];
  let res = html.replace(
    /<pre[^>]*>\s*<code(?:[^>]*class=["'][^"']*language-([a-z0-9_+-]+)[^"']*["'])?[^>]*>(.*?)<\/code>\s*<\/pre>|<pre[^>]*>(.*?)<\/pre>/gis,
    (_m, lang: string | undefined, codeInner: string | undefined, preInner: string | undefined) => {
      const raw = decodeHtmlEntities((codeInner ?? preInner ?? '').replace(/<[^>]+>/g, '')).replace(/\n$/, '');
      const fence = lang ? `\`\`\`${lang}` : '```';
      codeBlocks.push(`\n\n${fence}\n${raw}\n\`\`\`\n\n`);
      return `\uE000${codeBlocks.length - 1}\uE000`;
    }
  );

  res = res.replace(/<table[^>]*>.*?<\/table>/gis, (m) => tableHtmlToMd(m));
  res = convertInnermostLists(res);

  res = res.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (_m, inner: string) => {
    const converted = inlineHtmlToMd(inner)
      .replace(/<p[^>]*>(.*?)<\/p>/gis, '$1\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim();
    if (!converted) return '';
    const quoted = converted
      .split(/\r?\n/)
      .map((line) => (line.trim() ? `> ${line.trim()}` : '>'))
      .join('\n');
    return `\n\n${quoted}\n\n`;
  });

  res = inlineHtmlToMd(res);
  res = res
    .replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gis, (_m, level: string, inner: string) => {
      return `${'#'.repeat(Number(level))} ${inner.trim()}\n\n`;
    })
    .replace(/<hr[^>]*>/gi, '\n---\n\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gis, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  res = decodeHtmlEntities(res)
    .replace(/\uE000(\d+)\uE000/g, (_, idx) => codeBlocks[Number(idx)] || '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return res;
}

export function htmlToPlainText(html: string): string {
  if (!html) return '';
  const raw = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/blockquote>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  return decodeHtmlEntities(raw).replace(/\n{3,}/g, '\n\n').trim();
}

export function plainTextToHtml(txt: string): string {
  if (!txt) return '<p></p>';
  const clean = txt
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const paragraphs = clean.split(/\r?\n\r?\n/);
  return paragraphs
    .map((p) => {
      const withBr = p.replace(/\r?\n/g, '<br/>');
      return `<p>${withBr || '&nbsp;'}</p>`;
    })
    .join('');
}
