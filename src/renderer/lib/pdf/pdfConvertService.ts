import { PDFDocument } from 'pdf-lib';
import {
  PdfConvertImageInput,
  PdfConvertImagesPayload,
  PdfConvertImagesResult,
  PdfExportImagesPayload,
  PdfExportImagesResult,
} from '@shared/types';
import { invoke } from '@tauri-apps/api/core';
import { embedRasterImage } from './pdfImageUtils';

// Standard A4 dimensions in points
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const commaIdx = dataUrl.indexOf(',');
  const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function executePdfConvertImages(
  payload: PdfConvertImagesPayload
): Promise<PdfConvertImagesResult> {
  try {
    const inputs: PdfConvertImageInput[] = payload.images?.length
      ? payload.images
      : (payload.imagePaths || []).map((filePath) => ({
          filePath,
          fileName: filePath.split(/[/\\]/).pop() || 'image.png',
        }));

    if (inputs.length === 0) {
      return { success: false, error: 'No image files provided for PDF conversion.' };
    }

    const doc = await PDFDocument.create();
    const margin = Math.max(0, payload.margin ?? 18);
    const fitMode = payload.fitToPage || 'a4-contain';

    for (const item of inputs) {
      let rawBytes: Uint8Array;
      if (item.fileData) {
        rawBytes = new Uint8Array(item.fileData);
      } else if (item.filePath) {
        const readRes = await invoke<any>('pdf_read_file', { filePath: item.filePath });
        if (!readRes.success || !readRes.data) {
          return { success: false, error: `Failed to read image file: ${item.filePath}` };
        }
        rawBytes = new Uint8Array(readRes.data);
      } else {
        return { success: false, error: `Missing image data for ${item.fileName}` };
      }

      const embeddedImage = await embedRasterImage(doc, rawBytes, item.fileName || item.filePath);

      const imgWidth = embeddedImage.width;
      const imgHeight = embeddedImage.height;

      let pageWidth = A4_WIDTH;
      let pageHeight = A4_HEIGHT;

      if (fitMode === 'original') {
        pageWidth = imgWidth + margin * 2;
        pageHeight = imgHeight + margin * 2;
      } else {
        let isLandscape = false;
        if (payload.orientation === 'landscape') {
          isLandscape = true;
        } else if (payload.orientation === 'auto') {
          isLandscape = imgWidth > imgHeight;
        }

        if (isLandscape) {
          pageWidth = A4_HEIGHT;
          pageHeight = A4_WIDTH;
        }
      }

      const page = doc.addPage([pageWidth, pageHeight]);
      const availableW = Math.max(10, pageWidth - margin * 2);
      const availableH = Math.max(10, pageHeight - margin * 2);

      let drawW = imgWidth;
      let drawH = imgHeight;

      if (fitMode === 'a4-contain') {
        const scale = Math.min(availableW / imgWidth, availableH / imgHeight, 1.0);
        drawW = imgWidth * scale;
        drawH = imgHeight * scale;
      } else if (fitMode === 'a4-cover') {
        const scale = Math.max(availableW / imgWidth, availableH / imgHeight);
        drawW = imgWidth * scale;
        drawH = imgHeight * scale;
      }

      const drawX = (pageWidth - drawW) / 2;
      const drawY = (pageHeight - drawH) / 2;

      page.drawImage(embeddedImage, {
        x: drawX,
        y: drawY,
        width: drawW,
        height: drawH,
      });
    }

    const pdfBytes = await doc.save();
    const defaultName = payload.defaultName || `Converted_Images_${Date.now()}.pdf`;

    const saveRes = await invoke<any>('pdf_save_file', {
      payload: {
        fileName: defaultName,
        data: Array.from(pdfBytes),
      },
    });

    if (!saveRes.success) {
      return { success: false, error: saveRes.error || 'Failed to save converted PDF.' };
    }

    return {
      success: true,
      filePath: saveRes.filePath,
      fileName: saveRes.fileName || defaultName,
      pageCount: doc.getPageCount(),
      data: Array.from(pdfBytes),
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to convert images to PDF.' };
  }
}

export async function executePdfExportImages(
  payload: PdfExportImagesPayload
): Promise<PdfExportImagesResult> {
  try {
    if (!payload.images || payload.images.length === 0) {
      return { success: false, error: 'No rendered images provided to export.' };
    }

    const rawBase = (payload.baseName || 'Document')
      .replace(/\.pdf$/i, '')
      .replace(/[/\\?%*:|"<>]/g, '-')
      .trim() || 'Document';
    const files = payload.images.map((img) => {
      const ext = img.dataUrl.startsWith('data:image/jpeg') ? 'jpg' : 'png';
      const fileName = `${rawBase}_page_${img.pageNumber}.${ext}`;
      const bytes = dataUrlToBytes(img.dataUrl);
      return {
        fileName,
        data: Array.from(bytes),
      };
    });

    const res = await invoke<any>('pdf_save_files_to_folder', { files });

    return {
      success: res.success,
      canceled: res.canceled,
      outputDir: res.folderPath,
      exportedFiles: res.folderPath ? files.map((f) => `${res.folderPath}/${f.fileName}`) : [],
      error: res.error,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to export images to folder.' };
  }
}
