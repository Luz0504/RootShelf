'use client';

import React, { useState, useEffect } from 'react';

/**
 * Deterministic color palette selector based on string hash.
 * Uses RootShelf brand colors: #134038 (Forest), #A3195B (Berry), #F9B233 (Gold).
 */
const PALETTES = [
  {
    bg: 'bg-[#134038]',
    border: 'border-[#1f594e]',
    accentText: 'text-[#F9B233]',
    accentBg: 'bg-[#F9B233]',
    spine: 'bg-[#0b2823]',
    spineBorder: 'border-[#1b4b42]',
    subtext: 'text-white/80',
    tagBg: 'bg-black/25 text-[#F9B233]',
  },
  {
    bg: 'bg-[#A3195B]',
    border: 'border-[#be206d]',
    accentText: 'text-[#F9B233]',
    accentBg: 'bg-[#F9B233]',
    spine: 'bg-[#731040]',
    spineBorder: 'border-[#8f1650]',
    subtext: 'text-white/85',
    tagBg: 'bg-black/25 text-[#F9B233]',
  },
  {
    bg: 'bg-[#0E2E28]',
    border: 'border-[#194a40]',
    accentText: 'text-[#F9B233]',
    accentBg: 'bg-[#A3195B]',
    spine: 'bg-[#081c18]',
    spineBorder: 'border-[#123932]',
    subtext: 'text-white/80',
    tagBg: 'bg-black/30 text-white/90',
  },
  {
    bg: 'bg-[#6B133D]',
    border: 'border-[#87194e]',
    accentText: 'text-[#F9B233]',
    accentBg: 'bg-[#F9B233]',
    spine: 'bg-[#4a0b29]',
    spineBorder: 'border-[#5e0f34]',
    subtext: 'text-white/85',
    tagBg: 'bg-black/25 text-[#F9B233]',
  },
];

function getPalette(seed = '') {
  let hash = 0;
  const str = String(seed || '');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PALETTES.length;
  return PALETTES[index];
}

export function BookCover({
  coverUrl,
  title = 'Sin título',
  author,
  genre,
  id,
  className = '',
  aspectRatio = 'aspect-[3/4]',
  priority = false,
  variant = 'card', // 'card' or 'reader'
}) {
  const [imageError, setImageError] = useState(false);

  // Reset error state when coverUrl changes
  useEffect(() => {
    setImageError(false);
  }, [coverUrl]);

  const hasValidImage = Boolean(coverUrl && !imageError && coverUrl.trim() !== '');
  const palette = getPalette(id || title || genre || 'rootshelf');

  if (hasValidImage) {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        <img
          src={coverUrl}
          alt={title}
          onError={() => setImageError(true)}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] motion-reduce:transform-none"
          loading={priority ? 'eager' : 'lazy'}
        />
      </div>
    );
  }

  // Elegant Editorial Fallback Cover
  return (
    <div
      className={`relative w-full h-full overflow-hidden flex flex-row select-none ${palette.bg} ${className}`}
      aria-label={`Portada de ${title}`}
    >
      {/* Book spine simulation (left strip with binding line) */}
      <div
        className={`w-3 sm:w-3.5 shrink-0 h-full ${palette.spine} border-r ${palette.spineBorder} flex flex-col justify-between py-2 items-center relative z-10`}
        aria-hidden="true"
      >
        <div className="w-[1.5px] h-full bg-white/10" />
      </div>

      {/* Main cover area with delicate inset frame */}
      <div className="relative flex-1 h-full p-2.5 sm:p-3 flex flex-col justify-between overflow-hidden">
        {/* Subtle geometric background watermark */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none"
          aria-hidden="true"
        >
          <svg viewBox="0 0 100 100" className="w-24 h-24 stroke-white fill-none" strokeWidth="1.5">
            <rect x="20" y="20" width="60" height="60" />
            <line x1="20" y1="20" x2="80" y2="80" />
            <line x1="80" y1="20" x2="20" y2="80" />
            <circle cx="50" cy="50" r="16" />
          </svg>
        </div>

        {/* Top: genre / badge */}
        <div className="relative z-10">
          {genre ? (
            <span
              className={`inline-block px-1.5 py-0.5 text-[8.5px] sm:text-[9.5px] font-semibold uppercase tracking-wider ${palette.tagBg} border border-white/15 line-clamp-1 max-w-full`}
            >
              {genre}
            </span>
          ) : (
            <span className="inline-block text-[8px] sm:text-[9px] font-bold tracking-widest uppercase text-white/50">
              RootShelf
            </span>
          )}
        </div>

        {/* Center: Title */}
        <div className="relative z-10 my-auto py-1.5">
          <h4 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-3 tracking-tight drop-shadow-xs">
            {title}
          </h4>
        </div>

        {/* Bottom: Author and fine decorative rule */}
        <div className="relative z-10 pt-1.5 border-t border-white/20">
          {author ? (
            <p className={`text-[10px] sm:text-[11px] font-medium ${palette.subtext} line-clamp-1`}>
              {author}
            </p>
          ) : (
            <p className="text-[9px] text-white/40 tracking-wider uppercase font-medium">
              Lectura
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
