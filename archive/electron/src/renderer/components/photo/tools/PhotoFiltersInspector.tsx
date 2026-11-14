import React, { useRef } from 'react';
import { Palette, Sliders } from 'lucide-react';
import { FILTER_PRESETS, FilterPreset } from './photoFilterHelper';
import { PhotoInspectorActions } from './PhotoInspectorActions';

interface PhotoFiltersInspectorProps {
  imageSrc: string;
  selectedFilterId: string;
  filterIntensity: number;
  onSelectFilter: (filter: FilterPreset) => void;
  onChangeIntensity: (intensity: number) => void;
  onApply: () => void;
  onCancel: () => void;
}

export const PhotoFiltersInspector: React.FC<PhotoFiltersInspectorProps> = ({
  imageSrc,
  selectedFilterId,
  filterIntensity,
  onSelectFilter,
  onChangeIntensity,
  onApply,
  onCancel,
}) => {
  const activePreset =
    FILTER_PRESETS.find((p) => p.id === selectedFilterId) || FILTER_PRESETS[0];

  const rafFilterRef = useRef<number | null>(null);
  const handleIntensityChange = (value: number) => {
    if (rafFilterRef.current) cancelAnimationFrame(rafFilterRef.current);
    rafFilterRef.current = requestAnimationFrame(() => {
      onChangeIntensity(value);
    });
  };

  return (
    <div className="p-4 flex flex-col gap-4 text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5 text-stone-500" />
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Aesthetic Filters
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {FILTER_PRESETS.length} presets
        </span>
      </div>

      {/* Preset Grid */}
      <div className="grid grid-cols-3 gap-2 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
        {FILTER_PRESETS.map((preset) => {
          const isSelected = preset.id === selectedFilterId;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectFilter(preset)}
              className={`group flex flex-col items-center gap-1.5 p-1 rounded-xl text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/70 ring-1.5 ring-blue-300 shadow-xs'
                  : 'hover:bg-stone-100/80'
              }`}
            >
              {/* Thumbnail with CSS filter preview */}
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-stone-100 relative border border-stone-200/60 shadow-2xs">
                {imageSrc ? (
                  <>
                    <img
                      src={imageSrc}
                      alt={preset.name}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      style={{ filter: preset.cssFilter || 'none' }}
                      loading="lazy"
                    />
                    {preset.tintColor && preset.tintOpacity && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          backgroundColor: preset.tintColor,
                          opacity: preset.tintOpacity,
                          mixBlendMode: (preset.blendMode === 'color-dodge'
                            ? 'color-dodge'
                            : preset.blendMode === 'lighten'
                            ? 'lighten'
                            : preset.blendMode === 'screen'
                            ? 'screen'
                            : 'soft-light') as any,
                        }}
                      />
                    )}
                  </>
                ) : (
                  <div className="w-full h-full bg-stone-200" />
                )}
              </div>

              {/* Preset Label */}
              <span
                className={`text-[10.5px] font-medium leading-tight text-center truncate w-full ${
                  isSelected ? 'text-blue-900 font-semibold' : 'text-slate-600'
                }`}
              >
                {preset.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Preset Description & Intensity Slider */}
      {activePreset.id !== 'normal' && (
        <div className="pt-2 border-t border-stone-200/60 flex flex-col gap-2">
          <p className="text-[11px] text-slate-500 italic">
            {activePreset.description}
          </p>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Sliders className="h-3.5 w-3.5 text-stone-500" />
                <span className="font-medium">Filter Strength</span>
              </div>
              <span className="font-mono text-[10px] text-slate-500 font-semibold">
                {filterIntensity}%
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={filterIntensity}
              onChange={(e) => handleIntensityChange(parseInt(e.target.value, 10))}
              className="w-full accent-stone-700 cursor-pointer h-1.5 bg-stone-200/80 rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Action Buttons (Cancel / Apply) */}
      <PhotoInspectorActions onCancel={onCancel} onApply={onApply} />
    </div>
  );
};
