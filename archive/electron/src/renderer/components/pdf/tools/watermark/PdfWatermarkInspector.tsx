import React from 'react';
import { Type, Image as ImageIcon, Crosshair } from 'lucide-react';
import { WatermarkOptions, WATERMARK_COLORS } from './PdfWatermarkTypes';
import { PdfWatermarkContentOptions } from './PdfWatermarkContentOptions';
import { PdfWatermarkRotationSection } from './PdfWatermarkRotationSection';

interface PdfWatermarkInspectorProps {
  options: WatermarkOptions;
  onChangeOptions: (updater: (prev: WatermarkOptions) => WatermarkOptions) => void;
  totalPages: number;
}

export const PdfWatermarkInspector: React.FC<PdfWatermarkInspectorProps> = ({
  options,
  onChangeOptions,
  totalPages,
}) => {
  return (
    <aside className="w-80 border-l border-stone-200/80 bg-white flex flex-col h-full overflow-y-auto select-none p-5 space-y-5 custom-scrollbar font-sans">
      {/* 1. Header Segmented Type Switcher */}
      <div className="flex p-1 rounded-2xl bg-stone-100/90 border border-stone-200/80">
        <button
          type="button"
          onClick={() => onChangeOptions((prev) => ({ ...prev, type: 'text' }))}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            options.type === 'text'
              ? 'bg-white text-stone-900 shadow-xs border border-stone-200/60 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Text</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeOptions((prev) => ({ ...prev, type: 'image' }))}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            options.type === 'image'
              ? 'bg-white text-stone-900 shadow-xs border border-stone-200/60 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Image</span>
        </button>
      </div>

      {/* 2. Content: Text or Image */}
      <PdfWatermarkContentOptions options={options} onChangeOptions={onChangeOptions} />

      <div className="h-px bg-stone-100" />

      {/* 3. Appearance Controls */}
      <div className="space-y-4">
        {/* Size Slider */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-stone-700">
              {options.type === 'text' ? 'Font Size' : 'Image Scale'}
            </label>
            <span className="text-[11px] font-mono text-stone-500">
              {options.type === 'text'
                ? `${options.fontSize}pt`
                : `${Math.round(options.imageScale * 100)}%`}
            </span>
          </div>
          {options.type === 'text' ? (
            <input
              type="range"
              min={20}
              max={96}
              step={2}
              value={options.fontSize}
              onChange={(e) =>
                onChangeOptions((prev) => ({ ...prev, fontSize: parseInt(e.target.value, 10) }))
              }
              className="w-full accent-rose-500 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none"
            />
          ) : (
            <input
              type="range"
              min={0.1}
              max={0.8}
              step={0.05}
              value={options.imageScale}
              onChange={(e) =>
                onChangeOptions((prev) => ({ ...prev, imageScale: parseFloat(e.target.value) }))
              }
              className="w-full accent-rose-500 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none"
            />
          )}
        </div>

        {/* Opacity Slider */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-stone-700">Transparency</label>
            <span className="text-[11px] font-mono text-stone-500">
              {Math.round(options.opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.06}
            max={0.85}
            step={0.02}
            value={options.opacity}
            onChange={(e) =>
              onChangeOptions((prev) => ({ ...prev, opacity: parseFloat(e.target.value) }))
            }
            className="w-full accent-rose-500 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none"
          />
        </div>

        {/* Color Tint (Text only) */}
        {options.type === 'text' && (
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-2">Color Tint</label>
            <div className="flex items-center gap-2 flex-wrap">
              {WATERMARK_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => onChangeOptions((prev) => ({ ...prev, colorHex: c.hex }))}
                  className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                    options.colorHex === c.hex
                      ? 'scale-110 ring-2 ring-rose-200/90 shadow-2xs'
                      : 'hover:scale-105 border-stone-200/80'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-stone-100" />

      {/* 4. Rotation with Soft Snaps */}
      <PdfWatermarkRotationSection
        rotation={options.rotation}
        onChangeRotation={(angle) => onChangeOptions((prev) => ({ ...prev, rotation: angle }))}
      />

      <div className="h-px bg-stone-100" />

      {/* 5. Position & Center Reset */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-stone-400" />
            <span>Position</span>
          </label>
          <span className="text-[10px] font-mono text-stone-400">
            {options.xPercent}% • {options.yPercent}%
          </span>
        </div>
        <button
          type="button"
          onClick={() => onChangeOptions((prev) => ({ ...prev, xPercent: 50, yPercent: 50 }))}
          className="w-full py-1.5 px-3 rounded-xl border border-stone-200/80 bg-stone-50/60 hover:bg-stone-100 text-xs font-medium text-stone-600 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
        >
          <Crosshair className="w-3 h-3 text-stone-400" />
          <span>Reset to Center</span>
        </button>
      </div>

      <div className="h-px bg-stone-100" />

      {/* 6. Page Range Scope */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-stone-700 block">Apply to Pages</label>
        <select
          value={options.pagesScope}
          onChange={(e) =>
            onChangeOptions((prev) => ({
              ...prev,
              pagesScope: e.target.value as any,
            }))
          }
          className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200/90 bg-stone-50/50 text-xs text-stone-700 focus:outline-none focus:border-rose-300 font-medium cursor-pointer"
        >
          <option value="all">All Pages ({totalPages})</option>
          <option value="odd">Odd Pages Only</option>
          <option value="even">Even Pages Only</option>
          <option value="range">Custom Range...</option>
        </select>

        {options.pagesScope === 'range' && (
          <input
            type="text"
            value={options.customPages}
            onChange={(e) =>
              onChangeOptions((prev) => ({ ...prev, customPages: e.target.value }))
            }
            placeholder="e.g. 1-3, 5"
            className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200/90 bg-white text-xs font-mono text-stone-800 focus:outline-none focus:border-rose-300"
          />
        )}
      </div>
    </aside>
  );
};
