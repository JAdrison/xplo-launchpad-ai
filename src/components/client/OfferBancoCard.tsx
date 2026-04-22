import { useEffect, useState } from "react";
import { usePDF, Margin } from "react-to-pdf";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAIConfig } from "@/lib/aiConfig";
import { OfferBancoPDFTemplate } from "@/components/export/OfferBancoPDFTemplate";
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
}

function PDFTarget({
  doc,
  clientName,
  onReady,
}: {
  doc: OfferDoc;
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
    filename: `banco-ofertas-${sanitized}-${dateStr}.pdf`,
    page: { margin: Margin.MEDIUM, format: "A4", orientation: "portrait" },
  });

  useEffect(() => {
    onReady(() => toPDF());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={targetRef} style={{ position: "absolute", left: "-9999px", top: 0 }}>
      <OfferBancoPDFTemplate
        clientName={`${clientName} — ${doc.name}`}
        createdAt={doc.generated_at || new Date().toISOString()}
        text={doc.generated_text || ""}
      />
    </div>
  );
}

export function OfferBancoCard({ clientId, clientName }: OfferBancoCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [docs, setDocs] = useState<OfferDoc[]>([]);
  const [hasIcp, setHasIcp] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | "new" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editName, setEditName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHint, setNewHint] = useState("");

  const [pdfTriggers, setPdfTriggers] = useState<Record<string, () => void>>({});

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const load = async () => {
    setIsLoading(true);
    const [docsRes, icpDocsRes, icpLegacyRes] = await Promise.all([
      supabase
        .from("client_offer_documents")
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
    ]);

    const list = (docsRes.data as OfferDoc[]) || [];
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
  }) => {
    const aiConfig = getAIConfig();
    const { data, error } = await supabase.functions.invoke("generate-content", {
      body: { type: "generate-offers-document", clientId, aiConfig, ...params },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.message || data.error);
    return data as { text: string; documentId: string };
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

  const handleRegenerate = async (doc: OfferDoc) => {
    setGeneratingId(doc.id);
    try {
      await callGenerate({ documentId: doc.id, documentName: doc.name });
      await load();
      toast.success(`${doc.name} regenerado!`);
    } catch (e: any) {
      handleError(e);
    } finally {
      setGeneratingId(null);
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

  const handleCopy = async (doc: OfferDoc) => {
    await navigator.clipboard.writeText(doc.generated_text || "");
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

          {docs.map((doc) => {
            const isEditing = editingId === doc.id;
            const isGen = generatingId === doc.id;
            return (
              <div key={doc.id} className="rounded-lg border p-4 space-y-3">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nome do banco</Label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Ex: Banco Alta Temporada"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Conteúdo</Label>
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="min-h-[400px] font-mono text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveEdit} size="sm" className="gap-2">
                        <Check className="h-4 w-4" /> Salvar
                      </Button>
                      <Button
                        onClick={() => setEditingId(null)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
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
                      </div>
                      {doc.generated_at && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.generated_at).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>

                    {isGen ? (
                      <div className="flex items-center gap-2 py-6 justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Regenerando...</span>
                      </div>
                    ) : (
                      <div className="rounded-lg border bg-muted/30 p-4 whitespace-pre-wrap text-sm leading-relaxed max-h-[500px] overflow-y-auto">
                        {doc.generated_text || (
                          <span className="text-muted-foreground italic">Sem conteúdo</span>
                        )}
                      </div>
                    )}

                    {!isGen && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => handleStartEdit(doc)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Pencil className="h-4 w-4" /> Editar
                        </Button>
                        <Button
                          onClick={() => handleRegenerate(doc)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <RefreshCw className="h-4 w-4" /> Regenerar
                        </Button>
                        <Button
                          onClick={() => handleCopy(doc)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Copy className="h-4 w-4" /> Copiar
                        </Button>
                        <Button
                          onClick={() => pdfTriggers[doc.id]?.()}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={!doc.generated_text}
                        >
                          <FileDown className="h-4 w-4" /> PDF
                        </Button>
                        <Button
                          onClick={() => setDeleteId(doc.id)}
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-destructive hover:text-destructive ml-auto"
                        >
                          <Trash2 className="h-4 w-4" /> Remover
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {docs.map((doc) =>
            doc.generated_text ? (
              <PDFTarget
                key={doc.id}
                doc={doc}
                clientName={clientName}
                onReady={(trigger) =>
                  setPdfTriggers((prev) =>
                    prev[doc.id] === trigger ? prev : { ...prev, [doc.id]: trigger }
                  )
                }
              />
            ) : null
          )}
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
    </>
  );
}
