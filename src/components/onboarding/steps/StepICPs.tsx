import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, Plus, Trash2, Users, Sparkles, Info, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StepICPsProps {
  clientId: string;
  onNext: () => void;
  onPrevious: () => void;
}

interface ICPForm {
  id?: string;
  name: string;
  profession: string;
  age: string;
  gender: string;
  reason_needs_solution: string;
}

export function StepICPs({ clientId, onNext, onPrevious }: StepICPsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [icps, setIcps] = useState<ICPForm[]>([]);

  useEffect(() => {
    fetchICPs();
  }, [clientId]);

  const fetchICPs = async () => {
    const { data } = await supabase
      .from("icps")
      .select("*")
      .eq("client_id", clientId)
      .order("sort_order");

    if (data && data.length > 0) {
      setIcps(
        data.map((icp) => ({
          id: icp.id,
          name: icp.name,
          profession: icp.profession || "",
          age: icp.age || "",
          gender: icp.gender || "",
          reason_needs_solution: icp.reason_needs_solution || "",
        }))
      );
    } else {
      setIcps([{ name: "", profession: "", age: "", gender: "", reason_needs_solution: "" }]);
    }
    setIsLoading(false);
  };

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);

    try {
      // Fetch ALL data to provide full context for ICP generation
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

      if (response.data?.icps && Array.isArray(response.data.icps)) {
        setIcps(
          response.data.icps.map((icp: any) => ({
            name: icp.name || "",
            profession: icp.profession || "",
            age: icp.age || "",
            gender: icp.gender || "",
            reason_needs_solution: icp.reason_needs_solution || "",
          }))
        );

        toast({
          title: "ICPs gerados!",
          description: "3 perfis de cliente foram sugeridos com base nos dados do seu negócio.",
        });
      }
    } catch (error) {
      console.error("Error generating ICPs:", error);
      toast({
        title: "Erro ao gerar ICPs",
        description: "Tente novamente ou preencha manualmente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddICP = () => {
    if (icps.length < 3) {
      setIcps([...icps, { name: "", profession: "", age: "", gender: "", reason_needs_solution: "" }]);
    }
  };

  const handleRemoveICP = (index: number) => {
    if (icps.length > 1) {
      setIcps(icps.filter((_, i) => i !== index));
    }
  };

  const handleChange = (index: number, field: keyof ICPForm, value: string) => {
    const updated = [...icps];
    updated[index] = { ...updated[index], [field]: value };
    setIcps(updated);
  };

  const handleSubmit = async () => {
    const validIcps = icps.filter((icp) => icp.name.trim());
    if (validIcps.length === 0) {
      toast({
        title: "ICP obrigatório",
        description: "Adicione pelo menos um perfil de cliente ideal.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      await supabase.from("icps").delete().eq("client_id", clientId);

      const icpsToInsert = validIcps.map((icp, index) => ({
        client_id: clientId,
        name: icp.name.trim(),
        profession: icp.profession.trim() || null,
        age: icp.age.trim() || null,
        gender: icp.gender || null,
        reason_needs_solution: icp.reason_needs_solution.trim() || null,
        sort_order: index,
      }));

      await supabase.from("icps").insert(icpsToInsert);

      toast({
        title: "ICPs salvos",
        description: `${validIcps.length} perfil(is) de cliente salvo(s).`,
      });

      onNext();
    } catch (error) {
      console.error("Error saving ICPs:", error);
      toast({
        title: "Erro ao salvar",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const areICPsEmpty = icps.length === 1 && !icps[0].name.trim();

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
          Perfis de Cliente Ideal (ICPs)
        </CardTitle>
        <CardDescription>
          Defina até 3 perfis de clientes que você deseja atrair
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Generation Card */}
        <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-2 flex-1">
              <h4 className="text-sm font-medium">
                {areICPsEmpty ? "Você conhece bem seu cliente ideal?" : "Quer gerar novas sugestões?"}
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
                ) : areICPsEmpty ? (
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

        {icps.map((icp, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">ICP {index + 1}</h4>
              {icps.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveICP(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Nome do Perfil *</Label>
              <Input
                placeholder="Ex: Carlos, o Empresário"
                value={icp.name}
                onChange={(e) => handleChange(index, "name", e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Profissão</Label>
                <Input
                  placeholder="Ex: Dono de academia"
                  value={icp.profession}
                  onChange={(e) => handleChange(index, "profession", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Idade</Label>
                <Input
                  placeholder="Ex: 35-45 anos"
                  value={icp.age}
                  onChange={(e) => handleChange(index, "age", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Sexo</Label>
                <Select
                  value={icp.gender}
                  onValueChange={(value) => handleChange(index, "gender", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="ambos">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Por que precisa da solução?</Label>
              <Textarea
                placeholder="Qual problema ou situação leva essa pessoa a precisar do seu produto/serviço?"
                value={icp.reason_needs_solution}
                onChange={(e) => handleChange(index, "reason_needs_solution", e.target.value)}
                rows={2}
              />
            </div>
          </div>
        ))}

        {icps.length < 3 && (
          <Button type="button" variant="outline" onClick={handleAddICP} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Adicionar ICP
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
