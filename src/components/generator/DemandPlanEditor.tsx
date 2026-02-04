import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, RefreshCw, Target, TrendingUp, Calendar, Zap, Megaphone, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DemandPlan {
  context_analysis?: {
    niche?: string;
    icp_profile?: string;
    key_insight?: string;
  };
  primary_strategy?: {
    channel?: string;
    campaign_type?: string;
    audiences?: string[];
    creative_types?: string[];
    budget_percentage?: number;
    expected_cpl?: string;
  };
  complementary_strategies?: Array<{
    channel?: string;
    role?: string;
    integration?: string;
    budget_percentage?: number;
  }>;
  acquisition_funnel?: {
    tofu?: { objective?: string; channels?: string[]; message?: string };
    mofu?: { objective?: string; channels?: string[]; message?: string };
    bofu?: { objective?: string; channels?: string[]; message?: string };
  };
  channel_synergies?: string[];
  implementation_timeline?: {
    week_1_2?: string;
    week_3_4?: string;
    week_5_8?: string;
  };
}

interface DemandPlanEditorProps {
  offerId: string;
  clientId: string;
  demandPlan: DemandPlan | null;
  onPlanUpdate: (plan: DemandPlan) => void;
  pppData?: any;
}

export function DemandPlanEditor({
  offerId,
  clientId,
  demandPlan,
  onPlanUpdate,
  pppData,
}: DemandPlanEditorProps) {
  const [localPlan, setLocalPlan] = useState<DemandPlan>(demandPlan || {});
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const updateContextAnalysis = (field: keyof NonNullable<DemandPlan["context_analysis"]>, value: string) => {
    setLocalPlan((prev) => ({
      ...prev,
      context_analysis: {
        ...prev.context_analysis,
        [field]: value,
      },
    }));
  };

  const updatePrimaryStrategy = (field: keyof NonNullable<DemandPlan["primary_strategy"]>, value: any) => {
    setLocalPlan((prev) => ({
      ...prev,
      primary_strategy: {
        ...prev.primary_strategy,
        [field]: value,
      },
    }));
  };

  const updateFunnel = (stage: "tofu" | "mofu" | "bofu", field: string, value: any) => {
    setLocalPlan((prev) => ({
      ...prev,
      acquisition_funnel: {
        ...prev.acquisition_funnel,
        [stage]: {
          ...(prev.acquisition_funnel?.[stage] || {}),
          [field]: value,
        },
      },
    }));
  };

  const updateTimeline = (field: keyof NonNullable<DemandPlan["implementation_timeline"]>, value: string) => {
    setLocalPlan((prev) => ({
      ...prev,
      implementation_timeline: {
        ...prev.implementation_timeline,
        [field]: value,
      },
    }));
  };

  const addSynergy = () => {
    setLocalPlan((prev) => ({
      ...prev,
      channel_synergies: [...(prev.channel_synergies || []), ""],
    }));
  };

  const updateSynergy = (idx: number, value: string) => {
    setLocalPlan((prev) => ({
      ...prev,
      channel_synergies: (prev.channel_synergies || []).map((s, i) => (i === idx ? value : s)),
    }));
  };

  const removeSynergy = (idx: number) => {
    setLocalPlan((prev) => ({
      ...prev,
      channel_synergies: (prev.channel_synergies || []).filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("offers_hormozi")
        .update({ demand_generation_strategies: JSON.parse(JSON.stringify(localPlan)) })
        .eq("id", offerId);

      if (error) throw error;

      onPlanUpdate(localPlan);
      toast.success("Plano de demanda salvo!");
    } catch (error) {
      console.error("Error saving demand plan:", error);
      toast.error("Erro ao salvar plano");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          type: "refresh-demand-plan",
          clientId,
          offerId,
          pppData,
        },
      });

      if (error) throw error;

      if (data.demand_plan) {
        setLocalPlan(data.demand_plan);
        onPlanUpdate(data.demand_plan);
        toast.success("Plano regenerado com sucesso!");
      }
    } catch (error) {
      console.error("Error regenerating demand plan:", error);
      toast.error("Erro ao regenerar plano");
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!demandPlan) {
    return null;
  }

  return (
    <Card className="mt-4 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            Editar Plano de Demanda
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${isRegenerating ? "animate-spin" : ""}`} />
              Regenerar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1">
              <Save className="h-3 w-3" />
              Salvar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Análise do Contexto */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Análise do Contexto
          </h4>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">Nicho</Label>
              <Input
                value={localPlan.context_analysis?.niche || ""}
                onChange={(e) => updateContextAnalysis("niche", e.target.value)}
                placeholder="Ex: Energia Solar"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Perfil ICP</Label>
              <Input
                value={localPlan.context_analysis?.icp_profile || ""}
                onChange={(e) => updateContextAnalysis("icp_profile", e.target.value)}
                placeholder="Ex: Empresários 35-55 anos"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Insight Principal</Label>
              <Input
                value={localPlan.context_analysis?.key_insight || ""}
                onChange={(e) => updateContextAnalysis("key_insight", e.target.value)}
                placeholder="Ex: Alta conta de luz"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Estratégia Principal */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Estratégia Principal
          </h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Canal</Label>
              <Input
                value={localPlan.primary_strategy?.channel || ""}
                onChange={(e) => updatePrimaryStrategy("channel", e.target.value)}
                placeholder="Ex: Meta Ads"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tipo de Campanha</Label>
              <Input
                value={localPlan.primary_strategy?.campaign_type || ""}
                onChange={(e) => updatePrimaryStrategy("campaign_type", e.target.value)}
                placeholder="Ex: Conversão"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">% Budget</Label>
              <Input
                type="number"
                value={localPlan.primary_strategy?.budget_percentage || ""}
                onChange={(e) => updatePrimaryStrategy("budget_percentage", parseInt(e.target.value) || 0)}
                placeholder="60"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">CPL Esperado</Label>
              <Input
                value={localPlan.primary_strategy?.expected_cpl || ""}
                onChange={(e) => updatePrimaryStrategy("expected_cpl", e.target.value)}
                placeholder="R$ 15-25"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Públicos (separados por vírgula)</Label>
            <Input
              value={(localPlan.primary_strategy?.audiences || []).join(", ")}
              onChange={(e) =>
                updatePrimaryStrategy(
                  "audiences",
                  e.target.value.split(",").map((s) => s.trim())
                )
              }
              placeholder="Lookalike, Interesse em economia, Retargeting"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tipos de Criativos (separados por vírgula)</Label>
            <Input
              value={(localPlan.primary_strategy?.creative_types || []).join(", ")}
              onChange={(e) =>
                updatePrimaryStrategy(
                  "creative_types",
                  e.target.value.split(",").map((s) => s.trim())
                )
              }
              placeholder="Vídeo VSL, Carrossel, Stories"
            />
          </div>
        </div>

        <Separator />

        {/* Funil de Aquisição */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Funil de Aquisição
          </h4>
          <div className="space-y-4">
            {/* TOFU */}
            <div className="space-y-2 p-3 rounded-lg bg-muted/30">
              <Badge variant="outline">TOPO</Badge>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Objetivo</Label>
                  <Input
                    value={localPlan.acquisition_funnel?.tofu?.objective || ""}
                    onChange={(e) => updateFunnel("tofu", "objective", e.target.value)}
                    placeholder="Ex: Alcance e awareness"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mensagem</Label>
                  <Input
                    value={localPlan.acquisition_funnel?.tofu?.message || ""}
                    onChange={(e) => updateFunnel("tofu", "message", e.target.value)}
                    placeholder="Ex: Você sabia que..."
                  />
                </div>
              </div>
            </div>

            {/* MOFU */}
            <div className="space-y-2 p-3 rounded-lg bg-muted/30">
              <Badge variant="outline">MEIO</Badge>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Objetivo</Label>
                  <Input
                    value={localPlan.acquisition_funnel?.mofu?.objective || ""}
                    onChange={(e) => updateFunnel("mofu", "objective", e.target.value)}
                    placeholder="Ex: Consideração"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mensagem</Label>
                  <Input
                    value={localPlan.acquisition_funnel?.mofu?.message || ""}
                    onChange={(e) => updateFunnel("mofu", "message", e.target.value)}
                    placeholder="Ex: Veja como funciona..."
                  />
                </div>
              </div>
            </div>

            {/* BOFU */}
            <div className="space-y-2 p-3 rounded-lg bg-muted/30">
              <Badge variant="outline">FUNDO</Badge>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Objetivo</Label>
                  <Input
                    value={localPlan.acquisition_funnel?.bofu?.objective || ""}
                    onChange={(e) => updateFunnel("bofu", "objective", e.target.value)}
                    placeholder="Ex: Conversão"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mensagem</Label>
                  <Input
                    value={localPlan.acquisition_funnel?.bofu?.message || ""}
                    onChange={(e) => updateFunnel("bofu", "message", e.target.value)}
                    placeholder="Ex: Últimas vagas..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Sinergias */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Sinergias entre Canais
            </h4>
            <Button variant="outline" size="sm" onClick={addSynergy} className="gap-1">
              <Plus className="h-3 w-3" />
              Adicionar
            </Button>
          </div>
          <div className="space-y-2">
            {(localPlan.channel_synergies || []).map((syn, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={syn}
                  onChange={(e) => updateSynergy(idx, e.target.value)}
                  placeholder="Ex: Meta capta → WhatsApp qualifica"
                  className="flex-1"
                />
                <Button variant="ghost" size="sm" onClick={() => removeSynergy(idx)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Cronograma */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Cronograma de Implementação
          </h4>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="shrink-0 mt-2">
                Sem 1-2
              </Badge>
              <Textarea
                value={localPlan.implementation_timeline?.week_1_2 || ""}
                onChange={(e) => updateTimeline("week_1_2", e.target.value)}
                placeholder="Ex: Setup de contas e primeiras campanhas"
                className="min-h-[60px]"
              />
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="shrink-0 mt-2">
                Sem 3-4
              </Badge>
              <Textarea
                value={localPlan.implementation_timeline?.week_3_4 || ""}
                onChange={(e) => updateTimeline("week_3_4", e.target.value)}
                placeholder="Ex: Otimização e escala"
                className="min-h-[60px]"
              />
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="shrink-0 mt-2">
                Sem 5-8
              </Badge>
              <Textarea
                value={localPlan.implementation_timeline?.week_5_8 || ""}
                onChange={(e) => updateTimeline("week_5_8", e.target.value)}
                placeholder="Ex: Maturidade e novos canais"
                className="min-h-[60px]"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
