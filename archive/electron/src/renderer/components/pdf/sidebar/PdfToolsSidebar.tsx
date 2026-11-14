import React, { useState } from 'react';
import { Layers, ChevronRight, Search, X } from 'lucide-react';
import { formatPdfFileSize } from '../home/PdfRecentStorage';
import { PDF_TOOLS, SECTIONS, ToolDefinition } from '../tools/PdfToolsData';

interface PdfToolsSidebarProps {
  onSelectTool?: (tool: ToolDefinition) => void;
  activeToolId?: string | null;
  numPages?: number;
  fileSize?: number;
}

export const PdfToolsSidebar: React.FC<PdfToolsSidebarProps> = ({
  onSelectTool,
  activeToolId,
  numPages,
  fileSize,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredTools = PDF_TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const isSearching = filterQuery.trim().length > 0;

  return (
    <aside className="w-64 sm:w-72 h-full border-l border-stone-200/90 bg-[#fafbfc] flex flex-col flex-shrink-0 z-10 select-none font-sans">
      {/* 1. Header (Icon + Tools beside it) */}
      <div className="h-11 px-3.5 border-b border-stone-200/80 flex items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-stone-100 border border-stone-200/70 flex items-center justify-center text-slate-700">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold text-slate-800 tracking-tight">Tools</h3>
        </div>
      </div>

      {/* 2. Search / Filter Input */}
      <div className="p-2.5 border-b border-stone-200/60 shrink-0">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-stone-100/80 border border-stone-200/70 text-xs focus-within:bg-white focus-within:border-stone-300 focus-within:ring-1 focus-within:ring-stone-200 shadow-2xs transition-all">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter tools..."
            className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none text-xs"
          />
          {filterQuery && (
            <button
              type="button"
              onClick={() => setFilterQuery('')}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Grouped Tools List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {isSearching ? (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
              Matching Tools ({filteredTools.length})
            </div>
            <div className="bg-white rounded-xl border border-stone-200/80 divide-y divide-stone-100/90 shadow-2xs overflow-hidden">
              {filteredTools.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeToolId === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => onSelectTool?.(tool)}
                    className={`w-full text-left px-3 py-2.5 transition-colors cursor-pointer group flex items-center justify-between gap-2.5 select-none ${
                      isActive
                        ? 'bg-rose-50/80 text-rose-950 font-semibold'
                        : 'hover:bg-stone-50/90 active:bg-stone-100/70 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
                          isActive
                            ? 'bg-rose-100/80 border-rose-200 text-rose-700'
                            : 'bg-stone-100/90 border-stone-200/70 text-slate-700 group-hover:bg-rose-50/70 group-hover:border-rose-200/70 group-hover:text-rose-600'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-xs truncate transition-colors ${
                            isActive ? 'font-bold text-rose-950' : 'font-semibold text-slate-800 group-hover:text-slate-950'
                          }`}
                        >
                          {tool.name}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {tool.description}
                        </div>
                      </div>
                    </div>
                    {/* Right-pointing Chevron indicator */}
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-all shrink-0 ${
                        isActive
                          ? 'text-rose-500 translate-x-0.5'
                          : 'text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            {filteredTools.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                No tools match &ldquo;{filterQuery}&rdquo;
              </div>
            )}
          </div>
        ) : (
          SECTIONS.map((section) => {
            const sectionTools = PDF_TOOLS.filter((t) => t.category === section.key);
            if (sectionTools.length === 0) return null;

            return (
              <div key={section.key}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400/90 px-1 mb-1.5">
                  {section.title}
                </div>
                <div className="bg-white rounded-xl border border-stone-200/80 divide-y divide-stone-100/90 shadow-2xs overflow-hidden">
                  {sectionTools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = activeToolId === tool.id;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => onSelectTool?.(tool)}
                        className={`w-full text-left px-3 py-2.5 transition-colors cursor-pointer group flex items-center justify-between gap-2.5 select-none ${
                          isActive
                            ? 'bg-rose-50/80 text-rose-950 font-semibold'
                            : 'hover:bg-stone-50/90 active:bg-stone-100/70 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
                              isActive
                                ? 'bg-rose-100/80 border-rose-200 text-rose-700'
                                : 'bg-stone-100/90 border-stone-200/70 text-slate-700 group-hover:bg-rose-50/70 group-hover:border-rose-200/70 group-hover:text-rose-600'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div
                              className={`text-xs truncate transition-colors ${
                                isActive ? 'font-bold text-rose-950' : 'font-semibold text-slate-800 group-hover:text-slate-950'
                              }`}
                            >
                              {tool.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {tool.description}
                            </div>
                          </div>
                        </div>
                        {/* Right-pointing Chevron indicator */}
                        <ChevronRight
                          className={`w-3.5 h-3.5 transition-all shrink-0 ${
                            isActive
                              ? 'text-rose-500 translate-x-0.5'
                              : 'text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Grounded Document Status Footer */}
      <div className="p-3 border-t border-stone-200/80 bg-[#f7f8fa]/80 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/90" />
          <span className="font-medium text-slate-600">Offline Studio</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 font-sans">
          {numPages !== undefined && (
            <span>{numPages} {numPages === 1 ? 'page' : 'pages'}</span>
          )}
          {fileSize !== undefined && (
            <>
              <span>•</span>
              <span>{formatPdfFileSize(fileSize)}</span>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};
