import React from 'react';
import { Lock, Unlock, FileText, AlertCircle } from 'lucide-react';
import { ActivePdfDocument } from '../PdfContainer';
import { PdfSecurityResultView } from './PdfSecurityResultView';
import { PdfProtectForm, PdfUnlockForm } from './PdfSecurityForms';
import { PdfSecurityEmptyState } from './PdfSecurityEmptyState';
import { PdfSecurityHeader } from './PdfSecurityHeader';
import { usePdfSecurityState } from './usePdfSecurityState';

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
  const {
    tab, setTab,
    fileData, fileName,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    unlockPassword, setUnlockPassword,
    showPassword, setShowPassword,
    isProcessing, error, setError,
    isDragOver, setIsDragOver,
    result,
    handleUseCurrentDocument,
    handleSelectFile,
    handleDrop,
    handleProtect,
    handleUnlock,
    handleReset,
  } = usePdfSecurityState(currentDocument);

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
              onClick={handleReset}
              className="mt-3 w-full py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-stone-50 transition-colors text-center cursor-pointer"
            >
              {tab === 'protect' ? 'Protect Another Document' : 'Unlock Another Document'}
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
                onClick={() => {
                  setTab('protect');
                  setError(null);
                }}
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
                onClick={() => {
                  setTab('unlock');
                  setError(null);
                }}
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
                password={unlockPassword}
                setPassword={setUnlockPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                onUnlock={handleUnlock}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
