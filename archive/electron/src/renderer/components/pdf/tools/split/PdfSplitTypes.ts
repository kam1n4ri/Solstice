export interface SplitPartition {
  id: string;
  name: string;
  fromPage: number;
  toPage: number;
  colorIndex: number;
}

export interface SplitResultFile {
  filePath: string;
  fileName: string;
  pageCount: number;
  fileSize?: number;
  data?: Uint8Array;
}

export interface PartitionPalette {
  badgeBg: string;
  badgeText: string;
  cardBorder: string;
  cardBg: string;
  accentText: string;
  dotBg: string;
}

export const PARTITION_PALETTES: PartitionPalette[] = [
  {
    badgeBg: 'bg-rose-100/80',
    badgeText: 'text-rose-800',
    cardBorder: 'border-rose-300/80',
    cardBg: 'bg-rose-50/30',
    accentText: 'text-rose-600',
    dotBg: 'bg-rose-400',
  },
  {
    badgeBg: 'bg-blue-100/80',
    badgeText: 'text-blue-800',
    cardBorder: 'border-blue-300/80',
    cardBg: 'bg-blue-50/30',
    accentText: 'text-blue-600',
    dotBg: 'bg-blue-400',
  },
  {
    badgeBg: 'bg-emerald-100/80',
    badgeText: 'text-emerald-800',
    cardBorder: 'border-emerald-300/80',
    cardBg: 'bg-emerald-50/30',
    accentText: 'text-emerald-600',
    dotBg: 'bg-emerald-400',
  },
  {
    badgeBg: 'bg-amber-100/80',
    badgeText: 'text-amber-800',
    cardBorder: 'border-amber-300/80',
    cardBg: 'bg-amber-50/30',
    accentText: 'text-amber-600',
    dotBg: 'bg-amber-400',
  },
  {
    badgeBg: 'bg-purple-100/80',
    badgeText: 'text-purple-800',
    cardBorder: 'border-purple-300/80',
    cardBg: 'bg-purple-50/30',
    accentText: 'text-purple-600',
    dotBg: 'bg-purple-400',
  },
  {
    badgeBg: 'bg-teal-100/80',
    badgeText: 'text-teal-800',
    cardBorder: 'border-teal-300/80',
    cardBg: 'bg-teal-50/30',
    accentText: 'text-teal-600',
    dotBg: 'bg-teal-400',
  },
];
