import React, { useState } from 'react';
import { Lock, Unlock, FileText, AlertCircle } from 'lucide-react';
import { ActivePdfDocument } from '../PdfContainer';
import { PdfSecurityResultView } from './PdfSecurityResultView';
import { PdfProtectForm, PdfUnlockForm } from './PdfSecurityForms';
import { PdfSecurityEmptyState } from './PdfSecurityEmptyState';
import { PdfSecurityHeader } from './PdfSecurityHeader';

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
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileData, setFileData] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string>('');

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

  const handleUseCurrentDocument = () => {
    if (!currentDocument) return;
    setFilePath(currentDocument.filePath);
    setFileData(currentDocument.data);
    setFileName(currentDocument.fileName);
    setError(null);
  };

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
      } catch {
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
          msg: 'Document encrypted with AES-256 security!',
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
          msg: 'Security restrictions removed! Document can now be opened without passwords.',
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
      <PdfSecurityHeader
        onClose={onClose}
        fileName={fileName}
        hasFile={Boolean(fileData)}
        onSelectFile={handleSelectFile}
      />

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
        <PdfSecurityEmptyState
          onSelectFile={handleSelectFile}
          onDrop={handleDrop}
          isDragOver={isDragOver}
          setIsDragOver={setIsDragOver}
          error={error}
          currentDocument={currentDocument}
          onUseCurrentDocument={handleUseCurrentDocument}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-stone-200/90 shadow-xl p-6 space-y-4">
            {/* Mode Switcher */}
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
