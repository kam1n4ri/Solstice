import {
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import {
  clean,
  extractImgAttrs,
  getAlignment,
  parseColor,
  parseFontSize,
  tryParseImage,
} from './docxStyleHelper';

interface SpanStyle {
  font?: string;
  color?: string;
  size?: number;
}

const HEADING_MAP: Record<string, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  h1: HeadingLevel.HEADING_1,
  h2: HeadingLevel.HEADING_2,
  h3: HeadingLevel.HEADING_3,
  h4: HeadingLevel.HEADING_4,
  h5: HeadingLevel.HEADING_5,
  h6: HeadingLevel.HEADING_6,
};

function parseInlineRuns(
  htmlFragment: string,
  opts: { defaultBold?: boolean; defaultItalics?: boolean } = {}
): (TextRun | ImageRun)[] {
  const { defaultBold = false, defaultItalics = false } = opts;
  const tokens = htmlFragment.split(/(<[^>]+>)/g).filter(Boolean);
  const runs: (TextRun | ImageRun)[] = [];
  const styleStack: SpanStyle[] = [];
  let boldDepth = 0;
  let italicDepth = 0;
  let underlineDepth = 0;
  let strikeDepth = 0;
  let codeDepth = 0;

  for (const t of tokens) {
    const l = t.toLowerCase();
    if (/^<(strong|b)(\s|>)/.test(l)) boldDepth++;
    else if (l === '</strong>' || l === '</b>') boldDepth = Math.max(0, boldDepth - 1);
    else if (/^<(em|i)(\s|>)/.test(l)) italicDepth++;
    else if (l === '</em>' || l === '</i>') italicDepth = Math.max(0, italicDepth - 1);
    else if (/^<u(\s|>)/.test(l)) underlineDepth++;
    else if (l === '</u>') underlineDepth = Math.max(0, underlineDepth - 1);
    else if (/^<(s|strike|del)(\s|>)/.test(l)) strikeDepth++;
    else if (l === '</s>' || l === '</strike>' || l === '</del>') strikeDepth = Math.max(0, strikeDepth - 1);
    else if (/^<code(\s|>)/.test(l)) codeDepth++;
    else if (l === '</code>') codeDepth = Math.max(0, codeDepth - 1);
    else if (/^<br\s*\/?>$/.test(l)) {
      runs.push(new TextRun({ break: 1 }));
    } else if (l.startsWith('<img')) {
      const { src, alt } = extractImgAttrs(t);
      const imgRun = tryParseImage(src);
      runs.push(imgRun || new TextRun({ text: `[Image: ${alt || 'Embedded Image'}]`, italics: true }));
    } else if (l.startsWith('<span') || l.startsWith('<font') || l.startsWith('<mark')) {
      const fontMatch = t.match(/font-family:\s*([^;"]+)/i) || t.match(/face=["']([^"']+)["']/i);
      const colorMatch = t.match(/(?:^|[\s;])color:\s*([^;"]+)/i) || t.match(/color=["']([^"']+)["']/i);
      const sizeMatch = t.match(/font-size:\s*([^;"]+)/i);
      styleStack.push({
        font: fontMatch ? fontMatch[1].split(',')[0].trim().replace(/^['"]+|['"]+$/g, '') : undefined,
        color: parseColor(colorMatch ? colorMatch[1] : undefined),
        size: parseFontSize(sizeMatch ? sizeMatch[1] : undefined),
      });
    } else if (l === '</span>' || l === '</font>' || l === '</mark>') {
      styleStack.pop();
    } else if (!t.startsWith('<')) {
      const text = clean(t);
      if (text) {
        let effFont: string | undefined;
        let effColor: string | undefined;
        let effSize: number | undefined;
        for (const s of styleStack) {
          if (s.font) effFont = s.font;
          if (s.color) effColor = s.color;
          if (s.size) effSize = s.size;
        }
        runs.push(
          new TextRun({
            text,
            bold: defaultBold || boldDepth > 0,
            italics: defaultItalics || italicDepth > 0,
            strike: strikeDepth > 0,
            underline: underlineDepth > 0 ? {} : undefined,
            font: codeDepth > 0 ? 'Courier New' : effFont || undefined,
            color: effColor,
            size: effSize,
          })
        );
      }
    }
  }

  if (runs.length === 0) {
    const text = clean(htmlFragment.replace(/<[^>]+>/g, '').trim());
    if (text) runs.push(new TextRun({ text, bold: defaultBold, italics: defaultItalics }));
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
      const runs = parseInlineRuns(cellContent, { defaultBold: isHeader });
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
    rows:
      rows.length > 0
        ? rows
        : [new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: '' })] })] })],
  });
}

function appendListParagraphs(
  listHtml: string,
  ordered: boolean,
  isTaskList: boolean,
  children: (Paragraph | Table)[],
  depth = 0
): void {
  const liRegex = /<li([^>]*)>((?:(?!<li[\s>]).)*?)<\/li>/gis;
  const matches = Array.from(listHtml.matchAll(liRegex));
  let idx = 1;
  const indentLeft = depth > 0 ? depth * 360 : undefined;

  for (const m of matches) {
    const attrs = m[1] || '';
    const isChecked = attrs.includes('data-checked="true"') || /\bchecked\b/i.test(attrs);
    const prefix = ordered ? `${idx++}. ` : isTaskList ? (isChecked ? '☑ ' : '☐ ') : '• ';
    const itemContent = m[2].replace(/<label[^>]*>.*?<\/label>/gis, '').trim();
    const runs = parseInlineRuns(itemContent);
    children.push(
      new Paragraph({
        indent: indentLeft ? { left: indentLeft } : undefined,
        children: [new TextRun({ text: prefix }), ...runs],
      })
    );
  }
}

export async function createDocxFromHtml(html: string): Promise<Uint8Array> {
  const children: (Paragraph | Table)[] = [];
  const blockRegex =
    /<(table|pre|h[1-6]|blockquote|ol|ul|p|li|div)\b[^>]*>(.*?)<\/\1>|<img\s+[^>]*\/?>|<hr\s*\/?>/gis;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const lowerTag = fullTag.toLowerCase();

    if (lowerTag.startsWith('<hr')) {
      children.push(
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D1D5DB', space: 1 } },
          children: [],
        })
      );
      continue;
    }

    if (lowerTag.startsWith('<img')) {
      const { src, alt } = extractImgAttrs(fullTag);
      const imgRun = tryParseImage(src);
      children.push(
        new Paragraph({
          children: [imgRun || new TextRun({ text: `[Image: ${alt || 'Embedded Image'}]`, italics: true })],
        })
      );
      continue;
    }

    const tag = match[1].toLowerCase();
    const innerHtml = (match[2] || '').trim();
    if (!innerHtml) continue;

    if (tag === 'table') {
      children.push(parseTable(innerHtml));
    } else if (tag === 'pre') {
      const codeText = clean(innerHtml.replace(/<\/?code[^>]*>/gi, '')).replace(/\r\n/g, '\n');
      for (const line of codeText.split('\n')) {
        children.push(new Paragraph({ children: [new TextRun({ text: line, font: 'Courier New' })] }));
      }
    } else if (tag === 'ol') {
      appendListParagraphs(innerHtml, true, false, children);
    } else if (tag === 'ul') {
      const isTaskList = fullTag.includes('taskList') || innerHtml.includes('taskItem');
      appendListParagraphs(innerHtml, false, isTaskList, children);
    } else if (tag === 'blockquote') {
      const quoteBlocks = innerHtml.match(/<p[^>]*>.*?<\/p>/gis);
      const segments = quoteBlocks && quoteBlocks.length > 0 ? quoteBlocks : [innerHtml];
      for (const seg of segments) {
        const runs = parseInlineRuns(seg, { defaultItalics: true });
        if (runs.length > 0) {
          children.push(
            new Paragraph({
              alignment: getAlignment(fullTag),
              indent: { left: 480 },
              children: runs,
            })
          );
        }
      }
    } else {
      const alignment = getAlignment(fullTag);
      const runs = parseInlineRuns(innerHtml);
      if (runs.length === 0) continue;

      if (HEADING_MAP[tag]) {
        children.push(new Paragraph({ heading: HEADING_MAP[tag], alignment, children: runs }));
      } else if (tag === 'li') {
        children.push(new Paragraph({ alignment, children: [new TextRun({ text: '• ' }), ...runs] }));
      } else {
        children.push(new Paragraph({ alignment, children: runs }));
      }
    }
  }

  if (children.length === 0) {
    const cleanText = clean(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    children.push(new Paragraph({ children: [new TextRun({ text: cleanText || 'Empty Document' })] }));
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const arrayBuffer = await Packer.toArrayBuffer(doc);
  return new Uint8Array(arrayBuffer);
}
