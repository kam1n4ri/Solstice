import React, { useRef } from 'react';
import {
  Sun,
  Contrast,
  Palette,
  Flame,
  SunMedium,
  Moon,
  CircleDot,
  RotateCcw,
  Check,
  Cpu,
  Loader2,
} from 'lucide-react';
import { PhotoAdjustments } from './photoFilterHelper';

interface PhotoAdjustInspectorProps {
  adjustments: PhotoAdjustments;
  onChangeAdjustment: <K extends keyof PhotoAdjustments>(key: K, value: PhotoAdjustments[K]) => void;
  onResetAll: () => void;
  onApply?: () => void;
  onCancel?: () => void;
  isProcessing?: boolean;
}

interface SliderConfig {
  key: keyof PhotoAdjustments;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: SliderConfig[] = [
  { key: 'brightness', label: 'Brightness', icon: Sun, min: -100, max: 100, step: 1 },
  { key: 'contrast', label: 'Contrast', icon: Contrast, min: -100, max: 100, step: 1 },
  { key: 'saturation', label: 'Saturation', icon: Palette, min: -100, max: 100, step: 1 },
  { key: 'warmth', label: 'Warmth', icon: Flame, min: -100, max: 100, step: 1 },
  { key: 'highlights', label: 'Highlights', icon: SunMedium, min: -100, max: 100, step: 1 },
  { key: 'shadows', label: 'Shadows', icon: Moon, min: -100, max: 100, step: 1 },
  { key: 'vignette', label: 'Vignette', icon: CircleDot, min: 0, max: 100, step: 1 },
];

export const PhotoAdjustInspector: React.FC<PhotoAdjustInspectorProps> = ({
  adjustments,
  onChangeAdjustment,
  onResetAll,
  onApply,
  onCancel,
  isProcessing = false,
}) => {
  const isAnyModified = Object.values(adjustments).some((v) => v !== 0);
  const rafSliderRef = useRef<number | null>(null);

  const handleSliderChange = (key: keyof PhotoAdjustments, value: number) => {
    if (rafSliderRef.current) cancelAnimationFrame(rafSliderRef.current);
    rafSliderRef.current = requestAnimationFrame(() => {
      onChangeAdjustment(key, value);
    });
  };

  return (
    <div className="p-4 flex flex-col gap-4 text-xs select-none">
      {/* Header bar with Reset All & SIMD Engine Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Tone & Color
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-stone-100/80 text-stone-500 border border-stone-200/60">
            <Cpu className="h-2.5 w-2.5 text-stone-400" />
            32-bit SIMD
          </span>
        </div>
        <button
          type="button"
          onClick={onResetAll}
          disabled={!isAnyModified || isProcessing}
          className={`flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
            isAnyModified
              ? 'text-stone-600 hover:text-stone-900'
              : 'text-stone-300 cursor-not-allowed'
          }`}
          title="Reset all adjustments to zero"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Sliders list */}
      <div className="flex flex-col gap-3.5">
        {SLIDERS.map((cfg) => {
          const val = adjustments[cfg.key];
          const Icon = cfg.icon;
          const isModified = val !== 0;

          return (
            <div key={cfg.key} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Icon className="h-3.5 w-3.5 text-stone-500" />
                  <span className="font-medium">{cfg.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onChangeAdjustment(cfg.key, 0)}
                  title="Click to reset"
                  className={`font-mono text-[10px] px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                    isModified
                      ? 'bg-blue-50/70 text-blue-700 font-semibold border border-blue-200/50 hover:bg-blue-100/70'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {val > 0 ? `+${val}` : val}
                </button>
              </div>

              <input
                type="range"
                min={cfg.min}
                max={cfg.max}
                step={cfg.step}
                value={val}
                disabled={isProcessing}
                onChange={(e) => handleSliderChange(cfg.key, parseFloat(e.target.value))}
                className="w-full accent-blue-600/80 cursor-pointer h-1.5 bg-stone-200/70 rounded-lg disabled:opacity-50"
              />
            </div>
          );
        })}
      </div>

      {/* Soft Action buttons adhering to pale, light-valued palette */}
      {onApply && (
        <div className="pt-3 border-t border-stone-200/60 flex items-center gap-2 mt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 h-8 px-3 rounded-md text-xs font-medium bg-white hover:bg-stone-50 text-stone-600 border border-stone-200/80 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={onApply}
            disabled={!isAnyModified || isProcessing}
            className={`flex-1 h-8 px-3 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              isAnyModified
                ? 'bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 border border-blue-200/80 shadow-2xs'
                : 'bg-stone-100/60 text-stone-400 border border-stone-200/60'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 text-blue-600" />
                <span>Apply to Image</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
