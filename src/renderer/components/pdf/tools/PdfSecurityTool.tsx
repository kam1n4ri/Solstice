import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Shield,
  FileText,
  FolderOpen,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { ActivePdfDocument } from '../PdfContainer';
import { PdfSecurityResultView } from './PdfSecurityResultView';
import { PdfProtectForm, PdfUnlockForm } from './PdfSecurityForms';

interface PdfSecurityToolProps {
  onClose: () => void;
  onOpenDocument: (filePath: string, data: Uint8Array, fileName: string) => void;
  currentDocument?: ActivePdfDocument | null;
}

export const PdfSecurityTool: React.FC<PdfSecurityToolProps> = ({
  onClose,
  onOpenDocument,
  currentDocument,
}) => {
  const [tab, setTab] = useState<'protect' | 'unlock'>('protect');
  const [filePath, setFilePath] = useState<string | null>(currentDocument?.filePath || null);
  const [fileData, setFileData] = useState<Uint8Array | null>(currentDocument?.data || null);
  const [fileName, setFileName] = useState<string>(currentDocument?.fileName || '');

  // Protect fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [result, setResult] = useState<{
    msg: string;
    filePath: string;
    fileName: string;
    data?: Uint8Array;
  } | null>(null);

  const handleSelectFile = async () => {
    try {
      if (!window.solsticeAPI?.pdfSelectFiles || !window.solsticeAPI.pdfReadFile) return;
      const res = await window.solsticeAPI.pdfSelectFiles({ multiple: false, title: 'Select PDF Document' });
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
      setError(err instanceof Error ? err.message : 'Failed to select file');
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

  const handleProtect = async () => {
    if (!fileData) {
      setError('Please select a PDF document to encrypt.');
      return;
    }
    if (!password || password.length < 4) {
      setError('Please enter a password with at least 4 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      if (!window.solsticeAPI?.pdfProtect) return;
      const res = await window.solsticeAPI.pdfProtect({
        filePath: filePath || undefined,
        fileData: !filePath ? Array.from(fileData) : undefined,
        password,
        defaultName: `Protected_${fileName || 'document.pdf'}`,
      });

      if (res.success && res.filePath) {
        setResult({
          msg: `Document encrypted with AES-256 security!`,
          filePath: res.filePath,
          fileName: res.fileName || `Protected_${fileName || 'document.pdf'}`,
        });
      } else if (!res.canceled && res.error) {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to encrypt document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnlock = async () => {
    if (!fileData) {
      setError('Please select an encrypted PDF document to unlock.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      if (!window.solsticeAPI?.pdfUnlock) return;
      const res = await window.solsticeAPI.pdfUnlock({
        filePath: filePath || undefined,
        fileData: !filePath ? Array.from(fileData) : undefined,
        defaultName: `Unlocked_${fileName || 'document.pdf'}`,
      });

      if (res.success && res.filePath) {
        setResult({
          msg: `Security restrictions removed! Document can now be opened without passwords.`,
          filePath: res.filePath,
          fileName: res.fileName || `Unlocked_${fileName || 'document.pdf'}`,
          data: res.data ? new Uint8Array(res.data) : undefined,
        });
      } else if (!res.canceled && res.error) {
        setError(res.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock document.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#fafbfc] flex flex-col font-sans select-none animate-in fade-in duration-150 overflow-hidden">
      {/* Top Header */}
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
            <span className="text-xs font-bold text-slate-800">PDF Security & Encryption</span>
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

      {/* Main Body */}
      {result ? (
        <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200/90 shadow-xl p-6">
            <PdfSecurityResultView result={result} onOpenDocument={onOpenDocument} />
            <button
              onClick={() => {
                setResult(null);
                setFileData(null);
                setFileName('');
                setFilePath(null);
              }}
              className="mt-3 w-full py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-stone-50 transition-colors text-center cursor-pointer"
            >
              Protect Another Document
            </button>
          </div>
        </div>
      ) : !fileData ? (
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
              <Shield className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-stone-800">Select PDF to Protect or Unlock</h3>
            <p className="text-xs text-stone-500 mt-1.5 max-w-md">
              Drag and drop your PDF here, or click to upload. Apply industry-standard AES-256 encryption, or permanently strip existing restrictions.
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
        <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-stone-200/90 shadow-xl p-6 space-y-4">
            {/* Mode Toggle Bar: Protect vs Unlock */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-stone-100/80 border border-stone-200/60">
              <button
                type="button"
                onClick={() => setTab('protect')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  tab === 'protect'
                    ? 'bg-white text-slate-900 shadow-2xs border border-stone-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-rose-600" />
                <span>Protect / Encrypt</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('unlock')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  tab === 'unlock'
                    ? 'bg-white text-slate-900 shadow-2xs border border-stone-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Unlock / Decrypt</span>
              </button>
            </div>

            {/* Document Info Pill */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50/70 border border-stone-200/60">
              <FileText className="w-4 h-4 text-rose-600 shrink-0" />
              <div className="truncate flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate">{fileName}</p>
                <p className="text-[10px] text-slate-400">Ready for {tab === 'protect' ? 'encryption' : 'decryption'}</p>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {tab === 'protect' ? (
              <PdfProtectForm
                hasFile={Boolean(fileData)}
                isProcessing={isProcessing}
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                onProtect={handleProtect}
              />
            ) : (
              <PdfUnlockForm
                hasFile={Boolean(fileData)}
                isProcessing={isProcessing}
                onUnlock={handleUnlock}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
