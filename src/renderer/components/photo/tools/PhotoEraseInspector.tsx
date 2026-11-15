import React, { useRef } from 'react';
import {
  Eraser,
  Paintbrush,
  Wand2,
  RotateCcw,
  Sparkles,
  Cpu,
  Loader2,
} from 'lucide-react';

export type EraseToolMode = 'inpaint' | 'erase' | 'restore';

export interface PhotoEraseInspectorProps {
  eraseMode: EraseToolMode;
  onSelectEraseMode: (mode: EraseToolMode) => void;
  brushSize: number;
  onChangeBrushSize: (size: number) => void;
  inpaintRadius: number;
  onChangeInpaintRadius: (radius: number) => void;
  onReset: () => void;
  onApply: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const PhotoEraseInspector: React.FC<PhotoEraseInspectorProps> = ({
  eraseMode,
  onSelectEraseMode,
  brushSize,
  onChangeBrushSize,
  inpaintRadius,
  onChangeInpaintRadius,
  onReset,
  onApply,
  onCancel,
  isProcessing = false,
}) => {
  const rafBrushRef = useRef<number | null>(null);
  const rafInpaintRef = useRef<number | null>(null);

  const handleBrushChange = (val: number) => {
    if (rafBrushRef.current) cancelAnimationFrame(rafBrushRef.current);
    rafBrushRef.current = requestAnimationFrame(() => onChangeBrushSize(val));
  };

  const handleInpaintChange = (val: number) => {
    if (rafInpaintRef.current) cancelAnimationFrame(rafInpaintRef.current);
    rafInpaintRef.current = requestAnimationFrame(() => onChangeInpaintRadius(val));
  };

  return (
    <div className="p-4 flex flex-col gap-4 text-xs select-none">
      {/* Top Header with Engine Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Healing & Erase
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-stone-100/80 text-stone-500 border border-stone-200/60">
            <Cpu className="h-2.5 w-2.5 text-stone-400" />
            SIMD Inpaint
          </span>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={isProcessing}
          className="flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-50"
          title="Reset painted strokes"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* 3-Way Mode Toggle */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-slate-600">Tool Mode</span>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => onSelectEraseMode('inpaint')}
            disabled={isProcessing}
            title="Content-aware texture inpainting for removing unwanted objects and blemishes"
            className={`py-2 px-1 rounded-xl border text-[11px] font-medium flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              eraseMode === 'inpaint'
                ? 'bg-blue-50/80 text-blue-700 border-blue-200/90 shadow-2xs font-semibold'
                : 'bg-stone-50/60 text-slate-600 border-stone-200/70 hover:bg-stone-100/70'
            }`}
          >
            <Wand2 className="h-3.5 w-3.5 text-blue-600" />
            <span>Object Heal</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectEraseMode('erase')}
            disabled={isProcessing}
            title="Erase painted pixels to transparent background"
            className={`py-2 px-1 rounded-xl border text-[11px] font-medium flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              eraseMode === 'erase'
                ? 'bg-rose-50/80 text-rose-700 border-rose-200/90 shadow-2xs font-semibold'
                : 'bg-stone-50/60 text-slate-600 border-stone-200/70 hover:bg-stone-100/70'
            }`}
          >
            <Eraser className="h-3.5 w-3.5 text-rose-600" />
            <span>Alpha Erase</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectEraseMode('restore')}
            disabled={isProcessing}
            title="Restore previously masked or erased pixels"
            className={`py-2 px-1 rounded-xl border text-[11px] font-medium flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              eraseMode === 'restore'
                ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/90 shadow-2xs font-semibold'
                : 'bg-stone-50/60 text-slate-600 border-stone-200/70 hover:bg-stone-100/70'
            }`}
          >
            <Paintbrush className="h-3.5 w-3.5 text-emerald-600" />
            <span>Restore</span>
          </button>
        </div>
      </div>

      {/* Mode Helper Callout */}
      <div className="p-2.5 rounded-xl bg-stone-50/80 border border-stone-200/70 text-[11px] leading-relaxed text-slate-600">
        {eraseMode === 'inpaint' && (
          <p>
            Paint over blemishes, text, or objects. The native 16-core Rust engine will seamlessly blend surrounding texture and gradients into the area.
          </p>
        )}
        {eraseMode === 'erase' && (
          <p>Paint over areas to erase pixels to transparent alpha.</p>
        )}
        {eraseMode === 'restore' && (
          <p>Paint over erased areas to restore original pixels.</p>
        )}
      </div>

      {/* Brush Size */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-600 font-medium">Brush Diameter</span>
          <span className="font-mono text-slate-500">{brushSize}px</span>
        </div>
        <input
          type="range"
          min={4}
          max={150}
          step={1}
          value={brushSize}
          disabled={isProcessing}
          onChange={(e) => handleBrushChange(parseInt(e.target.value, 10))}
          className="w-full accent-stone-700 cursor-pointer h-1.5 bg-stone-200/80 rounded-lg"
        />
      </div>

      {/* Inpaint Blend Radius */}
      {eraseMode === 'inpaint' && (
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-600 font-medium">Texture Blend Radius</span>
            <span className="font-mono text-slate-500">{inpaintRadius}px</span>
          </div>
          <input
            type="range"
            min={3}
            max={20}
            step={1}
            value={inpaintRadius}
            disabled={isProcessing}
            onChange={(e) => handleInpaintChange(parseInt(e.target.value, 10))}
            className="w-full accent-blue-600 cursor-pointer h-1.5 bg-blue-100/80 rounded-lg"
          />
        </div>
      )}

      {/* Soft Action Buttons adhering to pale pastel palette */}
      <div className="pt-3 border-t border-stone-200/60 flex items-center gap-2 mt-auto">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 h-8 px-3 rounded-md text-xs font-medium bg-white hover:bg-stone-50 text-stone-600 border border-stone-200/80 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={isProcessing}
          className="flex-1 h-8 px-3 rounded-md text-xs font-medium bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 border border-blue-200/80 shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
              <span>Healing...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>{eraseMode === 'inpaint' ? 'Heal Object' : 'Apply Erase'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
