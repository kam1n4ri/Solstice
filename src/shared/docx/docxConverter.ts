import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';
import {
  clean,
  parseColor,
  parseFontSize,
  getAlignment,
  tryParseImage,
} from './docxStyleHelper';

interface SpanStyle {
  font?: string;
  color?: string;
  size?: number;
}

function parseInlineRuns(htmlFragment: string, defaultBold = false): TextRun[] {
  const tokens = htmlFragment.split(/(<[^>]+>)/g).filter(Boolean);
  const runs: TextRun[] = [];
  const styleStack: SpanStyle[] = [];
  let bold = defaultBold;
  let italics = false;
  let underline = false;
  let strike = false;
  let isCode = false;

  for (const t of tokens) {
    const l = t.toLowerCase();
    if (l === '<strong>' || l === '<b>') bold = true;
    else if (l === '</strong>' || l === '</b>') bold = defaultBold;
    else if (l === '<em>' || l === '<i>') italics = true;
    else if (l === '</em>' || l === '</i>') italics = false;
    else if (l === '<u>') underline = true;
    else if (l === '</u>') underline = false;
    else if (l === '<s>' || l === '<strike>') strike = true;
    else if (l === '</s>' || l === '</strike>') strike = false;
    else if (l === '<code>') isCode = true;
    else if (l === '</code>') isCode = false;
    else if (l.startsWith('<span') || l.startsWith('<font')) {
      const fontMatch = t.match(/font-family:\s*([^;"]+)/i) || t.match(/face=["']([^"']+)["']/i);
      const colorMatch = t.match(/color:\s*([^;"]+)/i) || t.match(/color=["']([^"']+)["']/i);
      const sizeMatch = t.match(/font-size:\s*([^;"]+)/i);
      styleStack.push({
        font: fontMatch ? fontMatch[1].split(',')[0].trim().replace(/^['"]+|['"]+$/g, '') : undefined,
        color: parseColor(colorMatch ? colorMatch[1] : undefined),
        size: parseFontSize(sizeMatch ? sizeMatch[1] : undefined),
      });
    } else if (l === '</span>' || l === '</font>') {
      styleStack.pop();
    } else if (!t.startsWith('<')) {
      const text = clean(t);
      if (text) {
        let effFont: string | undefined, effColor: string | undefined, effSize: number | undefined;
        for (const s of styleStack) {
          if (s.font) effFont = s.font;
          if (s.color) effColor = s.color;
          if (s.size) effSize = s.size;
        }
        runs.push(
          new TextRun({
            text,
            bold,
            italics,
            strike,
            underline: underline ? {} : undefined,
            font: isCode ? 'Courier New' : effFont || undefined,
            color: effColor,
            size: effSize,
          })
        );
      }
    }
  }

  if (runs.length === 0) {
    const text = clean(htmlFragment.replace(/<[^>]+>/g, '').trim());
    if (text) runs.push(new TextRun({ text, bold: defaultBold }));
  }
  return runs;
}

function parseTable(tableHtml: string): Table {
  const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gis;
  const rows: TableRow[] = [];
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const cellRegex = /<(th|td)([^>]*)>(.*?)<\/\1>/gis;
    const cells: TableCell[] = [];
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      const isHeader = cellMatch[1].toLowerCase() === 'th';
      const cellAttrs = cellMatch[2] || '';
      const cellContent = cellMatch[3].trim();
      const cellAlign = getAlignment(cellAttrs);
      const runs = parseInlineRuns(cellContent, isHeader);
      cells.push(
        new TableCell({
          children: [
            new Paragraph({
              alignment: cellAlign,
              children: runs.length ? runs : [new TextRun({ text: '' })],
            }),
          ],
        })
      );
    }
    if (cells.length > 0) rows.push(new TableRow({ children: cells }));
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.length > 0
      ? rows
      : [new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: '' })] })] })],
  });
}

export async function createDocxFromHtml(html: string): Promise<Uint8Array> {
  const children: (Paragraph | Table)[] = [];
  const blockRegex =
    /<(table|pre|h[1-3]|blockquote|ol|ul|p|li)[^>]*>(.*?)<\/\1>|<img\s+[^>]*src=["']([^"']*)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gis;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(html)) !== null) {
    const fullTag = match[0];
    if (fullTag.startsWith('<img')) {
      const imgRun = tryParseImage(match[3]);
      children.push(
        new Paragraph({
          children: [
            imgRun || new TextRun({ text: `[Image: ${match[4] || 'Embedded Image'}]`, italics: true }),
          ],
        })
      );
      continue;
    }

    const tag = match[1].toLowerCase();
    const innerHtml = match[2].trim();
    if (!innerHtml) continue;

    if (tag === 'table') {
      children.push(parseTable(innerHtml));
    } else if (tag === 'pre') {
      const codeText = innerHtml.replace(/<\/?code[^>]*>/gi, '').trim();
      for (const line of codeText.split('\n')) {
        children.push(new Paragraph({ children: [new TextRun({ text: clean(line), font: 'Courier New' })] }));
      }
    } else if (tag === 'ol') {
      const liRegex = /<li[^>]*>(.*?)<\/li>/gis;
      let liMatch: RegExpExecArray | null;
      let idx = 1;
      while ((liMatch = liRegex.exec(innerHtml)) !== null) {
        const itemContent = liMatch[1].replace(/<label[^>]*>.*?<\/label>/gis, '').trim();
        const runs = parseInlineRuns(itemContent);
        children.push(new Paragraph({ children: [new TextRun({ text: `${idx++}. ` }), ...runs] }));
      }
    } else if (tag === 'ul') {
      const isTaskList = fullTag.includes('taskList') || innerHtml.includes('taskItem');
      const liRegex = /<li([^>]*)>(.*?)<\/li>/gis;
      let liMatch: RegExpExecArray | null;
      while ((liMatch = liRegex.exec(innerHtml)) !== null) {
        const isChecked = liMatch[1].includes('data-checked="true"') || liMatch[1].includes('checked');
        const prefix = isTaskList ? (isChecked ? '☑ ' : '☐ ') : '• ';
        const itemContent = liMatch[2].replace(/<label[^>]*>.*?<\/label>/gis, '').trim();
        const runs = parseInlineRuns(itemContent);
        children.push(new Paragraph({ children: [new TextRun({ text: prefix }), ...runs] }));
      }
    } else {
      const alignment = getAlignment(fullTag);
      const runs = parseInlineRuns(innerHtml);
      if (runs.length === 0) continue;

      if (tag === 'h1') children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, alignment, children: runs }));
      else if (tag === 'h2') children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, alignment, children: runs }));
      else if (tag === 'h3') children.push(new Paragraph({ heading: HeadingLevel.HEADING_3, alignment, children: runs }));
      else if (tag === 'blockquote') children.push(new Paragraph({ alignment, children: runs.map((r) => new TextRun({ ...r, italics: true })) }));
      else if (tag === 'li') children.push(new Paragraph({ alignment, children: [new TextRun({ text: '• ' }), ...runs] }));
      else children.push(new Paragraph({ alignment, children: runs }));
    }
  }

  if (children.length === 0) {
    const cleanText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    children.push(new Paragraph({ children: [new TextRun({ text: cleanText || 'Empty Document' })] }));
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const arrayBuffer = await Packer.toArrayBuffer(doc);
  return new Uint8Array(arrayBuffer);
}
