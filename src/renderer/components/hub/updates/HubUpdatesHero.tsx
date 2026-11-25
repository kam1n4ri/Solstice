import React from 'react';
import { RefreshCw, ArrowUpRight } from 'lucide-react';
import { CURRENT_APP_VERSION, ReleaseNote } from '@/lib/hub/updatesService';

interface HubUpdatesHeroProps {
  latestRelease: ReleaseNote | null;
  hasUpdate: boolean;
  isChecking: boolean;
  lastCheckedTime: string | null;
  checkError?: string | null;
  onCheckForUpdates: () => void;
  onOpenReleaseUrl: (url: string) => void;
}

export const HubUpdatesHero: React.FC<HubUpdatesHeroProps> = ({
  latestRelease,
  hasUpdate,
  isChecking,
  lastCheckedTime,
  checkError,
  onCheckForUpdates,
  onOpenReleaseUrl,
}) => {
  const versionNum = CURRENT_APP_VERSION.replace(/^v/, '');
  const releaseTargetUrl = latestRelease?.downloadUrl || latestRelease?.htmlUrl;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-surface-container/60">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-on-surface">
            Solstice {versionNum}
          </span>
          <span className="text-xs text-outline">•</span>
          <span className="text-xs text-on-surface-variant font-medium">
            {hasUpdate && latestRelease
              ? `Update ${latestRelease.version} available`
              : checkError
              ? 'Could not reach release server'
              : 'Up to date'}
          </span>
        </div>
        {checkError ? (
          <p className="text-[11px] text-outline mt-0.5">
            Showing cached release notes ({checkError})
          </p>
        ) : lastCheckedTime ? (
          <p className="text-[11px] text-outline mt-0.5">
            Checked at {lastCheckedTime}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={isChecking}
          onClick={onCheckForUpdates}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'Checking...' : 'Check for updates'}</span>
        </button>

        {hasUpdate && latestRelease && releaseTargetUrl && (
          <button
            type="button"
            onClick={() => onOpenReleaseUrl(releaseTargetUrl)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50/70 dark:bg-blue-950/40 text-blue-700/90 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/50 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
          >
            <span>Download {latestRelease.version}</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
