import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, BarChart3, Loader2, Sparkles, RefreshCw, Pencil } from "lucide-react";
import { TagInput } from "../shared/TagInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getAIConfig } from "@/lib/aiConfig";

interface Props {
  clientId: string;
  niche: "hospedagem" | "saude" | "generico";
  onNext: () => void;
  onPrevious: () => void;
}

type QuadrantKey = "forcas_internas" | "fraquezas_internas" | "forcas_ambiente" | "fraquezas_ambiente";

interface QuadrantState {
  tags: string[];
  text: string;
}

const QUADRANT_META: { key: QuadrantKey; emoji: string; ring: string; bg: string }[] = [
  { key: "forcas_internas", emoji: "💪", ring: "ring-emerald-500/30", bg: "bg-emerald-500/5" },
  { key: "fraquezas_internas", emoji: "🔧", ring: "ring-rose-500/30", bg: "bg-rose-500/5" },
  { key: "forcas_ambiente", emoji: "🌤️", ring: "ring-sky-500/30", bg: "bg-sky-500/5" },
  { key: "fraquezas_ambiente", emoji: "⚠️", ring: "ring-amber-500/30", bg: "bg-amber-500/5" },
];

const TITLES: Record<"hospedagem" | "saude" | "generico", Record<QuadrantKey, string>> = {
  hospedagem: {
    forcas_internas: "Qual o ponto forte da sua hospedagem?",
    fraquezas_internas: "Qual o ponto fraco da sua hospedagem?",
    forcas_ambiente: "Qual o ponto forte da sua região?",
    fraquezas_ambiente: "Qual o ponto fraco da sua região?",
  },
  saude: {
    forcas_internas: "Qual o ponto forte da sua clínica/consultório?",
    fraquezas_internas: "Qual o ponto fraco da sua clínica/consultório?",
    forcas_ambiente: "Qual o ponto forte da sua região?",
    fraquezas_ambiente: "Qual o ponto fraco da sua região?",
  },
  generico: {
    forcas_internas: "Qual o ponto forte do seu negócio?",
    fraquezas_internas: "Qual o ponto fraco do seu negócio?",
    forcas_ambiente: "Qual o ponto forte do seu mercado/região?",
    fraquezas_ambiente: "Qual o ponto fraco do seu mercado/região?",
  },
};

const PLACEHOLDERS: Record<"hospedagem" | "saude" | "generico", Record<QuadrantKey, string>> = {
  hospedagem: {
    forcas_internas: "💡 Ex: vista única, localização privilegiada, atendimento pessoal",
    fraquezas_internas: "💡 Ex: fotos ruins, site desatualizado, poucas avaliações online",
    forcas_ambiente: "💡 Ex: crescimento do turismo regional, alta temporada, feriadões",
    fraquezas_ambiente: "💡 Ex: concorrência de Airbnb, baixa temporada, dependência de OTAs",
  },
  saude: {
    forcas_internas: "💡 Ex: formação sólida, equipamentos modernos, pacientes fiéis",
    fraquezas_internas: "💡 Ex: pouca presença no Instagram, agenda mal organizada",
    forcas_ambiente: "💡 Ex: aumento da demanda por saúde mental, bairro em expansão",
    fraquezas_ambiente: "💡 Ex: muitos profissionais na mesma região, concorrência em preço",
  },
  generico: {
    forcas_internas: "💡 Ex: qualidade do produto, entrega rápida, atendimento próximo",
    fraquezas_internas: "💡 Ex: processo de venda desorganizado, estoque irregular",
    forcas_ambiente: "💡 Ex: crescimento do setor, mudança no comportamento do consumidor",
    fraquezas_ambiente: "💡 Ex: concorrência grande, sazonalidade forte, instabilidade econômica",
  },
};

export function StepSWOT({ clientId, niche, onNext, onPrevious }: Props) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editing, setEditing] = useState<Record<QuadrantKey, boolean>>({
    forcas_internas: true,
    fraquezas_internas: true,
    forcas_ambiente: true,
    fraquezas_ambiente: true,
  });

  const [state, setState] = useState<Record<QuadrantKey, QuadrantState>>({
    forcas_internas: { tags: [], text: "" },
    fraquezas_internas: { tags: [], text: "" },
    forcas_ambiente: { tags: [], text: "" },
    fraquezas_ambiente: { tags: [], text: "" },
  });

  useEffect(() => { void load(); }, [clientId]);

  const load = async () => {
    const { data } = await supabase.from("client_swot").select("*").eq("client_id", clientId).maybeSingle();
    if (data) {
      setState({
        forcas_internas: { tags: data.forcas_internas_tags || [], text: data.forcas_internas_text || "" },
        fraquezas_internas: { tags: data.fraquezas_internas_tags || [], text: data.fraquezas_internas_text || "" },
        forcas_ambiente: { tags: data.forcas_ambiente_tags || [], text: data.forcas_ambiente_text || "" },
        fraquezas_ambiente: { tags: data.fraquezas_ambiente_tags || [], text: data.fraquezas_ambiente_text || "" },
      });
      const hasAny = !!(data.forcas_internas_tags?.length || data.fraquezas_internas_tags?.length);
      if (hasAny) {
        setEditing({ forcas_internas: false, fraquezas_internas: false, forcas_ambiente: false, fraquezas_ambiente: false });
      }
    }
    setIsLoading(false);
  };

  const updateQuadrant = (key: QuadrantKey, partial: Partial<QuadrantState>) => {
    setState((p) => ({ ...p, [key]: { ...p[key], ...partial } }));
  };

  const generate = async () => {
    setIsGenerating(true);
    try {
      const aiConfig = getAIConfig();
      const r = await supabase.functions.invoke("generate-content", {
        body: { type: "generate-swot", clientId, niche, aiConfig },
      });
      if (r.error) throw new Error(r.error.message);
      const swot = r.data?.swot;
      if (!swot) throw new Error("Sem retorno");

      setState({
        forcas_internas: { tags: swot.forcas_internas?.tags || [], text: swot.forcas_internas?.text || "" },
        fraquezas_internas: { tags: swot.fraquezas_internas?.tags || [], text: swot.fraquezas_internas?.text || "" },
        forcas_ambiente: { tags: swot.forcas_ambiente?.tags || [], text: swot.forcas_ambiente?.text || "" },
        fraquezas_ambiente: { tags: swot.fraquezas_ambiente?.tags || [], text: swot.fraquezas_ambiente?.text || "" },
      });
      setEditing({ forcas_internas: false, fraquezas_internas: false, forcas_ambiente: false, fraquezas_ambiente: false });
      toast({ title: "Análise gerada!", description: "Sugestões criadas com base no seu negócio. Use ✏️ para editar." });
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao gerar", description: "Tente novamente ou preencha manualmente.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    // Validação leve: avisa se quadrante estiver vazio mas não bloqueia
    const empty = QUADRANT_META.filter((q) => state[q.key].tags.length === 0);
    if (empty.length === QUADRANT_META.length) {
      toast({
        title: "Adicione pelo menos algumas observações",
        description: "Digite no campo e clique no botão + para adicionar. Você pode pular quadrantes individuais.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        client_id: clientId,
        forcas_internas_tags: state.forcas_internas.tags,
        forcas_internas_text: state.forcas_internas.text || null,
        fraquezas_internas_tags: state.fraquezas_internas.tags,
        fraquezas_internas_text: state.fraquezas_internas.text || null,
        forcas_ambiente_tags: state.forcas_ambiente.tags,
        forcas_ambiente_text: state.forcas_ambiente.text || null,
        fraquezas_ambiente_tags: state.fraquezas_ambiente.tags,
        fraquezas_ambiente_text: state.fraquezas_ambiente.text || null,
      };

      const { data: existing } = await supabase.from("client_swot").select("id").eq("client_id", clientId).maybeSingle();
      if (existing) {
        await supabase.from("client_swot").update(payload).eq("id", existing.id);
      } else {
        await supabase.from("client_swot").insert(payload);
      }

      toast({ title: "Análise salva" });
      onNext();
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const isEmpty = QUADRANT_META.every((q) => state[q.key].tags.length === 0);

  if (isLoading) return <Card><CardContent className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> O que é bom e o que pode melhorar</CardTitle>
        <CardDescription>Mapeie pontos fortes e fracos do seu negócio e do ambiente externo.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {QUADRANT_META.map((q) => {
            const s = state[q.key];
            const isEdit = editing[q.key];
            return (
              <div key={q.key} className={`rounded-lg border p-4 space-y-3 ${q.bg}`}>
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <span className="text-lg">{q.emoji}</span>
                    {TITLES[niche][q.key]}
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setEditing((p) => ({ ...p, [q.key]: !p[q.key] }))}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
                {isEdit ? (
                  <TagInput value={s.tags} onChange={(v) => updateQuadrant(q.key, { tags: v })} placeholder={PLACEHOLDERS[niche][q.key]} max={5} />
                ) : (
                  <div className="flex flex-wrap gap-2 min-h-[40px]">
                    {s.tags.length === 0 ? <span className="text-xs text-muted-foreground">Nenhum item</span> : s.tags.map((t) => (
                      <span key={t} className="px-2 py-1 rounded-md bg-background border text-xs">{t}</span>
                    ))}
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs">Detalhar (opcional)</Label>
                  <Textarea
                    rows={2}
                    value={s.text}
                    onChange={(e) => updateQuadrant(q.key, { text: e.target.value })}
                    disabled={!isEdit}
                    placeholder="Conte um pouco mais sobre estes pontos..."
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onPrevious} className="gap-2"><ArrowLeft className="h-4 w-4" /> Anterior</Button>
          <Button onClick={handleSubmit} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Próximo <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
