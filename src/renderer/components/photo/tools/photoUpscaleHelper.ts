/**
 * Pure local offline super-resolution upscaling and clarity enhancement algorithms.
 * Inspired by waifu2x line-art sharpening and photographic unsharp-masking.
 */

export interface UpscaleOptions {
  scale: 2 | 4;
  profile: 'anime' | 'photo';
  denoise: 'none' | 'low' | 'high';
}

/**
 * Super-resolves an image using iterative multi-pass bicubic resampling
 * and edge-directed clarity enhancement.
 */
export async function upscaleImage(
  img: HTMLImageElement,
  options: UpscaleOptions,
  onProgress?: (pct: number) => void
): Promise<string> {
  const origW = img.naturalWidth;
  const origH = img.naturalHeight;
  const targetW = origW * options.scale;
  const targetH = origH * options.scale;

  onProgress?.(20);

  // 1. Multi-pass scaling for sharper interpolation than single-step resize
  const intermediateCanvas = document.createElement('canvas');
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = targetW;
  targetCanvas.height = targetH;
  const targetCtx = targetCanvas.getContext('2d', { willReadFrequently: true });
  if (!targetCtx) return img.src;

  targetCtx.imageSmoothingEnabled = true;
  targetCtx.imageSmoothingQuality = 'high';

  if (options.scale === 4) {
    // Pass 1: 2x
    intermediateCanvas.width = origW * 2;
    intermediateCanvas.height = origH * 2;
    const iCtx = intermediateCanvas.getContext('2d');
    if (iCtx) {
      iCtx.imageSmoothingEnabled = true;
      iCtx.imageSmoothingQuality = 'high';
      iCtx.drawImage(img, 0, 0, origW * 2, origH * 2);
    }
    onProgress?.(50);
    // Pass 2: 4x
    targetCtx.drawImage(intermediateCanvas, 0, 0, targetW, targetH);
  } else {
    // 2x direct high-quality scaling
    targetCtx.drawImage(img, 0, 0, targetW, targetH);
  }

  onProgress?.(70);

  // 2. Edge & texture enhancement pass using pristine cloned source buffer
  const imgData = targetCtx.getImageData(0, 0, targetW, targetH);
  const data = imgData.data;

  if (options.profile === 'anime') {
    // waifu2x style: Crisp line art edge sharpening + flat region de-noising
    applyAnimeLineEnhancement(data, targetW, targetH, options.denoise);
  } else {
    // Photo style: Fine texture clarity and micro-contrast
    applyPhotoDetailEnhancement(data, targetW, targetH, options.denoise);
  }

  // 3. Subtle chroma restoration to counter bicubic desaturation
  applyChromaRestoration(data, targetW, targetH, 1.05);

  onProgress?.(90);
  targetCtx.putImageData(imgData, 0, 0);
  onProgress?.(100);

  return targetCanvas.toDataURL('image/png');
}

/**
 * Enhances anime/illustration line work while suppressing color noise on flat cel-shaded regions.
 */
function applyAnimeLineEnhancement(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  denoise: 'none' | 'low' | 'high'
): void {
  const stride = w * 4;
  const sharpAmount = 0.38;
  const src = new Uint8ClampedArray(data);

  // Horizontal and vertical gradient convolution for line enhancement
  for (let y = 1; y < h - 1; y++) {
    const rowOffset = y * stride;
    for (let x = 1; x < w - 1; x++) {
      const idx = rowOffset + x * 4;

      // Luminance of current pixel and neighbors from cloned buffer
      const lum = src[idx] * 0.299 + src[idx + 1] * 0.587 + src[idx + 2] * 0.114;
      const lumL = src[idx - 4] * 0.299 + src[idx - 3] * 0.587 + src[idx - 2] * 0.114;
      const lumR = src[idx + 4] * 0.299 + src[idx + 5] * 0.587 + src[idx + 6] * 0.114;
      const lumT = src[idx - stride] * 0.299 + src[idx - stride + 1] * 0.587 + src[idx - stride + 2] * 0.114;
      const lumB = src[idx + stride] * 0.299 + src[idx + stride + 1] * 0.587 + src[idx + stride + 2] * 0.114;

      const laplacian = lum * 4 - (lumL + lumR + lumT + lumB);

      // On sharp contour transitions, amplify edge contrast
      if (Math.abs(laplacian) > 10) {
        data[idx] = Math.min(255, Math.max(0, src[idx] + laplacian * sharpAmount));
        data[idx + 1] = Math.min(255, Math.max(0, src[idx + 1] + laplacian * sharpAmount));
        data[idx + 2] = Math.min(255, Math.max(0, src[idx + 2] + laplacian * sharpAmount));
      } else if (denoise !== 'none' && Math.abs(laplacian) < 5) {
        // Denoise flat surfaces
        const factor = denoise === 'high' ? 0.25 : 0.12;
        const avgR = (src[idx - 4] + src[idx + 4] + src[idx - stride] + src[idx + stride]) / 4;
        const avgG = (src[idx - 3] + src[idx + 5] + src[idx - stride + 1] + src[idx + stride + 1]) / 4;
        const avgB = (src[idx - 2] + src[idx + 6] + src[idx - stride + 2] + src[idx + stride + 2]) / 4;
        data[idx] = Math.round(src[idx] * (1 - factor) + avgR * factor);
        data[idx + 1] = Math.round(src[idx + 1] * (1 - factor) + avgG * factor);
        data[idx + 2] = Math.round(src[idx + 2] * (1 - factor) + avgB * factor);
      }
    }
  }
}

/**
 * Multi-scale unsharp masking for photographic textures and fine details.
 */
function applyPhotoDetailEnhancement(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  denoise: 'none' | 'low' | 'high'
): void {
  const stride = w * 4;
  const amount = 0.28;
  const src = new Uint8ClampedArray(data);

  for (let y = 1; y < h - 1; y++) {
    const rowOffset = y * stride;
    for (let x = 1; x < w - 1; x++) {
      const idx = rowOffset + x * 4;

      for (let c = 0; c < 3; c++) {
        const val = src[idx + c];
        const avg =
          (src[idx - 4 + c] +
            src[idx + 4 + c] +
            src[idx - stride + c] +
            src[idx + stride + c]) /
          4;

        const diff = val - avg;
        if (Math.abs(diff) > 3) {
          data[idx + c] = Math.min(255, Math.max(0, val + diff * amount));
        } else if (denoise !== 'none') {
          const smoothFactor = denoise === 'high' ? 0.2 : 0.1;
          data[idx + c] = Math.round(val * (1 - smoothFactor) + avg * smoothFactor);
        }
      }
    }
  }
}

/**
 * Restores slight micro-chroma lost during multi-pass resampling.
 */
function applyChromaRestoration(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  factor: number
): void {
  const len = w * h * 4;
  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    data[i] = Math.min(255, Math.max(0, Math.round(gray + (r - gray) * factor)));
    data[i + 1] = Math.min(255, Math.max(0, Math.round(gray + (g - gray) * factor)));
    data[i + 2] = Math.min(255, Math.max(0, Math.round(gray + (b - gray) * factor)));
  }
}
