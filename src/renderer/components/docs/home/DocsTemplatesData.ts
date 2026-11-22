import { FileText, LucideIcon } from 'lucide-react';

export interface DocTemplate {
  id: string;
  title: string;
  label: string;
  category: string;
  description: string;
  badge: string;
  icon: LucideIcon;
  badgeColorClass: string;
  content: string;
}

export const DOC_TEMPLATES: DocTemplate[] = [
  {
    id: 'blank',
    title: 'Untitled document',
    label: 'Blank document',
    category: 'General',
    description: 'Start fresh with a clean, blank slate',
    badge: 'Blank',
    icon: FileText,
    badgeColorClass: 'bg-blue-50/70 text-blue-600/80 border-blue-200/60',
    content: '<p></p>',
  },
];
