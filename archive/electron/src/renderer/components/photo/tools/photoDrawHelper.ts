/**
 * Freehand drawing engine for photo annotations and creative brushwork.
 */

export type BrushStyle = 'normal' | 'highlighter' | 'neon' | 'pencil';

export interface DrawPoint {
  x: number;
  y: number;
}

export interface BrushSettings {
  style: BrushStyle;
  color: string;
  size: number;
  opacity: number; // 0.1 to 1.0
}

export const DEFAULT_BRUSH: BrushSettings = {
  style: 'normal',
  color: '#3b82f6', // Soft pale blue
  size: 16,
  opacity: 1.0,
};

export const PALETTE_COLORS: string[] = [
  '#0f172a', // Slate black
  '#ffffff', // Pure white
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Amber / Gold
  '#22c55e', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
];

/**
 * Draws a smooth interpolated stroke segment onto a target 2D canvas context.
 */
export function drawStrokeSegment(
  ctx: CanvasRenderingContext2D,
  from: DrawPoint,
  to: DrawPoint,
  settings: BrushSettings
): void {
  ctx.save();

  ctx.lineWidth = settings.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (settings.style === 'highlighter') {
    ctx.globalAlpha = Math.min(0.45, settings.opacity * 0.4);
    ctx.globalCompositeOperation = 'multiply';
    ctx.strokeStyle = settings.color;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  } else if (settings.style === 'neon') {
    // Outer glow
    ctx.globalAlpha = settings.opacity * 0.8;
    ctx.shadowColor = settings.color;
    ctx.shadowBlur = settings.size * 1.5;
    ctx.strokeStyle = settings.color;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    // Inner bright core
    ctx.lineWidth = Math.max(2, settings.size * 0.35);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  } else if (settings.style === 'pencil') {
    ctx.globalAlpha = settings.opacity * 0.7;
    ctx.lineWidth = Math.max(1, settings.size * 0.5);
    ctx.strokeStyle = settings.color;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  } else {
    // Normal solid smooth brush
    ctx.globalAlpha = settings.opacity;
    ctx.strokeStyle = settings.color;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Merges the drawing layer on top of the original image at full native resolution.
 */
export function commitDrawingToImage(
  img: HTMLImageElement,
  drawCanvas: HTMLCanvasElement
): string {
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return img.src;

  ctx.drawImage(img, 0, 0, w, h);
  ctx.drawImage(drawCanvas, 0, 0, w, h);

  return canvas.toDataURL('image/png');
}
