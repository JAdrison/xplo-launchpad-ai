import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Loader2, AlertTriangle, Plus, X } from "lucide-react";
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
  consequence: string;
  daily_impacts: string[];
}

export function StepPains({ clientId, onNext, onPrevious }: StepPainsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pains, setPains] = useState<PainForm[]>([]);
  const [newImpact, setNewImpact] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    // Fetch ICPs
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

    // Fetch existing pains
    const icpIds = icpsData.map((icp) => icp.id);
    const { data: painsData } = await supabase
      .from("icp_pains")
      .select("*")
      .in("icp_id", icpIds);

    const painsMap = new Map<string, ICPPain>();
    painsData?.forEach((pain) => {
      painsMap.set(pain.icp_id, pain);
    });

    // Create pain forms for each ICP
    const painForms: PainForm[] = icpsData.map((icp) => {
      const existingPain = painsMap.get(icp.id);
      return {
        icp_id: icp.id,
        icp_name: icp.name,
        main_pain: existingPain?.main_pain || "",
        consequence: existingPain?.consequence || "",
        daily_impacts: existingPain?.daily_impacts || [],
      };
    });

    setPains(painForms);
    setIsLoading(false);
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
          pain.icp_id === icpId && pain.daily_impacts.length < 5
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
    // Validate at least one pain
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
      // Delete existing pains for these ICPs
      const icpIds = pains.map((p) => p.icp_id);
      await supabase.from("icp_pains").delete().in("icp_id", icpIds);

      // Insert new pains
      const painsToInsert = validPains.map((pain) => ({
        icp_id: pain.icp_id,
        main_pain: pain.main_pain.trim(),
        consequence: pain.consequence.trim() || null,
        daily_impacts: pain.daily_impacts.length > 0 ? pain.daily_impacts : null,
      }));

      await supabase.from("icp_pains").insert(painsToInsert);

      toast({
        title: "Dores salvas",
        description: "Informações de dores atualizadas.",
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
          Dores dos Clientes
        </CardTitle>
        <CardDescription>
          Mapeie as principais dores e problemas que cada ICP enfrenta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {pains.map((pain) => (
          <div key={pain.icp_id} className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{pain.icp_name}</Badge>
            </div>

            <div className="space-y-2">
              <Label>Dor Principal *</Label>
              <Input
                placeholder="Qual o maior problema desse cliente?"
                value={pain.main_pain}
                onChange={(e) => handleChange(pain.icp_id, "main_pain", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Consequência</Label>
              <Textarea
                placeholder="O que acontece se ele não resolver esse problema?"
                value={pain.consequence}
                onChange={(e) => handleChange(pain.icp_id, "consequence", e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Impactos no Dia a Dia (até 5)</Label>
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
                  disabled={pain.daily_impacts.length >= 5}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddImpact(pain.icp_id)}
                  disabled={pain.daily_impacts.length >= 5 || !newImpact[pain.icp_id]?.trim()}
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
