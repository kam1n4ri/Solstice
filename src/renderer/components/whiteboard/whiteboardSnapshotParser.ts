import { convertToExcalidrawElements, restore, THEME } from '@excalidraw/excalidraw';
import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
import type { ExcalidrawElementSkeleton } from '@excalidraw/excalidraw/data/transform';

const TLDRAW_COLOR_MAP: Record<string, string> = {
  black: '#1e293b',
  grey: '#64748b',
  'light-violet': '#a78bfa',
  violet: '#7c3aed',
  blue: '#2563eb',
  'light-blue': '#0ea5e9',
  yellow: '#eab308',
  orange: '#ea580c',
  green: '#16a34a',
  'light-green': '#22c55e',
  'light-red': '#f43f5e',
  red: '#dc2626',
  white: '#ffffff',
};

function mapTldrawColor(name: unknown): string {
  return typeof name === 'string' ? TLDRAW_COLOR_MAP[name] || '#1e293b' : '#1e293b';
}

function extractTldrawRecords(parsed: any): any[] {
  if (Array.isArray(parsed?.records)) return parsed.records;
  if (parsed?.store && typeof parsed.store === 'object') {
    return Object.values(parsed.store);
  }
  return [];
}

function convertTldrawToSkeletons(records: any[]): ExcalidrawElementSkeleton[] {
  const skeletons: ExcalidrawElementSkeleton[] = [];

  for (const rec of records) {
    if (!rec || rec.typeName !== 'shape') continue;
    const x = Number(rec.x) || 0;
    const y = Number(rec.y) || 0;
    const props = rec.props || {};
    const strokeColor = mapTldrawColor(props.color);
    const w = Math.max(10, Number(props.w) || 120);
    const h = Math.max(10, Number(props.h) || 80);

    if (rec.type === 'geo') {
      const geoType =
        props.geo === 'ellipse' || props.geo === 'oval'
          ? 'ellipse'
          : props.geo === 'diamond'
          ? 'diamond'
          : 'rectangle';
      skeletons.push({
        type: geoType,
        x,
        y,
        width: w,
        height: h,
        strokeColor,
        label: props.text ? { text: String(props.text) } : undefined,
      } as ExcalidrawElementSkeleton);
    } else if (rec.type === 'text' || rec.type === 'note') {
      const label = String(props.text || '');
      if (rec.type === 'note') {
        skeletons.push({
          type: 'rectangle',
          x,
          y,
          width: w || 180,
          height: h || 180,
          backgroundColor: '#fef3c7',
          strokeColor: '#d97706',
          label: label ? { text: label } : undefined,
        } as ExcalidrawElementSkeleton);
      } else if (label) {
        skeletons.push({
          type: 'text',
          x,
          y,
          text: label,
          strokeColor,
        } as ExcalidrawElementSkeleton);
      }
    } else if (rec.type === 'arrow' || rec.type === 'line') {
      const start = props.start || { x: 0, y: 0 };
      const end = props.end || { x: 100, y: 0 };
      const sx = Number(start.x) || 0;
      const sy = Number(start.y) || 0;
      const ex = Number(end.x) || 0;
      const ey = Number(end.y) || 0;
      skeletons.push({
        type: rec.type === 'arrow' ? 'arrow' : 'line',
        x: x + sx,
        y: y + sy,
        width: ex - sx,
        height: ey - sy,
        strokeColor,
      } as ExcalidrawElementSkeleton);
    } else if (rec.type === 'draw' || rec.type === 'highlight') {
      const segs = Array.isArray(props.segments) ? props.segments : [];
      const points: [number, number][] = [];
      for (const seg of segs) {
        if (Array.isArray(seg?.points)) {
          for (const pt of seg.points) {
            points.push([Number(pt.x) || 0, Number(pt.y) || 0]);
          }
        }
      }
      if (points.length >= 2) {
        skeletons.push({
          type: 'line',
          x,
          y,
          points: points as any,
          strokeColor,
          strokeWidth: rec.type === 'highlight' ? 8 : 2,
          opacity: rec.type === 'highlight' ? 45 : 100,
        });
      }
    }
  }

  return skeletons;
}

export function parseWhiteboardSnapshot(rawSnapshot: string): ExcalidrawInitialDataState | null {
  try {
    const parsed = JSON.parse(rawSnapshot);
    if (!parsed || typeof parsed !== 'object') return null;

    if (
      typeof parsed.tldrawFileFormatVersion === 'number' ||
      Array.isArray(parsed.records) ||
      (parsed.store && typeof parsed.store === 'object')
    ) {
      const records = extractTldrawRecords(parsed);
      const skeletons = convertTldrawToSkeletons(records);
      return {
        elements: convertToExcalidrawElements(skeletons),
        appState: { theme: THEME.LIGHT, gridSize: 20 },
        scrollToContent: true,
      };
    }

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
    console.error('Failed to parse whiteboard snapshot:', err);
    return null;
  }
}
