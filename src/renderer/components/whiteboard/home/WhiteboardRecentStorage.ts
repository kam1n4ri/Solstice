import { WHITEBOARD_RECENT_STORAGE_KEY } from '../WhiteboardConstants';

const WHITEBOARD_DISMISSED_STORAGE_KEY = 'solstice:whiteboard:dismissed_recents';

export interface RecentWhiteboardItem {
  id: string;
  title: string;
  filePath?: string | null;
  lastModified: number;
}

function getDismissedWhiteboards(): Set<string> {
  try {
    const raw = localStorage.getItem(WHITEBOARD_DISMISSED_STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function dismissRecentWhiteboard(idOrPath: string): void {
  try {
    const dismissed = getDismissedWhiteboards();
    dismissed.add(idOrPath);
    localStorage.setItem(WHITEBOARD_DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(dismissed)));
  } catch {}
}

function undismissRecentWhiteboard(idOrPath: string): void {
  try {
    const dismissed = getDismissedWhiteboards();
    if (dismissed.delete(idOrPath)) {
      localStorage.setItem(WHITEBOARD_DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(dismissed)));
    }
  } catch {}
}

export function formatWhiteboardDate(timestamp: number): string {
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

export async function fetchMergedRecentWhiteboards(): Promise<RecentWhiteboardItem[]> {
  const mergedMap = new Map<string, RecentWhiteboardItem>();
  const dismissed = getDismissedWhiteboards();

  // 1. Fetch persistent records from backend
  try {
    if (window.solsticeAPI?.getRecentFiles) {
      const backendFiles = await window.solsticeAPI.getRecentFiles();
      backendFiles
        .filter((f) => f.tool === 'whiteboard')
        .forEach((f) => {
          const key = f.filePath;
          if (dismissed.has(key)) return;
          const cleanTitle = f.fileName
            .replace(/\.(excalidraw|tldr|json|solstice)$/i, '')
            .replace(/[/\\?%*:|"<>]/g, ' ')
            .trim();

          mergedMap.set(key, {
            id: key,
            title: cleanTitle || 'Untitled whiteboard',
            filePath: f.filePath,
            lastModified: f.lastModified || Date.now(),
          });
        });
    }
  } catch (err) {
    console.error('Failed to fetch backend recent whiteboards:', err);
  }

  // 2. Fetch local storage records (for web mode or uncommitted sessions)
  try {
    const raw = localStorage.getItem(WHITEBOARD_RECENT_STORAGE_KEY);
    if (raw) {
      const localItems: RecentWhiteboardItem[] = JSON.parse(raw);
      localItems.forEach((item) => {
        const key = item.filePath || item.id;
        if (dismissed.has(key) || (item.filePath && dismissed.has(item.filePath)) || dismissed.has(item.id)) {
          return;
        }
        if (!mergedMap.has(key)) {
          mergedMap.set(key, item);
        } else {
          // If backend has the same key, preserve the freshest timestamp
          const existing = mergedMap.get(key)!;
          if (item.lastModified > existing.lastModified) {
            existing.lastModified = item.lastModified;
          }
        }
      });
    }
  } catch (err) {
    console.error('Failed to parse local recent whiteboards:', err);
  }

  return Array.from(mergedMap.values()).sort((a, b) => b.lastModified - a.lastModified);
}

export function saveRecentWhiteboard(item: RecentWhiteboardItem): void {
  try {
    if (item.filePath) undismissRecentWhiteboard(item.filePath);
    if (item.id) undismissRecentWhiteboard(item.id);
    const raw = localStorage.getItem(WHITEBOARD_RECENT_STORAGE_KEY);
    const localItems: RecentWhiteboardItem[] = raw ? JSON.parse(raw) : [];
    const filtered = localItems.filter(
      (existing) => existing.id !== item.id && (!item.filePath || existing.filePath !== item.filePath)
    );
    filtered.unshift(item);
    const capped = filtered.slice(0, 20);
    localStorage.setItem(WHITEBOARD_RECENT_STORAGE_KEY, JSON.stringify(capped));
  } catch (err) {
    console.error('Failed to save recent whiteboard to local storage:', err);
  }
}

export async function removeRecentWhiteboardAsync(
  id: string,
  filePath?: string | null,
  deleteFromDisk: boolean = true
): Promise<void> {
  // 1. Remove from local storage
  try {
    const raw = localStorage.getItem(WHITEBOARD_RECENT_STORAGE_KEY);
    if (raw) {
      const localItems: RecentWhiteboardItem[] = JSON.parse(raw);
      const filtered = localItems.filter((item) => item.id !== id && item.filePath !== filePath);
      localStorage.setItem(WHITEBOARD_RECENT_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (err) {
    console.error('Failed to remove from local storage:', err);
  }

  // 2. Persist dismissed state or safely remove from disk
  const targetPath = filePath || (id.includes('/') || id.includes('\\') ? id : null);
  if (deleteFromDisk) {
    if (targetPath && window.solsticeAPI?.deleteFile) {
      try {
        await window.solsticeAPI.deleteFile(targetPath);
      } catch (err) {
        console.error('Failed to delete whiteboard file from disk:', err);
      }
    }
    if (targetPath) undismissRecentWhiteboard(targetPath);
    undismissRecentWhiteboard(id);
  } else {
    if (targetPath) dismissRecentWhiteboard(targetPath);
    dismissRecentWhiteboard(id);
    if (targetPath && window.solsticeAPI?.removeRecentFile) {
      try {
        await window.solsticeAPI.removeRecentFile(targetPath, false);
      } catch (err) {
        console.error('Failed to remove from backend recent files store:', err);
      }
    }
  }
}
