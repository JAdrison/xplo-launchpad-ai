import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link2, Copy, RefreshCw, Loader2, Check, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OnboardingLinkSectionProps {
  clientId: string;
  clientName: string;
}

interface TokenData {
  id: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export function OnboardingLinkSection({ clientId, clientName }: OnboardingLinkSectionProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchToken();
  }, [clientId]);

  const fetchToken = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("client_tokens")
      .select("*")
      .eq("client_id", clientId)
      .eq("type", "onboarding")
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setTokenData(data);
    setIsLoading(false);
  };

  const generateToken = async () => {
    setIsGenerating(true);

    try {
      const token = crypto.randomUUID().replace(/-/g, "") + Date.now().toString(36);
      const expiresAt = addDays(new Date(), 7);

      const { data, error } = await supabase
        .from("client_tokens")
        .insert({
          client_id: clientId,
          token,
          type: "onboarding",
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setTokenData(data);
      toast({
        title: "Link gerado!",
        description: "O link de onboarding foi criado com sucesso.",
      });
    } catch (error) {
      console.error("Error generating token:", error);
      toast({
        title: "Erro ao gerar link",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!tokenData) return;

    const url = `${window.location.origin}/onboarding/external/${tokenData.token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });

    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    // Invalidate current token
    if (tokenData) {
      await supabase
        .from("client_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", tokenData.id);
    }
    // Generate new one
    await generateToken();
  };

  const getExpirationText = () => {
    if (!tokenData) return "";
    const expiresAt = new Date(tokenData.expires_at);
    const daysLeft = differenceInDays(expiresAt, new Date());
    
    if (daysLeft <= 0) return "Expira hoje";
    if (daysLeft === 1) return "Expira amanhã";
    return `Expira em ${daysLeft} dias`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="h-4 w-4" />
          Link para o Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Envie este link para {clientName} preencher o onboarding
        </p>

        {tokenData ? (
          <>
            <div className="flex gap-2">
              <Input
                value={`${window.location.origin}/onboarding/external/${tokenData.token}`}
                readOnly
                className="font-mono text-xs"
              />
              <Button variant="outline" size="icon" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {getExpirationText()}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="gap-1"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Regenerar
              </Button>
            </div>
          </>
        ) : (
          <Button onClick={generateToken} disabled={isGenerating} className="w-full gap-2">
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            Gerar Link de Onboarding
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
