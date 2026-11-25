import { useState, useRef, useCallback, useEffect } from 'react';
import { PdfAnnotation } from './annotations/PdfAnnotationTypes';
import { syncRecentPdf } from './pdfFileOpsHelper';

interface UsePdfFileOpsProps {
  initialFilePath: string | null;
  initialFileName: string;
  documentData: Uint8Array;
  annotations: PdfAnnotation[];
  exportDocumentWithAnnotations: (baseData: Uint8Array) => Promise<Uint8Array>;
}

export function usePdfFileOps({
  initialFilePath,
  initialFileName,
  documentData,
  annotations,
  exportDocumentWithAnnotations,
}: UsePdfFileOpsProps) {
  const [filePath, setFilePath] = useState<string | null>(initialFilePath);
  const [fileName, setFileName] = useState<string>(initialFileName);
  const [title, setTitleState] = useState<string>(
    initialFileName.replace(/\.pdf$/i, '') || 'Untitled document'
  );
  const [statusText, setStatusText] = useState<string>('All changes saved');

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMountRef = useRef<boolean>(true);
  const isDirtyRef = useRef<boolean>(false);
  const currentFilePathRef = useRef<string | null>(initialFilePath);
  currentFilePathRef.current = filePath;

  const currentTitleRef = useRef<string>(
    initialFileName.replace(/\.pdf$/i, '') || 'Untitled document'
  );

  const exportFnRef = useRef(exportDocumentWithAnnotations);
  exportFnRef.current = exportDocumentWithAnnotations;

  const documentDataRef = useRef(documentData);
  documentDataRef.current = documentData;

  // Directly renames the working copy file on disk and in recents store
  const performRename = useCallback(
    async (newTitle: string): Promise<{ success: boolean; newPath?: string }> => {
      const cleanTitle = newTitle.replace(/\.pdf$/i, '').trim();
      if (!cleanTitle) return { success: false };

      const oldPath = currentFilePathRef.current;
      if (!oldPath) return { success: false };

      const currentDiskBase = oldPath.split(/[/\\]/).pop()?.replace(/\.pdf$/i, '');
      if (currentDiskBase === cleanTitle) {
        return { success: true, newPath: oldPath };
      }

      if (window.solsticeAPI?.pdfRenameFile) {
        setStatusText('Saving...');
        const res = await window.solsticeAPI.pdfRenameFile({
          oldPath,
          newTitle: cleanTitle,
        });

        if (res.success && res.newPath) {
          const newPath = res.newPath;
          const newFileName = res.newFileName || `${cleanTitle}.pdf`;

          currentFilePathRef.current = newPath;
          currentTitleRef.current = cleanTitle;
          setFilePath(newPath);
          setFileName(newFileName);
          setTitleState(cleanTitle);

          syncRecentPdf(oldPath, newPath, cleanTitle);
          if (!isDirtyRef.current) {
            setStatusText('All changes saved');
          }
          return { success: true, newPath };
        }
        console.error('Failed to rename PDF:', res.error || 'Unknown error');
        setStatusText('Error saving');
      }
      return { success: false };
    },
    []
  );

  // Flush pending auto-save immediately to disk
  const flushAutoSave = useCallback(async (): Promise<boolean> => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    if (!isDirtyRef.current || !window.solsticeAPI?.pdfSaveFile) {
      return true;
    }

    try {
      setStatusText('Saving...');

      const targetTitle = currentTitleRef.current.trim() || 'Untitled';
      const oldPath = currentFilePathRef.current;
      const targetPath = oldPath || undefined;
      const targetName = `${targetTitle}.pdf`;

      // Embed any vector marks, highlights directly into PDF binary
      const finalBytes = await exportFnRef.current(documentDataRef.current);

      // Pass native Uint8Array buffer directly (zero-copy in Electron IPC)
      const res = await window.solsticeAPI.pdfSaveFile({
        filePath: targetPath,
        fileName: targetName,
        title: targetTitle,
        data: finalBytes,
      });

      const actualPath = res.filePath || targetPath;
      if (res.success && actualPath) {
        if (actualPath !== oldPath) {
          setFilePath(actualPath);
          setFileName(res.fileName || targetName);
          currentFilePathRef.current = actualPath;
        }

        syncRecentPdf(oldPath, actualPath, targetTitle, finalBytes.length);
        isDirtyRef.current = false;
        setStatusText('All changes saved');
        return true;
      }

      console.error('Failed to auto-save PDF:', res.error || 'Missing target path or unknown save error');
      setStatusText('Error saving');
      return false;
    } catch (err) {
      console.error('Failed to auto-save PDF:', err);
      setStatusText('Error saving');
      return false;
    }
  }, [performRename]);

  const flushAutoSaveRef = useRef(flushAutoSave);
  flushAutoSaveRef.current = flushAutoSave;

  const scheduleAutoSave = useCallback(() => {
    isDirtyRef.current = true;
    setStatusText('Unsaved changes');
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    // 2500ms debounce ensures drawing / undo interactions are instantaneous
    autoSaveTimerRef.current = setTimeout(() => {
      flushAutoSaveRef.current?.();
    }, 2500);
  }, []);

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitleState(newTitle);
      currentTitleRef.current = newTitle;
      scheduleAutoSave();
    },
    [scheduleAutoSave]
  );

  const commitTitleRename = useCallback(
    async (committedTitle?: string) => {
      const raw = committedTitle ?? currentTitleRef.current;
      const cleanTitle = raw.replace(/\.pdf$/i, '').trim();
      if (!cleanTitle) return;

      setTitleState(cleanTitle);
      currentTitleRef.current = cleanTitle;
      const renameRes = await performRename(cleanTitle);
      if (renameRes.success || isDirtyRef.current) {
        await flushAutoSaveRef.current();
      }
    },
    [performRename]
  );

  useEffect(() => {
    if (initialFilePath && initialFilePath !== currentFilePathRef.current) {
      setFilePath(initialFilePath);
      currentFilePathRef.current = initialFilePath;
    }
  }, [initialFilePath]);

  // Schedule auto-save on annotations change
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    scheduleAutoSave();
  }, [annotations, scheduleAutoSave]);

  // Flush on unmount ONLY (empty dependency array prevents premature flushing on every render)
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      flushAutoSaveRef.current?.();
    };
  }, []);

  const handleRevealFolder = useCallback(() => {
    const targetPath = currentFilePathRef.current || filePath;
    if (targetPath && window.solsticeAPI?.revealInFolder) {
      window.solsticeAPI.revealInFolder(targetPath);
    }
  }, [filePath]);

  const handleExport = useCallback(async () => {
    if (!window.solsticeAPI?.pdfExportFile) return;
    try {
      setStatusText('Exporting...');
      const finalBytes = await exportFnRef.current(documentDataRef.current);
      const defaultName = `${currentTitleRef.current.trim() || 'Document'}.pdf`;
      const res = await window.solsticeAPI.pdfExportFile({ data: finalBytes, defaultName });
      if (res.success && !res.canceled) {
        setStatusText('Exported successfully');
        setTimeout(() => {
          setStatusText(isDirtyRef.current ? 'Unsaved changes' : 'All changes saved');
        }, 3000);
      } else if (res.canceled) {
        setStatusText(isDirtyRef.current ? 'Unsaved changes' : 'All changes saved');
      } else {
        console.error('Failed to export PDF:', res.error || 'Unknown export error');
        setStatusText('Export failed');
      }
    } catch (err) {
      console.error('Failed to export PDF:', err);
      setStatusText('Export failed');
    }
  }, []);

  return {
    filePath, fileName, title,
    setTitle: handleTitleChange,
    commitTitleRename, statusText,
    handleRevealFolder, handleExport, flushAutoSave,
  };
}
