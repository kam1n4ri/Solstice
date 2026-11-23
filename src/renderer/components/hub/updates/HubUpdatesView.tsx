import React, { useState, useEffect, useCallback } from 'react';
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

  // Single-expand accordion state
  const [openVersion, setOpenVersion] = useState<string | null>(() => {
    const initial = getCachedOrInitialReleases();
    return initial[0]?.version || CURRENT_APP_VERSION;
  });

  const latestRelease = releases[0] || null;
  const hasUpdate = Boolean(latestRelease && compareVersions(latestRelease.version, CURRENT_APP_VERSION) > 0);

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

  useEffect(() => {
    loadReleases();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTogglePill = (version: string) => {
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
      <div className="px-margin py-space-xl max-w-4xl mx-auto w-full">
        {/* Header — Simple, clean, no gimmicks */}
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-on-surface tracking-tight">
            Updates
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Release history and changelog.
          </p>
        </header>

        {/* Status & Check Bar */}
        <HubUpdatesHero
          latestRelease={latestRelease}
          hasUpdate={hasUpdate}
          isChecking={isChecking}
          lastCheckedTime={lastCheckedTime}
          onCheckForUpdates={loadReleases}
          onOpenReleaseUrl={handleOpenUrl}
        />

        {/* Releases List */}
        <div className="space-y-2">
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

        <div className="pb-16" />
      </div>
    </div>
  );
};
