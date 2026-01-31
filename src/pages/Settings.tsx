import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Save } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("xplo_api_key");
    if (stored) setApiKey(stored);
  }, []);

  const handleSave = () => {
    localStorage.setItem("xplo_api_key", apiKey);
    toast({
      title: "Configurações salvas",
      description: "Sua API Key foi salva com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Configurações</h1>
        <p className="text-muted-foreground">Configure as opções do sistema</p>
      </div>

      {/* API Key Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>API Key para IA</CardTitle>
          <CardDescription>
            Configure sua chave de API da OpenAI ou Google Gemini para usar o gerador de conteúdo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-... ou AIza..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">Salvar</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              A chave será armazenada localmente no seu navegador.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle>Sobre o XPLO Starter</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Ferramenta interna para onboarding de clientes XPLO com fluxo guiado:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Cadastro de clientes</li>
            <li>Wizard PPP (Produto, Público, Problema, Promessa)</li>
            <li>Geração de Oferta Hormozi</li>
            <li>Geração de LPs e Anúncios</li>
          </ul>
          <p className="pt-2">Versão 1.0.0</p>
        </CardContent>
      </Card>
    </div>
  );
}
