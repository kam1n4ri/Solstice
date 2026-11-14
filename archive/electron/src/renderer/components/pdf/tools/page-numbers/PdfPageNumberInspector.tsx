import React from 'react';
import {
  PageNumberOptions,
  FORMAT_PRESETS,
  POSITION_GRID,
  PAGE_NUMBER_COLORS,
  FONT_OPTIONS,
  PageNumberPosition,
} from './PdfPageNumberTypes';

interface PdfPageNumberInspectorProps {
  options: PageNumberOptions;
  onChange: (options: PageNumberOptions) => void;
  totalPages: number;
}

export const PdfPageNumberInspector: React.FC<PdfPageNumberInspectorProps> = ({
  options,
  onChange,
  totalPages,
}) => {
  const update = (patch: Partial<PageNumberOptions>) => {
    onChange({ ...options, ...patch });
  };

  return (
    <div className="w-80 border-l border-stone-200/80 bg-white flex flex-col h-full overflow-y-auto p-5 space-y-5 select-none">
      {/* 1. Placement Grid */}
      <div>
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
          Page Position
        </label>
        <div className="p-2.5 rounded-2xl bg-stone-50/70 border border-stone-200/70 space-y-2">
          <div className="text-[10px] text-stone-400 font-medium text-center">Header (Top)</div>
          <div className="grid grid-cols-3 gap-1.5">
            {POSITION_GRID.slice(0, 3).map((pos) => {
              const active = options.position === pos.id;
              return (
                <button
                  key={pos.id}
                  onClick={() => update({ position: pos.id as PageNumberPosition })}
                  className={`py-2 px-1 text-center rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                    active
                      ? 'bg-rose-50/90 border-rose-300 text-rose-800 shadow-2xs'
                      : 'bg-white border-stone-200/80 text-stone-600 hover:bg-stone-50'
                  }`}
                  title={pos.align}
                >
                  {pos.label.split(' ')[1]}
                </button>
              );
            })}
          </div>

          <div className="text-[10px] text-stone-400 font-medium text-center pt-1">Footer (Bottom)</div>
          <div className="grid grid-cols-3 gap-1.5">
            {POSITION_GRID.slice(3, 6).map((pos) => {
              const active = options.position === pos.id;
              return (
                <button
                  key={pos.id}
                  onClick={() => update({ position: pos.id as PageNumberPosition })}
                  className={`py-2 px-1 text-center rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                    active
                      ? 'bg-rose-50/90 border-rose-300 text-rose-800 shadow-2xs'
                      : 'bg-white border-stone-200/80 text-stone-600 hover:bg-stone-50'
                  }`}
                  title={pos.align}
                >
                  {pos.label.split(' ')[1]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Numbering Format */}
      <div>
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
          Format
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {FORMAT_PRESETS.map((item) => {
            const active = options.format === item.format;
            return (
              <button
                key={item.format}
                onClick={() => update({ format: item.format })}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  active
                    ? 'bg-rose-50/90 border-rose-300 text-rose-800 shadow-2xs'
                    : 'bg-stone-50/70 border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          value={options.format}
          onChange={(e) => update({ format: e.target.value })}
          placeholder="e.g. Page {n} of {total}"
          className="w-full px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs text-slate-800 font-mono focus:outline-none focus:border-rose-300"
        />
        <p className="text-[10px] text-stone-400 mt-1">Use {'{n}'} for page number, {'{total}'} for total pages.</p>
      </div>

      {/* 3. Page Scope */}
      <div>
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
          Apply To Pages
        </label>
        <select
          value={options.pagesScope}
          onChange={(e) => update({ pagesScope: e.target.value as any })}
          className="w-full px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-rose-300 cursor-pointer"
        >
          <option value="all">All Pages (1 to {totalPages})</option>
          <option value="skip-first">Skip First Page (Exclude Cover)</option>
          <option value="odd">Odd Pages Only</option>
          <option value="even">Even Pages Only</option>
          <option value="range">Custom Page Range</option>
        </select>

        {options.pagesScope === 'range' && (
          <input
            type="text"
            value={options.customPages}
            onChange={(e) => update({ customPages: e.target.value })}
            placeholder="e.g. 2-5, 8"
            className="w-full mt-2 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-rose-300"
          />
        )}
      </div>

      {/* 4. Numbering Parameters */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-medium text-slate-600 block mb-1">First Number</label>
          <input
            type="number"
            min={1}
            value={options.firstNumber}
            onChange={(e) => update({ firstNumber: Math.max(1, parseInt(e.target.value || '1', 10)) })}
            className="w-full px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-rose-300"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium text-slate-600 block mb-1">Offset</label>
          <input
            type="number"
            value={options.startOffset}
            onChange={(e) => update({ startOffset: parseInt(e.target.value || '0', 10) })}
            className="w-full px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-rose-300"
          />
        </div>
      </div>

      {/* 5. Typography & Font Family */}
      <div>
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
          Font Style
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {FONT_OPTIONS.map((f) => {
            const active = options.fontFamily === f.id;
            return (
              <button
                key={f.id}
                onClick={() => update({ fontFamily: f.id })}
                className={`py-1.5 text-center rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  active
                    ? 'bg-rose-50/90 border-rose-300 text-rose-800 shadow-2xs'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
                style={{ fontFamily: f.family }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Font Size & Margin Sliders */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-slate-600">Font Size</span>
            <span className="font-mono text-stone-500 font-semibold">{options.fontSize}pt</span>
          </div>
          <input
            type="range"
            min={8}
            max={18}
            value={options.fontSize}
            onChange={(e) => update({ fontSize: parseInt(e.target.value, 10) })}
            className="w-full accent-rose-500 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-slate-600">Edge Margin</span>
            <span className="font-mono text-stone-500 font-semibold">{options.margin}pt</span>
          </div>
          <input
            type="range"
            min={16}
            max={54}
            value={options.margin}
            onChange={(e) => update({ margin: parseInt(e.target.value, 10) })}
            className="w-full accent-rose-500 cursor-pointer"
          />
        </div>
      </div>

      {/* 7. Color Swatches */}
      <div>
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
          Color
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {PAGE_NUMBER_COLORS.map((c) => {
            const active = options.colorHex.toLowerCase() === c.hex.toLowerCase();
            return (
              <button
                key={c.hex}
                onClick={() => update({ colorHex: c.hex })}
                className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                  active ? 'scale-110 border-stone-800 ring-2 ring-rose-200' : 'border-white shadow-2xs hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
