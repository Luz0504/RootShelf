'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRootShelf } from '../context/RootShelfContext';
import { ArrowBackIcon, VectorPlusIcon, SearchIcon } from './Icons';
import { ImagePickerBox } from './ImagePickerBox';

export function PlaceForm({ initialPlace = null }) {
  const router = useRouter();
  const {
    folders,
    places,
    savePlaces,
    stories,
  } = useRootShelf();

  const placeFolders = folders.filter((f) => f.type === 'places');

  const [name, setName] = useState(initialPlace?.name || '');
  const [description, setDescription] = useState(initialPlace?.description || '');
  const [location, setLocation] = useState(initialPlace?.location || '');
  const [appearsIn, setAppearsIn] = useState(initialPlace?.appearsIn || '');
  const [imageUrl, setImageUrl] = useState(initialPlace?.imageUrl || '');
  const [folderId, setFolderId] = useState(
    initialPlace?.folderId || placeFolders[0]?.id || ''
  );

  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [showStorySearch, setShowStorySearch] = useState(false);
  const [isAddingLocationText, setIsAddingLocationText] = useState(false);
  const [isAddingAppearsInText, setIsAddingAppearsInText] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const savedPlace = {
      id: initialPlace?.id || `place-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      location: location.trim() || undefined,
      appearsIn: appearsIn.trim() || undefined,
      imageUrl,
      folderId,
    };

    if (initialPlace) {
      const updated = places.map((p) =>
        p.id === initialPlace.id ? savedPlace : p
      );
      savePlaces(updated);
    } else {
      savePlaces([...places, savedPlace]);
    }

    router.push('/places');
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/places');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
      <button
        type="button"
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-800 hover:text-[#A3195B] font-semibold text-sm transition-colors cursor-pointer"
      >
        <ArrowBackIcon className="w-5 h-5" />
        <span>Volver</span>
      </button>

      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
        {initialPlace ? 'Editar lugar' : 'Lugar nuevo'}
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 7 cols */}
        <div className="lg:col-span-7 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">
              Nombre
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. El Valle Sombrío"
              className="w-full h-10 px-3 bg-[#9E9E9E]/40 border border-gray-400 text-gray-900 focus:bg-white focus:outline-none focus:border-[#A3195B]"
            />
          </div>

          {placeFolders.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-800">
                Carpeta
              </label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full h-10 px-3 bg-[#9E9E9E]/40 border border-gray-400 text-gray-900 focus:bg-white focus:outline-none focus:border-[#A3195B]"
              >
                {placeFolders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">
              Descripción
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Clima, arquitectura, historia y atmósfera del lugar..."
              className="w-full p-3 bg-[#9E9E9E]/40 border border-gray-400 text-gray-900 focus:bg-white focus:outline-none focus:border-[#A3195B] resize-y"
            />
          </div>

          {/* Ubicación */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Ubicación
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsAddingLocationText(!isAddingLocationText)}
                className="h-10 px-4 bg-[#9E9E9E] hover:bg-[#8b8b8b] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer border border-gray-400 w-full sm:w-auto"
              >
                <VectorPlusIcon className="w-4 h-4 text-white" />
                <span>Agregar Nuevo</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLocationSearch(true)}
                className="h-10 px-4 bg-[#9E9E9E] hover:bg-[#8b8b8b] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer border border-gray-400 w-full sm:w-auto"
              >
                <SearchIcon className="w-4 h-4 text-white" />
                <span>Buscar en Lugares</span>
              </button>
            </div>

            {(isAddingLocationText || location) && (
              <div className="pt-2">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej. Frontera de Eldoria / Sector 7"
                  className="w-full h-10 px-3 bg-[#9E9E9E]/40 border border-gray-400 text-gray-900 focus:bg-white focus:outline-none focus:border-[#A3195B]"
                />
              </div>
            )}
          </div>

          {/* Aparece en */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Aparece en
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsAddingAppearsInText(!isAddingAppearsInText)}
                className="h-10 px-4 bg-[#9E9E9E] hover:bg-[#8b8b8b] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer border border-gray-400"
              >
                <VectorPlusIcon className="w-4 h-4 text-white" />
                <span>Agregar Nuevo</span>
              </button>

              <button
                type="button"
                onClick={() => setShowStorySearch(true)}
                className="h-10 px-4 bg-[#9E9E9E] hover:bg-[#8b8b8b] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer border border-gray-400"
              >
                <SearchIcon className="w-4 h-4 text-white" />
                <span>Buscar en Historias</span>
              </button>
            </div>

            {(isAddingAppearsInText || appearsIn) && (
              <div className="pt-2">
                <input
                  type="text"
                  value={appearsIn}
                  onChange={(e) => setAppearsIn(e.target.value)}
                  placeholder="Título de la historia..."
                  className="w-full h-10 px-3 bg-[#9E9E9E]/40 border border-gray-400 text-gray-900 focus:bg-white focus:outline-none focus:border-[#A3195B]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 5 cols */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Fotografía / Ilustración del Lugar
            </label>
            <ImagePickerBox
              imageUrl={imageUrl}
              onChange={(url) => setImageUrl(url)}
              label="Foto del Lugar"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3 bg-[#A3195B] hover:bg-[#8e154f] text-white font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer"
            >
              {initialPlace ? 'Guardar Cambios' : 'Guardar Lugar'}
            </button>
          </div>
        </div>
      </form>

      {/* Modal Buscar en Lugares */}
      {showLocationSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white max-w-md w-full border-2 border-[#134038] p-6 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-bold text-gray-900">Buscar en Lugares</h3>
              <button
                type="button"
                onClick={() => setShowLocationSearch(false)}
                className="text-gray-400 hover:text-black font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {places.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setLocation(p.name);
                    setShowLocationSearch(false);
                  }}
                  className="p-3 border border-gray-200 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                >
                  <span className="font-bold text-sm text-gray-900">{p.name}</span>
                  <span className="text-xs text-[#134038] font-bold">+ Seleccionar</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Buscar en Historias */}
      {showStorySearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white max-w-md w-full border-2 border-[#134038] p-6 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-bold text-gray-900">Buscar en Historias</h3>
              <button
                type="button"
                onClick={() => setShowStorySearch(false)}
                className="text-gray-400 hover:text-black font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {stories.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setAppearsIn(s.title);
                    setShowStorySearch(false);
                  }}
                  className="p-3 border border-gray-200 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                >
                  <span className="font-bold text-sm text-gray-900">{s.title}</span>
                  <span className="text-xs text-[#134038] font-bold">+ Seleccionar</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
