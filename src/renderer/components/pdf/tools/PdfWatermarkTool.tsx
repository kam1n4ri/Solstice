import React, { useState, useEffect } from 'react';
import { ArrowLeft, Stamp, FolderOpen } from 'lucide-react';
import { ActivePdfDocument } from '../PdfContainer';
import { pdfjsLib, PDFDocumentProxy } from '../pdfjsSetup';
import { WatermarkOptions, WatermarkResultData } from './watermark/PdfWatermarkTypes';
import { PdfWatermarkEmptyState } from './watermark/PdfWatermarkEmptyState';
import { PdfWatermarkPreview } from './watermark/PdfWatermarkPreview';
import { PdfWatermarkInspector } from './watermark/PdfWatermarkInspector';
import { PdfWatermarkResultView } from './watermark/PdfWatermarkResultView';
import { PdfWatermarkFooter } from './watermark/PdfWatermarkFooter';

interface PdfWatermarkToolProps {
  onClose: () => void;
  onOpenDocument: (filePath: string, data: Uint8Array, fileName: string) => void;
  currentDocument?: ActivePdfDocument | null;
}

export const PdfWatermarkTool: React.FC<PdfWatermarkToolProps> = ({
  onClose,
  onOpenDocument,
  currentDocument,
}) => {
  const [filePath, setFilePath] = useState<string | null>(currentDocument?.filePath || null);
  const [fileData, setFileData] = useState<Uint8Array | null>(currentDocument?.data || null);
  const [fileName, setFileName] = useState<string>(currentDocument?.fileName || 'Document.pdf');
  const [totalPages, setTotalPages] = useState<number>(0);
  const [docProxy, setDocProxy] = useState<PDFDocumentProxy | null>(null);

  const [options, setOptions] = useState<WatermarkOptions>({
    type: 'text',
    text: 'CONFIDENTIAL',
    fontSize: 48,
    opacity: 0.22,
    rotation: 45,
    colorHex: '#64748b',
    imageScale: 0.35,
    xPercent: 50,
    yPercent: 50,
    pagesScope: 'all',
    customPages: '',
  });

  const [outputName, setOutputName] = useState<string>(`Watermarked_${fileName}`);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WatermarkResultData | null>(null);

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
      console.warn('[Watermark] Failed to parse document proxy:', err);
    });
    return () => {
      isCancelled = true;
    };
  }, [fileData]);

  const handleSelectFile = async () => {
    try {
      if (!window.solsticeAPI?.pdfSelectFiles || !window.solsticeAPI.pdfReadFile) return;
      const res = await window.solsticeAPI.pdfSelectFiles({ multiple: false, title: 'Select PDF to Watermark' });
      if (!res.canceled && res.files.length > 0) {
        const file = res.files[0];
        const readRes = await window.solsticeAPI.pdfReadFile(file.filePath);
        if (readRes.success && readRes.data) {
          setFilePath(file.filePath);
          setFileName(file.fileName);
          setOutputName(`Watermarked_${file.fileName}`);
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
      const buffer = await droppedFile.arrayBuffer();
      const droppedPath = 'path' in droppedFile && typeof droppedFile.path === 'string'
        ? droppedFile.path
        : droppedFile.name;
      setFilePath(droppedPath);
      setFileName(droppedFile.name);
      setOutputName(`Watermarked_${droppedFile.name}`);
      setFileData(new Uint8Array(buffer));
      setResult(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dropped file');
    }
  };

  const handleApplyWatermark = async () => {
    if (!fileData) {
      setError('Please select a PDF document to watermark.');
      return;
    }
    setIsProcessing(true);
    setError(null);

    try {
      if (!window.solsticeAPI?.pdfWatermark) return;
      const cleanName = outputName.trim().endsWith('.pdf')
        ? outputName.trim()
        : `${outputName.trim() || 'Watermarked_Document'}.pdf`;

      const res = await window.solsticeAPI.pdfWatermark({
        filePath: filePath || undefined,
        fileData: !filePath ? Array.from(fileData) : undefined,
        type: options.type,
        text: options.type === 'text' ? options.text : undefined,
        fontSize: options.fontSize,
        opacity: options.opacity,
        rotation: options.rotation,
        colorHex: options.colorHex,
        imagePath: options.imagePath,
        imageScale: options.imageScale,
        xPercent: options.xPercent,
        yPercent: options.yPercent,
        pagesScope: options.pagesScope,
        customPages: options.customPages,
        defaultName: cleanName,
      });

      if (res.success && res.filePath && res.data) {
        setResult({
          filePath: res.filePath,
          fileName: res.fileName || cleanName,
          pageCount: res.pageCount || totalPages,
          fileSize: res.data.length,
          data: new Uint8Array(res.data),
        });
      } else if (!res.canceled && res.error) {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Watermarking failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#fafbfc] flex flex-col font-sans select-none animate-in fade-in-50 duration-150">
      {/* Top Header */}
      <header className="h-14 px-6 border-b border-stone-200/80 bg-white/80 backdrop-blur-md flex items-center justify-between flex-shrink-0">
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
              <Stamp className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-stone-800 tracking-tight">Watermark PDF</h2>
              <p className="text-[10px] text-stone-400 -mt-0.5">Stamp customizable text across document pages</p>
            </div>
          </div>
        </div>

        {fileData && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-stone-600 bg-stone-100/80 px-2.5 py-1 rounded-lg border border-stone-200/60 max-w-xs truncate">
              {fileName} ({totalPages} pages)
            </span>
            <button
              onClick={handleSelectFile}
              className="px-2.5 py-1 rounded-lg border border-stone-200/80 hover:bg-stone-50 text-stone-600 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5 text-stone-400" />
              <span>Change PDF</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      {result ? (
        <PdfWatermarkResultView
          result={result}
          onReset={() => {
            setResult(null);
            setFileData(null);
            setFilePath(null);
          }}
          onClose={onClose}
          onOpenDocument={onOpenDocument}
        />
      ) : !fileData ? (
        <PdfWatermarkEmptyState onSelectFile={handleSelectFile} onDropFile={handleDropFile} />
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            <PdfWatermarkPreview
              docProxy={docProxy}
              totalPages={totalPages}
              options={options}
              onChangePosition={(x, y) =>
                setOptions((prev) => ({ ...prev, xPercent: x, yPercent: y }))
              }
            />

            <PdfWatermarkInspector
              options={options}
              onChangeOptions={setOptions}
              totalPages={totalPages}
            />
          </div>

          <PdfWatermarkFooter
            outputName={outputName}
            setOutputName={setOutputName}
            error={error}
            totalPages={totalPages}
            isProcessing={isProcessing}
            canApply={
              options.type === 'text'
                ? Boolean(options.text.trim())
                : Boolean(options.imageDataUrl || options.imagePath)
            }
            onApplyWatermark={handleApplyWatermark}
          />
        </div>
      )}
    </div>
  );
};
