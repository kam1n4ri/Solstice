import React, { useRef } from 'react';
import {
  Sparkles,
  Wand2,
  Paintbrush,
  Eraser,
  RotateCcw,
  FlipHorizontal,
  Check,
  Cpu,
  Loader2,
} from 'lucide-react';

export type CutoutSubMode = 'auto' | 'brush' | 'wand';
export type BrushStrokeAction = 'restore' | 'erase';
export type MaskPreviewMode = 'overlay' | 'transparent' | 'white' | 'black';

export interface PhotoCutoutInspectorProps {
  subMode: CutoutSubMode;
  onSelectSubMode: (mode: CutoutSubMode) => void;
  strokeAction: BrushStrokeAction;
  onSelectStrokeAction: (action: BrushStrokeAction) => void;
  brushSize: number;
  onChangeBrushSize: (size: number) => void;
  tolerance: number;
  onChangeTolerance: (tol: number) => void;
  choke: number;
  onChangeChoke: (val: number) => void;
  feather: number;
  onChangeFeather: (val: number) => void;
  previewMode: MaskPreviewMode;
  onSelectPreviewMode: (mode: MaskPreviewMode) => void;
  onAutoRemove: () => void;
  onInvertMask: () => void;
  onResetMask: () => void;
  onApply: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
  statusMessage?: string;
  progressPercent?: number;
}

const PREVIEW_MODES: { id: MaskPreviewMode; label: string; icon: string }[] = [
  { id: 'overlay', label: 'Red Mask', icon: '🔴' },
  { id: 'transparent', label: 'Checker', icon: '🏁' },
  { id: 'white', label: 'White', icon: '⚪' },
  { id: 'black', label: 'Black', icon: '⚫' },
];

export const PhotoCutoutInspector: React.FC<PhotoCutoutInspectorProps> = ({
  subMode,
  onSelectSubMode,
  strokeAction,
  onSelectStrokeAction,
  brushSize,
  onChangeBrushSize,
  tolerance,
  onChangeTolerance,
  choke,
  onChangeChoke,
  feather,
  onChangeFeather,
  previewMode,
  onSelectPreviewMode,
  onAutoRemove,
  onInvertMask,
  onResetMask,
  onApply,
  onCancel,
  isProcessing = false,
  statusMessage = '',
  progressPercent = 0,
}) => {
  const rafBrushRef = useRef<number | null>(null);

  const handleBrushChange = (val: number) => {
    if (rafBrushRef.current) cancelAnimationFrame(rafBrushRef.current);
    rafBrushRef.current = requestAnimationFrame(() => onChangeBrushSize(val));
  };

  const isWandActive = subMode === 'wand';

  return (
    <div className="p-4 flex flex-col gap-3.5 text-xs select-none">
      {/* Header bar with Engine Badge & Reset */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Cutout Studio
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-stone-100/80 text-stone-500 border border-stone-200/60">
            <Cpu className="h-2.5 w-2.5 text-stone-400" />
            SIMD Edge
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onInvertMask}
            disabled={isProcessing}
            title="Invert Selection"
            className="p-1 rounded text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <FlipHorizontal className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onResetMask}
            disabled={isProcessing}
            title="Reset Mask"
            className="p-1 rounded text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 1. Primary Action: Auto Cutout & Wand */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onAutoRemove}
          disabled={isProcessing}
          className={`w-full py-2 px-3 rounded-lg border font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isProcessing
              ? 'bg-blue-50/50 text-blue-400 border-blue-200/60 cursor-not-allowed'
              : 'bg-blue-50/70 hover:bg-blue-100/70 text-blue-700/90 border-blue-200/70 shadow-2xs'
          }`}
        >
          {isProcessing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          )}
          <span>{isProcessing ? (statusMessage || 'Analyzing Image...') : 'Auto Cutout Subject (AI)'}</span>
        </button>

        {/* Live Progress Bar when running */}
        {isProcessing && (
          <div className="flex flex-col gap-1 p-2 bg-blue-50/40 rounded-lg border border-blue-100/70">
            <div className="flex items-center justify-between text-[10px] text-blue-700/80">
              <span className="truncate">{statusMessage || 'Processing...'}</span>
              {progressPercent > 0 && <span className="font-mono">{progressPercent}%</span>}
            </div>
            <div className="w-full bg-blue-100/60 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-200"
                style={{ width: `${Math.max(8, progressPercent || 15)}%` }}
              />
            </div>
          </div>
        )}

        {/* Magic Wand Toggle for Flat Backdrops */}
        <button
          type="button"
          onClick={() => onSelectSubMode(isWandActive ? 'brush' : 'wand')}
          className={`w-full py-1.5 px-2.5 rounded-lg border text-[11px] font-medium flex items-center justify-between transition-colors cursor-pointer ${
            isWandActive
              ? 'bg-amber-50/80 text-amber-800 border-amber-200/80'
              : 'bg-stone-50/70 text-stone-600 border-stone-200/70 hover:bg-stone-100/80'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Wand2 className="h-3 w-3 text-amber-600" />
            <span>Magic Wand (Click Backdrop)</span>
          </div>
          <span className="text-[10px] opacity-70">{isWandActive ? 'Active' : 'Off'}</span>
        </button>

        {isWandActive && (
          <div className="px-2 py-1.5 bg-amber-50/40 rounded-lg border border-amber-200/60 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] text-amber-800">
              <span>Color Tolerance</span>
              <span className="font-mono">{tolerance}</span>
            </div>
            <input
              type="range"
              min={10}
              max={80}
              value={tolerance}
              onChange={(e) => onChangeTolerance(parseInt(e.target.value, 10))}
              className="w-full accent-amber-600 cursor-pointer h-1.5 bg-amber-200/60 rounded-lg"
            />
          </div>
        )}
      </div>

      {/* 2. Precision Touch-Up Brushes */}
      <div className="pt-2.5 border-t border-stone-200/60 flex flex-col gap-2">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Touch-Up Brushes
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (isWandActive) onSelectSubMode('brush');
              onSelectStrokeAction('restore');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              !isWandActive && strokeAction === 'restore'
                ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/80 shadow-2xs font-semibold'
                : 'bg-white text-stone-600 border-stone-200/70 hover:bg-stone-50'
            }`}
          >
            <Paintbrush className="h-3 w-3 text-emerald-600" />
            <span>Keep / Restore</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (isWandActive) onSelectSubMode('brush');
              onSelectStrokeAction('erase');
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              !isWandActive && strokeAction === 'erase'
                ? 'bg-rose-50/80 text-rose-700 border-rose-200/80 shadow-2xs font-semibold'
                : 'bg-white text-stone-600 border-stone-200/70 hover:bg-stone-50'
            }`}
          >
            <Eraser className="h-3 w-3 text-rose-600" />
            <span>Erase / Remove</span>
          </button>
        </div>

        {/* Brush Size Slider */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>Brush Size</span>
            <span className="font-mono text-slate-500">{brushSize}px</span>
          </div>
          <input
            type="range"
            min={8}
            max={120}
            value={brushSize}
            onChange={(e) => handleBrushChange(parseInt(e.target.value, 10))}
            className="w-full accent-stone-700 cursor-pointer h-1.5 bg-stone-200/70 rounded-lg"
          />
        </div>
      </div>

      {/* 3. Edge Cleanliness (Rust Multi-Threaded Engine) */}
      <div className="pt-2.5 border-t border-stone-200/60 flex flex-col gap-2">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Edge Refinement (Rust Engine)
        </span>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>Edge Choke (Remove Fringe)</span>
            <span className="font-mono text-slate-500">{choke > 0 ? `+${choke}px` : `${choke}px`}</span>
          </div>
          <input
            type="range"
            min={-5}
            max={5}
            step={1}
            value={choke}
            onChange={(e) => onChangeChoke(parseInt(e.target.value, 10))}
            className="w-full accent-stone-700 cursor-pointer h-1.5 bg-stone-200/70 rounded-lg"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span>Edge Softness (Feather)</span>
            <span className="font-mono text-slate-500">{feather}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={8}
            step={1}
            value={feather}
            onChange={(e) => onChangeFeather(parseInt(e.target.value, 10))}
            className="w-full accent-stone-700 cursor-pointer h-1.5 bg-stone-200/70 rounded-lg"
          />
        </div>
      </div>

      {/* 4. Mask Preview Modes */}
      <div className="pt-2.5 border-t border-stone-200/60 flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Preview Mode
        </span>
        <div className="grid grid-cols-4 gap-1">
          {PREVIEW_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => onSelectPreviewMode(mode.id)}
              className={`py-1 px-1 rounded-lg border text-[10px] font-medium flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                previewMode === mode.id
                  ? 'bg-blue-50/70 text-blue-700 border-blue-200/80 shadow-2xs font-semibold'
                  : 'bg-white text-stone-500 border-stone-200/60 hover:bg-stone-50'
              }`}
            >
              <span className="text-xs">{mode.icon}</span>
              <span className="truncate">{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Action Buttons (Cancel / Apply) */}
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
              <span>Applying...</span>
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5 text-blue-600" />
              <span>Apply Cutout</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
