import { OnboardingPDFTemplate } from "./OnboardingPDFTemplate";
import { OfferPDFTemplate } from "./OfferPDFTemplate";
import { LandingPagePDFTemplate } from "./LandingPagePDFTemplate";
import { AdsPDFTemplate } from "./AdsPDFTemplate";
import type { Tables } from "@/integrations/supabase/types";

type Ad = Tables<"ads">;
type LandingPage = Tables<"landing_pages">;
type Offer = Tables<"offers_hormozi">;

interface OnboardingFullPDFTemplateProps {
  clientName: string;
  createdAt: string;
  // Onboarding data
  onboarding: any;
  // Variações
  offer?: Offer | null;
  landingPages?: LandingPage[];
  videoAds?: Ad[];
  staticAds?: Ad[];
}

const pageBreakStyle: React.CSSProperties = {
  pageBreakBefore: "always",
  breakBefore: "page",
};

const variantOrder: Record<string, number> = {
  direct: 1,
  consultive: 2,
  aggressive: 3,
};

export function OnboardingFullPDFTemplate({
  clientName,
  createdAt,
  onboarding,
  offer,
  landingPages = [],
  videoAds = [],
  staticAds = [],
}: OnboardingFullPDFTemplateProps) {
  const sortedLPs = [...landingPages].sort(
    (a, b) => (variantOrder[a.variant] || 99) - (variantOrder[b.variant] || 99),
  );

  return (
    <div>
      {/* 1. Onboarding completo */}
      <OnboardingPDFTemplate
        clientName={clientName}
        createdAt={createdAt}
        client={onboarding.client}
        company={onboarding.company}
        product={onboarding.product}
        swot={onboarding.swot}
        market={onboarding.market}
        icp={onboarding.icp}
        promise={offer?.promise || onboarding.promise}
      />

      {/* 2. Oferta + variações */}
      {offer && (
        <div style={pageBreakStyle}>
          <OfferPDFTemplate
            offer={{
              promise: offer.promise,
              unique_mechanism: offer.unique_mechanism,
              guarantee: offer.guarantee,
              proof: offer.proof,
              risk_reversal: offer.risk_reversal,
              main_cta: offer.main_cta,
              value_stack: offer.value_stack,
              generated_options: offer.generated_options,
              selected_options: offer.selected_options,
              demand_generation_strategies: offer.demand_generation_strategies,
              created_at: offer.created_at,
            }}
            clientName={clientName}
          />
        </div>
      )}

      {/* 3. Landing Pages — 3 variantes */}
      {sortedLPs.map((lp) => (
        <div key={lp.id} style={pageBreakStyle}>
          <LandingPagePDFTemplate
            sections={lp.sections as any}
            variant={lp.variant}
            clientName={clientName}
            createdAt={lp.created_at}
          />
        </div>
      ))}

      {/* 4. Anúncios (estáticos + vídeos) */}
      {(videoAds.length > 0 || staticAds.length > 0) && (
        <div style={pageBreakStyle}>
          <AdsPDFTemplate
            clientName={clientName}
            createdAt={createdAt}
            videoAds={videoAds}
            staticAds={staticAds}
          />
        </div>
      )}
    </div>
  );
}
