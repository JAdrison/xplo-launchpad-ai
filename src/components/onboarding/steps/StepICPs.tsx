import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, Loader2, Plus, Trash2, Users, Sparkles, Info, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StepICPsProps {
  clientId: string;
  onNext: () => void;
  onPrevious: () => void;
}

interface ProfileForm {
  id?: string;
  name: string;
  who_is: string;
  when_seeks: string;
  why_buys: string;
  is_ideal: string;
}

const IS_IDEAL_OPTIONS = [
  { value: "ideal", label: "Sim, é o ideal" },
  { value: "good_not_ideal", label: "É bom, mas não ideal" },
  { value: "no_more", label: "Não quero mais esse perfil" },
];

export function StepICPs({ clientId, onNext, onPrevious }: StepICPsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [profiles, setProfiles] = useState<ProfileForm[]>([]);

  useEffect(() => {
    fetchProfiles();
  }, [clientId]);

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from("icps")
      .select("*")
      .eq("client_id", clientId)
      .order("sort_order");

    if (data && data.length > 0) {
      setProfiles(
        data.map((icp: any) => ({
          id: icp.id,
          name: icp.name,
          who_is: icp.who_is || "",
          when_seeks: icp.when_seeks || "",
          why_buys: icp.reason_needs_solution || "",
          is_ideal: icp.is_ideal || "ideal",
        }))
      );
    } else {
      setProfiles([{ name: "", who_is: "", when_seeks: "", why_buys: "", is_ideal: "ideal" }]);
    }
    setIsLoading(false);
  };

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);

    try {
      const [clientRes, profileRes, promiseRes] = await Promise.all([
        supabase.from("clients").select("niche").eq("id", clientId).maybeSingle(),
        supabase.from("client_profile").select("*").eq("client_id", clientId).maybeSingle(),
        supabase.from("client_promise").select("*").eq("client_id", clientId).maybeSingle(),
      ]);

      const pppData = {
        niche: clientRes.data?.niche || null,
        profile: profileRes.data || null,
        icps: [],
        pains: [],
        promise: promiseRes.data || null,
      };

      const response = await supabase.functions.invoke("generate-content", {
        body: {
          type: "generate-icps",
          clientId,
          pppData,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.profiles && Array.isArray(response.data.profiles)) {
        setProfiles(
          response.data.profiles.map((p: any) => ({
            name: p.name || "",
            who_is: p.who_is || "",
            when_seeks: p.when_seeks || "",
            why_buys: p.why_buys || "",
            is_ideal: p.is_ideal || "ideal",
          }))
        );

        toast({
          title: "Perfis gerados!",
          description: "3 perfis de cliente foram sugeridos com base nos dados do seu negócio.",
        });
      }
    } catch (error) {
      console.error("Error generating profiles:", error);
      toast({
        title: "Erro ao gerar perfis",
        description: "Tente novamente ou preencha manualmente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddProfile = () => {
    if (profiles.length < 3) {
      setProfiles([...profiles, { name: "", who_is: "", when_seeks: "", why_buys: "", is_ideal: "ideal" }]);
    }
  };

  const handleRemoveProfile = (index: number) => {
    if (profiles.length > 1) {
      setProfiles(profiles.filter((_, i) => i !== index));
    }
  };

  const handleChange = (index: number, field: keyof ProfileForm, value: string) => {
    const updated = [...profiles];
    updated[index] = { ...updated[index], [field]: value };
    setProfiles(updated);
  };

  const handleSubmit = async () => {
    const validProfiles = profiles.filter((p) => p.name.trim());
    if (validProfiles.length === 0) {
      toast({
        title: "Perfil obrigatório",
        description: "Adicione pelo menos um perfil de cliente.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: existingIcps, error: fetchError } = await supabase
        .from("icps")
        .select("id")
        .eq("client_id", clientId);

      if (fetchError) throw fetchError;

      const existingIds = existingIcps?.map((icp) => icp.id) || [];
      const idsToKeep = validProfiles.filter((p) => p.id).map((p) => p.id!);
      const idsToDelete = existingIds.filter((id) => !idsToKeep.includes(id));

      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("icps")
          .delete()
          .in("id", idsToDelete);

        if (deleteError) throw deleteError;
      }

      for (let i = 0; i < validProfiles.length; i++) {
        const p = validProfiles[i];
        const profileData = {
          client_id: clientId,
          name: p.name.trim(),
          who_is: p.who_is.trim() || null,
          when_seeks: p.when_seeks.trim() || null,
          reason_needs_solution: p.why_buys.trim() || null,
          is_ideal: p.is_ideal || "ideal",
          sort_order: i,
        };

        if (p.id) {
          const { error } = await supabase
            .from("icps")
            .update(profileData)
            .eq("id", p.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("icps").insert(profileData);
          if (error) throw error;
        }
      }

      toast({
        title: "Perfis de cliente salvos",
        description: `${validProfiles.length} perfil(is) salvo(s).`,
      });

      onNext();
    } catch (error) {
      console.error("Error saving profiles:", error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const areProfilesEmpty = profiles.length === 1 && !profiles[0].name.trim();

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
          <Users className="h-5 w-5" />
          Perfil dos Principais Clientes
        </CardTitle>
        <CardDescription>
          Agora vamos entender quem são os clientes que mais compram de você hoje — ou que você gostaria de atrair com mais frequência.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Generation Card */}
        <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-2 flex-1">
              <h4 className="text-sm font-medium">
                {areProfilesEmpty ? "Você conhece bem seu cliente?" : "Quer gerar novas sugestões?"}
              </h4>
              <p className="text-sm text-muted-foreground">
                Podemos sugerir 3 perfis baseados no seu produto, dores do comprador e promessa de valor.
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
                ) : areProfilesEmpty ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Gerar Sugestões com IA
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

        {profiles.map((profile, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Perfil {index + 1}</h4>
              {profiles.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveProfile(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Nome do Perfil *</Label>
              <Input
                placeholder="Ex: Dono de empresa solar residencial"
                value={profile.name}
                onChange={(e) => handleChange(index, "name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Quem é esse cliente?</Label>
              <Textarea
                placeholder="O que ele faz, como trabalha, como decide compras..."
                value={profile.who_is}
                onChange={(e) => handleChange(index, "who_is", e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Em que momento ele te procura hoje?</Label>
              <Textarea
                placeholder="O que normalmente está acontecendo quando ele chega até você?"
                value={profile.when_seeks}
                onChange={(e) => handleChange(index, "when_seeks", e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Por que esse cliente compra de você?</Label>
              <Textarea
                placeholder="Motivo real: preço, rapidez, confiança, especialização, etc."
                value={profile.why_buys}
                onChange={(e) => handleChange(index, "why_buys", e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <Label>Esse é um cliente que você quer atrair mais?</Label>
              <RadioGroup
                value={profile.is_ideal}
                onValueChange={(value) => handleChange(index, "is_ideal", value)}
                className="space-y-2"
              >
                {IS_IDEAL_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`${index}-${option.value}`} />
                    <Label htmlFor={`${index}-${option.value}`} className="font-normal cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        ))}

        {profiles.length < 3 && (
          <Button type="button" variant="outline" onClick={handleAddProfile} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Outro Perfil
          </Button>
        )}

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
