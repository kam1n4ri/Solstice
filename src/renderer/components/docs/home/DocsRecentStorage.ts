import type { Editor } from '@tiptap/react';

export interface RecentDocItem {
  id: string;
  title: string;
  filePath?: string;
  format: 'docx' | 'md' | 'html' | 'txt';
  lastModified: number;
  snippet?: string;
  previewHtml?: string;
}

const STORAGE_KEY = 'solstice_recent_documents';
const SUPPORTED_EXTS = ['.html', '.htm', '.docx', '.md', '.txt'];

export function getFormatFromPath(
  filePath?: string,
  fallback: RecentDocItem['format'] = 'html'
): RecentDocItem['format'] {
  if (!filePath) return fallback;
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (ext === 'docx' || ext === 'md' || ext === 'txt' || ext === 'html') {
    return ext;
  }
  return fallback;
}

export function recordRecentDocFromEditor(
  editor: Editor | null,
  title: string,
  filePath?: string | null,
  format?: string,
  id?: string
): void {
  const cleanFormat = getFormatFromPath(
    filePath || undefined,
    (format as RecentDocItem['format']) || 'html'
  );
  saveRecentDoc({
    id: id || filePath || undefined,
    title: title || 'Untitled document',
    filePath: filePath || undefined,
    format: cleanFormat,
    snippet: editor ? editor.getText().replace(/\s+/g, ' ').slice(0, 200) : '',
    previewHtml: editor ? editor.getHTML().slice(0, 1000) : '',
  });
}

export function getRecentDocs(): RecentDocItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Ensure legacy sample data and unsupported formats are pruned
    const cleaned = parsed.filter(
      (d) =>
        d &&
        typeof d.id === 'string' &&
        !d.id.startsWith('sample-') &&
        (!d.filePath || SUPPORTED_EXTS.some((ext) => d.filePath!.toLowerCase().endsWith(ext)))
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function saveRecentDoc(item: {
  id?: string;
  title: string;
  filePath?: string;
  format?: string;
  snippet?: string;
  previewHtml?: string;
}): RecentDocItem[] {
  try {
    // Only supported formats are stored in Recent Documents
    if (item.filePath && !SUPPORTED_EXTS.some((ext) => item.filePath!.toLowerCase().endsWith(ext))) {
      return getRecentDocs();
    }

    const existing = getRecentDocs();
    const cleanFormat = getFormatFromPath(
      item.filePath,
      (item.format as RecentDocItem['format']) || 'html'
    );

    const targetKey = item.filePath || item.id || `doc-${Date.now()}`;
    const filtered = existing.filter((doc) => {
      if (item.filePath && doc.filePath === item.filePath) return false;
      if (item.id && doc.id === item.id) return false;
      if (targetKey && (doc.id === targetKey || doc.filePath === targetKey)) return false;
      return true;
    });

    const newItem: RecentDocItem = {
      id: targetKey,
      title: item.title || 'Untitled document',
      filePath: item.filePath,
      format: cleanFormat,
      lastModified: Date.now(),
      snippet: item.snippet || '',
      previewHtml: item.previewHtml || '',
    };

    const updated = [newItem, ...filtered].slice(0, 30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return getRecentDocs();
  }
}

export function removeRecentDoc(idOrPath: string): RecentDocItem[] {
  try {
    const existing = getRecentDocs();
    const updated = existing.filter((d) => d.id !== idOrPath && d.filePath !== idOrPath);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return getRecentDocs();
  }
}

export async function fetchMergedRecentDocs(): Promise<RecentDocItem[]> {
  try {
    if (window.solsticeAPI?.getRecentFiles) {
      const backendFiles = await window.solsticeAPI.getRecentFiles();
      // Display all supported documents (.html, .docx, .md, .txt) in Solstice Docs recents
      const docsFiles = backendFiles.filter(
        (f) =>
          f.tool === 'docs' &&
          f.filePath &&
          SUPPORTED_EXTS.some((ext) => f.filePath.toLowerCase().endsWith(ext))
      );

      const local = getRecentDocs();
      const localMap = new Map(local.map((d) => [d.filePath || d.id, d]));

      // 1. Authoritative backend documents on disk
      const seen = new Set<string>();
      const merged: RecentDocItem[] = [];

      for (const file of docsFiles) {
        if (seen.has(file.filePath)) continue;
        seen.add(file.filePath);

        const cached = localMap.get(file.filePath);
        const fileFormat = getFormatFromPath(file.filePath, 'html');
        merged.push({
          id: file.filePath,
          title: file.fileName.replace(/\.[^/.]+$/, ''),
          filePath: file.filePath,
          format: fileFormat,
          lastModified: file.lastModified,
          snippet: cached?.snippet || '',
          previewHtml: cached?.previewHtml || '',
        });
      }

      // 2. Overwrite localStorage with sanitized list to purge phantom duplicates & renamed files
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.error('Failed to fetch backend recent files:', err);
  }
  return getRecentDocs();
}

export async function removeRecentDocAsync(
  id: string,
  deleteFromDisk: boolean = true
): Promise<RecentDocItem[]> {
  const updated = removeRecentDoc(id);
  if (id) {
    if (deleteFromDisk && window.solsticeAPI?.deleteFile) {
      await window.solsticeAPI.deleteFile(id).catch(console.error);
    } else if (window.solsticeAPI?.removeRecentFile) {
      await window.solsticeAPI.removeRecentFile(id, deleteFromDisk).catch(console.error);
    }
  }
  return updated;
}

export function formatDocsDate(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedDate = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;

  if (diffDays <= 7) {
    return `Opened ${formattedDate}`;
  }
  return formattedDate;
}
