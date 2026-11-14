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

    if (!searchTerm.trim()) {
      setMatches([]);
      setCurrentIndex(0);
      (editor.commands as any).clearSearchHighlights?.();
      return;
    }

    const results = findMatchesInDoc(editor.state.doc, searchTerm, caseSensitive);
    setMatches(results);
    setCurrentIndex(0);

    if (results.length > 0) {
      (editor.commands as any).setSearchHighlights?.(results, 0);
      scrollToActiveMatch(editor);
    } else {
      (editor.commands as any).clearSearchHighlights?.();
    }
  }, [isOpen, editor, searchTerm, caseSensitive, scrollToActiveMatch]);

  // Keep match positions synchronized with live document edits
  useEffect(() => {
    if (!editor || !isOpen) return;

    const handleTransaction = ({ transaction }: { transaction: any }) => {
      if (!transaction.docChanged) return;
      if (!searchTerm.trim()) {
        setMatches([]);
        setCurrentIndex(0);
        (editor.commands as any).clearSearchHighlights?.();
        return;
      }

      const updatedMatches = findMatchesInDoc(editor.state.doc, searchTerm, caseSensitive);
      setMatches(updatedMatches);
      setCurrentIndex((prev) => (updatedMatches.length > 0 ? Math.min(prev, updatedMatches.length - 1) : 0));

      if (updatedMatches.length > 0) {
        const nextIdx = Math.min(currentIndex, updatedMatches.length - 1);
        (editor.commands as any).setSearchHighlights?.(updatedMatches, nextIdx);
      } else {
        (editor.commands as any).clearSearchHighlights?.();
      }
    };

    editor.on('transaction', handleTransaction);
    return () => {
      editor.off('transaction', handleTransaction);
    };
  }, [editor, isOpen, searchTerm, caseSensitive, currentIndex]);

  const handleClose = useCallback(() => {
    if (editor) {
      (editor.commands as any).clearSearchHighlights?.();
    }
    onClose();
  }, [editor, onClose]);

  const handleNext = () => {
    if (!editor || matches.length === 0) return;
    const nextIndex = (currentIndex + 1) % matches.length;
    setCurrentIndex(nextIndex);
    (editor.commands as any).setSearchHighlights?.(matches, nextIndex);
    scrollToActiveMatch(editor);
  };

  const handlePrev = () => {
    if (!editor || matches.length === 0) return;
    const prevIndex = (currentIndex - 1 + matches.length) % matches.length;
    setCurrentIndex(prevIndex);
    (editor.commands as any).setSearchHighlights?.(matches, prevIndex);
    scrollToActiveMatch(editor);
  };

  const handleReplaceCurrent = () => {
    if (!editor || matches.length === 0) return;
    const target = matches[currentIndex];
    if (!target) return;

    const tr = editor.state.tr.insertText(replaceTerm, target.from, target.to);
    editor.view.dispatch(tr);

    const newMatches = findMatchesInDoc(editor.state.doc, searchTerm, caseSensitive);
    setMatches(newMatches);

    if (newMatches.length > 0) {
      const nextIdx = Math.min(currentIndex, newMatches.length - 1);
      setCurrentIndex(nextIdx);
      (editor.commands as any).setSearchHighlights?.(newMatches, nextIdx);
      scrollToActiveMatch(editor);
    } else {
      setCurrentIndex(0);
      (editor.commands as any).clearSearchHighlights?.();
    }
  };

  const handleReplaceAll = () => {
    if (!editor || matches.length === 0) return;
    let tr = editor.state.tr;
    for (let i = matches.length - 1; i >= 0; i--) {
      tr = tr.insertText(replaceTerm, matches[i].from, matches[i].to);
    }
    editor.view.dispatch(tr);

    const newMatches = findMatchesInDoc(editor.state.doc, searchTerm, caseSensitive);
    setMatches(newMatches);
    setCurrentIndex(0);

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
