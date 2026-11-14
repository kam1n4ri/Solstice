import React, { useState, useMemo } from 'react';
import {
  LayoutGrid,
  List,
  Search,
  X,
  ArrowUpDown,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import { RecentFileRecord } from '@shared/types';
import { PhotoRecentCard, formatRelativeTime, formatFileSize } from './PhotoRecentCard';

interface PhotoRecentGridProps {
  recentFiles: RecentFileRecord[];
  onOpenRecent: (file: RecentFileRecord) => void;
  onRemoveRecent: (filePath: string, e: React.MouseEvent) => void;
  onCreateNew: () => void;
  onOpenFile: () => void;
}

type SortField = 'date' | 'name' | 'size';

export const PhotoRecentGrid: React.FC<PhotoRecentGridProps> = ({
  recentFiles,
  onOpenRecent,
  onRemoveRecent,
  onCreateNew,
  onOpenFile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Filter & Sort
  const filteredFiles = useMemo(() => {
    let result = recentFiles.filter((f) =>
      f.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      if (sortBy === 'name') {
        const cmp = a.fileName.localeCompare(b.fileName);
        return sortAsc ? cmp : -cmp;
      }
      if (sortBy === 'size') {
        const diff = (a.fileSize || 0) - (b.fileSize || 0);
        return sortAsc ? diff : -diff;
      }
      const diff = (a.lastModified || 0) - (b.lastModified || 0);
      return sortAsc ? diff : -diff;
    });

    return result;
  }, [recentFiles, searchQuery, sortBy, sortAsc]);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Photoshop Header Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">
          Welcome to Solstice Photo
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Resume recent projects or start something new
        </p>
      </div>

      {/* Control Bar: Recent label, Sort, Filter, View mode */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-stone-200/60 select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-sm font-bold text-slate-800">Recent</h2>
            <span className="text-xs text-slate-400 font-medium font-mono">
              ({recentFiles.length})
            </span>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-[11px] text-slate-400">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="bg-stone-100/70 hover:bg-stone-100 border border-stone-200/60 rounded-lg px-2 py-1 text-xs text-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="date">Last Opened</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
            </select>
            <button
              type="button"
              onClick={() => setSortAsc(!sortAsc)}
              title={sortAsc ? 'Ascending' : 'Descending'}
              className="p-1 rounded-lg hover:bg-stone-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Search Input */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter Recent Files..."
              className="pl-8 pr-7 py-1 text-xs bg-stone-100/60 border border-stone-200/70 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400 w-48 sm:w-56 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-stone-100/80 border border-stone-200/60 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              title="List View"
              className={`p-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {recentFiles.length === 0 ? (
        /* Empty State: Sleek Photoshop Drop Zone */
        <div className="flex-1 flex flex-col items-center justify-center p-12 border-2 border-dashed border-stone-300 rounded-2xl bg-white/60 text-center my-6">
          <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 mb-3.5 shadow-2xs">
            <UploadCloud className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">
            Drag and drop an image here
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
            Drag an image file onto this window, or choose from the options below to get started.
          </p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onCreateNew}
              className="h-8 px-4 rounded-lg text-xs font-medium bg-stone-900 text-white hover:bg-black shadow-xs transition-colors cursor-pointer"
            >
              Create New Canvas
            </button>
            <button
              type="button"
              onClick={onOpenFile}
              className="h-8 px-4 rounded-lg text-xs font-medium bg-white text-stone-700 border border-stone-300 hover:bg-stone-50 shadow-2xs transition-colors cursor-pointer"
            >
              Open File...
            </button>
          </div>
        </div>
      ) : filteredFiles.length === 0 ? (
        /* Search Empty */
        <div className="py-16 text-center text-slate-400">
          <p className="text-xs">No files matching &ldquo;{searchQuery}&rdquo;</p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-2 text-xs text-stone-700 font-medium hover:underline cursor-pointer"
          >
            Clear filter
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {filteredFiles.map((file) => (
            <PhotoRecentCard
              key={file.filePath}
              file={file}
              onOpen={onOpenRecent}
              onRemove={onRemoveRecent}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="flex flex-col bg-white border border-stone-200/80 rounded-2xl overflow-hidden divide-y divide-stone-100">
          {filteredFiles.map((file) => (
            <div
              key={file.filePath}
              onClick={() => onOpenRecent(file)}
              className="group flex items-center justify-between px-4 py-2.5 hover:bg-stone-50/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-7 rounded-lg bg-stone-100 border border-stone-200/50 flex items-center justify-center text-stone-400 shrink-0">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-800 truncate block">
                    {file.fileName}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate block max-w-md font-mono">
                    {file.filePath}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 text-[11px] text-slate-400 font-mono">
                <span>{formatRelativeTime(file.lastModified)}</span>
                <span className="w-16 text-right">
                  {file.fileSize ? formatFileSize(file.fileSize) : '-'}
                </span>
                <button
                  type="button"
                  onClick={(e) => onRemoveRecent(file.filePath, e)}
                  title="Remove from recents"
                  className="p-1 rounded text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
