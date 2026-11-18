import { createClient } from '@supabase/supabase-js';

/**
 * Creates a server-only Supabase admin client using the Service Role / Secret key.
 * NEVER import this file in Client Components.
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      'Falta configurar SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_SECRET_KEY) en el servidor.'
    );
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Extracts and cryptographically verifies the authenticated Supabase user
 * from the Authorization: Bearer <access_token> header.
 */
export async function getAuthenticatedUserFromRequest(req) {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Sesión no autenticada.' };
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return { user: null, error: 'Token de sesión ausente.' };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const verifyKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !verifyKey) {
    return { user: null, error: 'Configuración de Supabase no disponible en el servidor.' };
  }

  const authClient = createClient(supabaseUrl, verifyKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data?.user?.id) {
    return { user: null, error: 'Sesión inválida o expirada. Volvé a iniciar sesión.' };
  }

  return { user: data.user, error: null };
}
