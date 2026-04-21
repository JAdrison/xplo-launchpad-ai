import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, Loader2, Users, CheckCircle, Sparkles } from "lucide-react";
import { TagInput } from "../shared/TagInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { clientWord, type NicheType } from "../shared/nicheLabels";

interface Props {
  clientId: string;
  niche: NicheType;
  onNext: () => void;
  onPrevious: () => void;
}

interface BlocoData {
  perfil?: string[];
  faixa_etaria?: string;
  origem?: string[];
  filhos?: string;
  motivacao?: string;
  canais?: string[];
  preco?: string;
  ticket?: string;
  nao_funciona?: string;
  por_que?: string;
  alertas?: string[];
}

const PERFIL_OPTS: Record<NicheType, string[]> = {
  hospedagem: ["Casais", "Famílias", "Grupos de amigos", "Viajante solo", "Executivo"],
  saude: ["Adultos", "Idosos", "Crianças", "Gestantes", "Adolescentes"],
  generico: ["Jovens", "Adultos", "Famílias", "Empresas", "Outros"],
};

const CANAIS_OPTS: Record<NicheType, string[]> = {
  hospedagem: ["Instagram", "WhatsApp", "Booking", "Airbnb", "Indicação", "Google"],
  saude: ["Indicação", "Instagram", "Google", "Convênio", "Doctoralia", "WhatsApp"],
  generico: ["Indicação", "Instagram", "Google", "Facebook", "WhatsApp", "Loja física"],
};

export function StepClientProfile({ clientId, niche, onNext, onPrevious }: Props) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [icpId, setIcpId] = useState<string | null>(null);
  const [block, setBlock] = useState<1 | 2 | 3>(1);

  const [b1, setB1] = useState<BlocoData>({});
  const [b2, setB2] = useState<BlocoData>({});
  const [b3, setB3] = useState<BlocoData>({});

  const word = clientWord(niche);
  const wordPlural = clientWord(niche, true);

  useEffect(() => { void load(); }, [clientId]);

  const load = async () => {
    const { data } = await supabase.from("client_icp").select("*").eq("client_id", clientId).maybeSingle();
    if (data) {
      setIcpId(data.id);
      setB1((data.bloco1_data as BlocoData) || {});
      setB2((data.bloco2_data as BlocoData) || {});
      setB3((data.bloco3_data as BlocoData) || {});
    }
    setIsLoading(false);
  };

  const toggleArr = (state: BlocoData, set: (b: BlocoData) => void, key: keyof BlocoData, value: string, checked: boolean) => {
    const cur: string[] = (state[key] as string[]) || [];
    set({ ...state, [key]: checked ? [...cur, value] : cur.filter((x) => x !== value) });
  };

  const validateBlock = (b: BlocoData, n: 1 | 2 | 3): boolean => {
    if (n === 1 || n === 2) {
      if (!b.perfil?.length || !b.faixa_etaria?.trim() || !b.origem?.length || !b.motivacao?.trim() || !b.canais?.length || !b.preco) return false;
    }
    if (n === 3) {
      if (!b.nao_funciona?.trim()) return false;
    }
    return true;
  };

  const handleNextBlock = async () => {
    const cur = block === 1 ? b1 : block === 2 ? b2 : b3;
    if (!validateBlock(cur, block)) {
      toast({ title: "Campos obrigatórios", description: "Preencha todos os campos com * deste bloco.", variant: "destructive" });
      return;
    }
    await save();
    if (block < 3) setBlock((block + 1) as 1 | 2 | 3);
    else onNext();
  };

  const handlePrevBlock = () => {
    if (block > 1) setBlock((block - 1) as 1 | 2 | 3);
    else onPrevious();
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const payload = {
        client_id: clientId,
        bloco1_data: b1 as any,
        bloco2_data: b2 as any,
        bloco3_data: b3 as any,
      };
      if (icpId) {
        await supabase.from("client_icp").update(payload).eq("id", icpId);
      } else {
        const { data } = await supabase.from("client_icp").insert(payload).select("id").maybeSingle();
        if (data) setIcpId(data.id);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Card><CardContent className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent></Card>;

  const renderBlock1or2 = (b: BlocoData, set: (b: BlocoData) => void, isB1: boolean) => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Perfil demográfico *</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PERFIL_OPTS[niche].map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <Checkbox id={`p_${opt}`} checked={(b.perfil || []).includes(opt)} onCheckedChange={(c) => toggleArr(b, set, "perfil", opt, c as boolean)} />
              <label htmlFor={`p_${opt}`} className="text-sm">{opt}</label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Faixa etária *</Label>
          <Input value={b.faixa_etaria || ""} onChange={(e) => set({ ...b, faixa_etaria: e.target.value })} placeholder={isB1 ? "💡 Ex: entre 28 e 40 anos" : "💡 Ex: 30 a 45 anos"} />
        </div>
        <div className="space-y-2">
          <Label>De onde {isB1 ? "vêm" : "viriam"} *</Label>
          <TagInput value={b.origem || []} onChange={(v) => set({ ...b, origem: v })} placeholder="💡 Ex: Fortaleza, Recife, São Paulo" />
        </div>
      </div>

      {niche === "hospedagem" && (
        <div className="space-y-2">
          <Label>Têm filhos pequenos?</Label>
          <RadioGroup value={b.filhos || ""} onValueChange={(v) => set({ ...b, filhos: v })} className="flex gap-4">
            {(isB1 ? ["Sim", "Não", "Às vezes"] : ["Sim", "Não", "Tanto faz"]).map((o) => (
              <div key={o} className="flex items-center gap-2">
                <RadioGroupItem value={o} id={`f_${o}`} /><label htmlFor={`f_${o}`} className="text-sm">{o}</label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      <div className="space-y-2">
        <Label>{isB1 ? "Motivação principal para buscar você *" : "O que esse cliente ideal está buscando? *"}</Label>
        <Textarea rows={3} value={b.motivacao || ""} onChange={(e) => set({ ...b, motivacao: e.target.value })} />
      </div>

      <div className="space-y-2">
        <Label>{isB1 ? "Por onde costumam chegar até você *" : "Por onde você quer que cheguem até você *"}</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CANAIS_OPTS[niche].map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <Checkbox id={`c_${opt}`} checked={(b.canais || []).includes(opt)} onCheckedChange={(c) => toggleArr(b, set, "canais", opt, c as boolean)} />
              <label htmlFor={`c_${opt}`} className="text-sm">{opt}</label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{isB1 ? "Aceitam bem o preço que você cobra? *" : "Aceitariam bem o seu preço? *"}</Label>
        <RadioGroup value={b.preco || ""} onValueChange={(v) => set({ ...b, preco: v })} className="flex flex-col gap-2">
          {(isB1
            ? ["Pagam sem questionar", "Às vezes negociam", "Quase sempre pedem desconto"]
            : ["Sim, pagam tranquilamente", "Não, seria uma barreira"]
          ).map((o) => (
            <div key={o} className="flex items-center gap-2">
              <RadioGroupItem value={o} id={`pr_${o}`} /><label htmlFor={`pr_${o}`} className="text-sm">{o}</label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {!isB1 && (
        <div className="space-y-2">
          <Label>Ticket médio que esse cliente gastaria</Label>
          <Input value={b.ticket || ""} onChange={(e) => set({ ...b, ticket: e.target.value })} placeholder="💡 Ex: R$ 1.500 a R$ 3.000" />
        </div>
      )}
    </div>
  );

  const renderBlock3 = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Que tipo de {word} claramente não funciona bem? *</Label>
        <Textarea rows={3} maxLength={500} value={b3.nao_funciona || ""} onChange={(e) => setB3({ ...b3, nao_funciona: e.target.value })} placeholder="💡 Descreva o perfil que não funciona no seu negócio" />
      </div>
      <div className="space-y-2">
        <Label>Por que eles não funcionam?</Label>
        <Textarea rows={3} value={b3.por_que || ""} onChange={(e) => setB3({ ...b3, por_que: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Sinais de alerta nas primeiras interações</Label>
        <TagInput value={b3.alertas || []} onChange={(v) => setB3({ ...b3, alertas: v })} placeholder="💡 Ex: só pergunta preço, quer desconto no primeiro contato" />
      </div>

      <div className="p-4 rounded-lg border bg-primary/5 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-primary mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-sm flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Perfeito! Você preencheu o perfil completo dos seus {wordPlural}.</p>
          <p className="text-sm text-muted-foreground">Em breve, nossa IA vai transformar essas respostas em um documento de ICP completo para guiar sua estratégia de anúncios.</p>
        </div>
      </div>
    </div>
  );

  const titles: Record<1 | 2 | 3, { t: string; s: string }> = {
    1: { t: `Quem mais aparece no seu negócio hoje`, s: `Me fala sobre o ${word} que você já conhece bem — o que mais ${niche === "saude" ? "procura seu atendimento" : niche === "hospedagem" ? "aparece" : "compra"} hoje.` },
    2: { t: "O cliente dos seus sonhos", s: `Agora me fala sobre o ${word} ideal — aquele que você quer ${niche === "hospedagem" ? "receber" : niche === "saude" ? "atrair" : "vender"} mais.` },
    3: { t: `Quem não é o seu ${word}`, s: "Importante: isso evita desperdiçar verba de anúncio no público errado." },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> {titles[block].t}</CardTitle>
        <CardDescription>{titles[block].s}</CardDescription>
        <div className="flex items-center gap-2 pt-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className={`h-2 flex-1 rounded-full ${n <= block ? "bg-primary" : "bg-muted"}`} />
          ))}
          <span className="text-xs text-muted-foreground ml-2">Bloco {block} de 3</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {block === 1 && renderBlock1or2(b1, setB1, true)}
        {block === 2 && renderBlock1or2(b2, setB2, false)}
        {block === 3 && renderBlock3()}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handlePrevBlock} className="gap-2"><ArrowLeft className="h-4 w-4" /> Anterior</Button>
          <Button onClick={handleNextBlock} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : block === 3 ? <>Finalizar <ArrowRight className="h-4 w-4" /></> : <>Próximo bloco <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
