import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Save, Sparkles, Key } from "lucide-react";

type AISource = "lovable" | "custom";
type AIProvider = "gemini" | "openai";

interface ModelOption {
  value: string;
  label: string;
  badge?: string;
}

const LOVABLE_MODELS: Record<AIProvider, ModelOption[]> = {
  gemini: [
    { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", badge: "Novo" },
    { value: "google/gemini-3-pro-preview", label: "Gemini 3 Pro", badge: "Novo" },
    { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", badge: "Recomendado" },
    { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  ],
  openai: [
    { value: "openai/gpt-5.2", label: "GPT-5.2", badge: "Novo" },
    { value: "openai/gpt-5", label: "GPT-5" },
    { value: "openai/gpt-5-mini", label: "GPT-5 Mini", badge: "Recomendado" },
    { value: "openai/gpt-5-nano", label: "GPT-5 Nano" },
  ],
};

const CUSTOM_MODELS: Record<AIProvider, ModelOption[]> = {
  gemini: [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", badge: "Recomendado" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  ],
  openai: [
    { value: "gpt-4o", label: "GPT-4o", badge: "Recomendado" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  ],
};

export default function Settings() {
  const { toast } = useToast();
  const [source, setSource] = useState<AISource>("lovable");
  const [provider, setProvider] = useState<AIProvider>("gemini");
  const [model, setModel] = useState("google/gemini-3-flash-preview");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  // Load saved settings
  useEffect(() => {
    const savedSource = localStorage.getItem("xplo_ai_source") as AISource | null;
    const savedProvider = localStorage.getItem("xplo_ai_provider") as AIProvider | null;
    const savedModel = localStorage.getItem("xplo_ai_model");
    const savedKey = localStorage.getItem("xplo_api_key");

    if (savedSource) setSource(savedSource);
    if (savedProvider) setProvider(savedProvider);
    if (savedModel) setModel(savedModel);
    if (savedKey) setApiKey(savedKey);
  }, []);

  // Reset model when source or provider changes
  useEffect(() => {
    const models = source === "lovable" ? LOVABLE_MODELS : CUSTOM_MODELS;
    const defaultModel = models[provider][0].value;
    setModel(defaultModel);
  }, [source, provider]);

  const handleSave = () => {
    localStorage.setItem("xplo_ai_source", source);
    localStorage.setItem("xplo_ai_provider", provider);
    localStorage.setItem("xplo_ai_model", model);
    
    if (source === "custom") {
      localStorage.setItem("xplo_api_key", apiKey);
    }

    toast({
      title: "Configurações salvas",
      description: "Suas preferências de IA foram salvas com sucesso.",
    });
  };

  const currentModels = source === "lovable" ? LOVABLE_MODELS : CUSTOM_MODELS;
  const placeholder = provider === "gemini" ? "AIza..." : "sk-...";

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Configurações</h1>
        <p className="text-muted-foreground">Configure as opções do sistema</p>
      </div>

      {/* AI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração de IA</CardTitle>
          <CardDescription>
            Escolha como usar a inteligência artificial no gerador de conteúdo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI Source Selection */}
          <div className="space-y-3">
            <Label>Fonte de IA</Label>
            <RadioGroup
              value={source}
              onValueChange={(value) => setSource(value as AISource)}
              className="grid gap-3"
            >
              <label
                htmlFor="lovable"
                className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                  source === "lovable" ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
                }`}
              >
                <RadioGroupItem value="lovable" id="lovable" className="mt-1" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-medium">Lovable AI</span>
                    <Badge variant="secondary" className="text-xs">Recomendado</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sem configuração necessária. Usa créditos Lovable automaticamente.
                  </p>
                </div>
              </label>

              <label
                htmlFor="custom"
                className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                  source === "custom" ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
                }`}
              >
                <RadioGroupItem value="custom" id="custom" className="mt-1" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    <span className="font-medium">API Própria</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use sua própria chave OpenAI ou Google Gemini.
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">Provedor</Label>
            <Select value={provider} onValueChange={(value) => setProvider(value as AIProvider)}>
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Google Gemini</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">Modelo</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentModels[provider].map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    <div className="flex items-center gap-2">
                      <span>{m.label}</span>
                      {m.badge && (
                        <Badge 
                          variant={m.badge === "Novo" ? "default" : "secondary"} 
                          className="text-xs"
                        >
                          {m.badge}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* API Key (only for custom) */}
          {source === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={placeholder}
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
              <p className="text-xs text-muted-foreground">
                A chave será armazenada localmente no seu navegador.
              </p>
            </div>
          )}

          {/* Info note for Lovable AI */}
          {source === "lovable" && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              <p>
                <strong>Dica:</strong> Com Lovable AI você tem acesso aos modelos mais recentes 
                (Gemini 3, GPT-5.2) sem precisar configurar API Key.
              </p>
            </div>
          )}

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full gap-2">
            <Save className="h-4 w-4" />
            Salvar Configurações
          </Button>
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
