import React, { useRef, useState, useEffect } from 'react';
import {
  ArrowLeft,
  CloudCheck,
  Download,
  ChevronDown,
  Folder,
  Info,
} from 'lucide-react';
import { DocsMenuBar } from './DocsMenuBar';
import { DocsMenuBarProps, MenuItem } from './DocsMenuTypes';
import { DocsMenuDropdown } from './DocsMenuDropdown';
import { cn } from '@/lib/utils';

interface DocsHeaderProps extends Omit<DocsMenuBarProps, 'onRenameFocus'> {
  onTitleChange: (newTitle: string) => void;
  statusText?: string;
  onBackToHome?: () => void;
  filePath?: string | null;
}

export const DocsHeader: React.FC<DocsHeaderProps> = ({
  title,
  onTitleChange,
  statusText = 'All changes saved',
  onBackToHome,
  filePath,
  isPrintLayout,
  onToggleLayout,
  ...menuProps
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [localTitle, setLocalTitle] = useState(title);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const exportContainerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  useEffect(() => () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
  }, []);

  const commitTitle = (val?: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const trimmed = (val !== undefined ? val : localTitle).trim();
    const finalTitle = trimmed || 'Untitled document';
    if (finalTitle !== title) onTitleChange(finalTitle);
  };

  const handleTitleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalTitle(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => commitTitle(val), 1500);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((c) => (c === msg ? null : c)), 3500);
  };

  const handleRenameFocus = () => {
    titleInputRef.current?.focus();
    titleInputRef.current?.select();
  };

  // Close export dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportContainerRef.current && !exportContainerRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showExportMenu]);

  const exportItems: MenuItem[] = [
    { id: 'exp-docx', label: 'Microsoft Word (.docx)', onClick: () => menuProps.onExport('docx') },
    { id: 'exp-pdf', label: 'PDF Document (.pdf)', onClick: () => menuProps.onExport('pdf') },
    { id: 'exp-md', label: 'Markdown (.md)', onClick: () => menuProps.onExport('md') },
    { id: 'exp-html', label: 'Web Page (.html)', onClick: () => menuProps.onExport('html') },
    { id: 'exp-txt', label: 'Plain Text (.txt)', onClick: () => menuProps.onExport('txt') },
  ];

  return (
    <header className="bg-[#f8fafd] text-slate-800 select-none shrink-0 z-30 pt-2.5 pb-1.5 transition-all duration-200 print:hidden">
      <div className="px-4 flex items-center justify-between gap-4">
        {/* Left: Back Arrow, Brand Text Logo, Title, Status, and Menu Bar */}
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              title="Return to Docs Home"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}

          {/* Solstice Docs Brand Text (The Logo) */}
          <div className="flex items-baseline select-none shrink-0 pr-1">
            <span className="text-base font-extrabold tracking-tight text-slate-900">
              Solstice
            </span>
            <span className="font-caveat text-xl font-bold text-blue-600/90 ml-1.5 lowercase tracking-wide">
              docs
            </span>
          </div>

          <div className="h-5 w-px bg-slate-300/60 mx-1 shrink-0" />

          <div className="flex flex-col justify-center pl-1">
            {/* Title, Folder & Status Row */}
            <div className="flex items-center gap-1.5 pt-1">
              <input
                ref={titleInputRef}
                type="text"
                value={localTitle}
                onChange={handleTitleInputChange}
                onBlur={() => commitTitle()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitTitle();
                    titleInputRef.current?.blur();
                  } else if (e.key === 'Escape') {
                    if (debounceTimerRef.current) {
                      clearTimeout(debounceTimerRef.current);
                      debounceTimerRef.current = null;
                    }
                    setLocalTitle(title);
                    titleInputRef.current?.blur();
                  }
                }}
                placeholder="Untitled document"
                className="bg-transparent hover:outline hover:outline-1 hover:outline-slate-300 focus:bg-white px-2 py-0.5 rounded text-[18px] font-normal text-slate-800 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-300 transition-colors w-64"
              />

              {/* Folder (Reveal in File Explorer) button */}
              <button
                type="button"
                onClick={() => {
                  if (!filePath) {
                    showToast('Please save the document to disk first before revealing in file explorer.');
                    return;
                  }
                  if (window.solsticeAPI?.revealInFolder) {
                    window.solsticeAPI.revealInFolder(filePath);
                  }
                }}
                title={filePath ? `Reveal in File Explorer (${filePath})` : 'Please save document first'}
                className={cn(
                  'p-1 rounded-full transition-colors',
                  filePath
                    ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 cursor-pointer'
                    : 'text-slate-300 opacity-50 cursor-not-allowed'
                )}
              >
                <Folder className="h-4 w-4" />
              </button>

              {/* Quiet muted status text matching Google Docs */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-1">
                <CloudCheck className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[11px] font-sans text-slate-500">{statusText}</span>
              </div>
            </div>

            {/* Menu Bar Row */}
            <DocsMenuBar
              {...menuProps}
              title={title}
              onRenameFocus={handleRenameFocus}
              isPrintLayout={isPrintLayout}
              onToggleLayout={onToggleLayout}
            />
          </div>
        </div>

        {/* Right Action: Export Button with Dropdown Menu */}
        <div className="relative" ref={exportContainerRef}>
          <button
            onClick={() => setShowExportMenu((prev) => !prev)}
            title="Export Document"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium text-[#001d35] bg-[#c2e7ff] hover:bg-[#b3defa] transition-colors shadow-none"
          >
            <Download className="h-3.5 w-3.5 text-[#001d35]" />
            <span>Export</span>
            <ChevronDown className="h-3 w-3 text-[#001d35] opacity-70" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1.5 z-50">
              <DocsMenuDropdown
                items={exportItems}
                onClose={() => setShowExportMenu(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Non-blocking Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-2 bg-surface-container-lowest border border-outline-variant/30 text-xs text-on-surface shadow-md rounded-xl animate-in fade-in">
          <Info className="h-4 w-4 text-blue-600/80 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-on-surface-variant/60 hover:text-on-surface text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </header>
  );
};
