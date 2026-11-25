import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import { decryptPdf } from '@shared/pdf/decryptPdf';
import {
  PdfProtectPayload,
  PdfProtectResult,
  PdfUnlockPayload,
  PdfUnlockResult,
} from '@shared/types';
import { invoke } from '@tauri-apps/api/core';

export async function executePdfProtect(payload: PdfProtectPayload): Promise<PdfProtectResult> {
  try {
    if (!payload.password || payload.password.trim().length === 0) {
      return { success: false, error: 'A password is required to encrypt the document.' };
    }

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
      return { success: false, error: 'No source PDF document provided.' };
    }

    const encryptedBytes = await encryptPDF(srcBytes, payload.password);
    const defaultName = payload.defaultName || `Protected_${Date.now()}.pdf`;

    const saveRes = await invoke<any>('pdf_save_file', {
      payload: {
        fileName: defaultName,
        data: Array.from(encryptedBytes),
      },
    });

    if (!saveRes.success) {
      return { success: false, error: saveRes.error || 'Failed to save encrypted document.' };
    }

    return {
      success: true,
      filePath: saveRes.filePath,
      fileName: saveRes.fileName || defaultName,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to encrypt document.' };
  }
}

export async function executePdfUnlock(payload: PdfUnlockPayload): Promise<PdfUnlockResult> {
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
      return { success: false, error: 'No source PDF document provided.' };
    }

    const { bytes: cleanBytes } = await decryptPdf(srcBytes, payload.password || '');
    const defaultName = payload.defaultName || `Unlocked_${Date.now()}.pdf`;

    const saveRes = await invoke<any>('pdf_save_file', {
      payload: {
        fileName: defaultName,
        data: Array.from(cleanBytes),
      },
    });

    if (!saveRes.success) {
      return { success: false, error: saveRes.error || 'Failed to save unlocked document.' };
    }

    return {
      success: true,
      filePath: saveRes.filePath,
      fileName: saveRes.fileName || defaultName,
      data: Array.from(cleanBytes),
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to unlock document.' };
  }
}
