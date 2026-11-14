import { env, pipeline, RawImage } from '@xenova/transformers';

// Ensure browser environment for ONNX in Electron renderer
if (typeof process !== 'undefined' && process.release?.name === 'node') {
  try {
    Object.defineProperty(process, 'release', {
      value: { ...process.release, name: 'browser' },
      configurable: true,
      writable: true,
    });
  } catch {
    // ignore
  }
}

if (typeof window !== 'undefined') {
  env.allowLocalModels = true;
  env.allowRemoteModels = true;
  env.localModelPath = './models/';
  if (env.backends?.onnx?.wasm) {
    env.backends.onnx.wasm.wasmPaths = './wasm/';
    if (navigator.hardwareConcurrency) {
      env.backends.onnx.wasm.numThreads = Math.min(4, Math.max(1, navigator.hardwareConcurrency - 1));
    }
  }
}

let segmenterInstance: any = null;
let loadingPromise: Promise<any> | null = null;

export type AiProgressCallback = (percent: number, message: string) => void;

export async function getSegmentationPipeline(onProgress?: AiProgressCallback): Promise<any> {
  if (segmenterInstance) return segmenterInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      onProgress?.(10, 'Initializing AI neural engine (MODNet Apache-2.0)...');
      const segmenter = await pipeline('image-segmentation', 'Xenova/modnet', {
        progress_callback: (p: any) => {
          if (p.status === 'progress' && p.total) {
            const pct = Math.min(95, Math.round((p.loaded / p.total) * 100));
            onProgress?.(pct, `Loading AI weights (${pct}%)...`);
          } else if (p.status === 'ready') {
            onProgress?.(95, 'AI model ready');
          }
        },
      });
      segmenterInstance = segmenter;
      return segmenter;
    } catch (err) {
      loadingPromise = null;
      throw err;
    }
  })();

  return loadingPromise;
}

/**
 * Generates an interactive cutout mask canvas using MODNet.
 * In Solstice convention:
 * - Alpha = 255: Background to be cut away (erased)
 * - Alpha = 0: Foreground to be kept (subject)
 */
export async function generateCutoutMaskWithAi(
  imageSrc: string,
  onProgress?: AiProgressCallback
): Promise<HTMLCanvasElement> {
  onProgress?.(5, 'Preparing image...');
  let rawImage: RawImage;
  if (imageSrc.startsWith('data:') || imageSrc.startsWith('blob:')) {
    const res = await fetch(imageSrc);
    const blob = await res.blob();
    rawImage = await RawImage.fromBlob(blob);
  } else {
    rawImage = await RawImage.fromURL(imageSrc);
  }

  onProgress?.(25, 'Loading AI model...');
  const segmenter = await getSegmentationPipeline(onProgress);

  onProgress?.(60, 'Segmenting foreground matting...');
  const output = await segmenter(rawImage);

  onProgress?.(90, 'Generating interactive mask...');
  const resultItem = Array.isArray(output) ? output[0] : output;

  const w = rawImage.width;
  const h = rawImage.height;
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = w;
  maskCanvas.height = h;
  const ctx = maskCanvas.getContext('2d');
  if (!ctx) throw new Error('Could not create mask canvas context');

  if (resultItem && typeof resultItem.toCanvas === 'function') {
    const rawMask = resultItem.toCanvas();
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tCtx = tempCanvas.getContext('2d');
    if (tCtx) {
      tCtx.drawImage(rawMask, 0, 0, w, h);
      const modnetData = tCtx.getImageData(0, 0, w, h).data;
      const maskImgData = ctx.createImageData(w, h);
      for (let i = 0; i < w * h; i++) {
        // MODNet: 255 = foreground (subject), 0 = background.
        // In Solstice maskCanvas: alpha = 255 means background to erase, 0 means keep.
        const fg = modnetData[i * 4];
        const bgAlpha = 255 - fg;
        maskImgData.data[i * 4] = 255;
        maskImgData.data[i * 4 + 1] = 255;
        maskImgData.data[i * 4 + 2] = 255;
        maskImgData.data[i * 4 + 3] = bgAlpha;
      }
      ctx.putImageData(maskImgData, 0, 0);
    }
  }

  onProgress?.(100, 'Selection ready');
  return maskCanvas;
}

/**
 * Convenience helper to remove background directly using MODNet.
 */
export async function removeBackgroundWithAi(
  imageSrc: string,
  onProgress?: AiProgressCallback
): Promise<string> {
  const maskCanvas = await generateCutoutMaskWithAi(imageSrc, onProgress);
  const w = maskCanvas.width;
  const h = maskCanvas.height;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create output canvas context');

  let rawImage: RawImage;
  if (imageSrc.startsWith('data:') || imageSrc.startsWith('blob:')) {
    const res = await fetch(imageSrc);
    const blob = await res.blob();
    rawImage = await RawImage.fromBlob(blob);
  } else {
    rawImage = await RawImage.fromURL(imageSrc);
  }

  ctx.drawImage(rawImage.toCanvas(), 0, 0, w, h);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(maskCanvas, 0, 0, w, h);

  return canvas.toDataURL('image/png');
}
