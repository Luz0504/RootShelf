'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Algo salió mal</h2>
      <p className="text-gray-600">Ocurrió un error inesperado al procesar la solicitud.</p>
      <button
        onClick={() => reset()}
        className="px-5 py-2.5 bg-[#A3195B] hover:bg-[#8e154f] text-white text-sm font-semibold transition-colors cursor-pointer"
      >
        Intentar nuevamente
      </button>
    </div>
  );
}
