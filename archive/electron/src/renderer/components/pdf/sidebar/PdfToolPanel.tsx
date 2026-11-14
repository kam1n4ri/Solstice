import React, { useState, useEffect } from 'react';
import { X, ChevronRight, CheckCircle2, Sliders, Sparkles } from 'lucide-react';
import { ToolDefinition } from '../tools/PdfToolsData';

interface PdfToolPanelProps {
  tool: ToolDefinition;
  onClose: () => void;
  currentPage?: number;
  numPages?: number;
  onExecute?: (toolId: string, options: Record<string, any>) => void;
}

export const PdfToolPanel: React.FC<PdfToolPanelProps> = ({
  tool,
  onClose,
  currentPage = 1,
  numPages = 1,
  onExecute,
}) => {
  const [pageScope, setPageScope] = useState<'all' | 'current' | 'range'>('all');
  const [customRange, setCustomRange] = useState(`1-${numPages}`);
  const [paramInput, setParamInput] = useState('');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const Icon = tool.icon;

  // Dismiss on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleApply = () => {
    setStatusNotice('Changes applied');
    onExecute?.(tool.id, {
      pageScope,
      customRange,
      paramInput,
    });
    setTimeout(() => {
      setStatusNotice(null);
    }, 2000);
  };

  return (
    <aside className="w-72 sm:w-80 h-full border-l border-stone-200/90 bg-[#fafbfc] flex flex-col flex-shrink-0 z-20 select-none font-sans animate-in slide-in-from-right-4 duration-150 shadow-[-4px_0_16px_rgba(0,0,0,0.02)]">
      {/* 1. Panel Header */}
      <div className="h-11 px-3.5 border-b border-stone-200/80 flex items-center justify-between shrink-0 bg-white/70">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-rose-50 border border-rose-200/70 flex items-center justify-center text-rose-600 shrink-0">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold text-slate-800 truncate">{tool.name}</h3>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-stone-200/60 transition-colors cursor-pointer shrink-0"
          title="Close panel (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Scrollable Configuration Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Info & Instructions Card */}
        <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200/50 text-[11px] text-slate-600 leading-relaxed">
          <div className="flex items-center gap-1.5 font-semibold text-rose-950 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>{tool.badge} Configuration</span>
          </div>
          {tool.helpText}
        </div>

        {/* Section 1: Page Scope Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-0.5">
            Target Pages
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-stone-100/90 border border-stone-200/60 text-xs">
            <button
              type="button"
              onClick={() => setPageScope('all')}
              className={`py-1 rounded-lg font-medium text-[11px] transition-all cursor-pointer ${
                pageScope === 'all'
                  ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({numPages})
            </button>
            <button
              type="button"
              onClick={() => setPageScope('current')}
              className={`py-1 rounded-lg font-medium text-[11px] transition-all cursor-pointer ${
                pageScope === 'current'
                  ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Page {currentPage}
            </button>
            <button
              type="button"
              onClick={() => setPageScope('range')}
              className={`py-1 rounded-lg font-medium text-[11px] transition-all cursor-pointer ${
                pageScope === 'range'
                  ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Range
            </button>
          </div>

          {pageScope === 'range' && (
            <input
              type="text"
              value={customRange}
              onChange={(e) => setCustomRange(e.target.value)}
              placeholder="e.g. 1-3, 5, 7-9"
              className="mt-1.5 w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-200"
            />
          )}
        </div>

        {/* Section 2: Parameters & Options */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-0.5 flex items-center justify-between">
            <span>Parameters</span>
            <Sliders className="w-3 h-3 text-slate-400" />
          </label>
          <div className="p-3 rounded-xl bg-white border border-stone-200/80 shadow-2xs space-y-2.5">
            <div>
              <span className="text-[11px] font-medium text-slate-700 block mb-1">
                Custom Values / Keywords
              </span>
              <input
                type="text"
                value={paramInput}
                onChange={(e) => setParamInput(e.target.value)}
                placeholder={`Configure ${tool.name.toLowerCase()}...`}
                className="w-full px-2.5 py-1.5 rounded-lg bg-stone-50/80 border border-stone-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-200 transition-colors"
              />
            </div>

            <div className="text-[10px] text-slate-500 pt-0.5">
              Applies directly to working document. Export when done.
            </div>
          </div>
        </div>

        {/* Live Feedback Toast */}
        {statusNotice && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5 animate-in fade-in duration-100">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{statusNotice}</span>
          </div>
        )}
      </div>

      {/* 3. Action Footer */}
      <div className="p-3 border-t border-stone-200/80 bg-white/80 flex flex-col gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleApply}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-[#3b0918] bg-[#ffd8e4] hover:bg-[#fbcad9] active:bg-[#f8b6ca] transition-colors cursor-pointer shadow-none"
        >
          <span>Apply to Document</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#3b0918]" />
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-1.5 px-3 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-stone-100 transition-colors cursor-pointer text-center"
        >
          Cancel
        </button>
      </div>
    </aside>
  );
};
