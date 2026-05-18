import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, Building2, Loader2, User, DollarSign, Users, Sparkles, Gift } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { maskCPF, maskCNPJ, maskPhone, maskCurrency } from "@/lib/utils";
import { BONUS_LABELS, type XploBonus, type XploPlan } from "@/lib/xploProcessTemplate";
import { updateClientPlanAndSync } from "@/lib/syncDealTasks";
import { cn } from "@/lib/utils";

interface StepRegistrationProps {
  clientId: string;
  onNext: () => void;
  onPrevious: () => void;
}

const REVENUE_OPTIONS = [
  { value: "ate_5k", label: "Até R$ 5.000" },
  { value: "5k_15k", label: "R$ 5.000 - R$ 15.000" },
  { value: "15k_30k", label: "R$ 15.000 - R$ 30.000" },
  { value: "30k_60k", label: "R$ 30.000 - R$ 60.000" },
  { value: "60k_100k", label: "R$ 60.000 - R$ 100.000" },
  { value: "acima_100k", label: "Acima de R$ 100.000" },
];

const MONTHLY_INVESTMENT_OPTIONS = [
  { value: "nenhum", label: "Nenhum" },
  { value: "ate_1k", label: "Até R$ 1.000" },
  { value: "1k_5k", label: "R$ 1.000 - R$ 5.000" },
  { value: "5k_10k", label: "R$ 5.000 - R$ 10.000" },
  { value: "acima_10k", label: "Acima de R$ 10.000" },
];

const TRAFFIC_BUTTONS = [
  { value: "500", label: "R$ 500" },
  { value: "1000", label: "R$ 1.000" },
  { value: "1500", label: "R$ 1.500" },
  { value: "2000", label: "R$ 2.000" },
  { value: "3000", label: "R$ 3.000" },
  { value: "outro", label: "Outro" },
];

export function StepRegistration({ clientId, onNext, onPrevious }: StepRegistrationProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [nicheLabel, setNicheLabel] = useState("");

  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    responsible_name: "",
    responsible_cpf: "",
    email: "",
    phone: "",
    current_revenue: "",
    revenue_goal: "",
    monthly_investment: "",
    initial_traffic_investment: "",
  });
  const [xploPlan, setXploPlan] = useState<XploPlan>("basic");
  const [xploBonuses, setXploBonuses] = useState<XploBonus[]>([]);
  const [showCustomTraffic, setShowCustomTraffic] = useState(false);
  const [customTraffic, setCustomTraffic] = useState("");

  useEffect(() => {
    void load();
  }, [clientId]);

  const load = async () => {
    const [c, p] = await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).maybeSingle(),
      supabase.from("client_profile").select("*").eq("client_id", clientId).maybeSingle(),
    ]);

    if (c.data) {
      const cd: any = c.data;
      setNicheLabel(cd.niche_label || cd.niche || "");
      setXploPlan((cd.xplo_plan as XploPlan) || "basic");
      setXploBonuses((cd.xplo_bonuses as XploBonus[]) || []);
      setForm((f) => ({
        ...f,
        name: cd.name || "",
        cnpj: cd.cnpj ? maskCNPJ(cd.cnpj.replace(/\D/g, "")) : "",
        responsible_name: cd.responsible_name || "",
        responsible_cpf: cd.responsible_cpf ? maskCPF(cd.responsible_cpf.replace(/\D/g, "")) : "",
        email: cd.email || "",
        phone: cd.phone ? maskPhone(cd.phone.replace(/\D/g, "")) : "",
      }));
    }
    if (p.data) {
      const pd: any = p.data;
      const savedTraffic = pd.initial_traffic_investment || "";
      const isCustom = savedTraffic && !TRAFFIC_BUTTONS.some((o) => o.value === savedTraffic);
      setForm((f) => ({
        ...f,
        current_revenue: pd.current_revenue || "",
        revenue_goal: pd.revenue_goal || "",
        monthly_investment: pd.monthly_investment || "",
        initial_traffic_investment: isCustom ? "outro" : savedTraffic,
      }));
      if (isCustom) {
        setShowCustomTraffic(true);
        setCustomTraffic(savedTraffic);
      }
    }
    setIsLoading(false);
  };

  const handleField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let v = value;
    if (name === "cnpj") v = maskCNPJ(value);
    if (name === "responsible_cpf") v = maskCPF(value);
    if (name === "phone") v = maskPhone(value);
    setForm((p) => ({ ...p, [name]: v }));
  };

  const estimatedLeads = useMemo(() => {
    let inv = 0;
    if (form.initial_traffic_investment === "outro" && customTraffic) {
      inv = parseFloat(customTraffic.replace(/\D/g, "")) || 0;
    } else if (form.initial_traffic_investment && form.initial_traffic_investment !== "outro") {
      inv = parseFloat(form.initial_traffic_investment) || 0;
    }
    if (inv > 0) return { min: Math.floor(inv / 15), max: Math.floor(inv / 7), inv };
    return null;
  }, [form.initial_traffic_investment, customTraffic]);

  const handleSubmit = async () => {
    if (!form.responsible_name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome do responsável, e-mail e telefone são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    if (!form.current_revenue) {
      toast({ title: "Faturamento obrigatório", description: "Selecione uma faixa de faturamento.", variant: "destructive" });
      return;
    }
    if (!form.initial_traffic_investment) {
      toast({ title: "Investimento obrigatório", description: "Selecione o investimento inicial em tráfego.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await supabase
        .from("clients")
        .update({
          cnpj: form.cnpj.trim() || null,
          responsible_name: form.responsible_name.trim() || null,
          responsible_cpf: form.responsible_cpf.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          xplo_plan: xploPlan,
          xplo_bonuses: xploBonuses,
        } as any)
        .eq("id", clientId);

      // Cria tarefas do processo no deal automaticamente (se já existir um deal)
      try {
        await updateClientPlanAndSync(clientId, xploPlan, xploBonuses);
      } catch (err) {
        console.warn("Sync de tarefas falhou (deal pode ainda não existir):", err);
      }

      const traffic = form.initial_traffic_investment === "outro" ? customTraffic : form.initial_traffic_investment;

      const profilePayload = {
        current_revenue: form.current_revenue || null,
        revenue_goal: form.revenue_goal.trim() || null,
        monthly_investment: form.monthly_investment || null,
        initial_traffic_investment: traffic || null,
      };

      const { data: existing } = await supabase
        .from("client_profile")
        .select("id")
        .eq("client_id", clientId)
        .maybeSingle();

      if (existing) {
        await supabase.from("client_profile").update(profilePayload).eq("id", existing.id);
      } else {
        await supabase.from("client_profile").insert({ client_id: clientId, ...profilePayload });
      }

      toast({ title: "Cadastro salvo" });
      onNext();
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao salvar", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Cadastro Inicial
        </CardTitle>
        <CardDescription>Dados para formalização do contrato e estimativa inicial.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Building2 className="h-4 w-4" /> Dados do negócio
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome do negócio</Label>
              <Input value={form.name} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" name="cnpj" placeholder="00.000.000/0000-00" value={form.cnpj} onChange={handleField} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Nicho específico</Label>
              <Input value={nicheLabel} disabled className="bg-muted" />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <User className="h-4 w-4" /> Dados do responsável
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="responsible_name">Nome do responsável *</Label>
              <Input id="responsible_name" name="responsible_name" value={form.responsible_name} onChange={handleField} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsible_cpf">CPF</Label>
              <Input id="responsible_cpf" name="responsible_cpf" placeholder="000.000.000-00" value={form.responsible_cpf} onChange={handleField} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleField} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone / WhatsApp *</Label>
              <Input id="phone" name="phone" placeholder="(00) 00000-0000" value={form.phone} onChange={handleField} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="whatsapp_group_code">Código do grupo de WhatsApp do cliente</Label>
              <Input
                id="whatsapp_group_code"
                name="whatsapp_group_code"
                placeholder="Ex.: https://chat.whatsapp.com/ABCxyz123 ou ABCxyz123"
                value={form.whatsapp_group_code}
                onChange={handleField}
              />
              <p className="text-[11px] text-muted-foreground">
                Link de convite ou código do grupo do cliente, usado para comunicação operacional.
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <DollarSign className="h-4 w-4" /> Financeiro
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Faturamento mensal atual *</Label>
              <Select value={form.current_revenue} onValueChange={(v) => setForm((p) => ({ ...p, current_revenue: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {REVENUE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Meta de faturamento mensal</Label>
              <Input
                placeholder="R$ 0,00"
                value={form.revenue_goal}
                onChange={(e) => setForm((p) => ({ ...p, revenue_goal: maskCurrency(e.target.value) }))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Investimento mensal em marketing hoje</Label>
              <Select value={form.monthly_investment} onValueChange={(v) => setForm((p) => ({ ...p, monthly_investment: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {MONTHLY_INVESTMENT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Investimento inicial em tráfego (novo projeto) *</Label>
            <div className="flex flex-wrap gap-2">
              {TRAFFIC_BUTTONS.map((b) => (
                <Button
                  key={b.value}
                  type="button"
                  variant={form.initial_traffic_investment === b.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setForm((p) => ({ ...p, initial_traffic_investment: b.value }));
                    setShowCustomTraffic(b.value === "outro");
                    if (b.value !== "outro") setCustomTraffic("");
                  }}
                >
                  {b.label}
                </Button>
              ))}
            </div>
            {showCustomTraffic && (
              <Input placeholder="Digite o valor (ex: 4000)" value={customTraffic} onChange={(e) => setCustomTraffic(e.target.value)} />
            )}

            {estimatedLeads && (
              <div className="p-4 rounded-lg border bg-primary/5 space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">🧮 Estimativa de leads em tempo real</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Com R$ {estimatedLeads.inv.toLocaleString("pt-BR")}, você pode gerar de{" "}
                  <span className="font-semibold text-foreground">{estimatedLeads.min} a {estimatedLeads.max} leads</span> por mês.
                </p>
                <p className="text-xs text-muted-foreground">(CPL estimado: R$ 7 a R$ 15)</p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Plano XPLO */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4" /> Plano XPLO
          </div>
          <RadioGroup
            value={xploPlan}
            onValueChange={(v) => setXploPlan(v as XploPlan)}
            className="grid gap-3 sm:grid-cols-2"
          >
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                xploPlan === "basic" ? "border-foreground bg-muted/40" : "border-border hover:bg-muted/20"
              )}
            >
              <RadioGroupItem value="basic" id="reg-plan-basic" className="mt-1" />
              <div className="flex-1">
                <div className="font-semibold text-foreground">Basic</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Estratégia de geração de demanda, tráfego, website / página de captura,
                  estratégia e vitrine de Instagram.
                </p>
              </div>
            </label>
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                xploPlan === "pro"
                  ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm"
                  : "border-border hover:bg-muted/20"
              )}
            >
              <RadioGroupItem value="pro" id="reg-plan-pro" className="mt-1" />
              <div className="flex-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  Pro <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tudo do Basic + <strong>CRM (XPLO Lab)</strong> e{" "}
                  <strong>Inteligência Artificial</strong> personalizada para a empresa.
                </p>
              </div>
            </label>
          </RadioGroup>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Gift className="h-3.5 w-3.5" /> Bônus inclusos
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(BONUS_LABELS) as XploBonus[]).map((b) => (
                <label
                  key={b}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3 hover:bg-muted/20"
                >
                  <Checkbox
                    checked={xploBonuses.includes(b)}
                    onCheckedChange={(checked) =>
                      setXploBonuses((prev) =>
                        checked ? [...new Set([...prev, b])] : prev.filter((x) => x !== b)
                      )
                    }
                  />
                  <span className="text-sm">{BONUS_LABELS[b]}</span>
                </label>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              As tarefas do processo operacional XPLO serão criadas automaticamente no CRM com base
              no plano e bônus selecionados.
            </p>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onPrevious} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Anterior
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Próximo <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
