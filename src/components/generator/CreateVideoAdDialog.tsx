import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getAIConfig } from "@/lib/aiConfig";
import type { Tables } from "@/integrations/supabase/types";

type Ad = Tables<"ads">;

interface CreateVideoAdDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  onCreated: (ad: Ad) => void;
}

export function CreateVideoAdDialog({
  isOpen,
  onClose,
  clientId,
  onCreated,
}: CreateVideoAdDialogProps) {
  const [instruction, setInstruction] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!instruction.trim()) {
      toast.error("Digite uma descrição para o anúncio");
      return;
    }

    setIsCreating(true);

    try {
      const aiConfig = getAIConfig();
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          type: "create-video-ad",
          clientId,
          instruction: instruction.trim(),
          aiConfig,
        },
      });

      if (error) throw error;

      if (data?.success && data?.ad) {
        onCreated(data.ad);
        setInstruction("");
        onClose();
        toast.success("Novo anúncio de vídeo criado com sucesso!");
      } else {
        throw new Error(data?.error || "Erro ao criar anúncio");
      }
    } catch (err: any) {
      console.error("Error creating video ad:", err);
      toast.error(err.message || "Erro ao criar anúncio de vídeo");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Criar Novo Anúncio de Vídeo com IA
          </DialogTitle>
          <DialogDescription>
            Descreva como você quer o anúncio e a IA irá gerar um roteiro completo
            com todas as 6 seções.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="instruction">Descreva como você quer o anúncio:</Label>
            <Textarea
              id="instruction"
              placeholder="Ex: Quero um anúncio focado em urgência, para donos de pet shop, destacando a economia de tempo. Tom mais agressivo e direto."
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="min-h-[120px]"
              disabled={isCreating}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            A IA usará o contexto do cliente (produto, dores, promessa) para criar
            um anúncio personalizado seguindo suas instruções.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={isCreating || !instruction.trim()}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Criar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
