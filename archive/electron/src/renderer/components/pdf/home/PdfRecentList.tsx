import React, { useState } from 'react';
import { Folder, Trash2, LayoutGrid, List, Star } from 'lucide-react';
import { RecentPdfItem, formatPdfDate, formatPdfFileSize } from './PdfRecentStorage';

interface PdfRecentListProps {
  items: RecentPdfItem[];
  searchQuery: string;
  onOpenItem: (item: RecentPdfItem) => void;
  onToggleStar: (id: string, e: React.MouseEvent) => void;
  onRevealFolder: (filePath: string, e: React.MouseEvent) => void;
  onDeleteItem: (item: RecentPdfItem, e: React.MouseEvent) => void;
}

export const PdfRecentList: React.FC<PdfRecentListProps> = ({
  items,
  searchQuery,
  onOpenItem,
  onToggleStar,
  onRevealFolder,
  onDeleteItem,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredItems = items.filter((item) => {
    return (
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.filePath.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <section className="mb-12 select-none">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-baseline gap-1.5">
          <h2 className="text-sm font-bold text-slate-800 tracking-tight">Recent Documents</h2>
          <span className="text-xs text-slate-400 font-medium">{filteredItems.length}</span>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-0.5 p-1 rounded-xl bg-slate-100 border border-slate-200/60 w-fit">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'grid' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'list' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
            }`}
            title="List View"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="py-14 px-6 flex flex-col items-center justify-center text-center rounded-2xl bg-white/70 border border-dashed border-slate-200">
          <svg className="w-8 h-8 text-slate-300 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <rect x="8" y="12" width="8" height="5" rx="1" fill="currentColor" fillOpacity="0.1" />
            <text x="12" y="15.8" textAnchor="middle" fontSize="3.8" fontWeight="bold" fill="currentColor" fontFamily="sans-serif">PDF</text>
          </svg>
          <p className="text-sm font-semibold text-slate-700">
            {searchQuery ? `No documents matching "${searchQuery}"` : 'No recent documents'}
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            {searchQuery ? 'Try checking your search terms or clear the filter.' : 'Drop a PDF above or browse files to get started.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onOpenItem(item)}
              className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="h-36 rounded-xl bg-slate-100/80 flex items-center justify-center relative overflow-hidden mb-3 transition-colors group-hover:bg-slate-100">
                <svg className="w-10 h-10 text-slate-300 group-hover:text-slate-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <rect x="8" y="12" width="8" height="5" rx="1" fill="currentColor" fillOpacity="0.1" />
                  <text x="12" y="15.8" textAnchor="middle" fontSize="3.8" fontWeight="bold" fill="currentColor" fontFamily="sans-serif">PDF</text>
                </svg>

                {/* Persistent Star badge when starred */}
                {item.starred && (
                  <div className="absolute top-2 left-2 text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </div>
                )}

                {/* Hover Action Pill */}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-xs p-1 rounded-lg shadow-2xs">
                  <button
                    onClick={(e) => onToggleStar(item.id, e)}
                    className={`p-1 rounded hover:bg-slate-100 cursor-pointer ${
                      item.starred ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
                    }`}
                    title={item.starred ? 'Unstar document' : 'Star document'}
                  >
                    <Star className={`w-3.5 h-3.5 ${item.starred ? 'fill-amber-400 text-amber-500' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => onRevealFolder(item.filePath, e)}
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title="Reveal in folder"
                  >
                    <Folder className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => onDeleteItem(item, e)}
                    className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="text-xs font-semibold text-slate-800 group-hover:text-slate-900 transition-colors truncate" title={item.title}>
                {item.title}.pdf
              </h3>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-sans">
                <span>{item.fileSize ? formatPdfFileSize(item.fileSize) : '—'}</span>
                <span>{formatPdfDate(item.lastModified)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List Mode */
        <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs divide-y divide-slate-100">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onOpenItem(item)}
              className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                  <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-semibold text-slate-800 group-hover:text-slate-900 transition-colors truncate">
                      {item.title}.pdf
                    </h4>
                    {item.starred && (
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-400 font-mono truncate">
                    {item.filePath}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 text-xs text-slate-400">
                {item.fileSize && <span>{formatPdfFileSize(item.fileSize)}</span>}
                <span>{formatPdfDate(item.lastModified)}</span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => onToggleStar(item.id, e)}
                    className={`p-1 rounded-md hover:bg-slate-100 cursor-pointer ${
                      item.starred ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
                    }`}
                    title={item.starred ? 'Unstar document' : 'Star document'}
                  >
                    <Star className={`w-3.5 h-3.5 ${item.starred ? 'fill-amber-400 text-amber-500' : ''}`} />
                  </button>
                  <button
                    onClick={(e) => onRevealFolder(item.filePath, e)}
                    className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title="Reveal in folder"
                  >
                    <Folder className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => onDeleteItem(item, e)}
                    className="p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Delete document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
