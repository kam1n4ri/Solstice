import { app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { RecentFileRecord } from '../shared/types';

export class RecentFilesStore {
  private getStorePath(): string {
    return path.join(app.getPath('userData'), 'recent-files.json');
  }

  public async getRecentFiles(): Promise<RecentFileRecord[]> {
    try {
      const filePath = this.getStorePath();
      const data = await fs.readFile(filePath, 'utf-8');
      const items = JSON.parse(data);
      if (!Array.isArray(items)) return [];

      // Verify files still exist on disk to purge deleted or renamed ghosts
      const valid: RecentFileRecord[] = [];
      const seenPaths = new Set<string>();

      for (const item of items) {
        if (item.filePath) {
          const normalized = path.normalize(item.filePath);
          if (seenPaths.has(normalized)) continue;

          try {
            const stat = await fs.stat(normalized);
            seenPaths.add(normalized);
            valid.push({
              ...item,
              filePath: normalized,
              fileSize: item.fileSize || stat.size,
              lastModified: item.lastModified || stat.mtimeMs,
            });
          } catch {
            // File does not exist on disk, skip it
          }
        }
      }
      return valid;
    } catch {
      return [];
    }
  }

  public async addRecentFile(record: Omit<RecentFileRecord, 'lastModified'>): Promise<void> {
    try {
      const normalizedPath = path.normalize(record.filePath);
      const items = await this.getRecentFiles();
      // Remove duplicate entry if present
      const filtered = items.filter((item) => path.normalize(item.filePath) !== normalizedPath);

      let fileSize = record.fileSize;
      if (!fileSize) {
        try {
          const stat = await fs.stat(normalizedPath);
          fileSize = stat.size;
        } catch {
          // ignore stat error
        }
      }

      // Prepend updated record with latest timestamp
      filtered.unshift({
        ...record,
        filePath: normalizedPath,
        fileSize,
        lastModified: Date.now(),
      });
      // Cap at 20 items maximum
      const capped = filtered.slice(0, 20);
      const storePath = this.getStorePath();
      await fs.mkdir(path.dirname(storePath), { recursive: true });
      await fs.writeFile(storePath, JSON.stringify(capped, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to update recent files store:', err);
    }
  }

  public async removeRecentFile(filePath: string): Promise<void> {
    try {
      const normalizedPath = path.normalize(filePath);
      const items = await this.getRecentFiles();
      const filtered = items.filter((item) => path.normalize(item.filePath) !== normalizedPath);
      const storePath = this.getStorePath();
      await fs.writeFile(storePath, JSON.stringify(filtered, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to remove recent file from store:', err);
    }
  }

  public async clearRecentFiles(): Promise<void> {
    try {
      const storePath = this.getStorePath();
      await fs.writeFile(storePath, JSON.stringify([], null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to clear recent files store:', err);
    }
  }
}

export const recentFilesStore = new RecentFilesStore();
