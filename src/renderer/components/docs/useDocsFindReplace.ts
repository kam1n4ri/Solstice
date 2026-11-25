import { useState, useEffect, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { findMatchesInDoc, MatchRange } from './docsSearchHelper';

interface UseDocsFindReplaceProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
  focusTrigger?: number;
}

export function useDocsFindReplace({
  editor,
  isOpen,
  onClose,
  focusTrigger,
}: UseDocsFindReplaceProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [matches, setMatches] = useState<MatchRange[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const currentIndexRef = useRef(0);
  const isReplacingRef = useRef(false);

  const updateCurrentIndex = useCallback((nextIdx: number) => {
    currentIndexRef.current = nextIdx;
    setCurrentIndex(nextIdx);
  }, []);

  // Smoothly scroll active match into view without stealing keyboard focus
  const scrollToActiveMatch = useCallback((ed: Editor | null) => {
    if (!ed) return;
    requestAnimationFrame(() => {
      const activeEl = ed.view.dom.querySelector('.docs-search-match-active');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }, []);

  // Focus and select search input when opened or re-triggered (e.g. repeated Ctrl+F)
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [isOpen, focusTrigger]);

  // Scan and highlight matches whenever search term, case sensitivity, or open state changes
  useEffect(() => {
    if (!isOpen || !editor) {
      if (editor) {
        (editor.commands as any).clearSearchHighlights?.();
      }
      return;
    }

    if (!searchTerm) {
      setMatches([]);
      updateCurrentIndex(0);
      (editor.commands as any).clearSearchHighlights?.();
      return;
    }

    const results = findMatchesInDoc(editor.state.doc, searchTerm, caseSensitive);
    setMatches(results);
    updateCurrentIndex(0);

    if (results.length > 0) {
      (editor.commands as any).setSearchHighlights?.(results, 0);
      scrollToActiveMatch(editor);
    } else {
      (editor.commands as any).clearSearchHighlights?.();
    }
  }, [isOpen, editor, searchTerm, caseSensitive, scrollToActiveMatch, updateCurrentIndex]);

  // Keep match positions synchronized with live document edits
  useEffect(() => {
    if (!editor || !isOpen) return;

    const handleTransaction = ({ transaction }: { transaction: any }) => {
      if (!transaction.docChanged || isReplacingRef.current) return;
      if (!searchTerm) {
        setMatches([]);
        updateCurrentIndex(0);
        (editor.commands as any).clearSearchHighlights?.();
        return;
      }

      const updatedMatches = findMatchesInDoc(editor.state.doc, searchTerm, caseSensitive);
      setMatches(updatedMatches);

      if (updatedMatches.length > 0) {
        const nextIdx = Math.min(currentIndexRef.current, updatedMatches.length - 1);
        updateCurrentIndex(nextIdx);
        (editor.commands as any).setSearchHighlights?.(updatedMatches, nextIdx);
      } else {
        updateCurrentIndex(0);
        (editor.commands as any).clearSearchHighlights?.();
      }
    };

    editor.on('transaction', handleTransaction);
    return () => {
      editor.off('transaction', handleTransaction);
    };
  }, [editor, isOpen, searchTerm, caseSensitive, updateCurrentIndex]);

  const handleClose = useCallback(() => {
    if (editor) {
      (editor.commands as any).clearSearchHighlights?.();
    }
    onClose();
  }, [editor, onClose]);

  const handleNext = () => {
    if (!editor || matches.length === 0) return;
    const nextIndex = (currentIndexRef.current + 1) % matches.length;
    updateCurrentIndex(nextIndex);
    (editor.commands as any).setSearchHighlights?.(matches, nextIndex);
    scrollToActiveMatch(editor);
  };

  const handlePrev = () => {
    if (!editor || matches.length === 0) return;
    const prevIndex = (currentIndexRef.current - 1 + matches.length) % matches.length;
    updateCurrentIndex(prevIndex);
    (editor.commands as any).setSearchHighlights?.(matches, prevIndex);
    scrollToActiveMatch(editor);
  };

  const handleReplaceCurrent = () => {
    if (!editor || matches.length === 0) return;
    const target = matches[currentIndexRef.current];
    if (!target) return;

    isReplacingRef.current = true;
    try {
      const tr = editor.state.tr.insertText(replaceTerm, target.from, target.to);
      editor.view.dispatch(tr);
    } finally {
      isReplacingRef.current = false;
    }

    const replaceEnd = target.from + replaceTerm.length;
    const newMatches = findMatchesInDoc(editor.state.doc, searchTerm, caseSensitive);
    setMatches(newMatches);

    if (newMatches.length > 0) {
      const nextAfterReplace = newMatches.findIndex((m) => m.from >= replaceEnd);
      const nextIdx = nextAfterReplace !== -1 ? nextAfterReplace : 0;
      updateCurrentIndex(nextIdx);
      (editor.commands as any).setSearchHighlights?.(newMatches, nextIdx);
      scrollToActiveMatch(editor);
    } else {
      updateCurrentIndex(0);
      (editor.commands as any).clearSearchHighlights?.();
    }
  };

  const handleReplaceAll = () => {
    if (!editor || matches.length === 0) return;
    isReplacingRef.current = true;
    try {
      let tr = editor.state.tr;
      for (let i = matches.length - 1; i >= 0; i--) {
        tr = tr.insertText(replaceTerm, matches[i].from, matches[i].to);
      }
      editor.view.dispatch(tr);
    } finally {
      isReplacingRef.current = false;
    }

    const newMatches = findMatchesInDoc(editor.state.doc, searchTerm, caseSensitive);
    setMatches(newMatches);
    updateCurrentIndex(0);

    if (newMatches.length > 0) {
      (editor.commands as any).setSearchHighlights?.(newMatches, 0);
    } else {
      (editor.commands as any).clearSearchHighlights?.();
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    replaceTerm,
    setReplaceTerm,
    matches,
    currentIndex,
    caseSensitive,
    setCaseSensitive,
    searchInputRef,
    handleClose,
    handleNext,
    handlePrev,
    handleReplaceCurrent,
    handleReplaceAll,
  };
}
