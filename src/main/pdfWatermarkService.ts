import fs from 'fs/promises';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { PdfWatermarkPayload, PdfWatermarkResult } from '../shared/types/pdf';
import { getSolsticePdfDir, getUniquePdfPath } from './pdfFileIoHelper';
import { recentFilesStore } from './recentFilesStore';

function hexToRgb(hex?: string): { r: number; g: number; b: number } {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return { r: 0.4, g: 0.45, b: 0.55 };
  }
  const num = parseInt(hex.slice(1), 16);
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

function getFilteredPageIndices(
  totalPages: number,
  scope?: 'all' | 'odd' | 'even' | 'range',
  customPages?: string
): number[] {
  const indices: number[] = [];
  if (scope === 'odd') {
    for (let i = 0; i < totalPages; i += 2) indices.push(i);
  } else if (scope === 'even') {
    for (let i = 1; i < totalPages; i += 2) indices.push(i);
  } else if (scope === 'range' && customPages) {
    const tokens = customPages.split(',').map((s) => s.trim()).filter(Boolean);
    const set = new Set<number>();
    for (const token of tokens) {
      if (token.includes('-')) {
        const [startStr, endStr] = token.split('-');
        const start = Math.max(1, parseInt(startStr, 10) || 1);
        const end = Math.min(totalPages, parseInt(endStr, 10) || start);
        for (let p = start; p <= end; p++) set.add(p - 1);
      } else {
        const p = parseInt(token, 10);
        if (p >= 1 && p <= totalPages) set.add(p - 1);
      }
    }
    return Array.from(set).sort((a, b) => a - b);
  } else {
    for (let i = 0; i < totalPages; i++) indices.push(i);
  }
  return indices;
}

export async function applyPdfWatermark(payload: PdfWatermarkPayload): Promise<PdfWatermarkResult> {
  try {
    let srcBytes: Uint8Array;
    if (payload.filePath) {
      srcBytes = new Uint8Array(await fs.readFile(payload.filePath));
    } else if (payload.fileData) {
      srcBytes = new Uint8Array(payload.fileData);
    } else {
      return { success: false, error: 'No source PDF document provided.' };
    }

    const pdfDoc = await PDFDocument.load(srcBytes, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    const isImage = payload.type === 'image';
    const opacity = payload.opacity ?? 0.22;
    const angle = payload.rotation ?? 45;
    const rad = (angle * Math.PI) / 180;
    const xPercent = payload.xPercent ?? 50;
    const yPercent = payload.yPercent ?? 50;

    const targetIndices = getFilteredPageIndices(totalPages, payload.pagesScope, payload.customPages);

    if (isImage) {
      // 1. Image Watermark
      let imgBytes: Uint8Array | null = null;
      if (payload.imagePath) {
        imgBytes = new Uint8Array(await fs.readFile(payload.imagePath));
      } else if (payload.imageData) {
        imgBytes = new Uint8Array(payload.imageData);
      }

      if (!imgBytes || imgBytes.length === 0) {
        return { success: false, error: 'No watermark image provided.' };
      }

      // Check PNG magic bytes: 0x89, 0x50, 0x4E, 0x47
      const isPng =
        imgBytes[0] === 0x89 && imgBytes[1] === 0x50 && imgBytes[2] === 0x4e && imgBytes[3] === 0x47;

      let embeddedImg;
      try {
        embeddedImg = isPng ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);
      } catch (err) {
        // Fallback: try the other format in case detection failed
        try {
          embeddedImg = isPng ? await pdfDoc.embedJpg(imgBytes) : await pdfDoc.embedPng(imgBytes);
        } catch {
          return { success: false, error: 'Failed to embed watermark image (unsupported format).' };
        }
      }

      const imgScale = payload.imageScale ?? 0.35;

      for (const idx of targetIndices) {
        const page = pages[idx];
        if (!page) continue;
        const { width: pageWidth, height: pageHeight } = page.getSize();

        const drawWidth = pageWidth * imgScale;
        const drawHeight = (drawWidth / embeddedImg.width) * embeddedImg.height;

        const targetCenterX = (xPercent / 100) * pageWidth;
        const targetCenterY = (1 - yPercent / 100) * pageHeight;

        const x = targetCenterX - (drawWidth / 2) * Math.cos(rad) + (drawHeight / 2) * Math.sin(rad);
        const y = targetCenterY - (drawWidth / 2) * Math.sin(rad) - (drawHeight / 2) * Math.cos(rad);

        page.drawImage(embeddedImg, {
          x,
          y,
          width: drawWidth,
          height: drawHeight,
          opacity,
          rotate: degrees(angle),
        });
      }
    } else {
      // 2. Text Watermark
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const text = payload.text || 'CONFIDENTIAL';
      const fontSize = payload.fontSize || 48;
      const { r, g, b } = hexToRgb(payload.colorHex);

      for (const idx of targetIndices) {
        const page = pages[idx];
        if (!page) continue;
        const { width: pageWidth, height: pageHeight } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        const targetCenterX = (xPercent / 100) * pageWidth;
        const targetCenterY = (1 - yPercent / 100) * pageHeight;

        const x = targetCenterX - (textWidth / 2) * Math.cos(rad) + (textHeight / 2) * Math.sin(rad);
        const y = targetCenterY - (textWidth / 2) * Math.sin(rad) - (textHeight / 2) * Math.cos(rad);

        page.drawText(text, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(r, g, b),
          opacity,
          rotate: degrees(angle),
        });
      }
    }

    const stampedBytes = await pdfDoc.save();
    const defaultDir = getSolsticePdfDir();
    const defaultName = payload.defaultName || `Watermarked_${Date.now()}.pdf`;
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
      pageCount: totalPages,
      data: Array.from(stampedBytes),
    };
  } catch (err) {
    console.error('[PDF-IPC] Watermarking failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to apply watermark.',
    };
  }
}
