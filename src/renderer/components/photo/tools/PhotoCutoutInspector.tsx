import React, { useRef } from 'react';
import {
  Wand2,
  Paintbrush,
  Scissors,
  RotateCcw,
  FlipHorizontal,
  Eye,
  Eraser,
  Sparkles,
  LucideIcon,
} from 'lucide-react';
import { PhotoInspectorActions } from './PhotoInspectorActions';

export type CutoutSubMode = 'auto' | 'brush' | 'wand';
export type BrushStrokeAction = 'erase' | 'restore';
export type MaskPreviewMode = 'overlay' | 'transparent' | 'white';

interface PhotoCutoutInspectorProps {
  subMode: CutoutSubMode;
  onSelectSubMode: (mode: CutoutSubMode) => void;
  strokeAction: BrushStrokeAction;
  onSelectStrokeAction: (action: BrushStrokeAction) => void;
  brushSize: number;
  onChangeBrushSize: (size: number) => void;
  tolerance: number;
  onChangeTolerance: (tol: number) => void;
  previewMode: MaskPreviewMode;
  onSelectPreviewMode: (mode: MaskPreviewMode) => void;
  onAutoRemove: () => void;
  onClassicalAutoRemove?: () => void;
  onInvertMask: () => void;
  onResetMask: () => void;
  onApply: () => void;
  onCancel: () => void;
  onSwitchToHealing?: () => void;
  isProcessing?: boolean;
  statusMessage?: string;
  progressPercent?: number;
}

const TABS: { id: CutoutSubMode; label: string; icon: LucideIcon }[] = [
  { id: 'auto', label: 'Auto (AI)', icon: Scissors },
  { id: 'brush', label: 'Brush', icon: Paintbrush },
  { id: 'wand', label: 'Wand', icon: Wand2 },
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
  previewMode,
  onSelectPreviewMode,
  onAutoRemove,
  onClassicalAutoRemove,
  onInvertMask,
  onResetMask,
  onApply,
  onCancel,
  onSwitchToHealing,
  isProcessing = false,
  statusMessage = '',
  progressPercent = 0,
}) => {
  const rafBrushRef = useRef<number | null>(null);
  const rafTolRef = useRef<number | null>(null);

  const handleBrushChange = (val: number) => {
    if (rafBrushRef.current) cancelAnimationFrame(rafBrushRef.current);
    rafBrushRef.current = requestAnimationFrame(() => onChangeBrushSize(val));
  };

  const handleTolChange = (val: number) => {
    if (rafTolRef.current) cancelAnimationFrame(rafTolRef.current);
    rafTolRef.current = requestAnimationFrame(() => onChangeTolerance(val));
  };

  return (
    <div className="p-4 flex flex-col gap-3.5 text-xs select-none">
      {/* 1. Mode Selector Tabs */}
      <div className="flex bg-stone-100/80 p-0.5 rounded-xl border border-stone-200/60">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelectSubMode(id)}
            className={`flex-1 py-1.5 px-2 rounded-lg font-medium text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              subMode === id
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="h-3 w-3" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* 2. Auto Mode Content */}
      {subMode === 'auto' && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onAutoRemove}
            disabled={isProcessing}
            className={`w-full py-2.5 px-3 rounded-lg border font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isProcessing
                ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                : 'bg-stone-100 hover:bg-stone-200/80 text-stone-800 border-stone-300 shadow-2xs'
            }`}
          >
            <Scissors className="h-3.5 w-3.5 text-stone-700" />
            <span>{isProcessing ? (statusMessage || 'Processing AI...') : 'Detect & Extract Subject (AI)'}</span>
          </button>

          {isProcessing && (
            <div className="flex flex-col gap-1.5 p-2.5 bg-stone-50 rounded-lg border border-stone-200/60">
              <div className="flex items-center justify-between text-[11px] text-stone-600">
                <span className="truncate">{statusMessage || 'Analyzing image...'}</span>
                {progressPercent > 0 && (
                  <span className="font-mono text-[10px] text-stone-500 shrink-0 ml-1">
                    {progressPercent}%
                  </span>
                )}
              </div>
              <div className="w-full bg-stone-200/70 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-stone-600 h-full rounded-full transition-all duration-200 ease-out"
                  style={{ width: `${Math.max(5, progressPercent || 15)}%` }}
                />
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-stone-200/60 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-600 font-medium">Edge Detection Tolerance</span>
              <span className="font-mono text-slate-500">{tolerance}</span>
            </div>
            <input
              type="range"
              min={10}
              max={80}
              step={1}
              value={tolerance}
              onChange={(e) => handleTolChange(parseInt(e.target.value, 10))}
              className="w-full accent-stone-700 cursor-pointer h-1.5 bg-stone-200/80 rounded-lg"
            />
            {onClassicalAutoRemove && (
              <button
                type="button"
                onClick={onClassicalAutoRemove}
                disabled={isProcessing}
                className="w-full py-1.5 px-2 rounded-md bg-stone-50 hover:bg-stone-100 text-stone-600 text-[11px] border border-stone-200/70 transition-colors cursor-pointer"
              >
                Fast Edge Removal (Classical)
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Brush / Wand Mode Controls */}
      {subMode !== 'auto' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectStrokeAction('restore')}
              className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                strokeAction === 'restore'
                  ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200 shadow-2xs'
                  : 'bg-stone-50 text-slate-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Paintbrush className="h-3 w-3" />
              <span>Restore Area</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectStrokeAction('erase')}
              className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                strokeAction === 'erase'
                  ? 'bg-rose-50/80 text-rose-700 border-rose-200 shadow-2xs'
                  : 'bg-stone-50 text-slate-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Eraser className="h-3 w-3" />
              <span>Erase Area</span>
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-600 font-medium">
                {subMode === 'brush' ? 'Brush Size' : 'Wand Tolerance'}
              </span>
              <span className="font-mono text-slate-500">
                {subMode === 'brush' ? `${brushSize}px` : tolerance}
              </span>
            </div>
            <input
              type="range"
              min={subMode === 'brush' ? 5 : 5}
              max={subMode === 'brush' ? 120 : 75}
              step={1}
              value={subMode === 'brush' ? brushSize : tolerance}
              onChange={(e) =>
                subMode === 'brush'
                  ? handleBrushChange(parseInt(e.target.value, 10))
                  : handleTolChange(parseInt(e.target.value, 10))
              }
              className="w-full accent-stone-700 cursor-pointer h-1.5 bg-stone-200/80 rounded-lg"
            />
          </div>
        </div>
      )}

      {/* 4. Mask View Mode & Invert Utilities */}
      <div className="pt-2 border-t border-stone-200/60 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3 text-stone-400" />
            <span className="font-medium">Mask Preview</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onInvertMask}
              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-stone-100 cursor-pointer"
              title="Invert Selection"
            >
              <FlipHorizontal className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={onResetMask}
              className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-stone-100 cursor-pointer"
              title="Reset Mask"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="flex gap-1.5">
          {(['transparent', 'overlay', 'white'] as MaskPreviewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onSelectPreviewMode(mode)}
              className={`flex-1 py-1 px-1.5 rounded-lg border text-[10px] font-medium capitalize transition-all cursor-pointer ${
                previewMode === mode
                  ? 'bg-stone-200/70 text-slate-900 border-stone-300'
                  : 'bg-stone-50/60 text-slate-500 border-stone-200/70 hover:bg-stone-100'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Healing / Spot Erase Quick Switch */}
      {onSwitchToHealing && (
        <button
          type="button"
          onClick={onSwitchToHealing}
          className="w-full py-1.5 px-2 rounded-lg bg-blue-50/50 hover:bg-blue-50 border border-blue-200/60 text-blue-700/90 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sparkles className="h-3 w-3 text-blue-600/80" />
          <span>Remove Pimple / Object instead? Open Healing</span>
        </button>
      )}

      {/* 6. Action Buttons (Cancel / Apply) */}
      <PhotoInspectorActions onCancel={onCancel} onApply={onApply} isProcessing={isProcessing} />
    </div>
  );
};
