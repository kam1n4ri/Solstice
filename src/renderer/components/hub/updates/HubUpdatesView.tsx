import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Info } from 'lucide-react';
import {
  ReleaseNote,
  CURRENT_APP_VERSION,
  fetchGitHubReleases,
  getCachedOrInitialReleases,
  markUpdateAsSeen,
  compareVersions,
} from '@/lib/hub/updatesService';
import { HubUpdatesHero } from './HubUpdatesHero';
import { HubUpdatePill } from './HubUpdatePill';

interface HubUpdatesViewProps {
  onUpdateSeen?: () => void;
}

export const HubUpdatesView: React.FC<HubUpdatesViewProps> = ({ onUpdateSeen }) => {
  const [releases, setReleases] = useState<ReleaseNote[]>(() => getCachedOrInitialReleases());
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<string | null>(null);

  // Single-expand accordion state: stores the version tag of the open pill
  const [openVersion, setOpenVersion] = useState<string | null>(() => {
    const initial = getCachedOrInitialReleases();
    return initial[0]?.version || CURRENT_APP_VERSION;
  });

  const latestRelease = releases[0] || null;
  const hasUpdate = Boolean(latestRelease && compareVersions(latestRelease.version, CURRENT_APP_VERSION) > 0);

  // Mark latest as seen when entering the updates screen
  useEffect(() => {
    if (latestRelease) {
      markUpdateAsSeen(latestRelease.version);
      onUpdateSeen?.();
    }
  }, [latestRelease, onUpdateSeen]);

  const loadReleases = useCallback(async () => {
    setIsChecking(true);
    try {
      const data = await fetchGitHubReleases();
      setReleases(data);
      if (data.length > 0 && (!openVersion || !data.some((r) => r.version === openVersion))) {
        setOpenVersion(data[0].version);
      }
      setLastCheckedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setIsChecking(false);
    }
  }, [openVersion]);

  // Initial check on mount
  useEffect(() => {
    loadReleases();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTogglePill = (version: string) => {
    // If clicking the already open pill, close it; otherwise open this one and close any previously open pill
    setOpenVersion((prev) => (prev === version ? null : version));
  };

  const handleOpenUrl = (url: string) => {
    if (window.solsticeAPI?.openExternalUrl) {
      window.solsticeAPI.openExternalUrl(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="w-full">
      <div className="px-margin py-space-xl max-w-5xl mx-auto w-full">
        {/* Header Title */}
        <header className="mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-on-surface tracking-tight">
              Updates &amp; Releases
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-secondary-container text-on-secondary-fixed-variant">
              <Sparkles className="h-3 w-3" />
              v{CURRENT_APP_VERSION.replace(/^v/, '')}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Track new features, offline tool additions, and suite release history.
          </p>
        </header>

        {/* Top Hero Banner */}
        <HubUpdatesHero
          latestRelease={latestRelease}
          hasUpdate={hasUpdate}
          isChecking={isChecking}
          lastCheckedTime={lastCheckedTime}
          onCheckForUpdates={loadReleases}
          onOpenReleaseUrl={handleOpenUrl}
        />

        {/* Accordion List Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold tracking-wider text-outline uppercase">
              Release Changelog ({releases.length})
            </h2>
            <span className="text-[11px] text-outline flex items-center gap-1">
              <Info className="h-3 w-3" />
              Click any release to inspect notes
            </span>
          </div>

          {/* Accordion Pills List */}
          <div className="space-y-2.5">
            {releases.map((release) => (
              <HubUpdatePill
                key={release.version}
                release={release}
                isOpen={openVersion === release.version}
                onToggle={() => handleTogglePill(release.version)}
                onOpenUrl={handleOpenUrl}
              />
            ))}
          </div>
        </div>

        <div className="pb-16" />
      </div>
    </div>
  );
};
