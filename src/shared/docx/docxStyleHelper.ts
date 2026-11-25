import { AlignmentType, ImageRun } from 'docx';

export type Alignment = (typeof AlignmentType)[keyof typeof AlignmentType];

export function clean(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isNaN(code) ? _ : String.fromCodePoint(code);
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10);
      return Number.isNaN(code) ? _ : String.fromCodePoint(code);
    });
}

export function parseColor(str?: string): string | undefined {
  if (!str) return undefined;
  const hex = str.trim().match(/^#([0-9a-fA-F]{3,8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return h.slice(0, 6).toUpperCase();
  }
  const rgb = str.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) {
    const r = Math.min(255, Math.max(0, parseInt(rgb[1], 10)));
    const g = Math.min(255, Math.max(0, parseInt(rgb[2], 10)));
    const b = Math.min(255, Math.max(0, parseInt(rgb[3], 10)));
    return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  }
  return undefined;
}

export function parseFontSize(str?: string): number | undefined {
  if (!str) return undefined;
  const match = str.trim().match(/^(\d+(?:\.\d+)?)(px|pt|em|rem)?$/i);
  if (!match) return undefined;
  const val = parseFloat(match[1]);
  const unit = (match[2] || 'px').toLowerCase();
  if (unit === 'pt') return Math.round(val * 2);
  if (unit === 'em' || unit === 'rem') return Math.round(val * 24);
  return Math.round(val * 1.5);
}

export function getAlignment(tagHtml: string): Alignment | undefined {
  const l = tagHtml.toLowerCase();
  if (l.includes('text-align: center') || l.includes('has-text-align-center') || l.includes('align="center"')) {
    return AlignmentType.CENTER;
  }
  if (l.includes('text-align: right') || l.includes('has-text-align-right') || l.includes('align="right"')) {
    return AlignmentType.RIGHT;
  }
  if (l.includes('text-align: justify') || l.includes('has-text-align-justify') || l.includes('align="justify"')) {
    return AlignmentType.JUSTIFIED;
  }
  if (l.includes('text-align: left') || l.includes('has-text-align-left') || l.includes('align="left"')) {
    return AlignmentType.LEFT;
  }
  return undefined;
}

export function extractImgAttrs(imgTag: string): { src: string; alt: string } {
  const srcMatch = imgTag.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  const altMatch = imgTag.match(/\balt\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  return {
    src: srcMatch ? (srcMatch[1] ?? srcMatch[2] ?? '') : '',
    alt: altMatch ? clean(altMatch[1] ?? altMatch[2] ?? '') : '',
  };
}

export function tryParseImage(src: string): ImageRun | null {
  try {
    if (!src.startsWith('data:image/')) return null;
    const headerEnd = src.indexOf(';base64,');
    if (headerEnd === -1) return null;

    const mime = src.slice(5, headerEnd).toLowerCase();
    let type: 'jpg' | 'png' | 'gif' | 'bmp';
    if (mime === 'image/jpeg' || mime === 'image/jpg') type = 'jpg';
    else if (mime === 'image/png') type = 'png';
    else if (mime === 'image/gif') type = 'gif';
    else if (mime === 'image/bmp') type = 'bmp';
    else return null;

    const base64Data = src.slice(headerEnd + 8).replace(/\s+/g, '');
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new ImageRun({
      type,
      data: bytes,
      transformation: { width: 400, height: 300 },
    });
  } catch {
    return null;
  }
}
