import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { WatermarkOptions, WATERMARK_PRESETS } from './PdfWatermarkTypes';

interface PdfWatermarkContentOptionsProps {
  options: WatermarkOptions;
  onChangeOptions: (updater: (prev: WatermarkOptions) => WatermarkOptions) => void;
}

export const PdfWatermarkContentOptions: React.FC<PdfWatermarkContentOptionsProps> = ({
  options,
  onChangeOptions,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleSelectImageFile = async () => {
    try {
      if (!window.solsticeAPI?.pdfSelectImages || !window.solsticeAPI?.pdfReadFile) return;
      const res = await window.solsticeAPI.pdfSelectImages();
      if (!res.canceled && res.filePaths.length > 0) {
        const filePath = res.filePaths[0];
        const fileName = filePath.split(/[/\\]/).pop() || 'watermark.png';
        const readRes = await window.solsticeAPI.pdfReadFile(filePath);
        if (readRes.success && readRes.data) {
          const bytes = new Uint8Array(readRes.data);
          const mime = filePath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
          const blob = new Blob([bytes], { type: mime });
          const dataUrl = URL.createObjectURL(blob);
          onChangeOptions((prev) => ({
            ...prev,
            imagePath: filePath,
            imageFileName: fileName,
            imageDataUrl: dataUrl,
          }));
        }
      }
    } catch (err) {
      console.warn('[Watermark] Failed to select image:', err);
    }
  };

  const handleDropImage = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (/\.(png|jpe?g|webp)$/i.test(file.name)) {
        const dataUrl = URL.createObjectURL(file);
        const filePath = (file as unknown as { path?: string }).path || undefined;
        onChangeOptions((prev) => ({
          ...prev,
          imagePath: filePath,
          imageFileName: file.name,
          imageDataUrl: dataUrl,
        }));
      }
    }
  };

  if (options.type === 'image') {
    return (
      <div className="space-y-2">
        <label className="text-xs font-semibold text-stone-700 block">Watermark Graphic</label>
        {options.imageDataUrl ? (
          <div className="p-2 rounded-xl border border-stone-200/80 bg-stone-50/50 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-white border border-stone-200/60 p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={options.imageDataUrl}
                alt="Watermark preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-stone-800 truncate">
                {options.imageFileName || 'Custom Image'}
              </p>
              <button
                type="button"
                onClick={handleSelectImageFile}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
              >
                Replace image
              </button>
            </div>
            <button
              type="button"
              onClick={() =>
                onChangeOptions((prev) => ({
                  ...prev,
                  imageDataUrl: undefined,
                  imagePath: undefined,
                  imageFileName: undefined,
                }))
              }
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div
            onClick={handleSelectImageFile}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDropImage}
            className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-rose-300 bg-rose-50/40'
                : 'border-stone-200/80 bg-stone-50/40 hover:border-rose-200 hover:bg-stone-50/80'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-white border border-stone-200/60 text-stone-400 flex items-center justify-center mb-1.5 shadow-2xs">
              <Upload className="w-4 h-4 text-stone-500" />
            </div>
            <span className="text-xs font-semibold text-stone-700">Choose custom image</span>
            <span className="text-[10px] text-stone-400 mt-0.5">PNG, JPG, or WebP</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-stone-700 block">Watermark Text</label>
      <input
        type="text"
        value={options.text}
        onChange={(e) => onChangeOptions((prev) => ({ ...prev, text: e.target.value }))}
        placeholder="e.g. CONFIDENTIAL"
        className="w-full px-3 py-1.5 rounded-xl border border-stone-200/90 bg-white text-xs font-semibold text-stone-800 focus:outline-none focus:border-rose-300 transition-colors"
      />

      {/* Quick Pale Preset Buttons */}
      <div className="flex flex-wrap gap-1 pt-0.5">
        {WATERMARK_PRESETS.map((preset) => {
          const isSelected = options.text === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => onChangeOptions((prev) => ({ ...prev, text: preset }))}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-rose-50 border-rose-200/80 text-rose-700 font-semibold shadow-2xs'
                  : 'bg-stone-50/80 hover:bg-stone-100 border-stone-200/50 text-stone-600'
              }`}
            >
              {preset}
            </button>
          );
        })}
      </div>
    </div>
  );
};
