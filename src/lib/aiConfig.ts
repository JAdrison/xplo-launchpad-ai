// Config de IA do usu\u00e1rio. Fonte da verdade = tabela `user_api_keys` no backend.
// `getAIConfig()` permanece s\u00edncrono retornando do cache em mem\u00f3ria. Chame
// `hydrateAIConfig()` ao iniciar o app para carregar do servidor.
import { supabase } from "@/integrations/supabase/client";

export interface AIConfig {
  source: "lovable" | "xplo" | "custom";
  provider: "gemini" | "openai";
  model: string;
  apiKey?: string;
}

const DEFAULT_CONFIG: AIConfig = {
  source: "xplo",
  provider: "gemini",
  model: "google/gemini-2.5-flash",
};

let cached: AIConfig = { ...DEFAULT_CONFIG };
let hydrated = false;

export function getAIConfig(): AIConfig {
  return { ...cached };
}

export async function hydrateAIConfig(): Promise<AIConfig> {
  try {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      cached = { ...DEFAULT_CONFIG };
      hydrated = true;
      return cached;
    }
    const { data, error } = await supabase.functions.invoke("user-ai-config", {
      body: { action: "get" },
    });
    if (!error && data?.config) {
      cached = { ...DEFAULT_CONFIG, ...data.config };
    } else {
      cached = { ...DEFAULT_CONFIG };
    }
  } catch {
    cached = { ...DEFAULT_CONFIG };
  }
  hydrated = true;
  return cached;
}

export async function saveAIConfig(cfg: AIConfig): Promise<void> {
  const { error } = await supabase.functions.invoke("user-ai-config", {
    body: {
      action: "save",
      source: cfg.source,
      provider: cfg.provider,
      model: cfg.model,
      apiKey: cfg.apiKey ?? null,
    },
  });
  if (error) throw new Error(error.message || "Falha ao salvar configura\u00e7\u00e3o de IA");
  cached = { ...cfg };
  hydrated = true;
}

export function isAIConfigHydrated() {
  return hydrated;
}

// Limpeza de chaves antigas que ficaram em localStorage (migra\u00e7\u00e3o de seguran\u00e7a).
export function purgeLegacyAIConfigFromLocalStorage() {
  try {
    localStorage.removeItem("xplo_ai_source");
    localStorage.removeItem("xplo_ai_provider");
    localStorage.removeItem("xplo_ai_model");
    localStorage.removeItem("xplo_api_key");
  } catch {}
}
