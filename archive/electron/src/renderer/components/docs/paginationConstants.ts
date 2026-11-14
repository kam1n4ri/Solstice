/**
 * Standard A4 Page Dimensions at 96 DPI:
 * Width: 210mm * (96 / 25.4) = 793.7px -> 794px
 * Height: 297mm * (96 / 25.4) = 1122.5px -> 1123px
 * Margins: Top 20mm (76px), Bottom 20mm (76px), Left 18mm (68px), Right 18mm (68px)
 * Printable Area: Height 971px, Width 658px
 * Desk Gap: 24px between physical sheets
 * Page Transition Gap: 76px (bottom margin) + 24px (gap) + 76px (top margin) = 176px
 * Page Pitch: 1123px + 24px = 1147px
 */
export const A4_PAGE_WIDTH_PX = 794;
export const A4_PAGE_HEIGHT_PX = 1123;
export const A4_TOP_MARGIN_PX = 76;
export const A4_BOTTOM_MARGIN_PX = 76;
export const A4_LEFT_MARGIN_PX = 68;
export const A4_RIGHT_MARGIN_PX = 68;
export const A4_CONTENT_HEIGHT_PX = 971;
export const PAGE_GAP_PX = 24;
export const PAGE_TRANSITION_GAP_PX = 176;
export const PAGE_PITCH_PX = 1147;
