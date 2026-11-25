import { PDFDocument, PDFImage } from 'pdf-lib';

export function detectImageMime(bytes: Uint8Array, pathHint?: string): string {
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  const lower = (pathHint || '').toLowerCase();
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.bmp')) return 'image/bmp';
  return 'image/png';
}

export async function convertImageToPngBytes(rawBytes: Uint8Array, mimeType: string): Promise<Uint8Array> {
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

export async function embedRasterImage(
  doc: PDFDocument,
  rawBytes: Uint8Array,
  pathHint?: string
): Promise<PDFImage> {
  const mime = detectImageMime(rawBytes, pathHint);
  if (mime === 'image/png') {
    return await doc.embedPng(rawBytes);
  }
  if (mime === 'image/jpeg') {
    return await doc.embedJpg(rawBytes);
  }
  const pngBytes = await convertImageToPngBytes(rawBytes, mime);
  return await doc.embedPng(pngBytes);
}
