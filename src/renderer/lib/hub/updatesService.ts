export interface ReleaseNote {
  version: string;
  title: string;
  releaseDate: string;
  summary: string;
  highlights: string[];
  htmlUrl?: string;
  downloadUrl?: string;
}

const RAW_APP_VERSION =
  typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__ ? __APP_VERSION__ : '0.1.0';

export const CURRENT_APP_VERSION = RAW_APP_VERSION.startsWith('v')
  ? RAW_APP_VERSION
  : `v${RAW_APP_VERSION}`;

export const INITIAL_RELEASE_HISTORY: ReleaseNote[] = [
  {
    version: 'v0.1.1',
    title: 'Stability, Security & Quality-of-Life Update',
    releaseDate: 'Nov 2026',
    summary: 'Reliability, file-safety, and polish pass across Docs, PDF, Whiteboard, Fonts, and Hub.',
    highlights: [
      'Security & Safety: Stricter file path protection, Markdown sanitization, and guaranteed auto-save flush on window close.',
      'Docs & Whiteboard: Fixed Word (.docx)/Markdown conversions, Find & Replace, Zoom shortcuts, and .tldr/.solstice drag-and-drop.',
      'PDF & Fonts: Fixed PDF Unlock/Decrypt, highlight colors, persistent Remove from Recents, and cleaner font downloads & cleanup.',
      'Hub & Settings: Unified dark-mode styling, Workspace folder & storage readout in Preferences, and direct OS installer links in Updates.',
    ],
    htmlUrl: 'https://github.com/kam1n4ri/Solstice/releases',
  },
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

export interface UpdatesCheckResult {
  releases: ReleaseNote[];
  fromCache: boolean;
  error?: string;
}

export function selectPlatformDownloadUrl(assets: unknown): string | undefined {
  if (!Array.isArray(assets) || assets.length === 0) return undefined;

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const preferredExts = ua.includes('win')
    ? ['.exe', '.msi']
    : ua.includes('mac')
    ? ['.dmg']
    : ['.appimage', '.deb', '.rpm'];

  const validAssets = assets.filter(
    (a: any): a is { name: string; browser_download_url: string } =>
      a &&
      typeof a.name === 'string' &&
      typeof a.browser_download_url === 'string' &&
      a.browser_download_url.startsWith('https://')
  );

  for (const ext of preferredExts) {
    const match = validAssets.find((a) => a.name.toLowerCase().endsWith(ext));
    if (match) return match.browser_download_url;
  }

  return undefined;
}

function parseReleaseNotes(data: unknown[]): ReleaseNote[] {
  return data
    .filter((item: any) => item && !item.draft)
    .map((item: any): ReleaseNote => {
      const tag = typeof item.tag_name === 'string' && item.tag_name ? item.tag_name : CURRENT_APP_VERSION;
      const cleanTag = tag.startsWith('v') ? tag : `v${tag}`;
      const title = item.name || `Release ${cleanTag}`;
      const published = item.published_at
        ? new Date(item.published_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'Recent';

      const bodyText: string = typeof item.body === 'string' ? item.body : '';
      const lines: string[] = bodyText
        .split('\n')
        .map((l: string) => l.trim())
        .filter(Boolean);
      const highlights = lines
        .filter((l: string) => l.startsWith('- ') || l.startsWith('* ') || l.startsWith('• '))
        .map((l: string) => l.replace(/^[-*•]\s+/, ''));
      const summaryLine = lines.find(
        (l: string) =>
          !l.startsWith('- ') && !l.startsWith('* ') && !l.startsWith('• ') && !l.startsWith('#')
      );

      return {
        version: cleanTag,
        title,
        releaseDate: published,
        summary: summaryLine || 'Feature and performance release.',
        highlights:
          highlights.length > 0
            ? highlights
            : [bodyText.slice(0, 160) || 'Routine maintenance and optimizations.'],
        htmlUrl: item.html_url || 'https://github.com/kam1n4ri/Solstice/releases',
        downloadUrl: selectPlatformDownloadUrl(item.assets),
      };
    })
    .sort((a, b) => compareVersions(b.version, a.version));
}

export async function checkForUpdates(): Promise<UpdatesCheckResult> {
  try {
    const res = await fetch('https://api.github.com/repos/kam1n4ri/Solstice/releases', {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (!res.ok) {
      return {
        releases: getCachedOrInitialReleases(),
        fromCache: true,
        error: `GitHub returned HTTP ${res.status}`,
      };
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return { releases: getCachedOrInitialReleases(), fromCache: true };
    }

    const releases = parseReleaseNotes(data);
    if (releases.length === 0) {
      return { releases: getCachedOrInitialReleases(), fromCache: true };
    }

    try {
      localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(releases));
    } catch {
      // Storage unavailable
    }

    return { releases, fromCache: false };
  } catch (err) {
    return {
      releases: getCachedOrInitialReleases(),
      fromCache: true,
      error: err instanceof Error ? err.message : 'Unable to reach update server',
    };
  }
}

export async function fetchGitHubReleases(): Promise<ReleaseNote[]> {
  const { releases } = await checkForUpdates();
  return releases;
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
  const parse = (v: string) => {
    const cleaned = v.replace(/^v/i, '');
    const [core, pre = ''] = cleaned.split('-', 2);
    const parts = core.split('.').map((num) => parseInt(num, 10) || 0);
    return {
      maj: parts[0] || 0,
      min: parts[1] || 0,
      pat: parts[2] || 0,
      pre,
    };
  };

  const a = parse(v1);
  const b = parse(v2);

  if (a.maj !== b.maj) return a.maj - b.maj;
  if (a.min !== b.min) return a.min - b.min;
  if (a.pat !== b.pat) return a.pat - b.pat;

  if (!a.pre && b.pre) return 1;
  if (a.pre && !b.pre) return -1;
  if (a.pre !== b.pre) return a.pre.localeCompare(b.pre);
  return 0;
}
