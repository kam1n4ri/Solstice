/**
 * Pure canvas text rendering and rasterization helper for creative typography.
 */

export interface PhotoTextOptions {
  text: string;
  fontFamily: string;
  fontSize: number; // in natural image pixels
  color: string;
  backgroundColor: string; // 'transparent' or hex
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
  letterSpacing: number; // in pixels
  x: number; // natural pixel coordinates
  y: number;
}

export const DEFAULT_TEXT_OPTIONS: PhotoTextOptions = {
  text: 'Hello World',
  fontFamily: 'Inter',
  fontSize: 48,
  color: '#ffffff',
  backgroundColor: 'rgba(15, 23, 42, 0.65)',
  bold: true,
  italic: false,
  align: 'center',
  letterSpacing: 1,
  x: 0,
  y: 0,
};

export const AVAILABLE_FONTS = [
  { id: 'Inter', name: 'Inter (Clean Sans)' },
  { id: 'Roboto', name: 'Roboto' },
  { id: 'Poppins', name: 'Poppins (Geometric)' },
  { id: 'Playfair Display', name: 'Playfair (Elegant Serif)' },
  { id: 'Pacifico', name: 'Pacifico (Handwritten Script)' },
  { id: 'Space Grotesk', name: 'Space Grotesk (Tech)' },
  { id: 'Caveat', name: 'Caveat (Casual Pen)' },
  { id: 'Orbitron', name: 'Orbitron (Futuristic)' },
];

/**
 * Draws configured text onto a target canvas context.
 */
export function drawTextOnContext(
  ctx: CanvasRenderingContext2D,
  options: PhotoTextOptions
): void {
  const {
    text,
    fontFamily,
    fontSize,
    color,
    backgroundColor,
    bold,
    italic,
    align,
    letterSpacing,
    x,
    y,
  } = options;

  if (!text.trim()) return;

  ctx.save();

  const fontStyle = italic ? 'italic' : 'normal';
  const fontWeight = bold ? 'bold' : 'normal';
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  if ('letterSpacing' in ctx && typeof (ctx as any).letterSpacing === 'string') {
    (ctx as any).letterSpacing = `${letterSpacing}px`;
  }

  const lines = text.split('\n');
  const lineHeight = fontSize * 1.28;
  const totalHeight = lines.length * lineHeight;

  // Measure widest line for background badge
  let maxW = 0;
  for (const line of lines) {
    const metrics = ctx.measureText(line);
    if (metrics.width > maxW) maxW = metrics.width;
  }

  // Draw background badge pill if not transparent
  if (backgroundColor && backgroundColor !== 'transparent') {
    ctx.save();
    const padX = fontSize * 0.45;
    const padY = fontSize * 0.35;
    const badgeW = maxW + padX * 2;
    const badgeH = totalHeight + padY * 2;

    let badgeX = x - badgeW / 2;
    if (align === 'left') badgeX = x - padX;
    else if (align === 'right') badgeX = x - maxW - padX;

    const badgeY = y - totalHeight / 2 - padY;
    const r = Math.min(12, fontSize * 0.25);

    ctx.fillStyle = backgroundColor;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, r);
    } else {
      ctx.rect(badgeX, badgeY, badgeW, badgeH);
    }
    ctx.fill();
    ctx.restore();
  }

  // Draw text lines
  ctx.fillStyle = color;
  // Subtle text drop shadow for readability
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = Math.round(fontSize * 0.1);
  ctx.shadowOffsetY = Math.round(fontSize * 0.05);

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, idx) => {
    ctx.fillText(line, x, startY + idx * lineHeight);
  });

  ctx.restore();
}

/**
 * Commits text onto the image at its native high resolution.
 */
export function commitTextToImage(
  img: HTMLImageElement,
  options: PhotoTextOptions
): string {
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return img.src;

  ctx.drawImage(img, 0, 0, w, h);
  drawTextOnContext(ctx, options);

  return canvas.toDataURL('image/png');
}
