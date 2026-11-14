import { app, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PdfSaveResult } from '../shared/types';
import { recentFilesStore } from './recentFilesStore';
import {
  getSolsticePdfDir,
  parsePdfDataBuffer,
  getUniquePdfPath,
} from './pdfFileIoHelper';

export { getSolsticePdfDir, parsePdfDataBuffer, getUniquePdfPath };

const WORKING_COPY_MAP_FILE = 'pdf-working-copies.json';

async function getWorkingCopyMap(): Promise<Record<string, string>> {
  try {
    const mapPath = path.join(app.getPath('userData'), WORKING_COPY_MAP_FILE);
    const raw = await fs.readFile(mapPath, 'utf-8');
    const data = JSON.parse(raw);
    return typeof data === 'object' && data !== null ? data : {};
  } catch {
    return {};
  }
}

async function saveWorkingCopyMap(map: Record<string, string>): Promise<void> {
  try {
    const mapPath = path.join(app.getPath('userData'), WORKING_COPY_MAP_FILE);
    await fs.mkdir(path.dirname(mapPath), { recursive: true });
    await fs.writeFile(mapPath, JSON.stringify(map, null, 2), 'utf-8');
  } catch (err) {
    console.error('[PDF] Failed to save working copy map:', err);
  }
}

/**
 * Ensures a PDF file is copied into the Solstice PDFs directory as an isolated working copy.
 * External originals are NEVER mutated or deleted.
 * Reuses existing working copy for the same source file so edits persist across sessions
 * without spawning duplicate -1.pdf, -2.pdf files.
 */
export async function ensureWorkingCopy(filePath: string): Promise<string> {
  const solsticeDir = getSolsticePdfDir();
  await fs.mkdir(solsticeDir, { recursive: true });

  const normalizedSource = path.normalize(filePath);
  const normalizedSolstice = path.normalize(solsticeDir);

  // 1. If already inside Solstice PDFs directory, it is already an active working copy
  if (normalizedSource.startsWith(normalizedSolstice)) {
    return normalizedSource;
  }

  // 2. Check if we already have a mapped working copy for this external file
  const map = await getWorkingCopyMap();
  const existingWorkingPath = map[normalizedSource];
  if (existingWorkingPath) {
    try {
      await fs.access(existingWorkingPath);
      // Working copy exists on disk: reuse it directly with all user edits intact!
      return existingWorkingPath;
    } catch {
      // Previous working copy file was deleted, proceed to re-import
    }
  }

  // 3. Determine target working copy path
  const ext = path.extname(normalizedSource) || '.pdf';
  const baseName = path.basename(normalizedSource, ext);
  const defaultTarget = path.join(solsticeDir, `${baseName}${ext}`);

  let targetPath = defaultTarget;
  try {
    await fs.access(defaultTarget);
    // defaultTarget exists: check if it is already claimed by another distinct source file
    const isClaimedByOther = Object.entries(map).some(
      ([src, dest]) => src !== normalizedSource && path.normalize(dest) === path.normalize(defaultTarget)
    );
    if (isClaimedByOther) {
      const unique = await getUniquePdfPath(solsticeDir, baseName);
      targetPath = unique.filePath;
    }
  } catch {
    // defaultTarget is free
    targetPath = defaultTarget;
  }

  // 4. If targetPath doesn't exist on disk yet, copy external source over to working copy
  let targetExists = false;
  try {
    await fs.access(targetPath);
    targetExists = true;
  } catch {
    targetExists = false;
  }

  if (!targetExists) {
    await fs.copyFile(normalizedSource, targetPath);
  }

  // 5. Persist mapping
  map[normalizedSource] = targetPath;
  await saveWorkingCopyMap(map);

  return targetPath;
}

/**
 * Saves binary PDF data into a new unique working copy in Solstice PDFs directory.
 */
export async function createWorkingCopyFromData(
  data: Buffer | Uint8Array,
  preferredName?: string
): Promise<{ filePath: string; fileName: string }> {
  const solsticeDir = getSolsticePdfDir();
  const { filePath, fileName } = await getUniquePdfPath(
    solsticeDir,
    preferredName || 'Untitled-Note.pdf'
  );

  await fs.writeFile(filePath, data);
  return { filePath, fileName };
}

/**
 * Direct Save / Auto-Save for working PDF documents.
 * Always writes to the working copy in Solstice PDFs directory. External originals are never mutated.
 */
export async function saveWorkingPdf(
  filePath: string | undefined,
  fileName: string | undefined,
  title: string | undefined,
  data: Uint8Array | number[] | string
): Promise<PdfSaveResult> {
  const solsticeDir = getSolsticePdfDir();
  await fs.mkdir(solsticeDir, { recursive: true });

  const buffer = parsePdfDataBuffer(data);
  let targetPath = filePath;

  const rawTitle = title || fileName || 'Untitled.pdf';
  const cleanTitle =
    rawTitle
      .replace(/\.pdf$/i, '')
      .replace(/[/\\?%*:|"<>]/g, '-')
      .trim() || 'Untitled';

  const desiredFileName = `${cleanTitle}.pdf`;

  if (!targetPath) {
    const created = await createWorkingCopyFromData(buffer, desiredFileName);
    targetPath = created.filePath;
  } else {
    // Ensure we are strictly writing to the Solstice working copy
    const isInsideSolstice = path.normalize(targetPath).startsWith(path.normalize(solsticeDir));
    if (!isInsideSolstice) {
      targetPath = await ensureWorkingCopy(targetPath);
    }

    if (!targetPath.toLowerCase().endsWith('.pdf')) {
      targetPath = `${targetPath}.pdf`;
    }

    await fs.writeFile(targetPath, buffer);
  }

  const finalFileName = path.basename(targetPath);
  await recentFilesStore.addRecentFile({
    filePath: targetPath,
    fileName: finalFileName,
    tool: 'pdf',
  });

  return {
    success: true,
    filePath: targetPath,
    fileName: finalFileName,
  };
}

/**
 * Renames a working PDF on disk and updates recent files.
 */
export async function renameWorkingPdf(
  oldPath: string,
  newTitle: string
): Promise<{ success: boolean; newPath?: string; newFileName?: string; error?: string }> {
  try {
    if (!oldPath || !newTitle) {
      return { success: false, error: 'Missing path or title' };
    }

    const dir = path.dirname(oldPath);
    const { filePath: newPath, fileName: finalName } = await getUniquePdfPath(
      dir,
      newTitle,
      oldPath
    );

    if (newPath !== oldPath) {
      await fs.rename(oldPath, newPath);
      await recentFilesStore.removeRecentFile(oldPath);
    }

    await recentFilesStore.addRecentFile({
      filePath: newPath,
      fileName: finalName,
      tool: 'pdf',
    });

    return { success: true, newPath, newFileName: finalName };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Exports a PDF with user-chosen destination via native Save Dialog.
 */
export async function exportPdfViaDialog(
  parentWin: BrowserWindow | undefined,
  data: Uint8Array | number[] | string,
  defaultName?: string
): Promise<PdfSaveResult> {
  try {
    const cleanName =
      (defaultName || 'Exported-Document.pdf').replace(/\.pdf$/i, '') + '.pdf';

    const result = await dialog.showSaveDialog(parentWin as BrowserWindow, {
      title: 'Export PDF Document',
      defaultPath: cleanName,
      filters: [
        { name: 'PDF Document (*.pdf)', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    const buffer = parsePdfDataBuffer(data);
    let targetPath = result.filePath;
    if (!targetPath.toLowerCase().endsWith('.pdf')) {
      targetPath += '.pdf';
    }

    await fs.writeFile(targetPath, buffer);
    return { success: true, filePath: targetPath, fileName: path.basename(targetPath) };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
