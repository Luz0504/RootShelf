'use client';

import React from 'react';
import Link from 'next/link';
import { RootShelfLogo } from './Icons';

export function Footer() {
  return (
    <footer className="bg-[#134038] text-white border-t border-[#0d2a25] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-3 text-center sm:text-left">
            <Link
              href="/"
              className="hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233] p-1 inline-flex items-center"
              title="RootShelf"
            >
              <RootShelfLogo className="h-7 md:h-8 w-auto" />
            </Link>
            <div className="hidden sm:block h-5 w-px bg-white/20" aria-hidden="true" />
            <p className="text-xs text-white/70 tracking-wide">
              Plataforma de lectura y taller de creación de historias
            </p>
          </div>

          {/* Social Links: Instagram, X, TikTok */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/60 mr-1 hidden sm:inline">Seguinos:</span>

            {/* Instagram */}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-label="Instagram de RootShelf"
              title="Instagram de RootShelf"
              className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-[#F9B233] hover:bg-white/5 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233] border border-white/10 hover:border-[#F9B233]/40 cursor-pointer"
              rel="noopener noreferrer"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="square"
                strokeLinejoin="miter"
                className="w-4 h-4"
                aria-hidden="true"
              >
                <rect width="18" height="18" x="3" y="3" />
                <circle cx="12" cy="12" r="4" />
                <line x1="17" x2="17.01" y1="7" y2="7" strokeWidth="2.5" />
              </svg>
            </a>

            {/* X (formerly Twitter) */}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-label="X (Twitter) de RootShelf"
              title="X de RootShelf"
              className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-[#F9B233] hover:bg-white/5 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233] border border-white/10 hover:border-[#F9B233]/40 cursor-pointer"
              rel="noopener noreferrer"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-3.5 h-3.5"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* TikTok */}
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-label="TikTok de RootShelf"
              title="TikTok de RootShelf"
              className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-[#F9B233] hover:bg-white/5 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233] border border-white/10 hover:border-[#F9B233]/40 cursor-pointer"
              rel="noopener noreferrer"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
                aria-hidden="true"
              >
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.87-4.49V8.6a8.28 8.28 0 0 0 5.21 1.84v-3.45a4.85 4.85 0 0 1-1.31-.3z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom copyright notice */}
        <div className="mt-8 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-white/50 text-center sm:text-left">
          <p>© {new Date().getFullYear()} RootShelf. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="hover:text-[#F9B233] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F9B233]"
            >
              Inicio / Catálogo
            </Link>
            <span>•</span>
            <Link
              href="/profile"
              className="hover:text-[#F9B233] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F9B233]"
            >
              Mi Perfil
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
