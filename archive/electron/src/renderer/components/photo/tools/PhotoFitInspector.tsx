import React, { useRef } from 'react';
import { Palette, Image as ImageIcon } from 'lucide-react';
import { ASPECT_PRESETS, AspectPreset } from './PhotoCropInspector';
import { PhotoInspectorActions } from './PhotoInspectorActions';

const COLOR_SWATCHES = [
  '#ffffff',
  '#fafaf9',
  '#f1f5f9',
  '#e2e8f0',
  '#0f172a',
  '#fef2f2',
  '#fffbeb',
  '#f0fdf4',
  '#f5f3ff',
];

interface PhotoFitInspectorProps {
  selectedPreset: string;
  onSelectPreset: (preset: AspectPreset) => void;
  fillType: 'blur' | 'color';
  onFillTypeChange: (type: 'blur' | 'color') => void;
  fillColor: string;
  onFillColorChange: (color: string) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
  borderRadius: number;
  onBorderRadiusChange: (radius: number) => void;
  borderWidth: number;
  onBorderWidthChange: (width: number) => void;
  onApply: () => void;
  onCancel: () => void;
}

export const PhotoFitInspector: React.FC<PhotoFitInspectorProps> = ({
  selectedPreset,
  onSelectPreset,
  fillType,
  onFillTypeChange,
  fillColor,
  onFillColorChange,
  scale,
  onScaleChange,
  borderRadius,
  onBorderRadiusChange,
  borderWidth,
  onBorderWidthChange,
  onApply,
  onCancel,
}) => {
  const rafScaleRef = useRef<number | null>(null);
  const rafRadiusRef = useRef<number | null>(null);
  const rafBorderRef = useRef<number | null>(null);

  const handleScaleChange = (val: number) => {
    if (rafScaleRef.current) cancelAnimationFrame(rafScaleRef.current);
    rafScaleRef.current = requestAnimationFrame(() => onScaleChange(val));
  };

  const handleRadiusChange = (val: number) => {
    if (rafRadiusRef.current) cancelAnimationFrame(rafRadiusRef.current);
    rafRadiusRef.current = requestAnimationFrame(() => onBorderRadiusChange(val));
  };

  const handleBorderChange = (val: number) => {
    if (rafBorderRef.current) cancelAnimationFrame(rafBorderRef.current);
    rafBorderRef.current = requestAnimationFrame(() => onBorderWidthChange(val));
  };
  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-4 space-y-4 text-slate-800 select-none">
      {/* 1. Target Ratio */}
      <div>
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
          Canvas Ratio
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {ASPECT_PRESETS.filter((p) => p.ratio !== null).map((p) => {
            const isSelected = selectedPreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPreset(p)}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center cursor-pointer ${
                  isSelected
                    ? 'bg-stone-800 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200/70 text-slate-700'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Backdrop Fill Mode */}
      <div>
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
          Background Style
        </label>
        <div className="grid grid-cols-2 gap-2 mb-2.5">
          <button
            type="button"
            onClick={() => onFillTypeChange('blur')}
            className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition-all cursor-pointer ${
              fillType === 'blur'
                ? 'bg-stone-200/90 border-stone-400/80 text-stone-900 font-semibold'
                : 'bg-stone-100 border-transparent hover:bg-stone-200/60 text-slate-600'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5 text-stone-600" />
            <span>Blurred Image</span>
          </button>
          <button
            type="button"
            onClick={() => onFillTypeChange('color')}
            className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition-all cursor-pointer ${
              fillType === 'color'
                ? 'bg-stone-200/90 border-stone-400/80 text-stone-900 font-semibold'
                : 'bg-stone-100 border-transparent hover:bg-stone-200/60 text-slate-600'
            }`}
          >
            <Palette className="h-3.5 w-3.5 text-stone-600" />
            <span>Solid Color</span>
          </button>
        </div>

        {fillType === 'color' && (
          <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-stone-100/70 border border-stone-200/60">
            {COLOR_SWATCHES.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => onFillColorChange(hex)}
                style={{ backgroundColor: hex }}
                className={`w-6 h-6 rounded-full border cursor-pointer transition-transform ${
                  fillColor.toLowerCase() === hex.toLowerCase()
                    ? 'border-stone-800 scale-110 shadow-xs ring-2 ring-stone-300'
                    : 'border-stone-300 hover:scale-105'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 3. Photo Scale */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Photo Size
          </label>
          <span className="text-[11px] font-mono text-slate-600 font-medium">
            {Math.round(scale * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0.5}
          max={1.0}
          step={0.01}
          value={scale}
          onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
          className="w-full accent-stone-700 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
        />
      </div>

      {/* 4. Rounded Corners & Border */}
      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Corner Radius
            </label>
            <span className="text-[11px] font-mono text-slate-600 font-medium">{borderRadius}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={60}
            step={1}
            value={borderRadius}
            onChange={(e) => handleRadiusChange(parseInt(e.target.value, 10))}
            className="w-full accent-stone-700 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Border Width
            </label>
            <span className="text-[11px] font-mono text-slate-600 font-medium">{borderWidth}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={20}
            step={1}
            value={borderWidth}
            onChange={(e) => handleBorderChange(parseInt(e.target.value, 10))}
            className="w-full accent-stone-700 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
          />
        </div>
      </div>

      {/* 5. Action Buttons (Cancel / Apply) */}
      <PhotoInspectorActions onCancel={onCancel} onApply={onApply} />
    </div>
  );
};
