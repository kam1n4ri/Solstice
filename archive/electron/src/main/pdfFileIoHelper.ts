import { app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Returns the default directory where Solstice stores working PDF documents.
 */
export function getSolsticePdfDir(): string {
  try {
    return path.join(app.getPath('documents'), 'Solstice', 'PDFs');
  } catch {
    return path.join(app.getPath('userData'), 'pdfs');
  }
}

/**
 * Parses raw data (Uint8Array, array of numbers, or Base64 string) into a Node Buffer.
 */
export function parsePdfDataBuffer(data: Uint8Array | number[] | string): Buffer {
  if (typeof data === 'string') {
    const base64 = data.includes(',') ? data.split(',')[1] : data;
    return Buffer.from(base64, 'base64');
  }
  return Buffer.from(data);
}

/**
 * Finds a collision-free file path in target directory.
 * If currentPath is provided and matches the computed path, it will be reused.
 */
export async function getUniquePdfPath(
  dir: string,
  preferredName: string,
  currentPath?: string
): Promise<{ filePath: string; fileName: string }> {
  await fs.mkdir(dir, { recursive: true });

  const rawBase =
    preferredName
      .replace(/\.pdf$/i, '')
      .replace(/[/\\?%*:|"<>]/g, '-')
      .trim() || 'Document';

  const ext = '.pdf';
  let targetFileName = `${rawBase}${ext}`;
  let targetPath = path.join(dir, targetFileName);
  let counter = 1;

  while (true) {
    try {
      if (currentPath && path.resolve(targetPath) === path.resolve(currentPath)) {
        break;
      }
      await fs.access(targetPath);
      targetFileName = `${rawBase}-${counter}${ext}`;
      targetPath = path.join(dir, targetFileName);
      counter++;
    } catch {
      break;
    }
  }

  return { filePath: targetPath, fileName: targetFileName };
}
