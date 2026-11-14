import React, { useState, useEffect } from 'react';
import { Download, Check, Trash2, Loader2 } from 'lucide-react';
import { GoogleCatalogFont, InstalledFont } from '@shared/types';

interface HubFontCardProps {
  font: GoogleCatalogFont | InstalledFont;
  isInstalled: boolean;
  isDownloading: boolean;
  isPreinstalled?: boolean;
  onDownload: () => void;
  onDelete?: () => void;
  sampleText?: string;
}

export const HubFontCard: React.FC<HubFontCardProps> = ({
  font,
  isInstalled,
  isDownloading,
  isPreinstalled,
  onDownload,
  onDelete,
  sampleText = 'Sphinx of black quartz, judge my vow.',
}) => {
  const [text, setText] = useState<string>(sampleText);

  useEffect(() => {
    setText(sampleText);
  }, [sampleText]);

  const categoryBadge =
    font.category === 'serif'
      ? 'Serif'
      : font.category === 'handwriting'
      ? 'Script'
      : font.category === 'display'
      ? 'Display'
      : font.category === 'monospace'
      ? 'Mono'
      : 'Sans';

  return (
    <div className="flex flex-col justify-between p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs hover:border-outline-variant/60 hover:shadow-sm transition-all text-on-surface">
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm text-on-surface tracking-tight truncate">
              {font.name}
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-normal bg-surface-container text-on-surface-variant border border-outline-variant/30 shrink-0">
              {categoryBadge}
            </span>
          </div>
          {'tagline' in font && (
            <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
              {font.tagline}
            </p>
          )}
        </div>

        {/* Action Button: simple, subtle icons adhering to Hub theme */}
        <div className="shrink-0 flex items-center">
          {isDownloading ? (
            <div className="p-1.5 text-on-surface-variant flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin stroke-[1.75]" />
            </div>
          ) : isInstalled || isPreinstalled ? (
            <div className="flex items-center gap-0.5">
              <span
                title={isPreinstalled ? 'Suite Font' : 'Installed'}
                className="p-1.5 text-outline flex items-center justify-center select-none"
              >
                <Check className="h-4 w-4 stroke-[2]" />
              </span>
              {!isPreinstalled && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  title="Remove font"
                  className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container/20 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 stroke-[1.75]" />
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onDownload}
              title={`Download ${font.name}`}
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4 stroke-[1.75]" />
            </button>
          )}
        </div>
      </div>

      {/* Live Preview Text Area */}
      <div className="my-2 p-2.5 rounded-lg bg-surface-container-low border border-surface-container min-h-[58px] flex items-center">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ fontFamily: `'${font.name}', sans-serif` }}
          className="w-full bg-transparent border-none text-base text-on-surface focus:outline-none truncate"
        />
      </div>

      {/* Footer weights & info */}
      <div className="flex items-center justify-between text-[11px] text-outline pt-2 border-t border-surface-container/60">
        <span>{'weights' in font ? font.weights : 'Regular, Bold'}</span>
        <span className="text-[10px] text-outline">Click preview to type</span>
      </div>
    </div>
  );
};
