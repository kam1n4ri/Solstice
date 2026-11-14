import React, { useRef } from 'react';
import {
  Paintbrush,
  Highlighter,
  Zap,
  Pencil,
  RotateCcw,
} from 'lucide-react';
import {
  BrushStyle,
  BrushSettings,
  PALETTE_COLORS,
} from './photoDrawHelper';
import { PhotoInspectorActions } from './PhotoInspectorActions';

interface PhotoDrawInspectorProps {
  brush: BrushSettings;
  onChangeBrush: <K extends keyof BrushSettings>(key: K, value: BrushSettings[K]) => void;
  onClearDrawing: () => void;
  onApply: () => void;
  onCancel: () => void;
}

const BRUSH_STYLES: { id: BrushStyle; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'normal', label: 'Solid', icon: Paintbrush },
  { id: 'highlighter', label: 'Marker', icon: Highlighter },
  { id: 'neon', label: 'Neon', icon: Zap },
  { id: 'pencil', label: 'Pencil', icon: Pencil },
];

export const PhotoDrawInspector: React.FC<PhotoDrawInspectorProps> = ({
  brush,
  onChangeBrush,
  onClearDrawing,
  onApply,
  onCancel,
}) => {
  const rafBrushRef = useRef<number | null>(null);
  const handleBrushChange = <K extends keyof BrushSettings>(key: K, value: BrushSettings[K]) => {
    if (rafBrushRef.current) cancelAnimationFrame(rafBrushRef.current);
    rafBrushRef.current = requestAnimationFrame(() => onChangeBrush(key, value));
  };
  return (
    <div className="p-4 flex flex-col gap-4 text-xs select-none">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Draw & Paint
        </span>
        <button
          type="button"
          onClick={onClearDrawing}
          className="flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          title="Clear all strokes"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Clear</span>
        </button>
      </div>

      {/* 1. Brush Style Tabs */}
      <div className="grid grid-cols-4 gap-1 bg-stone-100/80 p-0.5 rounded-xl border border-stone-200/60">
        {BRUSH_STYLES.map((st) => {
          const Icon = st.icon;
          const isActive = brush.style === st.id;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => onChangeBrush('style', st.id)}
              className={`py-1.5 rounded-lg flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{st.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Color Palette */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-slate-600">Color Palette</span>
        <div className="flex flex-wrap gap-2 items-center">
          {PALETTE_COLORS.map((col) => {
            const isSelected = brush.color.toLowerCase() === col.toLowerCase();
            return (
              <button
                key={col}
                type="button"
                onClick={() => onChangeBrush('color', col)}
                className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                  isSelected ? 'scale-115 ring-2 ring-blue-300 border-white' : 'border-stone-300 hover:scale-105'
                }`}
                style={{ backgroundColor: col }}
                title={col}
              />
            );
          })}
          {/* Custom color input */}
          <label
            className="w-6 h-6 rounded-full border border-stone-300 flex items-center justify-center cursor-pointer overflow-hidden relative"
            title="Custom Color"
          >
            <input
              type="color"
              value={brush.color}
              onChange={(e) => onChangeBrush('color', e.target.value)}
              className="opacity-0 absolute inset-0 cursor-pointer"
            />
            <div className="w-full h-full" style={{ backgroundColor: brush.color }} />
          </label>
        </div>
      </div>

      {/* 3. Brush Size */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-600 font-medium">Brush Size</span>
          <span className="font-mono text-slate-500">{brush.size}px</span>
        </div>
        <input
          type="range"
          min={2}
          max={80}
          step={1}
          value={brush.size}
          onChange={(e) => handleBrushChange('size', parseInt(e.target.value, 10))}
          className="w-full accent-stone-700 cursor-pointer h-1.5 bg-stone-200/80 rounded-lg"
        />
      </div>

      {/* 4. Opacity */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-600 font-medium">Brush Opacity</span>
          <span className="font-mono text-slate-500">{Math.round(brush.opacity * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={1.0}
          step={0.05}
          value={brush.opacity}
          onChange={(e) => handleBrushChange('opacity', parseFloat(e.target.value))}
          className="w-full accent-stone-700 cursor-pointer h-1.5 bg-stone-200/80 rounded-lg"
        />
      </div>

      {/* 5. Action Buttons (Cancel / Apply) */}
      <PhotoInspectorActions onCancel={onCancel} onApply={onApply} />
    </div>
  );
};
