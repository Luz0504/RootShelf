'use client';

import React, { useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRootShelf } from '../../src/context/RootShelfContext';
import { VectorPlusIcon, UserIcon, ArrowBackIcon } from '../../src/components/Icons';
import { BookCover } from '../../src/components/BookCover';

const PRESET_STATUSES = [
  { label: 'Disponible', color: '#134038' },
  { label: 'Escribiendo nuevo capítulo', color: '#A3195B' },
  { label: 'Leyendo', color: '#F9B233' },
  { label: 'Ausente', color: '#9E9E9E' },
];

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'leidos';

  const {
    isAuthenticated,
    currentUser,
    updateProfile,
    logout,
    setShowAuthPrompt,
    stories,
    characters,
    places,
    objects,
    notes,
    saveNotes,
    isStoryOwner,
  } = useRootShelf();

  const [currentTab, setCurrentTab] = useState(initialTab);
  const [workspaceSubTab, setWorkspaceSubTab] = useState('personajes');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);

  const [userName, setUserName] = useState(currentUser.username);
  const [userBio, setUserBio] = useState(currentUser.bio);
  const [userStatus, setUserStatus] = useState(currentUser.status);

  // Notes state
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingNoteIndex, setEditingNoteIndex] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  const avatarInputRef = useRef(null);

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateProfile({ avatar: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfileInfo = () => {
    updateProfile({
      username: userName,
      bio: userBio,
      status: userStatus,
    });
    setIsEditingProfile(false);
  };

  const handleSelectStatus = (newStatus) => {
    setUserStatus(newStatus);
    updateProfile({ status: newStatus });
    setIsEditingStatus(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  // Filter user stories
  const userWrittenStories = isAuthenticated
    ? stories.filter((s) => isStoryOwner(s))
    : [];

  const readStories = isAuthenticated
    ? stories.filter((s) => s.isRead)
    : [];

  const totalChaptersPublished = userWrittenStories.reduce(
    (acc, s) => acc + (s.chapters?.length || 0),
    0
  );

  const statusColor =
    PRESET_STATUSES.find((s) => s.label === currentUser.status)?.color || '#A3195B';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-[#134038] hover:opacity-80 font-normal text-sm transition-opacity cursor-pointer"
        >
          <ArrowBackIcon className="w-5 h-5" />
          <span>Volver</span>
        </button>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 md:gap-8">
        {isAuthenticated ? (
          <>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFileChange}
              className="hidden"
            />
            {/* Avatar block with sharp corners or intentional circular exception */}
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="w-28 h-28 md:w-36 md:h-36 bg-[#9E9E9E] hover:bg-[#8e8e8e] border border-gray-300 flex items-center justify-center shrink-0 cursor-pointer relative overflow-hidden group transition-colors"
              title="Hacer clic para agregar o cambiar foto de usuario"
            >
              {currentUser.avatar ? (
                <>
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.username}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-2 text-center">
                    <VectorPlusIcon className="w-8 h-8 text-white" />
                    <span className="text-[10px] font-semibold text-white uppercase tracking-wider">
                      Cambiar foto
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                  <VectorPlusIcon className="w-10 h-10 text-white group-hover:scale-105 transition-transform" />
                  <span className="text-[10px] font-semibold text-white uppercase tracking-wider">
                    Foto de usuario
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Visitor Avatar block */
          <div
            onClick={() => router.push('/register')}
            className="w-28 h-28 md:w-36 md:h-36 bg-[#9E9E9E] hover:bg-[#8e8e8e] border border-gray-300 flex flex-col items-center justify-center shrink-0 cursor-pointer text-center p-3 transition-colors"
            title="Iniciá sesión para acceder a tu perfil"
          >
            <UserIcon className="w-12 h-12 text-white opacity-80" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider mt-2">
              Visitante
            </span>
          </div>
        )}

        <div className="space-y-2 flex-1">
          {!isAuthenticated ? (
            /* Visitor Profile Information */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                  Visitante
                </h1>
                <span className="px-2.5 py-0.5 bg-gray-300 text-gray-800 text-xs font-semibold uppercase tracking-wider">
                  Modo Invitado
                </span>
              </div>
              <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
                Estás explorando RootShelf en modo invitado. Creá una cuenta o iniciá sesión para organizar tus lecturas, guardar favoritos y crear tus propias historias.
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => router.push('/register')}
                  className="px-5 py-2 bg-[#A3195B] hover:bg-[#8e154f] text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Iniciar sesión
                </button>
              </div>
            </div>
          ) : (
            /* Authenticated User Profile Information */
            <>
              {isEditingProfile ? (
                <div className="space-y-3 max-w-xl">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Nombre de Usuario
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full h-9 px-3 bg-white border border-[#134038] text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Descripción de Perfil
                    </label>
                    <textarea
                      rows={2}
                      value={userBio}
                      onChange={(e) => setUserBio(e.target.value)}
                      className="w-full p-2 bg-white border border-[#134038] text-sm focus:outline-none resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveProfileInfo}
                      className="px-4 py-1.5 bg-[#A3195B] hover:bg-[#8e154f] text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs font-semibold uppercase tracking-wider cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                      {currentUser.username}
                    </h1>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsEditingStatus(!isEditingStatus)}
                        className="px-2.5 py-0.5 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                        style={{ backgroundColor: statusColor }}
                        title="Cambiar estado"
                      >
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span>{currentUser.status}</span>
                      </button>

                      {isEditingStatus && (
                        <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-300 shadow-xl z-30 p-2 space-y-1">
                          <div className="text-[10px] uppercase font-bold text-gray-500 px-2 py-1">
                            Seleccionar Estado
                          </div>
                          {PRESET_STATUSES.map((st) => (
                            <button
                              key={st.label}
                              type="button"
                              onClick={() => handleSelectStatus(st.label)}
                              className="w-full text-left px-2 py-1.5 text-xs text-gray-800 hover:bg-[#EFEFEF] flex items-center gap-2 cursor-pointer"
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: st.color }}
                              />
                              <span>{st.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      className="text-xs text-[#134038] hover:underline font-semibold cursor-pointer"
                    >
                      Editar Perfil
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="text-xs text-[#A3195B] hover:underline font-semibold cursor-pointer sm:ml-auto"
                    >
                      Cerrar sesión
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
                    {currentUser.bio}
                  </p>
                </div>
              )}

              {/* Stats badges */}
              <div className="flex flex-wrap gap-2.5 sm:gap-4 pt-3 text-xs text-gray-700">
                <div className="bg-white border border-gray-300 px-3 py-1.5">
                  <span className="font-bold text-[#A3195B] mr-1.5">
                    {userWrittenStories.length}
                  </span>
                  Historias Escritas
                </div>
                <div className="bg-white border border-gray-300 px-3 py-1.5">
                  <span className="font-bold text-[#134038] mr-1.5">
                    {totalChaptersPublished}
                  </span>
                  Capítulos Publicados
                </div>
                <div className="bg-white border border-gray-300 px-3 py-1.5">
                  <span className="font-bold text-[#F9B233] mr-1.5">
                    {readStories.length}
                  </span>
                  Lecturas Completadas
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs Row */}
      <div className="border-b border-gray-300 flex items-center gap-2 md:gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setCurrentTab('leidos')}
          className={`py-3 px-4 text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            currentTab === 'leidos'
              ? 'border-[#A3195B] text-[#A3195B]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Libros Leídos {isAuthenticated && `(${readStories.length})`}
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('escritos')}
          className={`py-3 px-4 text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            currentTab === 'escritos'
              ? 'border-[#A3195B] text-[#A3195B]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Libros Escritos {isAuthenticated && `(${userWrittenStories.length})`}
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('trabajo')}
          className={`py-3 px-4 text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            currentTab === 'trabajo'
              ? 'border-[#A3195B] text-[#A3195B]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Área de Trabajo
        </button>
      </div>

      {/* Tab 1: Libros Leídos */}
      {currentTab === 'leidos' && (
        <div className="space-y-6">
          {!isAuthenticated ? (
            <div className="bg-white border border-gray-300 p-12 text-center space-y-4">
              <UserIcon className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="text-lg font-bold text-gray-900">
                Tu historial de lecturas está vacío
              </h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Iniciá sesión para organizar tus lecturas y acceder a tu espacio personal.
              </p>
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="px-6 py-2.5 bg-[#A3195B] hover:bg-[#8e154f] text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Iniciar sesión
              </button>
            </div>
          ) : readStories.length === 0 ? (
            <div className="bg-white border border-gray-300 p-10 text-center text-gray-600">
              Aún no has marcado historias como leídas. Explorá el catálogo principal para comenzar.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {readStories.map((story) => (
                <Link
                  key={story.id}
                  href={`/reader/${story.id}`}
                  className="group flex flex-col cursor-pointer transition-transform duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.99] motion-reduce:transform-none"
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
                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-[#A3195B] transition-colors duration-150 line-clamp-1">
                      {story.title}
                    </h4>
                    <p className="text-xs text-gray-600 line-clamp-1">{story.author}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Libros Escritos */}
      {currentTab === 'escritos' && (
        <div className="space-y-6">
          {!isAuthenticated ? (
            <div className="bg-white border border-gray-300 p-12 text-center space-y-4">
              <UserIcon className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="text-lg font-bold text-gray-900">
                No tenés historias publicadas
              </h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Iniciá sesión para organizar tus lecturas y acceder a tu espacio personal.
              </p>
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="px-6 py-2.5 bg-[#A3195B] hover:bg-[#8e154f] text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Iniciar sesión
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                    Tus Historias
                  </h2>
                  <p className="text-xs text-gray-600">
                    Obras creadas y gestionadas con tu cuenta.
                  </p>
                </div>
                <Link
                  href="/stories/create"
                  className="px-4 py-2 bg-[#A3195B] hover:bg-[#8e154f] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  <VectorPlusIcon className="w-4 h-4 text-white" />
                  <span>Crear Nueva Historia</span>
                </Link>
              </div>

              {userWrittenStories.length === 0 ? (
                <div className="bg-white border border-gray-300 p-12 text-center space-y-4">
                  <p className="text-gray-600 text-sm">
                    Aún no creaste ninguna historia.
                  </p>
                  <Link
                    href="/stories/create"
                    className="inline-block px-5 py-2 bg-[#134038] text-white text-xs font-semibold uppercase tracking-wider"
                  >
                    Crear primera historia
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userWrittenStories.map((story) => (
                    <div
                      key={story.id}
                      className="bg-white border border-gray-300 p-5 space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                            {story.title}
                          </h3>
                          {story.isDraft ? (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-bold uppercase">
                              Borrador
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold uppercase">
                              Publicado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-medium">
                          {story.genre} • {story.chapters?.length || 0} capítulos
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-3">
                          {story.description || 'Sin descripción.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
                        <Link
                          href={`/stories/${story.id}/chapters/create`}
                          className="flex-1 py-1.5 px-2 bg-[#A3195B] hover:bg-[#8e154f] active:scale-[0.98] text-white text-xs font-semibold uppercase tracking-wider text-center transition-all"
                        >
                          + Capítulo
                        </Link>
                        <Link
                          href={`/stories/${story.id}/edit`}
                          className="py-1.5 px-2.5 bg-[#134038] hover:bg-[#0e2c26] active:scale-[0.98] text-white text-xs font-semibold uppercase tracking-wider text-center transition-all"
                        >
                          Detalles
                        </Link>
                        <Link
                          href={`/reader/${story.id}`}
                          className="py-1.5 px-3 bg-gray-200 hover:bg-gray-300 active:scale-[0.98] text-gray-800 text-xs font-semibold uppercase tracking-wider text-center transition-all"
                        >
                          Leer
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab 3: Área de Trabajo */}
      {currentTab === 'trabajo' && (
        <div className="space-y-6">
          {!isAuthenticated ? (
            <div className="bg-white border border-gray-300 p-12 text-center space-y-4">
              <UserIcon className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="text-lg font-bold text-gray-900">
                Área de trabajo privada
              </h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Iniciá sesión para organizar tus lecturas y acceder a tu espacio personal.
              </p>
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="px-6 py-2.5 bg-[#A3195B] hover:bg-[#8e154f] text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Iniciar sesión
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Workspace Subtabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-300 pb-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setWorkspaceSubTab('personajes')}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer ${
                      workspaceSubTab === 'personajes'
                        ? 'bg-[#134038] text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Personajes ({characters.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkspaceSubTab('lugares')}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer ${
                      workspaceSubTab === 'lugares'
                        ? 'bg-[#134038] text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Lugares ({places.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkspaceSubTab('objetos')}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer ${
                      workspaceSubTab === 'objetos'
                        ? 'bg-[#134038] text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Objetos ({objects.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkspaceSubTab('notas')}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer ${
                      workspaceSubTab === 'notas'
                        ? 'bg-[#134038] text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Notas Rápidas ({notes.length})
                  </button>
                </div>

                <div>
                  {workspaceSubTab === 'personajes' && (
                    <Link
                      href="/characters/create"
                      className="px-3 py-1.5 bg-[#A3195B] hover:bg-[#8e154f] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <VectorPlusIcon className="w-3.5 h-3.5 text-white" />
                      <span>Nuevo Personaje</span>
                    </Link>
                  )}
                  {workspaceSubTab === 'lugares' && (
                    <Link
                      href="/places/create"
                      className="px-3 py-1.5 bg-[#A3195B] hover:bg-[#8e154f] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <VectorPlusIcon className="w-3.5 h-3.5 text-white" />
                      <span>Nuevo Lugar</span>
                    </Link>
                  )}
                  {workspaceSubTab === 'objetos' && (
                    <Link
                      href="/objects/create"
                      className="px-3 py-1.5 bg-[#A3195B] hover:bg-[#8e154f] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <VectorPlusIcon className="w-3.5 h-3.5 text-white" />
                      <span>Nuevo Objeto</span>
                    </Link>
                  )}
                  {workspaceSubTab === 'notas' && (
                    <button
                      type="button"
                      onClick={() => setShowNotesModal(true)}
                      className="px-3 py-1.5 bg-[#A3195B] hover:bg-[#8e154f] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      <VectorPlusIcon className="w-3.5 h-3.5 text-white" />
                      <span>Nueva Nota</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Personajes */}
              {workspaceSubTab === 'personajes' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {characters.map((ch) => (
                    <Link
                      key={ch.id}
                      href={`/characters/${ch.id}/edit`}
                      className="bg-white border border-gray-300 p-4 space-y-2 hover:border-[#134038] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 text-sm">
                          {ch.firstName} {ch.lastName}
                        </h4>
                        <span className="text-[10px] font-bold uppercase text-[#A3195B] bg-[#A3195B]/10 px-2 py-0.5">
                          {ch.roleInStory || 'Personaje'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {ch.description || 'Sin descripción.'}
                      </p>
                    </Link>
                  ))}
                </div>
              )}

              {/* Lugares */}
              {workspaceSubTab === 'lugares' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {places.map((pl) => (
                    <Link
                      key={pl.id}
                      href={`/places/${pl.id}/edit`}
                      className="bg-white border border-gray-300 p-4 space-y-2 hover:border-[#134038] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 text-sm">{pl.name}</h4>
                        <span className="text-[10px] font-bold text-gray-500">
                          {pl.location}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {pl.description || 'Sin descripción.'}
                      </p>
                    </Link>
                  ))}
                </div>
              )}

              {/* Objetos */}
              {workspaceSubTab === 'objetos' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {objects.map((ob) => (
                    <Link
                      key={ob.id}
                      href={`/objects/${ob.id}/edit`}
                      className="bg-white border border-gray-300 p-4 space-y-2 hover:border-[#134038] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 text-sm">{ob.name}</h4>
                        <span className="text-[10px] font-bold text-gray-500">
                          {ob.location}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {ob.description || 'Sin descripción.'}
                      </p>
                    </Link>
                  ))}
                </div>
              )}

              {/* Notas */}
              {workspaceSubTab === 'notas' && (
                <div className="space-y-3">
                  {notes.map((noteText, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-gray-300 p-4 flex items-start justify-between gap-4"
                    >
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {noteText}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = notes.filter((_, i) => i !== idx);
                          saveNotes(updated);
                        }}
                        className="text-xs text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                        title="Eliminar nota"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Nueva Nota */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white max-w-md w-full border-2 border-[#134038] p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Nueva Nota Rápida</h3>
            <textarea
              rows={4}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Escribe tus ideas de argumento, diálogos o detalles del mundo..."
              className="w-full p-3 bg-white border border-gray-300 text-sm focus:outline-none focus:border-[#134038]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewNote('');
                  setShowNotesModal(false);
                }}
                className="px-4 py-1.5 bg-gray-200 text-gray-800 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (newNote.trim()) {
                    saveNotes([...notes, newNote.trim()]);
                    setNewNote('');
                    setShowNotesModal(false);
                  }
                }}
                className="px-4 py-1.5 bg-[#A3195B] text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Guardar Nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-500">Cargando perfil...</div>}>
      <ProfileContent />
    </Suspense>
  );
}

