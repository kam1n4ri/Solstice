import { PDFDocument } from 'pdf-lib';
import {
  PdfConvertImagesPayload,
  PdfConvertImagesResult,
  PdfExportImagesPayload,
  PdfExportImagesResult,
} from '@shared/types';
import { invoke } from '@tauri-apps/api/core';

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

async function convertImageToPngBytes(rawBytes: Uint8Array, mimeType: string): Promise<Uint8Array> {
  const blob = new Blob([rawBytes.buffer as ArrayBuffer], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((b) => {
        if (!b) {
          reject(new Error('Failed to convert image to PNG'));
          return;
        }
        b.arrayBuffer().then((buf) => resolve(new Uint8Array(buf))).catch(reject);
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for conversion'));
    };
    img.src = objectUrl;
  });
}

export async function executePdfConvertImages(
  payload: PdfConvertImagesPayload
): Promise<PdfConvertImagesResult> {
  try {
    if (!payload.imagePaths || payload.imagePaths.length === 0) {
      return { success: false, error: 'No image paths provided for PDF conversion.' };
    }

    const doc = await PDFDocument.create();
    const margin = payload.margin ?? 18;
    const fitMode = payload.fitToPage || 'a4-contain';

    for (const imagePath of payload.imagePaths) {
      const readRes = await invoke<any>('pdf_read_file', { filePath: imagePath });
      if (!readRes.success || !readRes.data) {
        return { success: false, error: `Failed to read image file: ${imagePath}` };
      }

      const rawBytes = new Uint8Array(readRes.data);
      const lower = imagePath.toLowerCase();

      let embeddedImage;
      if (lower.endsWith('.png')) {
        embeddedImage = await doc.embedPng(rawBytes);
      } else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
        embeddedImage = await doc.embedJpg(rawBytes);
      } else {
        // Fallback convert webp/bmp/gif to PNG
        const pngBytes = await convertImageToPngBytes(rawBytes, 'image/png');
        embeddedImage = await doc.embedPng(pngBytes);
      }

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

    const files = payload.images.map((img) => {
      const ext = img.dataUrl.startsWith('data:image/jpeg') ? 'jpg' : 'png';
      const base = payload.baseName || 'Document';
      const fileName = `${base}_page_${img.pageNumber}.${ext}`;
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
