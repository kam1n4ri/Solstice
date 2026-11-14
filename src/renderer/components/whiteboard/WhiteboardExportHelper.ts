import {
  exportToBlob,
  exportToSvg,
  serializeAsJSON,
} from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';

export async function exportWhiteboard(
  api: ExcalidrawImperativeAPI,
  title: string,
  format: 'png' | 'svg' | 'json',
  flashStatus: (msg: string) => void
): Promise<void> {
  try {
    flashStatus(`Exporting ${format.toUpperCase()}...`);
    const elements = api.getSceneElements();
    const appState = api.getAppState();
    const files = api.getFiles();

    if (format === 'json') {
      const data = serializeAsJSON(elements, appState, files, 'local');
      const res = await window.solsticeAPI?.whiteboardExportFile?.({
        defaultName: title,
        format: 'json',
        data,
      });
      if (res?.canceled) {
        flashStatus('All changes saved');
        return;
      }
      flashStatus('Exported JSON');
      return;
    }

    if (elements.length === 0) {
      flashStatus('Canvas is empty');
      return;
    }

    if (format === 'svg') {
      const svgElement = await exportToSvg({
        elements,
        appState: {
          ...appState,
          exportWithDarkMode: false,
          exportBackground: true,
        },
        files,
        exportPadding: 20,
      });

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const res = await window.solsticeAPI?.whiteboardExportFile?.({
        defaultName: title,
        format: 'svg',
        data: svgString,
      });
      if (res?.canceled) {
        flashStatus('All changes saved');
        return;
      }
      flashStatus('Exported SVG');
    } else if (format === 'png') {
      const blob = await exportToBlob({
        elements,
        appState: {
          ...appState,
          exportWithDarkMode: false,
          exportBackground: true,
        },
        files,
        mimeType: 'image/png',
        exportPadding: 20,
      });

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const res = await window.solsticeAPI?.whiteboardExportFile?.({
          defaultName: title,
          format: 'png',
          data: base64Data,
        });
        if (res?.canceled) {
          flashStatus('All changes saved');
          return;
        }
        flashStatus('Exported PNG');
      };
    }
  } catch (err) {
    console.error('Export error:', err);
    flashStatus('Export failed');
  }
}
