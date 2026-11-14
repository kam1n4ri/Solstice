import React, { useRef } from 'react';
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Rotate3D,
} from 'lucide-react';
import { PhotoInspectorActions } from './PhotoInspectorActions';

export interface AspectPreset {
  id: string;
  label: string;
  ratio: number | null; // null = freeform
}

export const ASPECT_PRESETS: AspectPreset[] = [
  { id: 'free', label: 'Free', ratio: null },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '4:5', label: '4:5', ratio: 4 / 5 },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
  { id: '3:2', label: '3:2', ratio: 3 / 2 },
  { id: '4:3', label: '4:3', ratio: 4 / 3 },
];

interface PhotoCropInspectorProps {
  selectedPreset: string;
  onSelectPreset: (preset: AspectPreset) => void;
  rotation: number;
  onRotateCw: () => void;
  onRotateCcw: () => void;
  flipH: boolean;
  onToggleFlipH: () => void;
  flipV: boolean;
  onToggleFlipV: () => void;
  straightenAngle: number;
  onStraightenChange: (angle: number) => void;
  onApply: () => void;
  onCancel: () => void;
}

export const PhotoCropInspector: React.FC<PhotoCropInspectorProps> = ({
  selectedPreset,
  onSelectPreset,
  onRotateCw,
  onRotateCcw,
  flipH,
  onToggleFlipH,
  flipV,
  onToggleFlipV,
  straightenAngle,
  onStraightenChange,
  onApply,
  onCancel,
}) => {
  const rafStraightenRef = useRef<number | null>(null);
  const handleStraightenChange = (val: number) => {
    if (rafStraightenRef.current) cancelAnimationFrame(rafStraightenRef.current);
    rafStraightenRef.current = requestAnimationFrame(() => {
      onStraightenChange(val);
    });
  };
  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-4 space-y-5 text-slate-800 select-none">
      {/* 1. Aspect Ratio Presets */}
      <div>
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
          Aspect Ratio
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {ASPECT_PRESETS.map((p) => {
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

      {/* 2. Rotate & Flip Actions */}
      <div>
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
          Transform & Orientation
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={onRotateCcw}
            title="Rotate Left 90°"
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-slate-700 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="text-[9px] font-medium">-90°</span>
          </button>
          <button
            type="button"
            onClick={onRotateCw}
            title="Rotate Right 90°"
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-slate-700 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCw className="h-4 w-4" />
            <span className="text-[9px] font-medium">+90°</span>
          </button>
          <button
            type="button"
            onClick={onToggleFlipH}
            title="Flip Horizontal"
            className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              flipH
                ? 'bg-stone-200 border-stone-300 text-slate-900 font-semibold'
                : 'bg-stone-100 border-transparent hover:bg-stone-200/80 text-slate-700'
            }`}
          >
            <FlipHorizontal className="h-4 w-4" />
            <span className="text-[9px] font-medium">Flip H</span>
          </button>
          <button
            type="button"
            onClick={onToggleFlipV}
            title="Flip Vertical"
            className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              flipV
                ? 'bg-stone-200 border-stone-300 text-slate-900 font-semibold'
                : 'bg-stone-100 border-transparent hover:bg-stone-200/80 text-slate-700'
            }`}
          >
            <FlipVertical className="h-4 w-4" />
            <span className="text-[9px] font-medium">Flip V</span>
          </button>
        </div>
      </div>

      {/* 3. Straighten Angle Slider */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Rotate3D className="h-3.5 w-3.5 text-slate-500" />
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Straighten
            </label>
          </div>
          <button
            type="button"
            onClick={() => onStraightenChange(0)}
            title="Reset straighten"
            className="text-[11px] font-mono font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            {straightenAngle > 0 ? `+${straightenAngle}°` : `${straightenAngle}°`}
          </button>
        </div>
        <input
          type="range"
          min={-45}
          max={45}
          step={0.5}
          value={straightenAngle}
          onChange={(e) => handleStraightenChange(parseFloat(e.target.value))}
          className="w-full accent-stone-700 cursor-pointer h-1.5 bg-stone-200 rounded-lg"
        />
        <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
          <span>-45°</span>
          <span>0°</span>
          <span>+45°</span>
        </div>
      </div>

      {/* 4. Action Buttons (Cancel / Apply) */}
      <PhotoInspectorActions onCancel={onCancel} onApply={onApply} />
    </div>
  );
};
