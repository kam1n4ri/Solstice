import { app, BrowserWindow, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import { InstalledFont } from '../shared/types';
import {
  fetchGoogleFontCss,
  extractWoff2Urls,
  downloadAndSaveFont,
} from './fontDownloadHelper';

class FontManager {
  private fontsDir: string;
  private manifestPath: string;
  private installedFonts: InstalledFont[] = [];

  constructor() {
    this.fontsDir = path.join(app.getPath('userData'), 'fonts');
    this.manifestPath = path.join(app.getPath('userData'), 'fonts.json');
  }

  public init(): void {
    try {
      if (!fs.existsSync(this.fontsDir)) {
        fs.mkdirSync(this.fontsDir, { recursive: true });
      }

      if (fs.existsSync(this.manifestPath)) {
        const raw = fs.readFileSync(this.manifestPath, 'utf-8');
        this.installedFonts = JSON.parse(raw);
      } else {
        this.installedFonts = [];
        this.saveManifest();
      }
    } catch (err) {
      console.error('Failed to initialize FontManager:', err);
      this.installedFonts = [];
    }
  }

  private saveManifest(): void {
    try {
      fs.writeFileSync(this.manifestPath, JSON.stringify(this.installedFonts, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save fonts manifest:', err);
    }
  }

  public async getInstalledFonts(): Promise<InstalledFont[]> {
    this.init();
    const result: InstalledFont[] = [];

    for (const font of this.installedFonts) {
      const fullPath = path.join(this.fontsDir, font.fileName);
      if (fs.existsSync(fullPath)) {
        try {
          const buffer = fs.readFileSync(fullPath);
          const ext = path.extname(font.fileName).replace('.', '').toLowerCase();
          const mime = ext === 'ttf' ? 'font/ttf' : ext === 'otf' ? 'font/otf' : 'font/woff2';
          const fontWithData: InstalledFont = {
            ...font,
            dataUrl: `data:${mime};base64,${buffer.toString('base64')}`,
          };

          if (font.boldFileName) {
            const boldPath = path.join(this.fontsDir, font.boldFileName);
            if (fs.existsSync(boldPath)) {
              const boldBuffer = fs.readFileSync(boldPath);
              fontWithData.boldDataUrl = `data:font/woff2;base64,${boldBuffer.toString('base64')}`;
            }
          }

          result.push(fontWithData);
        } catch {
          result.push(font);
        }
      }
    }

    return result;
  }

  public async downloadGoogleFont(
    name: string,
    category?: InstalledFont['category']
  ): Promise<{ success: boolean; font?: InstalledFont; error?: string }> {
    this.init();
    try {
      const existing = this.installedFonts.find(
        (f) => f.name.toLowerCase() === name.toLowerCase()
      );
      if (existing) {
        const fullPath = path.join(this.fontsDir, existing.fileName);
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).size > 1000) {
          const buffer = fs.readFileSync(fullPath);
          const fontResult: InstalledFont = {
            ...existing,
            dataUrl: `data:font/woff2;base64,${buffer.toString('base64')}`,
          };
          if (existing.boldFileName) {
            const boldPath = path.join(this.fontsDir, existing.boldFileName);
            if (fs.existsSync(boldPath)) {
              fontResult.boldDataUrl = `data:font/woff2;base64,${fs.readFileSync(boldPath).toString('base64')}`;
            }
          }
          return { success: true, font: fontResult };
        }
        this.installedFonts = this.installedFonts.filter((f) => f.name.toLowerCase() !== name.toLowerCase());
      }

      const css = await fetchGoogleFontCss(name);
      const { woff2Url, boldWoff2Url } = extractWoff2Urls(css, name);
      const { fileName, boldFileName, boldDataUrl, dataUrl } = await downloadAndSaveFont(
        this.fontsDir,
        name,
        woff2Url,
        boldWoff2Url
      );

      const newFont: InstalledFont = {
        id: name,
        name,
        category: category || 'sans-serif',
        fileName,
        boldFileName,
        source: 'google',
        dateAdded: Date.now(),
        dataUrl,
        boldDataUrl,
      };

      this.installedFonts.push(newFont);
      this.saveManifest();
      this.broadcastFontsUpdated();

      return { success: true, font: newFont };
    } catch (err) {
      console.error(`Failed to download font ${name}:`, err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  public async importLocalFont(
    parentWindow: BrowserWindow | null
  ): Promise<{ success: boolean; font?: InstalledFont; canceled?: boolean; error?: string }> {
    this.init();
    try {
      const targetWin = parentWindow || undefined;
      const { canceled, filePaths } = await dialog.showOpenDialog(targetWin as BrowserWindow, {
        title: 'Import Font File',
        filters: [{ name: 'Font Files (*.ttf, *.otf, *.woff2)', extensions: ['ttf', 'otf', 'woff2', 'woff'] }],
        properties: ['openFile'],
      });

      if (canceled || !filePaths || filePaths.length === 0) {
        return { success: false, canceled: true };
      }

      const srcPath = filePaths[0];
      const baseName = path.basename(srcPath);
      const ext = path.extname(baseName);
      const fontName = path.basename(baseName, ext).replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      const destPath = path.join(this.fontsDir, baseName);
      fs.copyFileSync(srcPath, destPath);

      const newFont: InstalledFont = {
        id: fontName,
        name: fontName,
        category: 'sans-serif',
        fileName: baseName,
        source: 'custom',
        dateAdded: Date.now(),
      };

      this.installedFonts = this.installedFonts.filter((f) => f.name !== fontName);
      this.installedFonts.push(newFont);
      this.saveManifest();
      this.broadcastFontsUpdated();

      const buffer = fs.readFileSync(destPath);
      const mime = ext === '.ttf' ? 'font/ttf' : ext === '.otf' ? 'font/otf' : 'font/woff2';
      newFont.dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;

      return { success: true, font: newFont };
    } catch (err) {
      console.error('Failed to import local font:', err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  public async deleteFont(fontId: string): Promise<{ success: boolean; error?: string }> {
    this.init();
    try {
      const font = this.installedFonts.find((f) => f.id === fontId || f.name === fontId);
      if (!font) return { success: true };

      const fullPath = path.join(this.fontsDir, font.fileName);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      this.installedFonts = this.installedFonts.filter((f) => f.id !== fontId && f.name !== fontId);
      this.saveManifest();
      this.broadcastFontsUpdated();

      return { success: true };
    } catch (err) {
      console.error(`Failed to delete font ${fontId}:`, err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  public broadcastFontsUpdated(): void {
    this.getInstalledFonts().then((fonts) => {
      BrowserWindow.getAllWindows().forEach((win) => {
        if (!win.isDestroyed()) {
          win.webContents.send('fonts:updated', fonts);
        }
      });
    }).catch(console.error);
  }
}

export const fontManager = new FontManager();
