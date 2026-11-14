const fs = require('fs');
const path = require('path');
const https = require('https');

const ua = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const newFonts = [
  { name: 'Amatic SC', category: 'handwriting' },
  { name: 'Comfortaa', category: 'display' },
  { name: 'EB Garamond', category: 'serif' },
  { name: 'Lexend', category: 'sans-serif' },
  { name: 'Lobster', category: 'display' },
  { name: 'Montserrat', category: 'sans-serif' },
  { name: 'Nunito', category: 'sans-serif' },
  { name: 'Pacifico', category: 'handwriting' },
  { name: 'Roboto Mono', category: 'monospace' },
  { name: 'Roboto Serif', category: 'serif' },
  { name: 'Spectral', category: 'serif' },
];

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': ua } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

function downloadBinary(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBinary(res.headers.location, destPath).then(resolve).catch(reject);
      }
      const stream = fs.createWriteStream(destPath);
      res.pipe(stream);
      stream.on('finish', () => {
        stream.close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function run() {
  const destDir = path.resolve(__dirname, '../src/renderer/assets/fonts');
  const publicDir = path.resolve(__dirname, '../public/fonts');

  const cssBlocks = [];

  for (const font of newFonts) {
    const slug = font.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    console.log(`Processing ${font.name}...`);

    let res = await fetchText(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.name)}:wght@400;700&display=swap`);
    if (res.status !== 200) {
      res = await fetchText(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.name)}&display=swap`);
    }

    const css = res.data;
    const latinParts = css.split('/* latin */');

    let regularUrl = '';
    let boldUrl = '';

    if (latinParts.length > 1) {
      const regSection = latinParts[1].split('/*')[0];
      const match = regSection.match(/src:\s*url\((https:[^)]+\.woff2)\)/);
      if (match) regularUrl = match[1];

      if (latinParts.length > 2) {
        const boldSection = latinParts[2].split('/*')[0];
        const boldMatch = boldSection.match(/src:\s*url\((https:[^)]+\.woff2)\)/);
        if (boldMatch) boldUrl = boldMatch[1];
      }
    } else {
      const match = css.match(/src:\s*url\((https:[^)]+\.woff2)\)/);
      if (match) regularUrl = match[1];
    }

    if (!regularUrl) {
      console.error(`ERROR: No latin url found for ${font.name}`);
      continue;
    }

    const regFileName = `${slug}-400-normal.woff2`;
    const regDest = path.join(destDir, regFileName);
    const regPublic = path.join(publicDir, regFileName);

    await downloadBinary(regularUrl, regDest);
    fs.copyFileSync(regDest, regPublic);
    console.log(`  Downloaded 400: ${regFileName} (${fs.statSync(regDest).size} bytes)`);

    cssBlocks.push(`/* ${font.name} */
@font-face {
  font-family: '${font.name}';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('./${regFileName}') format('woff2');
}`);

    if (boldUrl) {
      const boldFileName = `${slug}-700-normal.woff2`;
      const boldDest = path.join(destDir, boldFileName);
      const boldPublic = path.join(publicDir, boldFileName);

      await downloadBinary(boldUrl, boldDest);
      fs.copyFileSync(boldDest, boldPublic);
      console.log(`  Downloaded 700: ${boldFileName} (${fs.statSync(boldDest).size} bytes)`);

      cssBlocks.push(`@font-face {
  font-family: '${font.name}';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('./${boldFileName}') format('woff2');
}`);
    } else {
      // Provide 700 mapping to regular if font only has one weight
      cssBlocks.push(`@font-face {
  font-family: '${font.name}';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('./${regFileName}') format('woff2');
}`);
    }
  }

  // Append to fonts.css
  const fontsCssPath = path.join(destDir, 'fonts.css');
  const existingCss = fs.readFileSync(fontsCssPath, 'utf-8');
  fs.writeFileSync(fontsCssPath, existingCss.trim() + '\n\n' + cssBlocks.join('\n\n') + '\n', 'utf-8');

  console.log('Appended all font-face declarations to fonts.css');
}

run().catch(console.error);
