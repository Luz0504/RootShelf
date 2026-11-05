'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useRootShelf } from '../context/RootShelfContext';

export function AuthPromptModal() {
  const router = useRouter();
  const { showAuthPrompt, setShowAuthPrompt } = useRootShelf();

  if (!showAuthPrompt) return null;

  const handleClose = () => {
    setShowAuthPrompt(false);
  };

  const handleLogin = () => {
    setShowAuthPrompt(false);
    router.push('/register');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white max-w-md w-full border-2 border-[#134038] p-6 space-y-5 shadow-2xl">
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <h2 className="text-xl font-bold text-[#134038] tracking-tight">
              Iniciá sesión para continuar.
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-black active:scale-90 font-bold text-lg p-1 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233]"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed pt-1">
            Creá una cuenta o iniciá sesión en RootShelf para guardar tus libros,
            crear tus propias historias y acceder a todas las herramientas de escritura.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={handleLogin}
            className="flex-1 py-2.5 px-4 bg-[#A3195B] hover:bg-[#8e154f] active:scale-[0.98] text-white font-semibold text-sm transition-all duration-150 text-center cursor-pointer uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233]"
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="py-2.5 px-5 bg-white border border-gray-400 text-gray-800 hover:bg-gray-100 active:scale-[0.98] font-semibold text-sm transition-all duration-150 text-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F9B233]"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
