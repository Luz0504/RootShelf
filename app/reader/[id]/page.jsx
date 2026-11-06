'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRootShelf } from '../../../src/context/RootShelfContext';
import { ArrowBackIcon } from '../../../src/components/Icons';
import { BookCover } from '../../../src/components/BookCover';

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params?.id;

  const {
    stories,
    isAuthenticated,
    isStoryOwner,
    saveStories,
    setShowAuthPrompt,
  } = useRootShelf();

  const story = stories.find((s) => s.id === storyId) || stories[0];
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);

  // Author check: reliable verification based on authorId & currentUserId
  const canEdit = isStoryOwner(story);

  const currentChapter = story?.chapters?.[currentChapterIndex] || story?.chapters?.[0];

  if (!story) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-gray-600">No se encontró la historia solicitada.</p>
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2 bg-[#134038] text-white text-sm font-semibold cursor-pointer"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  const handleBackClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleEditDetailsClick = () => {
    if (!canEdit) {
      if (!isAuthenticated) setShowAuthPrompt(true);
      return;
    }
    router.push(`/stories/${story.id}/edit`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* Top Bar: Volver + Edit Story Details button (only visible to authenticated owner) */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBackClick}
          className="flex items-center gap-2 text-gray-800 hover:text-[#A3195B] font-semibold text-sm transition-colors cursor-pointer"
          title="Volver"
        >
          <ArrowBackIcon className="w-5 h-5" />
          <span>Volver</span>
        </button>

        {canEdit && (
          <button
            type="button"
            onClick={handleEditDetailsClick}
            className="px-4 py-2 bg-[#134038] hover:bg-[#0e2e28] text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer"
          >
            Editar Detalles de la Historia
          </button>
        )}
      </div>

      {/* Grid: Left column (Cover + Chapters) & Right column (Reading pane) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 4 columns */}
        <div className="lg:col-span-4 space-y-4">
          <div className="w-full max-w-sm mx-auto aspect-[4/3] border border-gray-300 relative overflow-hidden shadow-xs">
            <BookCover
              coverUrl={story.coverUrl}
              title={story.title}
              author={story.author}
              genre={story.genre}
              id={story.id}
            />
          </div>

          {/* Chapters list vertical: Scrollable on mobile to avoid pushing reader pane off-screen */}
          <div className="space-y-2 max-h-60 sm:max-h-72 lg:max-h-none overflow-y-auto pr-1">
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-1 lg:hidden">
              Capítulos disponibles ({story.chapters.length})
            </div>
            {story.chapters.map((chapter, idx) => {
              const isActive = idx === currentChapterIndex;
              return (
                <button
                  key={chapter.id || idx}
                  type="button"
                  onClick={() => setCurrentChapterIndex(idx)}
                  className={`w-full text-left px-3.5 py-2.5 sm:py-3 font-semibold text-xs sm:text-sm transition-colors border cursor-pointer min-h-[42px] flex items-center ${
                    isActive
                      ? 'bg-[#A3195B] text-white border-[#A3195B]'
                      : 'bg-[#9E9E9E] text-gray-900 border-gray-400 hover:bg-[#8e8e8e]'
                  }`}
                >
                  <span className="truncate">
                    {chapter.title.startsWith('Capítulo')
                      ? chapter.title
                      : `Capítulo ${chapter.number || idx + 1}: ${chapter.title}`}
                  </span>
                </button>
              );
            })}
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={() => router.push(`/stories/${story.id}/chapters/create`)}
              className="w-full mt-2 py-2.5 px-3 bg-[#134038] hover:bg-[#0e2c26] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-[0.98] shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233] min-h-[44px]"
            >
              <span>+ Agregar Nuevo Capítulo</span>
            </button>
          )}
        </div>

        {/* Right Area: 8 columns (Reading area) */}
        <div className="lg:col-span-8 min-w-0 max-w-full bg-[#9E9E9E]/25 border border-gray-300 p-4 sm:p-6 md:p-10 lg:p-12 min-h-[450px]">
          {currentChapter ? (
            <div className="w-full min-w-0 max-w-2xl mx-auto space-y-6">
              <div className="border-b border-gray-300 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-[#A3195B] uppercase tracking-wider block truncate">
                    {story.title}
                  </span>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-1 break-words">
                    {currentChapter.title}
                  </h1>
                </div>

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => router.push(`/stories/${story.id}/chapters/${currentChapter.id}/edit`)}
                    className="px-3.5 py-2 bg-[#A3195B] hover:bg-[#8e154f] active:scale-[0.98] text-white text-xs font-semibold shrink-0 cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233] self-start min-h-[38px]"
                    title="Editar capítulo en pantalla amplia"
                  >
                    Editar Capítulo
                  </button>
                )}
              </div>

              <div className="text-gray-800 text-base sm:text-lg leading-relaxed sm:leading-loose whitespace-pre-wrap break-words [overflow-wrap:anywhere] font-serif w-full max-w-full">
                {currentChapter.content}
              </div>

              {/* Navigation between chapters: Thumb-friendly stacked or side-by-side */}
              <div className="pt-8 sm:pt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-gray-300">
                <button
                  type="button"
                  disabled={currentChapterIndex === 0}
                  onClick={() => {
                    setCurrentChapterIndex(currentChapterIndex - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2.5 bg-[#9E9E9E] disabled:opacity-40 text-black text-xs font-bold uppercase tracking-wider border border-gray-400 cursor-pointer active:scale-[0.98] transition-all min-h-[44px] flex items-center justify-center"
                >
                  ← Capítulo Anterior
                </button>

                <button
                  type="button"
                  disabled={currentChapterIndex >= story.chapters.length - 1}
                  onClick={() => {
                    setCurrentChapterIndex(currentChapterIndex + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2.5 bg-[#A3195B] disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider hover:bg-[#8e154f] cursor-pointer active:scale-[0.98] transition-all min-h-[44px] flex items-center justify-center"
                >
                  Siguiente Capítulo →
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 bg-[#134038] text-white flex items-center justify-center mx-auto text-xl font-bold">
                📖
              </div>
              <h3 className="text-lg font-bold text-gray-900">Esta historia no tiene capítulos</h3>
              <p className="text-xs text-gray-600">
                {canEdit
                  ? 'Todavía no agregaste capítulos a esta historia. Podés redactar el primer capítulo ahora en la pantalla dedicada.'
                  : 'El autor aún no ha publicado capítulos para esta obra.'}
              </p>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => router.push(`/stories/${story.id}/chapters/create`)}
                  className="px-5 py-2.5 bg-[#A3195B] hover:bg-[#8e154f] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                >
                  + Escribir Primer Capítulo
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
