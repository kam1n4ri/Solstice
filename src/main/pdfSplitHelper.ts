import * as fs from 'fs/promises';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';
import { PdfSplitPayload } from '../shared/types';

export interface SplitOutputItem {
  filePath: string;
  fileName: string;
  pageCount: number;
  data: number[];
  fileSize: number;
}

export async function executePdfSplit(
  srcDoc: PDFDocument,
  baseName: string,
  outputDir: string,
  payload: PdfSplitPayload
): Promise<{ outputPaths: string[]; outputFiles: SplitOutputItem[] }> {
  const totalPages = srcDoc.getPageCount();
  const outputPaths: string[] = [];
  const outputFiles: SplitOutputItem[] = [];

  if (payload.mode === 'extract-all') {
    for (let i = 0; i < totalPages; i++) {
      const singleDoc = await PDFDocument.create();
      const [copied] = await singleDoc.copyPages(srcDoc, [i]);
      singleDoc.addPage(copied);
      const bytes = await singleDoc.save();

      const fileName = `${baseName}_page_${i + 1}.pdf`;
      const outPath = path.join(outputDir, fileName);
      await fs.writeFile(outPath, Buffer.from(bytes));
      outputPaths.push(outPath);
      outputFiles.push({
        filePath: outPath,
        fileName,
        pageCount: 1,
        data: Array.from(bytes),
        fileSize: bytes.length,
      });
    }
  } else {
    // Parse ranges string, e.g. "1-3, 5, 8-10"
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

        const fileName = `${baseName}_part_${partIndex}_(pages_${token}).pdf`;
        const outPath = path.join(outputDir, fileName);
        await fs.writeFile(outPath, Buffer.from(bytes));
        outputPaths.push(outPath);
        outputFiles.push({
          filePath: outPath,
          fileName,
          pageCount: copiedPages.length,
          data: Array.from(bytes),
          fileSize: bytes.length,
        });
        partIndex++;
      }
    }
  }

  return { outputPaths, outputFiles };
}
