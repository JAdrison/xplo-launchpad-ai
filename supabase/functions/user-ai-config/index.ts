// Edge function: gerencia a config de IA do usu\u00e1rio (chave/provider/modelo) no banco.
// As chaves NUNCA s\u00e3o salvas em localStorage. Apenas o pr\u00f3prio dono enxerga as suas.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SaveSchema = z.object({
  action: z.literal("save"),
  source: z.enum(["lovable", "xplo", "custom"]),
  provider: z.enum(["openai", "gemini"]),
  model: z.string().min(1).max(120),
  apiKey: z.string().max(2048).optional().nullable(),
});
const GetSchema = z.object({ action: z.literal("get") });
const ClearSchema = z.object({ action: z.literal("clear") });
const BodySchema = z.union([SaveSchema, GetSchema, ClearSchema]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const sbUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: claims, error: claimsErr } = await sbUser.auth.getClaims(
    authHeader.replace("Bearer ", ""),
  );
  if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
  const userId = claims.claims.sub as string;

  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) return json({ error: "Invalid body" }, 400);

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (parsed.data.action === "get") {
    const { data } = await sb
      .from("user_api_keys")
      .select("provider, source, model, encrypted_key, label")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return json({ config: null });
    return json({
      config: {
        source: data.source,
        provider: data.provider,
        model: data.model,
        apiKey: data.encrypted_key, // simples por ora; substituir por descriptografia se necess\u00e1rio
      },
    });
  }

  if (parsed.data.action === "clear") {
    await sb.from("user_api_keys").delete().eq("user_id", userId);
    return json({ success: true });
  }

  // save
  const { source, provider, model, apiKey } = parsed.data;
  const payload = {
    user_id: userId,
    provider,
    source,
    model,
    encrypted_key: apiKey || "",
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb
    .from("user_api_keys")
    .upsert(payload, { onConflict: "user_id,provider" });
  if (error) return json({ error: error.message }, 500);
  return json({ success: true });
});
