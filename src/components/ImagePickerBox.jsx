import React, { useRef } from 'react';
import { VectorPlusIcon } from './Icons';

export function ImagePickerBox({
  imageUrl = '',
  onChange,
  label = 'Imagen',
}) {
  const fileInputRef = useRef(null);

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-sm flex flex-col items-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <div
        onClick={handleBoxClick}
        className="w-full aspect-[3/4] bg-[#9E9E9E] hover:bg-[#8f8f8f] transition-colors border-2 border-gray-400 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group"
        title={`Hacer clic para seleccionar ${label.toLowerCase()} desde tu computadora`}
      >
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 text-center">
              <VectorPlusIcon className="w-12 h-12 text-white" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Cambiar imagen
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <VectorPlusIcon className="w-20 h-20 text-white group-hover:scale-105 transition-transform" />
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              {label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
