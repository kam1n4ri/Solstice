import { convertToExcalidrawElements } from '@excalidraw/excalidraw';
import type { ExcalidrawElementSkeleton } from '@excalidraw/excalidraw/data/transform';
import type { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { getFlowchartSkeletons } from './templates/flowchartTemplate';
import { getMindmapSkeletons } from './templates/mindmapTemplate';
import { getWireframeSkeletons } from './templates/wireframeTemplate';
import { getRetroSkeletons } from './templates/retroTemplate';

export function getWhiteboardTemplateElements(templateId: string): OrderedExcalidrawElement[] {
  let skeletons: ExcalidrawElementSkeleton[] = [];

  switch (templateId) {
    case 'flowchart':
      skeletons = getFlowchartSkeletons();
      break;
    case 'mindmap':
      skeletons = getMindmapSkeletons();
      break;
    case 'wireframe':
      skeletons = getWireframeSkeletons();
      break;
    case 'retro':
      skeletons = getRetroSkeletons();
      break;
    default:
      skeletons = [];
      break;
  }

  return convertToExcalidrawElements(skeletons);
}
