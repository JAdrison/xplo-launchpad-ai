import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePipelines } from "@/hooks/useCrm";

type Tag = { id: string; name: string; color: string; pipeline_id: string | null };
type CustomField = { id: string; entity_type: "deal" | "client"; name: string; field_type: string; required: boolean };
type Template = { id: string; name: string; type: string; default_subject: string | null; default_description: string | null; default_duration_minutes: number | null };

export default function CrmConfig() {
  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações do CRM</h1>
        <p className="text-sm text-muted-foreground">Pipelines, tags, campos customizáveis e templates de atividade</p>
      </div>

      <Tabs defaultValue="pipelines">
        <TabsList>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="fields">Campos customizáveis</TabsTrigger>
          <TabsTrigger value="templates">Templates de atividade</TabsTrigger>
        </TabsList>

        <TabsContent value="pipelines" className="mt-4"><PipelinesTab /></TabsContent>
        <TabsContent value="tags" className="mt-4"><TagsTab /></TabsContent>
        <TabsContent value="fields" className="mt-4"><FieldsTab /></TabsContent>
        <TabsContent value="templates" className="mt-4"><TemplatesTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ======== PIPELINES ======== */
function PipelinesTab() {
  const { pipelines, refetch } = usePipelines();
  const [editing, setEditing] = useState<{ id?: string; name: string; description: string; color: string } | null>(null);

  const save = async () => {
    if (!editing?.name) return;
    if (editing.id) {
      const { error } = await supabase.from("pipelines").update({
        name: editing.name, description: editing.description, color: editing.color,
      }).eq("id", editing.id);
      if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      const { error } = await supabase.from("pipelines").insert({
        name: editing.name, description: editing.description, color: editing.color, sort_order: pipelines.length,
      });
      if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
    setEditing(null);
    refetch();
    toast({ title: "Pipeline salvo" });
  };

  const del = async (id: string) => {
    if (!confirm("Excluir pipeline e todas as colunas/negócios? Essa ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("pipelines").delete().eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    refetch();
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Pipelines ({pipelines.length})</CardTitle>
        <Button size="sm" onClick={() => setEditing({ name: "", description: "", color: "#8B5CF6" })}>
          <Plus className="mr-2 h-4 w-4" /> Novo pipeline
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {pipelines.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded" style={{ background: p.color }} />
              <div>
                <div className="font-medium">{p.name}</div>
                {p.description && <div className="text-xs text-muted-foreground">{p.description}</div>}
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => setEditing({ id: p.id, name: p.name, description: p.description ?? "", color: p.color })}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => del(p.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {pipelines.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nenhum pipeline. Crie o primeiro.</p>}
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Editar pipeline" : "Novo pipeline"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing!, name: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea value={editing?.description ?? ""} onChange={(e) => setEditing({ ...editing!, description: e.target.value })} /></div>
            <div><Label>Cor</Label><Input type="color" value={editing?.color ?? "#8B5CF6"} onChange={(e) => setEditing({ ...editing!, color: e.target.value })} className="h-10 w-20" /></div>
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ======== TAGS ======== */
function TagsTab() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [editing, setEditing] = useState<Partial<Tag> | null>(null);

  const fetch = async () => {
    const { data } = await supabase.from("tags").select("*").order("name");
    setTags((data ?? []) as Tag[]);
  };
  useEffect(() => { fetch(); }, []);

  const save = async () => {
    if (!editing?.name) return;
    const payload = { name: editing.name, color: editing.color || "#8B5CF6" };
    const op = editing.id
      ? supabase.from("tags").update(payload).eq("id", editing.id)
      : supabase.from("tags").insert(payload);
    const { error } = await op;
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    setEditing(null);
    fetch();
  };

  const del = async (id: string) => {
    if (!confirm("Excluir tag?")) return;
    await supabase.from("tags").delete().eq("id", id);
    fetch();
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Tags ({tags.length})</CardTitle>
        <Button size="sm" onClick={() => setEditing({ name: "", color: "#8B5CF6" })}><Plus className="mr-2 h-4 w-4" />Nova tag</Button>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <div key={t.id} className="flex items-center gap-2 rounded-full border px-3 py-1">
            <div className="h-3 w-3 rounded-full" style={{ background: t.color }} />
            <span className="text-sm">{t.name}</span>
            <button onClick={() => setEditing(t)} className="text-muted-foreground hover:text-foreground"><Pencil className="h-3 w-3" /></button>
            <button onClick={() => del(t.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
          </div>
        ))}
        {tags.length === 0 && <p className="text-sm text-muted-foreground py-4 w-full text-center">Nenhuma tag.</p>}
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Editar tag" : "Nova tag"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing!, name: e.target.value })} /></div>
            <div><Label>Cor</Label><Input type="color" value={editing?.color ?? "#8B5CF6"} onChange={(e) => setEditing({ ...editing!, color: e.target.value })} className="h-10 w-20" /></div>
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ======== CUSTOM FIELDS ======== */
function FieldsTab() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [editing, setEditing] = useState<Partial<CustomField> | null>(null);

  const fetch = async () => {
    const { data } = await supabase.from("custom_fields").select("*").order("sort_order");
    setFields((data ?? []) as CustomField[]);
  };
  useEffect(() => { fetch(); }, []);

  const save = async () => {
    if (!editing?.name || !editing.entity_type || !editing.field_type) return;
    const payload = {
      name: editing.name,
      entity_type: editing.entity_type as "deal" | "client",
      field_type: editing.field_type as any,
      required: !!editing.required,
    };
    const op = editing.id
      ? supabase.from("custom_fields").update(payload).eq("id", editing.id)
      : supabase.from("custom_fields").insert(payload);
    const { error } = await op;
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    setEditing(null);
    fetch();
  };

  const del = async (id: string) => {
    if (!confirm("Excluir campo?")) return;
    await supabase.from("custom_fields").delete().eq("id", id);
    fetch();
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Campos customizáveis ({fields.length})</CardTitle>
        <Button size="sm" onClick={() => setEditing({ name: "", entity_type: "deal", field_type: "text", required: false })}>
          <Plus className="mr-2 h-4 w-4" />Novo campo
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {fields.map((f) => (
          <div key={f.id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Badge variant="outline">{f.entity_type === "deal" ? "Negócio" : "Cliente"}</Badge>
              <span className="font-medium">{f.name}</span>
              <Badge variant="secondary">{f.field_type}</Badge>
              {f.required && <Badge variant="destructive">obrigatório</Badge>}
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => setEditing(f)}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => del(f.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        {fields.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nenhum campo customizado.</p>}
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Editar campo" : "Novo campo"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing!, name: e.target.value })} /></div>
            <div>
              <Label>Aplica-se a</Label>
              <Select value={editing?.entity_type} onValueChange={(v) => setEditing({ ...editing!, entity_type: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deal">Negócio</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={editing?.field_type} onValueChange={(v) => setEditing({ ...editing!, field_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="select">Seleção</SelectItem>
                  <SelectItem value="multi_select">Multi-seleção</SelectItem>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!editing?.required} onChange={(e) => setEditing({ ...editing!, required: e.target.checked })} />
              Campo obrigatório
            </label>
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ======== ACTIVITY TEMPLATES ======== */
function TemplatesTab() {
  const [items, setItems] = useState<Template[]>([]);
  const [editing, setEditing] = useState<Partial<Template> | null>(null);

  const fetch = async () => {
    const { data } = await supabase.from("activity_templates").select("*").order("name");
    setItems((data ?? []) as Template[]);
  };
  useEffect(() => { fetch(); }, []);

  const save = async () => {
    if (!editing?.name || !editing.type) return;
    const payload = {
      name: editing.name,
      type: editing.type as any,
      default_subject: editing.default_subject ?? null,
      default_description: editing.default_description ?? null,
      default_duration_minutes: editing.default_duration_minutes ?? null,
    };
    const op = editing.id
      ? supabase.from("activity_templates").update(payload).eq("id", editing.id)
      : supabase.from("activity_templates").insert(payload);
    const { error } = await op;
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    setEditing(null);
    fetch();
  };

  const del = async (id: string) => {
    if (!confirm("Excluir template?")) return;
    await supabase.from("activity_templates").delete().eq("id", id);
    fetch();
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Templates de atividade ({items.length})</CardTitle>
        <Button size="sm" onClick={() => setEditing({ name: "", type: "lembrete" })}><Plus className="mr-2 h-4 w-4" />Novo template</Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{t.name}</span>
                <Badge variant="secondary">{t.type}</Badge>
                {t.default_duration_minutes && <Badge variant="outline">{t.default_duration_minutes}min</Badge>}
              </div>
              {t.default_subject && <div className="text-xs text-muted-foreground mt-1">{t.default_subject}</div>}
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => setEditing(t)}><Pencil className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => del(t.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nenhum template.</p>}
      </CardContent>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Editar template" : "Novo template"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing!, name: e.target.value })} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={editing?.type} onValueChange={(v) => setEditing({ ...editing!, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lembrete">Lembrete</SelectItem>
                  <SelectItem value="mensagem">Mensagem</SelectItem>
                  <SelectItem value="ligacao">Ligação</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Assunto padrão</Label><Input value={editing?.default_subject ?? ""} onChange={(e) => setEditing({ ...editing!, default_subject: e.target.value })} /></div>
            <div><Label>Descrição padrão</Label><Textarea value={editing?.default_description ?? ""} onChange={(e) => setEditing({ ...editing!, default_description: e.target.value })} /></div>
            <div><Label>Duração (min)</Label><Input type="number" value={editing?.default_duration_minutes ?? ""} onChange={(e) => setEditing({ ...editing!, default_duration_minutes: e.target.value ? Number(e.target.value) : null })} /></div>
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
