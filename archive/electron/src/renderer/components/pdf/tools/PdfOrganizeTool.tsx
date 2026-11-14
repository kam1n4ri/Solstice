import React, { useState } from 'react';
import { ArrowLeft, FolderOpen, Grid, AlertCircle } from 'lucide-react';
import { ActivePdfDocument } from '../PdfContainer';
import { PdfOrganizeView } from '../organize/PdfOrganizeView';

interface PdfOrganizeToolProps {
  onClose: () => void;
  onOpenDocument: (filePath: string, data: Uint8Array, fileName: string) => void;
  currentDocument?: ActivePdfDocument | null;
}

export const PdfOrganizeTool: React.FC<PdfOrganizeToolProps> = ({
  onClose,
  onOpenDocument,
  currentDocument,
}) => {
  const [filePath, setFilePath] = useState<string | null>(currentDocument?.filePath || null);
  const [fileData, setFileData] = useState<Uint8Array | null>(currentDocument?.data || null);
  const [fileName, setFileName] = useState<string>(currentDocument?.fileName || 'Document.pdf');
  const [error, setError] = useState<string | null>(null);

  const handleSelectFile = async () => {
    try {
      if (!window.solsticeAPI?.pdfSelectFiles || !window.solsticeAPI.pdfReadFile) return;
      const res = await window.solsticeAPI.pdfSelectFiles({ multiple: false, title: 'Select PDF to Organize' });
      if (!res.canceled && res.files.length > 0) {
        const file = res.files[0];
        const readRes = await window.solsticeAPI.pdfReadFile(file.filePath);
        if (readRes.success && readRes.data) {
          setFilePath(file.filePath);
          setFileName(file.fileName);
          setFileData(new Uint8Array(readRes.data));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open file');
    }
  };

  if (!fileData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-xs font-sans">
        <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200/90 shadow-2xl p-6 text-center animate-in zoom-in-95 duration-150">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/70 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <Grid className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Organize PDF Pages</h3>
          <p className="text-xs text-slate-500 mt-1">
            Reorder pages with drag and drop, rotate orientations, or remove pages from your document.
          </p>

          {error && (
            <div className="mt-3 p-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5 text-left">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-2.5 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSelectFile}
              className="px-4 py-2 rounded-xl bg-rose-50/90 border border-rose-200/80 hover:bg-rose-100 text-rose-800 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Select PDF</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#fafbfc] flex flex-col font-sans overflow-hidden">
      {/* Top Header Bar */}
      <div className="h-12 px-4 border-b border-stone-200/80 bg-white/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Back to Studio (Esc)"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Organize Pages</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-medium text-slate-500 truncate max-w-xs">{fileName}</span>
          </div>
        </div>
      </div>

      {/* Main Organize View with Drag-and-Drop Canvas & Right Panel */}
      <PdfOrganizeView
        initialFilePath={filePath}
        initialFileName={fileName}
        initialData={fileData}
        onSuccess={(outPath, outData, outName) => {
          onOpenDocument(outPath, outData, outName);
        }}
        onCancel={onClose}
      />
    </div>
  );
};
