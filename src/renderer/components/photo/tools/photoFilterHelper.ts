/**
 * Pure canvas helpers for GPU-accelerated tone adjustments & aesthetic filters.
 */

export interface PhotoAdjustments {
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  saturation: number; // -100 to 100
  warmth: number;     // -100 to 100
  highlights: number; // -100 to 100
  shadows: number;    // -100 to 100
  vignette: number;   // 0 to 100
}

export const DEFAULT_ADJUSTMENTS: PhotoAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  highlights: 0,
  shadows: 0,
  vignette: 0,
};

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  cssFilter?: string;
  tintColor?: string;
  tintOpacity?: number;
  blendMode?: GlobalCompositeOperation;
  vignette?: number;
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'normal',
    name: 'Normal',
    description: 'Clean & untouched original image',
  },
  {
    id: 'film',
    name: 'Film 01',
    description: 'Analog VSCO warmth with gentle lifted blacks',
    cssFilter: 'contrast(1.1) saturate(0.9) brightness(1.02)',
    tintColor: '#fde68a',
    tintOpacity: 0.15,
    blendMode: 'soft-light',
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    description: 'Rich sunset radiance and warm vibrant highlights',
    cssFilter: 'contrast(1.08) saturate(1.22) brightness(1.03)',
    tintColor: '#f59e0b',
    tintOpacity: 0.22,
    blendMode: 'soft-light',
  },
  {
    id: 'noir',
    name: 'Noir',
    description: 'Cinematic black and white with deep contrast',
    cssFilter: 'grayscale(100%) contrast(1.38) brightness(0.96)',
    vignette: 24,
  },
  {
    id: 'cyber',
    name: 'Moody Cyber',
    description: 'Modern teal and orange split-toning grade',
    cssFilter: 'contrast(1.2) saturate(1.25)',
    tintColor: '#06b6d4',
    tintOpacity: 0.16,
    blendMode: 'color-dodge',
  },
  {
    id: 'cream',
    name: 'Vintage Cream',
    description: 'Pastel matte tone with muted cream undertones',
    cssFilter: 'sepia(24%) contrast(0.92) brightness(1.06) saturate(0.8)',
    tintColor: '#fef3c7',
    tintOpacity: 0.24,
    blendMode: 'lighten',
  },
  {
    id: 'pop',
    name: 'Crisp Pop',
    description: 'Punchy vivid saturation and elevated dynamic range',
    cssFilter: 'contrast(1.24) saturate(1.36) brightness(1.02)',
  },
  {
    id: 'slate',
    name: 'Muted Slate',
    description: 'Minimalist desaturated look with cool slate shadows',
    cssFilter: 'saturate(0.55) contrast(1.1) brightness(0.98)',
    tintColor: '#64748b',
    tintOpacity: 0.14,
    blendMode: 'soft-light',
  },
  {
    id: 'dream',
    name: 'Dreamy Fade',
    description: 'Soft romantic haze with matte shadows and light bloom',
    cssFilter: 'contrast(0.88) brightness(1.1) saturate(0.85)',
    tintColor: '#fbcfe8',
    tintOpacity: 0.16,
    blendMode: 'screen',
  },
];

/**
 * Renders the adjusted & filtered image onto a target 2D context.
 */
export function renderAdjustedImage(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  adjustments: PhotoAdjustments = DEFAULT_ADJUSTMENTS,
  filterPreset?: FilterPreset,
  filterIntensity: number = 100
): void {
  ctx.save();

  // 1. Calculate CSS filters (only apply when non-default to preserve zero-copy direct blit)
  const hasAdj = adjustments.brightness !== 0 || adjustments.contrast !== 0 || adjustments.saturation !== 0;
  const hasPreset = Boolean(filterPreset?.cssFilter && filterIntensity >= 95);

  if (hasAdj || hasPreset) {
    const b = 1 + adjustments.brightness / 100;
    const c = 1 + adjustments.contrast / 100;
    const s = 1 + adjustments.saturation / 100;
    let filterStr = `brightness(${b}) contrast(${c}) saturate(${s})`;
    if (hasPreset && filterPreset?.cssFilter) {
      filterStr += ` ${filterPreset.cssFilter}`;
    }
    ctx.filter = filterStr;
  } else {
    ctx.filter = 'none';
  }

  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';

  // 2. Warmth / Temperature overlay
  if (adjustments.warmth !== 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(dx, dy, dw, dh);
    ctx.clip();
    const wVal = Math.abs(adjustments.warmth) / 100;
    ctx.globalAlpha = wVal * 0.35;
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = adjustments.warmth > 0 ? '#ff8800' : '#0077ff';
    ctx.fillRect(dx, dy, dw, dh);
    ctx.restore();
  }

  // 3. Highlights & Shadows
  if (adjustments.highlights !== 0 || adjustments.shadows !== 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(dx, dy, dw, dh);
    ctx.clip();

    if (adjustments.highlights > 0) {
      ctx.globalAlpha = (adjustments.highlights / 100) * 0.28;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(dx, dy, dw, dh);
    } else if (adjustments.highlights < 0) {
      ctx.globalAlpha = (Math.abs(adjustments.highlights) / 100) * 0.25;
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(dx, dy, dw, dh);
    }

    if (adjustments.shadows > 0) {
      ctx.globalAlpha = (adjustments.shadows / 100) * 0.28;
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(dx, dy, dw, dh);
    } else if (adjustments.shadows < 0) {
      ctx.globalAlpha = (Math.abs(adjustments.shadows) / 100) * 0.32;
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = '#000000';
      ctx.fillRect(dx, dy, dw, dh);
    }
    ctx.restore();
  }

  // 4. Filter Tint overlay
  if (filterPreset?.tintColor && filterPreset.tintOpacity && filterIntensity > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(dx, dy, dw, dh);
    ctx.clip();
    ctx.globalAlpha = filterPreset.tintOpacity * (filterIntensity / 100);
    ctx.globalCompositeOperation = filterPreset.blendMode || 'soft-light';
    ctx.fillStyle = filterPreset.tintColor;
    ctx.fillRect(dx, dy, dw, dh);
    ctx.restore();
  }

  // 5. Vignette
  const totalVignette =
    adjustments.vignette + (filterPreset?.vignette || 0) * (filterIntensity / 100);
  if (totalVignette > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(dx, dy, dw, dh);
    ctx.clip();
    const cx = dx + dw / 2;
    const cy = dy + dh / 2;
    const radius = Math.max(dw, dh) * 0.72;
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.35, cx, cy, radius);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    const vigAlpha = Math.min(0.92, (totalVignette / 100) * 0.88);
    grad.addColorStop(1, `rgba(0,0,0,${vigAlpha})`);
    ctx.fillStyle = grad;
    ctx.fillRect(dx, dy, dw, dh);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Commits adjustments and filter at native high resolution.
 */
export function applyToneAndFilterTransform(
  img: HTMLImageElement,
  adjustments: PhotoAdjustments = DEFAULT_ADJUSTMENTS,
  filterPreset?: FilterPreset,
  filterIntensity: number = 100
): string {
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return img.src;

  renderAdjustedImage(ctx, img, 0, 0, w, h, adjustments, filterPreset, filterIntensity);
  return canvas.toDataURL('image/png');
}
