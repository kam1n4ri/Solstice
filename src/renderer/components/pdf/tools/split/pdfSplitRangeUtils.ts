import { SplitPartition, SplitResultFile } from './PdfSplitTypes';

export function reindexPartitions(parts: SplitPartition[]): SplitPartition[] {
  return parts.map((part, idx) => ({
    ...part,
    name: `Partition ${idx + 1}`,
    colorIndex: idx,
  }));
}

export function syncTypedRanges(parts: SplitPartition[]): string {
  return parts
    .map((p) => (p.fromPage === p.toPage ? `${p.fromPage}` : `${p.fromPage}-${p.toPage}`))
    .join(', ');
}

export function parseTypedRanges(raw: string, totalPages: number): SplitPartition[] {
  const tokens = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (tokens.length === 0) return [];

  const newParts: SplitPartition[] = [];
  tokens.forEach((token, idx) => {
    if (token.includes('-')) {
      const [startStr, endStr] = token.split('-');
      const from = Math.max(1, Math.min(totalPages || 1, parseInt(startStr, 10) || 1));
      const to = Math.max(from, Math.min(totalPages || 1, parseInt(endStr, 10) || from));
      newParts.push({
        id: `p-${idx + 1}`,
        name: `Partition ${idx + 1}`,
        fromPage: from,
        toPage: to,
        colorIndex: idx,
      });
    } else {
      const p = Math.max(1, Math.min(totalPages || 1, parseInt(token, 10) || 1));
      newParts.push({
        id: `p-${idx + 1}`,
        name: `Partition ${idx + 1}`,
        fromPage: p,
        toPage: p,
        colorIndex: idx,
      });
    }
  });

  return reindexPartitions(newParts);
}

export function splitAtPage(
  partitions: SplitPartition[],
  cutAfterPage: number,
  totalPages: number
): SplitPartition[] {
  if (cutAfterPage < 1 || cutAfterPage >= totalPages) return partitions;

  const targetIdx = partitions.findIndex(
    (p) => cutAfterPage >= p.fromPage && cutAfterPage < p.toPage
  );

  if (targetIdx === -1) {
    // If not strictly inside an existing partition, check if cut point is between partitions
    return partitions;
  }

  const target = partitions[targetIdx];
  const firstPart: SplitPartition = {
    ...target,
    toPage: cutAfterPage,
  };

  const secondPart: SplitPartition = {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: 'New Partition',
    fromPage: cutAfterPage + 1,
    toPage: target.toPage,
    colorIndex: targetIdx + 1,
  };

  const nextParts = [
    ...partitions.slice(0, targetIdx),
    firstPart,
    secondPart,
    ...partitions.slice(targetIdx + 1),
  ];

  return reindexPartitions(nextParts);
}

export function mergePartitionWithPrevious(
  partitions: SplitPartition[],
  partitionId: string
): SplitPartition[] {
  const targetIdx = partitions.findIndex((p) => p.id === partitionId);
  if (targetIdx <= 0) return partitions;

  const prev = partitions[targetIdx - 1];
  const curr = partitions[targetIdx];

  const merged: SplitPartition = {
    ...prev,
    toPage: Math.max(prev.toPage, curr.toPage),
  };

  const nextParts = [
    ...partitions.slice(0, targetIdx - 1),
    merged,
    ...partitions.slice(targetIdx + 1),
  ];

  return reindexPartitions(nextParts);
}

export function createHalfSplit(totalPages: number): SplitPartition[] {
  if (totalPages <= 1) {
    return [{ id: 'p-1', name: 'Partition 1', fromPage: 1, toPage: 1, colorIndex: 0 }];
  }
  const mid = Math.ceil(totalPages / 2);
  const p1: SplitPartition = { id: 'p-1', name: 'Partition 1', fromPage: 1, toPage: mid, colorIndex: 0 };
  const p2: SplitPartition = { id: 'p-2', name: 'Partition 2', fromPage: mid + 1, toPage: totalPages, colorIndex: 1 };
  return [p1, p2];
}

export function createSinglePartition(totalPages: number): SplitPartition[] {
  return [
    {
      id: 'p-1',
      name: 'Partition 1',
      fromPage: 1,
      toPage: Math.max(1, totalPages),
      colorIndex: 0,
    },
  ];
}

export function createIntervalPartitions(interval: number, totalPages: number): SplitPartition[] {
  const step = Math.max(1, Math.min(totalPages, interval));
  const result: SplitPartition[] = [];
  let start = 1;
  let idx = 0;

  while (start <= totalPages) {
    const end = Math.min(totalPages, start + step - 1);
    result.push({
      id: `p-${idx + 1}`,
      name: `Partition ${idx + 1}`,
      fromPage: start,
      toPage: end,
      colorIndex: idx,
    });
    start = end + 1;
    idx++;
  }

  return reindexPartitions(result);
}

export async function executeSplitApi(options: {
  filePath: string | null;
  fileData: Uint8Array | null;
  mode: 'ranges' | 'extract-all';
  typedRanges: string;
  fileName: string;
}): Promise<{ results?: SplitResultFile[]; error?: string; canceled?: boolean }> {
  if (!window.solsticeAPI?.pdfSplit) {
    return { error: 'PDF split API is not available.' };
  }
  const { filePath, fileData, mode, typedRanges, fileName } = options;
  const res = await window.solsticeAPI.pdfSplit({
    filePath: filePath || undefined,
    fileData: !filePath && fileData ? Array.from(fileData) : undefined,
    mode,
    ranges: mode === 'ranges' ? typedRanges : undefined,
    baseName: fileName.replace(/\.pdf$/i, ''),
  });

  if (res.success && res.outputFiles) {
    return {
      results: res.outputFiles.map((f: any) => ({
        filePath: f.filePath,
        fileName: f.fileName,
        pageCount: f.pageCount,
        fileSize: f.fileSize,
        data: f.data ? new Uint8Array(f.data) : undefined,
      })),
    };
  }

  return { error: res.error, canceled: res.canceled };
}

