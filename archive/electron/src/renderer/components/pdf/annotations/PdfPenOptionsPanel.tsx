import React from 'react';
import { PEN_COLORS, PEN_STROKE_WIDTHS } from './PdfAnnotationTypes';

interface PdfPenOptionsPanelProps {
  penColor: string;
  onSelectPenColor: (color: string) => void;
  penWidth: number;
  onSelectPenWidth: (width: number) => void;
}

export const PdfPenOptionsPanel: React.FC<PdfPenOptionsPanelProps> = ({
  penColor,
  onSelectPenColor,
  penWidth,
  onSelectPenWidth,
}) => {
  const activePenColor = PEN_COLORS.find((c) => c.hex === penColor) || PEN_COLORS[0];

  return (
    <div className="pt-2 space-y-2.5">
      {/* Pen Color Section */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1.5">
          <span>Ink Color</span>
          <span className="font-medium text-slate-600 capitalize">{activePenColor.name}</span>
        </div>
        <div className="flex items-center justify-between gap-1">
          {PEN_COLORS.map((c) => {
            const isSelected = penColor === c.hex;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectPenColor(c.hex)}
                className={`w-6 h-6 rounded-full transition-transform cursor-pointer relative flex items-center justify-center ${
                  isSelected ? 'scale-110 ring-2 ring-stone-400 ring-offset-2' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              >
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stroke Width Section */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1.5">
          <span>Thickness</span>
          <span className="font-mono text-slate-600">{penWidth}px</span>
        </div>
        <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100/70 rounded-xl border border-stone-200/60">
          {PEN_STROKE_WIDTHS.map((sw) => {
            const isSelected = penWidth === sw.width;
            return (
              <button
                key={sw.width}
                type="button"
                onClick={() => onSelectPenWidth(sw.width)}
                className={`py-1.5 px-1 rounded-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-stone-200/50'
                }`}
              >
                <span
                  className="w-5 rounded-full transition-colors"
                  style={{
                    height: `${Math.min(sw.width, 5)}px`,
                    backgroundColor: isSelected ? penColor : '#94a3b8',
                  }}
                />
                <span className="text-[10px] font-mono leading-none">{sw.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stroke Live Preview */}
      <div className="p-2 rounded-xl bg-stone-50 border border-stone-200/60 flex items-center justify-center">
        <div
          className="w-full rounded-full transition-all"
          style={{
            height: `${penWidth}px`,
            backgroundColor: penColor,
            maxWidth: '190px',
          }}
        />
      </div>
    </div>
  );
};
