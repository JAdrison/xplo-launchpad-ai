import logoXplo from "@/assets/logo-xplo.png";

interface HeroSection {
  headline?: string;
  subheadline?: string;
  hero_text?: string;
  cta_button?: string;
  cta_subtext?: string;
}

interface ProblemSection {
  title?: string;
  problems?: string[];
  emotional_text?: string;
}

interface SolutionSection {
  title?: string;
  description?: string;
  unique_mechanism?: string;
}

interface BenefitItem {
  icon?: string;
  title?: string;
  description?: string;
}

interface HowItWorksSection {
  title?: string;
  steps?: Array<{
    number?: number;
    title?: string;
    description?: string;
  }>;
}

interface Testimonial {
  name?: string;
  role?: string;
  text?: string;
  result?: string;
}

interface Stat {
  number?: string;
  label?: string;
}

interface SocialProofSection {
  title?: string;
  testimonials?: Testimonial[];
  stats?: Stat[];
}

interface GuaranteeSection {
  title?: string;
  description?: string;
  duration?: string;
  conditions?: string;
}

interface ValueStackItem {
  name?: string;
  value?: string;
}

interface ValueStackSection {
  title?: string;
  items?: ValueStackItem[];
  total_value?: string;
  actual_price?: string;
  discount_text?: string;
}

interface FAQItem {
  question?: string;
  answer?: string;
}

interface FinalCTASection {
  headline?: string;
  subtext?: string;
  button_text?: string;
  urgency_text?: string;
}

interface CompleteLPSections {
  hero?: HeroSection;
  problem_agitation?: ProblemSection;
  solution?: SolutionSection;
  benefits?: BenefitItem[];
  how_it_works?: HowItWorksSection;
  social_proof?: SocialProofSection;
  guarantee?: GuaranteeSection;
  value_stack?: ValueStackSection;
  faq?: FAQItem[];
  final_cta?: FinalCTASection;
}

interface LandingPagePDFTemplateProps {
  sections: CompleteLPSections | any;
  variant: string;
  clientName: string;
  createdAt: string;
}

const variantLabels: Record<string, string> = {
  direct: "Direta",
  consultive: "Consultiva",
  aggressive: "Agressiva"
};

export function LandingPagePDFTemplate({ sections, variant, clientName, createdAt }: LandingPagePDFTemplateProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  const isCompleteFormat = 'hero' in sections && sections.hero;
  const complete = sections as CompleteLPSections;

  const sectionStyle = {
    marginBottom: "20px",
    pageBreakInside: "avoid" as const,
    breakInside: "avoid" as const,
  };

  const titleStyle = {
    fontSize: "13pt",
    fontWeight: "600" as const,
    color: "#7c3aed",
    marginBottom: "8px",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "4px"
  };

  const subtitleStyle = {
    fontSize: "10pt",
    color: "#666",
    marginBottom: "4px"
  };

  return (
    <div style={{ 
      width: "210mm", 
      minHeight: "297mm", 
      padding: "5mm",
      backgroundColor: "#ffffff",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "11pt",
      lineHeight: "1.5",
      color: "#1a1a1a"
    }}>
      {/* Logo fixa em todas as páginas - canto superior direito */}
      <img 
        src={logoXplo} 
        alt="XPLO" 
        style={{ 
          position: "fixed",
          top: "5mm",
          right: "5mm",
          height: "20px",
          width: "auto",
          opacity: 0.7,
          zIndex: 1000,
        }} 
      />

      {/* Header with Logo */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "flex-start",
        marginBottom: "15px",
        paddingBottom: "10px",
        borderBottom: "2px solid #7c3aed"
      }}>
        <img src={logoXplo} alt="XPLO" style={{ height: "35px", width: "auto" }} />
        <span style={{ fontSize: "9pt", color: "#666" }}>
          {formatDate(createdAt)}
        </span>
      </div>

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: "25px" }}>
        <h1 style={{ 
          fontSize: "20pt", 
          fontWeight: "bold", 
          color: "#7c3aed",
          marginBottom: "6px"
        }}>
          LANDING PAGE - {variantLabels[variant]?.toUpperCase() || variant.toUpperCase()}
        </h1>
        <p style={{ fontSize: "12pt", color: "#666" }}>
          Cliente: {clientName}
        </p>
      </div>

      {/* Content */}
      {isCompleteFormat ? (
        <div>
          {/* Hero */}
          {complete.hero && (
            <div style={sectionStyle}>
              <h2 style={titleStyle}>HERO</h2>
              {complete.hero.headline && (
                <div style={{ marginBottom: "8px" }}>
                  <span style={subtitleStyle}>Headline:</span>
                  <p style={{ fontWeight: "600", fontSize: "12pt" }}>{complete.hero.headline}</p>
                </div>
              )}
              {complete.hero.subheadline && (
                <div style={{ marginBottom: "8px" }}>
                  <span style={subtitleStyle}>Subheadline:</span>
                  <p>{complete.hero.subheadline}</p>
                </div>
              )}
              {complete.hero.cta_button && (
                <div style={{ 
                  backgroundColor: "#f5f3ff", 
                  padding: "8px 12px", 
                  borderRadius: "4px",
                  display: "inline-block"
                }}>
                  <strong>CTA:</strong> {complete.hero.cta_button}
                </div>
              )}
            </div>
          )}

          {/* Problem Agitation */}
          {complete.problem_agitation && (
            <div style={sectionStyle}>
              <h2 style={titleStyle}>PROBLEMAS E DORES</h2>
              {complete.problem_agitation.problems && (
                <ul style={{ paddingLeft: "20px", margin: "8px 0" }}>
                  {complete.problem_agitation.problems.map((p, i) => (
                    <li key={i} style={{ marginBottom: "4px" }}>{p}</li>
                  ))}
                </ul>
              )}
              {complete.problem_agitation.emotional_text && (
                <p style={{ fontStyle: "italic", color: "#666" }}>
                  {complete.problem_agitation.emotional_text}
                </p>
              )}
            </div>
          )}

          {/* Solution */}
          {complete.solution && (
            <div style={sectionStyle}>
              <h2 style={titleStyle}>SOLUÇÃO</h2>
              {complete.solution.description && <p>{complete.solution.description}</p>}
              {complete.solution.unique_mechanism && (
                <div style={{ 
                  backgroundColor: "#f5f3ff", 
                  padding: "10px", 
                  borderRadius: "4px",
                  marginTop: "8px",
                  pageBreakInside: "avoid",
                  breakInside: "avoid",
                }}>
                  <strong>Mecanismo Único:</strong> {complete.solution.unique_mechanism}
                </div>
              )}
            </div>
          )}

          {/* Benefits */}
          {complete.benefits && complete.benefits.length > 0 && (
            <div style={sectionStyle}>
              <h2 style={titleStyle}>BENEFÍCIOS</h2>
              <ul style={{ paddingLeft: "20px" }}>
                {complete.benefits.map((b, i) => (
                  <li key={i} style={{ marginBottom: "6px" }}>
                    <strong>{b.title}</strong>
                    {b.description && <span>: {b.description}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* How It Works */}
          {complete.how_it_works?.steps && (
            <div style={sectionStyle}>
              <h2 style={titleStyle}>COMO FUNCIONA</h2>
              <ol style={{ paddingLeft: "20px" }}>
                {complete.how_it_works.steps.map((step, i) => (
                  <li key={i} style={{ marginBottom: "6px" }}>
                    <strong>{step.title}</strong>
                    {step.description && <span>: {step.description}</span>}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Social Proof */}
          {complete.social_proof && (
            <div style={sectionStyle}>
              <h2 style={titleStyle}>PROVA SOCIAL</h2>
              {complete.social_proof.testimonials?.map((t, i) => (
                <div key={i} style={{ 
                  border: "1px solid #e5e7eb", 
                  padding: "10px", 
                  borderRadius: "4px",
                  marginBottom: "8px",
                  pageBreakInside: "avoid",
                  breakInside: "avoid",
                }}>
                  <p style={{ fontStyle: "italic" }}>"{t.text}"</p>
                  <p style={{ fontSize: "10pt", color: "#666", marginTop: "4px" }}>
                    — {t.name}, {t.role}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Guarantee */}
          {complete.guarantee && (
            <div style={sectionStyle}>
              <h2 style={titleStyle}>GARANTIA</h2>
              <p>{complete.guarantee.description}</p>
              {complete.guarantee.duration && (
                <p style={{ fontWeight: "600", color: "#7c3aed" }}>
                  {complete.guarantee.duration}
                </p>
              )}
            </div>
          )}

          {/* Value Stack */}
          {complete.value_stack?.items && (
            <div style={sectionStyle}>
              <h2 style={titleStyle}>PILHA DE VALOR</h2>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {complete.value_stack.items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "6px 0" }}>{item.name}</td>
                      <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "600" }}>
                        {item.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {complete.value_stack.actual_price && (
                <p style={{ 
                  marginTop: "10px", 
                  fontSize: "14pt", 
                  fontWeight: "bold",
                  color: "#7c3aed"
                }}>
                  Investimento: {complete.value_stack.actual_price}
                </p>
              )}
            </div>
          )}

          {/* FAQ */}
          {complete.faq && complete.faq.length > 0 && (
            <div style={sectionStyle}>
              <h2 style={titleStyle}>PERGUNTAS FREQUENTES</h2>
              {complete.faq.map((item, i) => (
                <div key={i} style={{ marginBottom: "10px", pageBreakInside: "avoid", breakInside: "avoid" }}>
                  <p style={{ fontWeight: "600" }}>{item.question}</p>
                  <p style={{ color: "#666" }}>{item.answer}</p>
                </div>
              ))}
            </div>
          )}

          {/* Final CTA */}
          {complete.final_cta && (
            <div style={{ 
              marginTop: "20px",
              padding: "15px",
              backgroundColor: "#f5f3ff",
              borderRadius: "8px",
              border: "1px solid #7c3aed",
              textAlign: "center",
              pageBreakInside: "avoid",
              breakInside: "avoid",
            }}>
              <h2 style={{ fontSize: "14pt", fontWeight: "bold", color: "#7c3aed" }}>
                {complete.final_cta.headline}
              </h2>
              {complete.final_cta.button_text && (
                <p style={{ 
                  marginTop: "8px",
                  padding: "8px 16px",
                  backgroundColor: "#7c3aed",
                  color: "#fff",
                  borderRadius: "4px",
                  display: "inline-block",
                  fontWeight: "600"
                }}>
                  {complete.final_cta.button_text}
                </p>
              )}
              {complete.final_cta.urgency_text && (
                <p style={{ marginTop: "8px", fontSize: "10pt", color: "#dc2626" }}>
                  {complete.final_cta.urgency_text}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        // Legacy format
        <div>
          {sections.headline && (
            <div style={sectionStyle}>
              <h2 style={titleStyle}>HEADLINE</h2>
              <p style={{ fontWeight: "600" }}>{sections.headline}</p>
            </div>
          )}
          {sections.subheadline && (
            <div style={sectionStyle}>
              <h2 style={titleStyle}>SUBHEADLINE</h2>
              <p>{sections.subheadline}</p>
            </div>
          )}
          {sections.benefits && (
            <div style={sectionStyle}>
              <h2 style={titleStyle}>BENEFÍCIOS</h2>
              <ul style={{ paddingLeft: "20px" }}>
                {sections.benefits.map((b: string, i: number) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          )}
          {sections.cta_text && (
            <div style={{ 
              padding: "15px",
              backgroundColor: "#f5f3ff",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              <p style={{ fontWeight: "600", color: "#7c3aed" }}>{sections.cta_text}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
