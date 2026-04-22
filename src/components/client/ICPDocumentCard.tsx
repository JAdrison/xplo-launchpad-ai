import { useEffect, useState } from "react";
import { usePDF, Margin } from "react-to-pdf";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Sparkles,
  Loader2,
  Pencil,
  RefreshCw,
  Copy,
  FileDown,
  Check,
  X,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAIConfig } from "@/lib/aiConfig";
import { ICPPDFTemplate } from "@/components/export/ICPPDFTemplate";

interface ICPDocumentCardProps {
  clientId: string;
  clientName: string;
}

export function ICPDocumentCard({ clientId, clientName }: ICPDocumentCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [text, setText] = useState<string>("");
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const sanitized = clientName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const dateStr = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
  const { toPDF, targetRef } = usePDF({
    filename: `icp-${sanitized}-${dateStr}.pdf`,
    page: { margin: Margin.MEDIUM, format: "A4", orientation: "portrait" },
  });

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const load = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("client_icp")
      .select("generated_icp_text, generated_at")
      .eq("client_id", clientId)
      .maybeSingle();
    setText(data?.generated_icp_text || "");
    setGeneratedAt(data?.generated_at || null);
    setIsLoading(false);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const aiConfig = getAIConfig();
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { type: "generate-icp-document", clientId, aiConfig },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setText(data.text || "");
      setGeneratedAt(new Date().toISOString());
      toast.success("ICP gerado com sucesso!");
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "Erro ao gerar ICP";
      if (msg.includes("Rate limit") || msg.includes("429")) {
        toast.error("Limite de requisições atingido. Aguarde um instante.");
      } else if (msg.includes("Payment") || msg.includes("402")) {
        toast.error("Créditos esgotados. Adicione fundos no workspace.");
      } else {
        toast.error(msg);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartEdit = () => {
    setEditValue(text);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    const { error } = await supabase
      .from("client_icp")
      .update({ generated_icp_text: editValue })
      .eq("client_id", clientId);
    if (error) {
      toast.error("Erro ao salvar edição");
      return;
    }
    setText(editValue);
    setIsEditing(false);
    toast.success("ICP atualizado");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência");
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

  const hasContent = !!text;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              ICP — Cliente Ideal
            </CardTitle>
            <CardDescription>
              Documento estratégico do perfil de cliente ideal, gerado a partir do onboarding.
            </CardDescription>
          </div>
          {hasContent && (
            <Badge variant="default" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              Gerado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasContent && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <Target className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground max-w-md">
              Gere um documento detalhado do seu cliente ideal com base em todos os dados do onboarding.
            </p>
            <Button onClick={handleGenerate} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Gerar ICP
            </Button>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Gerando seu ICP...</p>
          </div>
        )}

        {hasContent && !isGenerating && (
          <>
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveEdit} size="sm" className="gap-2">
                    <Check className="h-4 w-4" />
                    Salvar
                  </Button>
                  <Button onClick={() => setIsEditing(false)} variant="outline" size="sm" className="gap-2">
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-lg border bg-muted/30 p-5 whitespace-pre-wrap text-sm leading-relaxed">
                  {text}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleStartEdit} variant="outline" size="sm" className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button onClick={handleGenerate} variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Regenerar
                  </Button>
                  <Button onClick={handleCopy} variant="outline" size="sm" className="gap-2">
                    <Copy className="h-4 w-4" />
                    Copiar
                  </Button>
                  <Button onClick={() => toPDF()} variant="outline" size="sm" className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Baixar PDF
                  </Button>
                </div>
                {generatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Gerado em {new Date(generatedAt).toLocaleString("pt-BR")}
                  </p>
                )}
              </>
            )}
          </>
        )}

        {/* Hidden PDF render target */}
        <div ref={targetRef} style={{ position: "absolute", left: "-9999px", top: 0 }}>
          {hasContent && (
            <ICPPDFTemplate
              clientName={clientName}
              createdAt={generatedAt || new Date().toISOString()}
              text={text}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
