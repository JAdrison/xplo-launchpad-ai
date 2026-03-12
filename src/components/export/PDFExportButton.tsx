import { usePDF, Margin } from "react-to-pdf";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { OfferPDFTemplate } from "./OfferPDFTemplate";
import { LandingPagePDFTemplate } from "./LandingPagePDFTemplate";
import { OnboardingPDFTemplate } from "./OnboardingPDFTemplate";
import { AdsPDFTemplate } from "./AdsPDFTemplate";

interface PDFExportButtonProps {
  type: "offer" | "landing-page" | "onboarding" | "ads";
  clientName: string;
  content: any;
  variant?: string;
  createdAt?: string;
  size?: "sm" | "default" | "lg" | "icon";
  liveOptions?: any;
  liveSelected?: any;
  refreshKey?: number;
  // For ads: filter which ads to include
  adsFilter?: "all" | "static" | "video";
  label?: string;
}

export function PDFExportButton({ 
  type, 
  clientName, 
  content, 
  variant = "direct",
  createdAt = new Date().toISOString(),
  size = "sm",
  liveOptions,
  liveSelected,
  refreshKey = 0,
  adsFilter = "all",
  label,
}: PDFExportButtonProps) {
  const sanitizedClientName = clientName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  
  const dateStr = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
  
  const typeLabels: Record<string, string> = {
    offer: "oferta",
    "landing-page": "landing-page",
    onboarding: "onboarding-x1",
    ads: "anuncios",
    "ads-static": "anuncios-estaticos",
    "ads-video": "roteiros-video",
  };

  const filenameKey = type === "ads" && adsFilter !== "all"
    ? adsFilter === "static" ? "ads-static" : "ads-video"
    : type;
  
  const filename = `${typeLabels[filenameKey]}-${sanitizedClientName}-${dateStr}.pdf`;

  // Compute filtered ads lists
  const filteredVideoAds = adsFilter === "static" ? [] : (content.videoAds || []);
  const filteredStaticAds = adsFilter === "video" ? [] : (content.staticAds || []);

  const defaultLabel = type === "ads"
    ? adsFilter === "static" ? "Estáticos" : adsFilter === "video" ? "Vídeos" : "PDF"
    : "PDF";

  const { toPDF, targetRef } = usePDF({
    filename,
    page: {
      margin: Margin.MEDIUM,
      format: "A4",
      orientation: "portrait"
    }
  });

  return (
    <>
      <Button 
        variant="ghost" 
        size={size} 
        onClick={() => toPDF()}
        title={`Exportar PDF — ${label ?? defaultLabel}`}
      >
        <FileDown className="h-4 w-4" />
        {size !== "icon" && <span className="ml-1">{label ?? defaultLabel}</span>}
      </Button>
      
      {/* Hidden template for PDF generation */}
      <div 
        ref={targetRef} 
        key={refreshKey}
        style={{ 
          position: "absolute", 
          left: "-9999px",
          top: 0
        }}
      >
        {type === "offer" && (
          <OfferPDFTemplate 
            offer={content} 
            clientName={clientName}
            liveOptions={liveOptions}
            liveSelected={liveSelected}
          />
        )}
        {type === "landing-page" && (
          <LandingPagePDFTemplate 
            sections={content.sections || content}
            variant={variant}
            clientName={clientName}
            createdAt={createdAt}
          />
        )}
        {type === "onboarding" && (
          <OnboardingPDFTemplate 
            clientName={clientName}
            createdAt={createdAt}
            client={content.client}
            company={content.company}
            product={content.product}
            pains={content.pains}
            market={content.market}
            icps={content.icps}
            promise={content.promise}
          />
        )}
        {type === "ads" && (
          <AdsPDFTemplate 
            clientName={clientName}
            createdAt={createdAt}
            videoAds={filteredVideoAds}
            staticAds={filteredStaticAds}
          />
        )}
      </div>
    </>
  );
}
