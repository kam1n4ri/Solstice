export interface RecentPdfItem {
  id: string;
  title: string;
  filePath: string;
  lastModified: number;
  fileSize?: number;
  pageCount?: number;
  starred?: boolean;
}

const PDF_RECENT_STORAGE_KEY = 'solstice:pdf:recent_docs';
const PDF_STARRED_STORAGE_KEY = 'solstice:pdf:starred_docs';

export function formatPdfDate(timestamp: number): string {
  const now = Date.now();
  const diffMinutes = Math.floor((now - timestamp) / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatPdfFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getStarredPdfs(): string[] {
  try {
    const raw = localStorage.getItem(PDF_STARRED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleStarredPdf(id: string): boolean {
  try {
    const starred = getStarredPdfs();
    const idx = starred.indexOf(id);
    let nextStarred: string[];
    let isNowStarred = false;

    if (idx >= 0) {
      nextStarred = starred.filter((s) => s !== id);
    } else {
      nextStarred = [...starred, id];
      isNowStarred = true;
    }

    localStorage.setItem(PDF_STARRED_STORAGE_KEY, JSON.stringify(nextStarred));
    return isNowStarred;
  } catch {
    return false;
  }
}

export async function fetchMergedRecentPdfs(): Promise<RecentPdfItem[]> {
  const mergedMap = new Map<string, RecentPdfItem>();
  const starredIds = new Set(getStarredPdfs());
  let hasBackend = false;

  // 1. Authoritative backend documents verified on disk
  try {
    if (window.solsticeAPI?.getRecentFiles) {
      const backendFiles = await window.solsticeAPI.getRecentFiles();
      hasBackend = true;
      backendFiles
        .filter((f) => f.tool === 'pdf')
        .forEach((f) => {
          const key = f.filePath;
          const cleanTitle = f.fileName.replace(/\.pdf$/i, '').trim();

          mergedMap.set(key, {
            id: key,
            title: cleanTitle || 'Untitled document',
            filePath: f.filePath,
            lastModified: f.lastModified || Date.now(),
            fileSize: f.fileSize,
            starred: starredIds.has(key),
          });
        });
    }
  } catch (err) {
    console.error('Failed to fetch backend recent PDFs:', err);
  }

  // 2. Enrich records from local storage or fallback in web mode
  try {
    const raw = localStorage.getItem(PDF_RECENT_STORAGE_KEY);
    if (raw) {
      const localItems: RecentPdfItem[] = JSON.parse(raw);
      localItems.forEach((item) => {
        const key = item.filePath || item.id;
        if (mergedMap.has(key)) {
          const existing = mergedMap.get(key)!;
          if (item.title && item.title !== 'Untitled' && item.title !== 'Untitled document') {
            existing.title = item.title.replace(/\.pdf$/i, '').trim();
          }
          if (item.lastModified > existing.lastModified) {
            existing.lastModified = item.lastModified;
          }
          if (item.fileSize && !existing.fileSize) {
            existing.fileSize = item.fileSize;
          }
          if (item.pageCount && !existing.pageCount) {
            existing.pageCount = item.pageCount;
          }
          existing.starred = starredIds.has(key) || !!existing.starred;
        } else if (!hasBackend) {
          mergedMap.set(key, {
            ...item,
            starred: starredIds.has(key) || !!item.starred,
          });
        }
      });
    }
  } catch (err) {
    console.error('Failed to parse local recent PDFs:', err);
  }

  const result = Array.from(mergedMap.values()).sort((a, b) => b.lastModified - a.lastModified);

  // 3. Keep localStorage synchronized and purged of deleted/renamed ghosts
  if (hasBackend) {
    try {
      localStorage.setItem(PDF_RECENT_STORAGE_KEY, JSON.stringify(result));
    } catch {
      // Ignore local storage error
    }
  }

  return result;
}

export function saveRecentPdf(item: RecentPdfItem): void {
  try {
    const raw = localStorage.getItem(PDF_RECENT_STORAGE_KEY);
    const localItems: RecentPdfItem[] = raw ? JSON.parse(raw) : [];
    const filtered = localItems.filter(
      (existing) => existing.id !== item.id && existing.filePath !== item.filePath
    );
    filtered.unshift(item);
    const capped = filtered.slice(0, 30);
    localStorage.setItem(PDF_RECENT_STORAGE_KEY, JSON.stringify(capped));
  } catch (err) {
    console.error('Failed to save recent PDF to local storage:', err);
  }
}

export function removeRecentPdf(idOrPath: string): void {
  try {
    const raw = localStorage.getItem(PDF_RECENT_STORAGE_KEY);
    if (!raw) return;
    const localItems: RecentPdfItem[] = JSON.parse(raw);
    const filtered = localItems.filter(
      (item) => item.id !== idOrPath && item.filePath !== idOrPath
    );
    localStorage.setItem(PDF_RECENT_STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to remove recent PDF:', err);
  }
}

export async function removeRecentPdfAsync(
  id: string,
  filePath?: string | null,
  deleteFromDisk: boolean = true
): Promise<boolean> {
  try {
    const targetPath = filePath || id;
    const isSolsticeWorkingCopy =
      targetPath &&
      (targetPath.includes('/Solstice/PDFs') ||
        targetPath.includes('\\Solstice\\PDFs') ||
        targetPath.includes('Solstice/PDFs'));

    if (deleteFromDisk && targetPath && isSolsticeWorkingCopy && window.solsticeAPI?.deleteFile) {
      const result = await window.solsticeAPI.deleteFile(targetPath);
      if (!result.success && !result.error?.includes('ENOENT')) {
        console.warn('Physical file deletion warning:', result.error);
      }
    } else if (targetPath && window.solsticeAPI?.removeRecentFile) {
      await window.solsticeAPI.removeRecentFile(targetPath, false);
    }

    const raw = localStorage.getItem(PDF_RECENT_STORAGE_KEY);
    if (raw) {
      const localItems: RecentPdfItem[] = JSON.parse(raw);
      const filtered = localItems.filter(
        (item) => item.id !== id && (!targetPath || item.filePath !== targetPath)
      );
      localStorage.setItem(PDF_RECENT_STORAGE_KEY, JSON.stringify(filtered));
    }

    const starred = getStarredPdfs().filter((s) => s !== id && s !== targetPath);
    localStorage.setItem(PDF_STARRED_STORAGE_KEY, JSON.stringify(starred));

    return true;
  } catch (err) {
    console.error('Failed to delete recent PDF entry:', err);
    return false;
  }
}
