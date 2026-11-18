'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useRootShelf } from '../context/RootShelfContext';

const RESOURCE_LABELS = {
  stories: { singular: 'historia', plural: 'historias', article: 'de historias' },
  characters: { singular: 'personaje', plural: 'personajes', article: 'de personajes' },
  places: { singular: 'lugar', plural: 'lugares', article: 'de lugares' },
  objects: { singular: 'objeto', plural: 'objetos', article: 'de objetos' },
  notes: { singular: 'nota', plural: 'notas', article: 'de notas' },
  folders: { singular: 'carpeta', plural: 'carpetas', article: 'de carpetas' },
};

export function PlanLimitModal() {
  const router = useRouter();
  const { planLimitModal, closePlanLimitModal, isPremium, planLimits, userUsage } = useRootShelf();

  if (!planLimitModal?.isOpen) return null;

  const resourceKey = planLimitModal.resourceKey || 'stories';
  const labels = RESOURCE_LABELS[resourceKey] || {
    singular: 'elemento',
    plural: 'elementos',
    article: 'de elementos',
  };

  const tierName = isPremium ? 'Premium' : 'Free';
  const rawLimit = planLimits?.[resourceKey];
  const limit = typeof rawLimit === 'number' ? rawLimit : null;
  const currentCount = userUsage?.[resourceKey] ?? 0;

  const handleViewPlan = () => {
    closePlanLimitModal();
    router.push(isPremium ? '/profile?tab=plan' : '/premium');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={closePlanLimitModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-limit-title"
    >
      <div
        className="w-full max-w-lg bg-white border-2 border-[#134038] shadow-2xl p-6 md:p-8 space-y-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closePlanLimitModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold text-lg p-1 cursor-pointer transition-colors"
          title="Cerrar"
        >
          ✕
        </button>

        {/* Badge & Title */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#A3195B]/10 text-[#A3195B] border-l-2 border-[#A3195B] text-xs font-bold uppercase tracking-wider">
            <span>Límite del Plan {tierName} alcanzado</span>
          </div>

          <h2 id="plan-limit-title" className="text-2xl md:text-3xl font-bold text-[#1A1A1A] tracking-tight">
            Alcanzaste el límite {labels.article}
          </h2>
        </div>

        {/* Usage bar */}
        <div className="bg-[#EFEFEF] border border-gray-300 p-4 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
            <span className="capitalize">{labels.plural} utilizadas</span>
            <span className="font-bold text-[#A3195B]">
              {currentCount} de {limit ?? '—'} permitidas
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-300 overflow-hidden">
            <div
              className="h-full bg-[#A3195B] transition-all duration-300"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Explanation text */}
        <p className="text-sm text-gray-700 leading-relaxed">
          Tu plan <strong className="text-gray-900">{tierName}</strong> permite hasta{' '}
          <strong className="text-[#134038]">
            {limit ?? '—'} {limit === 1 ? labels.singular : labels.plural}
          </strong>
          .{' '}
          {isPremium ? (
            <>Podés eliminar algún {labels.singular} que ya no uses para liberar espacio en tu cuenta.</>
          ) : (
            <>
              Podés eliminar algún {labels.singular} que ya no uses para liberar espacio o descubrir{' '}
              <strong className="text-[#134038]">RootShelf Premium</strong> para ampliar tu espacio de
              creación literaria.
            </>
          )}
        </p>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleViewPlan}
            className="flex-1 py-3 px-4 bg-[#134038] hover:bg-[#0e2f29] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-center"
          >
            {isPremium ? 'Ver Mi Plan y Consumo' : 'Descubrir RootShelf Premium'}
          </button>
          <button
            type="button"
            onClick={closePlanLimitModal}
            className="py-3 px-5 bg-white border border-gray-300 hover:bg-gray-100 active:scale-[0.98] text-gray-800 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer text-center"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
