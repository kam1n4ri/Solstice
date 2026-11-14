import { useEffect } from 'react';

interface UseDocsShortcutsOptions {
  onToggleFindReplace: () => void;
  onOpenFindReplace?: () => void;
  onToggleWordCount: () => void;
  onNew: () => void;
  onPrint: () => void;
  onSave: () => void;
  onSaveAs?: () => void;
  onOpen: () => void;
}

export function useDocsShortcuts(options: UseDocsShortcutsOptions): void {
  const {
    onToggleFindReplace,
    onOpenFindReplace,
    onToggleWordCount,
    onNew,
    onPrint,
    onSave,
    onSaveAs,
    onOpen,
  } = options;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl && !e.shiftKey && (e.key.toLowerCase() === 'f' || e.key.toLowerCase() === 'h')) {
        e.preventDefault();
        if (onOpenFindReplace) {
          onOpenFindReplace();
        } else {
          onToggleFindReplace();
        }
      } else if (isCtrl && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        onToggleWordCount();
      } else if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onNew();
      } else if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        onPrint();
      } else if (isCtrl && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSaveAs?.();
      } else if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave();
      } else if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        onOpen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleFindReplace, onToggleWordCount, onNew, onPrint, onSave, onSaveAs, onOpen]);
}
