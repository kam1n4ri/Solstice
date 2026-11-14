import React from 'react';
import { WhiteboardDeskCard, DeskSheetItem } from './WhiteboardDeskCard';

interface WhiteboardDeskGridProps {
  filteredSheets: DeskSheetItem[];
  searchQuery: string;
  onOpenSheet: (sheet: DeskSheetItem) => void;
  onRemoveSheet: (id: string, filePath?: string | null, e?: React.MouseEvent) => void;
  isPreparing: boolean;
  preparingId: string | null;
}

export const WhiteboardDeskGrid: React.FC<WhiteboardDeskGridProps> = ({
  filteredSheets,
  searchQuery,
  onOpenSheet,
  onRemoveSheet,
  isPreparing,
  preparingId,
}) => {
  if (filteredSheets.length === 0) {
    return (
      <div className="py-12 px-6 flex flex-col items-center justify-center text-center rounded-2xl bg-white/60 border border-dashed border-[#e8e4dc]">
        <p className="text-sm font-bold text-slate-800">
          {searchQuery ? `No sketch sheets matching "${searchQuery}"` : 'Your desk is clean'}
        </p>
        <p className="font-caveat text-lg text-amber-600/90 mt-0.5">
          {searchQuery ? 'Try checking for typos or clear your search' : 'ready for fresh sketches ✦'}
        </p>
        {!searchQuery && (
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Click New Board above or drop a file to start drafting.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {filteredSheets.map((sheet) => (
        <WhiteboardDeskCard
          key={sheet.id}
          sheet={sheet}
          onOpen={onOpenSheet}
          onRemove={sheet.filePath ? onRemoveSheet : undefined}
          isLoading={isPreparing && preparingId === sheet.id}
        />
      ))}
    </div>
  );
};
