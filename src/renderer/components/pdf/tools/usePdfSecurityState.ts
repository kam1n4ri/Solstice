import React, { useState, useCallback } from 'react';
import { ActivePdfDocument } from '../PdfContainer';
import { useTauriFileDrop } from '@/lib/useTauriFileDrop';

export interface PdfSecurityResultState {
  msg: string;
  filePath: string;
  fileName: string;
  data?: Uint8Array;
}

export function usePdfSecurityState(currentDocument?: ActivePdfDocument | null) {
  const [tab, setTab] = useState<'protect' | 'unlock'>('protect');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileData, setFileData] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [unlockPassword, setUnlockPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [result, setResult] = useState<PdfSecurityResultState | null>(null);

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
    enabled: !fileData && !result,
    onDropPaths: handleDropPaths,
    onDragChange: setIsDragOver,
  });

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
        password: unlockPassword || undefined,
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

  const handleReset = () => {
    setResult(null);
    setFileData(null);
    setFileName('');
    setFilePath(null);
    setPassword('');
    setConfirmPassword('');
    setUnlockPassword('');
    setError(null);
  };

  return {
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
  };
}
