import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Folder,
  Download,
  FileCode,
  Image as ImageIcon,
  Info,
} from 'lucide-react';

interface WhiteboardHeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  statusText: string;
  currentFilePath: string | null;
  onSaveAs?: () => void;
  onExport: (format: 'png' | 'svg' | 'json') => void;
  onBackToHome?: () => void;
}

export const WhiteboardHeader: React.FC<WhiteboardHeaderProps> = ({
  title,
  onTitleChange,
  statusText,
  currentFilePath,
  onExport,
  onBackToHome,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showExportMenu]);

  const handleRevealFolder = () => {
    if (currentFilePath && window.solsticeAPI?.revealInFolder) {
      window.solsticeAPI.revealInFolder(currentFilePath);
    } else {
      setToastMessage('Board is auto-saved in Documents/Solstice/Whiteboards');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <header className="h-12 bg-[#faf8f5] border-b border-[#e8e4dc] px-3 flex items-center justify-between select-none shrink-0 z-40 relative">
      {/* Left: Return, Brand, Title, Star, Folder */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onBackToHome && (
          <button
            type="button"
            onClick={onBackToHome}
            title="Return to Whiteboards"
            className="p-1.5 rounded-lg hover:bg-[#ede8df]/80 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        {/* Brand Text from Hub */}
        <div
          onClick={onBackToHome}
          title={onBackToHome ? 'Return to Whiteboard Hub' : undefined}
          className={`flex items-baseline select-none shrink-0 ${
            onBackToHome ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
          }`}
        >
          <span className="text-base font-extrabold tracking-tight text-slate-900">
            Solstice
          </span>
          <span className="font-caveat text-xl font-bold text-amber-600/90 ml-1.5 lowercase tracking-wide">
            whiteboard
          </span>
        </div>

        <div className="h-4 w-px bg-slate-300/60 mx-1 shrink-0" />

        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled whiteboard"
          className="text-sm font-medium text-slate-800 bg-transparent hover:bg-white/80 focus:bg-white px-2 py-0.5 rounded border border-transparent hover:border-[#e8e4dc] focus:border-amber-300 focus:ring-1 focus:ring-amber-200 focus:outline-none transition-colors max-w-xs truncate"
        />

        <button
          type="button"
          onClick={handleRevealFolder}
          title="Show in file explorer"
          className="p-1 rounded-md hover:bg-[#ede8df]/70 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
        >
          <Folder className="h-3.5 w-3.5" />
        </button>

        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 font-sans shrink-0 leading-none select-none">
          {statusText !== 'All changes saved' && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          )}
          <span>{statusText}</span>
        </span>
      </div>

      {/* Right: Export Control */}
      <div className="flex items-center gap-1.5">
        {/* Export Dropdown */}
        <div ref={exportMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setShowExportMenu((prev) => !prev)}
            title="Export whiteboard"
            className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-amber-50/90 hover:bg-amber-100/80 text-amber-800 border border-amber-200/80 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-amber-700/90" />
            <span>Export</span>
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl border border-[#e8e4dc] shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100 select-none">
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false);
                  onExport('png');
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-[#faf8f5] transition-colors cursor-pointer text-left"
              >
                <ImageIcon className="h-3.5 w-3.5 text-blue-600/80" />
                <span>PNG Image (.png)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false);
                  onExport('svg');
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-[#faf8f5] transition-colors cursor-pointer text-left"
              >
                <FileCode className="h-3.5 w-3.5 text-amber-600/80" />
                <span>SVG Vector (.svg)</span>
              </button>
              <div className="h-px bg-[#ede8df] my-1" />
              <button
                type="button"
                onClick={() => {
                  setShowExportMenu(false);
                  onExport('json');
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-[#faf8f5] transition-colors cursor-pointer text-left"
              >
                <FileCode className="h-3.5 w-3.5 text-amber-700/80" />
                <span>JSON Snapshot (.json)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Non-blocking Toast */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#e8e4dc] text-xs text-slate-700 shadow-md rounded-xl animate-in fade-in duration-150">
          <Info className="h-3.5 w-3.5 text-amber-600/90 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </header>
  );
};
