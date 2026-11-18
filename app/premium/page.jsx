'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRootShelf } from '../../src/context/RootShelfContext';
import { ArrowBackIcon } from '../../src/components/Icons';
import {
  Check,
  Sparkles,
  Shield,
  BookOpen,
  Layers,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

function PremiumContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mpReturn = searchParams.get('mp_return');
  const returnedPreapprovalId =
    searchParams.get('preapproval_id') || searchParams.get('id') || null;

  const {
    isAuthenticated,
    isPremium,
    planTier,
    subscription,
    subscriptionStatus,
    isLoadingSubscription,
    subscriptionError,
    allPlanLimits,
    limitsLoading,
    limitsError,
    refreshSubscription,
    retrySubscription,
    startPremiumCheckout,
    verifyMercadoPagoSubscription,
  } = useRootShelf();

  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [fallbackInitPoint, setFallbackInitPoint] = useState(null);

  const [verificationState, setVerificationState] = useState(null);
  // verificationState: { status: 'checking' | 'active' | 'pending' | 'inactive' | 'error', message?: string, mpStatus?: string }
  const hasAutoVerifiedRef = useRef(false);

  useEffect(() => {
    refreshSubscription({ silent: true });
  }, [refreshSubscription]);

  const handleVerifyWithMercadoPago = async (preapprovalIdOverride = null) => {
    setVerificationState({
      status: 'checking',
      message: 'Consultando el estado real de tu suscripción en Mercado Pago...',
    });

    const result = await verifyMercadoPagoSubscription({
      preapprovalId: preapprovalIdOverride || returnedPreapprovalId,
    });

    if (!result.success) {
      setVerificationState({
        status: 'error',
        message: result.error || 'No se pudo verificar tu suscripción en Mercado Pago.',
      });
      return;
    }

    if (result.isActivePremium) {
      setVerificationState({
        status: 'active',
        mpStatus: result.mpStatus,
        message:
          '¡Suscripción confirmada! Tu cuenta ya cuenta con RootShelf Premium activo.',
      });
    } else if (result.pendingVerification) {
      setVerificationState({
        status: 'pending',
        mpStatus: result.mpStatus,
        message:
          'Tu pago todavía figura pendiente de confirmación en Mercado Pago. Todavía no activamos Premium hasta recibir la confirmación oficial.',
      });
    } else if (result.hasMercadoPagoSubscription) {
      setVerificationState({
        status: 'inactive',
        mpStatus: result.mpStatus,
        message: `La suscripción figura con estado "${result.mpStatus || 'no confirmada'}" en Mercado Pago, por lo que tu cuenta continúa en el plan Free.`,
      });
    } else {
      setVerificationState(null);
    }
  };

  // Automatically verify with Mercado Pago when returning from checkout URL
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!mpReturn && !returnedPreapprovalId) return;
    if (hasAutoVerifiedRef.current) return;

    hasAutoVerifiedRef.current = true;
    handleVerifyWithMercadoPago(returnedPreapprovalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, mpReturn, returnedPreapprovalId]);

  const freeLimits = allPlanLimits?.free || {};
  const premiumLimits = allPlanLimits?.premium || {};

  const formatLimit = (val) => (typeof val === 'number' ? val : '—');
  const formatMultiplier = (freeVal, premVal) => {
    if (typeof freeVal === 'number' && typeof premVal === 'number' && freeVal > 0) {
      const ratio = Math.round(premVal / freeVal);
      if (ratio > 1) return ` (${ratio}x más)`;
    }
    return '';
  };

  const isVerifyingUserPlan = isAuthenticated && isLoadingSubscription && !planTier;
  const hasPendingMpCheckout =
    !isPremium &&
    subscription?.provider === 'mercadopago' &&
    subscription?.mp_preapproval_id &&
    subscription?.mp_status === 'pending';

  const handleSubscribeClick = async () => {
    setCheckoutError(null);
    setFallbackInitPoint(null);

    if (!isAuthenticated) {
      router.push('/register?mode=login');
      return;
    }

    if (isPremium) {
      router.push('/profile?tab=plan');
      return;
    }

    setIsCreatingCheckout(true);
    const result = await startPremiumCheckout();

    if (!result.success) {
      setIsCreatingCheckout(false);
      if (result.requiresAuth) {
        router.push('/register?mode=login');
        return;
      }
      setCheckoutError(result.error || 'No se pudo iniciar la suscripción.');
      return;
    }

    if (result.initPoint && typeof window !== 'undefined') {
      setFallbackInitPoint(result.initPoint);
      window.location.assign(result.initPoint);
    } else {
      setIsCreatingCheckout(false);
      setCheckoutError('No recibimos una URL de pago válida de Mercado Pago.');
    }
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-10">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-[#134038] hover:opacity-80 font-normal text-sm transition-opacity cursor-pointer"
        >
          <ArrowBackIcon className="w-5 h-5" />
          <span>Volver</span>
        </button>

        {isAuthenticated && (
          <Link
            href="/profile?tab=plan"
            className="text-xs text-[#134038] hover:underline font-semibold"
          >
            Ver Mi Plan y Consumo →
          </Link>
        )}
      </div>

      {/* Hero Section */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F9B233]/20 border-l-2 border-[#F9B233] text-gray-900 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#134038]" />
          <span>Planes y Membresías</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A] tracking-tight">
          Expandí los horizontes de tus mundos literarios
        </h1>

        <p className="text-base sm:text-lg text-gray-700 leading-relaxed font-normal">
          RootShelf nació para que cualquier lector y escritor pueda descubrir y forjar historias. Con{' '}
          <strong className="text-[#134038]">RootShelf Premium</strong> disponés del espacio y las
          herramientas necesarias para construir sagas épicas, universos ramificados y lore sin
          restricciones.
        </p>
      </div>

      {/* Mercado Pago Checkout Return / Verification Banner */}
      {verificationState && (
        <div
          className={`p-4 border-l-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            verificationState.status === 'active'
              ? 'bg-emerald-50 border-[#134038] text-emerald-950'
              : verificationState.status === 'pending' || verificationState.status === 'checking'
              ? 'bg-amber-50 border-[#F9B233] text-amber-950'
              : 'bg-red-50 border-[#A3195B] text-red-950'
          }`}
        >
          <div className="flex items-start gap-3">
            {verificationState.status === 'checking' ? (
              <RefreshCw className="w-5 h-5 text-[#134038] animate-spin shrink-0 mt-0.5" />
            ) : verificationState.status === 'active' ? (
              <CheckCircle2 className="w-5 h-5 text-[#134038] shrink-0 mt-0.5" />
            ) : verificationState.status === 'pending' ? (
              <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#A3195B] shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 text-sm">
              <div className="font-bold">
                {verificationState.status === 'checking'
                  ? 'Verificando pago con Mercado Pago...'
                  : verificationState.status === 'active'
                  ? '¡Bienvenido a RootShelf Premium!'
                  : verificationState.status === 'pending'
                  ? 'Suscripción pendiente de confirmación'
                  : 'Estado de suscripción no confirmado'}
              </div>
              <p className="text-xs opacity-90">{verificationState.message}</p>
            </div>
          </div>

          {verificationState.status !== 'checking' && verificationState.status !== 'active' && (
            <button
              type="button"
              onClick={() => handleVerifyWithMercadoPago()}
              className="px-4 py-2 bg-[#134038] hover:bg-[#0f332c] text-white text-xs font-semibold uppercase tracking-wider cursor-pointer shrink-0 self-start sm:self-auto"
            >
              Volver a consultar estado
            </button>
          )}
        </div>
      )}

      {/* Pending MP checkout banner if user has a previous pending preapproval without URL param */}
      {!verificationState && hasPendingMpCheckout && (
        <div className="p-4 bg-amber-50 border-l-4 border-[#F9B233] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-amber-950 space-y-0.5">
            <div className="font-bold">Tenés un checkout de Mercado Pago pendiente de verificación</div>
            <p>
              Si ya completaste el pago en Mercado Pago, consultá el estado para actualizar tu plan al instante.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleVerifyWithMercadoPago(subscription.mp_preapproval_id)}
            className="px-4 py-2 bg-[#134038] hover:bg-[#0f332c] text-white text-xs font-semibold uppercase tracking-wider cursor-pointer shrink-0 self-start sm:self-auto"
          >
            Verificar pago ahora
          </button>
        </div>
      )}

      {/* Sync / Error notices */}
      {isAuthenticated && subscriptionError && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-amber-900">
            <strong>No pudimos verificar tu plan actual:</strong> {subscriptionError}
          </div>
          <button
            type="button"
            onClick={retrySubscription}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold uppercase tracking-wider cursor-pointer shrink-0 self-start sm:self-auto"
          >
            Reintentar
          </button>
        </div>
      )}

      {limitsError && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-600 flex items-center justify-between gap-3">
          <span className="text-xs text-amber-900">{limitsError}</span>
          <button
            type="button"
            onClick={retrySubscription}
            className="px-3 py-1 bg-amber-700 text-white text-xs font-semibold uppercase cursor-pointer shrink-0"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Checkout Error / Fallback Link */}
      {checkoutError && (
        <div className="p-4 bg-red-50 border-l-4 border-[#A3195B] text-red-950 text-xs flex items-start justify-between gap-4">
          <div>
            <strong>No pudimos iniciar el checkout:</strong> {checkoutError}
          </div>
          <button
            type="button"
            onClick={() => setCheckoutError(null)}
            className="font-bold opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {fallbackInitPoint && (
        <div className="p-4 bg-[#134038] text-white text-xs border-l-4 border-[#F9B233] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>
            Si no fuiste redirigido automáticamente a Mercado Pago, podés continuar desde este enlace seguro:
          </span>
          <a
            href={fallbackInitPoint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F9B233] text-gray-950 font-bold uppercase tracking-wider shrink-0 self-start sm:self-auto"
          >
            <span>Ir a Mercado Pago</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 pt-4">
        {/* FREE PLAN CARD */}
        <div className="bg-white border-2 border-gray-300 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Plan Inicial
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">RootShelf Free</h2>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold text-[#1A1A1A]">$0</div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Gratis para siempre
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              Ideal para lectores apasionados y creadores que dan sus primeros pasos escribiendo
              historias independientes y cuentos.
            </p>

            <div className="pt-2 border-t border-gray-200 space-y-3 text-sm text-gray-800">
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#134038] shrink-0" />
                <span>
                  Hasta <strong>{formatLimit(freeLimits.stories)} historias</strong> propias
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#134038] shrink-0" />
                <span>
                  Hasta <strong>{formatLimit(freeLimits.characters)} personajes</strong> de lore
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#134038] shrink-0" />
                <span>
                  Hasta <strong>{formatLimit(freeLimits.places)} lugares</strong> cartografiados
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#134038] shrink-0" />
                <span>
                  Hasta <strong>{formatLimit(freeLimits.objects)} objetos</strong> clave
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#134038] shrink-0" />
                <span>
                  Hasta <strong>{formatLimit(freeLimits.notes)} notas</strong> creativas
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#134038] shrink-0" />
                <span>
                  Hasta <strong>{formatLimit(freeLimits.folders)} carpetas</strong> de organización
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#134038] shrink-0" />
                <span>
                  <strong>Lectura ilimitada</strong> de todo el catálogo
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#134038] shrink-0" />
                <span>
                  <strong>Capítulos ilimitados</strong> en tus historias
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="py-2.5 px-4 bg-gray-100 text-gray-700 text-xs font-semibold uppercase tracking-wider text-center">
              {!isAuthenticated
                ? 'Plan Inicial Gratuito'
                : isVerifyingUserPlan
                ? 'Verificando tu plan...'
                : subscriptionError
                ? 'Estado no confirmado'
                : isPremium
                ? 'Plan Inicial'
                : 'Tu Plan Actual'}
            </div>
          </div>
        </div>

        {/* PREMIUM PLAN CARD */}
        <div className="bg-white border-2 border-[#134038] shadow-lg p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[#A3195B] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1">
            Recomendado para autores
          </div>

          <div className="space-y-5">
            <div className="flex flex-wrap justify-between items-start gap-4 pt-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#A3195B]">
                  Poder Creativo Ampliado
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#134038]">RootShelf Premium</h2>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-2xl sm:text-3xl font-bold text-[#134038]">
                  $3.500 <span className="text-sm font-semibold text-gray-600">ARS / mes</span>
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Renovación mensual · Cancelás cuando quieras
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              Diseñado para autores prolíficos, directores de juego y creadores de mundos que
              necesitan un taller narrativo profundo y organizado.
            </p>

            <div className="pt-2 border-t border-gray-200 space-y-3 text-sm text-gray-800">
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#A3195B] shrink-0" />
                <span>
                  Hasta <strong>{formatLimit(premiumLimits.stories)} historias</strong> completas
                  {formatMultiplier(freeLimits.stories, premiumLimits.stories)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#A3195B] shrink-0" />
                <span>
                  Hasta <strong>{formatLimit(premiumLimits.characters)} personajes</strong>
                  {formatMultiplier(freeLimits.characters, premiumLimits.characters)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#A3195B] shrink-0" />
                <span>
                  Hasta <strong>{formatLimit(premiumLimits.places)} lugares</strong> y locaciones
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#A3195B] shrink-0" />
                <span>
                  Hasta <strong>{formatLimit(premiumLimits.objects)} objetos</strong> mágicos y reliquias
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#A3195B] shrink-0" />
                <span>
                  Hasta <strong>{formatLimit(premiumLimits.notes)} notas</strong> creativas y apuntes
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#A3195B] shrink-0" />
                <span>
                  Hasta <strong>{formatLimit(premiumLimits.folders)} carpetas</strong> para organizar sagas
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#A3195B] shrink-0" />
                <span>
                  <strong>Relaciones múltiples</strong> completas entre personajes y lugares
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-4 h-4 text-[#A3195B] shrink-0" />
                <span>
                  <strong>Soporte prioritario</strong> y acceso anticipado
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 space-y-2.5">
            {isVerifyingUserPlan ? (
              <div className="py-3 px-4 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider text-center">
                Verificando tu suscripción...
              </div>
            ) : isAuthenticated && subscriptionError ? (
              <button
                type="button"
                onClick={retrySubscription}
                className="w-full py-3.5 px-6 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-center"
              >
                Reintentar verificación de plan
              </button>
            ) : isPremium ? (
              <div className="space-y-2">
                <div className="py-3 px-4 bg-[#134038] text-white text-xs font-bold uppercase tracking-wider text-center">
                  ✓ Plan Activo en tu Cuenta
                </div>
                <Link
                  href="/profile?tab=plan"
                  className="block w-full py-2.5 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold uppercase tracking-wider text-center transition-colors"
                >
                  Administrar suscripción en Mi Plan
                </Link>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSubscribeClick}
                  disabled={isCreatingCheckout}
                  className="w-full py-3.5 px-6 bg-[#A3195B] hover:bg-[#8e154f] active:scale-[0.98] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer text-center flex items-center justify-center gap-2"
                >
                  {isCreatingCheckout ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Conectando con Mercado Pago...</span>
                    </>
                  ) : !isAuthenticated ? (
                    <span>Iniciá sesión para suscribirte</span>
                  ) : (
                    <span>Suscribirme a Premium</span>
                  )}
                </button>
                <p className="text-[11px] text-gray-500 text-center">
                  Pago mensual procesado de forma segura por Mercado Pago · $3.500 ARS / mes
                  {subscriptionStatus === 'canceled' && ' · Podés reactivar tu membresía cuando quieras'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Limits Comparison Table */}
      <div className="bg-white border border-gray-300 p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            Tabla comparativa de recursos
          </h3>
          <p className="text-sm text-gray-600">
            {limitsLoading
              ? 'Cargando límites oficiales desde Supabase...'
              : 'Valores oficiales configurados en la base de datos de RootShelf.'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300 bg-gray-50">
                <th className="py-3 px-4 font-bold text-gray-800">Recurso / Capacidad</th>
                <th className="py-3 px-4 font-bold text-gray-700 text-center">Plan Free</th>
                <th className="py-3 px-4 font-bold text-[#134038] text-center bg-[#134038]/5">
                  Plan Premium
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-3 px-4 font-medium text-gray-900">Historias publicadas y borradores</td>
                <td className="py-3 px-4 text-center text-gray-700">{formatLimit(freeLimits.stories)}</td>
                <td className="py-3 px-4 text-center font-bold text-[#134038] bg-[#134038]/5">
                  {formatLimit(premiumLimits.stories)}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-gray-900">Fichas de personajes</td>
                <td className="py-3 px-4 text-center text-gray-700">{formatLimit(freeLimits.characters)}</td>
                <td className="py-3 px-4 text-center font-bold text-[#134038] bg-[#134038]/5">
                  {formatLimit(premiumLimits.characters)}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-gray-900">Lugares y escenarios</td>
                <td className="py-3 px-4 text-center text-gray-700">{formatLimit(freeLimits.places)}</td>
                <td className="py-3 px-4 text-center font-bold text-[#134038] bg-[#134038]/5">
                  {formatLimit(premiumLimits.places)}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-gray-900">Objetos clave y reliquias</td>
                <td className="py-3 px-4 text-center text-gray-700">{formatLimit(freeLimits.objects)}</td>
                <td className="py-3 px-4 text-center font-bold text-[#134038] bg-[#134038]/5">
                  {formatLimit(premiumLimits.objects)}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-gray-900">Notas de creación literaria</td>
                <td className="py-3 px-4 text-center text-gray-700">{formatLimit(freeLimits.notes)}</td>
                <td className="py-3 px-4 text-center font-bold text-[#134038] bg-[#134038]/5">
                  {formatLimit(premiumLimits.notes)}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-gray-900">Carpetas del taller</td>
                <td className="py-3 px-4 text-center text-gray-700">{formatLimit(freeLimits.folders)}</td>
                <td className="py-3 px-4 text-center font-bold text-[#134038] bg-[#134038]/5">
                  {formatLimit(premiumLimits.folders)}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-gray-900">Lectura de catálogo completo</td>
                <td className="py-3 px-4 text-center text-green-700 font-semibold">Ilimitada</td>
                <td className="py-3 px-4 text-center text-green-700 font-bold bg-[#134038]/5">
                  Ilimitada
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-gray-900">Capítulos dentro de cada historia</td>
                <td className="py-3 px-4 text-center text-green-700 font-semibold">Ilimitados</td>
                <td className="py-3 px-4 text-center text-green-700 font-bold bg-[#134038]/5">
                  Ilimitados
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Values & Philosophy section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="bg-white border border-gray-300 p-6 space-y-3">
          <BookOpen className="w-6 h-6 text-[#134038]" />
          <h4 className="text-base font-bold text-gray-900">Lectura sin barreras</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Todos los lectores, sin importar su plan, pueden descubrir, leer y marcar favoritos en
            todas las obras publicadas por la comunidad.
          </p>
        </div>

        <div className="bg-white border border-gray-300 p-6 space-y-3">
          <Layers className="w-6 h-6 text-[#A3195B]" />
          <h4 className="text-base font-bold text-gray-900">Tu contenido siempre tuyo</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Nunca borramos ni bloqueamos el acceso a historias creadas con anterioridad. Si cancelás tu suscripción, tus obras permanecen intactas y editables.
          </p>
        </div>

        <div className="bg-white border border-gray-300 p-6 space-y-3">
          <Shield className="w-6 h-6 text-[#134038]" />
          <h4 className="text-base font-bold text-gray-900">Suscripción segura</h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            Los cobros mensuales se procesan en Mercado Pago y los límites se protegen en Supabase mediante políticas y triggers en base de datos.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PremiumPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-12 text-center text-sm text-gray-500">
          Cargando planes de RootShelf...
        </div>
      }
    >
      <PremiumContent />
    </Suspense>
  );
}
