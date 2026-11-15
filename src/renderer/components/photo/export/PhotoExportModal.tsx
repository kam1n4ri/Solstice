import React, { useState } from 'react';
import { Download, X, FileImage, Loader2 } from 'lucide-react';
import { PhotoAdjustments, renderAdjustedImage } from '../tools/photoFilterHelper';

export type ExportFormat = 'png' | 'jpg' | 'webp';

export interface PhotoExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageSrc: string;
  defaultTitle: string;
  dimensions: { width: number; height: number };
  adjustments?: PhotoAdjustments;
  onExportSuccess?: (fileName: string) => void;
}

/**
 * Converts a dataUrl to the requested format and quality with background matte handling.
 * Uses native Rust 32-bit SIMD tone engine when adjustments are active.
 */
async function processImageForExport(
  dataUrl: string,
  format: ExportFormat,
  quality: number,
  matteColor: string,
  adjustments?: PhotoAdjustments
): Promise<string> {
  let sourceUrl = dataUrl;
  let nativeApplied = false;

  if (adjustments && Object.values(adjustments).some((v) => v !== 0)) {
    if (window.solsticeAPI?.photoApplyTone) {
      try {
        sourceUrl = await window.solsticeAPI.photoApplyTone({
          dataUrl,
          params: adjustments,
        });
        nativeApplied = true;
      } catch (e) {
        console.warn('Native tone apply fallback to canvas:', e);
      }
    }
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = sourceUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 1;
      canvas.height = img.naturalHeight || 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(sourceUrl);
        return;
      }

      if (format === 'jpg') {
        ctx.fillStyle = matteColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (!nativeApplied && adjustments) {
        renderAdjustedImage(ctx, img, 0, 0, canvas.width, canvas.height, adjustments);
      } else {
        ctx.drawImage(img, 0, 0);
      }

      const mimeType =
        format === 'jpg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
      resolve(canvas.toDataURL(mimeType, quality / 100));
    };
    img.onerror = () => resolve(sourceUrl);
  });
}

export const PhotoExportModal: React.FC<PhotoExportModalProps> = ({
  isOpen,
  onClose,
  currentImageSrc,
  defaultTitle,
  dimensions,
  adjustments,
  onExportSuccess,
}) => {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState<number>(92);
  const [matteColor, setMatteColor] = useState<string>('#ffffff');
  const [fileName, setFileName] = useState<string>(
    defaultTitle.replace(/\.[a-zA-Z0-9]+$/, '') || 'Edited-Photo'
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Approximate file size estimate (KB)
  const pixelCount = (dimensions.width * dimensions.height) || 1000000;
  const estimatedKb = Math.round(
    format === 'png'
      ? pixelCount * 0.0016
      : format === 'webp'
      ? (pixelCount * 0.00045 * quality) / 100
      : (pixelCount * 0.0007 * quality) / 100
  );

  const handleExport = async () => {
    if (!window.solsticeAPI?.photoExportFile || isExporting) return;
    setIsExporting(true);

    try {
      const exportDataUrl = await processImageForExport(
        currentImageSrc,
        format,
        quality,
        matteColor,
        adjustments
      );
      const cleanName = `${fileName.trim() || 'Photo'}.${format}`;

      const res = await window.solsticeAPI.photoExportFile({
        dataUrl: exportDataUrl,
        defaultName: cleanName,
        format,
      });

      if (res.success && !res.canceled) {
        onExportSuccess?.(res.fileName || cleanName);
        onClose();
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-2xs flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200/80 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200/60 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50/80 text-blue-700 border border-blue-200/80">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Export Image</h3>
              <p className="text-[11px] text-slate-400">Save optimized file to your computer</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 flex flex-col gap-4 text-xs">
          {/* Filename Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-600">File Name</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={fileName}
                disabled={isExporting}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Photo name"
                className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200/80 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-stone-400 focus:bg-white transition-all font-mono"
              />
              <span className="text-xs font-mono font-medium text-slate-400 uppercase">
                .{format}
              </span>
            </div>
          </div>

          {/* Format Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-600">Export Format</label>
            <div className="grid grid-cols-3 gap-2">
              {(['png', 'jpg', 'webp'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  disabled={isExporting}
                  onClick={() => setFormat(fmt)}
                  className={`py-2 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                    format === fmt
                      ? 'bg-stone-200/90 text-stone-900 border-stone-400 font-semibold shadow-2xs'
                      : 'bg-stone-50/60 text-slate-600 border-stone-200/70 hover:bg-stone-100/70'
                  }`}
                >
                  <span className="text-xs font-bold uppercase block">{fmt}</span>
                  <span className="text-[10px] text-slate-400 block font-normal">
                    {fmt === 'png' ? 'Lossless / Alpha' : fmt === 'jpg' ? 'Photo / Small' : 'Next-Gen Web'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quality Slider (JPG & WebP only) */}
          {format !== 'png' && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-semibold text-slate-600">Compression Quality</span>
                <span className="font-mono text-slate-500 font-medium">
                  {quality}% {quality >= 85 ? '(High)' : quality >= 60 ? '(Medium)' : '(Low)'}
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={100}
                step={1}
                value={quality}
                disabled={isExporting}
                onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-stone-200/80 rounded-lg"
              />
            </div>
          )}

          {/* Background Matte Color for JPG */}
          {format === 'jpg' && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50/80 border border-stone-200/70">
              <div>
                <span className="text-[11px] font-semibold text-slate-600 block">Matte Fill</span>
                <span className="text-[10px] text-slate-400">Replaces transparent pixels</span>
              </div>
              <div className="flex items-center gap-1.5">
                {['#ffffff', '#000000', '#f4f4f5'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setMatteColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                      matteColor === color
                        ? 'ring-2 ring-blue-500 ring-offset-1 border-stone-400'
                        : 'border-stone-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Dimension & File Size Summary */}
          <div className="p-3 rounded-xl bg-stone-50/80 border border-stone-200/70 flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <FileImage className="h-4 w-4 text-slate-400" />
              <span>{dimensions.width} × {dimensions.height} px</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-slate-500">
              <span>Est. ~{estimatedKb > 1024 ? `${(estimatedKb / 1024).toFixed(1)} MB` : `${estimatedKb} KB`}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-stone-200/80 bg-stone-50/50 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="flex-1 h-8 px-3 rounded-md text-xs font-medium bg-white hover:bg-stone-50 text-slate-700 border border-stone-300 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 h-8 px-3 rounded-md text-xs font-medium bg-stone-900 hover:bg-black text-white border border-stone-900 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <span>Export Image</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
