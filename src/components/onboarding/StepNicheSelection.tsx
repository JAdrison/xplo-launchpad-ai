import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hotel, Stethoscope, Building, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { NicheType } from "./shared/nicheLabels";

interface StepNicheSelectionProps {
  clientId: string;
  initialNiche?: NicheType | null;
  initialLabel?: string | null;
  onNext: () => void;
}

const OPTIONS: { value: NicheType; title: string; desc: string; icon: typeof Hotel; defaultLabel: string }[] = [
  {
    value: "hospedagem",
    title: "Hospedagem",
    desc: "Pousada, chalé, casa de temporada, hotel",
    icon: Hotel,
    defaultLabel: "Hospedagem",
  },
  {
    value: "saude",
    title: "Área da Saúde",
    desc: "Clínica, consultório, profissional autônomo",
    icon: Stethoscope,
    defaultLabel: "Saúde",
  },
  {
    value: "generico",
    title: "Outro",
    desc: "Pet shop, estética, advocacia, e-commerce, etc",
    icon: Building,
    defaultLabel: "",
  },
];

export function StepNicheSelection({ clientId, initialNiche, initialLabel, onNext }: StepNicheSelectionProps) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<NicheType | null>(initialNiche ?? null);
  const [customLabel, setCustomLabel] = useState(initialLabel ?? "");
  const [confirmed, setConfirmed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialNiche) {
      setSelected(initialNiche);
      setCustomLabel(initialLabel ?? "");
    }
  }, [initialNiche, initialLabel]);

  const handleSelect = (niche: NicheType) => {
    setSelected(niche);
    setConfirmed(false);
    if (niche !== "generico") {
      setCustomLabel(OPTIONS.find((o) => o.value === niche)?.defaultLabel ?? "");
    } else {
      setCustomLabel("");
    }
  };

  const handleConfirm = async () => {
    if (!selected) return;
    if (selected === "generico" && !customLabel.trim()) {
      toast({
        title: "Informe seu nicho",
        description: "Escreva qual é o nicho do seu negócio para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const label =
        selected === "generico"
          ? customLabel.trim()
          : (customLabel.trim() || OPTIONS.find((o) => o.value === selected)!.defaultLabel);

      const { error } = await supabase
        .from("clients")
        .update({ niche_type: selected, niche_label: label, niche: label })
        .eq("id", clientId);

      if (error) throw error;
      setConfirmed(true);
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao salvar", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (confirmed && selected) {
    const label = selected === "generico" ? customLabel : OPTIONS.find((o) => o.value === selected)!.title;
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-6">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Tudo certo!</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Vamos personalizar o onboarding para <span className="font-semibold text-foreground">{label}</span>.
              Clique em Continuar para começar.
            </p>
          </div>
          <Button onClick={onNext} className="gap-2" size="lg">
            Continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Qual é o nicho do seu negócio?</CardTitle>
        <CardDescription>
          Vamos adaptar todas as próximas perguntas ao seu tipo de negócio.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = selected === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`text-left rounded-lg border-2 p-6 transition-all hover:border-primary/60 hover:shadow-md ${
                  isActive ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                <div className={`inline-flex p-3 rounded-lg mb-4 ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-1">{opt.title}</h3>
                <p className="text-sm text-muted-foreground">{opt.desc}</p>
              </button>
            );
          })}
        </div>

        {selected === "generico" && (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
            <Label htmlFor="custom-niche">Qual é o seu nicho?</Label>
            <Input
              id="custom-niche"
              placeholder="Ex: Pet Shop, Estética, Advocacia, E-commerce..."
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Escreva em uma palavra ou expressão curta o tipo do seu negócio.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleConfirm} disabled={!selected || isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Confirmar <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
