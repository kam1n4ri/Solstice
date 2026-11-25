import { useState, useEffect, useCallback, useRef } from 'react';
import { InstalledFont } from '@shared/types';

const loadedHubFontKeys = new Set<string>();

export function useHubFonts() {
  const [installedFonts, setInstalledFonts] = useState<InstalledFont[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadFontFaces = useCallback(async (fonts: InstalledFont[]) => {
    const currentFontNames = new Set(fonts.map((f) => f.name.toLowerCase()));

    // Clean up deleted fonts from document.fonts
    document.fonts.forEach((face) => {
      if (
        face.family &&
        !currentFontNames.has(face.family.toLowerCase()) &&
        loadedHubFontKeys.has(`${face.family.toLowerCase()}-${face.weight}`)
      ) {
        document.fonts.delete(face);
        loadedHubFontKeys.delete(`${face.family.toLowerCase()}-${face.weight}`);
      }
    });

    for (const f of fonts) {
      const regKey = `${f.name.toLowerCase()}-400`;
      if (f.dataUrl && !loadedHubFontKeys.has(regKey)) {
        loadedHubFontKeys.add(regKey);
        try {
          const face = new FontFace(f.name, `url(${f.dataUrl})`, { weight: '400', style: 'normal' });
          const loaded = await face.load();
          document.fonts.add(loaded);
        } catch (err) {
          loadedHubFontKeys.delete(regKey);
          console.warn(`Could not register FontFace for ${f.name}:`, err);
        }
      }

      const boldKey = `${f.name.toLowerCase()}-700`;
      if (f.boldDataUrl && !loadedHubFontKeys.has(boldKey)) {
        loadedHubFontKeys.add(boldKey);
        try {
          const boldFace = new FontFace(f.name, `url(${f.boldDataUrl})`, { weight: '700', style: 'normal' });
          const loadedBold = await boldFace.load();
          document.fonts.add(loadedBold);
        } catch (err) {
          loadedHubFontKeys.delete(boldKey);
          console.warn(`Could not register bold FontFace for ${f.name}:`, err);
        }
      }
    }
  }, []);

  const refreshInstalledFonts = useCallback(async () => {
    if (window.solsticeAPI?.getInstalledFonts) {
      try {
        const list = await window.solsticeAPI.getInstalledFonts();
        setInstalledFonts(list);
        await loadFontFaces(list);
      } catch (err) {
        console.error('Failed to get installed fonts:', err);
      }
    }
  }, [loadFontFaces]);

  useEffect(() => {
    refreshInstalledFonts();

    let unsubscribe: (() => void) | undefined;
    if (window.solsticeAPI?.onFontsUpdated) {
      unsubscribe = window.solsticeAPI.onFontsUpdated((updatedList) => {
        setInstalledFonts(updatedList);
        loadFontFaces(updatedList);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }
    };
  }, [refreshInstalledFonts, loadFontFaces]);

  const showFeedback = useCallback((message: string, type: 'success' | 'error') => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setFeedback({ message, type });
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback(null);
      feedbackTimerRef.current = null;
    }, 3500);
  }, []);

  const handleDownload = async (name: string, category: string) => {
    if (!window.solsticeAPI?.downloadGoogleFont) {
      showFeedback('Font downloading requires desktop mode.', 'error');
      return;
    }

    try {
      setDownloadingId(name);
      const res = await window.solsticeAPI.downloadGoogleFont({ name, category });
      if (res.success && res.font) {
        showFeedback(`"${name}" successfully installed across the suite!`, 'success');
        await refreshInstalledFonts();
      } else {
        showFeedback(res.error || `Failed to download "${name}".`, 'error');
      }
    } catch (err: any) {
      showFeedback(err.message || 'Download error occurred.', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleImportLocal = async () => {
    if (!window.solsticeAPI?.importLocalFont) {
      showFeedback('Local font import requires desktop mode.', 'error');
      return;
    }

    try {
      const res = await window.solsticeAPI.importLocalFont();
      if (res.success && res.font) {
        showFeedback(`"${res.font.name}" successfully imported!`, 'success');
        await refreshInstalledFonts();
      } else if (!res.canceled && res.error) {
        showFeedback(res.error, 'error');
      }
    } catch (err: any) {
      showFeedback(err.message || 'Import failed.', 'error');
    }
  };

  const handleDelete = async (fontId: string) => {
    if (!window.solsticeAPI?.deleteInstalledFont) return;
    try {
      const res = await window.solsticeAPI.deleteInstalledFont(fontId);
      if (res && !res.success) {
        showFeedback(res.error || 'Deletion failed.', 'error');
        return;
      }
      showFeedback(`"${fontId}" removed from suite fonts.`, 'success');
      await refreshInstalledFonts();
    } catch (err: any) {
      showFeedback(err.message || 'Deletion failed.', 'error');
    }
  };

  return {
    installedFonts,
    downloadingId,
    feedback,
    handleDownload,
    handleImportLocal,
    handleDelete,
  };
}
