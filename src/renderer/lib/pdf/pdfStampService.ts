import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import {
  PdfWatermarkPayload,
  PdfWatermarkResult,
  PdfPageNumberPayload,
  PdfPageNumberResult,
} from '@shared/types';
import { invoke } from '@tauri-apps/api/core';

function hexToRgb(hex?: string): { r: number; g: number; b: number } {
  if (!hex || !/^#[0-9a-fA-F]{3,8}$/.test(hex)) {
    return { r: 0.4, g: 0.45, b: 0.55 };
  }
  let clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
  const num = parseInt(clean.slice(0, 6), 16);
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

function getFilteredPageIndices(
  totalPages: number,
  scope?: 'all' | 'odd' | 'even' | 'range' | 'skip-first',
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

export async function executePdfWatermark(payload: PdfWatermarkPayload): Promise<PdfWatermarkResult> {
  try {
    let srcBytes: Uint8Array;
    if (payload.fileData) {
      srcBytes = new Uint8Array(payload.fileData);
    } else if (payload.filePath) {
      const readRes = await invoke<any>('pdf_read_file', { filePath: payload.filePath });
      if (!readRes.success || !readRes.data) {
        return { success: false, error: `Failed to read PDF: ${payload.filePath}` };
      }
      srcBytes = new Uint8Array(readRes.data);
    } else {
      return { success: false, error: 'No source PDF provided.' };
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
      let imgBytes: Uint8Array | null = null;
      if (payload.imageData) {
        imgBytes = new Uint8Array(payload.imageData);
      } else if (payload.imagePath) {
        const r = await invoke<any>('pdf_read_file', { filePath: payload.imagePath });
        if (r.success && r.data) imgBytes = new Uint8Array(r.data);
      }

      if (!imgBytes || imgBytes.length === 0) {
        return { success: false, error: 'No watermark image provided.' };
      }

      const isPng = imgBytes[0] === 0x89 && imgBytes[1] === 0x50 && imgBytes[2] === 0x4e && imgBytes[3] === 0x47;
      let embeddedImg;
      try {
        embeddedImg = isPng ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);
      } catch {
        embeddedImg = isPng ? await pdfDoc.embedJpg(imgBytes) : await pdfDoc.embedPng(imgBytes);
      }

      const imgScale = payload.imageScale ?? 0.35;
      for (const idx of targetIndices) {
        const page = pages[idx];
        if (!page) continue;
        const { width, height } = page.getSize();
        const drawWidth = width * imgScale;
        const drawHeight = (drawWidth / embeddedImg.width) * embeddedImg.height;
        const targetCenterX = (xPercent / 100) * width;
        const targetCenterY = (1 - yPercent / 100) * height;
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
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const text = payload.text || 'CONFIDENTIAL';
      const fontSize = payload.fontSize || 48;
      const { r, g, b } = hexToRgb(payload.colorHex);

      for (const idx of targetIndices) {
        const page = pages[idx];
        if (!page) continue;
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const textHeight = font.heightAtSize(fontSize);
        const targetCenterX = (xPercent / 100) * width;
        const targetCenterY = (1 - yPercent / 100) * height;
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
    const defaultName = payload.defaultName || `Watermarked_${Date.now()}.pdf`;

    const saveRes = await invoke<any>('pdf_save_file', {
      payload: {
        fileName: defaultName,
        data: Array.from(stampedBytes),
      },
    });

    if (!saveRes.success) {
      return { success: false, error: saveRes.error || 'Failed to save watermarked PDF.' };
    }

    return {
      success: true,
      filePath: saveRes.filePath,
      fileName: saveRes.fileName || defaultName,
      pageCount: totalPages,
      data: Array.from(stampedBytes),
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Watermarking failed.' };
  }
}

export async function executePdfPageNumbers(payload: PdfPageNumberPayload): Promise<PdfPageNumberResult> {
  try {
    let srcBytes: Uint8Array;
    if (payload.fileData) {
      srcBytes = new Uint8Array(payload.fileData);
    } else if (payload.filePath) {
      const readRes = await invoke<any>('pdf_read_file', { filePath: payload.filePath });
      if (!readRes.success || !readRes.data) {
        return { success: false, error: `Failed to read PDF: ${payload.filePath}` };
      }
      srcBytes = new Uint8Array(readRes.data);
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
    const defaultName = payload.defaultName || `Numbered_${Date.now()}.pdf`;

    const saveRes = await invoke<any>('pdf_save_file', {
      payload: {
        fileName: defaultName,
        data: Array.from(stampedBytes),
      },
    });

    if (!saveRes.success) {
      return { success: false, error: saveRes.error || 'Failed to save numbered PDF.' };
    }

    return {
      success: true,
      filePath: saveRes.filePath,
      fileName: saveRes.fileName || defaultName,
      pageCount: total,
      data: Array.from(stampedBytes),
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Adding page numbers failed.' };
  }
}
