import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ToolCategory, ToolId } from '@shared/types';
import { TOOLS_CATALOG } from '@/data/tools';
import { HubHeader } from './HubHeader';
import { HubSidebar } from './HubSidebar';
import { AppGrid } from './AppGrid';
import { HubSettingsModal } from './settings/HubSettingsModal';
import { HubFontView } from './fonts/HubFontView';
import { HubFilesView } from './files/HubFilesView';
import { HubUpdatesView } from './updates/HubUpdatesView';
import { fetchGitHubReleases, checkHasUnseenUpdate } from '@/lib/hub/updatesService';

export const HubView: React.FC = () => {
  const [activeView, setActiveView] = useState<'apps' | 'files' | 'fonts' | 'updates'>('apps');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTools, setActiveTools] = useState<ToolId[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasUnseenUpdate, setHasUnseenUpdate] = useState<boolean>(false);

  // Check for unseen updates on initial load
  useEffect(() => {
    fetchGitHubReleases().then((releases) => {
      if (releases.length > 0) {
        setHasUnseenUpdate(checkHasUnseenUpdate(releases[0].version));
      }
    }).catch(() => {});
  }, []);

  // Sync active windows on startup, on window focus, and subscribe to IPC state changes
  useEffect(() => {
    const syncActiveTools = () => {
      if (window.solsticeAPI?.getActiveTools) {
        window.solsticeAPI.getActiveTools().then(setActiveTools).catch(console.error);
      }
    };

    syncActiveTools();
    window.addEventListener('focus', syncActiveTools);
    const interval = setInterval(syncActiveTools, 1500);

    let unsubscribe: (() => void) | undefined;
    if (window.solsticeAPI?.onToolWindowStateChanged) {
      unsubscribe = window.solsticeAPI.onToolWindowStateChanged((state) => {
        setActiveTools((prev) => {
          if (state.isOpen && !prev.includes(state.toolId)) {
            return [...prev, state.toolId];
          } else if (!state.isOpen && prev.includes(state.toolId)) {
            return prev.filter((id) => id !== state.toolId);
          }
          return prev;
        });
      });
    }

    return () => {
      window.removeEventListener('focus', syncActiveTools);
      clearInterval(interval);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleLaunchTool = useCallback(async (toolId: ToolId, initialPath?: string) => {
    const target = TOOLS_CATALOG.find((t) => t.id === toolId);
    if (target && !target.isAvailable) return;

    if (!window.solsticeAPI?.openToolWindow) {
      console.warn('Solstice IPC API unavailable in standalone browser mode.');
      setActiveTools((prev) => (prev.includes(toolId) ? prev : [...prev, toolId]));
      return;
    }

    try {
      const res = await window.solsticeAPI.openToolWindow(toolId, initialPath);
      if (res.success) {
        setActiveTools((prev) => (prev.includes(toolId) ? prev : [...prev, toolId]));
      }
    } catch (err) {
      console.error('Failed to launch tool window:', err);
    }
  }, []);


  // Filter catalog by search query and category
  const filteredTools = useMemo(() => {
    return TOOLS_CATALOG.filter((tool) => {
      const matchesCategory =
        selectedCategory === 'all' || tool.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.tagline.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Aggregate active counts for sidebar badges
  const activeCountsByCategory = useMemo(() => {
    const counts: Record<ToolCategory, number> = {
      all: activeTools.length,
      productivity: 0,
      media: 0,
      utility: 0,
    };

    activeTools.forEach((activeId) => {
      const found = TOOLS_CATALOG.find((t) => t.id === activeId);
      if (found) {
        counts[found.category] = (counts[found.category] || 0) + 1;
      }
    });

    return counts;
  }, [activeTools]);

  const headerTitle = useMemo(() => {
    if (searchQuery.trim()) return 'Search Results';
    if (selectedCategory === 'productivity') return 'Productivity & Office';
    if (selectedCategory === 'media') return 'Media & Creation';
    return 'All Apps';
  }, [selectedCategory, searchQuery]);

  const headerSubtitle = useMemo(() => {
    if (searchQuery.trim()) return `Matching applications for "${searchQuery.trim()}"`;
    return 'Access and launch your suite of creative, productivity, and utility applications.';
  }, [searchQuery]);

  const handleUpdateSeen = useCallback(() => {
    setHasUnseenUpdate(false);
  }, []);

  const handleHeaderSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setActiveView('apps');
    }
  }, []);

  const handleSelectView = useCallback((view: 'apps' | 'files' | 'fonts' | 'updates') => {
    setActiveView(view);
    if (view !== 'apps') {
      setSearchQuery('');
    }
  }, []);

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface antialiased select-none">
      {/* Fixed Left Navigation Rail */}
      <HubSidebar
        currentCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setSearchQuery('');
        }}
        activeCountsByCategory={activeCountsByCategory}
        activeView={activeView}
        onSelectView={handleSelectView}
        hasUnseenUpdate={hasUnseenUpdate}
      />

      {/* Main Content Area offset by 64 (w-64 sidebar) */}
      <div className="pl-64 flex flex-col min-h-screen">
        <HubHeader
          searchQuery={searchQuery}
          onSearchChange={handleHeaderSearchChange}
          activeCount={activeTools.length}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <main className="w-full pt-14 bg-surface flex-1">
          {activeView === 'updates' ? (
            <HubUpdatesView onUpdateSeen={handleUpdateSeen} />
          ) : activeView === 'fonts' ? (
            <HubFontView />
          ) : activeView === 'files' ? (
            <HubFilesView onLaunchTool={handleLaunchTool} />
          ) : (
            <div className="flex flex-col w-full">
              <div className="px-margin py-space-xl max-w-7xl mx-auto w-full">
                {/* Header Headline */}
                <header className="mb-space-xl">
                  <h1 className="text-2xl font-semibold text-on-surface tracking-tight">
                    {headerTitle}
                  </h1>
                  <p className="text-sm text-on-surface-variant mt-space-xs">
                    {headerSubtitle}
                  </p>
                </header>

                {/* Categorized App Grid */}
                <AppGrid
                  tools={filteredTools}
                  activeTools={activeTools}
                  selectedCategory={selectedCategory}
                  isSearching={Boolean(searchQuery.trim())}
                  onLaunchTool={handleLaunchTool}
                />

                <div className="pb-16" />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Settings Modal */}
      <HubSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
