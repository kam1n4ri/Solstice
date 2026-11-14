import fs from 'fs';
import path from 'path';
import https from 'https';

/**
 * Downloads a binary file over HTTPS, following redirects if needed.
 */
export function downloadBinary(url: string, destPath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBinary(res.headers.location, destPath).then(resolve).catch(reject);
      }
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', reject);
  });
}

/**
 * Fetches Google Fonts CSS for regular (400) and bold (700) weights.
 */
export async function fetchGoogleFontCss(name: string): Promise<string> {
  const ua =
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@400;700&display=swap`;

  return new Promise<string>((resolve, reject) => {
    https.get(cssUrl, { headers: { 'User-Agent': ua } }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Extracts WOFF2 binary URLs from Google Fonts CSS.
 */
export function extractWoff2Urls(
  css: string,
  name: string
): { woff2Url: string; boldWoff2Url?: string } {
  let woff2Url = '';
  let boldWoff2Url: string | undefined;

  const latinParts = css.split('/* latin */');
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
      throw new Error(`Could not find font binary URL for ${name}`);
    }
  }

  return { woff2Url, boldWoff2Url };
}

/**
 * Downloads and saves font binaries into fontsDir, returning file paths and data URLs.
 */
export async function downloadAndSaveFont(
  fontsDir: string,
  name: string,
  woff2Url: string,
  boldWoff2Url?: string
): Promise<{ fileName: string; boldFileName?: string; boldDataUrl?: string; dataUrl: string }> {
  const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const fileName = `${safeName}.woff2`;
  const destPath = path.join(fontsDir, fileName);

  await downloadBinary(woff2Url, destPath);

  let boldFileName: string | undefined;
  let boldDataUrl: string | undefined;
  if (boldWoff2Url) {
    boldFileName = `${safeName}-bold.woff2`;
    const boldDestPath = path.join(fontsDir, boldFileName);
    try {
      await downloadBinary(boldWoff2Url, boldDestPath);
      boldDataUrl = `data:font/woff2;base64,${fs.readFileSync(boldDestPath).toString('base64')}`;
    } catch {
      boldFileName = undefined;
    }
  }

  const buffer = fs.readFileSync(destPath);
  const dataUrl = `data:font/woff2;base64,${buffer.toString('base64')}`;

  return { fileName, boldFileName, boldDataUrl, dataUrl };
}
