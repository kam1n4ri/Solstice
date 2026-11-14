import React from 'react';
import {
  FileText,
  PenTool,
  BookOpen,
  FolderOpen,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { RecentFileRecord, ToolId } from '@shared/types';

interface HubFileCardProps {
  file: RecentFileRecord;
  onOpen: (tool: ToolId, filePath: string) => void;
  onReveal: (filePath: string) => void;
  onDelete: (filePath: string) => void;
}

const TOOL_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; bg: string; text: string; border: string }
> = {
  docs: {
    label: 'Solstice Docs',
    icon: FileText,
    bg: 'bg-blue-50/70',
    text: 'text-blue-700/90',
    border: 'border-blue-200/60',
  },
  whiteboard: {
    label: 'Whiteboard',
    icon: PenTool,
    bg: 'bg-amber-50/70',
    text: 'text-amber-800/90',
    border: 'border-amber-200/60',
  },
  pdf: {
    label: 'PDF Studio',
    icon: BookOpen,
    bg: 'bg-rose-50/70',
    text: 'text-rose-700/90',
    border: 'border-rose-200/60',
  },
};

export const HubFileCard: React.FC<HubFileCardProps> = ({
  file,
  onOpen,
  onReveal,
  onDelete,
}) => {
  const config = TOOL_CONFIG[file.tool] || {
    label: file.tool,
    icon: FileText,
    bg: 'bg-stone-50',
    text: 'text-stone-700',
    border: 'border-stone-200/60',
  };

  const IconComp = config.icon;
  const formattedDate = new Date(file.lastModified).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      onClick={() => onOpen(file.tool, file.filePath)}
      className="group relative flex flex-col justify-between p-4 rounded-2xl bg-white border border-stone-200/70 hover:border-stone-300 hover:shadow-xs transition-all duration-150 cursor-pointer select-none"
    >
      <div>
        {/* Top Badges & Tool Icon */}
        <div className="flex items-center justify-between mb-3">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium ${config.bg} ${config.text} ${config.border}`}
          >
            <IconComp className="w-3.5 h-3.5 shrink-0" />
            <span>{config.label}</span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReveal(file.filePath);
              }}
              title="Reveal in folder"
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(file.filePath);
              }}
              title="Delete file"
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* File Name */}
        <h4 className="text-sm font-semibold text-stone-800 tracking-tight truncate group-hover:text-stone-900">
          {file.fileName}
        </h4>

        {/* Truncated File Path */}
        <p className="text-[11px] text-stone-400 font-mono truncate mt-0.5" title={file.filePath}>
          {file.filePath}
        </p>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
        <span>Modified {formattedDate}</span>
        <span className="flex items-center gap-1 text-stone-400 group-hover:text-stone-600 transition-colors font-medium">
          <span>Open</span>
          <ExternalLink className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
};
