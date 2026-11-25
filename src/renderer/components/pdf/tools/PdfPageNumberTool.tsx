import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Hash, FolderOpen, Loader2 } from 'lucide-react';
import { ActivePdfDocument } from '../PdfContainer';
import { pdfjsLib, PDFDocumentProxy } from '../pdfjsSetup';
import { PageNumberOptions, PageNumberResultData } from './page-numbers/PdfPageNumberTypes';
import { PdfPageNumberEmptyState } from './page-numbers/PdfPageNumberEmptyState';
import { PdfPageNumberPreview } from './page-numbers/PdfPageNumberPreview';
import { PdfPageNumberInspector } from './page-numbers/PdfPageNumberInspector';
import { PdfPageNumberResultView } from './page-numbers/PdfPageNumberResultView';
import { useTauriFileDrop } from '@/lib/useTauriFileDrop';

interface PdfPageNumberToolProps {
  onClose: () => void;
  onOpenDocument: (filePath: string, data: Uint8Array, fileName: string) => void;
  currentDocument?: ActivePdfDocument | null;
}

export const PdfPageNumberTool: React.FC<PdfPageNumberToolProps> = ({
  onClose,
  onOpenDocument,
  currentDocument,
}) => {
  const [filePath, setFilePath] = useState<string | null>(currentDocument?.filePath || null);
  const [fileData, setFileData] = useState<Uint8Array | null>(currentDocument?.data || null);
  const [fileName, setFileName] = useState<string>(currentDocument?.fileName || 'Document.pdf');
  const [totalPages, setTotalPages] = useState<number>(0);
  const [docProxy, setDocProxy] = useState<PDFDocumentProxy | null>(null);

  const [options, setOptions] = useState<PageNumberOptions>({
    position: 'bottom-center',
    format: 'Page {n} of {total}',
    startOffset: 0,
    firstNumber: 1,
    fontSize: 10,
    margin: 28,
    fontFamily: 'helvetica',
    colorHex: '#334155',
    pagesScope: 'all',
    customPages: '',
  });

  const [outputName, setOutputName] = useState<string>(`Numbered_${fileName}`);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PageNumberResultData | null>(null);

  useEffect(() => {
    if (!fileData) {
      setDocProxy(null);
      setTotalPages(0);
      return;
    }
    let isCancelled = false;
    pdfjsLib.getDocument({ data: fileData.slice() }).promise.then((proxy) => {
      if (!isCancelled) {
        setDocProxy(proxy);
        setTotalPages(proxy.numPages);
      }
    }).catch((err) => {
      console.warn('[PageNumber] Failed to parse document proxy:', err);
    });
    return () => {
      isCancelled = true;
    };
  }, [fileData]);

  const handleSelectFile = async () => {
    try {
      if (!window.solsticeAPI?.pdfSelectFiles || !window.solsticeAPI.pdfReadFile) return;
      const res = await window.solsticeAPI.pdfSelectFiles({ multiple: false, title: 'Select PDF to Number' });
      if (!res.canceled && res.files.length > 0) {
        const file = res.files[0];
        const readRes = await window.solsticeAPI.pdfReadFile(file.filePath);
        if (readRes.success && readRes.data) {
          setFilePath(file.filePath);
          setFileName(file.fileName);
          setOutputName(`Numbered_${file.fileName}`);
          setFileData(new Uint8Array(readRes.data));
          setResult(null);
          setError(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select file');
    }
  };

  const handleDropFile = async (droppedFile: File) => {
    try {
      if (!droppedFile.name.toLowerCase().endsWith('.pdf')) {
        setError('Please drop a valid PDF file.');
        return;
      }
      const buffer = await droppedFile.arrayBuffer();
      const droppedPath = 'path' in droppedFile && typeof droppedFile.path === 'string'
        ? droppedFile.path
        : null;
      setFilePath(droppedPath);
      setFileName(droppedFile.name);
      setOutputName(`Numbered_${droppedFile.name}`);
      setFileData(new Uint8Array(buffer));
      setResult(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dropped file');
    }
  };

  const handleDropPaths = useCallback(async (paths: string[]) => {
    const pdfPath = paths.find((p) => p.toLowerCase().endsWith('.pdf'));
    if (!pdfPath || !window.solsticeAPI?.pdfReadFile) return;
    const readRes = await window.solsticeAPI.pdfReadFile(pdfPath).catch(() => null);
    if (readRes?.success && readRes.data) {
      const name = pdfPath.split(/[/\\]/).pop() || 'Document.pdf';
      setFilePath(pdfPath);
      setFileName(name);
      setOutputName(`Numbered_${name}`);
      setFileData(new Uint8Array(readRes.data));
      setResult(null);
      setError(null);
    }
  }, []);

  useTauriFileDrop({
    enabled: !fileData && !result,
    onDropPaths: handleDropPaths,
  });

  const handleApplyPageNumbers = async () => {
    if (!fileData) {
      setError('Please select a PDF document to number.');
      return;
    }
    setIsProcessing(true);
    setError(null);

    try {
      if (!window.solsticeAPI?.pdfPageNumbers) return;
      const res = await window.solsticeAPI.pdfPageNumbers({
        filePath: filePath || undefined,
        fileData: !filePath ? Array.from(fileData) : undefined,
        position: options.position,
        format: options.format,
        startOffset: options.startOffset,
        firstNumber: options.firstNumber,
        fontSize: options.fontSize,
        margin: options.margin,
        colorHex: options.colorHex,
        fontFamily: options.fontFamily,
        pagesScope: options.pagesScope,
        customPages: options.customPages,
        defaultName: outputName.trim().endsWith('.pdf') ? outputName.trim() : `${outputName.trim()}.pdf`,
      });

      if (res.success && res.filePath && res.data) {
        const stampedBytes = new Uint8Array(res.data);
        setResult({
          filePath: res.filePath,
          fileName: res.fileName || outputName,
          pageCount: res.pageCount || totalPages,
          fileSize: stampedBytes.byteLength,
          data: stampedBytes,
        });
      } else if (!res.canceled && res.error) {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stamp page numbers');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#fafafa] flex flex-col select-none">
      {/* Top Header */}
      <header className="h-14 border-b border-stone-200/80 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Back to Tools"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50/90 border border-rose-200/70 text-rose-700 flex items-center justify-center shadow-2xs">
              <Hash className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 leading-tight">Page Numbers</h2>
              <p className="text-[10px] text-slate-400">Standardized header or footer page stamps</p>
            </div>
          </div>
        </div>

        {fileData && (
          <div className="flex items-center gap-2.5">
            <div className="px-3 py-1 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-stone-700 font-medium flex items-center gap-2">
              <span className="truncate max-w-[200px]">{fileName}</span>
              {totalPages > 0 && <span className="text-stone-400 font-mono text-[11px]">({totalPages}p)</span>}
            </div>
            <button
              onClick={handleSelectFile}
              className="px-2.5 py-1 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-medium text-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-stone-500" />
              <span>Change PDF</span>
            </button>
          </div>
        )}
      </header>

      {/* Main View Area */}
      {result ? (
        <PdfPageNumberResultView
          result={result}
          onReset={() => {
            setResult(null);
            setError(null);
          }}
          onClose={onClose}
          onOpenDocument={onOpenDocument}
        />
      ) : !fileData ? (
        <PdfPageNumberEmptyState onSelectFile={handleSelectFile} onDropFile={handleDropFile} />
      ) : (
        <>
          <div className="flex-1 flex overflow-hidden">
            <PdfPageNumberPreview docProxy={docProxy} totalPages={totalPages} options={options} />
            <PdfPageNumberInspector options={options} onChange={setOptions} totalPages={totalPages} />
          </div>

          {/* Sticky Bottom Action Bar */}
          <footer className="h-16 border-t border-stone-200/80 bg-white/95 px-6 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <span className="font-semibold text-stone-700 capitalize">{options.position.replace('-', ' ')}</span>
              <span>•</span>
              <span className="font-mono text-stone-600 font-medium">{options.format}</span>
              <span>•</span>
              <span className="text-stone-500">{options.fontSize}pt {options.fontFamily}</span>
            </div>

            <div className="flex items-center gap-3">
              {error && <span className="text-xs text-rose-600 mr-2">{error}</span>}
              <input
                type="text"
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
                className="w-48 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs text-slate-800 font-mono focus:outline-none focus:border-rose-300"
                placeholder="Output file name"
              />
              <button
                onClick={handleApplyPageNumbers}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-[#ffd8e4] hover:bg-[#f6cad7] text-[#3b0918] font-bold text-xs tracking-wide shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Hash className="w-3.5 h-3.5" />}
                <span>{isProcessing ? 'Adding Numbers...' : 'Add Page Numbers'}</span>
              </button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
};
