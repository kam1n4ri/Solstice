import { floodSelectMask } from './photoCutoutHelper';

export function applyStrokeDot(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  brushSize: number,
  isErase: boolean
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.save();
  ctx.globalCompositeOperation = isErase ? 'source-over' : 'destination-out';
  ctx.fillStyle = 'rgba(255, 255, 255, 1)';
  ctx.beginPath();
  ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function applyStrokeLine(
  canvas: HTMLCanvasElement,
  from: { x: number; y: number },
  to: { x: number; y: number },
  brushSize: number,
  isErase: boolean
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.save();
  ctx.globalCompositeOperation = isErase ? 'source-over' : 'destination-out';
  ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
  ctx.lineWidth = brushSize;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

export function applyWandSelection(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  width: number,
  height: number,
  x: number,
  y: number,
  tolerance: number,
  isErase: boolean
): void {
  const off = document.createElement('canvas');
  off.width = width;
  off.height = height;
  const offCtx = off.getContext('2d', { willReadFrequently: true });
  if (!offCtx) return;

  offCtx.drawImage(img, 0, 0);
  const selMask = floodSelectMask(offCtx, width, height, x, y, tolerance);
  const mCtx = canvas.getContext('2d');
  if (!mCtx) return;

  const mData = mCtx.getImageData(0, 0, width, height);
  for (let i = 0; i < width * height; i++) {
    if (selMask[i] === 1) {
      mData.data[i * 4 + 3] = isErase ? 255 : 0;
    }
  }
  mCtx.putImageData(mData, 0, 0);
}

export function invertCanvasAlpha(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < canvas.width * canvas.height; i++) {
    imgData.data[i * 4 + 3] = 255 - imgData.data[i * 4 + 3];
  }
  ctx.putImageData(imgData, 0, 0);
}
