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

interface AudienceObj {
  name?: string;
  geo?: string;
  source?: string | string[];
  sources?: string[];
  exclusions?: string[];
  interests?: string[];
  filters?: string[];
  message?: string;
}

interface LeadCapture {
  destination?: string | string[];
  form_fields?: string[];
  qualification_rule?: string;
}

interface SalesMotion {
  step_1?: string;
  step_2?: string;
  step_3?: string;
  step_4?: string;
}

interface FunnelStage {
  objective?: string;
  channels?: string[];
  message?: string;
  // TOFU
  offers?: string[];
  creatives?: string[];
  lead_capture?: LeadCapture;
  // MOFU
  nurture_assets?: string[];
  retargeting_logic?: string[];
  sales_motion?: SalesMotion;
  // BOFU
  closing_offers?: string[];
  objection_killers?: string[];
  remarketing_assets?: string[];
}

interface DemandPlan {
  context_analysis?: {
    niche?: string;
    icp_profile?: string;
    key_insight?: string;
    market_challenges?: string;
  };
  primary_strategy?: {
    channel?: string;
    campaign_type?: string;
    audiences?: Array<string | AudienceObj>;
    creative_types?: string[];
    budget_percentage?: number;
    expected_cpl?: string;
    kpis?: string[];
  };
  complementary_strategies?: Array<{
    channel?: string;
    role?: string;
    integration?: string;
    budget_percentage?: number;
    tactics?: string;
  }>;
  acquisition_funnel?: {
    tofu?: FunnelStage;
    mofu?: FunnelStage;
    bofu?: FunnelStage;
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
  liveOptions?: GeneratedOptions;
  liveSelected?: SelectedOptions;
}

export function OfferPDFTemplate({ offer, clientName, liveOptions, liveSelected }: OfferPDFTemplateProps) {
  const generatedOptions = liveOptions || (offer.generated_options as GeneratedOptions) || {};
  const selectedOptions = liveSelected || (offer.selected_options as SelectedOptions) || {};

  const getSelectedText = (field: keyof GeneratedOptions): string => {
    const options = generatedOptions[field];
    const selected = selectedOptions[field];
    if (options && selected && selected.length > 0) {
      return selected.map(idx => options[idx]).filter(Boolean).join("\n\n");
    }
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

  const renderStringArray = (arr: unknown): string => {
    if (!arr) return "";
    if (Array.isArray(arr)) return arr.filter(v => typeof v === "string").join(", ");
    if (typeof arr === "string") return arr;
    return "";
  };

  const renderAudience = (aud: string | AudienceObj, idx: number) => {
    if (typeof aud === "string") {
      return (
        <div key={idx} style={{ ...itemStyle, padding: "8px", backgroundColor: "#f9fafb", borderRadius: "6px", marginBottom: "6px" }}>
          <p style={{ fontSize: "11pt", margin: 0 }}>{aud}</p>
        </div>
      );
    }
    const audObj = aud as AudienceObj;
    return (
      <div key={idx} style={{ ...itemStyle, padding: "10px", backgroundColor: "#f9fafb", borderRadius: "6px", marginBottom: "6px", border: "1px solid #e5e7eb" }}>
        <p style={{ fontSize: "11pt", fontWeight: "600", marginBottom: "4px" }}>{audObj.name || `Público ${idx + 1}`}</p>
        {audObj.geo && <p style={{ fontSize: "10pt", marginBottom: "2px" }}><strong>Geo:</strong> {audObj.geo}</p>}
        {audObj.interests && audObj.interests.length > 0 && (
          <p style={{ fontSize: "10pt", marginBottom: "2px" }}><strong>Interesses:</strong> {audObj.interests.join(", ")}</p>
        )}
        {audObj.filters && audObj.filters.length > 0 && (
          <p style={{ fontSize: "10pt", marginBottom: "2px" }}><strong>Filtros:</strong> {audObj.filters.join(", ")}</p>
        )}
        {(audObj.source || audObj.sources) && (
          <p style={{ fontSize: "10pt", marginBottom: "2px" }}>
            <strong>Fonte:</strong> {renderStringArray(audObj.sources) || renderStringArray(audObj.source)}
          </p>
        )}
        {audObj.exclusions && (
          <p style={{ fontSize: "10pt", marginBottom: "2px" }}><strong>Exclusões:</strong> {Array.isArray(audObj.exclusions) ? audObj.exclusions.join(", ") : audObj.exclusions}</p>
        )}
        {audObj.message && <p style={{ fontSize: "10pt", color: "#7c3aed", fontStyle: "italic" }}>"{audObj.message}"</p>}
      </div>
    );
  };

  const renderFunnelStage = (stage: FunnelStage, label: string, emoji: string) => {
    return (
      <div style={{ ...itemStyle, backgroundColor: "#f9fafb", padding: "12px", borderRadius: "6px", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span style={badgeOutlineStyle}>{emoji} {label}</span>
        </div>
        {stage.objective && <p style={{ fontSize: "11pt", fontWeight: "500", marginBottom: "6px" }}>{stage.objective}</p>}
        
        {/* TOFU specific */}
        {stage.offers && stage.offers.length > 0 && (
          <div style={{ marginBottom: "6px" }}>
            <p style={{ fontSize: "10pt", fontWeight: "600", marginBottom: "2px" }}>Ofertas:</p>
            {stage.offers.map((o, i) => <p key={i} style={{ fontSize: "10pt", marginLeft: "12px", marginBottom: "2px" }}>• {o}</p>)}
          </div>
        )}
        {stage.creatives && stage.creatives.length > 0 && (
          <div style={{ marginBottom: "6px" }}>
            <p style={{ fontSize: "10pt", fontWeight: "600", marginBottom: "2px" }}>Criativos:</p>
            {stage.creatives.map((c, i) => <p key={i} style={{ fontSize: "10pt", marginLeft: "12px", marginBottom: "2px" }}>• {c}</p>)}
          </div>
        )}
        {stage.lead_capture && (
          <div style={{ marginBottom: "6px" }}>
            <p style={{ fontSize: "10pt", fontWeight: "600", marginBottom: "2px" }}>Captura de Leads:</p>
            {stage.lead_capture.destination && (
              <p style={{ fontSize: "10pt", marginLeft: "12px" }}><strong>Destino:</strong> {renderStringArray(stage.lead_capture.destination)}</p>
            )}
            {stage.lead_capture.form_fields && stage.lead_capture.form_fields.length > 0 && (
              <p style={{ fontSize: "10pt", marginLeft: "12px" }}><strong>Campos:</strong> {stage.lead_capture.form_fields.join(", ")}</p>
            )}
            {stage.lead_capture.qualification_rule && (
              <p style={{ fontSize: "10pt", marginLeft: "12px" }}><strong>Regra:</strong> {stage.lead_capture.qualification_rule}</p>
            )}
          </div>
        )}

        {/* MOFU specific */}
        {stage.nurture_assets && stage.nurture_assets.length > 0 && (
          <div style={{ marginBottom: "6px" }}>
            <p style={{ fontSize: "10pt", fontWeight: "600", marginBottom: "2px" }}>Ativos de Nutrição:</p>
            {stage.nurture_assets.map((a, i) => <p key={i} style={{ fontSize: "10pt", marginLeft: "12px", marginBottom: "2px" }}>• {a}</p>)}
          </div>
        )}
        {stage.retargeting_logic && stage.retargeting_logic.length > 0 && (
          <div style={{ marginBottom: "6px" }}>
            <p style={{ fontSize: "10pt", fontWeight: "600", marginBottom: "2px" }}>Lógica de Retargeting:</p>
            {stage.retargeting_logic.map((r, i) => <p key={i} style={{ fontSize: "10pt", marginLeft: "12px", marginBottom: "2px" }}>• {r}</p>)}
          </div>
        )}
        {stage.sales_motion && (
          <div style={{ marginBottom: "6px" }}>
            <p style={{ fontSize: "10pt", fontWeight: "600", marginBottom: "2px" }}>Processo Comercial:</p>
            {stage.sales_motion.step_1 && <p style={{ fontSize: "10pt", marginLeft: "12px" }}>1. {stage.sales_motion.step_1}</p>}
            {stage.sales_motion.step_2 && <p style={{ fontSize: "10pt", marginLeft: "12px" }}>2. {stage.sales_motion.step_2}</p>}
            {stage.sales_motion.step_3 && <p style={{ fontSize: "10pt", marginLeft: "12px" }}>3. {stage.sales_motion.step_3}</p>}
            {stage.sales_motion.step_4 && <p style={{ fontSize: "10pt", marginLeft: "12px" }}>4. {stage.sales_motion.step_4}</p>}
          </div>
        )}

        {/* BOFU specific */}
        {stage.closing_offers && stage.closing_offers.length > 0 && (
          <div style={{ marginBottom: "6px" }}>
            <p style={{ fontSize: "10pt", fontWeight: "600", marginBottom: "2px" }}>Ofertas de Fechamento:</p>
            {stage.closing_offers.map((c, i) => <p key={i} style={{ fontSize: "10pt", marginLeft: "12px", marginBottom: "2px" }}>• {c}</p>)}
          </div>
        )}
        {stage.objection_killers && stage.objection_killers.length > 0 && (
          <div style={{ marginBottom: "6px" }}>
            <p style={{ fontSize: "10pt", fontWeight: "600", marginBottom: "2px" }}>Quebra de Objeções:</p>
            {stage.objection_killers.map((o, i) => <p key={i} style={{ fontSize: "10pt", marginLeft: "12px", marginBottom: "2px" }}>• {o}</p>)}
          </div>
        )}
        {stage.remarketing_assets && stage.remarketing_assets.length > 0 && (
          <div style={{ marginBottom: "6px" }}>
            <p style={{ fontSize: "10pt", fontWeight: "600", marginBottom: "2px" }}>Ativos de Remarketing:</p>
            {stage.remarketing_assets.map((r, i) => <p key={i} style={{ fontSize: "10pt", marginLeft: "12px", marginBottom: "2px" }}>• {r}</p>)}
          </div>
        )}

        {/* Fallback for old format */}
        {stage.channels && !stage.creatives && !stage.nurture_assets && !stage.closing_offers && (
          <p style={{ fontSize: "10pt" }}><strong>Canais:</strong> {renderStringArray(stage.channels)}</p>
        )}
        {stage.message && !stage.sales_motion && (
          <p style={{ fontSize: "10pt", fontStyle: "italic" }}>"{stage.message}"</p>
        )}
      </div>
    );
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
      {/* Logo fixa */}
      <img 
        src={logoXplo} 
        alt="XPLO" 
        style={{ 
          position: "absolute",
          top: "5mm",
          right: "5mm",
          height: "20px",
          width: "auto",
          opacity: 0.7,
          zIndex: 1000,
        }} 
      />

      {/* Header */}
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
        <h1 style={{ fontSize: "24pt", fontWeight: "bold", color: "#7c3aed", marginBottom: "8px" }}>
          OFERTA IRRESISTÍVEL
        </h1>
        <p style={{ fontSize: "14pt", color: "#666" }}>
          Cliente: {clientName}
        </p>
      </div>

      {/* Content Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {getSelectedText("promise") && (
          <div style={sectionStyle}>
            <h2 style={headingStyle}>PROMESSA PRINCIPAL</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{getSelectedText("promise")}</p>
          </div>
        )}

        {getSelectedText("unique_mechanism") && (
          <div style={sectionStyle}>
            <h2 style={headingStyle}>MECANISMO ÚNICO</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{getSelectedText("unique_mechanism")}</p>
          </div>
        )}

        {getSelectedText("guarantee") && (
          <div style={sectionStyle}>
            <h2 style={headingStyle}>GARANTIA</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{getSelectedText("guarantee")}</p>
          </div>
        )}

        {getSelectedText("proof") && (
          <div style={sectionStyle}>
            <h2 style={headingStyle}>PROVA SOCIAL</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{getSelectedText("proof")}</p>
          </div>
        )}

        {getSelectedText("risk_reversal") && (
          <div style={sectionStyle}>
            <h2 style={headingStyle}>REVERSÃO DE RISCO</h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{getSelectedText("risk_reversal")}</p>
          </div>
        )}

        {valueStack.length > 0 && (
          <div style={sectionStyle}>
            <h2 style={headingStyle}>PILHA DE VALOR</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {valueStack.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "8px 0" }}>{item.name}</td>
                    <td style={{ padding: "8px 0", textAlign: "right", fontWeight: "600" }}>{item.perceived_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {getSelectedText("main_cta") && (
          <div style={{ 
            ...sectionStyle,
            padding: "16px",
            backgroundColor: "#f5f3ff",
            borderRadius: "8px",
            border: "1px solid #7c3aed",
          }}>
            <h2 style={{ fontSize: "14pt", fontWeight: "600", color: "#7c3aed", marginBottom: "8px" }}>
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
                    <p style={{ fontSize: "11pt", marginBottom: "4px" }}><strong>Nicho:</strong> {demandPlan.context_analysis.niche}</p>
                  )}
                  {demandPlan.context_analysis.icp_profile && (
                    <p style={{ fontSize: "11pt", marginBottom: "4px" }}><strong>Perfil ICP:</strong> {demandPlan.context_analysis.icp_profile}</p>
                  )}
                  {demandPlan.context_analysis.key_insight && (
                    <p style={{ fontSize: "11pt", marginBottom: "4px" }}><strong>Insight Principal:</strong> {demandPlan.context_analysis.key_insight}</p>
                  )}
                  {demandPlan.context_analysis.market_challenges && (
                    <p style={{ fontSize: "11pt" }}><strong>Desafios:</strong> {demandPlan.context_analysis.market_challenges}</p>
                  )}
                </div>
              </div>
            )}

            {/* Estratégia Principal */}
            {demandPlan.primary_strategy && (
              <div style={sectionStyle}>
                <h3 style={subHeadingStyle}>🎯 Estratégia Principal: {demandPlan.primary_strategy.channel}</h3>
                <div style={{ backgroundColor: "#f5f3ff", padding: "12px", borderRadius: "6px", border: "1px solid #7c3aed" }}>
                  {demandPlan.primary_strategy.budget_percentage && (
                    <div style={{ marginBottom: "8px" }}>
                      <span style={badgeOutlineStyle}>{demandPlan.primary_strategy.budget_percentage}% do budget</span>
                    </div>
                  )}
                  {demandPlan.primary_strategy.campaign_type && (
                    <p style={{ fontSize: "11pt", marginBottom: "4px" }}><strong>Campanha:</strong> {demandPlan.primary_strategy.campaign_type}</p>
                  )}
                  {demandPlan.primary_strategy.expected_cpl && (
                    <p style={{ fontSize: "11pt", marginBottom: "8px" }}><strong>CPL Esperado:</strong> {demandPlan.primary_strategy.expected_cpl}</p>
                  )}
                </div>

                {/* Públicos-alvo */}
                {demandPlan.primary_strategy.audiences && demandPlan.primary_strategy.audiences.length > 0 && (
                  <div style={{ marginTop: "12px" }}>
                    <h4 style={{ fontSize: "11pt", fontWeight: "600", marginBottom: "8px" }}>👥 Públicos-alvo ({demandPlan.primary_strategy.audiences.length})</h4>
                    {demandPlan.primary_strategy.audiences.map((aud, i) => renderAudience(aud, i))}
                  </div>
                )}

                {/* Tipos de Criativos */}
                {demandPlan.primary_strategy.creative_types && demandPlan.primary_strategy.creative_types.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <p style={{ fontSize: "11pt", fontWeight: "600", marginBottom: "4px" }}>🎨 Tipos de Criativos:</p>
                    <div>
                      {demandPlan.primary_strategy.creative_types.map((ct, i) => (
                        <span key={i} style={badgeOutlineStyle}>{ct}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* KPIs */}
                {demandPlan.primary_strategy.kpis && demandPlan.primary_strategy.kpis.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <p style={{ fontSize: "11pt", fontWeight: "600", marginBottom: "4px" }}>📊 KPIs:</p>
                    <div>
                      {demandPlan.primary_strategy.kpis.map((kpi, i) => (
                        <span key={i} style={badgeOutlineStyle}>{kpi}</span>
                      ))}
                    </div>
                  </div>
                )}
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
                      {strategy.role && <p style={{ fontSize: "10pt", color: "#6b7280", marginBottom: "2px" }}>{strategy.role}</p>}
                      {strategy.integration && <p style={{ fontSize: "10pt", color: "#7c3aed" }}>→ {strategy.integration}</p>}
                      {strategy.tactics && <p style={{ fontSize: "10pt", marginTop: "2px" }}><strong>Táticas:</strong> {strategy.tactics}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Funil de Aquisição */}
            {demandPlan.acquisition_funnel && (
              <div style={sectionStyle}>
                <h3 style={subHeadingStyle}>📈 Funil de Aquisição</h3>
                {demandPlan.acquisition_funnel.tofu && renderFunnelStage(demandPlan.acquisition_funnel.tofu, "TOPO", "🔵")}
                {demandPlan.acquisition_funnel.mofu && renderFunnelStage(demandPlan.acquisition_funnel.mofu, "MEIO", "🟡")}
                {demandPlan.acquisition_funnel.bofu && renderFunnelStage(demandPlan.acquisition_funnel.bofu, "FUNDO", "🟢")}
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
                      {typeof syn === "string" ? syn : JSON.stringify(syn)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cronograma */}
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
