import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Key, Plus, Copy, Trash2, AlertTriangle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

// SHA-256 hex (browser)
async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function randomKey(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "").replace(/\//g, "").replace(/=/g, "");
  return `xplo_sk_${b64}`;
}

export function ApiKeysManager() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("api_keys")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Erro ao carregar chaves", description: error.message, variant: "destructive" });
    setKeys((data as ApiKey[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const raw = randomKey();
      const hash = await sha256Hex(raw);
      const prefix = raw.slice(0, 16);
      const { error } = await (supabase as any).from("api_keys").insert({
        user_id: user.id,
        name: newName.trim(),
        key_prefix: prefix,
        key_hash: hash,
        scopes: ["read", "write"],
      });
      if (error) throw error;
      setCreatedKey(raw);
      setNewName("");
      await load();
    } catch (e: any) {
      toast({ title: "Erro ao criar chave", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (id: string) => {
    if (!confirm("Revogar esta chave? Ela deixará de funcionar imediatamente.")) return;
    const { error } = await (supabase as any).from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Chave revogada" });
    load();
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Gere chaves para acessar a API REST e o servidor MCP do XPLO Starter.{" "}
              <Link to="/api-docs" className="text-primary hover:underline inline-flex items-center gap-1">
                Ver documentação <ExternalLink className="h-3 w-3" />
              </Link>
            </CardDescription>
          </div>
          <Button onClick={() => { setShowNewDialog(true); setCreatedKey(null); }} className="gap-2">
            <Plus className="h-4 w-4" /> Nova chave
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma chave criada ainda.</p>
        ) : (
          <div className="divide-y">
            {keys.map(k => (
              <div key={k.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{k.name}</span>
                    {k.revoked_at ? (
                      <Badge variant="destructive" className="text-xs">Revogada</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Ativa</Badge>
                    )}
                    {k.scopes.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono">
                    {k.key_prefix}…
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Criada {new Date(k.created_at).toLocaleDateString("pt-BR")} ·{" "}
                    {k.last_used_at ? `usada por último em ${new Date(k.last_used_at).toLocaleDateString("pt-BR")}` : "nunca usada"}
                  </div>
                </div>
                {!k.revoked_at && (
                  <Button variant="ghost" size="icon" onClick={() => revoke(k.id)} title="Revogar">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showNewDialog} onOpenChange={(o) => { setShowNewDialog(o); if (!o) setCreatedKey(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{createdKey ? "Chave criada com sucesso" : "Nova API Key"}</DialogTitle>
            <DialogDescription>
              {createdKey
                ? "Copie e guarde sua chave agora. Por segurança, ela não será mostrada novamente."
                : "Dê um nome descritivo para identificar esta chave (ex: \"n8n produção\", \"Claude MCP\")."}
            </DialogDescription>
          </DialogHeader>

          {createdKey ? (
            <div className="space-y-3">
              <div className="rounded border bg-muted p-3 font-mono text-xs break-all select-all">
                {createdKey}
              </div>
              <Button onClick={() => copy(createdKey)} className="w-full gap-2">
                <Copy className="h-4 w-4" /> Copiar chave
              </Button>
              <div className="flex items-start gap-2 rounded bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-900">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Nunca commit a chave em código público. Use apenas em backends, n8n, scripts ou MCP clients.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="key-name">Nome</Label>
                <Input id="key-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="n8n produção" />
              </div>
            </div>
          )}

          <DialogFooter>
            {createdKey ? (
              <Button onClick={() => { setShowNewDialog(false); setCreatedKey(null); }}>Fechar</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={creating}>{creating ? "Criando…" : "Criar chave"}</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
