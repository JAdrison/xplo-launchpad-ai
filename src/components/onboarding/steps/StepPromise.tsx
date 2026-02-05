import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2, Target, Lightbulb, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getAIConfig } from "@/lib/aiConfig";
import type { Tables } from "@/integrations/supabase/types";

type ClientPromise = Tables<"client_promise">;

interface StepPromiseProps {
  clientId: string;
  onNext: () => void;
  onPrevious: () => void;
}

export function StepPromise({ clientId, onNext, onPrevious }: StepPromiseProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [promise, setPromise] = useState<ClientPromise | null>(null);
  const [promiseText, setPromiseText] = useState("");

  useEffect(() => {
    fetchPromise();
  }, [clientId]);

  const fetchPromise = async () => {
    const { data } = await supabase
      .from("client_promise")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle();

    if (data) {
      setPromise(data);
      setPromiseText(data.promise_text || "");
    }
    setIsLoading(false);
  };

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);

    try {
      // Fetch all PPP data
      const [clientRes, profileRes, icpsRes, painsRes] = await Promise.all([
        supabase.from("clients").select("niche").eq("id", clientId).maybeSingle(),
        supabase.from("client_profile").select("*").eq("client_id", clientId).maybeSingle(),
        supabase.from("icps").select("*").eq("client_id", clientId).order("sort_order"),
        supabase.from("icp_pains").select("*, icps(name)").eq("icps.client_id", clientId),
      ]);

      const pppData = {
        niche: clientRes.data?.niche || null,
        profile: profileRes.data || null,
        icps: icpsRes.data || [],
        pains: painsRes.data || [],
        promise: null,
      };

      const aiConfig = getAIConfig();
      const response = await supabase.functions.invoke("generate-content", {
        body: {
          type: "generate-promise",
          clientId,
          pppData,
          aiConfig,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.promise) {
        // Append or set the promise
        if (promiseText.trim()) {
          setPromiseText((prev) => prev + "\n\n" + response.data.promise);
        } else {
          setPromiseText(response.data.promise);
        }

        toast({
          title: "Sugestão gerada!",
          description: "Uma promessa foi sugerida. Você pode editá-la.",
        });
      }
    } catch (error) {
      console.error("Error generating promise:", error);
      toast({
        title: "Erro ao gerar sugestão",
        description: "Tente novamente ou escreva manualmente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!promiseText.trim()) {
      toast({
        title: "Promessa obrigatória",
        description: "Por favor, escreva sua promessa de valor.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const promiseData = {
        client_id: clientId,
        promise_text: promiseText.trim(),
        generated_by_ai: false,
      };

      if (promise) {
        await supabase
          .from("client_promise")
          .update({ promise_text: promiseText.trim() })
          .eq("id", promise.id);
      } else {
        await supabase.from("client_promise").insert(promiseData);
      }

      toast({
        title: "Promessa salva",
        description: "Sua promessa de valor foi atualizada.",
      });

      onNext();
    } catch (error) {
      console.error("Error saving promise:", error);
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
          <Target className="h-5 w-5" />
          Sua Promessa de Valor
        </CardTitle>
        <CardDescription>
          Qual é a transformação que você promete entregar aos seus clientes?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <h4 className="text-sm font-medium">Dicas para uma boa promessa:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Seja específico sobre o resultado que você entrega</li>
              <li>• Inclua um prazo ou métrica quando possível</li>
              <li>• Foque na transformação, não nas características</li>
              <li>• Use linguagem que seu cliente usa</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="promise">Sua Promessa *</Label>
            <Textarea
              id="promise"
              placeholder="Ex: Ajudo donos de academia a triplicar o número de alunos em 90 dias usando estratégias de marketing digital comprovadas."
              value={promiseText}
              onChange={(e) => setPromiseText(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {promiseText.length}/500 caracteres
            </p>
          </div>

          {/* AI Suggestion Card */}
          <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-2 flex-1">
                <h4 className="text-sm font-medium">Precisa de inspiração?</h4>
                <p className="text-sm text-muted-foreground">
                  A IA pode sugerir uma promessa baseada em tudo que você preencheu até aqui.
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
                      Gerar Sugestão
                    </>
                  )}
                </Button>
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
