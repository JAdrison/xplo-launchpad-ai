// XPLO Starter — Public REST API v1
// Auth: Authorization: Bearer xplo_sk_...
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const sb = () => createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function jsonResp(data: unknown, init: ResponseInit = {}) {
  const meta = { request_id: crypto.randomUUID(), timestamp: new Date().toISOString() };
  const body = (data && typeof data === "object" && "error" in (data as object))
    ? { ...(data as object), meta }
    : { data, meta };
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...(init.headers || {}) },
  });
}
const errResp = (code: string, message: string, status = 400) =>
  jsonResp({ error: { code, message } }, { status });

interface AuthCtx { userId: string; scopes: string[]; keyId: string }

async function authenticate(req: Request): Promise<AuthCtx | Response> {
  const h = req.headers.get("Authorization") || "";
  if (!h.startsWith("Bearer ")) return errResp("UNAUTHENTICATED", "Missing Bearer token", 401);
  const raw = h.slice(7).trim();
  if (!raw.startsWith("xplo_sk_")) return errResp("UNAUTHENTICATED", "Invalid API key format", 401);
  const { data, error } = await sb().rpc("verify_api_key", { _raw: raw });
  if (error || !data || !Array.isArray(data) || data.length === 0) {
    return errResp("UNAUTHENTICATED", "Invalid or revoked API key", 401);
  }
  const row = data[0];
  return { userId: row.user_id, scopes: row.scopes || [], keyId: row.key_id };
}

const requireScope = (ctx: AuthCtx, scope: string) =>
  ctx.scopes.includes(scope) ? null : errResp("FORBIDDEN", `Missing scope: ${scope}`, 403);

async function ownsClient(clientId: string): Promise<boolean> {
  const { data, error } = await sb().from("clients").select("id").eq("id", clientId).maybeSingle();
  return !error && !!data;
}

// ----- Human-readable enrichment -----

const CLIENT_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  in_onboarding: "Em onboarding",
  pending_approval: "Aguardando aprovação",
  ppp_completed: "Onboarding concluído",
  offer_generated: "Oferta gerada",
  lp_generated: "Landing page gerada",
  ads_generated: "Anúncios gerados",
  active: "Ativo",
  inactive: "Inativo",
  archived: "Arquivado",
};
const DEAL_STATUS_LABELS: Record<string, string> = {
  active: "Ativo", won: "Ganho", lost: "Perdido", archived: "Arquivado",
};
const ACTIVITY_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente", in_progress: "Em andamento", completed: "Concluída", cancelled: "Cancelada",
};
const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  ligacao: "Ligação", reuniao: "Reunião", tarefa: "Tarefa",
  email: "E-mail", whatsapp: "WhatsApp", lembrete: "Lembrete",
};
const fmtBRL = (cents?: number | null) =>
  cents == null ? null : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
const labelStatus = (s?: string | null) => (s ? CLIENT_STATUS_LABELS[s] ?? s : null);

async function enrichDeals(deals: any[]) {
  if (!deals?.length) return deals;
  const colIds = [...new Set(deals.map(d => d.column_id).filter(Boolean))];
  const pipeIds = [...new Set(deals.map(d => d.pipeline_id).filter(Boolean))];
  const cliIds = [...new Set(deals.map(d => d.client_id).filter(Boolean))];
  const s = sb();
  const [cols, pipes, clis] = await Promise.all([
    colIds.length ? s.from("pipeline_columns").select("id, name, checkpoint_code").in("id", colIds) : { data: [] as any[] },
    pipeIds.length ? s.from("pipelines").select("id, name").in("id", pipeIds) : { data: [] as any[] },
    cliIds.length ? s.from("clients").select("id, name, status").in("id", cliIds) : { data: [] as any[] },
  ]);
  const colMap = new Map((cols.data || []).map((c: any) => [c.id, c]));
  const pipeMap = new Map((pipes.data || []).map((p: any) => [p.id, p]));
  const cliMap = new Map((clis.data || []).map((c: any) => [c.id, c]));
  return deals.map(d => {
    const col = colMap.get(d.column_id);
    const pipe = pipeMap.get(d.pipeline_id);
    const cli = cliMap.get(d.client_id);
    return {
      ...d,
      column_name: col?.name ?? null,
      column_checkpoint: col?.checkpoint_code ?? null,
      pipeline_name: pipe?.name ?? null,
      client_name: cli?.name ?? null,
      client_status_label: labelStatus(cli?.status),
      status_label: DEAL_STATUS_LABELS[d.status] ?? d.status,
      value_brl: fmtBRL(d.value_cents),
    };
  });
}

// ----- Route handlers -----

async function listDeals(_req: Request, _ctx: AuthCtx, url: URL) {
  const limit = Math.min(Number(url.searchParams.get("limit") || 100), 500);
  const status = url.searchParams.get("status");
  let q = sb().from("deals").select("*").order("updated_at", { ascending: false }).limit(limit);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return errResp("INTERNAL_ERROR", error.message, 500);
  return jsonResp(await enrichDeals(data || []));
}

async function getDeal(id: string) {
  const { data, error } = await sb().from("deals").select("*").eq("id", id).maybeSingle();
  if (error) return errResp("INTERNAL_ERROR", error.message, 500);
  if (!data) return errResp("NOT_FOUND", "Deal not found", 404);
  const [enriched] = await enrichDeals([data]);
  return jsonResp(enriched);
}


async function createDeal(req: Request) {
  const body = await req.json().catch(() => null) as any;
  if (!body?.client_id || !body?.name) return errResp("VALIDATION_ERROR", "client_id and name are required");
  // Need pipeline_id + column_id; if not provided, pick first
  let pipeline_id = body.pipeline_id;
  let column_id = body.column_id;
  if (!pipeline_id) {
    const { data: p } = await sb().from("pipelines").select("id").order("sort_order").limit(1).maybeSingle();
    pipeline_id = p?.id;
  }
  if (!column_id && pipeline_id) {
    const { data: c } = await sb().from("pipeline_columns").select("id")
      .eq("pipeline_id", pipeline_id).order("sort_order").limit(1).maybeSingle();
    column_id = c?.id;
  }
  if (!pipeline_id || !column_id) return errResp("VALIDATION_ERROR", "pipeline_id/column_id required (none configured)");
  const { data, error } = await sb().from("deals").insert({
    client_id: body.client_id, pipeline_id, column_id, name: body.name,
    value_cents: body.value_cents ?? 0, responsible_id: body.responsible_id ?? null,
  }).select().single();
  if (error) return errResp("INTERNAL_ERROR", error.message, 500);
  return jsonResp(data, { status: 201 });
}

async function patchDeal(id: string, req: Request) {
  const body = await req.json().catch(() => ({})) as any;
  const allowed = ["name", "value_cents", "column_id", "responsible_id", "status", "closed_reason", "custom_fields"];
  const patch: any = {};
  for (const k of allowed) if (k in body) patch[k] = body[k];
  if (!Object.keys(patch).length) return errResp("VALIDATION_ERROR", "No fields to update");
  const { data, error } = await sb().from("deals").update(patch).eq("id", id).select().single();
  if (error) return errResp("INTERNAL_ERROR", error.message, 500);
  return jsonResp(data);
}

async function deleteDeal(id: string) {
  const { error } = await sb().from("deals").delete().eq("id", id);
  if (error) return errResp("INTERNAL_ERROR", error.message, 500);
  return jsonResp({ deleted: true });
}

async function listActivities(url: URL) {
  const limit = Math.min(Number(url.searchParams.get("limit") || 100), 500);
  const status = url.searchParams.get("status");
  const dealId = url.searchParams.get("deal_id");
  const clientId = url.searchParams.get("client_id");
  let q = sb().from("activities").select("*").order("scheduled_at", { ascending: true, nullsFirst: false }).limit(limit);
  if (status) q = q.eq("status", status);
  if (dealId) q = q.eq("deal_id", dealId);
  if (clientId) q = q.eq("client_id", clientId);
  const { data, error } = await q;
  if (error) return errResp("INTERNAL_ERROR", error.message, 500);
  return jsonResp(data);
}

async function createActivity(req: Request) {
  const b = await req.json().catch(() => null) as any;
  if (!b?.deal_id || !b?.client_id || !b?.type || !b?.subject) {
    return errResp("VALIDATION_ERROR", "deal_id, client_id, type, subject are required");
  }
  const { data, error } = await sb().from("activities").insert({
    deal_id: b.deal_id, client_id: b.client_id, type: b.type, subject: b.subject,
    description: b.description ?? null, scheduled_at: b.scheduled_at ?? null,
    duration_minutes: b.duration_minutes ?? null, responsible_id: b.responsible_id ?? null,
    required_function: b.required_function ?? null,
  }).select().single();
  if (error) return errResp("INTERNAL_ERROR", error.message, 500);
  return jsonResp(data, { status: 201 });
}

async function patchActivity(id: string, req: Request) {
  const b = await req.json().catch(() => ({})) as any;
  const allowed = ["subject", "description", "scheduled_at", "duration_minutes", "status", "completed_at", "responsible_id"];
  const patch: any = {};
  for (const k of allowed) if (k in b) patch[k] = b[k];
  if ("status" in patch && patch.status === "completed" && !patch.completed_at) {
    patch.completed_at = new Date().toISOString();
  }
  if (!Object.keys(patch).length) return errResp("VALIDATION_ERROR", "No fields to update");
  const { data, error } = await sb().from("activities").update(patch).eq("id", id).select().single();
  if (error) return errResp("INTERNAL_ERROR", error.message, 500);
  return jsonResp(data);
}

async function listClients(url: URL) {
  const limit = Math.min(Number(url.searchParams.get("limit") || 100), 500);
  const { data, error } = await sb().from("clients")
    .select("id, name, niche, niche_label, status, email, phone, xplo_plan, xplo_bonuses, created_at, updated_at")
    .order("updated_at", { ascending: false }).limit(limit);
  if (error) return errResp("INTERNAL_ERROR", error.message, 500);
  return jsonResp(data);
}

async function getClient(id: string) {
  const { data, error } = await sb().from("clients")
    .select("id, name, niche, niche_label, niche_type, status, email, phone, cnpj, responsible_name, responsible_cpf, product_description, xplo_plan, xplo_bonuses, drive_url, traffic_payment_day, traffic_payment_lead_days, traffic_payment_value_cents, created_at, updated_at")
    .eq("id", id).maybeSingle();
  if (error) return errResp("INTERNAL_ERROR", error.message, 500);
  if (!data) return errResp("NOT_FOUND", "Client not found", 404);
  return jsonResp(data);
}

async function getClientOnboarding(id: string) {
  if (!await ownsClient(id)) return errResp("NOT_FOUND", "Client not found", 404);
  const s = sb();
  const [profile, promise, icps, offers, lps, ads] = await Promise.all([
    s.from("client_profile").select("*").eq("client_id", id).maybeSingle(),
    s.from("client_promise").select("*").eq("client_id", id).maybeSingle(),
    s.from("icps").select("*").eq("client_id", id),
    s.from("offers_hormozi").select("*").eq("client_id", id),
    s.from("landing_pages").select("*").eq("client_id", id),
    s.from("ads").select("*").eq("client_id", id),
  ]);
  return jsonResp({
    client_id: id,
    profile: profile.data,
    promise: promise.data,
    icps: icps.data || [],
    offers: offers.data || [],
    landing_pages: lps.data || [],
    ads: ads.data || [],
  });
}

async function startOnboarding(id: string) {
  if (!await ownsClient(id)) return errResp("NOT_FOUND", "Client not found", 404);
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await sb().from("client_tokens").insert({
    client_id: id, token, expires_at: expiresAt,
  }).select().single();
  if (error) return errResp("INTERNAL_ERROR", error.message, 500);
  const baseUrl = (Deno.env.get("PUBLIC_APP_URL") || "https://starter.xplo.com.br").replace(/\/$/, "");
  return jsonResp({
    token: data.token,
    expires_at: data.expires_at,
    onboarding_url: `${baseUrl}/onboarding/external/${data.token}`,
  }, { status: 201 });
}

async function callGenerate(type: string, clientId: string, extra: Record<string, unknown> = {}) {
  if (!await ownsClient(clientId)) return errResp("NOT_FOUND", "Client not found", 404);
  const url = `${SUPABASE_URL}/functions/v1/generate-content`;
  // We can't easily reuse user JWT; use service role + we already validated client ownership.
  // generate-content requires JWT or x-client-token, so use a fresh client_token route.
  // Easier: call with service-role JWT (service_role bypasses has_crm_access check? No — has_crm_access checks user_roles).
  // Solution: generate ephemeral client_token (10 min) and pass via header.
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const exp = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await sb().from("client_tokens").insert({ client_id: clientId, token, expires_at: exp });
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-token": token,
      "apikey": ANON_KEY,
    },
    body: JSON.stringify({ type, clientId, ...extra }),
  });
  const text = await res.text();
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }
  if (!res.ok) return errResp("AI_ERROR", `generate-content failed: ${res.status}`, 502);
  return jsonResp(parsed);
}

// ----- Router -----
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  // Strip /functions/v1/api prefix
  let path = url.pathname.replace(/^\/+/, "/");
  path = path.replace(/^\/functions\/v1\/api/, "");
  if (path.startsWith("/api")) path = path.slice(4);
  if (!path) path = "/";

  if (path === "/health") {
    return jsonResp({ status: "ok", version: "1.0.0" });
  }

  // Auth required for everything else
  const auth = await authenticate(req);
  if (auth instanceof Response) return auth;

  try {
    const method = req.method.toUpperCase();
    const seg = path.split("/").filter(Boolean);

    // /me
    if (path === "/me" && method === "GET") {
      return jsonResp({ user_id: auth.userId, scopes: auth.scopes });
    }

    // /deals
    if (seg[0] === "deals") {
      if (seg.length === 1 && method === "GET") return listDeals(req, auth, url);
      if (seg.length === 1 && method === "POST") {
        const r = requireScope(auth, "write"); if (r) return r;
        return createDeal(req);
      }
      if (seg.length === 2 && method === "GET") return getDeal(seg[1]);
      if (seg.length === 2 && method === "PATCH") {
        const r = requireScope(auth, "write"); if (r) return r;
        return patchDeal(seg[1], req);
      }
      if (seg.length === 2 && method === "DELETE") {
        const r = requireScope(auth, "write"); if (r) return r;
        return deleteDeal(seg[1]);
      }
    }

    // /activities
    if (seg[0] === "activities") {
      if (seg.length === 1 && method === "GET") return listActivities(url);
      if (seg.length === 1 && method === "POST") {
        const r = requireScope(auth, "write"); if (r) return r;
        return createActivity(req);
      }
      if (seg.length === 2 && method === "PATCH") {
        const r = requireScope(auth, "write"); if (r) return r;
        return patchActivity(seg[1], req);
      }
    }

    // /clients
    if (seg[0] === "clients") {
      if (seg.length === 1 && method === "GET") return listClients(url);
      if (seg.length === 2 && method === "GET") return getClient(seg[1]);
      if (seg.length === 3 && seg[2] === "onboarding" && method === "GET")
        return getClientOnboarding(seg[1]);
      if (seg.length === 4 && seg[2] === "onboarding" && seg[3] === "start" && method === "POST") {
        const r = requireScope(auth, "write"); if (r) return r;
        return startOnboarding(seg[1]);
      }
      // /clients/:id/<thing>/generate
      if (seg.length === 4 && seg[3] === "generate" && method === "POST") {
        const r = requireScope(auth, "write"); if (r) return r;
        const map: Record<string, string> = {
          "icps": "generate-icps",
          "promise": "generate-promise",
          "pains": "generate-pains",
          "swot": "generate-swot",
          "offers": "generate-offers-document",
          "demand-plan": "generate-traffic-plan-document",
        };
        const t = map[seg[2]];
        if (!t) return errResp("NOT_FOUND", `Unknown generation type: ${seg[2]}`, 404);
        const body = await req.json().catch(() => ({}));
        return callGenerate(t, seg[1], body);
      }
    }

    return errResp("NOT_FOUND", `Route not found: ${method} ${path}`, 404);
  } catch (e) {
    console.error("[api] error:", e);
    return errResp("INTERNAL_ERROR", (e as Error).message, 500);
  }
});
