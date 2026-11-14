import React from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { DOC_TEMPLATES, DocTemplate } from './DocsTemplatesData';
import { cn } from '@/lib/utils';

interface DocsTemplateStripProps {
  onSelectTemplate: (template: DocTemplate) => void;
  isPreparing?: boolean;
  preparingId?: string | null;
}

export const DocsTemplateStrip: React.FC<DocsTemplateStripProps> = ({
  onSelectTemplate,
  isPreparing = false,
  preparingId = null,
}) => {
  return (
    <section className="select-none">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-outline uppercase tracking-wider">
          Start a new document
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {DOC_TEMPLATES.map((tmpl) => {
          const isItemPreparing = isPreparing && preparingId === tmpl.id;
          const Icon = tmpl.icon;
          const isBlank = tmpl.id === 'blank';

          return (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => onSelectTemplate(tmpl)}
              disabled={isPreparing}
              title={tmpl.description}
              className="group flex flex-col text-left outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-200 rounded-xl disabled:cursor-wait"
            >
              <div
                className={cn(
                  'w-full aspect-[1/1.25] bg-white border border-slate-200/80 rounded-2xl transition-all duration-200 flex items-center justify-center p-4 shadow-2xs relative overflow-hidden',
                  'group-hover:border-blue-200 group-hover:shadow-[0_8px_20px_rgba(191,219,254,0.35)] group-hover:-translate-y-0.5'
                )}
              >
                <div
                  className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-2xs border',
                    'bg-blue-50/70 text-blue-600/80 border-blue-100/70 group-hover:bg-blue-100/70 group-hover:text-blue-600 group-hover:border-blue-200 group-hover:scale-105'
                  )}
                >
                  {isItemPreparing ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500/80 stroke-[2]" />
                  ) : isBlank ? (
                    <Plus className="h-6 w-6 stroke-[2]" />
                  ) : (
                    <Icon className="h-5 w-5 stroke-[1.8]" />
                  )}
                </div>
              </div>

              <div className="mt-2.5 flex flex-col px-0.5">
                <span className="text-xs font-medium text-slate-700 truncate group-hover:text-blue-600/90 transition-colors">
                  {isItemPreparing ? 'Preparing...' : tmpl.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
