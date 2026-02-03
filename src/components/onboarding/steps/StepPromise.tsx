import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
