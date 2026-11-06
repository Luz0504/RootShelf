'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRootShelf } from '../context/RootShelfContext';
import { ArrowBackIcon } from './Icons';

export function ChapterEditor({ storyId, chapterId = null, mode = 'create' }) {
  const router = useRouter();
  const {
    stories,
    saveStories,
    isAuthenticated,
    isMounted,
    isStoryOwner,
    setShowAuthPrompt,
  } = useRootShelf();

  // Find target story
  const story = useMemo(() => {
    return stories.find((s) => s.id === storyId);
  }, [stories, storyId]);

  // Find target chapter if editing
  const existingChapter = useMemo(() => {
    if (!story || !chapterId) return null;
    return story.chapters?.find((ch) => String(ch.id) === String(chapterId)) || null;
  }, [story, chapterId]);

  // Chapter state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize chapter data
  useEffect(() => {
    if (mode === 'edit' && existingChapter) {
      setTitle(existingChapter.title || '');
      setContent(existingChapter.content || '');
      setIsDirty(false);
    } else if (mode === 'create' && story) {
      const nextNum = (story.chapters?.length || 0) + 1;
      setTitle(`Capítulo ${nextNum}`);
      setContent('');
      setIsDirty(false);
    }
  }, [mode, existingChapter, story]);

  // Track unsaved changes on window unload/refresh
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handle Save
  const handleSave = useCallback(() => {
    if (!story) return;
    const finalTitle = title.trim() || (mode === 'create' ? `Capítulo ${(story.chapters?.length || 0) + 1}` : 'Capítulo sin título');
    const existingChapters = story.chapters || [];

    let updatedChapters;

    if (mode === 'edit' && chapterId) {
      // Update existing chapter
      updatedChapters = existingChapters.map((ch) => {
        if (String(ch.id) === String(chapterId)) {
          return {
            ...ch,
            title: finalTitle,
            content,
          };
        }
        return ch;
      });
    } else {
      // Create new chapter
      const nextNum = existingChapters.length + 1;
      const newId = `ch-${Date.now()}-${nextNum}`;

      const newChapter = {
        id: newId,
        number: nextNum,
        title: finalTitle,
        content,
      };

      updatedChapters = [...existingChapters, newChapter];
    }

    const updatedStory = {
      ...story,
      chapters: updatedChapters,
    };

    const updatedStories = stories.map((s) => (s.id === story.id ? updatedStory : s));
    saveStories(updatedStories);

    setIsDirty(false);
    setSaveSuccess(true);

    setTimeout(() => {
      setSaveSuccess(false);
      router.push(`/reader/${story.id}`);
    }, 600);
  }, [title, mode, story, chapterId, content, stories, saveStories, router]);

  // Keyboard shortcut: Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Word and character count calculation
  const stats = useMemo(() => {
    const trimmed = content.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = content.length;
    const readTimeMinutes = Math.max(1, Math.ceil(words / 200));
    return { words, chars, readTimeMinutes };
  }, [content]);

  // Permission & Visitor guard
  useEffect(() => {
    if (isMounted) {
      if (!isAuthenticated) {
        setShowAuthPrompt(true);
      }
    }
  }, [isMounted, isAuthenticated, setShowAuthPrompt]);

  if (!isMounted) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-20 text-center text-gray-500">
        Cargando editor de capítulos...
      </div>
    );
  }

  if (!story) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Historia no encontrada</h2>
        <p className="text-gray-600">No se pudo encontrar la historia solicitada.</p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-[#134038] hover:bg-[#0e2c26] text-white text-sm font-semibold transition-colors"
        >
          Volver a la Biblioteca
        </Link>
      </div>
    );
  }

  const canEdit = isStoryOwner(story);

  if (!isAuthenticated || !canEdit) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center space-y-4 bg-white border border-gray-300 my-8 p-8">
        <div className="w-12 h-12 mx-auto bg-[#134038] text-white flex items-center justify-center font-bold text-xl">
          🔒
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Acceso Restringido</h2>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          {!isAuthenticated
            ? 'Debés iniciar sesión en tu cuenta de RootShelf para escribir o editar capítulos de esta historia.'
            : 'Solo el autor original de esta historia tiene permisos para agregar o modificar capítulos.'}
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          {!isAuthenticated ? (
            <button
              type="button"
              onClick={() => setShowAuthPrompt(true)}
              className="px-5 py-2.5 bg-[#A3195B] hover:bg-[#8e154f] active:scale-[0.98] text-white font-semibold text-sm transition-all"
            >
              Iniciar Sesión
            </button>
          ) : null}
          <Link
            href={`/reader/${story.id}`}
            className="px-5 py-2.5 bg-[#134038] hover:bg-[#0e2c26] active:scale-[0.98] text-white font-semibold text-sm transition-all"
          >
            Volver a la Historia
          </Link>
        </div>
      </div>
    );
  }


  // Handle Cancel / Back
  const handleCancel = () => {
    if (isDirty) {
      setShowDiscardModal(true);
    } else {
      router.push(`/reader/${story.id}`);
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardModal(false);
    setIsDirty(false);
    router.push(`/reader/${story.id}`);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#EFEFEF] flex flex-col">
      {/* Top Bar / Navigation Header */}
      <div className="bg-white border-b border-gray-300 sticky top-14 md:top-16 z-30 px-3 sm:px-4 md:px-8 py-2.5 sm:py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          {/* Left: Volver + Story Context */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center gap-1.5 text-gray-700 hover:text-[#A3195B] active:scale-95 font-semibold text-xs sm:text-sm transition-all duration-150 cursor-pointer p-1 shrink-0"
              title="Volver a la historia"
            >
              <ArrowBackIcon className="w-4 h-4 text-gray-700" />
              <span className="hidden sm:inline">Volver a la historia</span>
              <span className="sm:hidden">Volver</span>
            </button>

            <span className="text-gray-300" aria-hidden="true">|</span>

            {/* Story Identification */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-hidden">
              <span className="text-xs text-gray-500 font-medium hidden md:inline">Historia:</span>
              <span className="text-xs font-bold text-[#134038] truncate max-w-[160px] sm:max-w-xs md:max-w-sm" title={story.title}>
                {story.title}
              </span>
              <span className="px-1.5 py-0.5 bg-[#134038]/10 text-[#134038] text-[10px] font-bold uppercase tracking-wider hidden sm:inline shrink-0">
                {mode === 'create' ? 'Nuevo' : 'Editando'}
              </span>
            </div>
          </div>

          {/* Right: Counters & Action Buttons */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-4 shrink-0">
            {/* Word & Status count */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-gray-600">
              <span className="font-medium text-[11px] sm:text-xs">
                {stats.words.toLocaleString()} {stats.words === 1 ? 'palabra' : 'palabras'}
              </span>
              <span className="hidden sm:inline text-gray-400">•</span>
              {isDirty ? (
                <span className="flex items-center gap-1 text-[#A3195B] font-semibold text-[10px] sm:text-[11px] bg-[#A3195B]/10 px-1.5 sm:px-2 py-0.5">
                  <span className="w-1.5 h-1.5 bg-[#A3195B] inline-block animate-pulse" />
                  Sin guardar
                </span>
              ) : (
                <span className="text-gray-500 text-[10px] sm:text-[11px] font-medium hidden sm:inline">
                  ✓ Al día
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold active:scale-[0.98] transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233] min-h-[38px] flex items-center justify-center"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saveSuccess}
                className={`px-3.5 sm:px-5 py-1.5 sm:py-2 text-white text-xs font-bold uppercase tracking-wider active:scale-[0.98] transition-all duration-150 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233] min-h-[38px] flex items-center justify-center ${
                  saveSuccess ? 'bg-[#134038]' : 'bg-[#A3195B] hover:bg-[#8e154f]'
                }`}
              >
                {saveSuccess ? '✓ Guardado' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Spacious Writing Canvas */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col space-y-4">
        {/* Story Breadcrumb Banner */}
        <div className="flex items-center justify-between text-xs text-gray-600 border-b border-gray-300 pb-2">
          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
            <span className="font-semibold text-gray-800 truncate">{story.title}</span>
            <span className="text-gray-400">›</span>
            <span className="text-gray-600 truncate">
              {mode === 'create' ? `Capítulo ${(story.chapters?.length || 0) + 1}` : existingChapter?.title || 'Capítulo'}
            </span>
          </div>
          <span className="text-gray-500 text-[11px] hidden sm:inline shrink-0">
            Tiempo est. de lectura: ~{stats.readTimeMinutes} min
          </span>
        </div>

        {/* Chapter Title Input */}
        <div className="bg-white border border-gray-300 p-3 sm:p-5 md:p-6 shadow-xs space-y-1">
          <label htmlFor="chapter-title" className="block text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Título del Capítulo
          </label>
          <input
            id="chapter-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setIsDirty(true);
            }}
            placeholder="Ej: Capítulo 1: El despertar en la penumbra"
            className="w-full text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 bg-transparent border-0 border-b-2 border-gray-200 focus:border-[#A3195B] focus:outline-none pb-1 transition-colors"
          />
        </div>

        {/* Chapter Content Large Textarea */}
        <div className="flex-1 flex flex-col bg-white border border-gray-300 p-3 sm:p-5 md:p-6 shadow-xs space-y-2 min-h-[380px] sm:min-h-[520px] lg:min-h-[680px]">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <label htmlFor="chapter-content" className="block text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Contenido del Capítulo
            </label>
            <span className="text-[10px] sm:text-[11px] text-gray-400 hidden sm:inline">
              Tip: Presioná <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 text-[10px] font-mono text-gray-700">Ctrl + S</kbd> para guardar
            </span>
          </div>

          <textarea
            id="chapter-content"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setIsDirty(true);
            }}
            placeholder="Comenzá a escribir el texto de tu capítulo aquí. Tenés todo el espacio necesario para desarrollar diálogos, descripciones y narrativa..."
            className="w-full flex-1 p-1.5 sm:p-3 bg-transparent border-0 text-gray-900 text-base sm:text-lg leading-relaxed font-serif focus:outline-none resize-none overflow-y-auto min-h-[340px] sm:min-h-[480px]"
          />
        </div>

        {/* Bottom Quick Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600 py-2">
          <div>
            <span>Total: <strong>{stats.words.toLocaleString()}</strong> palabras</span>
            <span className="mx-2">•</span>
            <span><strong>{stats.chars.toLocaleString()}</strong> caracteres</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-900 font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-[#A3195B] hover:bg-[#8e154f] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-xs"
            >
              Guardar Capítulo
            </button>
          </div>
        </div>
      </main>

      {/* Unsaved Changes Confirmation Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white max-w-md w-full border-2 border-[#134038] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h3 className="text-lg font-bold text-[#134038]">
                ¿Descartar cambios sin guardar?
              </h3>
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="text-gray-400 hover:text-black font-bold text-lg p-1"
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed">
              Tenés modificaciones en este capítulo que no fueron guardadas. Si salís ahora, perderás el texto que acabás de ingresar.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="flex-1 py-2.5 px-4 bg-[#134038] hover:bg-[#0e2c26] active:scale-[0.98] text-white font-semibold text-xs uppercase tracking-wider transition-all"
              >
                Continuar escribiendo
              </button>

              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="py-2.5 px-5 bg-white border border-gray-400 text-gray-800 hover:bg-gray-100 active:scale-[0.98] font-semibold text-xs uppercase tracking-wider transition-all"
              >
                Descartar y salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
