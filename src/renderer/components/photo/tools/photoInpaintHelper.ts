/**
 * Pure local offline content-aware inpainting & object removal algorithm.
 * Uses boundary-propagated patch blending to seamlessly remove unwanted objects and blemishes.
 */

export interface InpaintOptions {
  radius?: number; // neighborhood sampling radius, default 6
}

/**
 * Removes masked objects from an image and seamlessly fills the region
 * using surrounding texture and color gradients.
 */
export function inpaintObjectRemoval(
  img: HTMLImageElement,
  maskCanvas: HTMLCanvasElement,
  options: InpaintOptions = { radius: 6 }
): string {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (w === 0 || h === 0) return img.src;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return img.src;

  // Draw source image
  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Read mask data
  const mCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
  if (!mCtx) return img.src;
  const mData = mCtx.getImageData(0, 0, w, h).data;

  // 1. Build binary mask flag array: 1 = to be removed / filled, 0 = known background
  const mask = new Uint8Array(w * h);
  let hasMask = false;
  let minX = w;
  let maxX = 0;
  let minY = h;
  let maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      // Mask has content if alpha channel is non-zero
      if (mData[idx * 4 + 3] > 20) {
        mask[idx] = 1;
        hasMask = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasMask) return img.src;

  // Add padding around bounding box
  const pad = (options.radius || 6) * 2;
  const startX = Math.max(0, minX - pad);
  const endX = Math.min(w - 1, maxX + pad);
  const startY = Math.max(0, minY - pad);
  const endY = Math.min(h - 1, maxY + pad);

  // 2. Iterative outward-to-inward boundary synthesis pass
  const r = options.radius || 6;
  const maxIterations = Math.max(1, Math.min(60, Math.max(maxX - minX, maxY - minY)));

  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const p = y * w + x;
        if (mask[p] !== 1) continue;

        // Check if pixel touches known pixels
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let totalWeight = 0;

        for (let dy = -r; dy <= r; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) continue;

          for (let dx = -r; dx <= r; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;

            const np = ny * w + nx;
            if (mask[np] === 0) {
              const distSq = dx * dx + dy * dy;
              if (distSq <= r * r && distSq > 0) {
                const weight = 1.0 / (Math.sqrt(distSq) + 0.1);
                const nIdx = np * 4;
                sumR += data[nIdx] * weight;
                sumG += data[nIdx + 1] * weight;
                sumB += data[nIdx + 2] * weight;
                totalWeight += weight;
              }
            }
          }
        }

        if (totalWeight > 0) {
          const pIdx = p * 4;
          data[pIdx] = Math.round(sumR / totalWeight);
          data[pIdx + 1] = Math.round(sumG / totalWeight);
          data[pIdx + 2] = Math.round(sumB / totalWeight);
          data[pIdx + 3] = 255;
          // Mark as filled in this wave
          mask[p] = 2;
          changed = true;
        }
      }
    }

    if (!changed) break;

    // Commit filled wave pixels to known (0) inside the bounding box
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const p = y * w + x;
        if (mask[p] === 2) mask[p] = 0;
      }
    }
  }

  // Fallback pass: fill any stubborn unreached center pixels from nearest border
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const p = y * w + x;
      if (mask[p] === 1) {
        const pIdx = p * 4;
        let foundIdx = -1;
        for (let sr = 1; sr <= 40; sr++) {
          const dirs = [[x + sr, y], [x - sr, y], [x, y + sr], [x, y - sr]];
          for (const [cx, cy] of dirs) {
            if (cx >= 0 && cx < w && cy >= 0 && cy < h) {
              const cp = cy * w + cx;
              if (mask[cp] === 0) {
                foundIdx = cp * 4;
                break;
              }
            }
          }
          if (foundIdx !== -1) break;
        }
        if (foundIdx !== -1) {
          data[pIdx] = data[foundIdx];
          data[pIdx + 1] = data[foundIdx + 1];
          data[pIdx + 2] = data[foundIdx + 2];
          data[pIdx + 3] = 255;
          mask[p] = 0;
        }
      }
    }
  }

  // 3. Subtle smoothing pass on filled region to blend boundary seams
  for (let y = startY; y <= endY; y++) {
    for (let x = startX; x <= endX; x++) {
      const p = y * w + x;
      const mIdx = p * 4;
      if (mData[mIdx + 3] > 20) {
        let rAcc = data[mIdx] * 2;
        let gAcc = data[mIdx + 1] * 2;
        let bAcc = data[mIdx + 2] * 2;
        let cnt = 2;

        if (x > 0) {
          rAcc += data[mIdx - 4]; gAcc += data[mIdx - 3]; bAcc += data[mIdx - 2]; cnt++;
        }
        if (x < w - 1) {
          rAcc += data[mIdx + 4]; gAcc += data[mIdx + 5]; bAcc += data[mIdx + 6]; cnt++;
        }
        if (y > 0) {
          rAcc += data[mIdx - w * 4]; gAcc += data[mIdx - w * 4 + 1]; bAcc += data[mIdx - w * 4 + 2]; cnt++;
        }
        if (y < h - 1) {
          rAcc += data[mIdx + w * 4]; gAcc += data[mIdx + w * 4 + 1]; bAcc += data[mIdx + w * 4 + 2]; cnt++;
        }

        data[mIdx] = Math.round(rAcc / cnt);
        data[mIdx + 1] = Math.round(gAcc / cnt);
        data[mIdx + 2] = Math.round(bAcc / cnt);
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}
