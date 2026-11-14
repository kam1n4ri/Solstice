import { ipcMain, dialog, BrowserWindow, nativeImage } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';
import {
  PdfConvertImagesPayload,
  PdfConvertImagesResult,
  PdfExportImagesPayload,
  PdfExportImagesResult,
} from '../shared/types';
import { getSolsticePdfDir, getUniquePdfPath } from './pdfFileIoHelper';
import { recentFilesStore } from './recentFilesStore';

export function registerPdfConvertHandlers(): void {
  // 1. Select Image Files (JPG, PNG, WebP)
  ipcMain.handle(
    'pdf:select-images',
    async (event): Promise<{ canceled: boolean; filePaths: string[] }> => {
      const parentWin = BrowserWindow.fromWebContents(event.sender) || undefined;
      const result = await dialog.showOpenDialog(parentWin as BrowserWindow, {
        title: 'Select Images to Convert into PDF',
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true, filePaths: [] };
      }
      return { canceled: false, filePaths: result.filePaths };
    }
  );

  // 2. Convert Images to PDF
  ipcMain.handle(
    'pdf:convert-images',
    async (_event, payload: PdfConvertImagesPayload): Promise<PdfConvertImagesResult> => {
      try {
        if (!payload.imagePaths || payload.imagePaths.length === 0) {
          return { success: false, error: 'No images provided for conversion.' };
        }

        const pdfDoc = await PDFDocument.create();
        const margin = payload.margin ?? 18; // 18pt padding default

        for (const imgPath of payload.imagePaths) {
          const imgBytes = await fs.readFile(imgPath);
          const ext = path.extname(imgPath).toLowerCase();

          let embeddedImg;
          if (ext === '.png') {
            embeddedImg = await pdfDoc.embedPng(imgBytes);
          } else if (ext === '.jpg' || ext === '.jpeg') {
            embeddedImg = await pdfDoc.embedJpg(imgBytes);
          } else {
            // For .webp or other formats, convert to PNG via Electron nativeImage
            const nImg = nativeImage.createFromBuffer(imgBytes);
            const pngBuf = nImg.toPNG();
            embeddedImg = await pdfDoc.embedPng(pngBuf);
          }

          const imgWidth = embeddedImg.width;
          const imgHeight = embeddedImg.height;

          let pageWidth = imgWidth + margin * 2;
          let pageHeight = imgHeight + margin * 2;

          if (payload.fitToPage === 'a4-contain') {
            const isLandscape = payload.orientation === 'landscape' ||
              (payload.orientation === 'auto' && imgWidth > imgHeight);
            pageWidth = isLandscape ? 841.89 : 595.28;
            pageHeight = isLandscape ? 595.28 : 841.89;

            const availWidth = pageWidth - margin * 2;
            const availHeight = pageHeight - margin * 2;
            const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);

            const drawWidth = imgWidth * scale;
            const drawHeight = imgHeight * scale;
            const drawX = margin + (availWidth - drawWidth) / 2;
            const drawY = margin + (availHeight - drawHeight) / 2;

            const page = pdfDoc.addPage([pageWidth, pageHeight]);
            page.drawImage(embeddedImg, {
              x: drawX,
              y: drawY,
              width: drawWidth,
              height: drawHeight,
            });
          } else {
            // Original dimensions
            const page = pdfDoc.addPage([pageWidth, pageHeight]);
            page.drawImage(embeddedImg, {
              x: margin,
              y: margin,
              width: imgWidth,
              height: imgHeight,
            });
          }
        }

        const pdfBytes = await pdfDoc.save();
        const pageCount = pdfDoc.getPageCount();

        let targetPath = payload.outputPath;
        let fileName = '';
        if (!targetPath) {
          const defaultDir = getSolsticePdfDir();
          const defaultName = payload.defaultName || `Converted_${Date.now()}.pdf`;
          const unique = await getUniquePdfPath(defaultDir, defaultName);
          targetPath = unique.filePath;
          fileName = unique.fileName;
        } else {
          fileName = path.basename(targetPath);
        }

        await fs.writeFile(targetPath, Buffer.from(pdfBytes));

        await recentFilesStore.addRecentFile({
          filePath: targetPath,
          fileName,
          tool: 'pdf',
        });

        return {
          success: true,
          filePath: targetPath,
          fileName,
          pageCount,
          data: Array.from(pdfBytes),
        };
      } catch (err) {
        console.error('[PDF-IPC] Image conversion failed:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to convert images to PDF.',
        };
      }
    }
  );

  // 3. Export PDF Pages to Images (PNG/JPG)
  ipcMain.handle(
    'pdf:export-images',
    async (event, payload: PdfExportImagesPayload): Promise<PdfExportImagesResult> => {
      try {
        if (!payload.images || payload.images.length === 0) {
          return { success: false, error: 'No page frames provided to export.' };
        }

        const parentWin = BrowserWindow.fromWebContents(event.sender) || undefined;
        const dirRes = await dialog.showOpenDialog(parentWin as BrowserWindow, {
          title: 'Select Destination Folder for Exported Images',
          properties: ['openDirectory', 'createDirectory'],
          defaultPath: getSolsticePdfDir(),
        });

        if (dirRes.canceled || dirRes.filePaths.length === 0) {
          return { success: false, canceled: true };
        }

        const outputDir = dirRes.filePaths[0];
        const baseName = payload.baseName || 'Document';
        const exportedFiles: string[] = [];

        for (const item of payload.images) {
          // Data URL is in format "data:image/png;base64,..."
          const matches = item.dataUrl.match(/^data:image\/(png|jpeg);base64,(.+)$/);
          if (matches) {
            const ext = matches[1] === 'jpeg' ? 'jpg' : 'png';
            const buffer = Buffer.from(matches[2], 'base64');
            const fileName = `${baseName}_page_${item.pageNumber}.${ext}`;
            const outPath = path.join(outputDir, fileName);
            await fs.writeFile(outPath, buffer);
            exportedFiles.push(outPath);
          }
        }

        return {
          success: true,
          outputDir,
          exportedFiles,
        };
      } catch (err) {
        console.error('[PDF-IPC] Export images failed:', err);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Failed to export images.',
        };
      }
    }
  );
}
