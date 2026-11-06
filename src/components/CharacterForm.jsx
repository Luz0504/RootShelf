'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRootShelf } from '../context/RootShelfContext';
import { ArrowBackIcon, VectorPlusIcon, SearchIcon } from './Icons';
import { ImagePickerBox } from './ImagePickerBox';

export function CharacterForm({ initialCharacter = null }) {
  const router = useRouter();
  const {
    folders,
    characters,
    saveCharacters,
  } = useRootShelf();

  const characterFolders = folders.filter((f) => f.type === 'characters');

  const [firstName, setFirstName] = useState(initialCharacter?.firstName || '');
  const [lastName, setLastName] = useState(initialCharacter?.lastName || '');
  const [birthDay, setBirthDay] = useState(initialCharacter?.birthDay || '');
  const [birthMonth, setBirthMonth] = useState(initialCharacter?.birthMonth || '');
  const [birthYear, setBirthYear] = useState(initialCharacter?.birthYear || '');
  const [age, setAge] = useState(initialCharacter?.age || '');
  const [gender, setGender] = useState(initialCharacter?.gender || 'Hombre');
  const [roleInStory, setRoleInStory] = useState(
    initialCharacter?.roleInStory || 'Protagonista'
  );
  const [description, setDescription] = useState(
    initialCharacter?.description || ''
  );
  const [parents, setParents] = useState(
    initialCharacter?.relationships?.parents || ''
  );
  const [folderId, setFolderId] = useState(
    initialCharacter?.folderId || characterFolders[0]?.id || ''
  );
  const [imageUrl, setImageUrl] = useState(initialCharacter?.imageUrl || '');

  const [showParentSearch, setShowParentSearch] = useState(false);
  const [isAddingParentText, setIsAddingParentText] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!firstName.trim()) return;

    const savedChar = {
      id: initialCharacter?.id || `char-${Date.now()}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDay,
      birthMonth,
      birthYear,
      age: age.trim() || undefined,
      gender,
      roleInStory,
      description: description.trim(),
      relationships: {
        ...initialCharacter?.relationships,
        parents: parents.trim() || undefined,
      },
      folderId,
      imageUrl,
    };

    if (initialCharacter) {
      const updated = characters.map((c) =>
        c.id === initialCharacter.id ? savedChar : c
      );
      saveCharacters(updated);
    } else {
      saveCharacters([...characters, savedChar]);
    }

    router.push('/characters');
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/characters');
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
        {initialCharacter ? 'Editar personaje' : 'Personaje nuevo'}
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: 7 cols */}
        <div className="lg:col-span-7 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">
              Nombre
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Ej. Valen"
              className="w-full h-10 px-3 bg-[#9E9E9E]/40 border border-gray-400 text-gray-900 focus:bg-white focus:outline-none focus:border-[#A3195B]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">
              Apellido
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Ej. Vance"
              className="w-full h-10 px-3 bg-[#9E9E9E]/40 border border-gray-400 text-gray-900 focus:bg-white focus:outline-none focus:border-[#A3195B]"
            />
          </div>

          {characterFolders.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-800">
                Carpeta
              </label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full h-10 px-3 bg-[#9E9E9E]/40 border border-gray-400 text-gray-900 focus:bg-white focus:outline-none focus:border-[#A3195B]"
              >
                {characterFolders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">
              Fecha de nacimiento
            </label>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                value={birthDay}
                onChange={(e) => setBirthDay(e.target.value)}
                placeholder="Día"
                className="h-10 px-3 bg-[#9E9E9E]/40 border border-gray-400 text-gray-900 text-center focus:bg-white focus:outline-none focus:border-[#A3195B]"
              />
              <input
                type="text"
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                placeholder="Mes"
                className="h-10 px-3 bg-[#9E9E9E]/40 border border-gray-400 text-gray-900 text-center focus:bg-white focus:outline-none focus:border-[#A3195B]"
              />
              <input
                type="text"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                placeholder="Año"
                className="h-10 px-3 bg-[#9E9E9E]/40 border border-gray-400 text-gray-900 text-center focus:bg-white focus:outline-none focus:border-[#A3195B]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">
              Edad
            </label>
            <input
              type="text"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Edad"
              className="w-32 h-10 px-3 bg-[#9E9E9E]/40 border border-gray-400 text-gray-900 text-center focus:bg-white focus:outline-none focus:border-[#A3195B]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">
              Género
            </label>
            <div className="flex gap-3">
              {['Hombre', 'Mujer', 'Otro'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`h-9 px-5 text-xs font-semibold uppercase tracking-wider transition-colors border cursor-pointer ${
                    gender === g
                      ? 'bg-[#134038] text-white border-[#134038]'
                      : 'bg-[#9E9E9E] text-gray-900 border-gray-400 hover:bg-[#8e8e8e]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">
              Rol en la historia
            </label>
            <div className="flex flex-wrap gap-2">
              {['Protagonista', 'Antagonista', 'Secundario', 'Mentor'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleInStory(r)}
                  className={`h-9 px-4 text-xs font-semibold transition-colors border cursor-pointer ${
                    roleInStory === r
                      ? 'bg-[#A3195B] text-white border-[#A3195B]'
                      : 'bg-[#9E9E9E]/40 text-gray-800 border-gray-400 hover:bg-[#9E9E9E]/60'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-800">
              Descripción
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rasgos físicos, personalidad, trasfondo y motivaciones..."
              className="w-full p-3 bg-[#9E9E9E]/40 border border-gray-400 text-gray-900 focus:bg-white focus:outline-none focus:border-[#A3195B] resize-y"
            />
          </div>

          <div className="space-y-2 pt-1 border-t border-gray-300">
            <label className="block text-sm font-semibold text-gray-800">
              Relaciones
            </label>
            <div className="space-y-1.5">
              <span className="text-xs text-gray-600 block">Padres</span>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingParentText(!isAddingParentText)}
                  className="h-10 px-4 bg-[#9E9E9E] hover:bg-[#8b8b8b] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer border border-gray-400 w-full sm:w-auto"
                >
                  <VectorPlusIcon className="w-4 h-4 text-white" />
                  <span>Agregar Nuevo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowParentSearch(true)}
                  className="h-10 px-4 bg-[#9E9E9E] hover:bg-[#8b8b8b] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer border border-gray-400 w-full sm:w-auto"
                >
                  <SearchIcon className="w-4 h-4 text-white" />
                  <span>Buscar en Personajes</span>
                </button>
              </div>

              {(isAddingParentText || parents) && (
                <div className="pt-2">
                  <input
                    type="text"
                    value={parents}
                    onChange={(e) => setParents(e.target.value)}
                    placeholder="Nombres de padres o linaje..."
                    className="w-full h-10 px-3 bg-[#9E9E9E]/40 border border-gray-400 text-gray-900 focus:bg-white focus:outline-none focus:border-[#A3195B]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: 5 cols (Imagen + Botones) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              Retrato / Ilustración
            </label>
            <ImagePickerBox
              imageUrl={imageUrl}
              onChange={(url) => setImageUrl(url)}
              label="Foto del Personaje"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3 bg-[#A3195B] hover:bg-[#8e154f] text-white font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer"
            >
              {initialCharacter ? 'Guardar Cambios' : 'Guardar Personaje'}
            </button>
          </div>
        </div>
      </form>

      {/* Modal Buscar Padre */}
      {showParentSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white max-w-md w-full border-2 border-[#134038] p-6 space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-bold text-gray-900">Buscar entre Personajes</h3>
              <button
                type="button"
                onClick={() => setShowParentSearch(false)}
                className="text-gray-400 hover:text-black font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {characters.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    const fullName = `${c.firstName} ${c.lastName}`.trim();
                    setParents((prev) => (prev ? `${prev}, ${fullName}` : fullName));
                    setShowParentSearch(false);
                  }}
                  className="p-3 border border-gray-200 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">
                      {c.firstName} {c.lastName}
                    </h4>
                    <p className="text-xs text-gray-500">{c.roleInStory}</p>
                  </div>
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
