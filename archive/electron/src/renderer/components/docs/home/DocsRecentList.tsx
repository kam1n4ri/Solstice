import React, { useState, useMemo } from 'react';
import {
  FileText, Clock, LayoutGrid, List as ListIcon, Trash2, ArrowUpDown, FolderOpen, Loader2,
} from 'lucide-react';
import { RecentDocItem, formatDocsDate } from './DocsRecentStorage';
import { DocsThumbnailPreview } from './DocsThumbnailPreview';
import { cn } from '@/lib/utils';

interface DocsRecentListProps {
  documents: RecentDocItem[];
  searchQuery: string;
  onOpenDocument: (doc: RecentDocItem) => void;
  onRemoveDocument: (doc: RecentDocItem, e: React.MouseEvent) => void;
  onOpenFilePicker: () => void;
  isPreparing?: boolean;
  preparingId?: string | null;
}

const getFormatBadgeStyle = (_format?: string) => {
  return 'bg-blue-50/70 text-blue-700/80 border-blue-200/60';
};

export const DocsRecentList: React.FC<DocsRecentListProps> = ({
  documents,
  searchQuery,
  onOpenDocument,
  onRemoveDocument,
  onOpenFilePicker,
  isPreparing = false,
  preparingId = null,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'recent' | 'alphabetical'>('recent');

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const result = documents.filter((doc) => {
      if (!q) return true;
      return (
        doc.title.toLowerCase().includes(q) ||
        (doc.filePath && doc.filePath.toLowerCase().includes(q)) ||
        (doc.snippet && doc.snippet.toLowerCase().includes(q)) ||
        doc.format.toLowerCase().includes(q)
      );
    });

    if (sortOrder === 'alphabetical') {
      return [...result].sort((a, b) => a.title.localeCompare(b.title));
    }
    return [...result].sort((a, b) => b.lastModified - a.lastModified);
  }, [documents, searchQuery, sortOrder]);

  return (
    <section className="select-none space-y-3">
      {/* Controls Header */}
      <div className="flex items-center justify-between pb-1 text-on-surface">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-outline" />
          <span className="text-xs font-semibold text-outline tracking-wider uppercase">
            Recent documents
          </span>
          {filtered.length > 0 && (
            <span className="text-[11px] font-mono text-outline">({filtered.length})</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenFilePicker}
            title="Open file from disk (Ctrl+O)"
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface bg-surface-container-low hover:bg-surface-container border border-surface-container transition-colors"
          >
            <FolderOpen className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setSortOrder((p) => (p === 'recent' ? 'alphabetical' : 'recent'))}
            title={sortOrder === 'recent' ? 'Sort: Last Modified' : 'Sort: Alphabetical'}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-outline" />
            <span className="capitalize">{sortOrder}</span>
          </button>

          <div className="flex items-center bg-surface-container-low p-0.5 rounded-lg border border-surface-container">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Grid view"
              className={cn('p-1 rounded-md transition-colors', viewMode === 'grid' ? 'bg-white text-on-surface shadow-xs' : 'text-on-surface-variant hover:text-on-surface')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="List view"
              className={cn('p-1 rounded-md transition-colors', viewMode === 'list' ? 'bg-white text-on-surface shadow-xs' : 'text-on-surface-variant hover:text-on-surface')}
            >
              <ListIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="py-14 flex flex-col items-center justify-center text-center rounded-xl bg-surface-container-low/40 border border-surface-container shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="h-10 w-10 rounded-xl bg-surface-container-low flex items-center justify-center text-outline mb-2 border border-surface-container">
            <FileText className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium text-on-surface mb-0.5">
            {searchQuery ? `No documents matching "${searchQuery}"` : 'No recent documents'}
          </p>
          <p className="text-[11px] text-on-surface-variant max-w-xs">
            {searchQuery ? 'Try checking for typos or searching a different term.' : 'Open an existing file or start with a template.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((doc) => {
            const isItemOpening = isPreparing && preparingId === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => !isPreparing && onOpenDocument(doc)}
                className={cn(
                  'group flex flex-col text-left cursor-pointer rounded-xl bg-surface-container-lowest border border-outline-variant/30 hover:border-blue-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(191,219,254,0.3)] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden',
                  isPreparing && 'cursor-wait'
                )}
              >
                <div className="w-full aspect-[1/1.25] bg-surface-container-low/40 p-2 border-b border-surface-container/60 relative overflow-hidden group-hover:bg-surface-container-lowest transition-colors">
                  <div className="w-full h-full rounded-md overflow-hidden border border-outline-variant/20 shadow-xs bg-white relative">
                    <DocsThumbnailPreview title={doc.title} snippet={doc.snippet} previewHtml={doc.previewHtml} />
                    {isItemOpening && (
                      <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 flex flex-col justify-between gap-1.5">
                  <span className="text-xs font-medium text-on-surface truncate group-hover:text-blue-600/90 transition-colors">
                    {doc.title}
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-outline">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={cn('text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-md border font-medium', getFormatBadgeStyle(doc.format))}>
                        {doc.format}
                      </span>
                      <span className="truncate">{formatDocsDate(doc.lastModified)}</span>
                    </div>
                    <button
                      type="button"
                      disabled={isPreparing}
                      onClick={(e) => onRemoveDocument(doc, e)}
                      title="Remove or delete document"
                      className="p-1 rounded-md text-outline hover:text-slate-700 hover:bg-slate-100/80 transition-colors opacity-0 group-hover:opacity-100 disabled:pointer-events-none"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="grid grid-cols-12 py-2 px-4 text-[11px] font-semibold text-outline uppercase tracking-wider bg-surface-container-low border-b border-surface-container">
            <span className="col-span-6">Name</span>
            <span className="col-span-2">Format</span>
            <span className="col-span-3">Last Modified</span>
            <span className="col-span-1 text-right">Action</span>
          </div>
          <div className="divide-y divide-surface-container/50">
            {filtered.map((doc) => {
              const isItemOpening = isPreparing && preparingId === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => !isPreparing && onOpenDocument(doc)}
                  className={cn(
                    'grid grid-cols-12 items-center py-2.5 px-4 hover:bg-surface-container-low cursor-pointer transition-colors group',
                    isPreparing && 'cursor-wait'
                  )}
                >
                  <div className="col-span-6 flex items-center gap-2.5 truncate pr-2">
                    {isItemOpening ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500/80 shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-blue-500/80 shrink-0" />
                    )}
                    <span className="text-xs font-medium text-on-surface truncate group-hover:text-blue-600/90 transition-colors">
                      {doc.title}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className={cn('text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-md border font-medium', getFormatBadgeStyle(doc.format))}>
                      {doc.format}
                    </span>
                  </div>
                  <div className="col-span-3 text-xs text-on-surface-variant truncate">
                    {formatDocsDate(doc.lastModified)}
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <button
                      type="button"
                      disabled={isPreparing}
                      onClick={(e) => onRemoveDocument(doc, e)}
                      title="Remove or delete document"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-outline hover:text-slate-700 hover:bg-slate-100/80 transition-all disabled:pointer-events-none"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
