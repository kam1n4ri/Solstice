import React, { useState, useEffect, useCallback } from 'react';
import { PdfHomeView } from './home/PdfHomeView';
import { PdfWorkspace } from './PdfWorkspace';
import { PdfMergeTool } from './tools/PdfMergeTool';
import { PdfSplitTool } from './tools/PdfSplitTool';
import { PdfOrganizeTool } from './tools/PdfOrganizeTool';
import { PdfConvertTool } from './tools/PdfConvertTool';
import { PdfWatermarkTool } from './tools/PdfWatermarkTool';
import { PdfPageNumberTool } from './tools/PdfPageNumberTool';
import { PdfSecurityTool } from './tools/PdfSecurityTool';

export interface ActivePdfDocument {
  filePath: string | null;
  data: Uint8Array;
  fileName: string;
}

export type ActivePdfTool =
  | 'merge'
  | 'split'
  | 'organize'
  | 'convert'
  | 'watermark'
  | 'page-numbers'
  | 'security'
  | null;

export const PdfContainer: React.FC = () => {
  const [currentDocument, setCurrentDocument] = useState<ActivePdfDocument | null>(null);
  const [activeTool, setActiveTool] = useState<ActivePdfTool>(null);

  // Check URL query parameters for initial file path (?filePath=... or ?path=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialPath = params.get('filePath') || params.get('path');
    if (initialPath && window.solsticeAPI?.pdfOpenFile) {
      window.solsticeAPI.pdfOpenFile(initialPath).then((res) => {
        if (res.success && res.data && res.filePath) {
          setCurrentDocument({
            filePath: res.filePath,
            data: new Uint8Array(res.data),
            fileName: res.fileName || 'Untitled.pdf',
          });
        }
      });
    }
  }, []);

  // Listen for file open requests from Electron Main process
  useEffect(() => {
    if (!window.solsticeAPI?.onOpenFileRequested) return;
    const unsubscribe = window.solsticeAPI.onOpenFileRequested((filePath: string) => {
      if (filePath && window.solsticeAPI?.pdfOpenFile) {
        window.solsticeAPI.pdfOpenFile(filePath).then((res) => {
          if (res.success && res.data && res.filePath) {
            setCurrentDocument({
              filePath: res.filePath,
              data: new Uint8Array(res.data),
              fileName: res.fileName || 'Untitled.pdf',
            });
          }
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleDocumentSelected = useCallback(
    (filePath: string | null, data: Uint8Array, fileName: string) => {
      setCurrentDocument({ filePath, data, fileName });
    },
    []
  );

  const handleBackToHome = useCallback(() => {
    setCurrentDocument(null);
  }, []);

  const handleOpenTool = useCallback((toolId: string) => {
    setActiveTool(toolId as ActivePdfTool);
  }, []);

  return (
    <>
      {/* 1. Studio Home or Document Viewer */}
      {!currentDocument ? (
        <PdfHomeView
          onDocumentSelected={handleDocumentSelected}
          onOpenTool={handleOpenTool}
        />
      ) : (
        <PdfWorkspace
          document={currentDocument}
          onBackToHome={handleBackToHome}
          onOpenTool={handleOpenTool}
          onDocumentUpdate={handleDocumentSelected}
        />
      )}

      {/* 2. Standalone iLovePDF Tool Modals */}
      {activeTool === 'merge' && (
        <PdfMergeTool
          onClose={() => setActiveTool(null)}
          onOpenDocument={(fp, data, fn) => {
            setActiveTool(null);
            handleDocumentSelected(fp, data, fn);
          }}
          currentDocument={currentDocument}
        />
      )}

      {activeTool === 'split' && (
        <PdfSplitTool
          onClose={() => setActiveTool(null)}
          onOpenDocument={(fp, data, fn) => {
            setActiveTool(null);
            handleDocumentSelected(fp, data, fn);
          }}
          currentDocument={currentDocument}
        />
      )}

      {activeTool === 'organize' && (
        <PdfOrganizeTool
          onClose={() => setActiveTool(null)}
          onOpenDocument={(fp, data, fn) => {
            setActiveTool(null);
            handleDocumentSelected(fp, data, fn);
          }}
          currentDocument={currentDocument}
        />
      )}

      {activeTool === 'convert' && (
        <PdfConvertTool
          onClose={() => setActiveTool(null)}
          onOpenDocument={(fp, data, fn) => {
            setActiveTool(null);
            handleDocumentSelected(fp, data, fn);
          }}
          currentDocument={currentDocument}
        />
      )}

      {activeTool === 'watermark' && (
        <PdfWatermarkTool
          onClose={() => setActiveTool(null)}
          onOpenDocument={(fp, data, fn) => {
            setActiveTool(null);
            handleDocumentSelected(fp, data, fn);
          }}
          currentDocument={currentDocument}
        />
      )}

      {activeTool === 'page-numbers' && (
        <PdfPageNumberTool
          onClose={() => setActiveTool(null)}
          onOpenDocument={(fp, data, fn) => {
            setActiveTool(null);
            handleDocumentSelected(fp, data, fn);
          }}
          currentDocument={currentDocument}
        />
      )}

      {activeTool === 'security' && (
        <PdfSecurityTool
          onClose={() => setActiveTool(null)}
          onOpenDocument={(fp, data, fn) => {
            setActiveTool(null);
            handleDocumentSelected(fp, data, fn);
          }}
          currentDocument={currentDocument}
        />
      )}
    </>
  );
};
