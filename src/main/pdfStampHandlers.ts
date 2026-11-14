import { ipcMain } from 'electron';
import * as fs from 'fs/promises';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  PdfWatermarkPayload,
  PdfWatermarkResult,
  PdfPageNumberPayload,
  PdfPageNumberResult,
} from '../shared/types';
import { getSolsticePdfDir, getUniquePdfPath } from './pdfFileIoHelper';
import { recentFilesStore } from './recentFilesStore';

function hexToRgb(hex?: string) {
  if (!hex) return { r: 0.35, g: 0.35, b: 0.35 };
  let clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 0.35, g: 0.35, b: 0.35 };
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

function getFilteredPageIndices(
  totalPages: number,
  scope?: 'all' | 'skip-first' | 'odd' | 'even' | 'range',
  customPages?: string
): number[] {
  const indices: number[] = [];
  if (scope === 'skip-first') {
    for (let i = 1; i < totalPages; i++) indices.push(i);
  } else if (scope === 'odd') {
    for (let i = 0; i < totalPages; i += 2) indices.push(i);
  } else if (scope === 'even') {
    for (let i = 1; i < totalPages; i += 2) indices.push(i);
  } else if (scope === 'range' && customPages) {
    const tokens = customPages.split(',').map((s) => s.trim()).filter(Boolean);
    for (const token of tokens) {
      if (token.includes('-')) {
        const [startStr, endStr] = token.split('-');
        const start = Math.max(1, parseInt(startStr, 10));
        const end = Math.min(totalPages, parseInt(endStr, 10));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let p = start; p <= end; p++) indices.push(p - 1);
        }
      } else {
        const p = parseInt(token, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) indices.push(p - 1);
      }
    }
  } else {
    for (let i = 0; i < totalPages; i++) indices.push(i);
  }
  return indices;
}

import { applyPdfWatermark } from './pdfWatermarkService';

export function registerPdfStampHandlers(): void {
  // 1. Watermark PDF
  ipcMain.handle(
    'pdf:watermark',
    async (_event, payload: PdfWatermarkPayload): Promise<PdfWatermarkResult> => {
      return applyPdfWatermark(payload);
    }
  );

  // 2. Add Page Numbers
  ipcMain.handle(
    'pdf:page-numbers',
    async (_event, payload: PdfPageNumberPayload): Promise<PdfPageNumberResult> => {
      try {
        let srcBytes: Uint8Array;
        if (payload.filePath) {
          srcBytes = new Uint8Array(await fs.readFile(payload.filePath));
        } else if (payload.fileData) {
          srcBytes = new Uint8Array(payload.fileData);
        } else {
          return { success: false, error: 'No source PDF provided.' };
        }

        const pdfDoc = await PDFDocument.load(srcBytes, { ignoreEncryption: true });
        let font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        if (payload.fontFamily === 'times') {
          font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
        } else if (payload.fontFamily === 'courier') {
          font = await pdfDoc.embedFont(StandardFonts.Courier);
        }

        const pages = pdfDoc.getPages();
        const total = pages.length;
        const fontSize = payload.fontSize || 10;
        const margin = payload.margin ?? 28;
        const format = payload.format || 'Page {n} of {total}';
        const { r, g, b } = hexToRgb(payload.colorHex || '#475569');

        const targetIndices = getFilteredPageIndices(total, payload.pagesScope, payload.customPages);

        for (const idx of targetIndices) {
          const page = pages[idx];
          if (!page) continue;
          const { width, height } = page.getSize();
          const pageNum =
            (payload.firstNumber ?? 1) +
            (payload.pagesScope === 'skip-first' ? idx - 1 : idx) +
            (payload.startOffset || 0);

          const text = format.replace('{n}', `${pageNum}`).replace('{total}', `${total}`);
          const textWidth = font.widthOfTextAtSize(text, fontSize);

          const isTop = payload.position.startsWith('top');
          const isRight = payload.position.endsWith('right');
          const isCenter = payload.position.endsWith('center');
          const x = isCenter ? (width - textWidth) / 2 : isRight ? width - textWidth - margin : margin;
          const y = isTop ? height - margin - fontSize : margin;

          page.drawText(text, {
            x,
            y,
            size: fontSize,
            font,
            color: rgb(r, g, b),
            opacity: 0.9,
          });
        }

        const stampedBytes = await pdfDoc.save();
        const defaultDir = getSolsticePdfDir();
        const defaultName = payload.defaultName || `Numbered_${Date.now()}.pdf`;
        const { filePath: targetPath, fileName } = await getUniquePdfPath(defaultDir, defaultName);

        await fs.writeFile(targetPath, Buffer.from(stampedBytes));

        await recentFilesStore.addRecentFile({
          filePath: targetPath,
          fileName,
          tool: 'pdf',
        });

        return {
          success: true,
          filePath: targetPath,
          fileName,
          pageCount: total,
          data: Array.from(stampedBytes),
        };
      } catch (err) {
        console.error('[PDF-IPC] Page numbering failed:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to add page numbers.',
        };
      }
    }
  );
}
