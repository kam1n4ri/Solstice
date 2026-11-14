import React, { useState } from 'react';
import { ArrowLeft, Image as ImageIcon, FileText } from 'lucide-react';
import { ActivePdfDocument } from '../PdfContainer';
import { PdfImagesToPdfView } from './convert/PdfImagesToPdfView';
import { PdfToImagesView } from './convert/PdfToImagesView';

interface PdfConvertToolProps {
  onClose: () => void;
  onOpenDocument: (filePath: string, data: Uint8Array, fileName: string) => void;
  currentDocument?: ActivePdfDocument | null;
}

export const PdfConvertTool: React.FC<PdfConvertToolProps> = ({
  onClose,
  onOpenDocument,
  currentDocument,
}) => {
  const [activeTab, setActiveTab] = useState<'images-to-pdf' | 'pdf-to-images'>(
    currentDocument ? 'pdf-to-images' : 'images-to-pdf'
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#fafbfc] flex flex-col font-sans select-none animate-in fade-in-50 duration-150">
      {/* Top Navigation Bar */}
      <header className="relative h-14 px-6 border-b border-stone-200/80 bg-white/80 backdrop-blur-md flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Back to Tools"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-medium">Back</span>
          </button>
          <div className="h-4 w-px bg-stone-200" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200/60 text-rose-600 flex items-center justify-center">
              <ImageIcon className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-stone-800 tracking-tight">Convert Images & PDF</h2>
              <p className="text-[10px] text-stone-400 -mt-0.5">JPG, PNG photos ⇄ High-DPI PDFs</p>
            </div>
          </div>
        </div>

        {/* Centered Mode Selector */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center p-1 rounded-2xl bg-stone-100/90 border border-stone-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('images-to-pdf')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'images-to-pdf'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200/60 font-bold'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/40'
            }`}
          >
            <ImageIcon
              className={`w-4 h-4 transition-colors ${
                activeTab === 'images-to-pdf' ? 'text-rose-600' : 'text-stone-400'
              }`}
            />
            <span>Images to PDF</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pdf-to-images')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'pdf-to-images'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200/60 font-bold'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/40'
            }`}
          >
            <FileText
              className={`w-4 h-4 transition-colors ${
                activeTab === 'pdf-to-images' ? 'text-rose-600' : 'text-stone-400'
              }`}
            />
            <span>PDF to Images</span>
          </button>
        </div>

        {/* Right side spacer to keep center balanced */}
        <div className="w-28 hidden md:block" />
      </header>

      {/* Main Content Area */}
      {activeTab === 'images-to-pdf' ? (
        <PdfImagesToPdfView onClose={onClose} onOpenDocument={onOpenDocument} />
      ) : (
        <PdfToImagesView currentDocument={currentDocument} onClose={onClose} />
      )}
    </div>
  );
};
