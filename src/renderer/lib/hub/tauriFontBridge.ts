import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { InstalledFont } from '@shared/types';
import { SolsticeAPI } from '@shared/types/api';

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
      const latinParts = css.split('/* latin */');
      let woff2Url = '';
      let boldWoff2Url: string | undefined;

      if (latinParts.length > 1) {
        const regularSection = latinParts[1].split('/*')[0];
        const match = regularSection.match(/src:\s*url\((https:[^)]+\.woff2)\)/);
        if (match && match[1]) woff2Url = match[1];

        if (latinParts.length > 2) {
          const boldSection = latinParts[2].split('/*')[0];
          const boldMatch = boldSection.match(/src:\s*url\((https:[^)]+\.woff2)\)/);
          if (boldMatch && boldMatch[1]) boldWoff2Url = boldMatch[1];
        }
      }

      if (!woff2Url) {
        const fallbackMatch = css.match(/src:\s*url\((https:[^)]+\.woff2)\)/);
        if (fallbackMatch && fallbackMatch[1]) {
          woff2Url = fallbackMatch[1];
        } else {
          throw new Error(`Could not locate binary font package for ${name}`);
        }
      }

      const fontRes = await fetch(woff2Url);
      const fontBytes = new Uint8Array(await fontRes.arrayBuffer());

      let boldBytes: Uint8Array | undefined;
      let boldFileName: string | undefined;
      if (boldWoff2Url) {
        try {
          const boldRes = await fetch(boldWoff2Url);
          boldBytes = new Uint8Array(await boldRes.arrayBuffer());
          boldFileName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-bold.woff2`;
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
