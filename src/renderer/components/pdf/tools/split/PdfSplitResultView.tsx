import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileText,
  FolderCheck,
  RotateCcw,
  ArrowLeft,
  Loader2,
  FolderArchive,
} from 'lucide-react';
import { SplitResultFile } from './PdfSplitTypes';

interface PdfSplitResultViewProps {
  files: SplitResultFile[];
  onReset: () => void;
  onClose: () => void;
  onOpenDocument: (filePath: string, data: Uint8Array, fileName: string) => void;
}

export const PdfSplitResultView: React.FC<PdfSplitResultViewProps> = ({
  files,
  onReset,
  onClose,
  onOpenDocument,
}) => {
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [savedFolder, setSavedFolder] = useState<string | null>(null);
  const [downloadedPaths, setDownloadedPaths] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  const formatSize = (bytes?: number): string => {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownloadSingle = async (file: SplitResultFile, index: number) => {
    if (!window.solsticeAPI?.pdfExportFile || !file.data) return;
    setDownloadingIndex(index);
    setError(null);
    try {
      const res = await window.solsticeAPI.pdfExportFile({
        data: file.data,
        defaultName: file.fileName,
      });
      if (res.success && res.filePath) {
        setDownloadedPaths((prev) => ({ ...prev, [index]: res.filePath! }));
      } else if (!res.canceled && res.error) {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file.');
    } finally {
      setDownloadingIndex(null);
    }
  };

  const handleDownloadAll = async () => {
    if (!window.solsticeAPI?.pdfSaveFilesToFolder) return;
    setIsExportingAll(true);
    setError(null);
    try {
      const exportList = files
        .filter((f) => f.data && f.data.length > 0)
        .map((f) => ({ fileName: f.fileName, data: f.data! }));

      const res = await window.solsticeAPI.pdfSaveFilesToFolder({ files: exportList });
      if (res.success && res.folderPath) {
        setSavedFolder(res.folderPath);
      } else if (!res.canceled && res.error) {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save all partitions to folder.');
    } finally {
      setIsExportingAll(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto animate-in fade-in-50 duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-stone-200/80 p-8 shadow-sm flex flex-col items-center text-center">
        {/* Success Icon Badge */}
        <div className="w-16 h-16 rounded-3xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-600 flex items-center justify-center mb-4 shadow-2xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-stone-800 tracking-tight">PDF Split Successfully!</h3>
        <p className="text-xs text-stone-500 mt-1 max-w-md">
          Generated <span className="font-semibold text-stone-700">{files.length}</span> partition documents.
          You can download all parts to a chosen folder or save each partition individually.
        </p>

        {error && (
          <div className="w-full mt-4 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600 text-left">
            {error}
          </div>
        )}

        {/* Download All Button */}
        <div className="w-full mt-6">
          <button
            onClick={handleDownloadAll}
            disabled={isExportingAll}
            className="w-full py-3 px-5 rounded-2xl bg-[#ffd8e4] hover:bg-[#f6cad7] text-[#3b0918] font-bold text-xs tracking-wide shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isExportingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FolderArchive className="w-4 h-4 text-[#3b0918]" />
            )}
            <span>Download All {files.length} Partitions to Folder</span>
          </button>

          {savedFolder && (
            <div className="mt-2.5 flex items-center justify-between p-2.5 px-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60 text-xs text-emerald-800">
              <span className="truncate pr-2 text-[11px]">Saved all files to: {savedFolder}</span>
              <button
                onClick={() => window.solsticeAPI?.revealInFolder?.(savedFolder)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1 flex-shrink-0 cursor-pointer"
              >
                <FolderCheck className="w-3.5 h-3.5" />
                <span>Show in folder</span>
              </button>
            </div>
          )}
        </div>

        {/* Partitions List */}
        <div className="w-full mt-5 space-y-2 max-h-72 overflow-y-auto pr-1 text-left custom-scrollbar">
          {files.map((file, idx) => (
            <div
              key={`${file.fileName}-${idx}`}
              className="flex items-center justify-between p-3 rounded-2xl bg-stone-50/70 border border-stone-200/70 shadow-2xs group hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 pr-3">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0 text-rose-500">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-stone-800 truncate" title={file.fileName}>
                    {file.fileName}
                  </p>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    {file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'} • {formatSize(file.fileSize)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => handleDownloadSingle(file, idx)}
                  disabled={downloadingIndex === idx}
                  className="px-2.5 py-1.5 rounded-xl bg-white border border-stone-200/80 hover:bg-rose-50/80 hover:border-rose-200 text-stone-700 hover:text-rose-700 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  title="Download this partition"
                >
                  {downloadingIndex === idx ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-rose-500" />
                  )}
                  <span>{downloadedPaths[idx] ? 'Downloaded' : 'Download'}</span>
                </button>

                {file.data && (
                  <button
                    onClick={() => onOpenDocument(downloadedPaths[idx] || file.filePath, file.data!, file.fileName)}
                    className="p-1.5 rounded-xl bg-white border border-stone-200/80 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer shadow-2xs"
                    title="Open in Studio"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => window.solsticeAPI?.revealInFolder?.(downloadedPaths[idx] || file.filePath)}
                  className="p-1.5 rounded-xl bg-white border border-stone-200/80 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer shadow-2xs"
                  title="Reveal in folder"
                >
                  <FolderCheck className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="w-full mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
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
            <span>Split Another PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
