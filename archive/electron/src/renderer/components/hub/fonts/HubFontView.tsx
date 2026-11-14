import React, { useState, useMemo, useEffect } from 'react';
import { Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GOOGLE_FONTS_CATALOG, BUILTIN_SUITE_FONTS } from './HubFontsCatalog';
import { HubFontCard } from './HubFontCard';
import { HubFontFilters, FontCategoryItem } from './HubFontFilters';
import { useHubFonts } from './useHubFonts';
import { cn } from '@/lib/utils';

export const HubFontView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'catalog' | 'installed'>('catalog');

  const {
    installedFonts,
    downloadingId,
    feedback,
    handleDownload,
    handleImportLocal,
    handleDelete,
  } = useHubFonts();

  // Load Google Fonts preview stylesheet dynamically for catalog cards
  useEffect(() => {
    const linkId = 'solstice-hub-font-preview-stylesheet';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Poppins&family=Montserrat&family=Raleway&family=Open+Sans&family=Cinzel&family=DM+Serif+Display&family=Baskervville&family=Cormorant+Garamond&family=Dancing+Script&family=Pacifico&family=Great+Vibes&family=Shadows+Into+Light&family=Bebas+Neue&family=Abril+Fatface&family=Righteous&family=Fira+Code&family=Space+Mono&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const isInstalledMap = useMemo(() => {
    const map = new Set<string>();
    installedFonts.forEach((f) => map.add(f.name.toLowerCase()));
    return map;
  }, [installedFonts]);

  const filteredBuiltin = useMemo(() => {
    return BUILTIN_SUITE_FONTS.filter((f) => {
      const matchesCategory =
        selectedCategory === 'all' || f.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      return (
        matchesCategory &&
        (!q ||
          f.name.toLowerCase().includes(q) ||
          f.tagline.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, searchQuery]);

  const filteredCatalog = useMemo(() => {
    return GOOGLE_FONTS_CATALOG.filter((f) => {
      const matchesCategory =
        selectedCategory === 'all' || f.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      return (
        matchesCategory &&
        (!q ||
          f.name.toLowerCase().includes(q) ||
          f.tagline.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, searchQuery]);

  const filteredInstalled = useMemo(() => {
    return installedFonts.filter((f) => {
      const matchesCategory =
        selectedCategory === 'all' || f.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      return matchesCategory && (!q || f.name.toLowerCase().includes(q));
    });
  }, [installedFonts, selectedCategory, searchQuery]);

  const categories: FontCategoryItem[] = [
    { id: 'all', label: 'All Categories' },
    { id: 'sans-serif', label: 'Sans-Serif' },
    { id: 'serif', label: 'Serif' },
    { id: 'handwriting', label: 'Script' },
    { id: 'display', label: 'Display' },
    { id: 'monospace', label: 'Monospace' },
  ];

  const totalSuiteAvailable = BUILTIN_SUITE_FONTS.length + installedFonts.length;

  return (
    <div className="flex flex-col w-full px-margin py-space-xl max-w-7xl mx-auto">
      {/* Header Headline */}
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-on-surface tracking-tight">
            Font Assets
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Explore, download, and manage typefaces available across all Solstice applications.
          </p>
        </div>

        <button
          type="button"
          onClick={handleImportLocal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-container text-on-surface hover:bg-secondary-container hover:text-on-secondary-fixed-variant transition-colors cursor-pointer self-start md:self-auto"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Import Font File</span>
        </button>
      </header>

      {/* Dismissible Feedback Toast */}
      {feedback && (
        <div
          className={cn(
            'flex items-center gap-2.5 px-4 py-2.5 rounded-xl border mb-5 text-xs animate-in fade-in duration-200',
            feedback.type === 'success'
              ? 'bg-emerald-50/90 border-emerald-200/70 text-emerald-800'
              : 'bg-rose-50/90 border-rose-200/70 text-rose-800'
          )}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Filters (Tabs, Search, Categories) */}
      <HubFontFilters
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalSuiteAvailable={totalSuiteAvailable}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
      />

      {/* Grid of Font Cards */}
      {activeTab === 'catalog' ? (
        filteredCatalog.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalog.map((f) => {
              const installed = isInstalledMap.has(f.name.toLowerCase());
              return (
                <HubFontCard
                  key={f.id}
                  font={f}
                  isInstalled={installed}
                  isDownloading={downloadingId === f.name}
                  sampleText={f.previewSentence}
                  onDownload={() => handleDownload(f.name, f.category)}
                  onDelete={installed ? () => handleDelete(f.name) : undefined}
                />
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-400 text-xs">
            No fonts matching your search or category filter.
          </div>
        )
      ) : filteredBuiltin.length > 0 || filteredInstalled.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBuiltin.map((f) => (
            <HubFontCard
              key={`builtin-${f.id}`}
              font={f}
              isInstalled={true}
              isPreinstalled={true}
              isDownloading={false}
              sampleText={f.previewSentence}
              onDownload={() => {}}
            />
          ))}
          {filteredInstalled.map((f) => (
            <HubFontCard
              key={f.id}
              font={f}
              isInstalled={true}
              isDownloading={false}
              sampleText={'The quick brown fox jumps over the lazy dog.'}
              onDownload={() => {}}
              onDelete={() => handleDelete(f.id)}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-slate-400 text-xs">
          No fonts found matching your search or filter.
        </div>
      )}

      <div className="pb-16" />
    </div>
  );
};
