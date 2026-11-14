import React, { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { DocsHomeView, DocsOpenPayload } from './home/DocsHomeView';
import { DocsView } from './DocsView';

export const DocsContainer: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<DocsOpenPayload | null>(null);
  const urlParams = new URLSearchParams(window.location.search);
  const initialFilePath = urlParams.get('filePath');
  const [isColdLoading, setIsColdLoading] = useState<boolean>(Boolean(initialFilePath));
  const [coldLoadError, setColdLoadError] = useState<string | null>(null);

  // Check initial filePath from URL query params on mount
  useEffect(() => {
    if (initialFilePath && window.solsticeAPI?.docsOpenFile) {
      window.solsticeAPI
        .docsOpenFile(initialFilePath)
        .then((res) => {
          if (res.success && res.content !== undefined) {
            setActiveDoc({
              title: res.title || 'Untitled document',
              content: res.content,
              filePath: res.filePath,
              format: res.format,
              documentId: res.filePath || `doc-${Date.now()}`,
            });
          } else {
            setColdLoadError(res.error || `Could not open file: ${initialFilePath}`);
          }
        })
        .catch((err) => {
          setColdLoadError(err instanceof Error ? err.message : String(err));
        })
        .finally(() => {
          setIsColdLoading(false);
        });
    } else if (initialFilePath && !window.solsticeAPI?.docsOpenFile) {
      setIsColdLoading(false);
    }
  }, [initialFilePath]);

  // Listen for open file requests when on Home screen (DocsView handles its own when active)
  useEffect(() => {
    if (!activeDoc && window.solsticeAPI?.onOpenFileRequested) {
      const unsubscribe = window.solsticeAPI.onOpenFileRequested(async (filePath) => {
        if (filePath && window.solsticeAPI?.docsOpenFile) {
          const res = await window.solsticeAPI.docsOpenFile(filePath);
          if (res.success && res.content !== undefined) {
            setActiveDoc({
              title: res.title || 'Untitled document',
              content: res.content,
              filePath: res.filePath,
              format: res.format,
              documentId: res.filePath || `doc-${Date.now()}`,
            });
          }
        }
      });
      return unsubscribe;
    }
  }, [activeDoc]);

  // Handle immediate window close and reset dirty state when on Home screen without active document
  useEffect(() => {
    if (!activeDoc) {
      window.solsticeAPI?.docsSetDirty?.(false);
      if (window.solsticeAPI?.onSaveAndCloseRequested) {
        const unsubscribe = window.solsticeAPI.onSaveAndCloseRequested(() => {
          window.solsticeAPI?.closeWindow?.(true);
        });
        return unsubscribe;
      }
    }
  }, [activeDoc]);

  if (isColdLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-surface text-on-surface select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50/80 text-blue-700/90 flex items-center justify-center border border-blue-200/60 shadow-xs">
            <FileText className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600/80" />
            <span>Opening document...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!activeDoc) {
    return (
      <DocsHomeView
        initialErrorMessage={coldLoadError}
        onOpenDocument={(payload) =>
          setActiveDoc({
            ...payload,
            documentId: payload.documentId || payload.filePath || `doc-${Date.now()}`,
          })
        }
      />
    );
  }

  const docKey = activeDoc.documentId || activeDoc.filePath || activeDoc.title;

  return (
    <DocsView
      key={docKey}
      initialDocument={activeDoc}
      onBackToHome={() => setActiveDoc(null)}
    />
  );
};
