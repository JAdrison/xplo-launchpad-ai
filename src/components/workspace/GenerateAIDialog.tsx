import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles, FileText, Video, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getAIConfig } from "@/lib/aiConfig";
import { parseOfferBank, getOfferState, type OfferStatesMap } from "@/lib/offerParser";

type GenerationType = "offer" | "ads";

interface BankOfferOption {
  key: string;
  documentId: string;
  documentName: string;
  offerId: string;
  offerName: string;
  partLabel: string;
  rawText: string;
}

interface Props {
  clientId: string | null;
  clientName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated?: () => void;
}

export function GenerateAIDialog({ clientId, clientName, open, onOpenChange, onGenerated }: Props) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [icps, setIcps] = useState<{ id: string; name: string }[]>([]);
  const [bankOptions, setBankOptions] = useState<BankOfferOption[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<Set<GenerationType>>(new Set(["offer"]));
  const [selectedIcpId, setSelectedIcpId] = useState<string | null>(null);
  const [selectedBankKey, setSelectedBankKey] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !clientId) return;
    setSelectedTypes(new Set(["offer"]));
    setSelectedIcpId(null);
    setSelectedBankKey(null);
    (async () => {
      setIsLoading(true);
      const [icpsRes, docsRes] = await Promise.all([
        supabase.from("icps").select("id, name").eq("client_id", clientId).order("sort_order"),
        supabase.from("client_offer_documents")
          .select("id, name, generated_text, offer_states")
          .eq("client_id", clientId).order("sort_order"),
      ]);
      setIcps(icpsRes.data ?? []);
      const opts: BankOfferOption[] = [];
      for (const doc of docsRes.data ?? []) {
        if (!doc.generated_text) continue;
        const parsed = parseOfferBank(doc.generated_text);
        const states = (doc.offer_states as OfferStatesMap) || {};
        for (const offer of parsed.offers) {
          const st = getOfferState(states, offer.id);
          if (!st.enabled || st.deleted) continue;
          opts.push({
            key: `${doc.id}::${offer.id}`,
            documentId: doc.id,
            documentName: doc.name,
            offerId: offer.id,
            offerName: offer.name,
            partLabel: offer.partLabel,
            rawText: offer.rawText,
          });
        }
      }
      setBankOptions(opts);
      setIsLoading(false);
    })();
  }, [open, clientId]);

  const toggleType = (t: GenerationType) => {
    const next = new Set(selectedTypes);
    if (next.has(t)) next.delete(t);
    else next.add(t);
    setSelectedTypes(next);
  };

  const handleGenerate = async () => {
    if (!clientId) return;
    if (selectedTypes.size === 0) {
      toast.error("Selecione pelo menos um tipo de geração");
      return;
    }
    if (selectedTypes.has("offer") && !selectedIcpId) {
      toast.error("Selecione um perfil de cliente para gerar a oferta");
      return;
    }
    if (selectedTypes.has("ads") && bankOptions.length > 0 && !selectedBankKey) {
      toast.error("Selecione uma oferta do Banco para gerar os anúncios");
      return;
    }

    setIsGenerating(true);
    try {
      const [profileRes, icpsRes, painsRes, promiseRes, clientRes] = await Promise.all([
        supabase.from("client_profile").select("*").eq("client_id", clientId).maybeSingle(),
        supabase.from("icps").select("*").eq("client_id", clientId).order("sort_order"),
        supabase.from("icp_pains").select("*, icps(name)").eq("icps.client_id", clientId),
        supabase.from("client_promise").select("*").eq("client_id", clientId).maybeSingle(),
        supabase.from("clients").select("niche, status").eq("id", clientId).maybeSingle(),
      ]);

      const filteredIcps = selectedIcpId
        ? (icpsRes.data || []).filter((i) => i.id === selectedIcpId)
        : icpsRes.data || [];
      const filteredPains = selectedIcpId
        ? (painsRes.data || []).filter((p) => p.icp_id === selectedIcpId)
        : painsRes.data || [];

      const onboardingData = {
        profile: profileRes.data,
        icps: filteredIcps,
        pains: filteredPains,
        promise: promiseRes.data,
        niche: clientRes.data?.niche || null,
      };

      const selectedBank = bankOptions.find((o) => o.key === selectedBankKey) || null;
      let anySuccess = false;

      for (const type of selectedTypes) {
        const aiConfig = getAIConfig();
        const body: Record<string, unknown> = { type, clientId, onboardingData, aiConfig };
        if (type === "offer") body.icpId = selectedIcpId;
        if (type === "ads" && selectedBank) {
          body.bankOfferText = selectedBank.rawText;
          body.bankOfferDocumentId = selectedBank.documentId;
          body.bankOfferId = selectedBank.offerId;
        }
        const { error } = await supabase.functions.invoke("generate-content", { body });
        if (error) {
          toast.error(`Erro ao gerar ${type === "offer" ? "oferta" : "anúncios"}`);
        } else {
          toast.success(`${type === "offer" ? "Oferta" : "Anúncios"} gerado(s) com sucesso!`);
          anySuccess = true;
        }
      }

      if (anySuccess) {
        if (clientRes.data?.status === "ppp_completed") {
          await supabase.from("clients").update({ status: "offer_generated" }).eq("id", clientId);
        }
        onGenerated?.();
        onOpenChange(false);
        navigate(`/clients/${clientId}`);
      }
    } catch (err) {
      console.error("Erro na geração:", err);
      toast.error("Erro durante a geração");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerar com IA
          </DialogTitle>
          <DialogDescription>
            {clientName ? `Cliente: ${clientName}` : "Escolha o que deseja gerar."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>O que gerar?</Label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/40">
                  <Checkbox
                    checked={selectedTypes.has("offer")}
                    onCheckedChange={() => toggleType("offer")}
                  />
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Oferta</span>
                </label>
                <label className="flex items-center gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/40">
                  <Checkbox
                    checked={selectedTypes.has("ads")}
                    onCheckedChange={() => toggleType("ads")}
                  />
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Anúncios</span>
                </label>
              </div>
            </div>

            {selectedTypes.has("offer") && (
              <div className="space-y-2">
                <Label>Perfil de cliente (ICP)</Label>
                {icps.length === 0 ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" /> Nenhum ICP cadastrado.
                  </p>
                ) : (
                  <Select value={selectedIcpId ?? ""} onValueChange={(v) => setSelectedIcpId(v || null)}>
                    <SelectTrigger><SelectValue placeholder="Selecione um ICP" /></SelectTrigger>
                    <SelectContent>
                      {icps.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {selectedTypes.has("ads") && bankOptions.length > 0 && (
              <div className="space-y-2">
                <Label>Oferta do banco (para anúncios)</Label>
                <Select value={selectedBankKey ?? ""} onValueChange={(v) => setSelectedBankKey(v || null)}>
                  <SelectTrigger><SelectValue placeholder="Selecione uma oferta" /></SelectTrigger>
                  <SelectContent>
                    {bankOptions.map((o) => (
                      <SelectItem key={o.key} value={o.key}>
                        {o.documentName} → {o.offerName} ({o.partLabel})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedTypes.has("ads") && bankOptions.length === 0 && (
              <p className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                Nenhuma oferta no banco — gere uma oferta primeiro.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancelar
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating || isLoading}>
            {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Gerar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
