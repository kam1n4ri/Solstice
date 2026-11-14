import { useState, useEffect, useCallback, useMemo } from 'react';
import { InstalledFont } from '@shared/types';
import { FontOption } from './DocsFontDefinitions';

const loadedFontKeys = new Set<string>();

export function useDynamicFonts(): FontOption[] {
  const [installedFonts, setInstalledFonts] = useState<InstalledFont[]>([]);

  const registerFontFaces = useCallback(async (fonts: InstalledFont[]) => {
    const currentFontNames = new Set(fonts.map((f) => f.name.toLowerCase()));

    // Clean up deleted fonts from document.fonts
    document.fonts.forEach((face) => {
      if (
        face.family &&
        !currentFontNames.has(face.family.toLowerCase()) &&
        loadedFontKeys.has(`${face.family.toLowerCase()}-${face.weight}`)
      ) {
        document.fonts.delete(face);
        loadedFontKeys.delete(`${face.family.toLowerCase()}-${face.weight}`);
      }
    });

    for (const f of fonts) {
      const regKey = `${f.name.toLowerCase()}-400`;
      if (f.dataUrl && !loadedFontKeys.has(regKey)) {
        try {
          const face = new FontFace(f.name, `url(${f.dataUrl})`, { weight: '400', style: 'normal' });
          const loaded = await face.load();
          document.fonts.add(loaded);
          loadedFontKeys.add(regKey);
        } catch (err) {
          console.warn(`Failed to dynamically load FontFace for ${f.name}:`, err);
        }
      }

      const boldKey = `${f.name.toLowerCase()}-700`;
      if (f.boldDataUrl && !loadedFontKeys.has(boldKey)) {
        try {
          const boldFace = new FontFace(f.name, `url(${f.boldDataUrl})`, { weight: '700', style: 'normal' });
          const loadedBold = await boldFace.load();
          document.fonts.add(loadedBold);
          loadedFontKeys.add(boldKey);
        } catch (err) {
          console.warn(`Failed to dynamically load bold FontFace for ${f.name}:`, err);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (window.solsticeAPI?.getInstalledFonts) {
      window.solsticeAPI
        .getInstalledFonts()
        .then((fonts) => {
          setInstalledFonts(fonts);
          registerFontFaces(fonts);
        })
        .catch(console.error);
    }

    if (window.solsticeAPI?.onFontsUpdated) {
      const unsubscribe = window.solsticeAPI.onFontsUpdated((updatedFonts) => {
        setInstalledFonts(updatedFonts);
        registerFontFaces(updatedFonts);
      });
      return unsubscribe;
    }
  }, [registerFontFaces]);

  const dynamicFontOptions = useMemo<FontOption[]>(() => {
    return installedFonts.map((f) => ({
      id: f.name,
      label: f.name,
      category: f.category,
      badge: undefined,
      stack: `'${f.name}', sans-serif`,
    }));
  }, [installedFonts]);

  return dynamicFontOptions;
}
