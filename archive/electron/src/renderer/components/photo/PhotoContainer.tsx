import React, { useState, useEffect, useCallback } from 'react';
import { PhotoHomeView } from './PhotoHomeView';
import { PhotoWorkspace } from './PhotoWorkspace';

export interface ActivePhotoDocument {
  filePath: string | null;
  fileName: string;
  dataUrl: string;
}

export const PhotoContainer: React.FC = () => {
  const [currentDocument, setCurrentDocument] = useState<ActivePhotoDocument | null>(null);

  // Check URL query parameters for initial file path (?path=... or ?filePath=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialPath = params.get('filePath') || params.get('path');
    if (initialPath && window.solsticeAPI?.photoOpenFile) {
      window.solsticeAPI.photoOpenFile(initialPath).then((res) => {
        if (res.success && res.dataUrl && res.filePath) {
          setCurrentDocument({
            filePath: res.filePath,
            fileName: res.fileName || 'Untitled.png',
            dataUrl: res.dataUrl,
          });
        }
      });
    }
  }, []);

  // Listen for file open requests from Electron Main process
  useEffect(() => {
    if (!window.solsticeAPI?.onOpenFileRequested) return;
    const unsubscribe = window.solsticeAPI.onOpenFileRequested((filePath: string) => {
      if (filePath && window.solsticeAPI?.photoOpenFile) {
        window.solsticeAPI.photoOpenFile(filePath).then((res) => {
          if (res.success && res.dataUrl && res.filePath) {
            setCurrentDocument({
              filePath: res.filePath,
              fileName: res.fileName || 'Untitled.png',
              dataUrl: res.dataUrl,
            });
          }
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handlePhotoSelected = useCallback((doc: ActivePhotoDocument) => {
    setCurrentDocument(doc);
  }, []);

  const handleBackToHome = useCallback(() => {
    setCurrentDocument(null);
  }, []);

  return (
    <>
      {!currentDocument ? (
        <PhotoHomeView onPhotoSelected={handlePhotoSelected} />
      ) : (
        <PhotoWorkspace document={currentDocument} onBackToHome={handleBackToHome} />
      )}
    </>
  );
};
