import React from 'react';
import {
  A4_PAGE_WIDTH_PX,
  A4_PAGE_HEIGHT_PX,
  PAGE_GAP_PX,
} from './paginationConstants';

interface DocsPageSheetsBackgroundProps {
  totalPages: number;
}

export const DocsPageSheetsBackground: React.FC<DocsPageSheetsBackgroundProps> = ({
  totalPages,
}) => {
  const pageCount = Math.max(1, totalPages);

  return (
    <div
      aria-hidden="true"
      className="DocsPageSheetsBackground absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-0 flex flex-col items-center select-none print:hidden"
    >
      {Array.from({ length: pageCount }).map((_, i) => (
        <div
          key={`page-sheet-${i}`}
          style={{
            width: `${A4_PAGE_WIDTH_PX}px`,
            height: `${A4_PAGE_HEIGHT_PX}px`,
            marginBottom: i < pageCount - 1 ? `${PAGE_GAP_PX}px` : 0,
          }}
          className="bg-white rounded-[2px] border border-[#e3e6e6] shadow-[0_1px_3px_1px_rgba(60,64,67,0.15)] relative pointer-events-none select-none transition-all duration-200"
        >
          {/* Subtle Page Number Footer Marker */}
          <div className="absolute bottom-5 right-8 text-[11px] font-mono text-slate-300/90 select-none pointer-events-none">
            {i + 1}
          </div>

          {/* Inter-Page Seam Pill in the desk gap between adjacent sheets */}
          {i < pageCount - 1 && (
            <div
              style={{
                bottom: `-${PAGE_GAP_PX}px`,
                height: `${PAGE_GAP_PX}px`,
              }}
              className="absolute left-0 right-0 flex items-center justify-between px-6 z-10 pointer-events-none select-none"
            >
              <div className="h-px flex-1 border-b border-dashed border-slate-300/80 mr-3" />
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100/90 border border-slate-200 text-[10px] font-medium text-slate-500 font-sans shadow-2xs">
                Page {i + 2} of {pageCount}
              </span>
              <div className="h-px flex-1 border-b border-dashed border-slate-300/80 ml-3" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
