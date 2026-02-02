import logoXplo from "@/assets/logo-xplo.png";

interface OnboardingPDFTemplateProps {
  clientName: string;
  createdAt: string;
  product: {
    name: string | null;
    description: string | null;
    differentiators: string[];
  };
  icps: Array<{
    name: string;
    segment: string | null;
    characteristics: string | null;
    current_situation: string | null;
  }>;
  pains: Array<{
    icp_name: string;
    main_pain: string | null;
    consequence: string | null;
    daily_impacts: string[];
  }>;
  promise: string | null;
}

const sectionStyle: React.CSSProperties = {
  marginBottom: "25px",
  paddingBottom: "15mm",
  pageBreakInside: "avoid",
  breakInside: "avoid",
};

const itemStyle: React.CSSProperties = {
  marginBottom: "12px",
  paddingBottom: "8px",
  pageBreakInside: "avoid",
  breakInside: "avoid",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "14pt",
  fontWeight: 600,
  color: "#7c3aed",
  marginBottom: "12px",
  borderBottom: "1px solid #e5e7eb",
  paddingBottom: "6px",
  pageBreakAfter: "avoid",
};

const labelStyle: React.CSSProperties = {
  fontSize: "10pt",
  color: "#6b7280",
  marginBottom: "4px",
};

const valueStyle: React.CSSProperties = {
  fontSize: "11pt",
  color: "#1f2937",
  marginBottom: "8px",
};

export function OnboardingPDFTemplate({
  clientName,
  createdAt,
  product,
  icps,
  pains,
  promise,
}: OnboardingPDFTemplateProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "5mm",
        paddingBottom: "20mm",
        backgroundColor: "#ffffff",
        fontFamily: "Arial, sans-serif",
        fontSize: "11pt",
        color: "#1f2937",
        lineHeight: 1.5,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          paddingBottom: "15px",
          borderBottom: "2px solid #7c3aed",
        }}
      >
        <img
          src={logoXplo}
          alt="XPLO"
          style={{ height: "40px", objectFit: "contain" }}
        />
        <span style={{ fontSize: "10pt", color: "#6b7280" }}>
          {formattedDate}
        </span>
      </div>

      {/* Title */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "30px",
          pageBreakInside: "avoid",
        }}
      >
        <h1
          style={{
            fontSize: "24pt",
            fontWeight: 700,
            color: "#7c3aed",
            marginBottom: "8px",
          }}
        >
          ONBOARDING X1
        </h1>
        <p style={{ fontSize: "14pt", color: "#374151" }}>
          Cliente: <strong>{clientName}</strong>
        </p>
      </div>

      {/* Produto Section */}
      {(product.name || product.description || product.differentiators.length > 0) && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>PRODUTO</h2>
          
          {product.name && (
            <div style={itemStyle}>
              <p style={labelStyle}>Nome do Produto/Serviço</p>
              <p style={{ ...valueStyle, fontWeight: 600, fontSize: "12pt" }}>
                {product.name}
              </p>
            </div>
          )}

          {product.description && (
            <div style={itemStyle}>
              <p style={labelStyle}>Descrição</p>
              <p style={valueStyle}>{product.description}</p>
            </div>
          )}

          {product.differentiators.length > 0 && (
            <div style={itemStyle}>
              <p style={labelStyle}>Diferenciais</p>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {product.differentiators.map((diff, idx) => (
                  <li key={idx} style={{ ...valueStyle, marginBottom: "4px" }}>
                    {diff}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ICPs Section */}
      {icps.length > 0 && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>PERFIL DO CLIENTE IDEAL (ICPs)</h2>
          
          {icps.map((icp, index) => (
            <div
              key={index}
              style={{
                ...itemStyle,
                backgroundColor: "#f9fafb",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #e5e7eb",
              }}
            >
              <p
                style={{
                  fontSize: "12pt",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                {index + 1}. {icp.name}
              </p>

              {icp.segment && (
                <p style={valueStyle}>
                  <span style={labelStyle}>Segmento: </span>
                  {icp.segment}
                </p>
              )}

              {icp.characteristics && (
                <p style={valueStyle}>
                  <span style={labelStyle}>Características: </span>
                  {icp.characteristics}
                </p>
              )}

              {icp.current_situation && (
                <p style={valueStyle}>
                  <span style={labelStyle}>Situação Atual: </span>
                  {icp.current_situation}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dores Section */}
      {pains.length > 0 && pains.some((p) => p.main_pain) && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>MAPEAMENTO DE DORES</h2>
          
          {pains
            .filter((pain) => pain.main_pain)
            .map((pain, index) => (
              <div
                key={index}
                style={{
                  ...itemStyle,
                  backgroundColor: "#fef2f2",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #fecaca",
                }}
              >
                <p
                  style={{
                    fontSize: "11pt",
                    fontWeight: 600,
                    color: "#7c3aed",
                    marginBottom: "8px",
                  }}
                >
                  {pain.icp_name}
                </p>

                <p style={valueStyle}>
                  <span style={labelStyle}>Dor Principal: </span>
                  <strong>{pain.main_pain}</strong>
                </p>

                {pain.consequence && (
                  <p style={valueStyle}>
                    <span style={labelStyle}>Consequência: </span>
                    {pain.consequence}
                  </p>
                )}

                {pain.daily_impacts.length > 0 && (
                  <div>
                    <p style={labelStyle}>Impactos no Dia-a-Dia:</p>
                    <ul style={{ margin: 0, paddingLeft: "20px" }}>
                      {pain.daily_impacts.map((impact, idx) => (
                        <li key={idx} style={{ ...valueStyle, marginBottom: "2px" }}>
                          {impact}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Promessa Section */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>PROMESSA</h2>
        
        {promise ? (
          <div
            style={{
              backgroundColor: "#f5f3ff",
              padding: "16px",
              borderRadius: "8px",
              border: "2px solid #c4b5fd",
              pageBreakInside: "avoid",
            }}
          >
            <p
              style={{
                fontSize: "13pt",
                fontStyle: "italic",
                color: "#5b21b6",
                textAlign: "center",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              "{promise}"
            </p>
          </div>
        ) : (
          <p style={{ ...valueStyle, color: "#9ca3af", fontStyle: "italic" }}>
            (Promessa ainda não definida)
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "30px",
          paddingTop: "15px",
          borderTop: "1px solid #e5e7eb",
          textAlign: "center",
          fontSize: "9pt",
          color: "#9ca3af",
        }}
      >
        <p>Documento gerado automaticamente pela plataforma XPLO</p>
      </div>
    </div>
  );
}
