import React from 'react';
import { ChevronDown, ExternalLink, Sparkles, Check } from 'lucide-react';
import { CURRENT_APP_VERSION, ReleaseNote, compareVersions } from '@/lib/hub/updatesService';

interface HubUpdatePillProps {
  release: ReleaseNote;
  isOpen: boolean;
  onToggle: () => void;
  onOpenUrl: (url: string) => void;
}

export const HubUpdatePill: React.FC<HubUpdatePillProps> = ({
  release,
  isOpen,
  onToggle,
  onOpenUrl,
}) => {
  const versionDiff = compareVersions(release.version, CURRENT_APP_VERSION);
  const isInstalled = versionDiff === 0;
  const isNewer = versionDiff > 0;

  return (
    <div
      className={`w-full rounded-2xl border transition-all duration-200 overflow-hidden ${
        isOpen
          ? 'bg-surface-container-lowest border-outline-variant/50 shadow-2xs'
          : 'bg-surface-container-lowest/80 border-outline-variant/20 hover:border-outline-variant/40 hover:bg-surface-container-lowest'
      }`}
    >
      {/* Clickable Header Row / Pill */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-3.5 flex-wrap flex-1 min-w-0 pr-4">
          {/* Version badge */}
          <span className="font-mono text-sm font-semibold tracking-tight text-on-surface">
            {release.version}
          </span>

          {/* Release title */}
          <span className="text-xs font-medium text-on-surface-variant truncate max-w-md">
            {release.title}
          </span>

          {/* Status badge */}
          {isInstalled ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50/70 text-emerald-800 border border-emerald-200/60">
              <Check className="h-3 w-3 text-emerald-600" />
              Installed
            </span>
          ) : isNewer ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50/70 text-blue-700 border border-blue-200/60">
              <Sparkles className="h-3 w-3 text-blue-500 animate-pulse" />
              Newer Release
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-container-high/60 text-outline">
              Previous Version
            </span>
          )}
        </div>

        {/* Date and expand chevron */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] text-outline font-mono hidden sm:inline">
            {release.releaseDate}
          </span>
          <div
            className={`p-1 rounded-lg text-on-surface-variant transition-transform duration-200 ${
              isOpen ? 'rotate-180 bg-surface-container/60 text-on-surface' : ''
            }`}
          >
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </button>

      {/* Accordion Expandable Content */}
      {isOpen && (
        <div className="px-5 pb-5 pt-1 border-t border-surface-container/60 space-y-3.5 animate-in fade-in-50 duration-150">
          <p className="text-xs text-on-surface-variant/90 leading-relaxed">
            {release.summary}
          </p>

          {/* Bullet points */}
          {release.highlights && release.highlights.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold tracking-wider text-outline uppercase block">
                What's New &amp; Improved
              </span>
              <ul className="space-y-1.5 pl-1">
                {release.highlights.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-on-surface/90">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer action if external link exists */}
          {release.htmlUrl && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => onOpenUrl(release.htmlUrl!)}
                className="inline-flex items-center gap-1.5 text-xs text-primary/90 hover:text-primary transition-colors cursor-pointer"
              >
                <span>View release details on GitHub</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
