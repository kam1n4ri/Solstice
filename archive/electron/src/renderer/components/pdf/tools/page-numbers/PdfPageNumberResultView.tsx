import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileText,
  FolderCheck,
  RotateCcw,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { PageNumberResultData } from './PdfPageNumberTypes';

interface PdfPageNumberResultViewProps {
  result: PageNumberResultData;
  onReset: () => void;
  onClose: () => void;
  onOpenDocument: (filePath: string, data: Uint8Array, fileName: string) => void;
}

export const PdfPageNumberResultView: React.FC<PdfPageNumberResultViewProps> = ({
  result,
  onReset,
  onClose,
  onOpenDocument,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [downloadedPath, setDownloadedPath] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const formatSize = (bytes?: number): string => {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = async () => {
    if (!window.solsticeAPI?.pdfExportFile) return;
    setIsExporting(true);
    setExportError(null);
    try {
      const res = await window.solsticeAPI.pdfExportFile({
        data: result.data,
        defaultName: result.fileName,
      });
      if (res.success && res.filePath) {
        setDownloadedPath(res.filePath);
      } else if (!res.canceled && res.error) {
        setExportError(res.error);
      }
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Failed to download PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleReveal = () => {
    const pathToReveal = downloadedPath || result.filePath;
    if (pathToReveal && window.solsticeAPI?.revealInFolder) {
      window.solsticeAPI.revealInFolder(pathToReveal);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in-50 duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-stone-200/80 p-8 shadow-sm flex flex-col items-center text-center">
        {/* Success Icon Badge */}
        <div className="w-16 h-16 rounded-3xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-600 flex items-center justify-center mb-4 shadow-2xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-stone-800 tracking-tight">Page Numbers Added Successfully!</h3>
        <p className="text-xs text-stone-500 mt-1 max-w-sm">
          Your document pages have been stamped with clean standardized numbering.
        </p>

        {/* Document Details Card */}
        <div className="w-full mt-6 p-4 rounded-2xl bg-stone-50/70 border border-stone-200/70 flex items-center justify-between text-left">
          <div className="flex items-center gap-3 min-w-0 pr-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0 text-rose-500">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-stone-800 truncate" title={result.fileName}>
                {result.fileName}
              </p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                {result.pageCount} {result.pageCount === 1 ? 'page' : 'pages'} • {formatSize(result.fileSize)}
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-semibold flex-shrink-0">
            Ready
          </span>
        </div>

        {exportError && (
          <div className="w-full mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600 text-left">
            {exportError}
          </div>
        )}

        {/* Primary Download Button */}
        <div className="w-full mt-6 flex flex-col gap-2.5">
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="w-full py-3 px-5 rounded-2xl bg-[#ffd8e4] hover:bg-[#f6cad7] text-[#3b0918] font-bold text-xs tracking-wide shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-[#3b0918]" />
            )}
            <span>{downloadedPath ? 'Download Again' : 'Download Numbered PDF'}</span>
          </button>

          {downloadedPath && (
            <div className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60 text-xs text-emerald-800">
              <span className="truncate pr-2 text-[11px]">Saved to {downloadedPath}</span>
              <button
                onClick={handleReveal}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1 flex-shrink-0 cursor-pointer"
              >
                <FolderCheck className="w-3.5 h-3.5" />
                <span>Show in folder</span>
              </button>
            </div>
          )}
        </div>

        {/* Secondary Options */}
        <div className="w-full mt-3 pt-4 border-t border-stone-100 flex items-center justify-center gap-2">
          <button
            onClick={() => onOpenDocument(downloadedPath || result.filePath, result.data, result.fileName)}
            className="px-4 py-2 rounded-xl bg-white border border-stone-200/80 hover:bg-stone-50 text-stone-700 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-rose-500" />
            <span>Open in Studio</span>
          </button>

          <button
            onClick={handleReveal}
            className="px-4 py-2 rounded-xl bg-white border border-stone-200/80 hover:bg-stone-50 text-stone-700 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FolderCheck className="w-3.5 h-3.5 text-stone-500" />
            <span>Reveal in Folder</span>
          </button>
        </div>

        {/* Footer Actions */}
        <div className="w-full mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Tools</span>
          </button>

          <button
            onClick={onReset}
            className="text-xs font-semibold text-stone-700 hover:text-rose-600 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Number Another PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
