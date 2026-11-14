import React from 'react';
import { GripVertical, X, Check, Loader2, RotateCcw, Info } from 'lucide-react';
import { OrganizeFile, OrganizePage } from './PdfOrganizeTypes';

interface PdfOrganizeSidebarProps {
  files: OrganizeFile[];
  pages: OrganizePage[];
  initialPageCount: number;
  onRemoveFile: (fileId: string) => void;
  onResetAll: () => void;
  onOrganize: () => void;
  onCancel: () => void;
  isProcessing: boolean;
  error: string | null;
}

export const PdfOrganizeSidebar: React.FC<PdfOrganizeSidebarProps> = ({
  files,
  pages,
  initialPageCount,
  onRemoveFile,
  onResetAll,
  onOrganize,
  onCancel,
  isProcessing,
  error,
}) => {
  const rotatedCount = pages.filter((p) => p.rotation !== 0).length;
  const deletedCount = Math.max(0, initialPageCount - pages.length);

  return (
    <aside className="w-72 sm:w-80 h-full border-l border-stone-200/90 bg-white flex flex-col flex-shrink-0 z-20 select-none font-sans shadow-[-4px_0_16px_rgba(0,0,0,0.02)]">
      {/* 1. Files Section Header */}
      <div className="p-4 border-b border-stone-200/80 bg-stone-50/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-800 tracking-tight">Files:</span>
          <button
            type="button"
            onClick={onResetAll}
            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset all</span>
          </button>
        </div>

        {/* Files Inset List */}
        <div className="space-y-2 mt-2 max-h-40 overflow-y-auto custom-scrollbar">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/70 text-slate-800 text-xs shadow-2xs group"
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <GripVertical className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="font-mono font-bold text-rose-800 shrink-0">{file.prefix}:</span>
                <span className="truncate font-medium text-slate-800" title={file.name}>
                  {file.name}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-stone-200/80">
                  {file.pageCount}p
                </span>
                {files.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveFile(file.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Scrollable Body: Configuration & Statistics */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Document Status Card */}
        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Total Pages:</span>
            <span className="font-bold text-slate-800">{pages.length}</span>
          </div>
          {rotatedCount > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Rotated Pages:</span>
              <span className="font-semibold text-rose-700">{rotatedCount}</span>
            </div>
          )}
          {deletedCount > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Deleted Pages:</span>
              <span className="font-semibold text-rose-700">{deletedCount}</span>
            </div>
          )}
        </div>

        {/* In-Place Progressive Pipeline Note */}
        <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/60 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Changes apply directly to this working document. To save a finalized copy anywhere on your computer, use <strong className="text-rose-900 font-semibold">Export</strong> in the top right.
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-xs text-rose-700 leading-relaxed">
            {error}
          </div>
        )}
      </div>

      {/* 3. Action Footer (Apply Changes Button) */}
      <div className="p-4 border-t border-stone-200/80 bg-stone-50/40 flex flex-col gap-2 shrink-0">
        <button
          type="button"
          disabled={pages.length === 0 || isProcessing}
          onClick={onOrganize}
          className="w-full py-3 px-5 rounded-2xl bg-[#ffd8e4] hover:bg-[#fbcad9] active:bg-[#f8b8cc] text-[#3b0918] font-bold text-xs shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#3b0918]" />
              <span>Applying Changes...</span>
            </>
          ) : (
            <>
              <span>Apply Changes</span>
              <div className="w-4 h-4 rounded-full bg-[#3b0918] text-[#ffd8e4] flex items-center justify-center">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            </>
          )}
        </button>

        <button
          type="button"
          disabled={isProcessing}
          onClick={onCancel}
          className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-stone-100 transition-colors text-center cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </aside>
  );
};
