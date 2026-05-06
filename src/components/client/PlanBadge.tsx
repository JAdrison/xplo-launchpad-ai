import { useState } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  BONUS_LABELS,
  type XploBonus,
  type XploPlan,
} from "@/lib/xploProcessTemplate";
import {
  updateClientPlanAndSync,
  syncDealTasksFromPlan,
  getLatestDealForClient,
} from "@/lib/syncDealTasks";

interface Props {
  clientId: string;
  plan: XploPlan;
  bonuses: XploBonus[];
  size?: "sm" | "md";
  editable?: boolean;
  onChanged?: (plan: XploPlan, bonuses: XploBonus[]) => void;
}

const ALL_BONUSES: XploBonus[] = ["google_my_business", "instagram_showcase"];

export function PlanBadge({
  clientId,
  plan,
  bonuses,
  size = "md",
  editable = true,
  onChanged,
}: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [draftPlan, setDraftPlan] = useState<XploPlan>(plan);
  const [draftBonuses, setDraftBonuses] = useState<XploBonus[]>(bonuses);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const isPro = plan === "pro";
  const sizeCls = size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm";

  const pill = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wide transition-shadow",
        sizeCls,
        isPro
          ? "bg-gradient-to-r from-primary to-primary/70 text-primary-foreground shadow-sm"
          : "border border-foreground bg-background text-foreground"
      )}
    >
      {isPro && <Sparkles className="h-3 w-3" />}
      {isPro ? "Pro" : "Basic"}
    </span>
  );

  const bonusBadges = bonuses.length > 0 && (
    <div className="flex flex-wrap gap-1">
      {bonuses.map((b) => (
        <span
          key={b}
          className="inline-flex items-center rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary"
        >
          + {BONUS_LABELS[b]}
        </span>
      ))}
    </div>
  );

  const trigger = (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-2",
        editable && "cursor-pointer hover:opacity-90"
      )}
      disabled={!editable}
    >
      {pill}
      {bonusBadges}
    </button>
  );

  if (!editable) return trigger;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateClientPlanAndSync(clientId, draftPlan, draftBonuses);
      toast({ title: "Plano atualizado", description: "Tarefas do processo sincronizadas." });
      onChanged?.(draftPlan, draftBonuses);
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleResync = async () => {
    setSyncing(true);
    try {
      const deal = await getLatestDealForClient(clientId);
      if (!deal) {
        toast({ title: "Nenhum negócio encontrado para este cliente", variant: "destructive" });
        return;
      }
      const r = await syncDealTasksFromPlan(deal.id, clientId, plan, bonuses);
      toast({
        title: "Sincronização concluída",
        description: r.inserted > 0 ? `${r.inserted} tarefa(s) adicionada(s).` : "Nada a adicionar.",
      });
      onChanged?.(plan, bonuses);
    } catch (e: any) {
      toast({ title: "Erro na sincronização", description: e.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) { setDraftPlan(plan); setDraftBonuses(bonuses); } }}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Plano XPLO</h4>
            <RadioGroup value={draftPlan} onValueChange={(v) => setDraftPlan(v as XploPlan)} className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <RadioGroupItem value="basic" id="plan-basic" className="mt-1" />
                <div>
                  <div className="font-medium text-sm">Basic</div>
                  <p className="text-xs text-muted-foreground">Estratégia, tráfego, site, Instagram.</p>
                </div>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <RadioGroupItem value="pro" id="plan-pro" className="mt-1" />
                <div>
                  <div className="font-medium text-sm flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" /> Pro
                  </div>
                  <p className="text-xs text-muted-foreground">Tudo do Basic + CRM + Inteligência Artificial.</p>
                </div>
              </label>
            </RadioGroup>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Bônus</h4>
            <div className="space-y-2">
              {ALL_BONUSES.map((b) => (
                <label key={b} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={draftBonuses.includes(b)}
                    onCheckedChange={(checked) => {
                      setDraftBonuses((prev) =>
                        checked ? [...new Set([...prev, b])] : prev.filter((x) => x !== b)
                      );
                    }}
                  />
                  <span className="text-sm">{BONUS_LABELS[b]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Salvar e sincronizar"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleResync} disabled={syncing} title="Re-sincronizar tarefas">
              {syncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Tarefas já criadas nunca são removidas — só adiciona o que falta.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
