import React from 'react';
import {
  A4_PAGE_WIDTH_PX,
  A4_CONTENT_HEIGHT_PX,
  A4_LEFT_MARGIN_PX,
  A4_RIGHT_MARGIN_PX,
  PAGE_TRANSITION_GAP_PX,
} from './paginationConstants';

interface DocsPageBreakSpacersProps {
  totalPages: number;
}

/**
 * Renders non-intrusive CSS float spacers within the DocsEditor-paper container.
 * In Print Layout mode:
 * - Each page spacer pushes down by A4_CONTENT_HEIGHT_PX (971px).
 * - Each page seam float spans the full 794px page width and 176px height
 *   (76px bottom margin + 24px desk gap + 76px top margin).
 * - TipTap/ProseMirror line boxes wrap seamlessly around these floats,
 *   guaranteeing that text never intersects the desk gap or page boundaries.
 */
export const DocsPageBreakSpacers: React.FC<DocsPageBreakSpacersProps> = ({
  totalPages,
}) => {
  if (totalPages <= 1) return null;

  const breakCount = totalPages - 1;

  return (
    <div
      aria-hidden="true"
      className="DocsPageBreakSpacers pointer-events-none select-none print:hidden"
    >
      {Array.from({ length: breakCount }).map((_, i) => (
        <div key={`page-break-spacer-${i}`}>
          {/* Spacer pushing float down by printable height of 1 page */}
          <div
            style={{
              float: 'left',
              clear: 'both',
              width: '0px',
              height: '0px',
              marginTop: `${A4_CONTENT_HEIGHT_PX}px`,
            }}
          />
          {/* Seam float covering the 176px non-printable zone */}
          <div
            style={{
              float: 'left',
              clear: 'both',
              width: `${A4_PAGE_WIDTH_PX}px`,
              marginLeft: `-${A4_LEFT_MARGIN_PX}px`,
              marginRight: `-${A4_RIGHT_MARGIN_PX}px`,
              height: `${PAGE_TRANSITION_GAP_PX}px`,
            }}
          />
        </div>
      ))}
    </div>
  );
};
