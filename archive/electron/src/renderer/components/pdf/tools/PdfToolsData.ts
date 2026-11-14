import React from 'react';
import {
  Grid,
  Scissors,
  Layers,
  Stamp,
  Hash,
  Image as ImageIcon,
  Shield,
} from 'lucide-react';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'organize' | 'enhance' | 'security';
  defaultActionName: string;
  helpText: string;
}

export const PDF_TOOLS: ToolDefinition[] = [
  {
    id: 'organize',
    name: 'Organize Pages',
    description: 'Reorder, rotate, or delete',
    badge: 'Pages',
    icon: Grid,
    category: 'organize',
    defaultActionName: 'Save Page Order',
    helpText: 'Rearrange page ordering, adjust rotation angles, or delete unwanted pages in this document.',
  },
  {
    id: 'split',
    name: 'Split Document',
    description: 'Extract ranges or burst',
    badge: 'Split',
    icon: Scissors,
    category: 'organize',
    defaultActionName: 'Split Document',
    helpText: 'Extract selected page ranges into separate files or burst every page into individual PDFs.',
  },
  {
    id: 'merge',
    name: 'Merge with PDFs',
    description: 'Combine multiple files',
    badge: 'Merge',
    icon: Layers,
    category: 'organize',
    defaultActionName: 'Merge Documents',
    helpText: 'Combine external PDF documents together and arrange unified page sequence.',
  },
  {
    id: 'watermark',
    name: 'Watermark PDF',
    description: 'Text & stamp overlays',
    badge: 'Stamp',
    icon: Stamp,
    category: 'enhance',
    defaultActionName: 'Apply Watermark',
    helpText: 'Stamp confidential labels, dates, or custom security text across document pages.',
  },
  {
    id: 'page-numbers',
    name: 'Add Page Numbers',
    description: 'Standardized pagination',
    badge: 'Numbers',
    icon: Hash,
    category: 'enhance',
    defaultActionName: 'Insert Numbers',
    helpText: 'Embed standardized headers or footers with automated page numbers (e.g. Page 1 of N).',
  },
  {
    id: 'convert',
    name: 'Images ⇄ PDF',
    description: 'Convert pictures to PDF',
    badge: 'Convert',
    icon: ImageIcon,
    category: 'enhance',
    defaultActionName: 'Convert Files',
    helpText: 'Convert image files (PNG, JPG, WebP) into PDF pages or extract pages to high-res images.',
  },
  {
    id: 'security',
    name: 'Protect & Unlock',
    description: 'AES-256 encryption',
    badge: 'Security',
    icon: Shield,
    category: 'security',
    defaultActionName: 'Protect PDF',
    helpText: 'Apply AES-256 bit encryption to restrict document viewing or remove existing passwords.',
  },
];

export const SECTIONS = [
  { key: 'organize', title: 'Page Management' },
  { key: 'enhance', title: 'Enhance & Stamp' },
  { key: 'security', title: 'Privacy & Security' },
] as const;
