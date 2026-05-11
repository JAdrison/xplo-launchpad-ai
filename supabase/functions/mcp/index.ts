// XPLO Starter — Remote MCP server (mcp-lite + Hono)
// Auth: Authorization: Bearer xplo_sk_...
import { Hono } from "npm:hono@4.6.14";
import { McpServer, StreamableHttpTransport } from "npm:mcp-lite@^0.10.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const sb = () => createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function verifyKey(req: Request): Promise<{ userId: string; scopes: string[] } | null> {
  const h = req.headers.get("Authorization") || "";
  if (!h.startsWith("Bearer ")) return null;
  const raw = h.slice(7).trim();
  if (!raw.startsWith("xplo_sk_")) return null;
  const { data, error } = await sb().rpc("verify_api_key", { _raw: raw });
  if (error || !data?.length) return null;
  return { userId: data[0].user_id, scopes: data[0].scopes || [] };
}

async function callApi(path: string, init: RequestInit & { rawAuth?: string } = {}) {
  const url = `${SUPABASE_URL}/functions/v1/api${path}`;
  const headers = new Headers(init.headers || {});
  if (init.rawAuth) headers.set("Authorization", init.rawAuth);
  headers.set("apikey", ANON_KEY);
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text, status: res.status }; }
}

const ok = (obj: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }] });

const mcp = new McpServer({ name: "xplo-starter", version: "1.0.0" });

mcp.tool({
  name: "list_deals",
  description: "List CRM deals (most recent first).",
  inputSchema: { type: "object", properties: { limit: { type: "number" }, status: { type: "string" } } },
  handler: async (args, ctx: any) => ok(await callApi(`/deals?limit=${args.limit ?? 50}${args.status ? `&status=${args.status}` : ""}`, { rawAuth: ctx?.rawAuth })),
});

mcp.tool({
  name: "get_deal",
  description: "Get a single deal by id.",
  inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  handler: async (args, ctx: any) => ok(await callApi(`/deals/${args.id}`, { rawAuth: ctx?.rawAuth })),
});

mcp.tool({
  name: "create_deal",
  description: "Create a new CRM deal for an existing client.",
  inputSchema: {
    type: "object",
    properties: { client_id: { type: "string" }, name: { type: "string" }, value_cents: { type: "number" } },
    required: ["client_id", "name"],
  },
  handler: async (args, ctx: any) => ok(await callApi("/deals", {
    method: "POST", rawAuth: ctx?.rawAuth,
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(args),
  })),
});

mcp.tool({
  name: "move_deal",
  description: "Move a deal to a different pipeline column.",
  inputSchema: { type: "object", properties: { id: { type: "string" }, column_id: { type: "string" } }, required: ["id", "column_id"] },
  handler: async (args, ctx: any) => ok(await callApi(`/deals/${args.id}`, {
    method: "PATCH", rawAuth: ctx?.rawAuth,
    headers: { "Content-Type": "application/json" }, body: JSON.stringify({ column_id: args.column_id }),
  })),
});

mcp.tool({
  name: "list_activities",
  description: "List activities (tasks) optionally filtered by deal/client/status.",
  inputSchema: {
    type: "object",
    properties: { deal_id: { type: "string" }, client_id: { type: "string" }, status: { type: "string" }, limit: { type: "number" } },
  },
  handler: async (args, ctx: any) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(args || {})) if (v != null) qs.set(k, String(v));
    return ok(await callApi(`/activities?${qs}`, { rawAuth: ctx?.rawAuth }));
  },
});

mcp.tool({
  name: "create_activity",
  description: "Create a CRM activity (task/call/meeting/reminder) on a deal.",
  inputSchema: {
    type: "object",
    properties: {
      deal_id: { type: "string" }, client_id: { type: "string" },
      type: { type: "string", description: "ligacao | reuniao | tarefa | email | whatsapp | lembrete" },
      subject: { type: "string" }, description: { type: "string" }, scheduled_at: { type: "string" },
    },
    required: ["deal_id", "client_id", "type", "subject"],
  },
  handler: async (args, ctx: any) => ok(await callApi("/activities", {
    method: "POST", rawAuth: ctx?.rawAuth,
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(args),
  })),
});

mcp.tool({
  name: "complete_activity",
  description: "Mark an activity as completed.",
  inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  handler: async (args, ctx: any) => ok(await callApi(`/activities/${args.id}`, {
    method: "PATCH", rawAuth: ctx?.rawAuth,
    headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "completed" }),
  })),
});

mcp.tool({
  name: "list_clients",
  description: "List XPLO clients.",
  inputSchema: { type: "object", properties: { limit: { type: "number" } } },
  handler: async (args, ctx: any) => ok(await callApi(`/clients?limit=${args.limit ?? 50}`, { rawAuth: ctx?.rawAuth })),
});

mcp.tool({
  name: "get_client_onboarding",
  description: "Get consolidated onboarding for a client (profile, promise, ICPs, offers, LPs, ads).",
  inputSchema: { type: "object", properties: { client_id: { type: "string" } }, required: ["client_id"] },
  handler: async (args, ctx: any) => ok(await callApi(`/clients/${args.client_id}/onboarding`, { rawAuth: ctx?.rawAuth })),
});

mcp.tool({
  name: "start_onboarding",
  description: "Generate a 7-day external onboarding token + URL for a client.",
  inputSchema: { type: "object", properties: { client_id: { type: "string" } }, required: ["client_id"] },
  handler: async (args, ctx: any) => ok(await callApi(`/clients/${args.client_id}/onboarding/start`, {
    method: "POST", rawAuth: ctx?.rawAuth,
  })),
});

const aiTool = (name: string, slug: string, desc: string) =>
  mcp.tool({
    name, description: desc,
    inputSchema: { type: "object", properties: { client_id: { type: "string" } }, required: ["client_id"] },
    handler: async (args: any, ctx: any) => ok(await callApi(`/clients/${args.client_id}/${slug}/generate`, {
      method: "POST", rawAuth: ctx?.rawAuth,
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
    })),
  });

aiTool("generate_icps", "icps", "Generate 3 ICPs for the client using XPLO AI.");
aiTool("generate_promise", "promise", "Generate Hormozi-style promise for the client.");
aiTool("generate_offers", "offers", "Generate the offers document for the client.");
aiTool("generate_demand_plan", "demand-plan", "Generate the demand-generation plan for the client.");

const transport = new StreamableHttpTransport();
const app = new Hono();

app.options("/*", (c) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Headers", "authorization, content-type, apikey, mcp-session-id");
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
  return c.body(null, 204);
});

app.all("/*", async (c) => {
  const auth = await verifyKey(c.req.raw);
  if (!auth) {
    return c.json({ error: "Unauthorized: provide Authorization: Bearer xplo_sk_..." }, 401, {
      "Access-Control-Allow-Origin": "*",
    });
  }
  const rawAuth = c.req.raw.headers.get("Authorization") || "";
  const res = await transport.handleRequest(c.req.raw, mcp, { rawAuth } as any);
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
});

Deno.serve(app.fetch);
