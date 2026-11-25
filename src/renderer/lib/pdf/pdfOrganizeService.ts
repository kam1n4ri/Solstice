import { PDFDocument, degrees } from 'pdf-lib';
import { PdfOrganizePayload, PdfOrganizeResult } from '@shared/types';
import { invoke } from '@tauri-apps/api/core';

export async function executePdfOrganize(payload: PdfOrganizePayload): Promise<PdfOrganizeResult> {
  try {
    const loadedDocs: PDFDocument[] = [];

    if (payload.files && payload.files.length > 0) {
      for (const f of payload.files) {
        let b: Uint8Array | null = null;
        if (f.fileData) {
          b = new Uint8Array(f.fileData);
        } else if (f.filePath) {
          const res = await invoke<any>('pdf_read_file', { filePath: f.filePath });
          if (res.success && res.data) b = new Uint8Array(res.data);
        }
        if (b) loadedDocs.push(await PDFDocument.load(b, { ignoreEncryption: true }));
      }
    } else {
      let b: Uint8Array | null = null;
      if (payload.fileData) {
        b = new Uint8Array(payload.fileData);
      } else if (payload.filePath) {
        const res = await invoke<any>('pdf_read_file', { filePath: payload.filePath });
        if (res.success && res.data) b = new Uint8Array(res.data);
      }
      if (b) loadedDocs.push(await PDFDocument.load(b, { ignoreEncryption: true }));
    }

    if (loadedDocs.length === 0 || !payload.pageActions?.length) {
      return { success: false, error: 'Document must contain at least 1 valid page.' };
    }

    const newDoc = await PDFDocument.create();
    for (const action of payload.pageActions) {
      const srcDoc = loadedDocs[action.fileIndex ?? 0] || loadedDocs[0];
      const [copied] = await newDoc.copyPages(srcDoc, [action.originalPageIndex]);
      if (action.rotationDelta) {
        const angle = (copied.getRotation().angle + action.rotationDelta) % 360;
        copied.setRotation(degrees(angle));
      }
      newDoc.addPage(copied);
    }

    const organizedBytes = await newDoc.save();
    const defaultName = payload.defaultName || `Organized_${Date.now()}.pdf`;
    const targetPath = !payload.saveAsCopy ? payload.filePath : undefined;

    const saveRes = await invoke<any>('pdf_save_file', {
      payload: {
        filePath: targetPath,
        fileName: defaultName,
        title: defaultName.replace(/\.pdf$/i, ''),
        data: Array.from(organizedBytes),
      },
    });

    if (!saveRes.success) {
      return { success: false, error: saveRes.error || 'Failed to save organized PDF.' };
    }

    return {
      success: true,
      filePath: saveRes.filePath,
      fileName: saveRes.fileName || defaultName,
      pageCount: newDoc.getPageCount(),
      data: Array.from(organizedBytes),
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to organize pages.' };
  }
}
