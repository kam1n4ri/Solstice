import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  FolderArchive,
} from 'lucide-react';
import { RecentFileRecord, ToolId } from '@shared/types';
import { HubFileCard } from './HubFileCard';

interface HubFilesViewProps {
  onLaunchTool: (toolId: ToolId, filePath?: string) => void;
}

export const HubFilesView: React.FC<HubFilesViewProps> = ({ onLaunchTool }) => {
  const [files, setFiles] = useState<RecentFileRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToolFilter, setSelectedToolFilter] = useState<'all' | 'docs' | 'whiteboard' | 'pdf'>('all');
  const [isLoading, setIsLoading] = useState(false);

  const loadFiles = useCallback(async () => {
    if (!window.solsticeAPI?.getRecentFiles) return;
    setIsLoading(true);
    try {
      const records = await window.solsticeAPI.getRecentFiles();
      setFiles(records || []);
    } catch (err) {
      console.error('Failed to load recent files in Hub:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleOpen = (tool: ToolId, filePath: string) => {
    onLaunchTool(tool, filePath);
  };

  const handleReveal = (filePath: string) => {
    if (window.solsticeAPI?.revealInFolder) {
      window.solsticeAPI.revealInFolder(filePath);
    }
  };

  const handleDelete = async (filePath: string) => {
    if (!window.solsticeAPI?.deleteFile) return;
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this file? It will be moved to your system trash.'
    );
    if (!confirmDelete) return;

    try {
      const res = await window.solsticeAPI.deleteFile(filePath);
      if (res.success) {
        setFiles((prev) => prev.filter((f) => f.filePath !== filePath));
      } else {
        alert(res.error || 'Failed to delete file.');
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesTool =
        selectedToolFilter === 'all' || f.tool === selectedToolFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        f.fileName.toLowerCase().includes(q) ||
        f.filePath.toLowerCase().includes(q);
      return matchesTool && matchesSearch;
    });
  }, [files, selectedToolFilter, searchQuery]);

  const toolFilters = [
    { id: 'all', label: 'All Files' },
    { id: 'docs', label: 'Docs' },
    { id: 'whiteboard', label: 'Whiteboards' },
    { id: 'pdf', label: 'PDFs' },
  ];

  return (
    <div className="flex flex-col w-full px-margin py-space-xl max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface tracking-tight">
            Files &amp; Workspaces
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Access, organize, and open your recent documents across all Solstice applications.
          </p>
        </div>

        <button
          type="button"
          onClick={loadFiles}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-container text-on-surface hover:bg-secondary-container hover:text-on-secondary-fixed-variant transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </header>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-surface-container">
        {/* Tool Filter Pills */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container/60 border border-outline-variant/20 self-start">
          {toolFilters.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedToolFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedToolFilter === tab.id
                  ? 'bg-surface-container-lowest text-on-surface shadow-xs font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter files by name or path..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-outline focus:ring-1 focus:ring-outline/20 transition-all"
          />
        </div>
      </div>

      {/* Content Grid or Empty State */}
      {filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiles.map((file) => (
            <HubFileCard
              key={file.filePath}
              file={file}
              onOpen={handleOpen}
              onReveal={handleReveal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-container/60 border border-outline-variant/30 text-on-surface-variant flex items-center justify-center mb-3">
            <FolderArchive className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-on-surface">No recent files found</h3>
          <p className="text-xs text-on-surface-variant mt-1 max-w-sm">
            {searchQuery
              ? 'No files matched your filter query. Clear your search to view all recent files.'
              : 'Files created or opened in Solstice Docs, Whiteboard, or PDF Studio will appear here automatically.'}
          </p>
        </div>
      )}
    </div>
  );
};
