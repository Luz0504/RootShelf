'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRootShelf } from '../../src/context/RootShelfContext';
import { ArrowBackIcon } from '../../src/components/Icons';

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const YEARS = Array.from({ length: 100 }, (_, i) => String(new Date().getFullYear() - i));

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  const { login, register, resetPassword, authLoading, authError, setAuthError } = useRootShelf();

  const [mode, setMode] = useState(initialMode);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  // Email confirmation pending view
  const [showEmailSent, setShowEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Password reset fields
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Step 1 fields (MacBook Pro 16_ - 16.png)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [email, setEmail] = useState('');

  // Register Step 2 fields (MacBook Pro 16_ - 17.png)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const clearErrors = () => {
    setFormError(null);
    setSuccessNotice(null);
    if (setAuthError) setAuthError(null);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    if (!loginIdentifier.trim()) return;

    setIsSubmitting(true);
    const result = await login(loginIdentifier, loginPassword);
    setIsSubmitting(false);

    if (result && result.success === false) {
      setFormError(result.error || 'No se pudo iniciar sesión. Verificá tus datos.');
    } else {
      router.push('/');
    }
  };

  const handleRegisterStep1Submit = (e) => {
    e.preventDefault();
    clearErrors();
    setStep(2);
  };

  const handleRegisterStep2Submit = async (e) => {
    e.preventDefault();
    clearErrors();

    setIsSubmitting(true);
    const result = await register({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDay,
      birthMonth,
      birthYear,
      email: email.trim(),
      username: username.trim(),
      password,
    });
    setIsSubmitting(false);

    if (result && result.success === false) {
      setFormError(result.error || 'No se pudo completar el registro.');
    } else if (result?.needsConfirmation) {
      setRegisteredEmail(email.trim());
      setShowEmailSent(true);
    } else {
      router.push('/');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    if (!resetEmail.trim()) return;

    setResetSubmitting(true);
    const res = await resetPassword(resetEmail);
    setResetSubmitting(false);

    if (res && res.success === false) {
      setFormError(res.error || 'No se pudo enviar el correo de recuperación.');
    } else {
      setSuccessNotice(
        `Te enviamos un enlace de recuperación a ${resetEmail.trim()}. Revisá tu casilla de correo.`
      );
    }
  };

  const handleBack = () => {
    clearErrors();
    if (showEmailSent) {
      setShowEmailSent(false);
      setMode('login');
      return;
    }
    if (mode === 'forgot_password') {
      setMode('login');
      return;
    }
    if (mode === 'register' && step === 2) {
      setStep(1);
    } else {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
      } else {
        router.push('/');
      }
    }
  };

  const currentError = formError || authError;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#EFEFEF] text-gray-900 flex flex-col font-sans">
      <main className="flex-1 flex flex-col items-center pt-10 md:pt-14 px-4 pb-16">
        <div className="w-full max-w-[540px]">
          {/* "← Volver" button in #134038 */}
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 text-[#134038] hover:opacity-80 font-normal text-base transition-opacity cursor-pointer mb-6"
          >
            <ArrowBackIcon className="w-6 h-6 text-[#134038]" />
            <span>Volver</span>
          </button>

          {/* Success Banner */}
          {successNotice && (
            <div className="mb-6 p-4 bg-[#134038]/10 border-l-4 border-[#134038] text-[#134038] text-sm flex items-start justify-between">
              <span>{successNotice}</span>
              <button
                type="button"
                onClick={() => setSuccessNotice(null)}
                className="ml-3 font-bold hover:opacity-75 cursor-pointer text-base leading-none"
              >
                ✕
              </button>
            </div>
          )}

          {/* Error Banner */}
          {currentError && (
            <div className="mb-6 p-4 bg-[#A3195B]/10 border-l-4 border-[#A3195B] text-[#A3195B] text-sm flex items-start justify-between">
              <span>{currentError}</span>
              <button
                type="button"
                onClick={clearErrors}
                className="ml-3 font-bold hover:opacity-75 cursor-pointer text-base leading-none"
              >
                ✕
              </button>
            </div>
          )}

          {showEmailSent ? (
            /* EMAIL CONFIRMATION REQUIRED NOTICE */
            <div className="bg-white border border-gray-300 p-8 shadow-xs text-center space-y-5">
              <div className="w-16 h-16 mx-auto bg-[#134038]/10 text-[#134038] flex items-center justify-center rounded-full text-2xl font-bold">
                ✉
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A]">
                ¡Revisá tu correo electrónico!
              </h1>
              <p className="text-sm text-gray-700 leading-relaxed max-w-md mx-auto">
                Te enviamos un enlace de confirmación a{' '}
                <strong className="text-[#134038] font-bold">{registeredEmail}</strong>. Hacé clic en
                el enlace para activar tu cuenta de RootShelf.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailSent(false);
                    setMode('login');
                    setLoginIdentifier(registeredEmail);
                  }}
                  className="px-6 py-2.5 bg-[#134038] hover:bg-[#0e2f29] active:scale-[0.98] text-white font-semibold text-sm transition-colors cursor-pointer uppercase tracking-wider"
                >
                  Ir al inicio de sesión
                </button>
              </div>
            </div>
          ) : mode === 'forgot_password' ? (
            /* MODE: RECUPERAR CONTRASEÑA */
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] mb-3 tracking-tight">
                Recuperar contraseña
              </h1>
              <p className="text-sm text-gray-600 mb-6">
                Ingresá el correo electrónico asociado a tu cuenta y te enviaremos un enlace para
                restablecer tu contraseña.
              </p>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-base font-normal text-gray-900">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full h-10 px-3 bg-[#A6A6A6] text-gray-900 focus:bg-white focus:outline-none border border-transparent focus:border-[#134038]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      clearErrors();
                      setMode('login');
                    }}
                    className="text-sm text-[#134038] hover:underline font-semibold cursor-pointer"
                  >
                    Volver a Iniciar sesión
                  </button>

                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#A3195B] hover:bg-[#8e154f] active:scale-[0.98] disabled:opacity-60 text-white font-semibold text-sm transition-colors cursor-pointer uppercase tracking-wider min-h-[44px]"
                  >
                    <span>{resetSubmitting ? 'Enviando...' : 'Enviar enlace'}</span>
                    <ArrowBackIcon className="w-5 h-5 text-white rotate-180" />
                  </button>
                </div>
              </form>
            </div>
          ) : mode === 'login' ? (
            /* MODE: INICIAR SESIÓN */
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-7 tracking-tight">
                Iniciar sesión
              </h1>

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-base font-normal text-gray-900">
                    Correo electrónico
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full h-10 px-3 bg-[#A6A6A6] text-gray-900 focus:bg-white focus:outline-none border border-transparent focus:border-[#134038]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-base font-normal text-gray-900">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Tu contraseña..."
                    className="w-full h-10 px-3 bg-[#A6A6A6] text-gray-900 focus:bg-white focus:outline-none border border-transparent focus:border-[#134038]"
                  />
                  <div className="text-right pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        clearErrors();
                        setMode('forgot_password');
                        setResetEmail(loginIdentifier.includes('@') ? loginIdentifier : '');
                      }}
                      className="text-xs text-[#134038] hover:underline font-semibold cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      clearErrors();
                      setMode('register');
                      setStep(1);
                    }}
                    className="text-sm text-[#134038] hover:underline font-semibold cursor-pointer"
                  >
                    ¿No tenés cuenta? Registrate
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || authLoading}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#A3195B] hover:bg-[#8e154f] active:scale-[0.98] disabled:opacity-60 text-white font-semibold text-sm transition-colors cursor-pointer uppercase tracking-wider min-h-[44px]"
                  >
                    <span>{isSubmitting || authLoading ? 'Ingresando...' : 'Ingresar'}</span>
                    <ArrowBackIcon className="w-5 h-5 text-white rotate-180" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* MODE: REGISTRO (Wireframes 16 & 17) */
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-5 sm:mb-7 tracking-tight">
                Registro
              </h1>

              {step === 1 ? (
                /* Step 1: Nombre, Apellido, Edad (Día, Mes, Año), E-Mail */
                <form onSubmit={handleRegisterStep1Submit} className="space-y-4 sm:space-y-5">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-sm sm:text-base font-normal text-gray-900">
                      Nombre
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full h-10 px-3 bg-[#A6A6A6] text-gray-900 focus:bg-white focus:outline-none border border-transparent focus:border-[#134038]"
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-sm sm:text-base font-normal text-gray-900">
                      Apellido
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full h-10 px-3 bg-[#A6A6A6] text-gray-900 focus:bg-white focus:outline-none border border-transparent focus:border-[#134038]"
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-sm sm:text-base font-normal text-gray-900">
                      Edad
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      <div className="relative">
                        <select
                          required
                          value={birthDay}
                          onChange={(e) => setBirthDay(e.target.value)}
                          className="w-full h-10 sm:h-11 px-2 sm:px-4 pr-6 sm:pr-9 bg-[#A6A6A6] text-gray-900 text-xs sm:text-base appearance-none focus:outline-none cursor-pointer"
                        >
                          <option value="">Día</option>
                          {DAYS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="w-4 h-4 text-gray-900 absolute right-2 sm:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>

                      <div className="relative">
                        <select
                          required
                          value={birthMonth}
                          onChange={(e) => setBirthMonth(e.target.value)}
                          className="w-full h-10 sm:h-11 px-2 sm:px-4 pr-6 sm:pr-9 bg-[#A6A6A6] text-gray-900 text-xs sm:text-base appearance-none focus:outline-none cursor-pointer"
                        >
                          <option value="">Mes</option>
                          {MONTHS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="w-4 h-4 text-gray-900 absolute right-2 sm:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>

                      <div className="relative">
                        <select
                          required
                          value={birthYear}
                          onChange={(e) => setBirthYear(e.target.value)}
                          className="w-full h-10 sm:h-11 px-2 sm:px-4 pr-6 sm:pr-9 bg-[#A6A6A6] text-gray-900 text-xs sm:text-base appearance-none focus:outline-none cursor-pointer"
                        >
                          <option value="">Año</option>
                          {YEARS.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="w-4 h-4 text-gray-900 absolute right-2 sm:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-sm sm:text-base font-normal text-gray-900">
                      E-Mail
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 px-3 bg-[#A6A6A6] text-gray-900 focus:bg-white focus:outline-none border border-transparent focus:border-[#134038]"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        clearErrors();
                        setMode('login');
                      }}
                      className="text-sm text-[#134038] hover:underline font-semibold cursor-pointer"
                    >
                      ¿Ya tenés cuenta? Iniciá sesión
                    </button>

                    <button
                      type="submit"
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#134038] hover:bg-[#0e2c26] text-white font-semibold text-sm transition-colors cursor-pointer min-h-[44px]"
                    >
                      <span>Continuar</span>
                      <ArrowBackIcon className="w-5 h-5 text-white rotate-180" />
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Nombre de usuario, Contraseña */
                <form onSubmit={handleRegisterStep2Submit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-base font-normal text-gray-900">
                      Nombre de usuario
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full h-9 px-3 bg-[#A6A6A6] text-gray-900 focus:bg-white focus:outline-none border border-transparent focus:border-[#134038]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-base font-normal text-gray-900">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-9 px-3 bg-[#A6A6A6] text-gray-900 focus:bg-white focus:outline-none border border-transparent focus:border-[#134038]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        clearErrors();
                        setMode('login');
                      }}
                      className="text-sm text-[#134038] hover:underline font-semibold cursor-pointer"
                    >
                      ¿Ya tenés cuenta? Iniciá sesión
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting || authLoading}
                      className="flex items-center gap-2 text-[#134038] hover:opacity-80 font-normal text-base transition-opacity cursor-pointer disabled:opacity-60"
                    >
                      <span>
                        {isSubmitting || authLoading ? 'Registrando...' : 'Finalizar y entrar'}
                      </span>
                      <ArrowBackIcon className="w-6 h-6 text-[#134038] rotate-180" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-500">Cargando...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
