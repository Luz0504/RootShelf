'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRootShelf } from '../context/RootShelfContext';
import { ArrowBackIcon, VectorPlusIcon, SearchIcon } from './Icons';
import { ImagePickerBox } from './ImagePickerBox';

export function StoryForm({ initialStory = null }) {
  const router = useRouter();
  const {
    currentUser,
    stories,
    saveStories,
    characters,
    places,
  } = useRootShelf();

  const [title, setTitle] = useState(initialStory?.title || '');
  const [genre, setGenre] = useState(initialStory?.genre || '');
  const [description, setDescription] = useState(initialStory?.description || '');
  const [selectedCharacters, setSelectedCharacters] = useState(
    initialStory?.characters || []
  );
  const [selectedPlaces, setSelectedPlaces] = useState(
    initialStory?.locations || []
  );
  const [hashtags, setHashtags] = useState(
    initialStory?.hashtags ? initialStory.hashtags.join(' ') : ''
  );
  const [classification, setClassification] = useState(
    initialStory?.classification || ''
  );
  const [language, setLanguage] = useState(initialStory?.language || 'Español');
  const [coverUrl, setCoverUrl] = useState(initialStory?.coverUrl || '');
  const [chapters, setChapters] = useState(
    initialStory?.chapters && initialStory.chapters.length > 0
      ? initialStory.chapters
      : [
          {
            id: `ch-${Date.now()}-1`,
            number: 1,
            title: 'Capítulo 1: Inicio',
            content: 'Escribe aquí el contenido del primer capítulo...',
          },
        ]
  );

  const [showCharModal, setShowCharModal] = useState(false);
  const [showPlaceModal, setShowPlaceModal] = useState(false);

  const handleDeleteChapter = (chId) => {
    if (chapters.length <= 1) {
      return;
    }
    const updated = chapters.filter((c) => String(c.id) !== String(chId));
    setChapters(updated);
  };

  const handleSubmit = (e, andWriteChapter = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!title.trim()) return;

    if (initialStory) {
      // Editing existing story
      const updatedStory = {
        ...initialStory,
        title: title.trim(),
        genre: genre.trim() || 'Ficción general',
        description: description.trim(),
        coverUrl,
        characters: selectedCharacters,
        locations: selectedPlaces,
        hashtags: hashtags.split(' ').filter(Boolean),
        classification: classification.trim() || 'Todo público',
        language: language.trim() || 'Español',
        chapters,
      };

      const updatedStories = stories.map((s) =>
        s.id === initialStory.id ? updatedStory : s
      );
      saveStories(updatedStories);

      if (andWriteChapter) {
        router.push(`/stories/${initialStory.id}/chapters/create`);
      } else {
        router.push(`/reader/${initialStory.id}`);
      }
    } else {
      // Creating new story
      const newStoryId = `story-${Date.now()}`;
      const newStory = {
        id: newStoryId,
        title: title.trim(),
        author: currentUser?.username || 'Martín Sueldo',
        authorId: currentUser?.id || 'user_martin_01',
        genre: genre.trim() || 'Ficción general',
        description: description.trim(),
        coverUrl,
        characters: selectedCharacters,
        locations: selectedPlaces,
        objects: [],
        hashtags: hashtags.split(' ').filter(Boolean),
        classification: classification.trim() || 'Todo público',
        language: language.trim() || 'Español',
        isDraft: true,
        isRead: false,
        isOwner: true,
        chapters: chapters && chapters.length > 0 ? chapters : [],
      };

      saveStories([...stories, newStory]);

      if (andWriteChapter) {
        router.push(`/stories/${newStoryId}/chapters/create`);
      } else {
        router.push(`/reader/${newStoryId}`);
      }
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/profile?tab=escritos');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-800 hover:text-[#A3195B] font-semibold text-sm transition-colors cursor-pointer"
        >
          <ArrowBackIcon className="w-5 h-5" />
          <span>Volver</span>
        </button>

        {initialStory && (
          <Link
            href={`/reader/${initialStory.id}`}
            className="px-4 py-2 bg-[#134038] hover:bg-[#0d2c26] text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer"
          >
            Ver en Modo Lectura →
          </Link>
        )}
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
        {initialStory ? 'Editar Detalles de la Historia' : 'Crear Nueva Historia'}
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: 7 columns */}
        <div className="lg:col-span-7 space-y-5">
          {/* Titulo */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">
              Titulo
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre de la obra..."
              className="w-full h-10 px-3 bg-[#9E9E9E]/40 border border-gray-400 text-gray-900 focus:bg-white focus:outline-none focus:border-[#A3195B]"
            />
          </div>

          {/* Género */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">
              Género
            </label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Fantasía, Ciencia Ficción, Misterio..."
              className="w-full h-10 px-3 bg-[#9E9E9E]/40 border border-gray-400 text-gray-900 focus:bg-white focus:outline-none focus:border-[#A3195B]"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">
              Descripción
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sinopsis o resumen de la trama..."
              className="w-full p-3 bg-[#9E9E9E]/40 border border-gray-400 text-gray-900 focus:bg-white focus:outline-none focus:border-[#A3195B] resize-y"
            />
          </div>

          {/* Personajes */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Personajes
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <Link
                href="/characters/create"
                className="h-10 px-4 bg-[#9E9E9E] hover:bg-[#8b8b8b] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-gray-400 w-full sm:w-auto"
              >
                <VectorPlusIcon className="w-4 h-4 text-white" />
                <span>Agregar Nuevo</span>
              </Link>

              <button
                type="button"
                onClick={() => setShowCharModal(true)}
                className="h-10 px-4 bg-[#9E9E9E] hover:bg-[#8b8b8b] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-gray-400 w-full sm:w-auto"
              >
                <SearchIcon className="w-4 h-4 text-white" />
                <span>Buscar en Personajes</span>
              </button>
            </div>

            {selectedCharacters.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedCharacters.map((cId) => {
                  const char = characters.find((c) => c.id === cId);
                  return (
                    <span
                      key={cId}
                      className="px-2.5 py-1 bg-[#F9B233] text-black text-xs font-semibold flex items-center gap-1.5"
                    >
                      {char ? `${char.firstName} ${char.lastName}` : cId}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCharacters(selectedCharacters.filter((id) => id !== cId))
                        }
                        className="hover:text-red-700 font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lugares */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Lugares
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <Link
                href="/places/create"
                className="h-10 px-4 bg-[#9E9E9E] hover:bg-[#8b8b8b] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-gray-400 w-full sm:w-auto"
              >
                <VectorPlusIcon className="w-4 h-4 text-white" />
                <span>Agregar Nuevo</span>
              </Link>

              <button
                type="button"
                onClick={() => setShowPlaceModal(true)}
                className="h-10 px-4 bg-[#9E9E9E] hover:bg-[#8b8b8b] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-gray-400 w-full sm:w-auto"
              >
                <SearchIcon className="w-4 h-4 text-white" />
                <span>Buscar en Lugares</span>
              </button>
            </div>

            {selectedPlaces.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedPlaces.map((pId) => {
                  const place = places.find((p) => p.id === pId);
                  return (
                    <span
                      key={pId}
                      className="px-2.5 py-1 bg-[#134038] text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      {place ? place.name : pId}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPlaces(selectedPlaces.filter((id) => id !== pId))
                        }
                        className="hover:text-[#F9B233] font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hashtags */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">
              Hashtags
            </label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#Aventura #Fantasía #Misterio"
              className="w-full h-10 px-3 bg-[#9E9E9E]/40 border border-gray-400 text-gray-900 focus:bg-white focus:outline-none focus:border-[#A3195B]"
            />
          </div>

          {/* Clasificación & Idioma */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-800">
                Clasificación
              </label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                className="w-full h-10 px-3 bg-[#9E9E9E]/40 border border-gray-400 text-gray-900 focus:bg-white focus:outline-none focus:border-[#A3195B]"
              >
                <option value="Todo público">Todo público</option>
                <option value="+13">+13</option>
                <option value="+16">+16</option>
                <option value="+18">+18</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-800">
                Idioma
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-10 px-3 bg-[#9E9E9E]/40 border border-gray-400 text-gray-900 focus:bg-white focus:outline-none focus:border-[#A3195B]"
              >
                <option value="Español">Español</option>
                <option value="Inglés">Inglés</option>
                <option value="Portugués">Portugués</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Form: 5 columns (Portada + Capítulos) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Portada de la Historia
            </label>
            <ImagePickerBox
              imageUrl={coverUrl}
              onChange={(url) => setCoverUrl(url)}
              label="Carátula de la Historia"
            />
          </div>

          {/* Capítulos */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-800">
                Capítulos ({chapters.length})
              </label>
              {initialStory && (
                <button
                  type="button"
                  onClick={() => router.push(`/stories/${initialStory.id}/chapters/create`)}
                  className="text-xs text-[#A3195B] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  + Escribir Nuevo Capítulo
                </button>
              )}
            </div>

            {initialStory ? (
              <div className="space-y-2.5">
                {chapters.length === 0 ? (
                  <div className="p-4 bg-white border border-gray-300 text-center text-xs text-gray-500">
                    Esta historia todavía no tiene capítulos registrados.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {chapters.map((ch, idx) => (
                      <div
                        key={ch.id || idx}
                        className="p-3 bg-white border border-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-gray-900 truncate">
                            {ch.title || `Capítulo ${idx + 1}`}
                          </h4>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {ch.content ? `${ch.content.split(/\s+/).filter(Boolean).length} palabras` : 'Capítulo sin contenido'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => router.push(`/stories/${initialStory.id}/chapters/${ch.id}/edit`)}
                            className="px-3 py-1 bg-[#134038] hover:bg-[#0e2c26] active:scale-[0.98] text-white text-xs font-semibold transition-all cursor-pointer"
                          >
                            Escribir / Editar
                          </button>
                          {chapters.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteChapter(ch.id)}
                              className="px-2.5 py-1 bg-gray-100 hover:bg-red-50 text-red-700 hover:text-red-800 active:scale-[0.98] text-xs font-semibold border border-gray-300 transition-all cursor-pointer"
                              title="Eliminar capítulo"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => router.push(`/stories/${initialStory.id}/chapters/create`)}
                  className="w-full py-2.5 bg-white border-2 border-dashed border-[#134038] hover:bg-[#134038]/5 text-[#134038] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>+ Escribir nuevo capítulo en pantalla independiente</span>
                </button>
              </div>
            ) : (
              <div className="p-4 bg-white border border-gray-300 space-y-2.5 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#134038] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    ✍️
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                      Escritura en pantalla dedicada
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Al guardar los datos generales de tu historia, podrás ingresar directamente al nuevo editor de pantalla completa para redactar tu primer capítulo con total comodidad y espacio.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 space-y-2">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, !initialStory)}
              className="w-full py-3 bg-[#A3195B] hover:bg-[#8e154f] active:scale-[0.98] text-white font-bold text-sm uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233]"
            >
              {initialStory ? 'Guardar Cambios de la Historia' : 'Guardar y Redactar Primer Capítulo'}
            </button>

            {!initialStory && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                className="w-full py-2.5 bg-white border border-gray-400 hover:bg-gray-100 active:scale-[0.98] text-gray-800 font-semibold text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer"
              >
                Guardar historia como borrador
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Modal Seleccionar Personajes */}
      {showCharModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white max-w-lg w-full border-2 border-[#134038] p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-bold text-gray-900">Seleccionar Personajes</h3>
              <button
                type="button"
                onClick={() => setShowCharModal(false)}
                className="text-gray-400 hover:text-black font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {characters.map((c) => {
                const isSelected = selectedCharacters.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCharacters(selectedCharacters.filter((id) => id !== c.id));
                      } else {
                        setSelectedCharacters([...selectedCharacters, c.id]);
                      }
                    }}
                    className={`p-3 border cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'border-[#F9B233] bg-[#F9B233]/15'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">
                        {c.firstName} {c.lastName}
                      </h4>
                      <p className="text-xs text-gray-600 line-clamp-1">{c.roleInStory}</p>
                    </div>
                    <span className="text-xs font-bold text-[#134038]">
                      {isSelected ? '✓ Seleccionado' : '+ Seleccionar'}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="pt-2 border-t flex justify-end">
              <button
                type="button"
                onClick={() => setShowCharModal(false)}
                className="px-4 py-2 bg-[#134038] text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Seleccionar Lugares */}
      {showPlaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white max-w-lg w-full border-2 border-[#134038] p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-bold text-gray-900">Seleccionar Lugares</h3>
              <button
                type="button"
                onClick={() => setShowPlaceModal(false)}
                className="text-gray-400 hover:text-black font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {places.map((p) => {
                const isSelected = selectedPlaces.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedPlaces(selectedPlaces.filter((id) => id !== p.id));
                      } else {
                        setSelectedPlaces([...selectedPlaces, p.id]);
                      }
                    }}
                    className={`p-3 border cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'border-[#134038] bg-[#134038]/15'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{p.name}</h4>
                      <p className="text-xs text-gray-600 line-clamp-1">{p.location}</p>
                    </div>
                    <span className="text-xs font-bold text-[#134038]">
                      {isSelected ? '✓ Seleccionado' : '+ Seleccionar'}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="pt-2 border-t flex justify-end">
              <button
                type="button"
                onClick={() => setShowPlaceModal(false)}
                className="px-4 py-2 bg-[#134038] text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
