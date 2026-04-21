import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, Loader2, TrendingUp, Eye, EyeOff, Instagram, Facebook } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { maskPhone } from "@/lib/utils";

interface Props {
  clientId: string;
  niche: "hospedagem" | "saude" | "generico";
  onNext: () => void;
  onPrevious: () => void;
}

const SITUATION_FIELDS: Record<Props["niche"], { key: string; label: string; type: "select" | "checkbox" | "number"; options?: { v: string; l: string }[]; required?: boolean }[]> = {
  hospedagem: [
    { key: "ocupacao", label: "Taxa de ocupação média hoje *", type: "select", required: true, options: [
      { v: "menos_30", l: "Menos de 30%" }, { v: "30_50", l: "30-50%" }, { v: "50_70", l: "50-70%" }, { v: "mais_70", l: "+70%" }, { v: "nao_sei", l: "Não sei" },
    ]},
    { key: "canais", label: "Principal canal de reservas hoje *", type: "checkbox", required: true, options: [
      { v: "otas", l: "OTAs (Airbnb/Booking)" }, { v: "redes", l: "Instagram/WhatsApp" }, { v: "indicacao", l: "Indicação" }, { v: "site", l: "Site próprio" }, { v: "google", l: "Google" }, { v: "outro", l: "Outro" },
    ]},
    { key: "dificuldade", label: "Períodos com mais dificuldade de lotar *", type: "checkbox", required: true, options: [
      { v: "fds", l: "Finais de semana comuns" }, { v: "semana", l: "Dias de semana" }, { v: "baixa", l: "Baixa temporada" }, { v: "ano", l: "O ano todo" },
    ]},
    { key: "meta", label: "Meta de reservas diretas por mês", type: "number" },
  ],
  saude: [
    { key: "novos", label: "Quantos pacientes novos você atende por mês? *", type: "select", required: true, options: [
      { v: "menos_10", l: "Menos de 10" }, { v: "10_30", l: "10-30" }, { v: "30_60", l: "30-60" }, { v: "mais_60", l: "+60" },
    ]},
    { key: "canais", label: "Principal canal de captação de pacientes hoje *", type: "checkbox", required: true, options: [
      { v: "indicacao", l: "Indicação" }, { v: "instagram", l: "Instagram" }, { v: "google", l: "Google" }, { v: "convenio", l: "Convênio" }, { v: "site", l: "Site próprio" }, { v: "whatsapp", l: "WhatsApp" }, { v: "doctoralia", l: "Doctoralia" }, { v: "outro", l: "Outro" },
    ]},
    { key: "dificuldade", label: "Em que momento tem mais dificuldade de preencher a agenda?", type: "checkbox", options: [
      { v: "inicio", l: "Início do mês" }, { v: "fim", l: "Fim do mês" }, { v: "dias", l: "Dias da semana específicos" }, { v: "ano", l: "O ano todo" }, { v: "ferias", l: "Férias (jan/jul)" },
    ]},
    { key: "conversao", label: "Taxa de conversão aproximada (contatos que viram consulta)", type: "select", options: [
      { v: "menos_20", l: "Menos de 20%" }, { v: "20_40", l: "20-40%" }, { v: "40_60", l: "40-60%" }, { v: "mais_60", l: "+60%" }, { v: "nao_sei", l: "Não sei" },
    ]},
    { key: "meta", label: "Meta de pacientes novos por mês", type: "number" },
  ],
  generico: [
    { key: "novos", label: "Quantos clientes novos você atende/vende por mês? *", type: "number", required: true },
    { key: "canais", label: "Principal canal de aquisição hoje *", type: "checkbox", required: true, options: [
      { v: "indicacao", l: "Indicação" }, { v: "instagram", l: "Instagram" }, { v: "google", l: "Google" }, { v: "facebook", l: "Facebook" }, { v: "whatsapp", l: "WhatsApp" }, { v: "loja", l: "Loja física" }, { v: "site", l: "Site próprio" }, { v: "marketplaces", l: "Marketplaces" }, { v: "outro", l: "Outro" },
    ]},
    { key: "dificuldade", label: "Em que período você vende menos?", type: "checkbox", options: [
      { v: "inicio", l: "Início do mês" }, { v: "meio", l: "Meio" }, { v: "fim", l: "Fim" }, { v: "saz", l: "Sazonalidade específica" }, { v: "ano", l: "O ano todo" },
    ]},
    { key: "meta", label: "Meta de clientes/vendas por mês", type: "number" },
  ],
};

interface Competitor { name: string; reason: string }

export function StepMarketByNiche({ clientId, niche, onNext, onPrevious }: Props) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [showIgPwd, setShowIgPwd] = useState(false);
  const [showFbPwd, setShowFbPwd] = useState(false);

  const fields = SITUATION_FIELDS[niche];

  const [marketData, setMarketData] = useState<Record<string, any>>({});
  const [comp1, setComp1] = useState<Competitor>({ name: "", reason: "" });
  const [comp2, setComp2] = useState<Competitor>({ name: "", reason: "" });
  const [reference, setReference] = useState<Competitor>({ name: "", reason: "" });
  const [igLink, setIgLink] = useState("");
  const [igLogin, setIgLogin] = useState("");
  const [igPwd, setIgPwd] = useState("");
  const [fbLogin, setFbLogin] = useState("");
  const [fbPwd, setFbPwd] = useState("");
  const [whats, setWhats] = useState("");
  const [gmb, setGmb] = useState("");

  useEffect(() => { void load(); }, [clientId]);

  const load = async () => {
    const { data } = await supabase.from("client_profile").select("*").eq("client_id", clientId).maybeSingle();
    if (data) {
      const d: any = data;
      setProfileId(d.id);
      setMarketData(d.market_data || {});
      const parse = (v: any): Competitor => v && typeof v === "object" ? { name: v.name || "", reason: v.reason || "" } : { name: "", reason: "" };
      setComp1(parse(d.local_competitor_1));
      setComp2(parse(d.local_competitor_2));
      setReference(parse(d.inspiration_company_1));
      setIgLink(d.instagram_link || "");
      setIgLogin(d.instagram_login || "");
      setIgPwd(d.instagram_password || "");
      setFbLogin(d.facebook_login || "");
      setFbPwd(d.facebook_password || "");
      setWhats(d.whatsapp_number ? maskPhone(d.whatsapp_number.replace(/\D/g, "")) : "");
      setGmb(d.google_my_business || "");
    }
    setIsLoading(false);
  };

  const toggleCheckbox = (key: string, value: string, checked: boolean) => {
    setMarketData((p) => {
      const arr: string[] = p[key] || [];
      return { ...p, [key]: checked ? [...arr, value] : arr.filter((x) => x !== value) };
    });
  };

  const handleSubmit = async () => {
    for (const f of fields) {
      if (!f.required) continue;
      const v = marketData[f.key];
      if (f.type === "checkbox") {
        if (!Array.isArray(v) || v.length === 0) { toast({ title: "Campos obrigatórios", description: f.label, variant: "destructive" }); return; }
      } else if (!v) {
        toast({ title: "Campos obrigatórios", description: f.label, variant: "destructive" }); return;
      }
    }

    setIsSaving(true);
    try {
      const prep = (c: Competitor) => c.name.trim() || c.reason.trim() ? { name: c.name.trim(), reason: c.reason.trim() } : null;
      const payload: any = {
        market_data: marketData,
        local_competitor_1: prep(comp1),
        local_competitor_2: prep(comp2),
        inspiration_company_1: prep(reference),
        instagram_link: igLink.trim() || null,
        instagram_login: igLogin.trim() || null,
        instagram_password: igPwd || null,
        facebook_login: fbLogin.trim() || null,
        facebook_password: fbPwd || null,
        whatsapp_number: whats.replace(/\D/g, "") || null,
      };
      if (niche === "saude") payload.google_my_business = gmb || null;

      if (profileId) {
        await supabase.from("client_profile").update(payload).eq("id", profileId);
      } else {
        await supabase.from("client_profile").insert({ client_id: clientId, ...payload });
      }
      toast({ title: "Dados de mercado salvos" });
      onNext();
    } catch (e) {
      console.error(e);
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Card><CardContent className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Como você vende hoje</CardTitle>
        <CardDescription>Situação atual, concorrentes e acessos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground">Situação atual</div>
          {fields.map((f) => (
            <div key={f.key} className="space-y-2">
              <Label>{f.label}</Label>
              {f.type === "select" && (
                <Select value={marketData[f.key] || ""} onValueChange={(v) => setMarketData((p) => ({ ...p, [f.key]: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{f.options!.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
                </Select>
              )}
              {f.type === "checkbox" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {f.options!.map((o) => (
                    <div key={o.v} className="flex items-center gap-2">
                      <Checkbox
                        id={`${f.key}_${o.v}`}
                        checked={(marketData[f.key] || []).includes(o.v)}
                        onCheckedChange={(c) => toggleCheckbox(f.key, o.v, c as boolean)}
                      />
                      <label htmlFor={`${f.key}_${o.v}`} className="text-sm">{o.l}</label>
                    </div>
                  ))}
                </div>
              )}
              {f.type === "number" && (
                <Input type="number" value={marketData[f.key] || ""} onChange={(e) => setMarketData((p) => ({ ...p, [f.key]: e.target.value }))} />
              )}
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground">Concorrentes e referências</div>
          {([
            ["Concorrente local 1", comp1, setComp1],
            ["Concorrente local 2", comp2, setComp2],
            ["Referência / inspiração", reference, setReference],
          ] as const).map(([label, val, setter]) => (
            <div key={label} className="grid gap-2 sm:grid-cols-2 p-3 border rounded-md">
              <div className="space-y-1">
                <Label className="text-xs">{label} — nome</Label>
                <Input value={val.name} onChange={(e) => setter({ ...val, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Por que é {label.includes("Referência") ? "referência" : "concorrente"}?</Label>
                <Input value={val.reason} onChange={(e) => setter({ ...val, reason: e.target.value })} />
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">🔐 Acessos (mascarados — LGPD)</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="flex items-center gap-1 text-xs"><Instagram className="h-3 w-3" /> Instagram — link</Label>
              <Input value={igLink} onChange={(e) => setIgLink(e.target.value)} placeholder="https://instagram.com/..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Instagram — login</Label>
              <Input value={igLogin} onChange={(e) => setIgLogin(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Instagram — senha</Label>
              <div className="flex gap-2">
                <Input type={showIgPwd ? "text" : "password"} value={igPwd} onChange={(e) => setIgPwd(e.target.value)} />
                <Button type="button" variant="outline" size="icon" onClick={() => setShowIgPwd((p) => !p)}>
                  {showIgPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="flex items-center gap-1 text-xs"><Facebook className="h-3 w-3" /> Facebook — login</Label>
              <Input value={fbLogin} onChange={(e) => setFbLogin(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Facebook — senha</Label>
              <div className="flex gap-2">
                <Input type={showFbPwd ? "text" : "password"} value={fbPwd} onChange={(e) => setFbPwd(e.target.value)} />
                <Button type="button" variant="outline" size="icon" onClick={() => setShowFbPwd((p) => !p)}>
                  {showFbPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">WhatsApp Business — número</Label>
              <Input value={whats} onChange={(e) => setWhats(maskPhone(e.target.value))} placeholder="(00) 00000-0000" />
            </div>
          </div>

          {niche === "saude" && (
            <div className="space-y-2 p-3 border rounded-md">
              <Label className="text-sm">Google Meu Negócio — está cadastrado?</Label>
              <RadioGroup value={gmb} onValueChange={setGmb} className="flex gap-4">
                <div className="flex items-center gap-2"><RadioGroupItem value="sim" id="gmb_sim" /><label htmlFor="gmb_sim" className="text-sm">Sim</label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="nao" id="gmb_nao" /><label htmlFor="gmb_nao" className="text-sm">Não</label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="nao_sei" id="gmb_ns" /><label htmlFor="gmb_ns" className="text-sm">Não sei</label></div>
              </RadioGroup>
            </div>
          )}
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
