import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, ExternalLink, Server } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const MCP_URL = "https://fsfspsydntutwftdihih.supabase.co/functions/v1/mcp";
const API_BASE = "https://fsfspsydntutwftdihih.supabase.co/functions/v1/api";

const claudeSnippet = `{
  "mcpServers": {
    "xplo-starter": {
      "url": "${MCP_URL}",
      "transport": { "type": "http" },
      "headers": { "Authorization": "Bearer xplo_sk_SUA_CHAVE_AQUI" }
    }
  }
}`;

export default function ApiDocs() {
  const { toast } = useToast();
  const swaggerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    document.title = "API Docs · XPLO Starter";
    // Inject Swagger UI CSS + JS once
    const cssId = "swagger-ui-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui.css";
      document.head.appendChild(link);
    }
    const jsId = "swagger-ui-bundle";
    const init = () => {
      // @ts-ignore
      if (!(window as any).SwaggerUIBundle || !swaggerRef.current) return;
      // @ts-ignore
      (window as any).SwaggerUIBundle({
        url: "/openapi.yaml",
        domNode: swaggerRef.current,
        deepLinking: true,
        layout: "BaseLayout",
        docExpansion: "list",
        defaultModelsExpandDepth: -1,
      });
      setLoaded(true);
    };
    if (!document.getElementById(jsId)) {
      const s = document.createElement("script");
      s.id = jsId;
      s.src = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui-bundle.js";
      s.onload = init;
      document.body.appendChild(s);
    } else {
      init();
    }
  }, []);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado!` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Documentação da API</h1>
        <p className="text-muted-foreground">Use a API REST e o servidor MCP para integrar o XPLO Starter com qualquer ferramenta.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" /> Servidor MCP
            <Badge variant="secondary">streamable-http</Badge>
          </CardTitle>
          <CardDescription>
            Conecte Claude Desktop, Cursor ou qualquer cliente MCP ao XPLO Starter.{" "}
            <Link to="/admin/settings" className="text-primary hover:underline inline-flex items-center gap-1">
              Crie sua API Key <ExternalLink className="h-3 w-3" />
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">URL do servidor</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded border bg-muted px-3 py-2 text-xs font-mono break-all">{MCP_URL}</code>
              <Button variant="outline" size="icon" onClick={() => copy(MCP_URL, "URL")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">claude_desktop_config.json</label>
            <pre className="rounded border bg-muted p-3 text-xs font-mono overflow-x-auto">{claudeSnippet}</pre>
            <Button variant="outline" size="sm" onClick={() => copy(claudeSnippet, "Snippet")} className="gap-2">
              <Copy className="h-4 w-4" /> Copiar snippet
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/MANUAL.md" target="_blank" rel="noopener noreferrer" className="gap-2">
                <Download className="h-4 w-4" /> Manual completo (MD)
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/openapi.yaml" target="_blank" rel="noopener noreferrer" className="gap-2">
                <Download className="h-4 w-4" /> openapi.yaml
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/mcp.json" target="_blank" rel="noopener noreferrer" className="gap-2">
                <Download className="h-4 w-4" /> mcp.json
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API REST</CardTitle>
          <CardDescription>
            Base: <code className="text-xs">{API_BASE}</code> · Auth: <code className="text-xs">Authorization: Bearer xplo_sk_...</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!loaded && <p className="text-sm text-muted-foreground">Carregando documentação interativa…</p>}
          <div ref={swaggerRef} className="swagger-ui-container" />
        </CardContent>
      </Card>
    </div>
  );
}
