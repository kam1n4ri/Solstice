import React from 'react';
import { SearchX } from 'lucide-react';
import { ToolCategory, ToolDefinition, ToolId } from '@shared/types';
import { AppCard } from './AppCard';

interface AppGridProps {
  tools: ToolDefinition[];
  activeTools: ToolId[];
  selectedCategory: ToolCategory;
  isSearching: boolean;
  onLaunchTool: (toolId: ToolId) => Promise<void>;
}

interface CategoryGroup {
  category: ToolCategory;
  label: string;
  tools: ToolDefinition[];
}

const CATEGORY_ORDER: { id: ToolCategory; label: string }[] = [
  { id: 'productivity', label: 'Productivity & Office' },
  { id: 'media', label: 'Media & Creation' },
];

export const AppGrid: React.FC<AppGridProps> = ({
  tools,
  activeTools,
  selectedCategory,
  isSearching,
  onLaunchTool,
}) => {
  if (tools.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-surface-container-lowest border border-outline-variant/30 rounded-xl">
        <div className="h-12 w-12 rounded-full bg-surface-container flex items-center justify-center text-outline mb-3">
          <SearchX className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-semibold text-on-surface">No applications found</h3>
        <p className="text-xs text-on-surface-variant mt-1 max-w-xs">
          Try adjusting your search terms or select another category from the sidebar.
        </p>
      </div>
    );
  }

  // When searching or when a specific single category is selected
  if (isSearching || selectedCategory !== 'all') {
    return (
      <div className="flex flex-col gap-space-md">
        <div className="flex items-center gap-space-sm pb-space-xs">
          <span className="text-[11px] text-outline tracking-wider uppercase font-semibold">
            {isSearching ? 'Search Results' : tools[0]?.categoryLabel || 'Applications'}
          </span>
          <span className="h-1 w-1 rounded-full bg-outline-variant" />
          <span className="text-[11px] text-outline font-medium">
            {tools.length} {tools.length === 1 ? 'application' : 'applications'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {tools.map((tool) => (
            <AppCard
              key={tool.id}
              tool={tool}
              isOpen={activeTools.includes(tool.id)}
              onLaunch={onLaunchTool}
            />
          ))}
        </div>
      </div>
    );
  }

  // Default "All Apps" view: Grouped by category sections
  const groups: CategoryGroup[] = CATEGORY_ORDER.map((cat) => ({
    category: cat.id,
    label: cat.label,
    tools: tools.filter((t) => t.category === cat.id),
  })).filter((group) => group.tools.length > 0);

  return (
    <div className="flex flex-col gap-12">
      {groups.map((group) => (
        <section key={group.category} className="flex flex-col gap-space-md">
          <div className="flex items-center gap-space-sm pb-space-xs">
            <span className="text-[11px] text-outline tracking-wider uppercase font-semibold">
              {group.label}
            </span>
            <span className="h-1 w-1 rounded-full bg-outline-variant" />
            <span className="text-[11px] text-outline font-medium">
              {group.tools.length} {group.tools.length === 1 ? 'application' : 'applications'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {group.tools.map((tool) => (
              <AppCard
                key={tool.id}
                tool={tool}
                isOpen={activeTools.includes(tool.id)}
                onLaunch={onLaunchTool}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
