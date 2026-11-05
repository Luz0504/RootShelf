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

  return (
    <>
      {/* Top bar with exact color #134038 from the Figma wireframes */}
      <header className="sticky top-0 z-50 bg-[#134038] text-white h-14 px-4 md:px-8 flex items-center justify-between border-b border-[#0d2a25]">
        {/* Left: Burger menu + Logo */}
        <div className="flex items-center gap-4 md:gap-6 shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 hover:opacity-80 active:scale-95 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233] cursor-pointer"
            title="Menú"
            aria-label="Abrir menú"
          >
            <BurgerMenuIcon className="w-6 h-6 text-white" />
          </button>

          <Link
            href="/"
            className="flex items-center hover:opacity-90 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233] cursor-pointer"
            title="Ir a inicio"
          >
            <RootShelfLogo className="h-7 md:h-8 w-auto" />
          </Link>
        </div>

        {/* Center: Search input */}
        <div className="flex-1 max-w-2xl mx-4 md:mx-10">
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-gray-500 pointer-events-none flex items-center">
              <SearchIcon className="w-4 h-4 text-gray-600" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar"
              className="w-full h-8 pl-10 pr-4 bg-white text-gray-800 placeholder-gray-500 text-sm focus:outline-none border-0 focus:ring-2 focus:ring-[#F9B233] transition-all duration-150"
            />
          </div>
        </div>

        {/* Right: Favorites, Notifications, User Profile */}
        <div className="flex items-center gap-3 md:gap-5 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                setShowAuthPrompt(true);
              } else {
                router.push('/profile?tab=leidos');
              }
            }}
            className="p-1 text-white hover:text-[#F9B233] active:scale-90 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233] cursor-pointer"
            title="Favoritos / Guardados"
            aria-label="Favoritos"
          >
            <FavoritesIcon className="w-5 h-5" />
          </button>

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
              className="p-1 text-white hover:text-[#F9B233] active:scale-90 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233] cursor-pointer"
              title="Notificaciones"
              aria-label="Notificaciones"
            >
              <NotificationBellIcon className="w-5 h-5" />
            </button>
            {showNotifications && isAuthenticated && (
              <div className="absolute right-0 mt-2 w-64 bg-white text-gray-800 shadow-lg border border-gray-300 p-3 z-50">
                <div className="text-xs font-semibold text-[#134038] mb-2 uppercase tracking-wide border-b pb-1">
                  Notificaciones
                </div>
                <p className="text-xs text-gray-600 py-1">No tienes notificaciones pendientes.</p>
              </div>
            )}
          </div>

          <Link
            href="/profile"
            className="p-1 text-white hover:text-[#F9B233] active:scale-90 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233] cursor-pointer flex items-center gap-1.5"
            title={isAuthenticated ? `Perfil de ${currentUser.username}` : 'Perfil (Visitante)'}
            aria-label="Perfil de usuario"
          >
            {isAuthenticated && currentUser?.avatar ? (
              <div className="w-6 h-6 rounded-full overflow-hidden border border-white/40">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.username}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            ) : (
              <UserIcon className="w-5 h-5" />
            )}
          </Link>
        </div>
      </header>

      {/* Drawer navigation */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white text-gray-800 shadow-xl z-50 flex flex-col h-full border-r-2 border-[#134038]">
            <div className="p-4 bg-[#134038] text-white flex items-center justify-between">
              <RootShelfLogo className="h-7 w-auto" />
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="text-white text-lg font-bold px-2 py-1 hover:text-[#F9B233] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => {
                  router.push('/');
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-[#EFEFEF] hover:text-[#A3195B] transition-colors cursor-pointer"
              >
                Inicio / Lectura
              </button>

              <button
                type="button"
                onClick={() => {
                  router.push('/profile?tab=leidos');
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-[#EFEFEF] hover:text-[#A3195B] transition-colors cursor-pointer"
              >
                Mi Perfil
              </button>

              <button
                type="button"
                onClick={() => {
                  router.push('/profile?tab=escritos');
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-[#EFEFEF] hover:text-[#A3195B] transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>Libros Escritos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  router.push('/profile?tab=trabajo');
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-[#EFEFEF] hover:text-[#A3195B] transition-colors font-semibold text-[#A3195B] cursor-pointer flex items-center justify-between"
              >
                <span>Área de Trabajo</span>
              </button>

              <div className="border-t border-gray-200 my-2 pt-2">
                <div className="px-3 py-1 text-xs text-gray-400 uppercase font-bold tracking-wider">
                  Mundo Literario
                </div>
                <button
                  type="button"
                  onClick={() => handleProtectedNavigation('/characters')}
                  className="w-full text-left px-3 py-2 hover:bg-[#EFEFEF] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Personajes</span>
                  {!isAuthenticated && <span className="text-[10px] text-gray-400">🔒</span>}
                </button>
                <button
                  type="button"
                  onClick={() => handleProtectedNavigation('/places')}
                  className="w-full text-left px-3 py-2 hover:bg-[#EFEFEF] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Lugares</span>
                  {!isAuthenticated && <span className="text-[10px] text-gray-400">🔒</span>}
                </button>
                <button
                  type="button"
                  onClick={() => handleProtectedNavigation('/objects')}
                  className="w-full text-left px-3 py-2 hover:bg-[#EFEFEF] transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Objetos</span>
                  {!isAuthenticated && <span className="text-[10px] text-gray-400">🔒</span>}
                </button>
              </div>
            </nav>

            <div className="p-4 border-t border-gray-200 bg-[#FAFAFA] space-y-3">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2 px-3 bg-[#A3195B] hover:bg-[#8d144e] active:scale-[0.98] text-white text-xs font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233]"
                >
                  Cerrar sesión
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push('/register');
                  }}
                  className="w-full py-2 px-3 bg-[#134038] hover:bg-[#0e2c26] active:scale-[0.98] text-white text-xs font-semibold uppercase tracking-wider transition-all duration-150 cursor-pointer text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233]"
                >
                  Iniciar sesión
                </button>
              )}
              <div className="text-xs text-gray-500 text-center">
                RootShelf • Plataforma de lectura y creación
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
