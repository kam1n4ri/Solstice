import React from 'react';
import { RotateCw } from 'lucide-react';
import { SNAP_ANGLES } from './PdfWatermarkTypes';

interface PdfWatermarkRotationSectionProps {
  rotation: number;
  onChangeRotation: (angle: number) => void;
}

const SNAP_THRESHOLD_DEGREES = 3;

export const PdfWatermarkRotationSection: React.FC<PdfWatermarkRotationSectionProps> = ({
  rotation,
  onChangeRotation,
}) => {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseInt(e.target.value, 10);
    // Soft snap to standard angles within threshold
    for (const snap of SNAP_ANGLES) {
      if (Math.abs(raw - snap) <= SNAP_THRESHOLD_DEGREES) {
        onChangeRotation(snap);
        return;
      }
    }
    onChangeRotation(raw);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
          <RotateCw className="w-3.5 h-3.5 text-stone-400" />
          <span>Rotation Angle</span>
        </label>
        <span className="text-[11px] font-mono font-medium text-stone-600 bg-stone-100/80 px-2 py-0.5 rounded-md border border-stone-200/60">
          {rotation > 0 ? `+${rotation}°` : `${rotation}°`}
        </span>
      </div>

      {/* Continuous Rotation Slider */}
      <input
        type="range"
        min={-180}
        max={180}
        step={1}
        value={rotation}
        onChange={handleSliderChange}
        className="w-full accent-rose-500 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none"
      />

      {/* Soft Snap Quick Pills */}
      <div className="grid grid-cols-4 gap-1 pt-1">
        {[
          { label: '-45°', value: -45 },
          { label: '0°', value: 0 },
          { label: '45°', value: 45 },
          { label: '90°', value: 90 },
        ].map((item) => {
          const isSelected = rotation === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChangeRotation(item.value)}
              className={`py-1 text-[11px] font-medium rounded-lg border transition-all cursor-pointer text-center ${
                isSelected
                  ? 'bg-rose-50 border-rose-200/80 text-rose-700 font-semibold shadow-2xs'
                  : 'bg-stone-50/60 hover:bg-stone-100/80 border-stone-200/60 text-stone-600'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
