import { usePDF, Margin, Resolution } from "react-to-pdf";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { OfferPDFTemplate } from "./OfferPDFTemplate";
import { LandingPagePDFTemplate } from "./LandingPagePDFTemplate";

interface PDFExportButtonProps {
  type: "offer" | "landing-page";
  clientName: string;
  content: any;
  variant?: string;
  createdAt?: string;
  size?: "sm" | "default" | "lg" | "icon";
}

export function PDFExportButton({ 
  type, 
  clientName, 
  content, 
  variant = "direct",
  createdAt = new Date().toISOString(),
  size = "sm"
}: PDFExportButtonProps) {
  const sanitizedClientName = clientName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  
  const dateStr = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
  const filename = `${type === "offer" ? "oferta" : "landing-page"}-${sanitizedClientName}-${dateStr}.pdf`;

  const { toPDF, targetRef } = usePDF({
    filename,
    // Aumenta a resolução para reduzir artefatos de recorte (letras "comidas")
    // causados pela rasterização e fatiamento do conteúdo em múltiplas páginas.
    resolution: Resolution.HIGH,
    page: {
      margin: Margin.MEDIUM,
      format: "A4",
      orientation: "portrait"
    },
    // Prefere PNG para manter bordas do texto mais nítidas.
    canvas: {
      mimeType: "image/png",
      qualityRatio: 1,
    },
    overrides: {
      // Opções do html2canvas
      canvas: {
        scale: 2,
      },
      // Opções do jsPDF
      pdf: {
        compress: true,
      },
    },
  });

  return (
    <>
      <Button 
        variant="ghost" 
        size={size} 
        onClick={() => toPDF()}
        title="Exportar PDF"
      >
        <FileDown className="h-4 w-4" />
        {size !== "icon" && <span className="ml-1">PDF</span>}
      </Button>
      
      {/* Hidden template for PDF generation */}
      <div 
        ref={targetRef} 
        style={{ 
          position: "absolute", 
          left: "-9999px",
          top: 0
        }}
      >
        {type === "offer" ? (
          <OfferPDFTemplate 
            offer={content} 
            clientName={clientName} 
          />
        ) : (
          <LandingPagePDFTemplate 
            sections={content.sections || content}
            variant={variant}
            clientName={clientName}
            createdAt={createdAt}
          />
        )}
      </div>
    </>
  );
}
