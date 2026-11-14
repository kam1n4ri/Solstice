import { saveRecentPdf, removeRecentPdf } from './home/PdfRecentStorage';

/**
 * Synchronizes the recent files list when a PDF is renamed or saved to a new path.
 */
export function syncRecentPdf(
  oldPath: string | null | undefined,
  newPath: string,
  title: string,
  fileSize?: number
): void {
  if (oldPath && oldPath !== newPath) {
    removeRecentPdf(oldPath);
  }
  saveRecentPdf({
    id: newPath,
    title,
    filePath: newPath,
    lastModified: Date.now(),
    fileSize,
  });
}
