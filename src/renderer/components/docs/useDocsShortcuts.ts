import { useEffect, useRef } from 'react';

interface UseDocsShortcutsOptions {
  onToggleFindReplace: () => void;
  onOpenFindReplace?: () => void;
  onToggleWordCount: () => void;
  onOpenLinkModal?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onNew: () => void;
  onPrint: () => void;
  onSave: () => void;
  onSaveAs?: () => void;
  onOpen: () => void;
}

export function useDocsShortcuts(options: UseDocsShortcutsOptions): void {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = (e.ctrlKey || e.metaKey) && !e.altKey;
      if (!isCtrl) return;

      const opts = optionsRef.current;
      const key = e.key.toLowerCase();

      if (!e.shiftKey && (key === 'f' || key === 'h')) {
        e.preventDefault();
        if (opts.onOpenFindReplace) {
          opts.onOpenFindReplace();
        } else {
          opts.onToggleFindReplace();
        }
      } else if (e.shiftKey && key === 'c') {
        e.preventDefault();
        opts.onToggleWordCount();
      } else if (!e.shiftKey && key === 'k') {
        e.preventDefault();
        opts.onOpenLinkModal?.();
      } else if (e.key === '=' || e.key === '+' || e.code === 'NumpadAdd') {
        e.preventDefault();
        opts.onZoomIn?.();
      } else if (!e.shiftKey && (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract')) {
        e.preventDefault();
        opts.onZoomOut?.();
      } else if (!e.shiftKey && (e.key === '0' || e.code === 'Numpad0')) {
        e.preventDefault();
        opts.onZoomReset?.();
      } else if (!e.shiftKey && key === 'n') {
        e.preventDefault();
        opts.onNew();
      } else if (!e.shiftKey && key === 'p') {
        e.preventDefault();
        opts.onPrint();
      } else if (e.shiftKey && key === 's') {
        e.preventDefault();
        opts.onSaveAs?.();
      } else if (!e.shiftKey && key === 's') {
        e.preventDefault();
        opts.onSave();
      } else if (!e.shiftKey && key === 'o') {
        e.preventDefault();
        opts.onOpen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
