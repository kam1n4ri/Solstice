import React, { useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { X, FileText } from 'lucide-react';

interface DocsWordCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
  showLiveWordCount: boolean;
  onToggleLiveWordCount: (enabled: boolean) => void;
}

export const DocsWordCountModal: React.FC<DocsWordCountModalProps> = ({
  isOpen,
  onClose,
  editor,
  showLiveWordCount,
  onToggleLiveWordCount,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Total document metrics
  const text = editor ? editor.getText() : '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s+/g, '').length;

  let paragraphs = 0;
  if (editor) {
    editor.state.doc.descendants((node) => {
      if (node.isTextblock && node.textContent.trim().length > 0) {
        paragraphs++;
      }
    });
  }
  if (paragraphs === 0 && text.trim().length > 0) {
    paragraphs = text.split(/\n+/).filter(Boolean).length;
  }

  const readingTime = Math.max(1, Math.ceil(words / 200));

  // Selection metrics
  const hasSelection = Boolean(editor && !editor.state.selection.empty);
  let selectedWords = 0;
  let selectedCharacters = 0;
  let selectedCharactersNoSpaces = 0;
  let selectedParagraphs = 0;

  if (editor && hasSelection) {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, '\n');
    selectedWords = selectedText.trim() ? selectedText.trim().split(/\s+/).length : 0;
    selectedCharacters = selectedText.length;
    selectedCharactersNoSpaces = selectedText.replace(/\s+/g, '').length;

    editor.state.doc.nodesBetween(from, to, (node) => {
      if (node.isTextblock && node.textContent.trim().length > 0) {
        selectedParagraphs++;
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 animate-in fade-in duration-150">
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl text-slate-800 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-xs">
              <FileText className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Word count</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Statistics Grid */}
        {hasSelection ? (
          <div className="py-4 space-y-2.5 font-mono text-xs">
            <div className="grid grid-cols-3 text-[11px] font-sans font-medium text-slate-400 pb-1 border-b border-slate-100">
              <span>Metric</span>
              <span className="text-right text-blue-600 font-semibold">Selection</span>
              <span className="text-right text-slate-700">Total</span>
            </div>
            <div className="grid grid-cols-3 items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-sans">Words</span>
              <span className="text-right font-semibold text-blue-600">{selectedWords.toLocaleString()}</span>
              <span className="text-right font-semibold text-slate-900">{words.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-3 items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-sans">Characters</span>
              <span className="text-right font-semibold text-blue-600">{selectedCharacters.toLocaleString()}</span>
              <span className="text-right font-semibold text-slate-900">{characters.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-3 items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-sans">Excl. spaces</span>
              <span className="text-right font-semibold text-blue-600">{selectedCharactersNoSpaces.toLocaleString()}</span>
              <span className="text-right font-semibold text-slate-900">{charactersNoSpaces.toLocaleString()}</span>
            </div>
            <div className="grid grid-cols-3 items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-sans">Paragraphs</span>
              <span className="text-right font-semibold text-blue-600">{selectedParagraphs.toLocaleString()}</span>
              <span className="text-right font-semibold text-slate-900">{paragraphs.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-sans">Reading time</span>
              <span className="font-semibold text-blue-600 text-sm">~{readingTime} min</span>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-sans">Words</span>
              <span className="font-semibold text-slate-900 text-sm">{words.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-sans">Characters</span>
              <span className="font-semibold text-slate-900 text-sm">{characters.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-sans">Characters (excluding spaces)</span>
              <span className="font-semibold text-slate-900 text-sm">
                {charactersNoSpaces.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-500 font-sans">Paragraphs</span>
              <span className="font-semibold text-slate-900 text-sm">{paragraphs.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-sans">Reading time</span>
              <span className="font-semibold text-blue-600 text-sm">~{readingTime} min</span>
            </div>
          </div>
        )}

        {/* Live Pill Toggle & Actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-col gap-4">
          <label className="flex items-center gap-2.5 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showLiveWordCount}
              onChange={(e) => onToggleLiveWordCount(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span>Display word count in footer</span>
          </label>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-blue-50/80 hover:bg-blue-100/80 text-blue-700/90 border border-blue-200/80 transition-colors shadow-none"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
