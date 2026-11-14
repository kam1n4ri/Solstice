import { useRef, useCallback, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { exportDocument } from './DocsExportHelper';
import { recordRecentDocFromEditor } from './home/DocsRecentStorage';
import {
  readFallbackFileInput,
  performAutoSave,
  performSaveDocument,
} from './docsFileOpsHelper';

interface UseDocsFileOpsProps {
  editor: Editor | null;
  title: string;
  setTitle: (t: string) => void;
  currentFilePath: string | null;
  setCurrentFilePath: (p: string | null) => void;
  setIsDirty: (d: boolean) => void;
  flashStatus: (msg: string) => void;
}

export function useDocsFileOps({
  editor,
  title,
  setTitle,
  currentFilePath,
  setCurrentFilePath,
  setIsDirty,
  flashStatus,
}: UseDocsFileOpsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const draftIdRef = useRef<string>(`draft-${Date.now()}`);
  const titleRef = useRef(title);
  const currentFilePathRef = useRef<string | null>(currentFilePath);
  const isDraftRef = useRef<boolean>(!currentFilePath);
  const isDirtyRef = useRef(false);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    currentFilePathRef.current = currentFilePath;
  }, [currentFilePath]);

  const flushAutoSave = useCallback(
    async (force = false): Promise<boolean> => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      if (!editor || (!isDirtyRef.current && !force)) return false;
      if (isSavingRef.current) {
        pendingSaveRef.current = true;
        return false;
      }

      isSavingRef.current = true;
      flashStatus('Saving...');
      try {
        const res = await performAutoSave({
          editor,
          title: titleRef.current || 'Untitled document',
          activePath: currentFilePathRef.current,
          draftId: draftIdRef.current,
        });

        if (res.success) {
          if (res.filePath && res.filePath !== currentFilePathRef.current) {
            currentFilePathRef.current = res.filePath;
            setCurrentFilePath(res.filePath);
          }
          isDirtyRef.current = false;
          setIsDirty(false);
          flashStatus('All changes saved');
          return true;
        }
        flashStatus('Save error');
        return false;
      } catch (err) {
        console.error('Auto-save exception:', err);
        flashStatus('Save error');
        return false;
      } finally {
        isSavingRef.current = false;
        if (pendingSaveRef.current) {
          pendingSaveRef.current = false;
          flushAutoSave(true);
        }
      }
    },
    [editor, setCurrentFilePath, setIsDirty, flashStatus]
  );

  const scheduleAutoSave = useCallback(() => {
    isDirtyRef.current = true;
    setIsDirty(true);
    flashStatus('Saving...');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => flushAutoSave(), 1000);
  }, [flushAutoSave, setIsDirty, flashStatus]);

  useEffect(() => () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
  }, []);

  const handleSaveDocument = useCallback(
    async (forceSaveAs = false): Promise<boolean> => {
      if (!editor) return false;
      flashStatus('Saving...');
      const isSaveAs = forceSaveAs || isDraftRef.current || !currentFilePathRef.current;
      const res = await performSaveDocument({
        editor,
        title: titleRef.current || 'Untitled document',
        activePath: currentFilePathRef.current,
        isSaveAs,
      });

      if (res.canceled) return false;
      if (res.success && res.filePath) {
        currentFilePathRef.current = res.filePath;
        setCurrentFilePath(res.filePath);
        isDraftRef.current = false;
        if (res.title) {
          titleRef.current = res.title;
          setTitle(res.title);
        }
        isDirtyRef.current = false;
        setIsDirty(false);
        flashStatus('Saved to disk');
        return true;
      }
      flashStatus(res.success ? 'Saved to disk' : 'Save error');
      return res.success;
    },
    [editor, setTitle, setCurrentFilePath, setIsDirty, flashStatus]
  );

  const handleSaveAsDocument = useCallback(async (): Promise<boolean> => {
    return handleSaveDocument(true);
  }, [handleSaveDocument]);

  const promptUnsavedGuard = useCallback(async (): Promise<boolean> => {
    if (!isDirtyRef.current) return true;
    if (window.solsticeAPI?.docsConfirmUnsaved) {
      const choice = await window.solsticeAPI.docsConfirmUnsaved();
      if (choice === 'cancel') return false;
      if (choice === 'save') {
        return await handleSaveDocument(false);
      }
      isDirtyRef.current = false;
      setIsDirty(false);
      return true;
    }
    await flushAutoSave(true);
    return true;
  }, [handleSaveDocument, flushAutoSave, setIsDirty]);

  const handleTitleChange = useCallback(
    async (newTitle: string) => {
      const trimmed = newTitle.trim() || 'Untitled document';
      if (trimmed === titleRef.current) return;
      titleRef.current = trimmed;
      setTitle(trimmed);
      isDirtyRef.current = true;
      setIsDirty(true);
      await flushAutoSave(true);
    },
    [setTitle, setIsDirty, flushAutoSave]
  );

  const handleNewDocument = useCallback(async () => {
    if (!editor) return;
    const canProceed = await promptUnsavedGuard();
    if (!canProceed) return;

    editor.commands.setContent('<p></p>');
    titleRef.current = 'Untitled document';
    setTitle('Untitled document');
    currentFilePathRef.current = null;
    setCurrentFilePath(null);
    isDraftRef.current = true;
    draftIdRef.current = `draft-${Date.now()}`;
    isDirtyRef.current = false;
    setIsDirty(false);
    flashStatus('New document created');
  }, [editor, promptUnsavedGuard, setTitle, setCurrentFilePath, setIsDirty, flashStatus]);

  const handleOpenFile = useCallback(
    async (targetPath?: string) => {
      if (!editor) return;
      const canProceed = await promptUnsavedGuard();
      if (!canProceed) return;

      if (!window.solsticeAPI?.docsOpenFile) {
        fileInputRef.current?.click();
        return;
      }

      const res = await window.solsticeAPI.docsOpenFile(targetPath);
      if (res.canceled) return;
      if (res.success && res.content !== undefined) {
        editor.commands.setContent(res.content);
        const loadedTitle = res.title || 'Untitled document';
        titleRef.current = loadedTitle;
        setTitle(loadedTitle);
        currentFilePathRef.current = res.filePath || null;
        setCurrentFilePath(res.filePath || null);
        isDraftRef.current = !res.filePath;
        draftIdRef.current = `draft-${Date.now()}`;
        isDirtyRef.current = false;
        setIsDirty(false);
        if (res.filePath) {
          recordRecentDocFromEditor(editor, loadedTitle, res.filePath, res.format);
        }
        flashStatus('Opened file');
      } else if (res.error) {
        flashStatus(`Error: ${res.error}`);
      }
    },
    [editor, promptUnsavedGuard, setTitle, setCurrentFilePath, setIsDirty, flashStatus]
  );

  const handleExport = useCallback(
    async (fmt: 'docx' | 'pdf' | 'md' | 'html' | 'txt') => {
      const activeTitle = titleRef.current || 'Untitled document';
      const res = await exportDocument(editor, activeTitle, fmt);
      if (res.canceled) return;
      flashStatus(res.success ? 'Exported successfully' : 'Export error');
    },
    [editor, flashStatus]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && editor) {
        readFallbackFileInput(file, editor, ({ title }) => {
          titleRef.current = title;
          setTitle(title);
          currentFilePathRef.current = null;
          setCurrentFilePath(null);
          isDraftRef.current = true;
          draftIdRef.current = `draft-${Date.now()}`;
          isDirtyRef.current = false;
          setIsDirty(false);
          flashStatus('Opened file');
        });
      }
    },
    [editor, setTitle, setCurrentFilePath, setIsDirty, flashStatus]
  );

  return {
    fileInputRef,
    handleNewDocument,
    handleOpenFile,
    handleSaveDocument,
    handleSaveAsDocument,
    handleExport,
    handleFileChange,
    handleTitleChange,
    flushAutoSave,
    scheduleAutoSave,
    promptUnsavedGuard,
  };
}