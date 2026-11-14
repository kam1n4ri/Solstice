import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Shield,
  FileText,
  FolderOpen,
} from 'lucide-react';
import { PdfToolModal } from './PdfToolModal';
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
  const [fileName, setFileName] = useState<string>(currentDocument?.fileName || 'Document.pdf');

  // Protect fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select file');
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
        defaultName: `Protected_${fileName}`,
      });

      if (res.success && res.filePath) {
        setResult({
          msg: `Document encrypted with AES-256 security!`,
          filePath: res.filePath,
          fileName: res.fileName || `Protected_${fileName}`,
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
        defaultName: `Unlocked_${fileName}`,
      });

      if (res.success && res.filePath) {
        setResult({
          msg: `Security restrictions removed! Document can now be opened without passwords.`,
          filePath: res.filePath,
          fileName: res.fileName || `Unlocked_${fileName}`,
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
    <PdfToolModal
      title="PDF Security & Encryption"
      description="Protect documents with AES-256 encryption, or permanently remove password restrictions"
      icon={Shield}
      onClose={onClose}
    >
      {result ? (
        <PdfSecurityResultView result={result} onOpenDocument={onOpenDocument} />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-stone-100/80 border border-stone-200/60">
            <button
              onClick={() => setTab('protect')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'protect' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              <span>Protect / Encrypt</span>
            </button>
            <button
              onClick={() => setTab('unlock')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'unlock' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Unlock className="w-3.5 h-3.5 text-emerald-700" />
              <span>Unlock / Decrypt</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-stone-200/80 shadow-2xs">
            <div className="flex items-center gap-2.5 truncate pr-2">
              <FileText className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <p className="text-xs font-semibold text-slate-800 truncate">{fileName}</p>
            </div>
            <button
              onClick={handleSelectFile}
              className="px-2.5 py-1.5 rounded-xl border border-stone-200/80 hover:bg-stone-50 text-xs font-medium text-slate-700 flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>Change PDF</span>
            </button>
          </div>

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

          {error && <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">{error}</div>}
        </div>
      )}
    </PdfToolModal>
  );
};
