import React from 'react';
import { ChevronDown, ArrowUpRight } from 'lucide-react';
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
      className={`w-full rounded-xl border transition-colors duration-150 overflow-hidden ${
        isOpen
          ? 'bg-surface-container-lowest border-outline-variant/50 shadow-2xs'
          : 'bg-surface-container-lowest/60 border-outline-variant/20 hover:border-outline-variant/40 hover:bg-surface-container-lowest'
      }`}
    >
      {/* Clickable Header Row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0 pr-4">
          <span className="font-mono text-xs font-semibold text-on-surface">
            {release.version}
          </span>

          <span className="text-xs text-on-surface-variant truncate">
            {release.title}
          </span>

          {isInstalled ? (
            <span className="text-[10px] font-medium text-outline px-1.5 py-0.5 rounded bg-surface-container/60">
              Current
            </span>
          ) : isNewer ? (
            <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded bg-blue-50/70 dark:bg-blue-950/40">
              New
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] text-outline font-mono hidden sm:inline">
            {release.releaseDate}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-on-surface-variant transition-transform duration-200 ease-out ${
              isOpen ? 'rotate-180 text-on-surface' : ''
            }`}
          />
        </div>
      </button>

      {/* Smooth Animated Accordion Drawer */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-2 border-t border-surface-container/50 space-y-3">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {release.summary}
            </p>

            {release.highlights && release.highlights.length > 0 && (
              <ul className="space-y-1.5 pt-1 pl-1">
                {release.highlights.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-on-surface/90">
                    <span className="h-1 w-1 rounded-full bg-outline/60 shrink-0 mt-2" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}

            {release.htmlUrl && (
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => onOpenUrl(release.htmlUrl!)}
                  className="inline-flex items-center gap-1 text-[11px] text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                >
                  <span>Release notes on GitHub</span>
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
