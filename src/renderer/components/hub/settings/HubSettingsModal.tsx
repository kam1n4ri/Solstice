import React, { useState, useEffect } from 'react';
import { X, FolderOpen } from 'lucide-react';
import { CURRENT_APP_VERSION } from '@/lib/hub/updatesService';

interface HubSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ThemeOption = 'light' | 'dark' | 'system';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const HubSettingsModal: React.FC<HubSettingsModalProps> = ({ isOpen, onClose }) => {
  const [theme, setTheme] = useState<ThemeOption>(() => {
    return (localStorage.getItem('solstice-theme') as ThemeOption) || 'light';
  });
  const [storageInfo, setStorageInfo] = useState<{
    rootPath: string;
    totalBytes: number;
    fileCount: number;
  } | null>(null);

  const handleSelectTheme = (selected: ThemeOption) => {
    setTheme(selected);
    localStorage.setItem('solstice-theme', selected);

    const isDark =
      selected === 'dark' ||
      (selected === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    window.solsticeAPI?.getStorageInfo?.().then(setStorageInfo).catch(() => {});

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const themeOptions: { id: ThemeOption; label: string }[] = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'system', label: 'System' },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-xl overflow-hidden p-6 text-on-surface animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header — Clean and minimal, no icon boxes */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-container/60">
          <h3 className="text-base font-semibold text-on-surface">Preferences</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container/60 hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="pt-4 space-y-5">
          <div className="space-y-2">
            <span className="text-xs font-medium text-on-surface-variant block">
              Interface Theme
            </span>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectTheme(opt.id)}
                  className={`py-2 px-3 rounded-xl border text-xs transition-colors cursor-pointer text-center ${
                    theme === opt.id
                      ? 'bg-surface-container text-on-surface border-outline-variant/60 font-semibold shadow-2xs'
                      : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/20 hover:bg-surface-container-low hover:text-on-surface font-medium'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-surface-container/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-on-surface-variant">
                Solstice Workspace Folder
              </span>
              {storageInfo && (
                <span className="text-[11px] text-outline font-mono">
                  {storageInfo.fileCount} files • {formatBytes(storageInfo.totalBytes)}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => window.solsticeAPI?.openSolsticeFolder?.()}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 text-blue-700/90 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/50 text-xs font-medium transition-colors cursor-pointer"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span>Open Solstice Folder</span>
            </button>
            <p className="text-[11px] text-outline leading-relaxed">
              Your documents, PDFs, whiteboards, and custom fonts are stored safely inside{' '}
              <span className="font-mono">{storageInfo?.rootPath || '~/Documents/Solstice'}</span>.
            </p>
          </div>

          <div className="pt-3 border-t border-surface-container/60 flex items-center justify-between text-[11px] text-outline">
            <span>Solstice Suite</span>
            <span className="font-mono">{CURRENT_APP_VERSION}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
