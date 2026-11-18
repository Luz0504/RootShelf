'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
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
    folders,
    isStoryOwner,
    refreshFromSupabase,
    subscription,
    planTier,
    subscriptionStatus,
    isPremium,
    planLimits,
    allPlanLimits,
    isLoadingSubscription,
    isRefreshingSubscription,
    subscriptionError,
    limitsError,
    refreshSubscription,
    retrySubscription,
    checkResourceLimit,
    openPlanLimitModal,
    verifyMercadoPagoSubscription,
    cancelMercadoPagoSubscription,
  } = useRootShelf();

  const [currentTab, setCurrentTab] = useState(initialTab);
  const [workspaceSubTab, setWorkspaceSubTab] = useState('personajes');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCancelSubConfirm, setShowCancelSubConfirm] = useState(false);
  const [isCancelingSub, setIsCancelingSub] = useState(false);
  const [isCheckingMpStatus, setIsCheckingMpStatus] = useState(false);
  const [planActionNotice, setPlanActionNotice] = useState(null);

  const [userName, setUserName] = useState(currentUser?.username || '');
  const [userBio, setUserBio] = useState(currentUser?.bio || '');
  const [userStatus, setUserStatus] = useState(currentUser?.status || 'Disponible');

  const tabParam = searchParams.get('tab');
  useEffect(() => {
    if (tabParam && ['leidos', 'escritos', 'trabajo', 'plan'].includes(tabParam)) {
      setCurrentTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (isAuthenticated && currentTab === 'plan') {
      refreshSubscription({ silent: true });
    }
  }, [isAuthenticated, currentTab, refreshSubscription]);

  useEffect(() => {
    if (currentUser) {
      setUserName(currentUser.username || '');
      setUserBio(currentUser.bio || '');
      setUserStatus(currentUser.status || 'Disponible');
    }
  }, [currentUser]);

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
    PRESET_STATUSES.find((s) => s.label === currentUser?.status)?.color || '#A3195B';

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
              {currentUser?.avatar ? (
                <>
                  <img
                    src={currentUser.avatar}
                    alt={currentUser?.username || 'Usuario'}
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
                      {currentUser?.username || 'Usuario'}
                    </h1>

                    {isLoadingSubscription && !planTier ? (
                      <span className="px-2.5 py-0.5 bg-gray-100 text-gray-500 text-[11px] font-semibold uppercase tracking-wider">
                        Verificando plan...
                      </span>
                    ) : subscriptionError ? (
                      <button
                        type="button"
                        onClick={() => setCurrentTab('plan')}
                        className="px-2.5 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-semibold uppercase tracking-wider cursor-pointer"
                        title="No se pudo verificar el estado de tu plan"
                      >
                        Plan sin verificar
                      </button>
                    ) : isPremium ? (
                      <Link
                        href="/premium"
                        className="px-2.5 py-0.5 bg-gradient-to-r from-[#F9B233] to-[#e59f23] text-gray-900 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs hover:opacity-90"
                      >
                        <span>★</span>
                        <span>Premium</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCurrentTab('plan')}
                        className="px-2.5 py-0.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-[11px] font-semibold uppercase tracking-wider cursor-pointer"
                        title="Ver detalles de tu plan Free"
                      >
                        Plan Free
                      </button>
                    )}

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsEditingStatus(!isEditingStatus)}
                        className="px-2.5 py-0.5 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                        style={{ backgroundColor: statusColor }}
                        title="Cambiar estado"
                      >
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span>{currentUser?.status || 'Disponible'}</span>
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
                      disabled={isSyncing}
                      onClick={async () => {
                        setIsSyncing(true);
                        setSyncMessage('Sincronizando...');
                        try {
                          await refreshFromSupabase(currentUser?.id);
                          setSyncMessage('¡Datos sincronizados con Supabase!');
                          setTimeout(() => setSyncMessage(null), 3500);
                        } catch (e) {
                          setSyncMessage('Error al sincronizar');
                          setTimeout(() => setSyncMessage(null), 3000);
                        } finally {
                          setIsSyncing(false);
                        }
                      }}
                      className="text-xs text-[#134038] hover:underline font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {isSyncing ? 'Sincronizando...' : 'Sincronizar datos'}
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="text-xs text-[#A3195B] hover:underline font-semibold cursor-pointer sm:ml-auto"
                    >
                      Cerrar sesión
                    </button>
                  </div>

                  {syncMessage && (
                    <div className="text-xs text-[#134038] bg-[#134038]/10 px-2.5 py-1 inline-block border-l-2 border-[#134038]">
                      {syncMessage}
                    </div>
                  )}

                  <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
                    {currentUser?.bio || 'Lector y creador de historias en RootShelf.'}
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

        <button
          type="button"
          onClick={() => setCurrentTab('plan')}
          className={`py-3 px-4 text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
            currentTab === 'plan'
              ? 'border-[#A3195B] text-[#A3195B]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Mi Plan{' '}
          {!isAuthenticated
            ? ''
            : isLoadingSubscription && !planTier
            ? ''
            : subscriptionError
            ? '(!)'
            : isPremium
            ? '★ Premium'
            : '(Free)'}
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

      {/* Tab 4: Mi Plan */}
      {currentTab === 'plan' && (
        <div className="space-y-6">
          {!isAuthenticated ? (
            <div className="bg-white border border-gray-300 p-12 text-center space-y-4">
              <UserIcon className="w-12 h-12 mx-auto text-gray-400" />
              <h3 className="text-lg font-bold text-gray-900">
                Información de suscripción privada
              </h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                Iniciá sesión para consultar el estado de tu plan, tus límites de creación y el uso de tu cuenta.
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
              {/* Loading state while verifying subscription */}
              {isLoadingSubscription && !planTier ? (
                <div className="bg-white border border-gray-300 p-8 text-center space-y-3">
                  <div className="inline-block w-6 h-6 border-2 border-[#134038] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-semibold text-gray-800">
                    Consultando el estado de tu suscripción en Supabase...
                  </p>
                  <p className="text-xs text-gray-500">
                    Esto tomará solo un momento.
                  </p>
                </div>
              ) : subscriptionError ? (
                <div className="bg-amber-50 border-l-4 border-amber-600 p-6 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h4 className="text-base font-bold text-amber-900">
                      No se pudo verificar tu suscripción
                    </h4>
                    <button
                      type="button"
                      onClick={retrySubscription}
                      disabled={isLoadingSubscription}
                      className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-50 self-start sm:self-auto"
                    >
                      {isLoadingSubscription ? 'Reintentando...' : 'Reintentar'}
                    </button>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Ocurrió un problema al consultar tu suscripción en Supabase ({subscriptionError}).
                    No podemos confirmar el plan activo en este momento. Hacé clic en Reintentar para volver a consultar.
                  </p>
                </div>
              ) : (
                <>
                  {/* Error banner if plan limits query failed */}
                  {limitsError && (
                    <div className="bg-amber-50 border-l-4 border-amber-600 p-4 flex items-center justify-between gap-3">
                      <p className="text-xs text-amber-900">{limitsError}</p>
                      <button
                        type="button"
                        onClick={retrySubscription}
                        className="px-3 py-1 bg-amber-700 text-white text-xs font-semibold uppercase cursor-pointer shrink-0"
                      >
                        Reintentar
                      </button>
                    </div>
                  )}

                  {/* Subscription Action Notice */}
                  {planActionNotice && (
                    <div
                      className={`p-4 border-l-4 flex items-start justify-between gap-3 text-xs ${
                        planActionNotice.type === 'success'
                          ? 'bg-emerald-50 border-[#134038] text-emerald-950'
                          : planActionNotice.type === 'error'
                          ? 'bg-red-50 border-[#A3195B] text-red-950'
                          : 'bg-amber-50 border-[#F9B233] text-amber-950'
                      }`}
                    >
                      <span>{planActionNotice.text}</span>
                      <button
                        type="button"
                        onClick={() => setPlanActionNotice(null)}
                        className="font-bold opacity-70 hover:opacity-100 cursor-pointer shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Subscription Overview Card */}
                  <div className="bg-white border border-gray-300 p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase font-bold text-gray-500 tracking-wider">
                            Suscripción actual
                          </span>
                          {isPremium ? (
                            <span className="px-2 py-0.5 bg-[#F9B233] text-gray-950 text-[10px] font-bold uppercase tracking-wider">
                              ★ Premium
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-800 text-[10px] font-bold uppercase tracking-wider">
                              Free
                            </span>
                          )}
                          {subscription?.provider === 'mercadopago' && (
                            <span className="px-2 py-0.5 bg-[#009EE3]/15 text-[#007eb5] text-[10px] font-bold uppercase tracking-wider">
                              Mercado Pago
                            </span>
                          )}
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">
                          {isPremium ? 'RootShelf Premium' : 'RootShelf Free'}
                          {isPremium && subscription?.provider === 'mercadopago' && (
                            <span className="text-sm font-semibold text-gray-600 ml-2">
                              · $3.500 ARS / mes
                            </span>
                          )}
                        </h3>
                        {planTier === 'premium' && !isPremium && (
                          <p className="text-xs text-amber-800 mt-1">
                            Tu suscripción Premium figura con estado <strong>{subscriptionStatus}</strong>, por lo que aplican los límites del plan Free hasta que vuelva a estar activa.
                          </p>
                        )}
                        {!isPremium && subscriptionStatus === 'canceled' && (
                          <p className="text-xs text-gray-700 mt-1">
                            Tu suscripción mensual fue cancelada. Todo tu contenido previo permanece intacto y editable, y aplican los límites del plan Free para nuevas creaciones.
                          </p>
                        )}
                        {!isPremium && subscriptionStatus === 'past_due' && (
                          <p className="text-xs text-amber-800 mt-1">
                            El último cobro mensual en Mercado Pago falló o quedó pausado. Podés renovar tu suscripción desde la página de Premium sin perder tu contenido.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-gray-500">Estado</div>
                          <div
                            className={`text-xs font-bold uppercase ${
                              subscriptionStatus === 'active'
                                ? 'text-green-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {subscriptionStatus === 'active'
                              ? 'Activa'
                              : subscriptionStatus === 'canceled'
                              ? 'Cancelada'
                              : subscriptionStatus === 'past_due'
                              ? 'Pago pendiente'
                              : subscriptionStatus === 'expired'
                              ? 'Expirada'
                              : subscriptionStatus || '—'}
                          </div>
                        </div>
                        {subscription?.last_payment_at && (
                          <div className="text-right pl-3 border-l border-gray-200">
                            <div className="text-[10px] uppercase font-bold text-gray-500">
                              Último pago
                            </div>
                            <div className="text-xs text-gray-700 font-medium">
                              {new Date(subscription.last_payment_at).toLocaleDateString('es-AR')}
                            </div>
                          </div>
                        )}
                        {(subscription?.next_payment_date || subscription?.current_period_end) && (
                          <div className="text-right pl-3 border-l border-gray-200">
                            <div className="text-[10px] uppercase font-bold text-gray-500">
                              {subscription?.provider === 'mercadopago' && isPremium
                                ? 'Próximo cobro'
                                : 'Vence el'}
                            </div>
                            <div className="text-xs text-gray-700 font-medium">
                              {new Date(
                                subscription.next_payment_date || subscription.current_period_end
                              ).toLocaleDateString('es-AR')}
                            </div>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            setPlanActionNotice(null);
                            if (subscription?.mp_preapproval_id) {
                              setIsCheckingMpStatus(true);
                              const res = await verifyMercadoPagoSubscription();
                              setIsCheckingMpStatus(false);
                              if (!res.success) {
                                setPlanActionNotice({
                                  type: 'error',
                                  text: res.error || 'No se pudo consultar Mercado Pago.',
                                });
                              } else if (res.isActivePremium) {
                                setPlanActionNotice({
                                  type: 'success',
                                  text: 'Estado sincronizado: RootShelf Premium activo en Mercado Pago.',
                                });
                              } else if (res.pendingVerification) {
                                setPlanActionNotice({
                                  type: 'info',
                                  text: 'La suscripción sigue pendiente de confirmación en Mercado Pago.',
                                });
                              } else {
                                setPlanActionNotice({
                                  type: 'info',
                                  text: `Estado verificado en Mercado Pago: ${res.mpStatus || 'sin cambios'}.`,
                                });
                              }
                            } else {
                              await refreshSubscription({ forceLoading: false });
                            }
                          }}
                          disabled={isRefreshingSubscription || isCheckingMpStatus}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 text-xs font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                          title="Volver a consultar el estado real de tu suscripción"
                        >
                          {isRefreshingSubscription || isCheckingMpStatus
                            ? 'Actualizando...'
                            : 'Actualizar estado'}
                        </button>
                        {isPremium && subscription?.mp_preapproval_id && (
                          <button
                            type="button"
                            onClick={() => {
                              setPlanActionNotice(null);
                              setShowCancelSubConfirm((prev) => !prev);
                            }}
                            disabled={isCancelingSub}
                            className="px-3 py-2 border border-red-300 bg-red-50 hover:bg-red-100 text-red-800 text-xs font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                          >
                            Cancelar suscripción
                          </button>
                        )}
                        <Link
                          href="/premium"
                          className="px-4 py-2 bg-[#A3195B] hover:bg-[#8e154f] text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
                        >
                          {isPremium ? 'Ver Detalles del Plan' : 'Actualizar a Premium'}
                        </Link>
                      </div>
                    </div>

                    {/* Inline Cancel Subscription Confirmation */}
                    {showCancelSubConfirm && isPremium && subscription?.mp_preapproval_id && (
                      <div className="p-4 bg-red-50 border border-red-300 space-y-3">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-red-950">
                            ¿Confirmás la cancelación de RootShelf Premium?
                          </h4>
                          <p className="text-xs text-red-900 leading-relaxed">
                            Se cancelará el débito automático mensual de $3.500 ARS en Mercado Pago y tu cuenta volverá al plan Free.{' '}
                            <strong>
                              Ninguna de tus historias, personajes, lugares, objetos, notas o carpetas será eliminada
                            </strong>
                            : todo tu contenido previo seguirá intacto y editable, aplicándose los límites del plan Free solo si querés crear elementos nuevos que superen ese cupo.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            disabled={isCancelingSub}
                            onClick={async () => {
                              setIsCancelingSub(true);
                              const res = await cancelMercadoPagoSubscription();
                              setIsCancelingSub(false);
                              if (!res.success) {
                                setPlanActionNotice({
                                  type: 'error',
                                  text: res.error || 'No se pudo cancelar la suscripción.',
                                });
                              } else {
                                setShowCancelSubConfirm(false);
                                setPlanActionNotice({
                                  type: 'success',
                                  text: 'Suscripción cancelada en Mercado Pago. Tu cuenta volvió al plan Free y todo tu contenido sigue intacto.',
                                });
                              }
                            }}
                            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-60"
                          >
                            {isCancelingSub ? 'Cancelando en Mercado Pago...' : 'Sí, cancelar suscripción'}
                          </button>
                          <button
                            type="button"
                            disabled={isCancelingSub}
                            onClick={() => setShowCancelSubConfirm(false)}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold uppercase tracking-wider cursor-pointer"
                          >
                            Mantener Premium
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Common Unrestricted Benefits */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#EFEFEF]/50 p-4 border border-gray-200">
                      <div className="flex items-center gap-2.5 text-xs text-gray-800 font-medium">
                        <span className="w-5 h-5 rounded-full bg-[#134038] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          ✓
                        </span>
                        <span>
                          <strong>Lectura libre e ilimitada</strong> de todo el catálogo público de historias.
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-gray-800 font-medium">
                        <span className="w-5 h-5 rounded-full bg-[#134038] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          ✓
                        </span>
                        <span>
                          <strong>Capítulos ilimitados</strong> para cada historia que crees en tu cuenta.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resource Limits & Usage Cards */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 tracking-tight">
                          Uso de Recursos y Límites
                        </h3>
                        <p className="text-xs text-gray-600">
                          Monitoreo en tiempo real de los elementos creados con tu cuenta.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        {
                          key: 'stories',
                          label: 'Historias',
                          desc: 'Obras narrativas creadas',
                          link: '/stories/create',
                        },
                        {
                          key: 'characters',
                          label: 'Personajes',
                          desc: 'Fichas de personajes creadas',
                          link: '/characters/create',
                        },
                        {
                          key: 'places',
                          label: 'Lugares',
                          desc: 'Escenarios y locaciones',
                          link: '/places/create',
                        },
                        {
                          key: 'objects',
                          label: 'Objetos',
                          desc: 'Artefactos y elementos clave',
                          link: '/objects/create',
                        },
                        {
                          key: 'notes',
                          label: 'Notas Rápidas',
                          desc: 'Apuntes en borrador (local)',
                          action: () => setShowNotesModal(true),
                        },
                        {
                          key: 'folders',
                          label: 'Carpetas',
                          desc: 'Agrupaciones de contenido personalizadas',
                        },
                      ].map((res) => {
                        const status = checkResourceLimit(res.key);
                        const hasNumericLimit = typeof status.limit === 'number' && status.limit > 0;
                        const percent = hasNumericLimit
                          ? Math.min(100, Math.round((status.currentUsage / status.limit) * 100))
                          : 0;

                        return (
                          <div
                            key={res.key}
                            className={`bg-white border p-4 space-y-3 flex flex-col justify-between ${
                              status.isAtLimit
                                ? 'border-[#A3195B] ring-1 ring-[#A3195B]'
                                : status.isNearLimit
                                ? 'border-[#F9B233]'
                                : 'border-gray-300'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-gray-900">
                                  {res.label}
                                </span>
                                {status.isAtLimit ? (
                                  <span className="px-2 py-0.5 bg-[#A3195B] text-white text-[9px] font-bold uppercase tracking-wider">
                                    Límite alcanzado
                                  </span>
                                ) : status.isNearLimit ? (
                                  <span className="px-2 py-0.5 bg-[#F9B233] text-gray-950 text-[9px] font-bold uppercase tracking-wider">
                                    Próximo al límite
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[9px] font-semibold uppercase tracking-wider">
                                    Disponible
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500">{res.desc}</p>
                            </div>

                            {/* Counter and Progress bar */}
                            <div className="space-y-1.5">
                              <div className="flex items-baseline justify-between text-xs">
                                <span className="font-semibold text-gray-700">Utilizados</span>
                                <span className="font-bold text-gray-900">
                                  {status.currentUsage}{' '}
                                  <span className="text-gray-500 font-normal">
                                    / {hasNumericLimit ? status.limit : '—'}
                                  </span>
                                </span>
                              </div>

                              <div className="w-full h-2 bg-gray-200 overflow-hidden">
                                <div
                                  className="h-full transition-all duration-300"
                                  style={{
                                    width: `${percent}%`,
                                    backgroundColor: status.isAtLimit
                                      ? '#A3195B'
                                      : status.isNearLimit
                                      ? '#F9B233'
                                      : '#134038',
                                  }}
                                />
                              </div>

                              <div className="text-[10px] text-gray-500 flex justify-between">
                                <span>{hasNumericLimit ? `${percent}% del plan` : 'Sin límite cargado'}</span>
                                <span>
                                  {typeof status.remaining === 'number'
                                    ? `${status.remaining} disponibles`
                                    : '—'}
                                </span>
                              </div>
                            </div>

                            {/* Action or Alert */}
                            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                              {status.isAtLimit ? (
                                isPremium ? (
                                  <span className="text-[11px] font-semibold text-[#A3195B]">
                                    Límite del plan Premium alcanzado
                                  </span>
                                ) : (
                                  <Link
                                    href="/premium"
                                    className="text-[11px] font-bold text-[#A3195B] hover:underline"
                                  >
                                    Aumentar límite con Premium →
                                  </Link>
                                )
                              ) : res.link ? (
                                <Link
                                  href={res.link}
                                  className="text-[11px] font-semibold text-[#134038] hover:underline"
                                >
                                  + Crear {res.label.toLowerCase()}
                                </Link>
                              ) : res.action ? (
                                <button
                                  type="button"
                                  onClick={res.action}
                                  className="text-[11px] font-semibold text-[#134038] hover:underline cursor-pointer"
                                >
                                  + Crear nota
                                </button>
                              ) : (
                                <span className="text-[10px] text-gray-400">Espacio local</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Upgrade Banner in Plan Tab */}
                  {!isPremium && (
                    <div className="bg-[#134038] text-white p-6 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-[#F9B233]">
                            Multiplicá tu creatividad
                          </span>
                          <h4 className="text-xl font-bold tracking-tight">
                            ¿Necesitás más historias o personajes para tus mundos?
                          </h4>
                          <p className="text-xs text-gray-200 max-w-xl leading-relaxed">
                            {typeof allPlanLimits?.premium?.stories === 'number'
                              ? `Con RootShelf Premium pasás a ${allPlanLimits.premium.stories} historias, ${allPlanLimits.premium.characters ?? '—'} personajes, ${allPlanLimits.premium.objects ?? '—'} objetos, ${allPlanLimits.premium.places ?? '—'} lugares y ${allPlanLimits.premium.notes ?? '—'} notas, manteniendo todas tus obras sincronizadas y seguras.`
                              : 'Con RootShelf Premium ampliás significativamente tus límites de creación, manteniendo todas tus obras sincronizadas y seguras.'}
                          </p>
                        </div>

                        <Link
                          href="/premium"
                          className="px-6 py-3 bg-[#A3195B] hover:bg-[#8e154f] text-white text-xs font-bold uppercase tracking-wider text-center shrink-0 cursor-pointer shadow-md"
                        >
                          Ver Planes y Beneficios
                        </Link>
                      </div>
                    </div>
                  )}
                </>
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
                    const check = checkResourceLimit('notes');
                    if (!check.canCreate) {
                      setShowNotesModal(false);
                      openPlanLimitModal('notes');
                      return;
                    }
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

