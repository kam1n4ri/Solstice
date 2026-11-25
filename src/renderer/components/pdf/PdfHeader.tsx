import React from 'react';
import {
  ArrowLeft,
  Printer,
  Download,
  Folder,
  CloudCheck,
} from 'lucide-react';
import { PdfToolsDropdown } from './PdfToolsDropdown';

interface PdfHeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  onTitleCommit: (newTitle: string) => void;
  statusText?: string;
  filePath: string | null;
  onRevealFolder: () => void;
  onPrint: () => void;
  onExport: () => void;
  onBackToHome: () => void;
  onOpenOrganize?: () => void;
  onOpenTool?: (toolId: string) => void;
}

export const PdfHeader: React.FC<PdfHeaderProps> = ({
  title,
  onTitleChange,
  onTitleCommit,
  statusText = 'All changes saved',
  filePath,
  onRevealFolder,
  onPrint,
  onExport,
  onBackToHome,
  onOpenOrganize,
  onOpenTool,
}) => {
  return (
    <header className="h-12 border-b border-stone-200/90 bg-[#fafbfc]/95 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-20 select-none">
      {/* 1. Left: Back Arrow, Brand Logo, Title Input, Explorer Folder, Saving Status */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onBackToHome}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
          title="Return to PDF Home"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        {/* Solstice PDF Brand Logo Text */}
        <div className="flex items-baseline select-none shrink-0 pr-1">
          <span className="text-base font-extrabold tracking-tight text-slate-900">
            Solstice
          </span>
          <span className="font-caveat text-xl font-bold text-rose-500/90 ml-1.5 lowercase tracking-wide">
            pdf
          </span>
        </div>

        <div className="h-5 w-px bg-slate-300/60 mx-1 shrink-0" />

        {/* Editable Document Title Input */}
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={() => onTitleCommit(title)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="Untitled document"
          className="bg-transparent hover:outline hover:outline-1 hover:outline-stone-300 focus:bg-white px-2 py-0.5 rounded text-[16px] sm:text-[17px] font-normal text-slate-800 leading-tight focus:outline-none focus:ring-1 focus:ring-rose-300 transition-colors w-40 sm:w-60 truncate"
          title="Click to rename document"
        />

        {/* Show in File Explorer Folder Button */}
        <button
          type="button"
          onClick={onRevealFolder}
          title={filePath ? `Reveal in File Explorer (${filePath})` : 'File not yet saved to disk'}
          className="p-1 rounded-md hover:bg-stone-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
        >
          <Folder className="h-4 w-4" />
        </button>

        {/* Saving Status Indicator */}
        <div className="flex items-center gap-1.5 text-xs ml-1 shrink-0">
          <CloudCheck
            className={`h-3.5 w-3.5 ${
              statusText.toLowerCase().includes('error') || statusText.toLowerCase().includes('failed')
                ? 'text-rose-500/80'
                : 'text-slate-400'
            }`}
          />
          <span
            className={`text-[11px] font-sans ${
              statusText.toLowerCase().includes('error') || statusText.toLowerCase().includes('failed')
                ? 'text-rose-600/90 font-medium'
                : 'text-slate-500'
            }`}
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* 2. Right: Tools Dropdown, Print & Export Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {(onOpenTool || onOpenOrganize) && (
          <PdfToolsDropdown onOpenTool={onOpenTool} onOpenOrganize={onOpenOrganize} />
        )}

        <button
          type="button"
          onClick={onPrint}
          className="p-1.5 rounded-xl border border-stone-200/80 bg-white/90 hover:bg-stone-100 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs flex items-center cursor-pointer"
          title="Print Document"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium text-[#3b0918] bg-[#ffd8e4] hover:bg-[#fbcad9] transition-colors shadow-none cursor-pointer"
          title="Export Document"
        >
          <Download className="h-3.5 w-3.5 text-[#3b0918]" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
