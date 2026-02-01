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
    created_at: string;
  };
  clientName: string;
}

export function OfferPDFTemplate({ offer, clientName }: OfferPDFTemplateProps) {
  const getSelectedText = (field: keyof GeneratedOptions): string => {
    const options = (offer.generated_options as GeneratedOptions)?.[field];
    const selected = (offer.selected_options as SelectedOptions)?.[field];
    
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

  return (
    <div style={{ 
      width: "210mm", 
      minHeight: "297mm", 
      padding: "20mm",
      backgroundColor: "#ffffff",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "12pt",
      lineHeight: "1.6",
      color: "#1a1a1a"
    }}>
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
          <div style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
            <h2 style={{ 
              fontSize: "14pt", 
              fontWeight: "600", 
              color: "#7c3aed",
              marginBottom: "8px",
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "4px"
            }}>
              PROMESSA PRINCIPAL
            </h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{getSelectedText("promise")}</p>
          </div>
        )}

        {/* Mecanismo Único */}
        {getSelectedText("unique_mechanism") && (
          <div style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
            <h2 style={{ 
              fontSize: "14pt", 
              fontWeight: "600", 
              color: "#7c3aed",
              marginBottom: "8px",
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "4px"
            }}>
              MECANISMO ÚNICO
            </h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{getSelectedText("unique_mechanism")}</p>
          </div>
        )}

        {/* Garantia */}
        {getSelectedText("guarantee") && (
          <div style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
            <h2 style={{ 
              fontSize: "14pt", 
              fontWeight: "600", 
              color: "#7c3aed",
              marginBottom: "8px",
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "4px"
            }}>
              GARANTIA
            </h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{getSelectedText("guarantee")}</p>
          </div>
        )}

        {/* Prova Social */}
        {getSelectedText("proof") && (
          <div style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
            <h2 style={{ 
              fontSize: "14pt", 
              fontWeight: "600", 
              color: "#7c3aed",
              marginBottom: "8px",
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "4px"
            }}>
              PROVA SOCIAL
            </h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{getSelectedText("proof")}</p>
          </div>
        )}

        {/* Reversão de Risco */}
        {getSelectedText("risk_reversal") && (
          <div style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
            <h2 style={{ 
              fontSize: "14pt", 
              fontWeight: "600", 
              color: "#7c3aed",
              marginBottom: "8px",
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "4px"
            }}>
              REVERSÃO DE RISCO
            </h2>
            <p style={{ whiteSpace: "pre-wrap" }}>{getSelectedText("risk_reversal")}</p>
          </div>
        )}

        {/* Pilha de Valor */}
        {valueStack.length > 0 && (
          <div style={{ pageBreakInside: "avoid", breakInside: "avoid" }}>
            <h2 style={{ 
              fontSize: "14pt", 
              fontWeight: "600", 
              color: "#7c3aed",
              marginBottom: "8px",
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "4px"
            }}>
              PILHA DE VALOR
            </h2>
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
            marginTop: "16px",
            padding: "16px",
            backgroundColor: "#f5f3ff",
            borderRadius: "8px",
            border: "1px solid #7c3aed",
            pageBreakInside: "avoid",
            breakInside: "avoid",
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
      </div>
    </div>
  );
}
