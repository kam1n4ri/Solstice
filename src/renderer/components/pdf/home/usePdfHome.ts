import React, { useState, useEffect, useCallback } from 'react';
import { PDFDocument } from 'pdf-lib';
import { PdfHomeTab } from './PdfHomeSidebar';
import { useTauriFileDrop } from '@/lib/useTauriFileDrop';
import {
  RecentPdfItem,
  fetchMergedRecentPdfs,
  toggleStarredPdf,
  removeRecentPdfAsync,
  saveRecentPdf,
} from './PdfRecentStorage';

interface UsePdfHomeOptions {
  onDocumentSelected: (filePath: string | null, data: Uint8Array, fileName: string) => void;
  disableFileDrop?: boolean;
}

export function usePdfHome({ onDocumentSelected, disableFileDrop = false }: UsePdfHomeOptions) {
  const [activeTab, setActiveTab] = useState<PdfHomeTab>('home');
  const [recentItems, setRecentItems] = useState<RecentPdfItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOpening, setIsOpening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<RecentPdfItem | null>(null);

  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(() => setErrorMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  const loadRecents = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await fetchMergedRecentPdfs();
      setRecentItems(items);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecents();
    window.addEventListener('focus', loadRecents);
    return () => window.removeEventListener('focus', loadRecents);
  }, [loadRecents]);

  const handleOpenFile = async () => {
    if (isOpening) return;
    setIsOpening(true);
    try {
      if (!window.solsticeAPI?.pdfOpenFile) return;
      const result = await window.solsticeAPI.pdfOpenFile();
      if (result.canceled) return;
      if (!result.success || !result.filePath || !result.data) {
        setErrorMessage(result.error || 'Failed to open selected PDF document.');
        return;
      }

      const bytes = new Uint8Array(result.data);
      const fileName = result.fileName || 'Untitled.pdf';

      saveRecentPdf({
        id: result.filePath,
        title: fileName.replace(/\.pdf$/i, ''),
        filePath: result.filePath,
        lastModified: Date.now(),
        fileSize: bytes.byteLength,
      });

      onDocumentSelected(result.filePath, bytes, fileName);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to open PDF file.');
    } finally {
      setIsOpening(false);
    }
  };

  const handleCreateBlank = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      pdfDoc.addPage([595.28, 841.89]);
      const pdfBytes = await pdfDoc.save();
      onDocumentSelected(null, pdfBytes, 'Untitled.pdf');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create blank PDF.');
    }
  };

  const openPdfFromNativePath = useCallback(
    async (nativePath: string) => {
      if (!window.solsticeAPI?.pdfOpenFile) return false;
      const result = await window.solsticeAPI.pdfOpenFile(nativePath);
      if (result.success && result.filePath && result.data) {
        const bytes = new Uint8Array(result.data);
        const fileName = result.fileName || nativePath.split(/[/\\]/).pop() || 'Untitled.pdf';
        saveRecentPdf({
          id: result.filePath,
          title: fileName.replace(/\.pdf$/i, ''),
          filePath: result.filePath,
          lastModified: Date.now(),
          fileSize: bytes.byteLength,
        });
        onDocumentSelected(result.filePath, bytes, fileName);
        return true;
      }
      if (!result.canceled && result.error) {
        setErrorMessage(result.error);
      }
      return false;
    },
    [onDocumentSelected]
  );

  const handleDropFiles = async (files: FileList) => {
    const file = files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage(`"${file.name}" is not a valid PDF file.`);
      return;
    }

    try {
      const nativePath = (file as unknown as { path?: string }).path || null;
      if (nativePath && (await openPdfFromNativePath(nativePath))) {
        return;
      }

      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const fileName = file.name;

      if (window.solsticeAPI?.pdfSaveFile) {
        const saveRes = await window.solsticeAPI.pdfSaveFile({
          fileName,
          title: fileName.replace(/\.pdf$/i, ''),
          data: bytes,
        });
        if (saveRes.success && saveRes.filePath) {
          const resName = saveRes.fileName || fileName;
          saveRecentPdf({
            id: saveRes.filePath,
            title: resName.replace(/\.pdf$/i, ''),
            filePath: saveRes.filePath,
            lastModified: Date.now(),
            fileSize: bytes.byteLength,
          });
          onDocumentSelected(saveRes.filePath, bytes, resName);
          return;
        }
      }

      onDocumentSelected(null, bytes, fileName);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to open dropped PDF file.');
    }
  };

  useTauriFileDrop({
    enabled: !disableFileDrop && activeTab === 'home',
    onDropPaths: (paths) => {
      const pdfPath = paths.find((p) => p.toLowerCase().endsWith('.pdf'));
      if (pdfPath) {
        openPdfFromNativePath(pdfPath).catch((err) => {
          setErrorMessage(err instanceof Error ? err.message : 'Failed to open dropped PDF.');
        });
      } else if (paths.length > 0) {
        setErrorMessage('Please drop a valid PDF (.pdf) file.');
      }
    },
  });

  const handleOpenItem = async (item: RecentPdfItem) => {
    if (isOpening) return;
    setIsOpening(true);
    try {
      if (item.filePath && window.solsticeAPI?.pdfOpenFile) {
        const result = await window.solsticeAPI.pdfOpenFile(item.filePath);
        if (result.success && result.data) {
          const bytes = new Uint8Array(result.data);
          const targetPath = result.filePath || item.filePath;
          const fileNameOnDisk = result.fileName || item.filePath.split(/[/\\]/).pop() || `${item.title}.pdf`;
          saveRecentPdf({
            ...item,
            id: targetPath,
            filePath: targetPath,
            lastModified: Date.now(),
            fileSize: bytes.byteLength,
          });
          onDocumentSelected(targetPath, bytes, fileNameOnDisk);
          return;
        }

        const reason = result.error || 'The file may have been moved, renamed, or deleted.';
        setErrorMessage(`Unable to open "${item.title}": ${reason}`);
        await removeRecentPdfAsync(item.id, item.filePath, false);
        await loadRecents();
        return;
      }

      setErrorMessage(`Unable to open "${item.title}": Missing file path.`);
      await removeRecentPdfAsync(item.id, item.filePath, false);
      await loadRecents();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : `Failed to open "${item.title}".`);
    } finally {
      setIsOpening(false);
    }
  };

  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStarredPdf(id);
    loadRecents();
  };

  const handleRevealFolder = (filePath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.solsticeAPI?.revealInFolder?.(filePath);
  };

  const handleDeleteItem = (item: RecentPdfItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteItem(item);
  };

  const handleRemoveFromRecents = async (item: RecentPdfItem) => {
    await removeRecentPdfAsync(item.id, item.filePath, false);
    setPendingDeleteItem(null);
    await loadRecents();
  };

  const handleDeleteFromDisk = async (item: RecentPdfItem) => {
    await removeRecentPdfAsync(item.id, item.filePath, true);
    setPendingDeleteItem(null);
    await loadRecents();
  };

  return {
    activeTab, setActiveTab,
    recentItems, searchQuery, setSearchQuery,
    isLoading, isOpening, errorMessage, setErrorMessage,
    pendingDeleteItem, setPendingDeleteItem,
    handleOpenFile, handleCreateBlank, handleDropFiles,
    handleOpenItem, handleToggleStar, handleRevealFolder,
    handleDeleteItem, handleRemoveFromRecents, handleDeleteFromDisk,
  };
}
