// Cliente Supabase específico para o fluxo de onboarding externo (anônimo + token).
// Envia o header `x-client-token` em todas as requisições, permitindo que as RLS
// `anon_token_*` validem o acesso da pessoa que abriu o link de onboarding.
//
// IMPORTANTE: usar APENAS dentro de OnboardingExternal e seus filhos.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export function createExternalSupabaseClient(token: string) {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      // Não persistir sessão — fluxo é anônimo
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        "x-client-token": token,
      },
    },
  });
}
