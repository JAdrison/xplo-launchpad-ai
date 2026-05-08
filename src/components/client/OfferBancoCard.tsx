import { useEffect, useMemo, useState } from "react";
import { useRealtimeReload } from "@/hooks/useRealtimeReload";
import { usePDF, Margin } from "react-to-pdf";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Tag,
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
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAIConfig } from "@/lib/aiConfig";
import { OfferBancoPDFTemplate } from "@/components/export/OfferBancoPDFTemplate";
import { SendToDriveButton } from "@/components/drive/SendToDriveButton";
import {
  parseOfferBank,
  serializeOfferBank,
  replaceOfferBlock,
  getOfferState,
  type OfferStatesMap,
} from "@/lib/offerParser";
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

interface OfferBancoCardProps {
  clientId: string;
  clientName: string;
}

interface OfferDoc {
  id: string;
  name: string;
  generated_text: string | null;
  generated_at: string | null;
  sort_order: number;
  offer_states: OfferStatesMap | null;
}

function PDFTarget({
  doc,
  clientName,
  exportText,
  onReady,
  onBuildReady,
}: {
  doc: OfferDoc;
  clientName: string;
  exportText: string;
  onReady: (toPDF: () => void) => void;
  onBuildReady?: (build: () => Promise<any>) => void;
}) {
  const sanitized = `${clientName}-${doc.name}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const dateStr = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
  const { toPDF, targetRef } = usePDF({
    filename: `banco-ofertas-${sanitized}-${dateStr}.pdf`,
    page: { margin: Margin.MEDIUM, format: "A4", orientation: "portrait" },
  });

  useEffect(() => {
    onReady(() => toPDF());
    onBuildReady?.(() => Promise.resolve(toPDF({ method: "build" } as any)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={targetRef} style={{ position: "absolute", left: "-9999px", top: 0 }}>
      <OfferBancoPDFTemplate
        clientName={`${clientName} — ${doc.name}`}
        createdAt={doc.generated_at || new Date().toISOString()}
        text={exportText}
      />
    </div>
  );
}

export function OfferBancoCard({ clientId, clientName }: OfferBancoCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [docs, setDocs] = useState<OfferDoc[]>([]);
  const [hasIcp, setHasIcp] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | "new" | null>(null);
  const [regeneratingOfferKey, setRegeneratingOfferKey] = useState<string | null>(null); // `${docId}:${offerId}`
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editName, setEditName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOfferKey, setDeleteOfferKey] = useState<string | null>(null); // `${docId}:${offerId}`

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHint, setNewHint] = useState("");

  // Diálogo único para coletar instrução em qualquer regeneração
  const [regenDialog, setRegenDialog] = useState<
    | { kind: "all"; docId: string; docName: string }
    | { kind: "single"; docId: string; offerId: string; offerName: string }
    | null
  >(null);
  const [regenInstruction, setRegenInstruction] = useState("");

  const [pdfTriggers, setPdfTriggers] = useState<Record<string, () => void>>({});
  const [pdfBuilders, setPdfBuilders] = useState<Record<string, () => Promise<any>>>({});

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useRealtimeReload(
    ["client_offer_documents", "client_icp_documents", "client_icp"],
    () => { void load(); },
    { clientId }
  );

  const load = async () => {
    setIsLoading(true);
    const [docsRes, icpDocsRes, icpLegacyRes] = await Promise.all([
      supabase
        .from("client_offer_documents")
        .select("id, name, generated_text, generated_at, sort_order, offer_states")
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
    ]);

    const list = ((docsRes.data as any[]) || []).map((d) => ({
      ...d,
      offer_states: (d.offer_states as OfferStatesMap | null) || {},
    })) as OfferDoc[];
    const icpFromDocs = (icpDocsRes.data || []).some((d: any) => d?.generated_icp_text);
    const icpFromLegacy = !!icpLegacyRes.data?.generated_icp_text;
    setHasIcp(icpFromDocs || icpFromLegacy);
    setDocs(list);
    setIsLoading(false);
  };

  const callGenerate = async (params: {
    documentId?: string;
    documentName?: string;
    variationHint?: string;
    regenerateOfferId?: string;
    userInstruction?: string;
    offerContext?: { partLabel: string; offerNumber: number; currentText: string; existingFullText: string };
  }) => {
    const aiConfig = getAIConfig();
    const { data, error } = await supabase.functions.invoke("generate-content", {
      body: { type: "generate-offers-document", clientId, aiConfig, ...params },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.message || data.error);
    return data as { text?: string; documentId?: string; offerBlock?: string; offerId?: string };
  };

  const handleGenerateNew = async () => {
    setGeneratingId("new");
    setIsAddOpen(false);
    try {
      await callGenerate({
        documentName: newName.trim() || undefined,
        variationHint: newHint.trim() || undefined,
      });
      setNewName("");
      setNewHint("");
      await load();
      toast.success("Banco de ofertas gerado!");
    } catch (e: any) {
      handleError(e);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleRegenerateAll = async (doc: OfferDoc, instruction: string) => {
    setGeneratingId(doc.id);
    try {
      await callGenerate({
        documentId: doc.id,
        documentName: doc.name,
        variationHint: instruction.trim() || undefined,
      });
      await load();
      toast.success(`${doc.name} regenerado!`);
    } catch (e: any) {
      handleError(e);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleRegenerateSingle = async (doc: OfferDoc, offerId: string, instruction: string) => {
    const parsed = parseOfferBank(doc.generated_text || "");
    const offer = parsed.offers.find((o) => o.id === offerId);
    if (!offer) {
      toast.error("Oferta não encontrada para regeneração");
      return;
    }
    const key = `${doc.id}:${offerId}`;
    setRegeneratingOfferKey(key);
    try {
      const res = await callGenerate({
        documentId: doc.id,
        regenerateOfferId: offerId,
        userInstruction: instruction.trim() || undefined,
        offerContext: {
          partLabel: offer.partLabel,
          offerNumber: offer.offerNumber,
          currentText: offer.rawText,
          existingFullText: doc.generated_text || "",
        },
      });
      if (!res.offerBlock) throw new Error("IA não retornou o bloco da oferta");

      const newFullText = replaceOfferBlock(parsed, offerId, res.offerBlock, doc.offer_states);
      const { error } = await supabase
        .from("client_offer_documents")
        .update({ generated_text: newFullText, generated_at: new Date().toISOString() })
        .eq("id", doc.id);
      if (error) throw error;

      await load();
      toast.success("Oferta regenerada!");
    } catch (e: any) {
      handleError(e);
    } finally {
      setRegeneratingOfferKey(null);
    }
  };

  const handleError = (e: any) => {
    console.error(e);
    const msg = e?.message || "Erro ao gerar banco de ofertas";
    if (msg.includes("ICP_REQUIRED") || msg.includes("personalizada")) {
      toast.error("Gere primeiro o ICP — a oferta é personalizada por ele.");
    } else if (msg.includes("Rate limit") || msg.includes("429")) {
      toast.error("Limite de requisições atingido. Aguarde um instante.");
    } else if (msg.includes("Payment") || msg.includes("402")) {
      toast.error("Créditos esgotados. Adicione fundos no workspace.");
    } else {
      toast.error(msg);
    }
  };

  const handleStartEdit = (doc: OfferDoc) => {
    setEditingId(doc.id);
    setEditText(doc.generated_text || "");
    setEditName(doc.name);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from("client_offer_documents")
      .update({ generated_text: editText, name: editName.trim() || "Banco de Ofertas" })
      .eq("id", editingId);
    if (error) {
      toast.error("Erro ao salvar edição");
      return;
    }
    setEditingId(null);
    await load();
    toast.success("Banco atualizado");
  };

  const updateOfferStates = async (doc: OfferDoc, next: OfferStatesMap) => {
    // otimista
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, offer_states: next } : d)));
    const { error } = await supabase
      .from("client_offer_documents")
      .update({ offer_states: next as any })
      .eq("id", doc.id);
    if (error) {
      // reverte
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, offer_states: doc.offer_states } : d)));
      toast.error("Erro ao salvar mudança");
    }
  };

  const toggleEnabled = (doc: OfferDoc, offerId: string, enabled: boolean) => {
    const cur = doc.offer_states || {};
    const next: OfferStatesMap = {
      ...cur,
      [offerId]: { ...(cur[offerId] || {}), enabled },
    };
    void updateOfferStates(doc, next);
  };

  const setDeleted = (doc: OfferDoc, offerId: string, deleted: boolean) => {
    const cur = doc.offer_states || {};
    const next: OfferStatesMap = {
      ...cur,
      [offerId]: { ...(cur[offerId] || {}), deleted },
    };
    void updateOfferStates(doc, next);
  };

  const handleCopyDoc = async (doc: OfferDoc) => {
    const parsed = parseOfferBank(doc.generated_text || "");
    const text = serializeOfferBank({ ...parsed, footer: "" }, doc.offer_states, { skipDisabled: true });
    await navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase
      .from("client_offer_documents")
      .delete()
      .eq("id", deleteId);
    setDeleteId(null);
    if (error) {
      toast.error("Erro ao remover banco");
      return;
    }
    await load();
    toast.success("Banco removido");
  };

  const confirmDeleteOffer = () => {
    if (!deleteOfferKey) return;
    const [docId, offerId] = deleteOfferKey.split(":");
    const doc = docs.find((d) => d.id === docId);
    if (doc) setDeleted(doc, offerId, true);
    setDeleteOfferKey(null);
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
  const canGenerate = hasIcp;

  const NewButton = (
    <Button
      size="sm"
      variant={hasDocs ? "outline" : "default"}
      className="gap-2"
      onClick={() => {
        setNewName(hasDocs ? `Banco de Ofertas ${docs.length + 1}` : "Banco de Ofertas");
        setNewHint("");
        setIsAddOpen(true);
      }}
      disabled={generatingId === "new" || !canGenerate}
    >
      {canGenerate ? <Plus className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
      Novo Banco
    </Button>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Oferta — Banco de Ofertas
              </CardTitle>
              <CardDescription>
                6 ofertas estratégicas (3 de entrada + 3 de continuidade), personalizadas pelo ICP.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasDocs && (
                <Badge variant="secondary" className="text-xs">
                  {docs.length} {docs.length === 1 ? "banco" : "bancos"}
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
                    <TooltipContent>
                      Gere primeiro o ICP — a oferta é personalizada por ele.
                    </TooltipContent>
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
                Para gerar o Banco de Ofertas, primeiro gere ao menos um ICP.
                A oferta é construída em cima do perfil do cliente ideal.
              </p>
            </div>
          )}

          {canGenerate && !hasDocs && generatingId !== "new" && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <Tag className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground max-w-md">
                Gere um banco de ofertas estratégicas com base no ICP, SWOT e dados do mercado.
              </p>
              <Button
                onClick={() => {
                  setNewName("Banco de Ofertas");
                  setNewHint("");
                  setIsAddOpen(true);
                }}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Gerar primeiro banco
              </Button>
            </div>
          )}

          {generatingId === "new" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3 rounded-lg border border-dashed">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Montando seu banco de ofertas...</p>
            </div>
          )}

          {docs.map((doc) => (
            <OfferDocBlock
              key={doc.id}
              doc={doc}
              isEditing={editingId === doc.id}
              editText={editText}
              editName={editName}
              onChangeEditText={setEditText}
              onChangeEditName={setEditName}
              onStartEdit={() => handleStartEdit(doc)}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={() => setEditingId(null)}
              isGenerating={generatingId === doc.id}
              onRegenerateAll={() => {
                setRegenInstruction("");
                setRegenDialog({ kind: "all", docId: doc.id, docName: doc.name });
              }}
              onCopy={() => handleCopyDoc(doc)}
              onPDF={() => pdfTriggers[doc.id]?.()}
              driveSlot={
                doc.generated_text && pdfBuilders[doc.id] ? (
                  <SendToDriveButton
                    buildPdf={pdfBuilders[doc.id]}
                    clientId={clientId}
                    fileName={`Banco de Ofertas - ${doc.name}.pdf`}
                    variant="outline"
                  />
                ) : undefined
              }
              onDeleteDoc={() => setDeleteId(doc.id)}
              onToggleEnabled={(offerId, enabled) => toggleEnabled(doc, offerId, enabled)}
              onRequestDeleteOffer={(offerId) => setDeleteOfferKey(`${doc.id}:${offerId}`)}
              onRestoreOffer={(offerId) => setDeleted(doc, offerId, false)}
              onRegenerateSingle={(offerId, offerName) => {
                setRegenInstruction("");
                setRegenDialog({ kind: "single", docId: doc.id, offerId, offerName });
              }}
              regeneratingOfferId={
                regeneratingOfferKey?.startsWith(`${doc.id}:`)
                  ? regeneratingOfferKey.split(":")[1]
                  : null
              }
            />
          ))}

          {docs.map((doc) => {
            if (!doc.generated_text) return null;
            const parsed = parseOfferBank(doc.generated_text);
            const exportText = serializeOfferBank({ ...parsed, footer: "" }, doc.offer_states, { skipDisabled: true });
            return (
              <PDFTarget
                key={doc.id}
                doc={doc}
                clientName={clientName}
                exportText={exportText}
                onReady={(trigger) =>
                  setPdfTriggers((prev) =>
                    prev[doc.id] === trigger ? prev : { ...prev, [doc.id]: trigger }
                  )
                }
                onBuildReady={(builder) =>
                  setPdfBuilders((prev) =>
                    prev[doc.id] === builder ? prev : { ...prev, [doc.id]: builder }
                  )
                }
              />
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar novo banco de ofertas</DialogTitle>
            <DialogDescription>
              Dê um nome para este banco e, opcionalmente, descreva qual ângulo/ocasião ele deve cobrir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome do banco</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Banco Alta Temporada, Banco Black Friday"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Foco / variação (opcional)</Label>
              <Textarea
                value={newHint}
                onChange={(e) => setNewHint(e.target.value)}
                placeholder="Ex: Foco em famílias durante férias escolares de julho."
                className="min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground">
                Se vazio, a IA gera um banco complementar diferente dos existentes.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateNew} className="gap-2">
              <Sparkles className="h-4 w-4" /> Gerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover banco de ofertas?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O banco será removido permanentemente.
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

      <AlertDialog open={!!deleteOfferKey} onOpenChange={(open) => !open && setDeleteOfferKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta oferta?</AlertDialogTitle>
            <AlertDialogDescription>
              A oferta ficará oculta do PDF e da cópia, mas continua salva no banco e pode ser restaurada a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteOffer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!regenDialog}
        onOpenChange={(open) => {
          if (!open) {
            setRegenDialog(null);
            setRegenInstruction("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {regenDialog?.kind === "single"
                ? `Regenerar oferta: ${regenDialog.offerName}`
                : `Regenerar banco completo${regenDialog?.kind === "all" ? `: ${regenDialog.docName}` : ""}`}
            </DialogTitle>
            <DialogDescription>
              Descreva o que você quer mudar nesta regeneração. Deixe em branco para a IA decidir um novo ângulo automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label className="text-xs">Instrução para a IA (opcional)</Label>
            <Textarea
              value={regenInstruction}
              onChange={(e) => setRegenInstruction(e.target.value)}
              placeholder={
                regenDialog?.kind === "single"
                  ? "Ex: deixar mais agressiva, focar em casais sem filhos, trocar a escassez por bônus surpresa..."
                  : "Ex: tom mais consultivo, focar em alta temporada, trocar promessa principal..."
              }
              className="min-h-[100px]"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRegenDialog(null);
                setRegenInstruction("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!regenDialog) return;
                const instruction = regenInstruction;
                const dialog = regenDialog;
                setRegenDialog(null);
                setRegenInstruction("");
                if (dialog.kind === "all") {
                  const doc = docs.find((d) => d.id === dialog.docId);
                  if (doc) void handleRegenerateAll(doc, instruction);
                } else {
                  const doc = docs.find((d) => d.id === dialog.docId);
                  if (doc) void handleRegenerateSingle(doc, dialog.offerId, instruction);
                }
              }}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" /> Regenerar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================
// Sub-componente: render de um único documento de banco
// ============================================================
interface OfferDocBlockProps {
  doc: OfferDoc;
  isEditing: boolean;
  editText: string;
  editName: string;
  onChangeEditText: (v: string) => void;
  onChangeEditName: (v: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  isGenerating: boolean;
  onRegenerateAll: () => void;
  onCopy: () => void;
  onPDF: () => void;
  driveSlot?: React.ReactNode;
  onDeleteDoc: () => void;
  onToggleEnabled: (offerId: string, enabled: boolean) => void;
  onRequestDeleteOffer: (offerId: string) => void;
  onRestoreOffer: (offerId: string) => void;
  onRegenerateSingle: (offerId: string, offerName: string) => void;
  regeneratingOfferId: string | null;
}

function OfferDocBlock(props: OfferDocBlockProps) {
  const {
    doc,
    isEditing,
    editText,
    editName,
    onChangeEditText,
    onChangeEditName,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    isGenerating,
    onRegenerateAll,
    onCopy,
    onPDF,
    driveSlot,
    onDeleteDoc,
    onToggleEnabled,
    onRequestDeleteOffer,
    onRestoreOffer,
    onRegenerateSingle,
    regeneratingOfferId,
  } = props;

  const parsed = useMemo(
    () => parseOfferBank(doc.generated_text || ""),
    [doc.generated_text]
  );

  const activeOffers = parsed.offers.filter((o) => !getOfferState(doc.offer_states, o.id).deleted);
  const deletedOffers = parsed.offers.filter((o) => getOfferState(doc.offer_states, o.id).deleted);

  return (
    <div className="rounded-lg border p-4 space-y-3">
      {isEditing ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Nome do banco</Label>
            <Input
              value={editName}
              onChange={(e) => onChangeEditName(e.target.value)}
              placeholder="Ex: Banco Alta Temporada"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Conteúdo</Label>
            <Textarea
              value={editText}
              onChange={(e) => onChangeEditText(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={onSaveEdit} size="sm" className="gap-2">
              <Check className="h-4 w-4" /> Salvar
            </Button>
            <Button onClick={onCancelEdit} variant="outline" size="sm" className="gap-2">
              <X className="h-4 w-4" /> Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <Tag className="h-4 w-4 text-primary shrink-0" />
              <h4 className="font-semibold truncate">{doc.name}</h4>
              {parsed.offers.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {activeOffers.filter((o) => getOfferState(doc.offer_states, o.id).enabled).length}/
                  {parsed.offers.length} ativas
                </Badge>
              )}
            </div>
            {doc.generated_at && (
              <span className="text-xs text-muted-foreground">
                {new Date(doc.generated_at).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>

          {isGenerating ? (
            <div className="flex items-center gap-2 py-6 justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Regenerando banco completo...</span>
            </div>
          ) : (
            <>
              {parsed.isFallback ? (
                <div className="rounded-lg border bg-muted/30 p-4 whitespace-pre-wrap text-sm leading-relaxed max-h-[500px] overflow-y-auto">
                  {doc.generated_text || (
                    <span className="text-muted-foreground italic">Sem conteúdo</span>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {parsed.header && (
                    <div className="rounded-lg border bg-muted/20 p-3 whitespace-pre-wrap text-sm leading-relaxed">
                      {parsed.header}
                    </div>
                  )}

                  {activeOffers.map((offer) => {
                    const st = getOfferState(doc.offer_states, offer.id);
                    const isRegen = regeneratingOfferId === offer.id;
                    return (
                      <div
                        key={offer.id}
                        className={`rounded-lg border p-3 space-y-2 transition-opacity ${
                          st.enabled ? "" : "opacity-50 bg-muted/10"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge variant="secondary" className="text-xs shrink-0">
                              #{offer.offerNumber}
                            </Badge>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {offer.partLabel}
                            </Badge>
                            <span className="font-medium text-sm truncate">{offer.name}</span>
                            {!st.enabled && (
                              <Badge variant="destructive" className="text-xs shrink-0">
                                Desativada
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <Switch
                                checked={st.enabled}
                                onCheckedChange={(v) => onToggleEnabled(offer.id, v)}
                                disabled={isRegen}
                              />
                              <span className="text-xs text-muted-foreground">Ativa</span>
                            </div>
                          </div>
                        </div>

                        {isRegen ? (
                          <div className="flex items-center gap-2 py-4 justify-center">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-xs text-muted-foreground">Regenerando esta oferta...</span>
                          </div>
                        ) : (
                          <div className="rounded bg-muted/30 p-3 whitespace-pre-wrap text-sm leading-relaxed">
                            {offer.rawText}
                          </div>
                        )}

                        {!isRegen && (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => onRegenerateSingle(offer.id, offer.name)}
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              disabled={!!regeneratingOfferId}
                            >
                              <RefreshCw className="h-3.5 w-3.5" /> Regenerar
                            </Button>
                            <Button
                              onClick={() => onRequestDeleteOffer(offer.id)}
                              variant="ghost"
                              size="sm"
                              className="gap-2 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Excluir
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {deletedOffers.length > 0 && (
                    <div className="rounded-lg border border-dashed p-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Ofertas removidas ({deletedOffers.length}) — ocultas do PDF/cópia
                      </p>
                      <div className="space-y-2">
                        {deletedOffers.map((offer) => (
                          <div
                            key={offer.id}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <div className="flex items-center gap-2 min-w-0 opacity-60">
                              <Badge variant="outline" className="text-xs shrink-0">
                                #{offer.offerNumber}
                              </Badge>
                              <span className="truncate">{offer.name}</span>
                            </div>
                            <Button
                              onClick={() => onRestoreOffer(offer.id)}
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 h-7"
                            >
                              <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button onClick={onStartEdit} variant="outline" size="sm" className="gap-2">
                  <Pencil className="h-4 w-4" /> Editar texto
                </Button>
                <Button onClick={onRegenerateAll} variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Regenerar tudo
                </Button>
                <Button onClick={onCopy} variant="outline" size="sm" className="gap-2">
                  <Copy className="h-4 w-4" /> Copiar
                </Button>
                <Button
                  onClick={onPDF}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={!doc.generated_text}
                >
                  <FileDown className="h-4 w-4" /> PDF
                </Button>
                {driveSlot}
                <Button
                  onClick={onDeleteDoc}
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive ml-auto"
                >
                  <Trash2 className="h-4 w-4" /> Remover banco
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
