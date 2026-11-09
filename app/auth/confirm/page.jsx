'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '../../../src/lib/supabase';
import { useRootShelf } from '../../../src/context/RootShelfContext';
import { Check } from 'lucide-react';

function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshFromSupabase } = useRootShelf();

  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isCancelled = false;

    async function handleAuthConfirmation() {
      if (!isSupabaseConfigured() || !supabase) {
        setStatus('error');
        setErrorMessage('La configuración de autenticación no está disponible.');
        return;
      }

      try {
        const code = searchParams.get('code');
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type') || 'signup';

        // 1. PKCE flow: Exchange authorization code for a session
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (!isCancelled) {
            setStatus('success');
            if (data?.session?.user?.id) {
              await refreshFromSupabase(data.session.user.id);
            }
          }
          return;
        }

        // 2. Token Hash verification (OTP / email link)
        if (tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type,
          });
          if (error) throw error;
          if (!isCancelled) {
            setStatus('success');
            if (data?.session?.user?.id) {
              await refreshFromSupabase(data.session.user.id);
            }
          }
          return;
        }

        // 3. Check if active session was already established via URL hash
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          if (!isCancelled) {
            setStatus('success');
            await refreshFromSupabase(session.user.id);
          }
          return;
        }

        // 4. Fallback listener for auth state changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
            if (!isCancelled) {
              setStatus('success');
              await refreshFromSupabase(session.user.id);
            }
          }
        });

        // Timeout if no auth token is detected within 4 seconds
        setTimeout(() => {
          if (!isCancelled) {
            setStatus((prev) => {
              if (prev === 'processing') {
                supabase.auth.getSession().then(({ data: { session } }) => {
                  if (session) {
                    setStatus('success');
                  } else {
                    setStatus('error');
                    setErrorMessage(
                      'No se pudo verificar el enlace de confirmación o el enlace ha caducado.'
                    );
                  }
                });
              }
              return prev;
            });
          }
        }, 4000);

        return () => {
          subscription?.unsubscribe();
        };
      } catch (err) {
        if (!isCancelled) {
          console.error('Error confirming email:', err);
          setStatus('error');
          setErrorMessage(
            err.message ||
              'Ocurrió un error al confirmar tu cuenta. Por favor intentá iniciar sesión.'
          );
        }
      }
    }

    handleAuthConfirmation();

    return () => {
      isCancelled = true;
    };
  }, [searchParams, refreshFromSupabase]);

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#EFEFEF] text-gray-900 flex flex-col font-sans">
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-[500px] bg-white border border-gray-300 shadow-sm p-8 text-center space-y-6">
          {status === 'processing' && (
            <div className="space-y-4">
              <div className="w-14 h-14 mx-auto border-4 border-[#134038]/20 border-t-[#134038] rounded-full animate-spin" />
              <h1 className="text-2xl font-bold text-[#1A1A1A]">Confirmando tu cuenta...</h1>
              <p className="text-sm text-gray-600">
                Estamos validando tu correo electrónico en RootShelf. Esto solo tomará un momento.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-5">
              <div className="w-16 h-16 mx-auto bg-[#134038]/10 text-[#134038] flex items-center justify-center rounded-full">
                <Check className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-[#1A1A1A]">¡Cuenta confirmada con éxito!</h1>
              <p className="text-sm text-gray-600 leading-relaxed">
                Tu correo electrónico fue verificado correctamente. Tu perfil en RootShelf ya está
                activo y listo para usar.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-[#134038] hover:bg-[#0e2f29] active:scale-[0.98] text-white text-sm font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Ir a la Biblioteca
                </Link>
                <Link
                  href="/profile"
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 text-sm font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Ver Mi Perfil
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-5">
              <div className="w-16 h-16 mx-auto bg-[#A3195B]/10 text-[#A3195B] flex items-center justify-center rounded-full font-bold text-2xl">
                ✕
              </div>
              <h1 className="text-2xl font-bold text-[#1A1A1A]">No se pudo confirmar la cuenta</h1>
              <p className="text-sm text-gray-600 leading-relaxed">
                {errorMessage ||
                  'El enlace de verificación puede haber expirado o ya haber sido utilizado.'}
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/register?mode=login"
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-[#A3195B] hover:bg-[#8e154f] active:scale-[0.98] text-white text-sm font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Ir a Iniciar Sesión
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 text-sm font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Volver al Inicio
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-56px)] bg-[#EFEFEF] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#134038]/20 border-t-[#134038] rounded-full animate-spin" />
        </div>
      }
    >
      <AuthConfirmContent />
    </Suspense>
  );
}
