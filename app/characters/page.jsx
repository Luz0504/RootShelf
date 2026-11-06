'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRootShelf } from '../../src/context/RootShelfContext';
import { ArrowBackIcon, VectorPlusIcon } from '../../src/components/Icons';

export default function CharactersPage() {
  const router = useRouter();
  const {
    characters,
    folders,
    isAuthenticated,
    isMounted,
    setShowAuthPrompt,
  } = useRootShelf();

  const [selectedFolderId, setSelectedFolderId] = useState(null);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      setShowAuthPrompt(true);
      router.push('/');
    }
  }, [isMounted, isAuthenticated, router, setShowAuthPrompt]);

  if (!isMounted || !isAuthenticated) return null;

  const characterFolders = folders.filter((f) => f.type === 'characters');
  const filteredCharacters = selectedFolderId
    ? characters.filter((c) => c.folderId === selectedFolderId)
    : characters;

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/profile?tab=trabajo');
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
          Personajes
        </h1>
        <Link
          href="/characters/create"
          className="self-start sm:self-auto px-4 py-2 bg-[#A3195B] hover:bg-[#8e154f] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
        >
          <VectorPlusIcon className="w-4 h-4 text-white" />
          <span>Nuevo Personaje</span>
        </Link>
      </div>

      {/* Folders Row */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={() => setSelectedFolderId(null)}
          className={`h-9 sm:h-11 px-4 sm:px-6 font-semibold text-xs sm:text-sm transition-colors border cursor-pointer ${
            selectedFolderId === null
              ? 'bg-[#134038] text-white border-[#134038]'
              : 'bg-[#9E9E9E] text-gray-900 border-gray-400 hover:bg-[#8e8e8e]'
          }`}
        >
          Todos
        </button>

        {characterFolders.map((folder) => {
          const isSelected = selectedFolderId === folder.id;
          return (
            <button
              key={folder.id}
              type="button"
              onClick={() => setSelectedFolderId(folder.id)}
              className={`h-11 px-5 font-semibold text-sm transition-colors border cursor-pointer ${
                isSelected
                  ? 'bg-[#134038] text-white border-[#134038]'
                  : 'bg-[#9E9E9E] text-gray-900 border-gray-400 hover:bg-[#8e8e8e]'
              }`}
            >
              {folder.name}
            </button>
          );
        })}
      </div>

      {/* Characters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <Link
          href="/characters/create"
          className="aspect-[3/4] bg-[#9E9E9E] hover:bg-[#8d8d8d] transition-colors flex flex-col items-center justify-center p-6 text-center cursor-pointer border border-gray-300 group"
        >
          <VectorPlusIcon className="w-16 h-16 text-white group-hover:scale-105 transition-transform mb-3" />
          <span className="text-white text-base font-bold">Agregar personaje</span>
        </Link>

        {filteredCharacters.map((char) => (
          <Link
            key={char.id}
            href={`/characters/${char.id}/edit`}
            className="aspect-[3/4] bg-[#9E9E9E] hover:bg-[#8d8d8d] transition-colors p-4 flex flex-col justify-between border border-gray-300 cursor-pointer relative overflow-hidden group"
          >
            {char.imageUrl && (
              <img
                src={char.imageUrl}
                alt={`${char.firstName} ${char.lastName}`}
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 transition-opacity"
              />
            )}
            <div className="relative z-10">
              <span className="inline-block px-2 py-0.5 bg-[#A3195B] text-white text-[10px] font-bold uppercase tracking-wider">
                {char.roleInStory || 'Personaje'}
              </span>
            </div>
            <div className="relative z-10 bg-white/90 p-2.5">
              <h3 className="text-base font-bold text-gray-900 line-clamp-1">
                {char.firstName} {char.lastName}
              </h3>
              <p className="text-xs text-gray-700 line-clamp-2 mt-0.5">
                {char.description || 'Sin descripción.'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
