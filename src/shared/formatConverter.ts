/**
 * Bidirectional conversion utilities between HTML (TipTap format),
 * Markdown (.md), and Plain Text (.txt).
 */

export { markdownToHtml } from './markdownParser';

function tableHtmlToMd(tableHtml: string): string {
  const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gis;
  const rows: string[][] = [];
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const cellRegex = /<(th|td)[^>]*>(.*?)<\/\1>/gis;
    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      const cellText = cellMatch[2]
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\|/g, '\\|')
        .trim();
      cells.push(cellText);
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

  const mdRows: string[] = [];
  mdRows.push(padRow(rows[0]));
  mdRows.push('| ' + Array(maxCols).fill('---').join(' | ') + ' |');
  for (let i = 1; i < rows.length; i++) {
    mdRows.push(padRow(rows[i]));
  }
  return '\n\n' + mdRows.join('\n') + '\n\n';
}

export function htmlToMarkdown(html: string): string {
  if (!html) return '';

  let res = html.replace(/<table[^>]*>.*?<\/table>/gis, (m) => tableHtmlToMd(m));

  // Convert task lists
  res = res.replace(/<ul[^>]*data-type=["']taskList["'][^>]*>(.*?)<\/ul>/gis, (_, content) => {
    return '\n' + content.replace(/<li[^>]*data-checked=["'](true|false)["'][^>]*>(.*?)<\/li>/gis, (__: string, checked: string, item: string) => {
      const isChecked = checked === 'true';
      const text = item.replace(/<label[^>]*>.*?<\/label>/gis, '').replace(/<p[^>]*>(.*?)<\/p>/gi, '$1').trim();
      return `- [${isChecked ? 'x' : ' '}] ${text}\n`;
    }) + '\n';
  });

  // Convert ordered lists
  res = res.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (_, content) => {
    let idx = 1;
    return '\n' + content.replace(/<li[^>]*>(.*?)<\/li>/gis, (__: string, item: string) => {
      const text = item.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1').trim();
      return `${idx++}. ${text}\n`;
    }) + '\n';
  });

  // Convert standard lists
  res = res.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (_, content) => {
    return '\n' + content.replace(/<li[^>]*>(.*?)<\/li>/gis, (__: string, item: string) => {
      const text = item.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1').trim();
      return `- ${text}\n`;
    }) + '\n';
  });

  return res
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
    .replace(/<pre><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n\n')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<(s|strike|del)[^>]*>(.*?)<\/\1>/gi, '~~$2~~')
    .replace(/<a\s+[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    .replace(/<img\s+[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, '![$2]($1)')
    .replace(/<img\s+[^>]*src=["']([^"']*)["'][^>]*>/gi, '![]($1)')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<hr[^>]*>/gi, '\n---\n\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function htmlToPlainText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/blockquote>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
