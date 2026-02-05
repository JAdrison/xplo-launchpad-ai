import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Loader2, Plus, X, Sparkles, Info, Heart, Pencil, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getAIConfig } from "@/lib/aiConfig";
import type { Tables } from "@/integrations/supabase/types";

type ClientProfile = Tables<"client_profile">;

interface StepPainsProps {
  clientId: string;
  onNext: () => void;
  onPrevious: () => void;
}

interface PainForm {
  main_pain: string;
  secondary_pain: string;
  daily_impacts: string[];
  desire_1: string;
  desire_2: string;
}

interface EditingState {
  main_pain: boolean;
  secondary_pain: boolean;
  desire_1: boolean;
  desire_2: boolean;
}

export function StepPains({ clientId, onNext, onPrevious }: StepPainsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newImpact, setNewImpact] = useState("");
  const [isEditing, setIsEditing] = useState<EditingState>({
    main_pain: true,
    secondary_pain: true,
    desire_1: true,
    desire_2: true,
  });

  const [formData, setFormData] = useState<PainForm>({
    main_pain: "",
    secondary_pain: "",
    daily_impacts: [],
    desire_1: "",
    desire_2: "",
  });

  useEffect(() => {
    fetchData();
  }, [clientId]);

  const fetchData = async () => {
    const { data } = await supabase
      .from("client_profile")
      .select("main_pain, secondary_pain, daily_impacts, desire_1, desire_2")
      .eq("client_id", clientId)
      .maybeSingle();

    if (data) {
      setFormData({
        main_pain: data.main_pain || "",
        secondary_pain: data.secondary_pain || "",
        daily_impacts: data.daily_impacts || [],
        desire_1: data.desire_1 || "",
        desire_2: data.desire_2 || "",
      });

      // If data exists, disable editing mode for filled fields
      const hasData = data.main_pain || data.secondary_pain || data.desire_1 || data.desire_2;
      if (hasData) {
        setIsEditing({
          main_pain: !data.main_pain,
          secondary_pain: !data.secondary_pain,
          desire_1: !data.desire_1,
          desire_2: !data.desire_2,
        });
      }
    }

    setIsLoading(false);
  };

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);

    try {
      const [clientRes, profileRes] = await Promise.all([
        supabase.from("clients").select("niche").eq("id", clientId).maybeSingle(),
        supabase.from("client_profile").select("*").eq("client_id", clientId).maybeSingle(),
      ]);

      const pppData = {
        niche: clientRes.data?.niche || null,
        profile: profileRes.data || null,
        icps: [],
        pains: [],
        promise: null,
      };

      const aiConfig = getAIConfig();
      const response = await supabase.functions.invoke("generate-content", {
        body: {
          type: "generate-buyer-pains",
          clientId,
          pppData,
          aiConfig,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.pains) {
        const generated = response.data.pains;
        setFormData({
          main_pain: generated.main_pain || "",
          secondary_pain: generated.secondary_pain || "",
          daily_impacts: generated.daily_impacts || [],
          desire_1: generated.desire_1 || "",
          desire_2: generated.desire_2 || "",
        });

        setIsEditing({
          main_pain: false,
          secondary_pain: false,
          desire_1: false,
          desire_2: false,
        });

        toast({
          title: "Dores e desejos gerados!",
          description: "Sugestões criadas com base no seu negócio. Clique no ícone de lápis para editar.",
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

  const handleChange = (field: keyof PainForm, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEdit = (field: keyof EditingState) => {
    setIsEditing((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleAddImpact = () => {
    const impact = newImpact.trim();
    if (impact && formData.daily_impacts.length < 3) {
      setFormData((prev) => ({
        ...prev,
        daily_impacts: [...prev.daily_impacts, impact],
      }));
      setNewImpact("");
    }
  };

  const handleRemoveImpact = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      daily_impacts: prev.daily_impacts.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.main_pain.trim()) {
      toast({
        title: "Dor obrigatória",
        description: "Informe a dor principal de quem compra.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const profileData = {
        main_pain: formData.main_pain.trim(),
        secondary_pain: formData.secondary_pain.trim() || null,
        daily_impacts: formData.daily_impacts.length > 0 ? formData.daily_impacts : null,
        desire_1: formData.desire_1.trim() || null,
        desire_2: formData.desire_2.trim() || null,
      };

      const { data: existingProfile } = await supabase
        .from("client_profile")
        .select("id")
        .eq("client_id", clientId)
        .maybeSingle();

      if (existingProfile) {
        await supabase
          .from("client_profile")
          .update(profileData)
          .eq("id", existingProfile.id);
      } else {
        await supabase
          .from("client_profile")
          .insert({ client_id: clientId, ...profileData });
      }

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

  const arePainsEmpty = !formData.main_pain.trim() && !formData.secondary_pain.trim() && 
                        !formData.desire_1.trim() && !formData.desire_2.trim();

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
          <Heart className="h-5 w-5" />
          Dores e Desejos de Quem Compra
        </CardTitle>
        <CardDescription>
          Mapeie as principais dores e os desejos mais profundos do seu público comprador
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Generation Card */}
        <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-2 flex-1">
              <h4 className="text-sm font-medium">
                {arePainsEmpty ? "Precisa de ajuda para mapear?" : "Quer gerar novas sugestões?"}
              </h4>
              <p className="text-sm text-muted-foreground">
                Podemos sugerir dores e desejos com base no perfil do seu negócio e produto.
              </p>
              <div className="flex gap-2">
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
                  ) : arePainsEmpty ? (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Gerar com IA
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Gerar Novamente
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Pain Fields */}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Dor Principal *</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Qual o maior problema de quem compra?"
                  value={formData.main_pain}
                  onChange={(e) => handleChange("main_pain", e.target.value)}
                  disabled={!isEditing.main_pain}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleEdit("main_pain")}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dor Secundária</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Outro problema relevante"
                  value={formData.secondary_pain}
                  onChange={(e) => handleChange("secondary_pain", e.target.value)}
                  disabled={!isEditing.secondary_pain}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleEdit("secondary_pain")}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Impactos no Dia a Dia (até 3)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Como isso afeta o dia a dia do comprador?"
                value={newImpact}
                onChange={(e) => setNewImpact(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddImpact();
                  }
                }}
                disabled={formData.daily_impacts.length >= 3}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddImpact}
                disabled={formData.daily_impacts.length >= 3 || !newImpact.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.daily_impacts.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.daily_impacts.map((impact, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {impact}
                    <button
                      type="button"
                      onClick={() => handleRemoveImpact(index)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Desejos do Público</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Desejo 1</Label>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="O que ele mais quer alcançar?"
                    value={formData.desire_1}
                    onChange={(e) => handleChange("desire_1", e.target.value)}
                    disabled={!isEditing.desire_1}
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleEdit("desire_1")}
                    className="self-start"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Desejo 2</Label>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Outro desejo importante"
                    value={formData.desire_2}
                    onChange={(e) => handleChange("desire_2", e.target.value)}
                    disabled={!isEditing.desire_2}
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleEdit("desire_2")}
                    className="self-start"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

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
