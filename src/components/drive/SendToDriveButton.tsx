import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Cloud, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SendToDriveButtonProps {
  /** Returns the jsPDF instance (use react-to-pdf with `method: "build"`). */
  buildPdf: () => Promise<any>;
  clientId: string;
  fileName: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "ghost" | "outline" | "default";
  label?: string;
  className?: string;
}

export function SendToDriveButton({
  buildPdf,
  clientId,
  fileName,
  size = "sm",
  variant = "ghost",
  label = "Drive",
  className,
}: SendToDriveButtonProps) {
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    const t = toast.loading("Enviando para o Drive...");
    try {
      const pdf = await buildPdf();
      // jsPDF: datauristring -> "data:application/pdf;base64,XXXX"
      const dataUri: string =
        typeof pdf?.output === "function"
          ? pdf.output("datauristring")
          : "";
      if (!dataUri || !dataUri.includes(",")) {
        throw new Error("Não foi possível gerar o PDF.");
      }
      const base64 = dataUri.split(",").pop() as string;

      const safeName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
      const { data, error } = await supabase.functions.invoke(
        "upload-to-drive",
        {
          body: { clientId, fileName: safeName, pdfBase64: base64 },
        },
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.dismiss(t);
      toast.success(
        `Salvo em "${data.folderName}"`,
        data.webViewLink
          ? {
              action: {
                label: "Abrir",
                onClick: () => window.open(data.webViewLink, "_blank"),
              },
              duration: 8000,
            }
          : undefined,
      );
    } catch (e: any) {
      toast.dismiss(t);
      console.error("send-to-drive error:", e);
      toast.error(e?.message || "Erro ao enviar para o Drive");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleSend}
      disabled={isSending}
      className={className}
      title="Enviar PDF para o Google Drive"
    >
      {isSending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Cloud className="h-4 w-4" />
      )}
      {size !== "icon" && <span className="ml-1">{label}</span>}
    </Button>
  );
}
