export type AnnotationTool = 'select' | 'highlight' | 'pen';

export interface PdfPathAnnotation {
  id: string;
  type: 'pen';
  pageNumber: number;
  points: { xRatio: number; yRatio: number }[];
  color: string;
  width: number;
}

export interface PdfHighlightAnnotation {
  id: string;
  type: 'highlight';
  pageNumber: number;
  rect: {
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
  };
  color: string;
}

export type PdfAnnotation =
  | PdfPathAnnotation
  | PdfHighlightAnnotation;

export const HIGHLIGHT_COLORS = [
  { id: 'amber', name: 'Pale Amber', color: 'rgba(254, 240, 138, 0.55)', hex: '#fef08a', solid: '#d97706' },
  { id: 'emerald', name: 'Pale Emerald', color: 'rgba(167, 243, 208, 0.55)', hex: '#a7f3d0', solid: '#059669' },
  { id: 'sky', name: 'Pale Sky', color: 'rgba(186, 230, 253, 0.55)', hex: '#bae6fd', solid: '#0284c7' },
  { id: 'rose', name: 'Pale Rose', color: 'rgba(254, 205, 211, 0.55)', hex: '#fecdd3', solid: '#e11d48' },
  { id: 'violet', name: 'Pale Violet', color: 'rgba(233, 213, 255, 0.55)', hex: '#e9d5ff', solid: '#9333ea' },
];

export const PEN_COLORS = [
  { id: 'slate', name: 'Charcoal', hex: '#334155' },
  { id: 'rose', name: 'Rose', hex: '#e11d48' },
  { id: 'indigo', name: 'Indigo', hex: '#4f46e5' },
  { id: 'sky', name: 'Sky Blue', hex: '#0284c7' },
  { id: 'emerald', name: 'Emerald', hex: '#059669' },
  { id: 'amber', name: 'Amber', hex: '#d97706' },
];

export const PEN_STROKE_WIDTHS = [
  { width: 1.5, label: 'Fine' },
  { width: 3, label: 'Medium' },
  { width: 5, label: 'Bold' },
  { width: 8, label: 'Thick' },
];
