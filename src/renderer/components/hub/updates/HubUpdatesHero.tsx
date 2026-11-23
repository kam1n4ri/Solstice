import React from 'react';
import { RefreshCw, CheckCircle2, Sparkles, ExternalLink } from 'lucide-react';
import { CURRENT_APP_VERSION, ReleaseNote } from '@/lib/hub/updatesService';

interface HubUpdatesHeroProps {
  latestRelease: ReleaseNote | null;
  hasUpdate: boolean;
  isChecking: boolean;
  lastCheckedTime: string | null;
  onCheckForUpdates: () => void;
  onOpenReleaseUrl: (url: string) => void;
}

export const HubUpdatesHero: React.FC<HubUpdatesHeroProps> = ({
  latestRelease,
  hasUpdate,
  isChecking,
  lastCheckedTime,
  onCheckForUpdates,
  onOpenReleaseUrl,
}) => {
  return (
    <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-2xs mb-8 transition-all">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Version info status */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xl font-semibold tracking-tight text-on-surface">
              Solstice {CURRENT_APP_VERSION}
            </span>

            {hasUpdate ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50/80 text-amber-800 border border-amber-200/60">
                <Sparkles className="h-3 w-3 text-amber-600 animate-pulse" />
                Update available: {latestRelease?.version}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50/80 text-emerald-800 border border-emerald-200/60">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                You're on the latest version
              </span>
            )}
          </div>

          <p className="text-xs text-on-surface-variant/80">
            {hasUpdate && latestRelease
              ? `A newer release (${latestRelease.version}) is available on GitHub with performance and tool improvements.`
              : `All installed tools and offline engines are operating at peak efficiency.`}
            {lastCheckedTime && (
              <span className="ml-2 text-outline/70">Last checked {lastCheckedTime}</span>
            )}
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2.5">
          {hasUpdate && latestRelease?.htmlUrl ? (
            <button
              type="button"
              onClick={() => onOpenReleaseUrl(latestRelease.htmlUrl!)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-blue-50/90 text-blue-700 hover:bg-blue-100/80 border border-blue-200/70 transition-colors shadow-2xs cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>View &amp; Download {latestRelease.version}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isChecking}
              onClick={onCheckForUpdates}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-surface-container-high/60 hover:bg-surface-container-high text-on-surface border border-outline-variant/30 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-on-surface-variant ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Checking...' : 'Check for updates'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
