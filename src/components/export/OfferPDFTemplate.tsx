import logoXplo from "@/assets/logo-xplo.png";

interface ValueStackItem {
  name: string;
  perceived_value: string;
}

interface GeneratedOptions {
  promise?: string[];
  unique_mechanism?: string[];
  guarantee?: string[];
  proof?: string[];
  risk_reversal?: string[];
  main_cta?: string[];
}

interface SelectedOptions {
  promise?: number[];
  unique_mechanism?: number[];
  guarantee?: number[];
  proof?: number[];
  risk_reversal?: number[];
  main_cta?: number[];
}

interface DemandPlan {
  context_analysis?: {
    niche?: string;
    icp_profile?: string;
    key_insight?: string;
  };
  primary_strategy?: {
    channel?: string;
    campaign_type?: string;
    audiences?: string[];
    creative_types?: string[];
    budget_percentage?: number;
    expected_cpl?: string;
  };
  complementary_strategies?: Array<{
    channel?: string;
    role?: string;
    integration?: string;
    budget_percentage?: number;
  }>;
  acquisition_funnel?: {
    tofu?: { objective?: string; channels?: string[]; message?: string };
    mofu?: { objective?: string; channels?: string[]; message?: string };
    bofu?: { objective?: string; channels?: string[]; message?: string };
  };
  channel_synergies?: string[];
  implementation_timeline?: {
    week_1_2?: string;
    week_3_4?: string;
    week_5_8?: string;
  };
}

interface OfferPDFTemplateProps {
  offer: {
    promise?: string | null;
    unique_mechanism?: string | null;
    guarantee?: string | null;
    proof?: string | null;
    risk_reversal?: string | null;
    main_cta?: string | null;
    value_stack?: ValueStackItem[] | unknown;
    generated_options?: GeneratedOptions | unknown;
    selected_options?: SelectedOptions | unknown;
    demand_generation_strategies?: DemandPlan | unknown;
    created_at: string;
  };
  clientName: string;
  // Allow passing live-edited options directly
  liveOptions?: GeneratedOptions;
  liveSelected?: SelectedOptions;
}

export function OfferPDFTemplate({ offer, clientName, liveOptions, liveSelected }: OfferPDFTemplateProps) {
  // Use live options if provided, otherwise fall back to offer data
  const generatedOptions = liveOptions || (offer.generated_options as GeneratedOptions) || {};
  const selectedOptions = liveSelected || (offer.selected_options as SelectedOptions) || {};

  const getSelectedText = (field: keyof GeneratedOptions): string => {
    const options = generatedOptions[field];
    const selected = selectedOptions[field];
    
    if (options && selected && selected.length > 0) {
      return selected.map(idx => options[idx]).filter(Boolean).join("\n\n");
    }
    
    // Fallback to direct field value
    return (offer as any)[field] || "";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  const valueStack = Array.isArray(offer.value_stack) ? offer.value_stack as ValueStackItem[] : [];
  const demandPlan = offer.demand_generation_strategies as DemandPlan | null;

  const sectionStyle = {
    pageBreakInside: "avoid" as const,
    breakInside: "avoid" as const,
    marginBottom: "15mm"
  };

  const itemStyle = {
    pageBreakInside: "avoid" as const,
    breakInside: "avoid" as const,
  };

  const headingStyle = {
    fontSize: "14pt",
    fontWeight: "600" as const,
    color: "#7c3aed",
    marginBottom: "8px",
    borderBottom: "1px solid #e5e7eb",
    paddingBottom: "4px"
  };

  const subHeadingStyle = {
    fontSize: "12pt",
    fontWeight: "600" as const,
    color: "#374151",
    marginBottom: "6px"
  };

  const badgeStyle = {
    display: "inline-block",
    padding: "2px 8px",
    backgroundColor: "#7c3aed",
    color: "#ffffff",
    borderRadius: "4px",
    fontSize: "9pt",
    marginRight: "6px"
  };

  const badgeOutlineStyle = {
    display: "inline-block",
    padding: "2px 8px",
    border: "1px solid #7c3aed",
    color: "#7c3aed",
    borderRadius: "4px",
    fontSize: "9pt",
    marginRight: "6px"
  };

  return (
    <div style={{ 
      width: "210mm", 
      minHeight: "297mm", 
      padding: "15mm",
      backgroundColor: "#ffffff",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "12pt",
      lineHeight: "1.6",
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
        marginBottom: "20px",
        paddingBottom: "15px",
        borderBottom: "2px solid #7c3aed"
      }}>
        <img src={logoXplo} alt="XPLO" style={{ height: "40px", width: "auto" }} />
        <span style={{ fontSize: "10pt", color: "#666" }}>
          {formatDate(offer.created_at)}
        </span>
      </div>

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1 style={{ 
          fontSize: "24pt", 
          fontWeight: "bold", 
          color: "#7c3aed",
          marginBottom: "8px"
        }}>
          OFERTA IRRESISTÍVEL
        </h1>
        <p style={{ fontSize: "14pt", color: "#666" }}>
          Cliente: {clientName}
        </p>
      </div>

      {/* Content Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Promessa */}
        {getSelectedText("promise") && (
          <div style={sectionStyle}>
            <h2 style={headingStyle}>PROMESSA PRINCIPAL</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{getSelectedText("promise")}</p>
          </div>
        )}

        {/* Mecanismo Único */}
        {getSelectedText("unique_mechanism") && (
          <div style={sectionStyle}>
            <h2 style={headingStyle}>MECANISMO ÚNICO</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{getSelectedText("unique_mechanism")}</p>
          </div>
        )}

        {/* Garantia */}
        {getSelectedText("guarantee") && (
          <div style={sectionStyle}>
            <h2 style={headingStyle}>GARANTIA</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{getSelectedText("guarantee")}</p>
          </div>
        )}

        {/* Prova Social */}
        {getSelectedText("proof") && (
          <div style={sectionStyle}>
            <h2 style={headingStyle}>PROVA SOCIAL</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{getSelectedText("proof")}</p>
          </div>
        )}

        {/* Reversão de Risco */}
        {getSelectedText("risk_reversal") && (
          <div style={sectionStyle}>
            <h2 style={headingStyle}>REVERSÃO DE RISCO</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{getSelectedText("risk_reversal")}</p>
          </div>
        )}

        {/* Pilha de Valor */}
        {valueStack.length > 0 && (
          <div style={sectionStyle}>
            <h2 style={headingStyle}>PILHA DE VALOR</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {valueStack.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 0" }}>{item.name}</td>
                    <td style={{ padding: "8px 0", textAlign: "right", fontWeight: "600" }}>
                      {item.perceived_value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CTA Principal */}
        {getSelectedText("main_cta") && (
          <div style={{ 
            ...sectionStyle,
            padding: "16px",
            backgroundColor: "#f5f3ff",
            borderRadius: "8px",
            border: "1px solid #7c3aed",
          }}>
            <h2 style={{ 
              fontSize: "14pt", 
              fontWeight: "600", 
              color: "#7c3aed",
              marginBottom: "8px"
            }}>
              CTA PRINCIPAL
            </h2>
            <p style={{ fontWeight: "500", whiteSpace: "pre-wrap" }}>{getSelectedText("main_cta")}</p>
          </div>
        )}

        {/* ====================== PLANO DE GERAÇÃO DE DEMANDA ====================== */}
        {demandPlan && (
          <div style={{ marginTop: "30px", paddingTop: "20px", borderTop: "3px solid #7c3aed" }}>
            <h2 style={{ 
              fontSize: "18pt", 
              fontWeight: "bold", 
              color: "#7c3aed",
              marginBottom: "20px",
              textAlign: "center"
            }}>
              PLANO DE GERAÇÃO DE DEMANDA
            </h2>

            {/* Análise do Contexto */}
            {demandPlan.context_analysis && (
              <div style={sectionStyle}>
                <h3 style={subHeadingStyle}>📊 Análise do Contexto</h3>
                <div style={{ backgroundColor: "#f9fafb", padding: "12px", borderRadius: "6px" }}>
                  {demandPlan.context_analysis.niche && (
                    <p style={{ fontSize: "11pt", marginBottom: "4px" }}>
                      <strong>Nicho:</strong> {demandPlan.context_analysis.niche}
                    </p>
                  )}
                  {demandPlan.context_analysis.icp_profile && (
                    <p style={{ fontSize: "11pt", marginBottom: "4px" }}>
                      <strong>Perfil ICP:</strong> {demandPlan.context_analysis.icp_profile}
                    </p>
                  )}
                  {demandPlan.context_analysis.key_insight && (
                    <p style={{ fontSize: "11pt" }}>
                      <strong>Insight Principal:</strong> {demandPlan.context_analysis.key_insight}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Estratégia Principal */}
            {demandPlan.primary_strategy && (
              <div style={sectionStyle}>
                <h3 style={subHeadingStyle}>🎯 Estratégia Principal</h3>
                <div style={{ backgroundColor: "#f5f3ff", padding: "12px", borderRadius: "6px", border: "1px solid #7c3aed" }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                    <span style={badgeStyle}>{demandPlan.primary_strategy.channel}</span>
                    {demandPlan.primary_strategy.budget_percentage && (
                      <span style={badgeOutlineStyle}>{demandPlan.primary_strategy.budget_percentage}% do budget</span>
                    )}
                  </div>
                  {demandPlan.primary_strategy.campaign_type && (
                    <p style={{ fontSize: "11pt", marginBottom: "4px" }}>
                      <strong>Campanha:</strong> {demandPlan.primary_strategy.campaign_type}
                    </p>
                  )}
                  {demandPlan.primary_strategy.audiences && demandPlan.primary_strategy.audiences.length > 0 && (
                    <p style={{ fontSize: "11pt", marginBottom: "4px" }}>
                      <strong>Públicos:</strong> {demandPlan.primary_strategy.audiences.join(", ")}
                    </p>
                  )}
                  {demandPlan.primary_strategy.creative_types && demandPlan.primary_strategy.creative_types.length > 0 && (
                    <p style={{ fontSize: "11pt", marginBottom: "4px" }}>
                      <strong>Criativos:</strong> {demandPlan.primary_strategy.creative_types.join(", ")}
                    </p>
                  )}
                  {demandPlan.primary_strategy.expected_cpl && (
                    <p style={{ fontSize: "11pt" }}>
                      <strong>CPL Esperado:</strong> {demandPlan.primary_strategy.expected_cpl}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Estratégias Complementares */}
            {demandPlan.complementary_strategies && demandPlan.complementary_strategies.length > 0 && (
              <div style={sectionStyle}>
                <h3 style={subHeadingStyle}>🔄 Estratégias Complementares</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {demandPlan.complementary_strategies.map((strategy, idx) => (
                    <div key={idx} style={{ ...itemStyle, border: "1px solid #e5e7eb", borderRadius: "6px", padding: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <strong style={{ fontSize: "11pt" }}>{strategy.channel}</strong>
                        {strategy.budget_percentage && (
                          <span style={{ ...badgeOutlineStyle, marginRight: 0 }}>{strategy.budget_percentage}%</span>
                        )}
                      </div>
                      {strategy.role && (
                        <p style={{ fontSize: "10pt", color: "#6b7280", marginBottom: "2px" }}>{strategy.role}</p>
                      )}
                      {strategy.integration && (
                        <p style={{ fontSize: "10pt", color: "#7c3aed" }}>→ {strategy.integration}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Funil de Aquisição */}
            {demandPlan.acquisition_funnel && (
              <div style={sectionStyle}>
                <h3 style={subHeadingStyle}>📈 Funil de Aquisição</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {demandPlan.acquisition_funnel.tofu && (
                    <div style={{ ...itemStyle, display: "flex", gap: "12px", backgroundColor: "#f9fafb", padding: "10px", borderRadius: "6px" }}>
                      <span style={{ ...badgeOutlineStyle, flexShrink: 0 }}>TOPO</span>
                      <div>
                        <p style={{ fontSize: "11pt", fontWeight: "500" }}>{demandPlan.acquisition_funnel.tofu.objective}</p>
                        {demandPlan.acquisition_funnel.tofu.message && (
                          <p style={{ fontSize: "10pt", color: "#6b7280", fontStyle: "italic" }}>"{demandPlan.acquisition_funnel.tofu.message}"</p>
                        )}
                        {demandPlan.acquisition_funnel.tofu.channels && demandPlan.acquisition_funnel.tofu.channels.length > 0 && (
                          <p style={{ fontSize: "10pt", marginTop: "4px" }}>
                            <strong>Canais:</strong> {demandPlan.acquisition_funnel.tofu.channels.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {demandPlan.acquisition_funnel.mofu && (
                    <div style={{ ...itemStyle, display: "flex", gap: "12px", backgroundColor: "#f9fafb", padding: "10px", borderRadius: "6px" }}>
                      <span style={{ ...badgeOutlineStyle, flexShrink: 0 }}>MEIO</span>
                      <div>
                        <p style={{ fontSize: "11pt", fontWeight: "500" }}>{demandPlan.acquisition_funnel.mofu.objective}</p>
                        {demandPlan.acquisition_funnel.mofu.message && (
                          <p style={{ fontSize: "10pt", color: "#6b7280", fontStyle: "italic" }}>"{demandPlan.acquisition_funnel.mofu.message}"</p>
                        )}
                        {demandPlan.acquisition_funnel.mofu.channels && demandPlan.acquisition_funnel.mofu.channels.length > 0 && (
                          <p style={{ fontSize: "10pt", marginTop: "4px" }}>
                            <strong>Canais:</strong> {demandPlan.acquisition_funnel.mofu.channels.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {demandPlan.acquisition_funnel.bofu && (
                    <div style={{ ...itemStyle, display: "flex", gap: "12px", backgroundColor: "#f9fafb", padding: "10px", borderRadius: "6px" }}>
                      <span style={{ ...badgeOutlineStyle, flexShrink: 0 }}>FUNDO</span>
                      <div>
                        <p style={{ fontSize: "11pt", fontWeight: "500" }}>{demandPlan.acquisition_funnel.bofu.objective}</p>
                        {demandPlan.acquisition_funnel.bofu.message && (
                          <p style={{ fontSize: "10pt", color: "#6b7280", fontStyle: "italic" }}>"{demandPlan.acquisition_funnel.bofu.message}"</p>
                        )}
                        {demandPlan.acquisition_funnel.bofu.channels && demandPlan.acquisition_funnel.bofu.channels.length > 0 && (
                          <p style={{ fontSize: "10pt", marginTop: "4px" }}>
                            <strong>Canais:</strong> {demandPlan.acquisition_funnel.bofu.channels.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sinergias entre Canais */}
            {demandPlan.channel_synergies && demandPlan.channel_synergies.length > 0 && (
              <div style={sectionStyle}>
                <h3 style={subHeadingStyle}>⚡ Sinergias entre Canais</h3>
                <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                  {demandPlan.channel_synergies.map((syn, i) => (
                    <li key={i} style={{ ...itemStyle, fontSize: "11pt", marginBottom: "4px", paddingLeft: "16px", position: "relative" }}>
                      <span style={{ position: "absolute", left: 0, color: "#7c3aed" }}>→</span>
                      {syn}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cronograma de Implementação */}
            {demandPlan.implementation_timeline && (
              <div style={sectionStyle}>
                <h3 style={subHeadingStyle}>📅 Cronograma de Implementação</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {demandPlan.implementation_timeline.week_1_2 && (
                    <div style={{ ...itemStyle, display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <span style={{ ...badgeOutlineStyle, flexShrink: 0 }}>Sem 1-2</span>
                      <p style={{ fontSize: "11pt", margin: 0 }}>{demandPlan.implementation_timeline.week_1_2}</p>
                    </div>
                  )}
                  {demandPlan.implementation_timeline.week_3_4 && (
                    <div style={{ ...itemStyle, display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <span style={{ ...badgeOutlineStyle, flexShrink: 0 }}>Sem 3-4</span>
                      <p style={{ fontSize: "11pt", margin: 0 }}>{demandPlan.implementation_timeline.week_3_4}</p>
                    </div>
                  )}
                  {demandPlan.implementation_timeline.week_5_8 && (
                    <div style={{ ...itemStyle, display: "flex", gap: "12px", alignItems: "flex-start" }}>
                      <span style={{ ...badgeOutlineStyle, flexShrink: 0 }}>Sem 5-8</span>
                      <p style={{ fontSize: "11pt", margin: 0 }}>{demandPlan.implementation_timeline.week_5_8}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
