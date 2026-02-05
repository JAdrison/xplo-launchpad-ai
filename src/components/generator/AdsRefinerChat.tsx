import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Check, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VideoContent {
  hook: string;
  problem: string;
  why_bad: string;
  solution: string;
  proof: string;
  cta: string;
  duration: string;
  visual_notes?: string;
}

interface StaticContent {
  headline: string;
  subheadline: string;
  body_text: string;
  eliminators: string[];
  cta: string;
  visual_suggestion?: string;
}

interface AdsRefinerChatProps {
  isOpen: boolean;
  onClose: () => void;
  adId: string;
  adType: "video" | "static";
  currentContent: VideoContent | StaticContent;
  onApply: (newContent: VideoContent | StaticContent) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AdsRefinerChat({
  isOpen,
  onClose,
  adId,
  adType,
  currentContent,
  onApply,
}: AdsRefinerChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refinedContent, setRefinedContent] = useState<VideoContent | StaticContent | null>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          type: "refine-ad",
          clientId: "", // Not needed for refinement
          adId,
          adType,
          currentContent: refinedContent || currentContent,
          instruction: userMessage,
        },
      });

      if (error) throw error;

      if (data?.refinedContent) {
        setRefinedContent(data.refinedContent);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Pronto! Refinei o anúncio conforme sua instrução. Veja a nova versão ao lado.",
          },
        ]);
      }
    } catch (err) {
      console.error("Error refining ad:", err);
      toast.error("Erro ao refinar anúncio");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Desculpe, ocorreu um erro. Tente novamente." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (refinedContent) {
      onApply(refinedContent);
      handleClose();
    }
  };

  const handleClose = () => {
    setMessages([]);
    setInput("");
    setRefinedContent(null);
    onClose();
  };

  const renderVideoPreview = (content: VideoContent, label: string) => (
    <div className="space-y-2 text-sm">
      <Badge variant="outline" className="mb-2">{label}</Badge>
      <div>
        <span className="font-medium text-muted-foreground">HOOK:</span>
        <p className="mt-0.5">{content.hook}</p>
      </div>
      <div>
        <span className="font-medium text-muted-foreground">PROBLEMA:</span>
        <p className="mt-0.5">{content.problem}</p>
      </div>
      <div>
        <span className="font-medium text-muted-foreground">POR QUE É RUIM:</span>
        <p className="mt-0.5">{content.why_bad}</p>
      </div>
      <div>
        <span className="font-medium text-muted-foreground">SOLUÇÃO:</span>
        <p className="mt-0.5">{content.solution}</p>
      </div>
      <div>
        <span className="font-medium text-muted-foreground">PROVA:</span>
        <p className="mt-0.5">{content.proof}</p>
      </div>
      <div>
        <span className="font-medium text-muted-foreground">CTA:</span>
        <p className="mt-0.5 text-primary font-medium">{content.cta}</p>
      </div>
      <div>
        <span className="font-medium text-muted-foreground">DURAÇÃO:</span>
        <span className="ml-1">{content.duration}</span>
      </div>
    </div>
  );

  const renderStaticPreview = (content: StaticContent, label: string) => (
    <div className="space-y-2 text-sm">
      <Badge variant="outline" className="mb-2">{label}</Badge>
      <div>
        <span className="font-medium text-muted-foreground">HEADLINE:</span>
        <p className="mt-0.5 font-semibold">{content.headline}</p>
      </div>
      <div>
        <span className="font-medium text-muted-foreground">SUBHEADLINE:</span>
        <p className="mt-0.5">{content.subheadline}</p>
      </div>
      <div>
        <span className="font-medium text-muted-foreground">COPY:</span>
        <p className="mt-0.5">{content.body_text}</p>
      </div>
      <div>
        <span className="font-medium text-muted-foreground">ELIMINATORS:</span>
        <ul className="mt-0.5 list-disc pl-4">
          {content.eliminators?.map((el, i) => (
            <li key={i}>{el}</li>
          ))}
        </ul>
      </div>
      <div>
        <span className="font-medium text-muted-foreground">CTA:</span>
        <p className="mt-0.5 text-primary font-medium">{content.cta}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Refinar Anúncio com IA
          </DialogTitle>
          <DialogDescription>
            Digite instruções naturais como "mais agressivo", "foca na economia", "headline mais curta"
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Preview Comparison */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <ScrollArea className="h-[300px]">
              {adType === "video"
                ? renderVideoPreview(currentContent as VideoContent, "Versão Atual")
                : renderStaticPreview(currentContent as StaticContent, "Versão Atual")}
            </ScrollArea>
          </div>

          <div className="border rounded-lg p-4 bg-primary/5 border-primary/20">
            <ScrollArea className="h-[300px]">
              {refinedContent ? (
                adType === "video"
                  ? renderVideoPreview(refinedContent as VideoContent, "Nova Versão")
                  : renderStaticPreview(refinedContent as StaticContent, "Nova Versão")
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p className="text-center text-sm">
                    A nova versão aparecerá aqui após você enviar uma instrução
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Chat Messages */}
        {messages.length > 0 && (
          <ScrollArea className="h-[120px] border rounded-lg p-3">
            <div className="space-y-2">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-sm ${
                    msg.role === "user" ? "text-foreground" : "text-muted-foreground italic"
                  }`}
                >
                  <span className="font-medium">{msg.role === "user" ? "Você: " : "IA: "}</span>
                  {msg.content}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Ex: deixa mais agressivo, foca na dor, adiciona urgência..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Descartar
          </Button>
          <Button onClick={handleApply} disabled={!refinedContent}>
            <Check className="h-4 w-4 mr-2" />
            Aplicar Alteração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
