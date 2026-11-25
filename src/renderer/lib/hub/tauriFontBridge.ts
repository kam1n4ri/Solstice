import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { InstalledFont } from '@shared/types';
import { SolsticeAPI } from '@shared/types/api';

function extractWoff2UrlsFromCss(
  css: string,
  name: string
): { woff2Url: string; boldWoff2Url?: string } {
  const extractFromBlocks = (blocks: string[]) => {
    let regular = '';
    let bold: string | undefined;
    for (const block of blocks) {
      const urlMatch = block.match(/src:\s*url\((https:[^)]+\.woff2)\)/i);
      if (!urlMatch?.[1]) continue;
      const weightMatch = block.match(/font-weight:\s*([^;}\s]+)/i);
      const weight = weightMatch?.[1]?.toLowerCase();
      if ((weight === '700' || weight === 'bold') && !bold) {
        bold = urlMatch[1];
      } else if ((weight === '400' || weight === 'normal' || !weight) && !regular) {
        regular = urlMatch[1];
      }
    }
    if (!regular && blocks.length > 0) {
      const firstMatch = blocks
        .map((b) => b.match(/src:\s*url\((https:[^)]+\.woff2)\)/i)?.[1])
        .find(Boolean);
      if (firstMatch) regular = firstMatch;
    }
    return { regular, bold };
  };

  const latinBlocks = Array.from(
    css.matchAll(/\/\*\s*latin\s*\*\/\s*(@font-face\s*\{[^}]*\})/gi),
    (m) => m[1]
  );
  const latinResult = extractFromBlocks(latinBlocks);
  let woff2Url = latinResult.regular;
  let boldWoff2Url = latinResult.bold;

  if (!woff2Url) {
    const allBlocks = Array.from(css.matchAll(/@font-face\s*\{[^}]*\}/gi), (m) => m[0]);
    const fallbackResult = extractFromBlocks(allBlocks);
    woff2Url = fallbackResult.regular;
    if (!boldWoff2Url) boldWoff2Url = fallbackResult.bold;
  }

  if (!woff2Url) {
    const bareMatch = css.match(/src:\s*url\((https:[^)]+\.woff2)\)/i);
    if (bareMatch?.[1]) {
      woff2Url = bareMatch[1];
    } else {
      throw new Error(`Could not locate binary font package for ${name}`);
    }
  }

  if (boldWoff2Url === woff2Url) {
    boldWoff2Url = undefined;
  }

  return { woff2Url, boldWoff2Url };
}

export const tauriFontBridge: Partial<SolsticeAPI> = {
  getInstalledFonts: async (): Promise<InstalledFont[]> => {
    try {
      return await invoke<InstalledFont[]>('get_installed_fonts');
    } catch {
      return [];
    }
  },

  downloadGoogleFont: async ({
    name,
    category,
  }: {
    name: string;
    category?: string;
  }): Promise<{ success: boolean; font?: InstalledFont; error?: string }> => {
    try {
      const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@400;700&display=swap`;
      const res = await fetch(cssUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!res.ok) {
        throw new Error(`Google Fonts service returned HTTP ${res.status}`);
      }

      const css = await res.text();
      const { woff2Url, boldWoff2Url } = extractWoff2UrlsFromCss(css, name);

      const fontRes = await fetch(woff2Url);
      if (!fontRes.ok) {
        throw new Error(`Font binary download returned HTTP ${fontRes.status}`);
      }
      const fontBytes = new Uint8Array(await fontRes.arrayBuffer());
      if (fontBytes.byteLength === 0) {
        throw new Error(`Downloaded font binary for ${name} is empty`);
      }

      let boldBytes: Uint8Array | undefined;
      let boldFileName: string | undefined;
      if (boldWoff2Url) {
        try {
          const boldRes = await fetch(boldWoff2Url);
          if (boldRes.ok) {
            const candidate = new Uint8Array(await boldRes.arrayBuffer());
            if (candidate.byteLength > 0) {
              boldBytes = candidate;
              boldFileName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-bold.woff2`;
            }
          }
        } catch {
          boldFileName = undefined;
        }
      }

      const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const fileName = `${safeName}.woff2`;

      const fontRecord: InstalledFont = {
        id: name,
        name,
        category: (category as any) || 'sans-serif',
        fileName,
        boldFileName,
        source: 'google',
        dateAdded: Date.now(),
      };

      const saved = await invoke<InstalledFont>('save_installed_font', {
        font: fontRecord,
        data: Array.from(fontBytes),
        boldData: boldBytes ? Array.from(boldBytes) : undefined,
      });

      return { success: true, font: saved };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  },

  importLocalFont: async (): Promise<{
    success: boolean;
    font?: InstalledFont;
    canceled?: boolean;
    error?: string;
  }> => {
    try {
      return await invoke<any>('import_local_font');
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  },

  deleteInstalledFont: async (fontId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await invoke('delete_installed_font', { fontId });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || String(err) };
    }
  },

  onFontsUpdated: (callback: (fonts: InstalledFont[]) => void): (() => void) => {
    let unlistenFn: (() => void) | null = null;
    let isUnsubscribed = false;

    listen<InstalledFont[]>('fonts-updated', (event) => {
      if (!isUnsubscribed) {
        callback(event.payload);
      }
    })
      .then((unlisten) => {
        if (isUnsubscribed) {
          unlisten();
        } else {
          unlistenFn = unlisten;
        }
      })
      .catch((err) => {
        console.warn('Failed to listen to fonts-updated event:', err);
      });

    return () => {
      isUnsubscribed = true;
      if (unlistenFn) {
        unlistenFn();
        unlistenFn = null;
      }
    };
  },
};
