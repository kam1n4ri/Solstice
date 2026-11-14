import React, { useCallback, useRef, useMemo } from 'react';
import {
  Excalidraw,
  MainMenu,
  WelcomeScreen,
  restore,
  getSceneVersion,
  THEME,
} from '@excalidraw/excalidraw';
import type {
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
  AppState,
  BinaryFiles,
} from '@excalidraw/excalidraw/types';
import type { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import '@excalidraw/excalidraw/index.css';
import './whiteboard.css';
import './whiteboardLibrary.css';
import { getWhiteboardTemplateElements } from './WhiteboardTemplatesData';
import { useWhiteboardRebrand } from './useWhiteboardRebrand';

interface WhiteboardCanvasProps {
  title?: string;
  initialSnapshot?: string | null;
  templateId?: string;
  onApiReady: (api: ExcalidrawImperativeAPI) => void;
  onChange: (
    elements: readonly OrderedExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles
  ) => void;
}

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = React.memo(({
  title,
  initialSnapshot,
  templateId,
  onApiReady,
  onChange,
}) => {
  useWhiteboardRebrand();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Memoize initial restored data state for synchronous Excalidraw initialization
  const initialData = useMemo<ExcalidrawInitialDataState | null>(() => {
    if (initialSnapshot) {
      try {
        const parsed = JSON.parse(initialSnapshot);
        const restored = restore(parsed, null, null);
        return {
          elements: restored.elements,
          appState: {
            ...restored.appState,
            theme: THEME.LIGHT,
          },
          files: restored.files,
          scrollToContent: true,
        };
      } catch (err) {
        console.error('Failed to parse and load initial Excalidraw snapshot:', err);
      }
    } else if (templateId) {
      try {
        const templateElements = getWhiteboardTemplateElements(templateId);
        if (templateElements.length > 0) {
          return {
            elements: templateElements,
            appState: {
              theme: THEME.LIGHT,
              gridSize: 20,
            },
            scrollToContent: true,
          };
        }
      } catch (err) {
        console.error('Failed to apply starter template shapes:', err);
      }
    }
    return null;
  }, [initialSnapshot, templateId]);

  // Set the baseline scene version so the initial scene is not marked dirty,
  // but any subsequent user stroke immediately triggers onChange.
  const baselineVersion = useMemo(() => {
    if (initialData?.elements && initialData.elements.length > 0) {
      return getSceneVersion(initialData.elements);
    }
    return 0;
  }, [initialData]);

  const lastSceneVersionRef = useRef<number>(baselineVersion);

  const handleApi = useCallback(
    (api: ExcalidrawImperativeAPI) => {
      onApiReady(api);

      if (initialData?.files) {
        api.addFiles(Object.values(initialData.files));
      }
    },
    [onApiReady, initialData]
  );

  const handleChange = useCallback(
    (
      elements: readonly OrderedExcalidrawElement[],
      appState: AppState,
      files: BinaryFiles
    ) => {
      const version = getSceneVersion(elements);
      if (version !== lastSceneVersionRef.current) {
        lastSceneVersionRef.current = version;
        onChangeRef.current?.(elements, appState, files);
      }
    },
    []
  );

  return (
    <div className="flex-1 w-full h-full min-h-0 relative overflow-hidden select-none bg-[#faf8f5] solstice-whiteboard-canvas">
      <Excalidraw
        excalidrawAPI={handleApi}
        initialData={initialData}
        onChange={handleChange}
        theme={THEME.LIGHT}
        gridModeEnabled={true}
        aiEnabled={false}
        name={title}
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: true,
            clearCanvas: true,
            export: false,
            loadScene: false,
            saveToActiveFile: false,
            toggleTheme: false,
            saveAsImage: false,
          },
        }}
      >
        {/* Custom Solstice Main Menu (omits Excalidraw socials, links, and promos) */}
        <MainMenu>
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.DefaultItems.SearchMenu />
          <MainMenu.DefaultItems.Help />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>

        {/* Custom Solstice Welcome Screen replacing third-party logos */}
        <WelcomeScreen>
          <WelcomeScreen.Center>
            <WelcomeScreen.Center.Logo>
              <div className="flex items-center justify-center gap-2 select-none mb-1">
                <span className="text-3xl font-extrabold tracking-tight text-slate-800">
                  Solstice
                </span>
                <span className="font-caveat text-4xl font-bold text-amber-600/90 lowercase">
                  whiteboard
                </span>
              </div>
            </WelcomeScreen.Center.Logo>
            <WelcomeScreen.Center.Heading>
              Infinite canvas for sketching, diagrams & blueprints
            </WelcomeScreen.Center.Heading>
          </WelcomeScreen.Center>
          <WelcomeScreen.Hints.ToolbarHint />
          <WelcomeScreen.Hints.MenuHint />
          <WelcomeScreen.Hints.HelpHint />
        </WelcomeScreen>
      </Excalidraw>
    </div>
  );
});

WhiteboardCanvas.displayName = 'WhiteboardCanvas';
