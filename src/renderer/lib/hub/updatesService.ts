export interface ReleaseNote {
  version: string;
  title: string;
  releaseDate: string;
  summary: string;
  highlights: string[];
  htmlUrl?: string;
  downloadUrl?: string;
}

export const CURRENT_APP_VERSION = 'v0.1.0';

export const INITIAL_RELEASE_HISTORY: ReleaseNote[] = [
  {
    version: 'v0.1.0',
    title: 'Initial Desktop Suite',
    releaseDate: 'Nov 2026',
    summary: 'Initial release featuring Docs, PDF tools, Whiteboard, and Font management on Tauri v2.',
    highlights: [
      'Hub: Multi-window launcher with triple-disk recents discovery across documents, PDFs, and sketches.',
      'Docs: Native Word (.docx) pipeline, Markdown and HTML import/export, outline navigation, and auto-save.',
      'PDF: Document reader with 9 offline tools (Merge, Split, Organize, Watermark, Numbers, Protect, Unlock, Image conversion).',
      'Whiteboard: Sketching canvas with auto-save to ~/Documents/Solstice/Whiteboards/ and multi-format export.',
      'Fonts: Google Fonts downloader and local font importer with live suite synchronization.',
    ],
    htmlUrl: 'https://github.com/kam1n4ri/Solstice/releases',
  },
];

const STORAGE_KEY_SEEN = 'solstice-last-seen-update-version';
const STORAGE_KEY_CACHE = 'solstice-cached-releases';

export async function fetchGitHubReleases(): Promise<ReleaseNote[]> {
  try {
    const res = await fetch('https://api.github.com/repos/kam1n4ri/Solstice/releases', {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (!res.ok) {
      return getCachedOrInitialReleases();
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return getCachedOrInitialReleases();
    }

    const releases: ReleaseNote[] = data.map((item: {
      tag_name?: string;
      name?: string;
      published_at?: string;
      body?: string;
      html_url?: string;
    }) => {
      const tag = item.tag_name || 'v0.1.0';
      const cleanTag = tag.startsWith('v') ? tag : `v${tag}`;
      const title = item.name || `Release ${cleanTag}`;
      const published = item.published_at
        ? new Date(item.published_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'Recent';

      const bodyText = item.body || '';
      const lines = bodyText.split('\n').map((l) => l.trim()).filter(Boolean);
      const highlights = lines
        .filter((l) => l.startsWith('- ') || l.startsWith('* ') || l.startsWith('• '))
        .map((l) => l.replace(/^[-*•]\s+/, ''));

      return {
        version: cleanTag,
        title,
        releaseDate: published,
        summary: lines[0] && !lines[0].startsWith('-') ? lines[0] : 'Feature and performance release.',
        highlights: highlights.length > 0 ? highlights : [bodyText.slice(0, 160) || 'Routine maintenance and optimizations.'],
        htmlUrl: item.html_url || 'https://github.com/kam1n4ri/Solstice/releases',
      };
    });

    try {
      localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(releases));
    } catch {
      // Storage unavailable
    }

    return releases;
  } catch {
    return getCachedOrInitialReleases();
  }
}

export function getCachedOrInitialReleases(): ReleaseNote[] {
  try {
    const cached = localStorage.getItem(STORAGE_KEY_CACHE);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore parse error
  }
  return INITIAL_RELEASE_HISTORY;
}

export function checkHasUnseenUpdate(latestVersion: string): boolean {
  if (!latestVersion) return false;
  try {
    const lastSeen = localStorage.getItem(STORAGE_KEY_SEEN);
    if (!lastSeen) {
      return compareVersions(latestVersion, CURRENT_APP_VERSION) > 0;
    }
    return compareVersions(latestVersion, lastSeen) > 0;
  } catch {
    return false;
  }
}

export function markUpdateAsSeen(version: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_SEEN, version);
  } catch {
    // Ignore storage errors
  }
}

export function compareVersions(v1: string, v2: string): number {
  const parse = (v: string) =>
    v
      .replace(/^v/, '')
      .split('.')
      .map((num) => parseInt(num, 10) || 0);

  const [maj1, min1, pat1] = parse(v1);
  const [maj2, min2, pat2] = parse(v2);

  if (maj1 !== maj2) return maj1 - maj2;
  if (min1 !== min2) return min1 - min2;
  return pat1 - pat2;
}
