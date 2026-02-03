import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Loader2, AlertTriangle, Plus, X, Sparkles, Info, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type ICP = Tables<"icps">;
type ICPPain = Tables<"icp_pains">;

interface StepPainsProps {
  clientId: string;
  onNext: () => void;
  onPrevious: () => void;
}

interface PainForm {
  icp_id: string;
  icp_name: string;
  main_pain: string;
  secondary_pain: string;
  daily_impacts: string[];
  desire_1: string;
  desire_2: string;
}

export function StepPains({ clientId, onNext, onPrevious }: StepPainsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pains, setPains] = useState<PainForm[]>([]);
  const [newImpact, setNewImpact] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    const { data: icpsData } = await supabase
      .from("icps")
      .select("*")
      .eq("client_id", clientId)
      .order("sort_order");

    if (!icpsData || icpsData.length === 0) {
      toast({
        title: "Nenhum ICP encontrado",
        description: "Volte e adicione pelo menos um ICP.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const icpIds = icpsData.map((icp) => icp.id);
    const { data: painsData } = await supabase
      .from("icp_pains")
      .select("*")
      .in("icp_id", icpIds);

    const painsMap = new Map<string, ICPPain>();
    painsData?.forEach((pain) => {
      painsMap.set(pain.icp_id, pain);
    });

    const painForms: PainForm[] = icpsData.map((icp) => {
      const existingPain = painsMap.get(icp.id);
      return {
        icp_id: icp.id,
        icp_name: icp.name,
        main_pain: existingPain?.main_pain || "",
        secondary_pain: existingPain?.secondary_pain || "",
        daily_impacts: existingPain?.daily_impacts || [],
        desire_1: existingPain?.desire_1 || "",
        desire_2: existingPain?.desire_2 || "",
      };
    });

    setPains(painForms);
    setIsLoading(false);
  };

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);

    try {
      const [clientRes, profileRes, icpsRes] = await Promise.all([
        supabase.from("clients").select("niche").eq("id", clientId).maybeSingle(),
        supabase.from("client_profile").select("*").eq("client_id", clientId).maybeSingle(),
        supabase.from("icps").select("*").eq("client_id", clientId).order("sort_order"),
      ]);

      const pppData = {
        niche: clientRes.data?.niche || null,
        profile: profileRes.data || null,
        icps: icpsRes.data || [],
        pains: [],
        promise: null,
      };

      const response = await supabase.functions.invoke("generate-content", {
        body: {
          type: "generate-pains",
          clientId,
          pppData,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.pains && Array.isArray(response.data.pains)) {
        setPains((prev) =>
          prev.map((pain) => {
            const generated = response.data.pains.find(
              (p: any) => p.icp_id === pain.icp_id || p.icp_name === pain.icp_name
            );
            if (generated) {
              return {
                ...pain,
                main_pain: generated.main_pain || pain.main_pain,
                secondary_pain: generated.secondary_pain || pain.secondary_pain,
                daily_impacts: generated.daily_impacts || pain.daily_impacts,
                desire_1: generated.desire_1 || pain.desire_1,
                desire_2: generated.desire_2 || pain.desire_2,
              };
            }
            return pain;
          })
        );

        toast({
          title: "Dores e desejos gerados!",
          description: "Sugestões criadas para cada ICP. Você pode editá-las.",
        });
      }
    } catch (error) {
      console.error("Error generating pains:", error);
      toast({
        title: "Erro ao gerar",
        description: "Tente novamente ou preencha manualmente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChange = (icpId: string, field: keyof PainForm, value: string | string[]) => {
    setPains((prev) =>
      prev.map((pain) => (pain.icp_id === icpId ? { ...pain, [field]: value } : pain))
    );
  };

  const handleAddImpact = (icpId: string) => {
    const impact = newImpact[icpId]?.trim();
    if (impact) {
      setPains((prev) =>
        prev.map((pain) =>
          pain.icp_id === icpId && pain.daily_impacts.length < 3
            ? { ...pain, daily_impacts: [...pain.daily_impacts, impact] }
            : pain
        )
      );
      setNewImpact((prev) => ({ ...prev, [icpId]: "" }));
    }
  };

  const handleRemoveImpact = (icpId: string, index: number) => {
    setPains((prev) =>
      prev.map((pain) =>
        pain.icp_id === icpId
          ? { ...pain, daily_impacts: pain.daily_impacts.filter((_, i) => i !== index) }
          : pain
      )
    );
  };

  const handleSubmit = async () => {
    const validPains = pains.filter((p) => p.main_pain.trim());
    if (validPains.length === 0) {
      toast({
        title: "Dor obrigatória",
        description: "Adicione pelo menos uma dor para um ICP.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const icpIds = pains.map((p) => p.icp_id);
      await supabase.from("icp_pains").delete().in("icp_id", icpIds);

      const painsToInsert = validPains.map((pain) => ({
        icp_id: pain.icp_id,
        main_pain: pain.main_pain.trim(),
        secondary_pain: pain.secondary_pain.trim() || null,
        daily_impacts: pain.daily_impacts.length > 0 ? pain.daily_impacts : null,
        desire_1: pain.desire_1.trim() || null,
        desire_2: pain.desire_2.trim() || null,
      }));

      await supabase.from("icp_pains").insert(painsToInsert);

      toast({
        title: "Dores e desejos salvos",
        description: "Informações atualizadas com sucesso.",
      });

      onNext();
    } catch (error) {
      console.error("Error saving pains:", error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const arePainsEmpty = pains.every(
    (p) => !p.main_pain.trim() && !p.secondary_pain.trim() && !p.desire_1.trim() && !p.desire_2.trim()
  );

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
          <AlertTriangle className="h-5 w-5" />
          Dores e Desejos do Público
        </CardTitle>
        <CardDescription>
          Mapeie as principais dores e os desejos mais profundos de cada ICP
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {arePainsEmpty && (
          <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-2 flex-1">
                <h4 className="text-sm font-medium">Precisa de ajuda para mapear?</h4>
                <p className="text-sm text-muted-foreground">
                  Podemos sugerir dores e desejos com base no perfil dos seus clientes ideais e no seu nicho de atuação.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateWithAI}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Gerar Sugestões com IA
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {pains.map((pain) => (
          <div key={pain.icp_id} className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{pain.icp_name}</Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Dor Principal *</Label>
                <Input
                  placeholder="Qual o maior problema desse cliente?"
                  value={pain.main_pain}
                  onChange={(e) => handleChange(pain.icp_id, "main_pain", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Dor Secundária</Label>
                <Input
                  placeholder="Outro problema relevante"
                  value={pain.secondary_pain}
                  onChange={(e) => handleChange(pain.icp_id, "secondary_pain", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Impactos no Dia a Dia (até 3)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Como isso afeta o dia a dia?"
                  value={newImpact[pain.icp_id] || ""}
                  onChange={(e) =>
                    setNewImpact((prev) => ({ ...prev, [pain.icp_id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddImpact(pain.icp_id);
                    }
                  }}
                  disabled={pain.daily_impacts.length >= 3}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddImpact(pain.icp_id)}
                  disabled={pain.daily_impacts.length >= 3 || !newImpact[pain.icp_id]?.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {pain.daily_impacts.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {pain.daily_impacts.map((impact, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {impact}
                      <button
                        type="button"
                        onClick={() => handleRemoveImpact(pain.icp_id, index)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Desejos do Público</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Desejo 1</Label>
                  <Textarea
                    placeholder="O que ele mais quer alcançar?"
                    value={pain.desire_1}
                    onChange={(e) => handleChange(pain.icp_id, "desire_1", e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Desejo 2</Label>
                  <Textarea
                    placeholder="Outro desejo importante"
                    value={pain.desire_2}
                    onChange={(e) => handleChange(pain.icp_id, "desire_2", e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onPrevious} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Próximo
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
