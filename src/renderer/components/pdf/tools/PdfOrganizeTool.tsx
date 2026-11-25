import React, { useState, useCallback } from 'react';
import { ArrowLeft, FolderOpen, Grid, AlertCircle } from 'lucide-react';
import { ActivePdfDocument } from '../PdfContainer';
import { PdfOrganizeView } from '../organize/PdfOrganizeView';
import { useTauriFileDrop } from '@/lib/useTauriFileDrop';

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
  const [fileName, setFileName] = useState<string>(currentDocument?.fileName || '');
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

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
          setError(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open file');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Please drop a valid PDF file.');
        return;
      }
      try {
        const buffer = await file.arrayBuffer();
        setFileData(new Uint8Array(buffer));
        setFileName(file.name);
        setFilePath(null);
        setError(null);
      } catch (err) {
        setError('Failed to read dropped PDF file.');
      }
    }
  };

  const handleDropPaths = useCallback(async (paths: string[]) => {
    const pdfPath = paths.find((p) => p.toLowerCase().endsWith('.pdf'));
    if (!pdfPath || !window.solsticeAPI?.pdfReadFile) return;
    const readRes = await window.solsticeAPI.pdfReadFile(pdfPath).catch(() => null);
    if (readRes?.success && readRes.data) {
      setFilePath(pdfPath);
      setFileName(pdfPath.split(/[/\\]/).pop() || 'Document.pdf');
      setFileData(new Uint8Array(readRes.data));
      setError(null);
    }
  }, []);

  useTauriFileDrop({
    enabled: !fileData,
    onDropPaths: handleDropPaths,
    onDragChange: setIsDragOver,
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#fafbfc] flex flex-col font-sans select-none animate-in fade-in duration-150 overflow-hidden">
      {/* Top Header Bar */}
      <div className="h-12 px-6 border-b border-stone-200/80 bg-white/90 backdrop-blur-md flex items-center justify-between shrink-0">
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
            <span className="text-xs font-bold text-slate-800">Organize PDF Pages</span>
            {fileName && (
              <>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs font-medium text-slate-500 truncate max-w-sm">{fileName}</span>
              </>
            )}
          </div>
        </div>

        {fileData && (
          <button
            onClick={handleSelectFile}
            className="px-3 py-1.5 rounded-xl border border-stone-200/80 hover:bg-stone-50 text-xs font-medium text-slate-700 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>Upload Different PDF</span>
          </button>
        )}
      </div>

      {/* Main Area: Empty State vs Organize Grid */}
      {!fileData ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={handleSelectFile}
            className={`w-full max-w-2xl border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
              isDragOver
                ? 'border-rose-400 bg-rose-50/40 scale-[1.01]'
                : 'border-stone-300/80 bg-white/70 hover:border-rose-300 hover:bg-rose-50/20'
            }`}
          >
            <div className="w-16 h-16 rounded-3xl bg-rose-50/80 border border-rose-100 text-rose-500 flex items-center justify-center mb-4 shadow-2xs">
              <Grid className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-stone-800">Select PDF to Organize</h3>
            <p className="text-xs text-stone-500 mt-1.5 max-w-md">
              Drag and drop your PDF here, or click to upload. Reorder pages with visual drag-and-drop, rotate orientations, or remove unnecessary pages.
            </p>

            {error && (
              <div className="mt-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="button"
              className="mt-6 px-5 py-2.5 rounded-2xl bg-rose-50/90 border border-rose-200/80 hover:bg-rose-100/90 text-rose-800 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Upload PDF Document</span>
            </button>
          </div>
        </div>
      ) : (
        <PdfOrganizeView
          initialFilePath={filePath}
          initialFileName={fileName}
          initialData={fileData}
          saveAsCopy={true}
          onSuccess={(outPath, outData, outName) => {
            onOpenDocument(outPath, outData, outName);
          }}
          onCancel={onClose}
        />
      )}
    </div>
  );
};
