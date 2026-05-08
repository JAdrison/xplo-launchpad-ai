import { useEffect, useState } from "react";
import { useRealtimeReload } from "@/hooks/useRealtimeReload";
import { usePDF, Margin } from "react-to-pdf";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Megaphone,
  Sparkles,
  Loader2,
  Pencil,
  RefreshCw,
  Copy,
  FileDown,
  Check,
  X,
  Plus,
  Trash2,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAIConfig } from "@/lib/aiConfig";
import { TrafficPlanPDFTemplate } from "@/components/export/TrafficPlanPDFTemplate";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TrafficPlanCardProps {
  clientId: string;
  clientName: string;
}

interface PlanDoc {
  id: string;
  name: string;
  generated_text: string | null;
  generated_at: string | null;
  sort_order: number;
}

function PDFTarget({
  doc,
  clientName,
  onReady,
}: {
  doc: PlanDoc;
  clientName: string;
  onReady: (toPDF: () => void) => void;
}) {
  const sanitized = `${clientName}-${doc.name}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const dateStr = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
  const { toPDF, targetRef } = usePDF({
    filename: `plano-demanda-${sanitized}-${dateStr}.pdf`,
    page: { margin: Margin.MEDIUM, format: "A4", orientation: "portrait" },
  });

  useEffect(() => {
    onReady(() => toPDF());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={targetRef} style={{ position: "absolute", left: "-9999px", top: 0 }}>
      <TrafficPlanPDFTemplate
        clientName={`${clientName} — ${doc.name}`}
        createdAt={doc.generated_at || new Date().toISOString()}
        text={doc.generated_text || ""}
      />
    </div>
  );
}

export function TrafficPlanCard({ clientId, clientName }: TrafficPlanCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [docs, setDocs] = useState<PlanDoc[]>([]);
  const [hasIcp, setHasIcp] = useState(false);
  const [hasOffers, setHasOffers] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | "new" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editName, setEditName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHint, setNewHint] = useState("");

  const [regenDoc, setRegenDoc] = useState<PlanDoc | null>(null);
  const [regenInstruction, setRegenInstruction] = useState("");

  const [pdfTriggers, setPdfTriggers] = useState<Record<string, () => void>>({});

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useRealtimeReload(
    ["client_traffic_plan_documents", "client_offer_documents", "client_icp_documents", "client_icp"],
    () => { void load(); },
    { clientId }
  );

  const load = async () => {
    setIsLoading(true);
    const [docsRes, icpDocsRes, icpLegacyRes, offersRes] = await Promise.all([
      supabase
        .from("client_traffic_plan_documents")
        .select("id, name, generated_text, generated_at, sort_order")
        .eq("client_id", clientId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("client_icp_documents")
        .select("generated_icp_text")
        .eq("client_id", clientId)
        .limit(1),
      supabase
        .from("client_icp")
        .select("generated_icp_text")
        .eq("client_id", clientId)
        .maybeSingle(),
      supabase
        .from("client_offer_documents")
        .select("generated_text")
        .eq("client_id", clientId)
        .limit(1),
    ]);

    const list = ((docsRes.data as any[]) || []) as PlanDoc[];
    const icpFromDocs = (icpDocsRes.data || []).some((d: any) => d?.generated_icp_text);
    const icpFromLegacy = !!icpLegacyRes.data?.generated_icp_text;
    const offersFound = (offersRes.data || []).some((d: any) => d?.generated_text);
    setHasIcp(icpFromDocs || icpFromLegacy);
    setHasOffers(offersFound);
    setDocs(list);
    setIsLoading(false);
  };

  const callGenerate = async (params: {
    documentId?: string;
    documentName?: string;
    userInstruction?: string;
  }) => {
    const aiConfig = getAIConfig();
    const { data, error } = await supabase.functions.invoke("generate-content", {
      body: { type: "generate-traffic-plan-document", clientId, aiConfig, ...params },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.message || data.error);
    return data as { text?: string; documentId?: string };
  };

  const handleError = (e: any) => {
    console.error(e);
    const msg = e?.message || "Erro ao gerar plano de demanda";
    if (msg.includes("ICP_REQUIRED")) {
      toast.error("Gere primeiro o ICP.");
    } else if (msg.includes("OFFERS_REQUIRED")) {
      toast.error("Gere primeiro o Banco de Ofertas.");
    } else if (msg.includes("Rate limit") || msg.includes("429")) {
      toast.error("Limite de requisições atingido. Aguarde um instante.");
    } else if (msg.includes("Payment") || msg.includes("402")) {
      toast.error("Créditos esgotados. Adicione fundos no workspace.");
    } else {
      toast.error(msg);
    }
  };

  const handleGenerateNew = async () => {
    setGeneratingId("new");
    setIsAddOpen(false);
    try {
      await callGenerate({
        documentName: newName.trim() || undefined,
        userInstruction: newHint.trim() || undefined,
      });
      setNewName("");
      setNewHint("");
      await load();
      toast.success("Plano de demanda gerado!");
    } catch (e: any) {
      handleError(e);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleRegenerate = async () => {
    if (!regenDoc) return;
    const doc = regenDoc;
    const instruction = regenInstruction;
    setRegenDoc(null);
    setRegenInstruction("");
    setGeneratingId(doc.id);
    try {
      await callGenerate({
        documentId: doc.id,
        documentName: doc.name,
        userInstruction: instruction.trim() || undefined,
      });
      await load();
      toast.success(`${doc.name} regenerado!`);
    } catch (e: any) {
      handleError(e);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleStartEdit = (doc: PlanDoc) => {
    setEditingId(doc.id);
    setEditText(doc.generated_text || "");
    setEditName(doc.name);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from("client_traffic_plan_documents")
      .update({ generated_text: editText, name: editName.trim() || "Plano de Demanda" })
      .eq("id", editingId);
    if (error) {
      toast.error("Erro ao salvar edição");
      return;
    }
    setEditingId(null);
    await load();
    toast.success("Plano atualizado");
  };

  const handleCopyDoc = async (doc: PlanDoc) => {
    await navigator.clipboard.writeText(doc.generated_text || "");
    toast.success("Copiado para a área de transferência");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase
      .from("client_traffic_plan_documents")
      .delete()
      .eq("id", deleteId);
    setDeleteId(null);
    if (error) {
      toast.error("Erro ao remover plano");
      return;
    }
    await load();
    toast.success("Plano removido");
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

  const hasDocs = docs.length > 0;
  const canGenerate = hasIcp && hasOffers;
  const lockReason = !hasIcp
    ? "Gere primeiro o ICP."
    : !hasOffers
    ? "Gere primeiro o Banco de Ofertas."
    : "";

  const NewButton = (
    <Button
      size="sm"
      variant={hasDocs ? "outline" : "default"}
      className="gap-2"
      onClick={() => {
        setNewName(hasDocs ? `Plano de Demanda ${docs.length + 1}` : "Plano de Demanda");
        setNewHint("");
        setIsAddOpen(true);
      }}
      disabled={generatingId === "new" || !canGenerate}
    >
      {canGenerate ? <Plus className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
      Novo Plano
    </Button>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Plano de Demanda
              </CardTitle>
              <CardDescription>
                Plano estratégico de tráfego com Meta Ads como motor principal e canais complementares.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasDocs && (
                <Badge variant="secondary" className="text-xs">
                  {docs.length} {docs.length === 1 ? "plano" : "planos"}
                </Badge>
              )}
              {canGenerate ? (
                NewButton
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>{NewButton}</span>
                    </TooltipTrigger>
                    <TooltipContent>{lockReason}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canGenerate && !hasDocs && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 rounded-lg border border-dashed">
              <Lock className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground max-w-md">
                {lockReason} O Plano de Demanda usa o ICP e o Banco de Ofertas como base estratégica.
              </p>
            </div>
          )}

          {canGenerate && !hasDocs && generatingId !== "new" && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <Megaphone className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground max-w-md">
                Gere um plano estratégico de tráfego pago com Meta Ads no centro e canais complementares.
              </p>
              <Button
                onClick={() => {
                  setNewName("Plano de Demanda");
                  setNewHint("");
                  setIsAddOpen(true);
                }}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Gerar primeiro plano
              </Button>
            </div>
          )}

          {generatingId === "new" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3 rounded-lg border border-dashed">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Montando seu plano estratégico...</p>
            </div>
          )}

          {docs.map((doc) => {
            const isEditing = editingId === doc.id;
            const isGenerating = generatingId === doc.id;
            return (
              <div key={doc.id} className="rounded-lg border bg-card overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-muted/30">
                  {isEditing ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 text-sm font-medium max-w-xs"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{doc.name}</span>
                      {doc.generated_at && (
                        <span className="text-xs text-muted-foreground">
                          · {new Date(doc.generated_at).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="h-8 gap-1">
                          <Check className="h-3.5 w-3.5" /> Salvar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 gap-1">
                          <X className="h-3.5 w-3.5" /> Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(doc)}
                          className="h-8 gap-1"
                          disabled={isGenerating}
                        >
                          <Pencil className="h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setRegenInstruction("");
                            setRegenDoc(doc);
                          }}
                          className="h-8 gap-1"
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                          Regenerar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopyDoc(doc)}
                          className="h-8 gap-1"
                        >
                          <Copy className="h-3.5 w-3.5" /> Copiar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => pdfTriggers[doc.id]?.()}
                          className="h-8 gap-1"
                        >
                          <FileDown className="h-3.5 w-3.5" /> PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteId(doc.id)}
                          className="h-8 gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  {isGenerating ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Regenerando plano...
                    </div>
                  ) : isEditing ? (
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="min-h-[400px] font-mono text-xs"
                    />
                  ) : (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                      {doc.generated_text || (
                        <span className="text-muted-foreground italic">
                          Documento sem conteúdo. Regenere ou edite.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <PDFTarget
                  doc={doc}
                  clientName={clientName}
                  onReady={(fn) => setPdfTriggers((prev) => ({ ...prev, [doc.id]: fn }))}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Diálogo: novo plano */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Plano de Demanda</DialogTitle>
            <DialogDescription>
              Defina um nome e, se quiser, uma instrução de variação para a IA.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="plan-name">Nome</Label>
              <Input
                id="plan-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Plano de Demanda"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-hint">Instrução de variação (opcional)</Label>
              <Textarea
                id="plan-hint"
                value={newHint}
                onChange={(e) => setNewHint(e.target.value)}
                placeholder="Ex: Foque em campanhas para fim de semana de baixa temporada."
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateNew} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Gerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo: regenerar */}
      <Dialog open={!!regenDoc} onOpenChange={(o) => !o && setRegenDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerar plano</DialogTitle>
            <DialogDescription>
              Descreva o que você quer alterar. Se deixar em branco, a IA gera uma versão livre.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={regenInstruction}
            onChange={(e) => setRegenInstruction(e.target.value)}
            placeholder="Ex: Reduza o budget para R$ 50/dia e foque em remarketing."
            className="min-h-[120px]"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRegenDoc(null)}>
              Cancelar
            </Button>
            <Button onClick={handleRegenerate} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Regenerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar delete */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover plano?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
