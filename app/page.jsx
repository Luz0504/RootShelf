'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRootShelf } from '../src/context/RootShelfContext';
import { BookCover } from '../src/components/BookCover';

export default function HomePage() {
  const router = useRouter();
  const { stories, isAuthenticated, searchQuery } = useRootShelf();

  const filteredStories = stories.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title?.toLowerCase().includes(q) ||
      s.author?.toLowerCase().includes(q) ||
      s.genre?.toLowerCase().includes(q)
    );
  });

  const primarySectionStories = filteredStories.slice(0, 6);
  const recommendedStories = filteredStories;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-8 py-5 md:py-8 space-y-8 md:space-y-10">
      {/* Active Search Notification Banner */}
      {searchQuery.trim() && (
        <div className="bg-white border-2 border-[#134038] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 text-sm text-gray-800">
            <span className="font-bold text-[#A3195B]">Búsqueda:</span>
            <span>Mostrando historias para <strong>&ldquo;{searchQuery}&rdquo;</strong> ({filteredStories.length} encontradas)</span>
          </div>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs text-[#134038] hover:text-[#A3195B] font-bold uppercase tracking-wider underline cursor-pointer self-start sm:self-auto"
          >
            Limpiar búsqueda
          </button>
        </div>
      )}

      {/* Big Hero Banner: Responsive height and padding */}
      <div className="relative w-full min-h-[220px] sm:min-h-[250px] md:h-72 bg-[#9E9E9E] overflow-hidden flex flex-col justify-end p-4 sm:p-6 md:p-10 border border-gray-300">
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent z-0" />
        {/* Visual accent using brand colors */}
        <div className="absolute top-0 right-0 w-48 h-full bg-[#A3195B]/10 pointer-events-none" />
        <div className="relative z-10 max-w-2xl text-white space-y-1.5 sm:space-y-2">
          <span className="inline-block bg-[#F9B233] text-[#134038] text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1">
            Destacado del Mes
          </span>
          <h1 className="text-xl sm:text-2xl md:text-4xl font-bold tracking-tight text-white drop-shadow-sm">
            El Susurro de las Hojas
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-200 line-clamp-2 leading-relaxed">
            Adéntrate en la tierra de Eldoria, donde los árboles antiguos conservan la memoria de civilizaciones caídas.
          </p>
          <div className="pt-1.5 sm:pt-2">
            <Link
              href="/reader/s-1"
              className="inline-block bg-[#A3195B] hover:bg-[#8e154f] active:scale-[0.98] text-white px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold tracking-wide border-0 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233] motion-reduce:transform-none"
            >
              Comenzar a leer
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Section: "Libros destacados" for guest / "Seguir leyendo" for authenticated */}
      <section className="space-y-4">
        {isAuthenticated ? (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              Seguir leyendo
            </h2>
            <p className="text-xs md:text-sm text-gray-600 mt-0.5">
              Continuá tus lecturas donde las dejaste.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              Libros destacados
            </h2>
            <p className="text-xs md:text-sm text-gray-600 mt-0.5">
              Selección de obras abiertas del catálogo disponibles para leer de inmediato.
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
          {primarySectionStories.map((story) => (
            <Link
              key={`primary-${story.id}`}
              href={`/reader/${story.id}`}
              className="group cursor-pointer flex flex-col transition-transform duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.99] motion-reduce:transform-none"
            >
              <div className="w-full aspect-[3/4] relative border border-gray-300 overflow-hidden shadow-xs group-hover:shadow-md transition-shadow duration-200">
                <BookCover
                  coverUrl={story.coverUrl}
                  title={story.title}
                  author={story.author}
                  genre={story.genre}
                  id={story.id}
                />
              </div>
              <div className="pt-2">
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#A3195B] transition-colors duration-150 line-clamp-1">
                  {story.title}
                </h3>
                <p className="text-xs text-gray-600 line-clamp-1">{story.author}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Section: Recomendados */}
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
          Recomendados
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
          {recommendedStories.map((story) => (
            <Link
              key={`rec-${story.id}`}
              href={`/reader/${story.id}`}
              className="group cursor-pointer flex flex-col transition-transform duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.99] motion-reduce:transform-none"
            >
              <div className="w-full aspect-[3/4] relative border border-gray-300 overflow-hidden shadow-xs group-hover:shadow-md transition-shadow duration-200">
                <BookCover
                  coverUrl={story.coverUrl}
                  title={story.title}
                  author={story.author}
                  genre={story.genre}
                  id={story.id}
                />
              </div>
              <div className="pt-2">
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#A3195B] transition-colors duration-150 line-clamp-1">
                  {story.title}
                </h3>
                <p className="text-xs text-gray-600 line-clamp-1">{story.author}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
