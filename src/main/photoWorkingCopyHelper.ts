import { app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

const PHOTO_WORKING_COPY_MAP_FILE = 'photo-working-copies.json';

export function getSolsticePhotoDir(): string {
  return path.join(app.getPath('documents'), 'Solstice', 'Photos');
}

export async function getPhotoWorkingCopyMap(): Promise<Record<string, string>> {
  try {
    const mapPath = path.join(app.getPath('userData'), PHOTO_WORKING_COPY_MAP_FILE);
    const raw = await fs.readFile(mapPath, 'utf-8');
    const data = JSON.parse(raw);
    return typeof data === 'object' && data !== null ? data : {};
  } catch {
    return {};
  }
}

export async function savePhotoWorkingCopyMap(map: Record<string, string>): Promise<void> {
  try {
    const mapPath = path.join(app.getPath('userData'), PHOTO_WORKING_COPY_MAP_FILE);
    await fs.mkdir(path.dirname(mapPath), { recursive: true });
    await fs.writeFile(mapPath, JSON.stringify(map, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Photo] Failed to save working copy map:', err);
  }
}

export async function unmapPhotoWorkingCopy(targetPath: string): Promise<void> {
  try {
    const map = await getPhotoWorkingCopyMap();
    const normalizedTarget = path.normalize(targetPath);
    let changed = false;

    for (const [src, dest] of Object.entries(map)) {
      if (path.normalize(dest) === normalizedTarget || path.normalize(src) === normalizedTarget) {
        delete map[src];
        changed = true;
      }
    }

    if (changed) {
      await savePhotoWorkingCopyMap(map);
    }
  } catch (err) {
    console.error('[Photo] Failed to unmap working copy:', err);
  }
}

export async function getUniquePhotoPath(dir: string, baseName: string, ext: string = '.png'): Promise<string> {
  let counter = 1;
  let target = path.join(dir, `${baseName}${ext}`);
  while (true) {
    try {
      await fs.access(target);
      target = path.join(dir, `${baseName}-${counter}${ext}`);
      counter++;
    } catch {
      return target;
    }
  }
}
