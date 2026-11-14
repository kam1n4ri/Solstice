import React, { useMemo } from 'react';
import { ToolId } from '@shared/types';
import { HubView } from '@/components/hub/HubView';
import { ToolWindowView } from '@/components/tool/ToolWindowView';
import { DocsContainer } from '@/components/docs/DocsContainer';
import { WhiteboardContainer } from '@/components/whiteboard/WhiteboardContainer';
import { PdfContainer } from '@/components/pdf/PdfContainer';
import { PhotoContainer } from '@/components/photo/PhotoContainer';

export const App: React.FC = () => {
  // Determine if this window instance is dedicated to a specific tool
  const currentToolId = useMemo<ToolId | null>(() => {
    // Check search params (e.g. ?tool=docs)
    const urlParams = new URLSearchParams(window.location.search);
    const paramTool = urlParams.get('tool');
    if (paramTool) return paramTool as ToolId;

    // Check hash fallback (e.g. #tool=docs or #/tool/docs)
    const hash = window.location.hash;
    if (hash.includes('tool=')) {
      const match = hash.match(/tool=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) return match[1] as ToolId;
    }

    return null;
  }, []);

  if (currentToolId) {
    if (currentToolId === 'docs') {
      return <DocsContainer />;
    }
    if (currentToolId === 'whiteboard') {
      return <WhiteboardContainer />;
    }
    if (currentToolId === 'pdf') {
      return <PdfContainer />;
    }
    if (currentToolId === 'photo') {
      return <PhotoContainer />;
    }
    return <ToolWindowView toolId={currentToolId} />;
  }

  return <HubView />;
};

export default App;
