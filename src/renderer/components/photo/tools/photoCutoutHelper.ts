/**
 * Pure image segmentation and alpha matting algorithms for local offline background removal and cutout.
 */

export interface CutoutOptions {
  tolerance: number; // 5 to 100, default 30
  featherRadius: number; // 0 to 5, default 2
}

/**
 * Automatically computes an edge flood-fill background mask into a mask canvas.
 * Pixels identified as background have alpha = 255.
 */
export function autoGenerateEdgeMask(
  img: HTMLImageElement,
  options: CutoutOptions = { tolerance: 30, featherRadius: 2 }
): HTMLCanvasElement {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = w;
  maskCanvas.height = h;
  if (w === 0 || h === 0) return maskCanvas;

  const ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return maskCanvas;

  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const offCtx = off.getContext('2d', { willReadFrequently: true });
  if (!offCtx) return maskCanvas;
  offCtx.drawImage(img, 0, 0);
  const data = offCtx.getImageData(0, 0, w, h).data;

  // 1. Collect background reference colors from perimeter
  const bgColors: [number, number, number][] = [];
  const sampleSteps = Math.max(1, Math.floor(Math.min(w, h) / 40));

  for (let x = 0; x < w; x += sampleSteps) {
    const topIdx = x * 4;
    const botIdx = ((h - 1) * w + x) * 4;
    bgColors.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);
    bgColors.push([data[botIdx], data[botIdx + 1], data[botIdx + 2]]);
  }
  for (let y = 0; y < h; y += sampleSteps) {
    const lIdx = (y * w) * 4;
    const rIdx = (y * w + (w - 1)) * 4;
    bgColors.push([data[lIdx], data[lIdx + 1], data[lIdx + 2]]);
    bgColors.push([data[rIdx], data[rIdx + 1], data[rIdx + 2]]);
  }

  // 2. BFS flood fill
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let qHead = 0;
  let qTail = 0;
  const tolSq = options.tolerance * options.tolerance * 3;

  const isBgMatch = (idx: number): boolean => {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    for (let i = 0; i < bgColors.length; i += 2) {
      const bg = bgColors[i];
      const dr = r - bg[0];
      const dg = g - bg[1];
      const db = b - bg[2];
      if (dr * dr + dg * dg + db * db <= tolSq) return true;
    }
    return false;
  };

  for (let x = 0; x < w; x++) {
    const topP = x;
    const botP = (h - 1) * w + x;
    if (isBgMatch(topP * 4)) { visited[topP] = 1; queue[qTail++] = topP; }
    if (isBgMatch(botP * 4)) { visited[botP] = 1; queue[qTail++] = botP; }
  }
  for (let y = 0; y < h; y++) {
    const lP = y * w;
    const rP = y * w + (w - 1);
    if (!visited[lP] && isBgMatch(lP * 4)) { visited[lP] = 1; queue[qTail++] = lP; }
    if (!visited[rP] && isBgMatch(rP * 4)) { visited[rP] = 1; queue[rP * 4] = 1; queue[qTail++] = rP; }
  }

  while (qHead < qTail) {
    const curr = queue[qHead++];
    const cx = curr % w;
    const cy = (curr / w) | 0;
    const neighbors = [
      cx > 0 ? curr - 1 : -1,
      cx < w - 1 ? curr + 1 : -1,
      cy > 0 ? curr - w : -1,
      cy < h - 1 ? curr + w : -1,
    ];
    for (let i = 0; i < 4; i++) {
      const n = neighbors[i];
      if (n !== -1 && visited[n] === 0 && isBgMatch(n * 4)) {
        visited[n] = 1;
        queue[qTail++] = n;
      }
    }
  }

  const maskImgData = ctx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    if (visited[i] === 1) {
      maskImgData.data[i * 4] = 255;
      maskImgData.data[i * 4 + 1] = 255;
      maskImgData.data[i * 4 + 2] = 255;
      maskImgData.data[i * 4 + 3] = 255;
    }
  }
  ctx.putImageData(maskImgData, 0, 0);
  return maskCanvas;
}

/**
 * Samples border pixels to automatically segment background from foreground.
 */
export function autoRemoveBackground(
  img: HTMLImageElement,
  options: CutoutOptions = { tolerance: 30, featherRadius: 2 }
): string {
  const maskCanvas = autoGenerateEdgeMask(img, options);
  return applyMaskToImage(img, maskCanvas, true);
}

/**
 * Magic wand flood selection starting at (startX, startY).
 */
export function floodSelectMask(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  startX: number,
  startY: number,
  tolerance: number = 30
): Uint8Array {
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const startIdx = (startY * w + startX) * 4;
  const sR = data[startIdx];
  const sG = data[startIdx + 1];
  const sB = data[startIdx + 2];

  const mask = new Uint8Array(w * h);
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let qHead = 0;
  let qTail = 0;

  const root = startY * w + startX;
  visited[root] = 1;
  mask[root] = 1;
  queue[qTail++] = root;

  const tolSq = tolerance * tolerance * 3;

  while (qHead < qTail) {
    const curr = queue[qHead++];
    const cx = curr % w;
    const cy = (curr / w) | 0;

    const neighbors = [
      cx > 0 ? curr - 1 : -1,
      cx < w - 1 ? curr + 1 : -1,
      cy > 0 ? curr - w : -1,
      cy < h - 1 ? curr + w : -1,
    ];

    for (let i = 0; i < 4; i++) {
      const n = neighbors[i];
      if (n !== -1 && visited[n] === 0) {
        visited[n] = 1;
        const nIdx = n * 4;
        const dr = data[nIdx] - sR;
        const dg = data[nIdx + 1] - sG;
        const db = data[nIdx + 2] - sB;
        if (dr * dr + dg * dg + db * db <= tolSq) {
          mask[n] = 1;
          queue[qTail++] = n;
        }
      }
    }
  }

  return mask;
}

/**
 * Commits a binary/alpha mask onto an Image element and returns a transparent PNG dataUrl.
 */
export function applyMaskToImage(
  img: HTMLImageElement,
  maskCanvas: HTMLCanvasElement,
  invert: boolean = false
): string {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return img.src;

  ctx.drawImage(img, 0, 0, w, h);

  ctx.save();
  ctx.globalCompositeOperation = invert ? 'destination-out' : 'destination-in';
  ctx.drawImage(maskCanvas, 0, 0, w, h);
  ctx.restore();

  return canvas.toDataURL('image/png');
}
