import logoXplo from "@/assets/logo-xplo.png";
import { maskCNPJ, maskCPF, maskPhone } from "@/lib/utils";
import { humanizeKey, formatValue } from "@/components/onboarding/shared/fieldLabels";

interface Competitor {
  name?: string | null;
  reason?: string | null;
}

interface SwotQuadrant {
  tags: string[];
  text: string;
}

interface OnboardingPDFTemplateProps {
  clientName: string;
  createdAt: string;
  client: {
    cnpj: string | null;
    responsible_name: string | null;
    responsible_cpf: string | null;
    email: string | null;
    phone: string | null;
  };
  company: {
    niche: string | null;
    regions: string[];
  };
  product: {
    name: string | null;
    description: string | null;
    average_ticket: string | null;
    sales_model: string | null;
    differentiators: string[];
    benefits: string[];
    promotions: string | null;
    profile_data?: Record<string, any>;
  };
  swot?: {
    forcas_internas: SwotQuadrant;
    fraquezas_internas: SwotQuadrant;
    forcas_ambiente: SwotQuadrant;
    fraquezas_ambiente: SwotQuadrant;
  } | null;
  market: {
    current_revenue: string | null;
    monthly_investment: string | null;
    initial_traffic_investment: string | null;
    demand_channels: string[];
    sales_team_size?: string | null;
    revenue_goal: string | null;
    instagram_link?: string | null;
    instagram_login?: string | null;
    instagram_password?: string | null;
    facebook_login?: string | null;
    facebook_password?: string | null;
    whatsapp_number?: string | null;
    google_my_business?: string | null;
    local_competitor_1?: Competitor | null;
    local_competitor_2?: Competitor | null;
    inspiration_company_1?: Competitor | null;
    inspiration_company_2?: Competitor | null;
    market_data?: Record<string, any>;
  };
  icp?: {
    bloco1?: Record<string, any> | null;
    bloco2?: Record<string, any> | null;
    bloco3?: Record<string, any> | null;
  } | null;
  generatedIcpText?: string | null;
  generatedOffersText?: string | null;
  // Backward compat (unused mas mantém typing)
  pains?: any;
  icps?: any;
  promise?: string | null;
}

const sectionStyle: React.CSSProperties = {
  marginBottom: "25px",
  paddingBottom: "15mm",
  pageBreakInside: "avoid",
  breakInside: "avoid",
};

const itemStyle: React.CSSProperties = {
  marginBottom: "10px",
  paddingBottom: "4px",
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
  marginBottom: "2px",
};

const valueStyle: React.CSSProperties = {
  fontSize: "11pt",
  color: "#1f2937",
  marginBottom: "6px",
};

const SALES_MODEL_LABELS: Record<string, string> = {
  b2b: "B2B (Empresa para Empresa)",
  b2c: "B2C (Direto ao Consumidor)",
  recurring: "Recorrente (Assinaturas)",
  project: "Por Projeto",
  hybrid: "Híbrido",
};

function FieldRow({ label, value }: { label: string; value: any }) {
  const v = formatValue(value);
  if (v === "—") return null;
  return (
    <div style={itemStyle}>
      <p style={labelStyle}>{label}</p>
      <p style={valueStyle}>{v}</p>
    </div>
  );
}

function JSONBlock({ data }: { data: Record<string, any> | null | undefined }) {
  if (!data || Object.keys(data).length === 0) return null;
  return (
    <>
      {Object.entries(data).map(([k, v]) => (
        <FieldRow key={k} label={humanizeKey(k)} value={v} />
      ))}
    </>
  );
}

function SwotBox({ title, quad }: { title: string; quad: SwotQuadrant }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        padding: "10px",
        marginBottom: "10px",
        pageBreakInside: "avoid",
      }}
    >
      <p style={{ fontSize: "11pt", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>{title}</p>
      {quad.tags.length > 0 && (
        <p style={{ ...valueStyle, marginBottom: "4px" }}>
          <strong>Tags:</strong> {quad.tags.join(", ")}
        </p>
      )}
      {quad.text && (
        <p style={{ ...valueStyle, fontStyle: "italic", color: "#4b5563" }}>{quad.text}</p>
      )}
      {quad.tags.length === 0 && !quad.text && (
        <p style={{ fontSize: "10pt", color: "#9ca3af" }}>Sem informações</p>
      )}
    </div>
  );
}

const ConfidentialBadge = () => (
  <span
    style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: "4px",
      backgroundColor: "#fee2e2",
      color: "#991b1b",
      fontSize: "9pt",
      fontWeight: 600,
      marginLeft: "8px",
    }}
  >
    🔒 CONFIDENCIAL
  </span>
);

export function OnboardingPDFTemplate({
  clientName,
  createdAt,
  client,
  company,
  product,
  swot,
  market,
  icp,
  promise,
  generatedIcpText,
  generatedOffersText,
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
        <img src={logoXplo} alt="XPLO" style={{ height: "40px", objectFit: "contain" }} />
        <span style={{ fontSize: "10pt", color: "#6b7280" }}>{formattedDate}</span>
      </div>

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: "20px", pageBreakInside: "avoid" }}>
        <h1 style={{ fontSize: "24pt", fontWeight: 700, color: "#7c3aed", marginBottom: "8px" }}>
          ONBOARDING X1
        </h1>
        <p style={{ fontSize: "14pt", color: "#374151" }}>
          Cliente: <strong>{clientName}</strong>
        </p>
      </div>

      {/* Confidential warning */}
      <div
        style={{
          backgroundColor: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "6px",
          padding: "10px 14px",
          marginBottom: "20px",
          pageBreakInside: "avoid",
        }}
      >
        <p style={{ fontSize: "10pt", color: "#991b1b", margin: 0 }}>
          🔒 <strong>Documento confidencial</strong> — contém credenciais de acesso (Instagram/Facebook) em texto puro.
          Compartilhe apenas com pessoas autorizadas.
        </p>
      </div>

      {/* 1. CADASTRO */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>1. CADASTRO</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <FieldRow label="Nome do negócio" value={clientName} />
          <FieldRow label="Nicho" value={company.niche} />
          <FieldRow
            label="CNPJ"
            value={client.cnpj ? maskCNPJ(client.cnpj.replace(/\D/g, "")) : null}
          />
          <FieldRow label="Responsável" value={client.responsible_name} />
          <FieldRow
            label="CPF do responsável"
            value={client.responsible_cpf ? maskCPF(client.responsible_cpf.replace(/\D/g, "")) : null}
          />
          <FieldRow label="E-mail" value={client.email} />
          <FieldRow
            label="Telefone"
            value={client.phone ? maskPhone(client.phone.replace(/\D/g, "")) : null}
          />
          <FieldRow label="Faturamento atual" value={market.current_revenue} />
          <FieldRow
            label="Investimento inicial em tráfego"
            value={market.initial_traffic_investment ? `R$ ${market.initial_traffic_investment}` : null}
          />
          <FieldRow label="Regiões de atuação" value={company.regions} />
        </div>
      </div>

      {/* 2. SOBRE O NEGÓCIO */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>2. SOBRE O NEGÓCIO</h2>
        <FieldRow label="Nome do produto/serviço" value={product.name} />
        <FieldRow label="Descrição" value={product.description} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <FieldRow label="Ticket médio" value={product.average_ticket} />
          <FieldRow
            label="Modelo de venda"
            value={product.sales_model ? SALES_MODEL_LABELS[product.sales_model] || product.sales_model : null}
          />
        </div>
        <FieldRow label="Diferenciais" value={product.differentiators} />
        <FieldRow label="Benefícios" value={product.benefits} />
        <FieldRow label="Promoções" value={product.promotions} />
        {product.profile_data && Object.keys(product.profile_data).length > 0 && (
          <>
            <p style={{ ...labelStyle, marginTop: "10px", fontWeight: 600 }}>
              Campos específicos do nicho:
            </p>
            <JSONBlock data={product.profile_data} />
          </>
        )}
      </div>

      {/* 3. DIAGNÓSTICO SWOT */}
      {swot && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>3. DIAGNÓSTICO — PONTOS FORTES E FRACOS</h2>
          <SwotBox title="💪 Ponto forte do negócio" quad={swot.forcas_internas} />
          <SwotBox title="🔧 Ponto fraco do negócio" quad={swot.fraquezas_internas} />
          <SwotBox title="🌤️ Ponto forte da região" quad={swot.forcas_ambiente} />
          <SwotBox title="⚠️ Ponto fraco da região" quad={swot.fraquezas_ambiente} />
        </div>
      )}

      {/* 4. MERCADO */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>4. MERCADO E INVESTIMENTO</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <FieldRow label="Faturamento atual" value={market.current_revenue} />
          <FieldRow label="Meta de faturamento" value={market.revenue_goal} />
          <FieldRow label="Investimento mensal em marketing" value={market.monthly_investment} />
          <FieldRow
            label="Investimento inicial em tráfego"
            value={market.initial_traffic_investment ? `R$ ${market.initial_traffic_investment}` : null}
          />
          <FieldRow label="Tamanho da equipe de vendas" value={market.sales_team_size} />
        </div>
        <FieldRow label="Canais de geração de demanda" value={market.demand_channels} />
        {market.market_data && Object.keys(market.market_data).length > 0 && (
          <>
            <p style={{ ...labelStyle, marginTop: "10px", fontWeight: 600 }}>
              Campos específicos do nicho:
            </p>
            <JSONBlock data={market.market_data} />
          </>
        )}
      </div>

      {/* 5. CONCORRENTES E INSPIRAÇÕES */}
      {(market.local_competitor_1?.name ||
        market.local_competitor_2?.name ||
        market.inspiration_company_1?.name ||
        market.inspiration_company_2?.name) && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>4.1. CONCORRENTES E INSPIRAÇÕES</h2>
          {market.local_competitor_1?.name && (
            <p style={valueStyle}>
              <strong>Concorrente 1: {market.local_competitor_1.name}</strong>
              {market.local_competitor_1.reason && ` — ${market.local_competitor_1.reason}`}
            </p>
          )}
          {market.local_competitor_2?.name && (
            <p style={valueStyle}>
              <strong>Concorrente 2: {market.local_competitor_2.name}</strong>
              {market.local_competitor_2.reason && ` — ${market.local_competitor_2.reason}`}
            </p>
          )}
          {market.inspiration_company_1?.name && (
            <p style={valueStyle}>
              <strong>Inspiração 1: {market.inspiration_company_1.name}</strong>
              {market.inspiration_company_1.reason && ` — ${market.inspiration_company_1.reason}`}
            </p>
          )}
          {market.inspiration_company_2?.name && (
            <p style={valueStyle}>
              <strong>Inspiração 2: {market.inspiration_company_2.name}</strong>
              {market.inspiration_company_2.reason && ` — ${market.inspiration_company_2.reason}`}
            </p>
          )}
        </div>
      )}

      {/* 6. ACESSOS META ADS */}
      {(market.instagram_link ||
        market.instagram_login ||
        market.instagram_password ||
        market.facebook_login ||
        market.facebook_password ||
        market.whatsapp_number ||
        market.google_my_business) && (
        <div
          style={{
            ...sectionStyle,
            border: "2px solid #fecaca",
            borderRadius: "8px",
            padding: "14px",
            backgroundColor: "#fffbfb",
          }}
        >
          <h2 style={sectionTitleStyle}>
            4.2. REDES SOCIAIS E ACESSOS META ADS
            <ConfidentialBadge />
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <FieldRow label="Instagram (link)" value={market.instagram_link} />
            <FieldRow label="Instagram — login" value={market.instagram_login} />
            <FieldRow label="Instagram — senha" value={market.instagram_password} />
            <FieldRow label="Facebook — login" value={market.facebook_login} />
            <FieldRow label="Facebook — senha" value={market.facebook_password} />
            <FieldRow label="WhatsApp comercial" value={market.whatsapp_number} />
            <FieldRow label="Google Meu Negócio" value={market.google_my_business} />
          </div>
          <p style={{ fontSize: "9pt", color: "#991b1b", fontStyle: "italic", marginTop: "8px" }}>
            🔒 Estas credenciais são confidenciais. Não compartilhe este documento publicamente.
          </p>
        </div>
      )}

      {/* 7. PERFIL DOS CLIENTES */}
      {icp && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>5. PERFIL DOS PRINCIPAIS CLIENTES</h2>
          {[
            { title: "Bloco 1 — Cliente que você mais quer", data: icp.bloco1 },
            { title: "Bloco 2 — Cliente bom, mas não ideal", data: icp.bloco2 },
            { title: "Bloco 3 — Cliente que você quer evitar", data: icp.bloco3 },
          ].map((b, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: "#f9fafb",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #e5e7eb",
                marginBottom: "10px",
                pageBreakInside: "avoid",
              }}
            >
              <p style={{ fontSize: "12pt", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
                {b.title}
              </p>
              {b.data && Object.keys(b.data).length > 0 ? (
                <JSONBlock data={b.data} />
              ) : (
                <p style={{ fontSize: "10pt", color: "#9ca3af", fontStyle: "italic" }}>
                  Não preenchido
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 8. PROMESSA */}
      {promise && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>6. PROMESSA</h2>
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
        </div>
      )}

      {/* 7. ICP — CLIENTE IDEAL (gerado por IA) */}
      {generatedIcpText && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>7. ICP — CLIENTE IDEAL</h2>
          <div
            style={{
              backgroundColor: "#fafafa",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              whiteSpace: "pre-wrap",
              fontSize: "10.5pt",
              color: "#1f2937",
              lineHeight: 1.65,
              pageBreakInside: "avoid",
            }}
          >
            {generatedIcpText}
          </div>
        </div>
      )}

      {/* 8. BANCO DE OFERTAS (gerado por IA) */}
      {generatedOffersText && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>8. BANCO DE OFERTAS</h2>
          <div
            style={{
              backgroundColor: "#fafafa",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              whiteSpace: "pre-wrap",
              fontSize: "10.5pt",
              color: "#1f2937",
              lineHeight: 1.65,
              pageBreakInside: "avoid",
            }}
          >
            {generatedOffersText}
          </div>
        </div>
      )}
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
        <p style={{ margin: 0 }}>Documento confidencial gerado automaticamente pela plataforma XPLO em {formattedDate}</p>
      </div>
    </div>
  );
}
