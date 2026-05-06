import { supabase } from "@/integrations/supabase/client";
import { tasksForPlan, type XploPlan, type XploBonus } from "./xploProcessTemplate";

/**
 * Sincroniza as tarefas auto-geradas do processo XPLO para um deal.
 * - Idempotente: usa template_key + unique index para nunca duplicar.
 * - Só ADICIONA o que falta. Nunca remove tarefas (preserva trabalho em andamento).
 */
export async function syncDealTasksFromPlan(
  dealId: string,
  clientId: string,
  plan: XploPlan,
  bonuses: XploBonus[]
): Promise<{ inserted: number }> {
  const target = tasksForPlan(plan, bonuses);

  // Tarefas já criadas via template para este deal
  const { data: existing } = await supabase
    .from("activities")
    .select("template_key")
    .eq("deal_id", dealId)
    .not("template_key", "is", null);

  const existingKeys = new Set((existing ?? []).map((a: any) => a.template_key));
  const toInsert = target.filter((t) => !existingKeys.has(t.key));
  if (toInsert.length === 0) return { inserted: 0 };

  const rows = toInsert.map((t) => ({
    deal_id: dealId,
    client_id: clientId,
    type: "lembrete" as const,
    subject: t.subject,
    description: t.description,
    status: "pending" as const,
    auto_generated: true,
    template_key: t.key,
    checkpoint_code: t.code,
    checkpoint_label: t.label,
    required_plan: t.requiredPlan ?? null,
    required_bonus: t.requiredBonus ?? null,
  }));

  const { error } = await supabase.from("activities").insert(rows as any);
  if (error) {
    // O unique index pode rejeitar inserts em corrida — ignorar silenciosamente
    if (!String(error.message).includes("duplicate")) throw error;
  }
  return { inserted: rows.length };
}

/**
 * Pega o deal mais recente do cliente (criado pelo trigger auto_create_deal_for_client).
 */
export async function getLatestDealForClient(clientId: string) {
  const { data } = await supabase
    .from("deals")
    .select("id, client_id")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

/**
 * Atualiza plano/bônus do cliente e sincroniza tarefas do deal mais recente.
 */
export async function updateClientPlanAndSync(
  clientId: string,
  plan: XploPlan,
  bonuses: XploBonus[]
) {
  const { error } = await supabase
    .from("clients")
    .update({ xplo_plan: plan, xplo_bonuses: bonuses } as any)
    .eq("id", clientId);
  if (error) throw error;

  const deal = await getLatestDealForClient(clientId);
  if (deal) {
    await syncDealTasksFromPlan(deal.id, clientId, plan, bonuses);
  }
}
