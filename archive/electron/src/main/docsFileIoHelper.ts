import { app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createDocxFromHtml } from './docxConverter';
import {
  htmlToMarkdown,
  htmlToPlainText,
} from '../shared/formatConverter';

export function getSolsticeDocumentsDir(): string {
  try {
    return path.join(app.getPath('documents'), 'Solstice', 'Documents');
  } catch {
    return path.join(app.getPath('userData'), 'documents');
  }
}

export async function writeContentByExtension(
  targetPath: string,
  htmlContent: string
): Promise<void> {
  const ext = path.extname(targetPath).toLowerCase().replace('.', '');
  if (ext === 'docx') {
    const buf = await createDocxFromHtml(htmlContent);
    await fs.writeFile(targetPath, buf);
  } else if (ext === 'md') {
    await fs.writeFile(targetPath, htmlToMarkdown(htmlContent), 'utf-8');
  } else if (ext === 'txt') {
    await fs.writeFile(targetPath, htmlToPlainText(htmlContent), 'utf-8');
  } else {
    await fs.writeFile(targetPath, htmlContent, 'utf-8');
  }
}

/**
 * Returns a unique file path if desired destination already exists on disk
 */
export async function getUniqueDocPath(
  directory: string,
  baseName: string,
  ext: string,
  currentPath?: string
): Promise<string> {
  let candidate = path.join(directory, `${baseName}${ext}`);
  if (currentPath && candidate === currentPath) {
    return candidate;
  }
  let counter = 1;
  while (true) {
    try {
      await fs.access(candidate);
      // File exists and is not the current file, try next suffix
      if (currentPath && candidate === currentPath) {
        return candidate;
      }
      candidate = path.join(directory, `${baseName} (${counter})${ext}`);
      counter++;
    } catch {
      // File does not exist, safe to use
      return candidate;
    }
  }
}
