import React from 'react';
import { HIGHLIGHT_COLORS } from './PdfAnnotationTypes';

interface PdfHighlighterOptionsPanelProps {
  highlightColor: string;
  onSelectHighlightColor: (color: string) => void;
}

export const PdfHighlighterOptionsPanel: React.FC<PdfHighlighterOptionsPanelProps> = ({
  highlightColor,
  onSelectHighlightColor,
}) => {
  const activeHighlight =
    HIGHLIGHT_COLORS.find((c) => c.color === highlightColor) || HIGHLIGHT_COLORS[0];

  return (
    <div className="pt-2 space-y-2.5">
      {/* Highlighter Color Section */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1.5">
          <span>Highlight Tone</span>
          <span className="font-medium text-slate-600 capitalize">{activeHighlight.name}</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {HIGHLIGHT_COLORS.map((c) => {
            const isSelected = highlightColor === c.color;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectHighlightColor(c.color)}
                className={`h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                  isSelected
                    ? 'ring-2 ring-stone-400 ring-offset-2 scale-105 border-stone-400/80 shadow-2xs'
                    : 'border-stone-200 hover:scale-105'
                }`}
                style={{ backgroundColor: c.color }}
                title={c.name}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shadow-2xs"
                  style={{ backgroundColor: c.solid }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Highlighter Live Text Preview */}
      <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/60 text-center select-none">
        <span
          className="px-2 py-0.5 rounded text-[11px] font-medium text-slate-800 transition-colors leading-relaxed"
          style={{ backgroundColor: highlightColor }}
        >
          Sample highlighted text
        </span>
      </div>
    </div>
  );
};
