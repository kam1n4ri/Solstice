import { ipcMain } from 'electron';
import * as fs from 'fs/promises';
import { PDFDocument } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import {
  PdfProtectPayload,
  PdfProtectResult,
  PdfUnlockPayload,
  PdfUnlockResult,
} from '../shared/types';
import { getSolsticePdfDir, getUniquePdfPath } from './pdfFileIoHelper';
import { recentFilesStore } from './recentFilesStore';

export function registerPdfSecurityHandlers(): void {
  // 1. Password Protect / Encrypt PDF
  ipcMain.handle(
    'pdf:protect',
    async (_event, payload: PdfProtectPayload): Promise<PdfProtectResult> => {
      try {
        if (!payload.password || payload.password.trim().length === 0) {
          return { success: false, error: 'A password is required to encrypt the document.' };
        }

        let srcBytes: Uint8Array;
        if (payload.filePath) {
          srcBytes = new Uint8Array(await fs.readFile(payload.filePath));
        } else if (payload.fileData) {
          srcBytes = new Uint8Array(payload.fileData);
        } else {
          return { success: false, error: 'No source PDF document provided.' };
        }

        // Encrypt using pure JS AES-256
        const encryptedBytes = await encryptPDF(srcBytes, payload.password);

        const defaultDir = getSolsticePdfDir();
        const defaultName = payload.defaultName || `Protected_${Date.now()}.pdf`;
        const { filePath: targetPath, fileName } = await getUniquePdfPath(defaultDir, defaultName);

        await fs.writeFile(targetPath, Buffer.from(encryptedBytes));

        await recentFilesStore.addRecentFile({
          filePath: targetPath,
          fileName,
          tool: 'pdf',
        });

        return {
          success: true,
          filePath: targetPath,
          fileName,
        };
      } catch (err) {
        console.error('[PDF-IPC] Protect failed:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to encrypt document.',
        };
      }
    }
  );

  // 2. Unlock / Decrypt PDF (Remove Security)
  ipcMain.handle(
    'pdf:unlock',
    async (_event, payload: PdfUnlockPayload): Promise<PdfUnlockResult> => {
      try {
        let srcBytes: Uint8Array;
        if (payload.filePath) {
          srcBytes = new Uint8Array(await fs.readFile(payload.filePath));
        } else if (payload.fileData) {
          srcBytes = new Uint8Array(payload.fileData);
        } else {
          return { success: false, error: 'No source PDF document provided.' };
        }

        // Load document ignoring encryption trailer
        const loadedDoc = await PDFDocument.load(srcBytes, { ignoreEncryption: true });

        // Copy all pages into a clean, unencrypted PDFDocument
        const cleanDoc = await PDFDocument.create();
        const pageIndices = loadedDoc.getPageIndices();
        const copiedPages = await cleanDoc.copyPages(loadedDoc, pageIndices);
        copiedPages.forEach((page) => cleanDoc.addPage(page));

        const cleanBytes = await cleanDoc.save();

        const defaultDir = getSolsticePdfDir();
        const defaultName = payload.defaultName || `Unlocked_${Date.now()}.pdf`;
        const { filePath: targetPath, fileName } = await getUniquePdfPath(defaultDir, defaultName);

        await fs.writeFile(targetPath, Buffer.from(cleanBytes));

        await recentFilesStore.addRecentFile({
          filePath: targetPath,
          fileName,
          tool: 'pdf',
        });

        return {
          success: true,
          filePath: targetPath,
          fileName,
          data: Array.from(cleanBytes),
        };
      } catch (err) {
        console.error('[PDF-IPC] Unlock failed:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to remove document security.',
        };
      }
    }
  );
}
