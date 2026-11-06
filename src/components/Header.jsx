'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRootShelf } from '../context/RootShelfContext';
import {
  BurgerMenuIcon,
  FavoritesIcon,
  NotificationBellIcon,
  SearchIcon,
  UserIcon,
  RootShelfLogo,
} from './Icons';

export function Header() {
  const router = useRouter();
  const {
    isAuthenticated,
    currentUser,
    logout,
    setShowAuthPrompt,
    searchQuery,
    setSearchQuery,
  } = useRootShelf();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleProtectedNavigation = (path) => {
    setIsMenuOpen(false);
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
    } else {
      router.push(path);
    }
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
    router.push('/');
  };

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsMenuOpen(false);
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      router.push('/');
    }
  };

  return (
    <>
      {/* Top Navbar: Clean, modern, balanced layout with brand colors */}
      <header className="sticky top-0 z-40 bg-[#134038] text-white h-14 md:h-16 px-3 sm:px-4 md:px-8 flex items-center justify-between border-b border-[#0d2a25] shadow-xs">
        {/* Left: Burger menu trigger + RootShelf Logo */}
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6 shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="w-10 h-10 -ml-1 sm:ml-0 flex items-center justify-center text-white hover:text-[#F9B233] hover:bg-white/5 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233] cursor-pointer"
            title="Abrir menú de navegación"
            aria-label="Abrir menú"
          >
            <BurgerMenuIcon className="w-6 h-6 text-white" />
          </button>

          <Link
            href="/"
            className="flex items-center hover:opacity-90 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233] cursor-pointer"
            title="RootShelf - Inicio"
          >
            <RootShelfLogo className="h-7 sm:h-7.5 md:h-8.5 w-auto" />
          </Link>
        </div>

        {/* Center: Search input - ONLY ON DESKTOP & TABLET (hidden on mobile as requested) */}
        <div className="hidden md:flex flex-1 max-w-xl mx-6 lg:mx-10">
          <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
            <div className="absolute left-3 text-gray-500 pointer-events-none flex items-center">
              <SearchIcon className="w-4 h-4 text-gray-600" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar historias, autores o géneros..."
              className="w-full h-9 pl-9 pr-8 bg-white text-gray-900 placeholder-gray-500 text-sm focus:outline-none border-0 focus:ring-2 focus:ring-[#F9B233] transition-all duration-150 shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-gray-400 hover:text-gray-700 text-xs font-bold p-1 cursor-pointer"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </form>
        </div>

        {/* Right Actions: Favorites, Notifications & User profile */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
          {/* Favorites Button */}
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                setShowAuthPrompt(true);
              } else {
                router.push('/profile?tab=leidos');
              }
            }}
            className="w-10 h-10 flex items-center justify-center text-white hover:text-[#F9B233] hover:bg-white/5 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233] cursor-pointer"
            title="Favoritos / Guardados"
            aria-label="Favoritos"
          >
            <FavoritesIcon className="w-5 h-5" />
          </button>

          {/* Notifications Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  setShowAuthPrompt(true);
                } else {
                  setShowNotifications(!showNotifications);
                }
              }}
              className="w-10 h-10 flex items-center justify-center text-white hover:text-[#F9B233] hover:bg-white/5 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233] cursor-pointer"
              title="Notificaciones"
              aria-label="Notificaciones"
            >
              <NotificationBellIcon className="w-5 h-5" />
            </button>
            {showNotifications && isAuthenticated && (
              <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-32px)] bg-white text-gray-800 shadow-xl border border-gray-300 p-3 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="text-xs font-bold text-[#134038] mb-2 uppercase tracking-wide border-b border-gray-200 pb-1.5 flex items-center justify-between">
                  <span>Notificaciones</span>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-400 hover:text-black font-bold text-xs p-0.5"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-gray-600 py-2">No tienes notificaciones pendientes.</p>
              </div>
            )}
          </div>

          {/* User Profile Slot: Desktop shows username, mobile shows direct icon/avatar */}
          {isAuthenticated ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 h-10 px-1.5 sm:px-2.5 text-white hover:text-[#F9B233] hover:bg-white/5 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233] cursor-pointer"
              title={`Perfil de ${currentUser.username}`}
              aria-label="Mi Perfil"
            >
              {currentUser?.avatar ? (
                <div className="w-7 h-7 rounded-full overflow-hidden border border-white/50 shrink-0">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.username}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-7 h-7 bg-[#A3195B] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {currentUser.username ? currentUser.username[0].toUpperCase() : 'U'}
                </div>
              )}
              <span className="text-xs font-semibold tracking-wide hidden lg:inline max-w-[120px] truncate">
                {currentUser.username}
              </span>
            </Link>
          ) : (
            <Link
              href="/register"
              className="h-8 md:h-9 px-2.5 sm:px-3.5 bg-[#A3195B] hover:bg-[#8e154f] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-150 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233] cursor-pointer shrink-0"
              title="Iniciar sesión en RootShelf"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Iniciar sesión</span>
              <span className="sm:hidden">Ingresar</span>
            </Link>
          )}
        </div>
      </header>

      {/* Mobile & Tablet Drawer Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop with click-outside to close */}
          <div
            className="fixed inset-0 bg-black/60 transition-opacity duration-200"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer container: Rectilinear geometry, clean brand border */}
          <div className="relative w-80 max-w-[85vw] bg-white text-gray-800 shadow-2xl z-50 flex flex-col h-full border-r-2 border-[#134038] overflow-hidden animate-in slide-in-from-left duration-200">
            {/* Drawer Top Header: Logo + Close Button */}
            <div className="p-3.5 sm:p-4 bg-[#134038] text-white flex items-center justify-between shrink-0 border-b border-[#0d2a25]">
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center"
              >
                <RootShelfLogo className="h-7 w-auto" />
              </Link>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-white hover:text-[#F9B233] hover:bg-white/10 active:scale-95 transition-all cursor-pointer text-lg font-bold"
                aria-label="Cerrar menú"
                title="Cerrar menú"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Drawer Body */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
              {/* SEARCH FIELD INSIDE MENU (as required: functional on mobile) */}
              <div className="p-3.5 bg-gray-50">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Buscar en el Catálogo
                </div>
                <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                  <div className="absolute left-3 text-gray-500 pointer-events-none flex items-center">
                    <SearchIcon className="w-4 h-4 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar historias, autores..."
                    className="w-full h-10 pl-9 pr-8 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 text-sm focus:outline-none focus:border-[#134038] focus:ring-1 focus:ring-[#134038] transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 text-gray-400 hover:text-gray-700 text-xs font-bold p-1 cursor-pointer"
                      title="Limpiar"
                    >
                      ✕
                    </button>
                  )}
                </form>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="w-full mt-2 py-1.5 bg-[#134038] text-white text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-[#0e2c26] cursor-pointer text-center"
                  >
                    Ver resultados para &ldquo;{searchQuery}&rdquo;
                  </button>
                )}
              </div>

              {/* Main Navigation Links */}
              <nav className="p-3 space-y-1">
                <div className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Explorar y Lectura
                </div>

                <button
                  type="button"
                  onClick={() => {
                    router.push('/');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm font-semibold text-gray-800 hover:bg-[#EFEFEF] hover:text-[#A3195B] active:bg-gray-200 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Inicio / Catálogo</span>
                  <span className="text-xs text-gray-400">→</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      setIsMenuOpen(false);
                      setShowAuthPrompt(true);
                    } else {
                      router.push('/profile?tab=leidos');
                      setIsMenuOpen(false);
                    }
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm font-semibold text-gray-800 hover:bg-[#EFEFEF] hover:text-[#A3195B] active:bg-gray-200 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Favoritos y Leídos</span>
                  {!isAuthenticated && <span className="text-[10px] text-gray-400">🔒</span>}
                </button>
              </nav>

              {/* Writing & Workspace Section */}
              <div className="p-3 space-y-1">
                <div className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Creación y Escritura
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      setIsMenuOpen(false);
                      setShowAuthPrompt(true);
                    } else {
                      router.push('/stories/create');
                      setIsMenuOpen(false);
                    }
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm font-semibold text-[#A3195B] hover:bg-[#A3195B]/10 active:bg-[#A3195B]/20 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>+ Crear Nueva Historia</span>
                  <span className="text-xs">✨</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    router.push('/profile?tab=escritos');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm font-semibold text-gray-800 hover:bg-[#EFEFEF] hover:text-[#A3195B] active:bg-gray-200 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Mis Historias Escritas</span>
                  {!isAuthenticated && <span className="text-[10px] text-gray-400">🔒</span>}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    router.push('/profile?tab=trabajo');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm font-semibold text-gray-800 hover:bg-[#EFEFEF] hover:text-[#A3195B] active:bg-gray-200 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Área de Trabajo</span>
                  {!isAuthenticated && <span className="text-[10px] text-gray-400">🔒</span>}
                </button>
              </div>

              {/* Lore Workshop Section */}
              <div className="p-3 space-y-1">
                <div className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Taller de Lore
                </div>

                <button
                  type="button"
                  onClick={() => handleProtectedNavigation('/characters')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-[#EFEFEF] hover:text-[#134038] active:bg-gray-200 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Personajes</span>
                  {!isAuthenticated && <span className="text-[10px] text-gray-400">🔒</span>}
                </button>

                <button
                  type="button"
                  onClick={() => handleProtectedNavigation('/places')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-[#EFEFEF] hover:text-[#134038] active:bg-gray-200 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Lugares</span>
                  {!isAuthenticated && <span className="text-[10px] text-gray-400">🔒</span>}
                </button>

                <button
                  type="button"
                  onClick={() => handleProtectedNavigation('/objects')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-[#EFEFEF] hover:text-[#134038] active:bg-gray-200 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Objetos</span>
                  {!isAuthenticated && <span className="text-[10px] text-gray-400">🔒</span>}
                </button>
              </div>
            </div>

            {/* User Session Footer inside Drawer */}
            <div className="p-4 border-t border-gray-300 bg-gray-50 space-y-3 shrink-0">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    {currentUser?.avatar ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 shrink-0">
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-[#A3195B] flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {currentUser.username ? currentUser.username[0].toUpperCase() : 'U'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-gray-900 truncate">
                        {currentUser.username}
                      </div>
                      <div className="text-[11px] text-gray-500 truncate">
                        {currentUser.status || 'En línea'}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        router.push('/profile');
                      }}
                      className="flex-1 py-2 px-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-center"
                    >
                      Mi Perfil
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="py-2 px-3 bg-[#A3195B] hover:bg-[#8d144e] active:scale-[0.98] text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-center"
                    >
                      Salir
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">
                    Modo visitante activo. Iniciá sesión para publicar y guardar historias.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      router.push('/register');
                    }}
                    className="w-full py-2.5 px-3 bg-[#134038] hover:bg-[#0e2c26] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer text-center shadow-xs"
                  >
                    Iniciar sesión / Registrarse
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
