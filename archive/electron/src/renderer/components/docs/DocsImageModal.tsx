import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Upload, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (src: string) => void;
}

export const DocsImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [tab, setTab] = useState<'url' | 'upload'>('url');
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrl.trim()) {
      onInsert(imageUrl.trim());
      setImageUrl('');
      onClose();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          onInsert(base64);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl text-slate-800 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Insert Image</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 mt-3">
          <button
            type="button"
            onClick={() => setTab('url')}
            className={cn(
              'flex-1 py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors',
              tab === 'url' ? 'border-blue-500/80 text-blue-700/90' : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Web URL</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={cn(
              'flex-1 py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 transition-colors',
              tab === 'upload' ? 'border-blue-500/80 text-blue-700/90' : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload File</span>
          </button>
        </div>

        {/* Tab Content */}
        {tab === 'url' ? (
          <form onSubmit={handleUrlSubmit} className="py-4 space-y-3">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 focus:bg-white transition-colors"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!imageUrl.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-medium bg-blue-50/80 hover:bg-blue-100/80 text-blue-700/90 border border-blue-200/80 disabled:opacity-40 transition-colors shadow-none"
              >
                Insert
              </button>
            </div>
          </form>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-4 rounded-xl border border-dashed border-slate-300 hover:border-blue-300 bg-slate-50 hover:bg-blue-50/50 flex flex-col items-center gap-2 text-slate-700 hover:text-slate-900 transition-colors w-full cursor-pointer"
            >
              <Upload className="h-6 w-6 text-blue-600" />
              <span className="text-xs font-medium">Choose an image from your computer</span>
              <span className="text-[10px] text-slate-400">PNG, JPG, SVG, WebP, GIF</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
