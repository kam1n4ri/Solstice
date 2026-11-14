import { DeskSheetItem, WashiTapeColor } from './WhiteboardDeskCard';
import { RecentWhiteboardItem, formatWhiteboardDate } from './WhiteboardRecentStorage';

export const DEFAULT_DESK_SHEETS: DeskSheetItem[] = [];

export const TAPE_CYCLE: WashiTapeColor[] = ['yellow', 'mint', 'pink', 'peach'];
export const TILT_CYCLE = ['rotate-[-0.6deg]', 'rotate-[0.5deg]', 'rotate-[-0.4deg]', 'rotate-[0.6deg]'];

export function inferIllustration(title: string): DeskSheetItem['illustrationType'] {
  const t = title.toLowerCase();
  if (t.includes('arch') || t.includes('flow') || t.includes('system')) return 'architecture';
  if (t.includes('wireframe') || t.includes('mobile') || t.includes('ui')) return 'wireframe';
  if (t.includes('retro') || t.includes('notes') || t.includes('sticky')) return 'retro';
  if (t.includes('math') || t.includes('curve') || t.includes('chart')) return 'math';
  return 'freeform';
}

export function buildDeskSheets(items: RecentWhiteboardItem[]): DeskSheetItem[] {
  return items.map((item, idx) => ({
    id: item.id,
    title: item.title,
    relativeTime: formatWhiteboardDate(item.lastModified),
    statLabel: 'CANVAS',
    tapeColor: TAPE_CYCLE[idx % TAPE_CYCLE.length],
    tiltClass: TILT_CYCLE[idx % TILT_CYCLE.length],
    illustrationType: inferIllustration(item.title),
    filePath: item.filePath,
  }));
}
