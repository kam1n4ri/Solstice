import React, { useRef } from 'react';
import {
  Type,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import {
  PhotoTextOptions,
  AVAILABLE_FONTS,
} from './photoTextHelper';
import { PhotoInspectorActions } from './PhotoInspectorActions';
import { PALETTE_COLORS } from './photoDrawHelper';

interface PhotoTextInspectorProps {
  options: PhotoTextOptions;
  onChangeOption: <K extends keyof PhotoTextOptions>(key: K, value: PhotoTextOptions[K]) => void;
  onApply: () => void;
  onCancel: () => void;
}

const BADGE_COLORS = [
  'transparent',
  'rgba(15, 23, 42, 0.75)', // Dark slate pill
  'rgba(255, 255, 255, 0.85)', // White pill
  'rgba(239, 68, 68, 0.75)', // Red pill
  'rgba(59, 130, 246, 0.75)', // Blue pill
  'rgba(234, 179, 8, 0.75)', // Yellow pill
];

export const PhotoTextInspector: React.FC<PhotoTextInspectorProps> = ({
  options,
  onChangeOption,
  onApply,
  onCancel,
}) => {
  const rafFontRef = useRef<number | null>(null);
  const handleFontSizeChange = (size: number) => {
    if (rafFontRef.current) cancelAnimationFrame(rafFontRef.current);
    rafFontRef.current = requestAnimationFrame(() => onChangeOption('fontSize', size));
  };
  return (
    <div className="p-4 flex flex-col gap-3.5 text-xs select-none">
      <div className="flex items-center gap-1.5">
        <Type className="h-3.5 w-3.5 text-stone-500" />
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Typography
        </span>
      </div>

      {/* 1. Text Content Input */}
      <textarea
        value={options.text}
        onChange={(e) => onChangeOption('text', e.target.value)}
        rows={2}
        placeholder="Type your text..."
        className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200/80 bg-white text-slate-800 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-300 resize-none font-sans"
      />

      {/* 2. Font Family Selector */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-slate-600">Font</label>
        <select
          value={options.fontFamily}
          onChange={(e) => onChangeOption('fontFamily', e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-xl border border-stone-200/80 bg-white text-slate-800 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-300 cursor-pointer"
        >
          {AVAILABLE_FONTS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Formatting Toggles (Bold, Italic, Alignment) */}
      <div className="flex items-center gap-2">
        <div className="flex bg-stone-100/80 p-0.5 rounded-lg border border-stone-200/60">
          <button
            type="button"
            onClick={() => onChangeOption('bold', !options.bold)}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              options.bold ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onChangeOption('italic', !options.italic)}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              options.italic ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex bg-stone-100/80 p-0.5 rounded-lg border border-stone-200/60 ml-auto">
          {(['left', 'center', 'right'] as const).map((al) => {
            const Icon = al === 'left' ? AlignLeft : al === 'center' ? AlignCenter : AlignRight;
            return (
              <button
                key={al}
                type="button"
                onClick={() => onChangeOption('align', al)}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  options.align === al ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title={`Align ${al}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Font Size */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-600 font-medium">Font Size</span>
          <span className="font-mono text-slate-500">{options.fontSize}px</span>
        </div>
        <input
          type="range"
          min={14}
          max={140}
          step={2}
          value={options.fontSize}
          onChange={(e) => handleFontSizeChange(parseInt(e.target.value, 10))}
          className="w-full accent-stone-700 cursor-pointer h-1.5 bg-stone-200/80 rounded-lg"
        />
      </div>

      {/* 5. Text Color & Background Badge */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium text-slate-600">Text Color</span>
        <div className="flex flex-wrap gap-1.5 items-center">
          {PALETTE_COLORS.slice(0, 8).map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => onChangeOption('color', col)}
              className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                options.color.toLowerCase() === col.toLowerCase()
                  ? 'scale-115 ring-2 ring-blue-300 border-white'
                  : 'border-stone-300'
              }`}
              style={{ backgroundColor: col }}
            />
          ))}
        </div>

        <span className="text-[11px] font-medium text-slate-600 mt-1">Badge Background</span>
        <div className="flex flex-wrap gap-1.5 items-center">
          {BADGE_COLORS.map((bg) => (
            <button
              key={bg}
              type="button"
              onClick={() => onChangeOption('backgroundColor', bg)}
              className={`h-5 px-2 rounded-full border text-[10px] flex items-center justify-center transition-transform cursor-pointer ${
                options.backgroundColor === bg ? 'ring-2 ring-blue-300 border-white font-semibold' : 'border-stone-300'
              }`}
              style={{
                backgroundColor: bg === 'transparent' ? '#f1f5f9' : bg,
                color: bg.includes('255') || bg === 'transparent' ? '#0f172a' : '#ffffff',
              }}
            >
              {bg === 'transparent' ? 'None' : 'Pill'}
            </button>
          ))}
        </div>
      </div>

      {/* 6. Action Buttons */}
      <PhotoInspectorActions onCancel={onCancel} onApply={onApply} />
    </div>
  );
};
