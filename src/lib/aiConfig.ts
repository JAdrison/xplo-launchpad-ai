export interface AIConfig {
  source: "lovable" | "custom";
  provider: "gemini" | "openai";
  model: string;
  apiKey?: string;
}

export function getAIConfig(): AIConfig {
  const source = (localStorage.getItem("xplo_ai_source") || "lovable") as "lovable" | "custom";
  const provider = (localStorage.getItem("xplo_ai_provider") || "gemini") as "gemini" | "openai";
  const model = localStorage.getItem("xplo_ai_model") || "google/gemini-2.5-flash";
  const apiKey = localStorage.getItem("xplo_api_key") || undefined;

  return { source, provider, model, apiKey };
}
