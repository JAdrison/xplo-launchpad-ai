import { useEffect, useState } from "react";
import { useRealtimeReload } from "@/hooks/useRealtimeReload";
import { usePDF, Margin } from "react-to-pdf";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Target,
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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAIConfig } from "@/lib/aiConfig";
import { ICPPDFTemplate } from "@/components/export/ICPPDFTemplate";
import { SendToDriveButton } from "@/components/drive/SendToDriveButton";
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

interface ICPDocumentCardProps {
  clientId: string;
  clientName: string;
}

interface ICPDoc {
  id: string;
  name: string;
  generated_icp_text: string | null;
  generated_at: string | null;
  sort_order: number;
}

function PDFTarget({
  doc,
  clientName,
  onReady,
  onBuildReady,
}: {
  doc: ICPDoc;
  clientName: string;
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
    filename: `icp-${sanitized}-${dateStr}.pdf`,
    page: { margin: Margin.MEDIUM, format: "A4", orientation: "portrait" },
  });

  useEffect(() => {
    onReady(() => toPDF());
    onBuildReady?.(() => Promise.resolve(toPDF({ method: "build" } as any)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={targetRef} style={{ position: "absolute", left: "-9999px", top: 0 }}>
      <ICPPDFTemplate
        clientName={`${clientName} — ${doc.name}`}
        createdAt={doc.generated_at || new Date().toISOString()}
        text={doc.generated_icp_text || ""}
      />
    </div>
  );
}

export function ICPDocumentCard({ clientId, clientName }: ICPDocumentCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [docs, setDocs] = useState<ICPDoc[]>([]);
  const [generatingId, setGeneratingId] = useState<string | "new" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editName, setEditName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Dialog de novo ICP
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHint, setNewHint] = useState("");

  // PDF triggers por doc
  const [pdfTriggers, setPdfTriggers] = useState<Record<string, () => void>>({});

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useRealtimeReload(
    ["client_icp_documents", "client_icp"],
    () => { void load(); },
    { clientId }
  );

  const load = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("client_icp_documents")
      .select("id, name, generated_icp_text, generated_at, sort_order")
      .eq("client_id", clientId)
      .order("sort_order", { ascending: true });
    let list = (data as ICPDoc[]) || [];

    // Migração silenciosa: se não houver docs mas houver legacy em client_icp, importa
    if (list.length === 0) {
      const { data: legacy } = await supabase
        .from("client_icp")
        .select("generated_icp_text, generated_at")
        .eq("client_id", clientId)
        .maybeSingle();
      if (legacy?.generated_icp_text) {
        const { data: created } = await supabase
          .from("client_icp_documents")
          .insert({
            client_id: clientId,
            name: "ICP Principal",
            generated_icp_text: legacy.generated_icp_text,
            generated_by_ai: true,
            generated_at: legacy.generated_at,
            sort_order: 0,
          })
          .select("id, name, generated_icp_text, generated_at, sort_order")
          .maybeSingle();
        if (created) list = [created as ICPDoc];
      }
    }

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
      body: { type: "generate-icp-document", clientId, aiConfig, ...params },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
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
      toast.success("Novo ICP gerado!");
    } catch (e: any) {
      handleError(e);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleRegenerate = async (doc: ICPDoc) => {
    setGeneratingId(doc.id);
    try {
      await callGenerate({
        documentId: doc.id,
        documentName: doc.name,
      });
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
    const msg = e?.message || "Erro ao gerar ICP";
    if (msg.includes("Rate limit") || msg.includes("429")) {
      toast.error("Limite de requisições atingido. Aguarde um instante.");
    } else if (msg.includes("Payment") || msg.includes("402")) {
      toast.error("Créditos esgotados. Adicione fundos no workspace.");
    } else {
      toast.error(msg);
    }
  };

  const handleStartEdit = (doc: ICPDoc) => {
    setEditingId(doc.id);
    setEditText(doc.generated_icp_text || "");
    setEditName(doc.name);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from("client_icp_documents")
      .update({ generated_icp_text: editText, name: editName.trim() || "ICP" })
      .eq("id", editingId);
    if (error) {
      toast.error("Erro ao salvar edição");
      return;
    }
    setEditingId(null);
    await load();
    toast.success("ICP atualizado");
  };

  const handleCopy = async (doc: ICPDoc) => {
    await navigator.clipboard.writeText(doc.generated_icp_text || "");
    toast.success("Copiado para a área de transferência");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase
      .from("client_icp_documents")
      .delete()
      .eq("id", deleteId);
    setDeleteId(null);
    if (error) {
      toast.error("Erro ao remover ICP");
      return;
    }
    await load();
    toast.success("ICP removido");
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                ICPs — Clientes Ideais
              </CardTitle>
              <CardDescription>
                Documentos estratégicos do perfil de cliente ideal. Você pode ter vários ICPs por cliente.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasDocs && (
                <Badge variant="secondary" className="text-xs">
                  {docs.length} {docs.length === 1 ? "ICP" : "ICPs"}
                </Badge>
              )}
              <Button
                size="sm"
                variant={hasDocs ? "outline" : "default"}
                className="gap-2"
                onClick={() => {
                  setNewName(hasDocs ? `ICP ${docs.length + 1}` : "ICP Principal");
                  setNewHint("");
                  setIsAddOpen(true);
                }}
                disabled={generatingId === "new"}
              >
                <Plus className="h-4 w-4" />
                Novo ICP
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasDocs && generatingId !== "new" && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <Target className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground max-w-md">
                Gere um documento detalhado do seu cliente ideal com base em todos os dados do onboarding.
              </p>
              <Button
                onClick={() => {
                  setNewName("ICP Principal");
                  setNewHint("");
                  setIsAddOpen(true);
                }}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Gerar primeiro ICP
              </Button>
            </div>
          )}

          {generatingId === "new" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3 rounded-lg border border-dashed">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Gerando novo ICP...</p>
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
                      <Label className="text-xs">Nome do ICP</Label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Ex: ICP Casais"
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
                        <Target className="h-4 w-4 text-primary shrink-0" />
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
                        {doc.generated_icp_text || (
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
                          disabled={!doc.generated_icp_text}
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

          {/* Hidden PDF render targets */}
          {docs.map((doc) =>
            doc.generated_icp_text ? (
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

      {/* Dialog: novo ICP */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar novo ICP</DialogTitle>
            <DialogDescription>
              Dê um nome para este ICP e, opcionalmente, descreva qual ângulo/segmento ele deve cobrir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome do ICP</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: ICP Casais, ICP Famílias, ICP Corporativo"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Foco / variação (opcional)</Label>
              <Textarea
                value={newHint}
                onChange={(e) => setNewHint(e.target.value)}
                placeholder="Ex: Foque em casais sem filhos que viajam em fins de semana fora de feriado."
                className="min-h-[80px]"
              />
              <p className="text-xs text-muted-foreground">
                Se vazio, a IA gera um ICP complementar diferente dos existentes.
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

      {/* Dialog: confirmar remoção */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover este ICP?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
