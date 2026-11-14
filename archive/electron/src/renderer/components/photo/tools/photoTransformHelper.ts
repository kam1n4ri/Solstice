/**
 * Pure offscreen canvas helpers for non-destructive high-resolution image transformations.
 */

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropTransformOptions {
  cropRect: CropRect;
  rotation?: number; // degrees: 0, 90, 180, 270 or arbitrary
  flipH?: boolean;
  flipV?: boolean;
}

export interface FitTransformOptions {
  aspectRatio: number; // width / height, e.g. 1 for 1:1, 16/9, 4/5
  fillType: 'blur' | 'color';
  fillColor?: string;
  photoScale?: number; // 0.5 to 1.0
  borderRadius?: number; // pixels on inner photo
  borderWidth?: number;
  borderColor?: string;
}

/**
 * Crops and rotates/flips an image at its full native resolution.
 */
export function applyCropTransform(
  img: HTMLImageElement,
  options: CropTransformOptions
): string {
  const { cropRect, rotation = 0, flipH = false, flipV = false } = options;

  const w = Math.max(1, Math.round(cropRect.width));
  const h = Math.max(1, Math.round(cropRect.height));

  const isSwapped = Math.abs(rotation) % 180 === 90;
  const outW = isSwapped ? h : w;
  const outH = isSwapped ? w : h;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return img.src;

  ctx.save();

  // Handle flips and rotations around center
  ctx.translate(outW / 2, outH / 2);
  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.translate(-w / 2, -h / 2);

  // Draw the cropped portion from natural image coordinates
  ctx.drawImage(
    img,
    cropRect.x,
    cropRect.y,
    cropRect.width,
    cropRect.height,
    0,
    0,
    w,
    h
  );

  ctx.restore();
  return canvas.toDataURL('image/png');
}

/**
 * Places an image inside a target aspect ratio without cropping,
 * using blurred background padding or solid pastel colors (Picsart Fit).
 */
export function applyFitTransform(
  img: HTMLImageElement,
  options: FitTransformOptions
): string {
  const {
    aspectRatio,
    fillType,
    fillColor = '#ffffff',
    photoScale = 0.9,
    borderRadius = 0,
    borderWidth = 0,
    borderColor = '#ffffff',
  } = options;

  const natW = img.naturalWidth;
  const natH = img.naturalHeight;

  // Determine output canvas size that fits the image's highest dimension
  let canvasW: number;
  let canvasH: number;

  const baseDimension = Math.max(natW, natH, 1200);
  if (aspectRatio >= 1) {
    canvasW = baseDimension;
    canvasH = Math.round(baseDimension / aspectRatio);
  } else {
    canvasH = baseDimension;
    canvasW = Math.round(baseDimension * aspectRatio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return img.src;

  // 1. Draw Background (Blurred image or solid color)
  if (fillType === 'blur') {
    ctx.save();
    // Fill background with blurred, slightly zoomed copy to cover canvas
    ctx.filter = 'blur(40px)';
    const scaleCover = Math.max(canvasW / natW, canvasH / natH) * 1.15;
    const coverW = natW * scaleCover;
    const coverH = natH * scaleCover;
    ctx.drawImage(
      img,
      (canvasW - coverW) / 2,
      (canvasH - coverH) / 2,
      coverW,
      coverH
    );
    // Subtle darkening overlay so inner photo pops
    ctx.filter = 'none';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.restore();
  } else {
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  // 2. Compute inner image dimensions maintaining aspect ratio inside target
  const maxInnerW = canvasW * photoScale;
  const maxInnerH = canvasH * photoScale;
  const scaleFit = Math.min(maxInnerW / natW, maxInnerH / natH);

  const innerW = Math.round(natW * scaleFit);
  const innerH = Math.round(natH * scaleFit);
  const innerX = Math.round((canvasW - innerW) / 2);
  const innerY = Math.round((canvasH - innerH) / 2);

  // 3. Draw inner photo with optional rounded corners & shadow
  ctx.save();

  // Draw shadow
  ctx.shadowColor = 'rgba(15, 23, 42, 0.16)';
  ctx.shadowBlur = Math.round(canvasW * 0.03);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.round(canvasH * 0.015);

  const r = Math.min(borderRadius * (canvasW / 1000), innerW / 2, innerH / 2);

  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(innerX, innerY, innerW, innerH, r);
  } else {
    ctx.rect(innerX, innerY, innerW, innerH);
  }
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Reset shadow for clipping inner photo
  ctx.shadowColor = 'transparent';
  ctx.clip();

  ctx.drawImage(img, innerX, innerY, innerW, innerH);
  ctx.restore();

  // 4. Draw border if specified
  if (borderWidth > 0) {
    ctx.save();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth * (canvasW / 1000);
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(innerX, innerY, innerW, innerH, r);
    } else {
      ctx.rect(innerX, innerY, innerW, innerH);
    }
    ctx.stroke();
    ctx.restore();
  }

  return canvas.toDataURL('image/png');
}
