import React, { useState, useEffect, useRef } from 'react';
import { X, Link2 } from 'lucide-react';

export interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUrl?: string;
  initialText?: string;
  onSave: (url: string, text?: string) => void;
  onRemove: () => void;
}

export const DocsLinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  onClose,
  initialUrl = '',
  initialText = '',
  onSave,
  onRemove,
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrl(initialUrl);
    setText(initialText);
    if (isOpen) {
      setTimeout(() => {
        if (initialText) {
          urlInputRef.current?.focus();
          urlInputRef.current?.select();
        } else {
          textInputRef.current?.focus();
        }
      }, 50);
    }
  }, [isOpen, initialUrl, initialText]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (trimmedUrl) {
      const finalUrl = /^https?:\/\//i.test(trimmedUrl) || /^mailto:/i.test(trimmedUrl)
        ? trimmedUrl
        : `https://${trimmedUrl}`;
      onSave(finalUrl, text.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl text-slate-800 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Insert / Edit Link</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Text</label>
            <input
              ref={textInputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Text to display..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Link URL</label>
            <input
              ref={urlInputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            {initialUrl ? (
              <button
                type="button"
                onClick={() => {
                  onRemove();
                  onClose();
                }}
                className="text-xs text-rose-600 hover:text-rose-700 transition-colors"
              >
                Remove link
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!url.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-blue-50/80 hover:bg-blue-100/80 text-blue-700/90 border border-blue-200/80 disabled:opacity-40 transition-colors shadow-none"
              >
                Apply
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
