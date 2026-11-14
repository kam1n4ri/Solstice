import React from 'react';
import { cn } from '@/lib/utils';

interface DocsThumbnailPreviewProps {
  title?: string;
  snippet?: string;
  previewHtml?: string;
  className?: string;
}

export const DocsThumbnailPreview: React.FC<DocsThumbnailPreviewProps> = ({
  title = '',
  snippet = '',
  previewHtml = '',
  className,
}) => {
  const textContent = React.useMemo(() => {
    if (previewHtml) {
      const stripped = previewHtml
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (stripped) return stripped;
    }
    return snippet.trim();
  }, [previewHtml, snippet]);

  const paragraphs = React.useMemo(() => {
    if (!textContent) return [];
    const chunks: string[] = [];
    const words = textContent.split(' ');
    for (let i = 0; i < words.length && chunks.length < 6; i += 7) {
      chunks.push(words.slice(i, i + 7).join(' '));
    }
    return chunks;
  }, [textContent]);

  return (
    <div
      className={cn(
        'w-full h-full bg-white p-3 flex flex-col justify-start select-none overflow-hidden font-sans text-left',
        className
      )}
    >
      {title && (
        <div className="text-[7.5px] font-semibold text-slate-800 leading-tight line-clamp-2 mb-2 pb-1 border-b border-slate-100">
          {title}
        </div>
      )}

      {paragraphs.length > 0 ? (
        <div className="space-y-1.5 flex-1 overflow-hidden">
          {paragraphs.map((p, idx) => (
            <p
              key={idx}
              className="text-[5.5px] text-slate-500 leading-relaxed line-clamp-2 select-none"
            >
              {p}
            </p>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center items-center text-slate-200">
          <div className="w-12 h-[1px] bg-slate-100 mb-1" />
          <div className="w-8 h-[1px] bg-slate-100" />
        </div>
      )}
    </div>
  );
};
