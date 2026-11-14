import { useState, useEffect, useCallback } from 'react';
import {
  RecentDocItem,
  fetchMergedRecentDocs,
  saveRecentDoc,
  removeRecentDocAsync,
} from './DocsRecentStorage';
import { DocTemplate, DOC_TEMPLATES } from './DocsTemplatesData';

export interface DocsOpenPayload {
  title: string;
  content: string;
  filePath?: string | null;
  format?: string;
  documentId?: string;
}

interface UseDocsHomeOptions {
  onOpenDocument: (payload: DocsOpenPayload) => void;
  initialErrorMessage?: string | null;
}

export function useDocsHome({ onOpenDocument, initialErrorMessage }: UseDocsHomeOptions) {
  const [documents, setDocuments] = useState<RecentDocItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreparing, setIsPreparing] = useState(false);
  const [preparingId, setPreparingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage || null);
  const [deletingDoc, setDeletingDoc] = useState<RecentDocItem | null>(null);

  // Auto-dismiss error alert after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const loadDocuments = useCallback(async () => {
    const docs = await fetchMergedRecentDocs();
    setDocuments(docs);
  }, []);

  useEffect(() => {
    loadDocuments();
    window.addEventListener('focus', loadDocuments);
    return () => window.removeEventListener('focus', loadDocuments);
  }, [loadDocuments]);

  const handleSelectTemplate = useCallback(
    (template: DocTemplate) => {
      if (isPreparing) return;
      setIsPreparing(true);
      setPreparingId(template.id);

      setTimeout(() => {
        onOpenDocument({
          title: template.title,
          content: template.content,
          format: 'html',
          documentId: `template-${template.id}-${Date.now()}`,
        });
        setIsPreparing(false);
        setPreparingId(null);
      }, 350);
    },
    [isPreparing, onOpenDocument]
  );

  const handleOpenFilePicker = useCallback(async () => {
    if (isPreparing) return;
    if (window.solsticeAPI?.docsOpenFile) {
      const res = await window.solsticeAPI.docsOpenFile();
      if (res.canceled) return;
      if (res.success && res.content !== undefined) {
        setIsPreparing(true);
        setPreparingId('picker');
        const title = res.title || 'Untitled document';
        const docFormat = (res.format || 'html') as DocsOpenPayload['format'];
        if (res.filePath) {
          saveRecentDoc({
            title,
            filePath: res.filePath,
            format: docFormat,
            snippet: res.content.replace(/<[^>]+>/g, ' ').slice(0, 150),
            previewHtml: res.content.slice(0, 500),
          });
          loadDocuments();
        }

        setTimeout(() => {
          onOpenDocument({
            title,
            content: res.content || '',
            filePath: res.filePath || null,
            format: docFormat,
          });
          setIsPreparing(false);
          setPreparingId(null);
        }, 350);
      } else if (res.error) {
        setErrorMessage(`Failed to open document: ${res.error}`);
      }
    }
  }, [isPreparing, loadDocuments, onOpenDocument]);

  const handleOpenRecent = useCallback(
    (doc: RecentDocItem) => {
      if (isPreparing) return;
      setIsPreparing(true);
      setPreparingId(doc.id);

      setTimeout(async () => {
        if (doc.filePath && window.solsticeAPI?.docsOpenFile) {
          const res = await window.solsticeAPI.docsOpenFile(doc.filePath);
          if (res.success && res.content !== undefined) {
            onOpenDocument({
              title: res.title || doc.title,
              content: res.content || '',
              filePath: res.filePath || doc.filePath,
              format: res.format || doc.format,
            });
            setIsPreparing(false);
            setPreparingId(null);
            return;
          }

          setIsPreparing(false);
          setPreparingId(null);
          const reason = res.error || 'The file may have been moved, renamed, or deleted.';
          setErrorMessage(`Unable to open "${doc.title}": ${reason}`);
          await removeRecentDocAsync(doc.id, false);
          loadDocuments();
          return;
        }

        if (!window.solsticeAPI?.docsOpenFile) {
          onOpenDocument({
            title: doc.title,
            content: doc.previewHtml || `<p>${doc.snippet || ''}</p>`,
            filePath: null,
            format: doc.format,
          });
        }
        setIsPreparing(false);
        setPreparingId(null);
      }, 350);
    },
    [isPreparing, loadDocuments, onOpenDocument]
  );

  const handlePromptRemove = useCallback((doc: RecentDocItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingDoc(doc);
  }, []);

  const handleConfirmRemoveFromRecents = useCallback(
    async (doc: RecentDocItem) => {
      setDeletingDoc(null);
      const updated = await removeRecentDocAsync(doc.id, false);
      setDocuments(updated);
    },
    []
  );

  const handleConfirmDeleteFromDisk = useCallback(
    async (doc: RecentDocItem) => {
      setDeletingDoc(null);
      const updated = await removeRecentDocAsync(doc.id, true);
      setDocuments(updated);
    },
    []
  );

  // Keyboard shortcuts (Ctrl+N, Ctrl+O)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleSelectTemplate(DOC_TEMPLATES[0]);
      } else if (isCtrl && !e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleOpenFilePicker();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOpenFilePicker, handleSelectTemplate]);

  return {
    documents,
    searchQuery,
    setSearchQuery,
    isPreparing,
    preparingId,
    errorMessage,
    setErrorMessage,
    deletingDoc,
    setDeletingDoc,
    handleSelectTemplate,
    handleOpenFilePicker,
    handleOpenRecent,
    handlePromptRemove,
    handleConfirmRemoveFromRecents,
    handleConfirmDeleteFromDisk,
  };
}
