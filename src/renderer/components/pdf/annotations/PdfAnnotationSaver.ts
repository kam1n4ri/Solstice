import { PDFDocument, rgb } from 'pdf-lib';
import { PdfAnnotation } from './PdfAnnotationTypes';

interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

const DEFAULT_HIGHLIGHT: RgbaColor = { r: 254 / 255, g: 240 / 255, b: 138 / 255, a: 0.55 };
const DEFAULT_PEN: RgbaColor = { r: 51 / 255, g: 65 / 255, b: 85 / 255, a: 0.95 };

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function parseColorToRgba(color: string | undefined, fallback: RgbaColor): RgbaColor {
  if (!color) return fallback;
  const trimmed = color.trim();

  const rgbaMatch = trimmed.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*([0-9]*\.?[0-9]+))?\s*\)$/i
  );
  if (rgbaMatch) {
    const r = clamp01(Number(rgbaMatch[1]) / 255);
    const g = clamp01(Number(rgbaMatch[2]) / 255);
    const b = clamp01(Number(rgbaMatch[3]) / 255);
    const a = rgbaMatch[4] !== undefined ? clamp01(Number(rgbaMatch[4])) : fallback.a;
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b) && !Number.isNaN(a)) {
      return { r, g, b, a };
    }
  }

  if (trimmed.startsWith('#') || /^[0-9a-f]{3,8}$/i.test(trimmed)) {
    let clean = trimmed.replace('#', '');
    if (clean.length === 3 || clean.length === 4) {
      clean = clean.split('').map((c) => c + c).join('');
    }
    if (clean.length === 6 || clean.length === 8) {
      const r = parseInt(clean.slice(0, 2), 16);
      const g = parseInt(clean.slice(2, 4), 16);
      const b = parseInt(clean.slice(4, 6), 16);
      const a = clean.length === 8 ? parseInt(clean.slice(6, 8), 16) / 255 : fallback.a;
      if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b) && !Number.isNaN(a)) {
        return { r: clamp01(r / 255), g: clamp01(g / 255), b: clamp01(b / 255), a: clamp01(a) };
      }
    }
  }

  return fallback;
}

export async function embedAnnotationsIntoPdf(
  originalBytes: Uint8Array,
  annotations: PdfAnnotation[]
): Promise<Uint8Array> {
  if (annotations.length === 0) {
    return originalBytes;
  }

  const pdfDoc = await PDFDocument.load(originalBytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  for (const ann of annotations) {
    const pageIndex = ann.pageNumber - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;
    const page = pages[pageIndex];
    const { width, height } = page.getSize();

    if (ann.type === 'highlight') {
      // PDF coordinates are (0,0) at bottom-left
      const x = ann.rect.xRatio * width;
      const y = height - (ann.rect.yRatio + ann.rect.heightRatio) * height;
      const w = ann.rect.widthRatio * width;
      const h = ann.rect.heightRatio * height;
      const { r, g, b, a } = parseColorToRgba(ann.color, DEFAULT_HIGHLIGHT);

      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        color: rgb(r, g, b),
        opacity: a,
      });
    } else if (ann.type === 'pen' && ann.points.length >= 2) {
      const { r, g, b, a } = parseColorToRgba(ann.color, DEFAULT_PEN);
      const strokeOpacity = Math.min(a, 0.95);
      for (let i = 0; i < ann.points.length - 1; i++) {
        const p1 = ann.points[i];
        const p2 = ann.points[i + 1];

        page.drawLine({
          start: { x: p1.xRatio * width, y: height - p1.yRatio * height },
          end: { x: p2.xRatio * width, y: height - p2.yRatio * height },
          thickness: ann.width || 2,
          color: rgb(r, g, b),
          opacity: strokeOpacity,
        });
      }
    }
  }

  return await pdfDoc.save();
}
