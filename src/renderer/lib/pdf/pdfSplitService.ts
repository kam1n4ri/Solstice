import { PDFDocument } from 'pdf-lib';
import { PdfSplitPayload, PdfSplitResult } from '@shared/types';
import { invoke } from '@tauri-apps/api/core';

type SplitOutputItem = NonNullable<PdfSplitResult['outputFiles']>[number];

export async function executePdfSplit(payload: PdfSplitPayload): Promise<PdfSplitResult> {
  try {
    let srcBytes: Uint8Array;
    let baseName = payload.baseName || 'Document';

    if (payload.fileData) {
      srcBytes = new Uint8Array(payload.fileData);
    } else if (payload.filePath) {
      const readRes = await invoke<any>('pdf_read_file', { filePath: payload.filePath });
      if (!readRes.success || !readRes.data) {
        return { success: false, error: `Failed to read source PDF: ${payload.filePath}` };
      }
      srcBytes = new Uint8Array(readRes.data);
      const clean = payload.filePath.split(/[/\\]/).pop()?.replace(/\.pdf$/i, '');
      if (clean) baseName = clean;
    } else {
      return { success: false, error: 'No source PDF provided.' };
    }

    const srcDoc = await PDFDocument.load(srcBytes, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();
    const outputPaths: string[] = [];
    const outputFiles: SplitOutputItem[] = [];

    const filesToSave: { fileName: string; data: number[]; pageCount: number }[] = [];

    if (payload.mode === 'extract-all') {
      for (let i = 0; i < totalPages; i++) {
        const singleDoc = await PDFDocument.create();
        const [copied] = await singleDoc.copyPages(srcDoc, [i]);
        singleDoc.addPage(copied);
        const bytes = await singleDoc.save();
        const fileName = `${baseName}_page_${i + 1}.pdf`;
        filesToSave.push({ fileName, data: Array.from(bytes), pageCount: 1 });
      }
    } else {
      const rangeTokens = (payload.ranges || '1')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      let partIndex = 1;

      for (const token of rangeTokens) {
        const pageIndices: number[] = [];
        if (token.includes('-')) {
          const [startStr, endStr] = token.split('-');
          const start = Math.max(1, parseInt(startStr, 10));
          const end = Math.min(totalPages, parseInt(endStr, 10));
          if (!isNaN(start) && !isNaN(end) && start <= end) {
            for (let p = start; p <= end; p++) pageIndices.push(p - 1);
          }
        } else {
          const p = parseInt(token, 10);
          if (!isNaN(p) && p >= 1 && p <= totalPages) pageIndices.push(p - 1);
        }

        if (pageIndices.length > 0) {
          const subDoc = await PDFDocument.create();
          const copiedPages = await subDoc.copyPages(srcDoc, pageIndices);
          copiedPages.forEach((p) => subDoc.addPage(p));
          const bytes = await subDoc.save();
          const safeToken = token.replace(/[^0-9-]/g, '_');
          const fileName = `${baseName}_part_${partIndex}_(pages_${safeToken}).pdf`;
          filesToSave.push({ fileName, data: Array.from(bytes), pageCount: copiedPages.length });
          partIndex++;
        }
      }
    }

    if (filesToSave.length === 0) {
      return { success: false, error: 'No valid page ranges matched the source PDF.' };
    }

    // Save generated split parts
    for (const item of filesToSave) {
      const saveRes = await invoke<any>('pdf_save_file', {
        payload: {
          fileName: item.fileName,
          data: item.data,
        },
      });

      if (!saveRes.success || !saveRes.filePath) {
        return { success: false, error: saveRes.error || `Failed to save ${item.fileName}.` };
      }

      outputPaths.push(saveRes.filePath);
      outputFiles.push({
        filePath: saveRes.filePath,
        fileName: saveRes.fileName || item.fileName,
        pageCount: item.pageCount,
        data: item.data,
        fileSize: item.data.length,
      });
    }

    return { success: true, outputPaths, outputFiles };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to split PDF document.' };
  }
}
