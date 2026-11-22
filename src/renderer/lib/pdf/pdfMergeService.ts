import { PDFDocument } from 'pdf-lib';
import { PdfMergePayload, PdfMergeResult } from '@shared/types';
import { invoke } from '@tauri-apps/api/core';

export async function executePdfMerge(payload: PdfMergePayload): Promise<PdfMergeResult> {
  try {
    if (!payload.filePaths || payload.filePaths.length < 2) {
      return { success: false, error: 'At least 2 PDF files are required to merge.' };
    }

    const mergedDoc = await PDFDocument.create();

    for (const filePath of payload.filePaths) {
      const readRes = await invoke<any>('pdf_read_file', { filePath });
      if (!readRes.success || !readRes.data) {
        return { success: false, error: `Failed to read file: ${filePath}` };
      }
      const fileBytes = new Uint8Array(readRes.data);
      const srcDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
      const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
      copiedPages.forEach((page) => mergedDoc.addPage(page));
    }

    const mergedBytes = await mergedDoc.save();
    const defaultName = payload.defaultName || `Merged_Document_${Date.now()}.pdf`;

    const saveRes = await invoke<any>('pdf_save_file', {
      payload: {
        fileName: defaultName,
        data: Array.from(mergedBytes),
      },
    });

    if (!saveRes.success) {
      return { success: false, error: saveRes.error || 'Failed to save merged PDF.' };
    }

    return {
      success: true,
      filePath: saveRes.filePath,
      fileName: saveRes.fileName || defaultName,
      pageCount: mergedDoc.getPageCount(),
      data: Array.from(mergedBytes),
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to merge PDF files.' };
  }
}
