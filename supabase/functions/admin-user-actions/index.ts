import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MASTER_EMAIL = "xplolabcreator@gmail.com";

const BodySchema = z.object({
  action: z.enum(["delete", "ban", "unban", "reset_password", "set_password"]),
  userId: z.string().uuid(),
  password: z.string().min(8).max(128).optional(),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "No authorization header" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const { data: isAdmin, error: roleError } = await supabaseUser.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (roleError || !isAdmin) return json({ error: "Forbidden - Admin access required" }, 403);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: "Invalid body", details: parsed.error.flatten().fieldErrors }, 400);
    }
    const { action, userId, password } = parsed.data;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Protect master admin from any destructive action
    const { data: target } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (target?.user?.email === MASTER_EMAIL) {
      return json({ error: "Não é permitido aplicar esta ação no admin master." }, 403);
    }
    const targetEmail = target?.user?.email;

    console.log(`[admin-user-actions] action=${action} by=${user.id} target=${userId}`);

    switch (action) {
      case "delete": {
        const { error: delAuthErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (delAuthErr) throw delAuthErr;
        await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
        return json({ success: true, message: "Usuário removido." });
      }
      case "ban": {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: "876000h",
        });
        if (error) throw error;
        return json({ success: true, message: "Usuário suspenso." });
      }
      case "unban": {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: "none",
        });
        if (error) throw error;
        return json({ success: true, message: "Usuário reativado." });
      }
      case "reset_password": {
        if (!targetEmail) return json({ error: "Email do usuário não encontrado" }, 404);
        const { error } = await supabaseAdmin.auth.admin.generateLink({
          type: "recovery",
          email: targetEmail,
        });
        if (error) throw error;
        return json({ success: true, message: "E-mail de redefinição enviado." });
      }
      case "set_password": {
        if (!password) return json({ error: "Senha obrigatória" }, 400);
        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
        if (error) throw error;
        return json({ success: true, message: "Senha atualizada." });
      }
    }
  } catch (error) {
    console.error("admin-user-actions error:", error);
    return json({ error: (error as Error).message }, 500);
  }
});
