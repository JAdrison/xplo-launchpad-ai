import logoXplo from "@/assets/logo-xplo.png";
import { maskCNPJ, maskCPF, maskPhone } from "@/lib/utils";

interface Competitor {
  name: string;
  reason: string;
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
  };
  pains: {
    main_pain: string | null;
    secondary_pain: string | null;
    daily_impacts: string[];
    desire_1: string | null;
    desire_2: string | null;
  };
  market: {
    current_revenue: string | null;
    monthly_investment: string | null;
    initial_traffic_investment: string | null;
    demand_channels: string[];
    sales_team_size: string | null;
    revenue_goal: string | null;
    instagram_link: string | null;
    instagram_login: string | null;
    facebook_login: string | null;
    local_competitor_1: Competitor | null;
    local_competitor_2: Competitor | null;
    inspiration_company_1: Competitor | null;
    inspiration_company_2: Competitor | null;
  };
  icps: Array<{
    name: string;
    who_is: string | null;
    when_seeks: string | null;
    why_buys: string | null;
    is_ideal: string | null;
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

const SALES_MODEL_LABELS: Record<string, string> = {
  b2b: "B2B (Empresa para Empresa)",
  b2c: "B2C (Direto ao Consumidor)",
  recurring: "Recorrente (Assinaturas)",
  project: "Por Projeto",
  hybrid: "Híbrido",
};

const REVENUE_LABELS: Record<string, string> = {
  ate_10k: "Até R$ 10.000",
  "10k_30k": "R$ 10.000 - R$ 30.000",
  "30k_50k": "R$ 30.000 - R$ 50.000",
  "50k_100k": "R$ 50.000 - R$ 100.000",
  "100k_200k": "R$ 100.000 - R$ 200.000",
  acima_200k: "Acima de R$ 200.000",
};

const INVESTMENT_LABELS: Record<string, string> = {
  nenhum: "Nenhum investimento",
  ate_1k: "Até R$ 1.000",
  "1k_5k": "R$ 1.000 - R$ 5.000",
  "5k_10k": "R$ 5.000 - R$ 10.000",
  "10k_20k": "R$ 10.000 - R$ 20.000",
  acima_20k: "Acima de R$ 20.000",
};

const TEAM_SIZE_LABELS: Record<string, string> = {
  solo: "Só eu",
  "1_3": "1 a 3 pessoas",
  "4_10": "4 a 10 pessoas",
  acima_10: "Mais de 10 pessoas",
};

const CHANNEL_LABELS: Record<string, string> = {
  instagram: "Instagram/Redes Sociais",
  google_ads: "Google Ads",
  facebook_ads: "Facebook/Meta Ads",
  linkedin: "LinkedIn",
  indicacoes: "Indicações",
  eventos: "Eventos",
  organico: "Tráfego Orgânico/SEO",
  email: "E-mail Marketing",
};

export function OnboardingPDFTemplate({
  clientName,
  createdAt,
  client,
  company,
  product,
  pains,
  market,
  icps,
  promise,
}: OnboardingPDFTemplateProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const formatChannel = (channel: string) => {
    if (channel.startsWith("outro:")) {
      return channel.replace("outro:", "");
    }
    return CHANNEL_LABELS[channel] || channel;
  };

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

      {/* Dados do Cliente */}
      {(client.cnpj || client.responsible_name || client.email || client.phone) && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>DADOS DO CLIENTE</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {client.cnpj && (
              <div style={itemStyle}>
                <p style={labelStyle}>CNPJ</p>
                <p style={valueStyle}>{maskCNPJ(client.cnpj.replace(/\D/g, ""))}</p>
              </div>
            )}
            {client.responsible_name && (
              <div style={itemStyle}>
                <p style={labelStyle}>Responsável</p>
                <p style={valueStyle}>{client.responsible_name}</p>
              </div>
            )}
            {client.responsible_cpf && (
              <div style={itemStyle}>
                <p style={labelStyle}>CPF do Responsável</p>
                <p style={valueStyle}>{maskCPF(client.responsible_cpf.replace(/\D/g, ""))}</p>
              </div>
            )}
            {client.email && (
              <div style={itemStyle}>
                <p style={labelStyle}>E-mail</p>
                <p style={valueStyle}>{client.email}</p>
              </div>
            )}
            {client.phone && (
              <div style={itemStyle}>
                <p style={labelStyle}>Telefone</p>
                <p style={valueStyle}>{maskPhone(client.phone.replace(/\D/g, ""))}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empresa Section */}
      {(company.niche || company.regions.length > 0) && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>EMPRESA</h2>
          
          {company.niche && (
            <div style={itemStyle}>
              <p style={labelStyle}>Nicho/Segmento</p>
              <p style={{ ...valueStyle, fontWeight: 600 }}>{company.niche}</p>
            </div>
          )}

          {company.regions.length > 0 && (
            <div style={itemStyle}>
              <p style={labelStyle}>Regiões de Atuação</p>
              <p style={valueStyle}>{company.regions.join(", ")}</p>
            </div>
          )}
        </div>
      )}

      {/* Produto Section */}
      {(product.name || product.description || product.differentiators.length > 0) && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>PRODUTO</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {product.name && (
              <div style={itemStyle}>
                <p style={labelStyle}>Nome do Produto/Serviço</p>
                <p style={{ ...valueStyle, fontWeight: 600, fontSize: "12pt" }}>
                  {product.name}
                </p>
              </div>
            )}
            
            {product.average_ticket && (
              <div style={itemStyle}>
                <p style={labelStyle}>Ticket Médio</p>
                <p style={valueStyle}>{product.average_ticket}</p>
              </div>
            )}

            {product.sales_model && (
              <div style={itemStyle}>
                <p style={labelStyle}>Modelo de Venda</p>
                <p style={valueStyle}>{SALES_MODEL_LABELS[product.sales_model] || product.sales_model}</p>
              </div>
            )}
          </div>

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

          {product.benefits.length > 0 && (
            <div style={itemStyle}>
              <p style={labelStyle}>Benefícios</p>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {product.benefits.map((benefit, idx) => (
                  <li key={idx} style={{ ...valueStyle, marginBottom: "4px" }}>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.promotions && (
            <div style={itemStyle}>
              <p style={labelStyle}>Promoções Ativas</p>
              <p style={valueStyle}>{product.promotions}</p>
            </div>
          )}
        </div>
      )}

      {/* Dores e Desejos Section */}
      {(pains.main_pain || pains.secondary_pain || pains.desire_1) && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>DORES E DESEJOS DO COMPRADOR</h2>
          
          {pains.main_pain && (
            <div style={itemStyle}>
              <p style={labelStyle}>Dor Principal</p>
              <p style={{ ...valueStyle, fontWeight: 600 }}>{pains.main_pain}</p>
            </div>
          )}

          {pains.secondary_pain && (
            <div style={itemStyle}>
              <p style={labelStyle}>Dor Secundária</p>
              <p style={valueStyle}>{pains.secondary_pain}</p>
            </div>
          )}

          {pains.daily_impacts.length > 0 && (
            <div style={itemStyle}>
              <p style={labelStyle}>Impactos no Dia-a-Dia</p>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {pains.daily_impacts.map((impact, idx) => (
                  <li key={idx} style={{ ...valueStyle, marginBottom: "2px" }}>
                    {impact}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(pains.desire_1 || pains.desire_2) && (
            <div style={itemStyle}>
              <p style={labelStyle}>Desejos</p>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {pains.desire_1 && <li style={{ ...valueStyle, marginBottom: "4px" }}>{pains.desire_1}</li>}
                {pains.desire_2 && <li style={{ ...valueStyle, marginBottom: "4px" }}>{pains.desire_2}</li>}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Mercado Section */}
      {(market.current_revenue || market.monthly_investment || market.demand_channels.length > 0) && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>MERCADO E INVESTIMENTO</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {market.current_revenue && (
              <div style={itemStyle}>
                <p style={labelStyle}>Faturamento Atual</p>
                <p style={valueStyle}>{REVENUE_LABELS[market.current_revenue] || market.current_revenue}</p>
              </div>
            )}

            {market.revenue_goal && (
              <div style={itemStyle}>
                <p style={labelStyle}>Meta de Faturamento</p>
                <p style={{ ...valueStyle, fontWeight: 600, color: "#7c3aed" }}>{market.revenue_goal}</p>
              </div>
            )}

            {market.monthly_investment && (
              <div style={itemStyle}>
                <p style={labelStyle}>Investimento Mensal em Marketing</p>
                <p style={valueStyle}>{INVESTMENT_LABELS[market.monthly_investment] || market.monthly_investment}</p>
              </div>
            )}

            {market.initial_traffic_investment && (
              <div style={itemStyle}>
                <p style={labelStyle}>Investimento Inicial em Tráfego</p>
                <p style={valueStyle}>R$ {market.initial_traffic_investment}</p>
              </div>
            )}

            {market.sales_team_size && (
              <div style={itemStyle}>
                <p style={labelStyle}>Tamanho da Equipe de Vendas</p>
                <p style={valueStyle}>{TEAM_SIZE_LABELS[market.sales_team_size] || market.sales_team_size}</p>
              </div>
            )}
          </div>

          {market.demand_channels.length > 0 && (
            <div style={itemStyle}>
              <p style={labelStyle}>Canais de Geração de Demanda</p>
              <p style={valueStyle}>{market.demand_channels.map(formatChannel).join(", ")}</p>
            </div>
          )}
        </div>
      )}

      {/* Concorrentes Section */}
      {(market.local_competitor_1?.name || market.local_competitor_2?.name || market.inspiration_company_1?.name || market.inspiration_company_2?.name) && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>ANÁLISE COMPETITIVA</h2>
          
          {(market.local_competitor_1?.name || market.local_competitor_2?.name) && (
            <div style={itemStyle}>
              <p style={labelStyle}>Concorrentes Locais</p>
              {market.local_competitor_1?.name && (
                <p style={valueStyle}>
                  <strong>{market.local_competitor_1.name}</strong>
                  {market.local_competitor_1.reason && ` - ${market.local_competitor_1.reason}`}
                </p>
              )}
              {market.local_competitor_2?.name && (
                <p style={valueStyle}>
                  <strong>{market.local_competitor_2.name}</strong>
                  {market.local_competitor_2.reason && ` - ${market.local_competitor_2.reason}`}
                </p>
              )}
            </div>
          )}

          {(market.inspiration_company_1?.name || market.inspiration_company_2?.name) && (
            <div style={itemStyle}>
              <p style={labelStyle}>Empresas que Inspiram</p>
              {market.inspiration_company_1?.name && (
                <p style={valueStyle}>
                  <strong>{market.inspiration_company_1.name}</strong>
                  {market.inspiration_company_1.reason && ` - ${market.inspiration_company_1.reason}`}
                </p>
              )}
              {market.inspiration_company_2?.name && (
                <p style={valueStyle}>
                  <strong>{market.inspiration_company_2.name}</strong>
                  {market.inspiration_company_2.reason && ` - ${market.inspiration_company_2.reason}`}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Redes Sociais Section */}
      {(market.instagram_link || market.instagram_login || market.facebook_login) && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>REDES SOCIAIS (META ADS)</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {market.instagram_link && (
              <div style={itemStyle}>
                <p style={labelStyle}>Instagram</p>
                <p style={valueStyle}>{market.instagram_link}</p>
              </div>
            )}
            {market.instagram_login && (
              <div style={itemStyle}>
                <p style={labelStyle}>Login Instagram</p>
                <p style={valueStyle}>{market.instagram_login}</p>
              </div>
            )}
            {market.facebook_login && (
              <div style={itemStyle}>
                <p style={labelStyle}>Login Facebook</p>
                <p style={valueStyle}>{market.facebook_login}</p>
              </div>
            )}
          </div>
          
          <p style={{ fontSize: "9pt", color: "#9ca3af", fontStyle: "italic", marginTop: "8px" }}>
            Nota: Por segurança, as senhas não são exibidas neste documento.
          </p>
        </div>
      )}

      {/* Perfis dos Principais Clientes Section */}
      {icps.length > 0 && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>PERFIS DOS PRINCIPAIS CLIENTES</h2>
          
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <p
                  style={{
                    fontSize: "12pt",
                    fontWeight: 600,
                    color: "#374151",
                    margin: 0,
                  }}
                >
                  {index + 1}. {icp.name}
                </p>
                {icp.is_ideal && (
                  <span
                    style={{
                      fontSize: "9pt",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      backgroundColor: icp.is_ideal === "ideal" ? "#dcfce7" : icp.is_ideal === "good_not_ideal" ? "#fef3c7" : "#fee2e2",
                      color: icp.is_ideal === "ideal" ? "#166534" : icp.is_ideal === "good_not_ideal" ? "#92400e" : "#991b1b",
                    }}
                  >
                    {icp.is_ideal === "ideal" ? "Cliente Ideal" : icp.is_ideal === "good_not_ideal" ? "Bom, mas não ideal" : "Não quer mais"}
                  </span>
                )}
              </div>

              {icp.who_is && (
                <p style={{ ...valueStyle, marginTop: "8px" }}>
                  <span style={{ ...labelStyle, fontWeight: 600 }}>Quem é: </span>
                  {icp.who_is}
                </p>
              )}

              {icp.when_seeks && (
                <p style={valueStyle}>
                  <span style={{ ...labelStyle, fontWeight: 600 }}>Quando procura: </span>
                  {icp.when_seeks}
                </p>
              )}

              {icp.why_buys && (
                <p style={valueStyle}>
                  <span style={{ ...labelStyle, fontWeight: 600 }}>Por que compra: </span>
                  {icp.why_buys}
                </p>
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