import { PDFDocument, rgb } from 'pdf-lib';
import { PdfAnnotation } from './PdfAnnotationTypes';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 0.2, g: 0.25, b: 0.33 };
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

export async function embedAnnotationsIntoPdf(
  originalBytes: Uint8Array,
  annotations: PdfAnnotation[]
): Promise<Uint8Array> {
  if (annotations.length === 0) {
    return originalBytes;
  }

  try {
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

        page.drawRectangle({
          x,
          y,
          width: w,
          height: h,
          color: rgb(0.99, 0.94, 0.54), // Pale Amber highlight
          opacity: 0.45,
        });
      } else if (ann.type === 'pen' && ann.points.length >= 2) {
        const { r, g, b } = hexToRgb(ann.color);
        for (let i = 0; i < ann.points.length - 1; i++) {
          const p1 = ann.points[i];
          const p2 = ann.points[i + 1];

          const startX = p1.xRatio * width;
          const startY = height - p1.yRatio * height;
          const endX = p2.xRatio * width;
          const endY = height - p2.yRatio * height;

          page.drawLine({
            start: { x: startX, y: startY },
            end: { x: endX, y: endY },
            thickness: ann.width || 2,
            color: rgb(r, g, b),
            opacity: 0.95,
          });
        }
      }
    }

    return await pdfDoc.save();
  } catch (err) {
    console.warn('Failed to embed annotations into PDF vector tree:', err);
    return originalBytes;
  }
}
