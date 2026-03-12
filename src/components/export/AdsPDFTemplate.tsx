import logoXplo from "@/assets/logo-xplo.png";
import type { Tables } from "@/integrations/supabase/types";

type Ad = Tables<"ads">;

interface AdsPDFTemplateProps {
  clientName: string;
  createdAt: string;
  videoAds: Ad[];
  staticAds: Ad[];
}

const focusLabels: Record<string, string> = {
  main_pain: "Dor Principal",
  secondary_pain: "Dor Secundária",
  impact_1: "Impacto 1",
  impact_2: "Impacto 2",
  consequence: "Consequência",
  desire_1: "Desejo 1",
  desire_2: "Desejo 2",
  promise: "Promessa",
  result: "Resultado",
  transformation: "Transformação",
};

const videoTypeLabels: Record<string, string> = {
  pattern_break: "Quebra de Padrão",
  question_box: "Caixinha de Perguntas",
  daily_scene: "Cotidiano + Problema",
  location_based: "Direcionado para Região",
  social_proof: "Prova Social",
  direct: "Direto",
  educational: "Educacional",
};

export function AdsPDFTemplate({ clientName, createdAt, videoAds, staticAds }: AdsPDFTemplateProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Separate static ads by angle
  const painBasedAds = staticAds.filter(ad => ad.angle === "pain");
  const desireBasedAds = staticAds.filter(ad => ad.angle === "desire");
  const otherAds = staticAds.filter(ad => !ad.angle);

  // Container style with safe margins
  const containerStyle: React.CSSProperties = {
    padding: "15mm",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "12px",
    lineHeight: 1.5,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
    maxWidth: "210mm",
  };

  // Card style to prevent page breaks inside
  const cardStyle: React.CSSProperties = {
    pageBreakInside: "avoid",
    breakInside: "avoid",
    marginBottom: "10mm",
    padding: "12px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    backgroundColor: "#fafafa",
  };

  // Section title style (prevents break after)
  const sectionTitleStyle: React.CSSProperties = {
    pageBreakAfter: "avoid",
    breakAfter: "avoid",
    marginTop: "20px",
    marginBottom: "15mm",
    paddingBottom: "8px",
    borderBottom: "2px solid #e5e7eb",
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
  };

  // Video section label style
  const videoSectionStyle: React.CSSProperties = {
    backgroundColor: "#f3f4f6",
    padding: "8px 10px",
    borderRadius: "4px",
    marginBottom: "6px",
  };

  const renderStaticAd = (ad: Ad, idx: number) => (
    <div key={ad.id} style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ 
          backgroundColor: ad.angle === "pain" ? "#fee2e2" : "#dbeafe", 
          color: ad.angle === "pain" ? "#991b1b" : "#1e40af",
          padding: "2px 8px", 
          borderRadius: "4px", 
          fontSize: "11px",
          fontWeight: 500 
        }}>
          {focusLabels[ad.focus || ""] || ad.focus || ad.ad_angle || `Anúncio ${idx + 1}`}
        </span>
      </div>

      {ad.headline && (
        <p style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>{ad.headline}</p>
      )}
      {ad.subheadline && (
        <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>{ad.subheadline}</p>
      )}
      {ad.body_text && (
        <p style={{ fontSize: "11px", marginBottom: "8px" }}>{ad.body_text}</p>
      )}
      {ad.eliminators && ad.eliminators.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
          {ad.eliminators.map((el, i) => (
            <span key={i} style={{ 
              border: "1px solid #d1d5db", 
              padding: "2px 6px", 
              borderRadius: "4px", 
              fontSize: "10px" 
            }}>
              {el}
            </span>
          ))}
        </div>
      )}
      {ad.cta && (
        <p style={{ fontSize: "12px", fontWeight: 500, color: "#2563eb" }}>{ad.cta}</p>
      )}
      {ad.visual_suggestion && (
        <p style={{ fontSize: "10px", color: "#9ca3af", fontStyle: "italic", marginTop: "6px", borderTop: "1px solid #e5e7eb", paddingTop: "6px" }}>
          💡 {ad.visual_suggestion}
        </p>
      )}
    </div>
  );

  const renderVideoAd = (ad: Ad, idx: number) => (
    <div key={ad.id} style={{
      ...cardStyle,
      ...(idx > 0 ? { pageBreakBefore: "always", breakBefore: "page" } : {}),
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span style={{ 
          backgroundColor: "#f3e8ff", 
          color: "#6b21a8",
          padding: "2px 8px", 
          borderRadius: "4px", 
          fontSize: "11px",
          fontWeight: 500 
        }}>
          {videoTypeLabels[ad.video_type || ad.ad_angle || ""] || ad.ad_angle || `Vídeo ${idx + 1}`}
        </span>
        {ad.video_duration && (
          <span style={{ 
            backgroundColor: "#e5e7eb", 
            padding: "2px 8px", 
            borderRadius: "4px", 
            fontSize: "11px" 
          }}>
            {ad.video_duration}
          </span>
        )}
      </div>

      {ad.video_hook && (
        <div style={videoSectionStyle}>
          <p style={{ fontSize: "10px", color: "#6b7280", fontWeight: 500, marginBottom: "2px" }}>HOOK</p>
          <p style={{ fontSize: "11px" }}>{ad.video_hook}</p>
        </div>
      )}
      {ad.video_problem && (
        <div style={videoSectionStyle}>
          <p style={{ fontSize: "10px", color: "#6b7280", fontWeight: 500, marginBottom: "2px" }}>PROBLEMA</p>
          <p style={{ fontSize: "11px" }}>{ad.video_problem}</p>
        </div>
      )}
      {ad.video_why_bad && (
        <div style={videoSectionStyle}>
          <p style={{ fontSize: "10px", color: "#6b7280", fontWeight: 500, marginBottom: "2px" }}>POR QUE ISSO É RUIM</p>
          <p style={{ fontSize: "11px" }}>{ad.video_why_bad}</p>
        </div>
      )}
      {ad.video_solution && (
        <div style={videoSectionStyle}>
          <p style={{ fontSize: "10px", color: "#6b7280", fontWeight: 500, marginBottom: "2px" }}>SOLUÇÃO</p>
          <p style={{ fontSize: "11px" }}>{ad.video_solution}</p>
        </div>
      )}
      {ad.video_cta && (
        <div style={{ ...videoSectionStyle, backgroundColor: "#dbeafe" }}>
          <p style={{ fontSize: "10px", color: "#1e40af", fontWeight: 500, marginBottom: "2px" }}>CTA</p>
          <p style={{ fontSize: "11px", fontWeight: 500, color: "#1e40af" }}>{ad.video_cta}</p>
        </div>
      )}
      {ad.video_visual_notes && (
        <div style={{ marginTop: "8px", padding: "8px", border: "1px dashed #d1d5db", borderRadius: "4px" }}>
          <p style={{ fontSize: "10px", color: "#6b7280", fontWeight: 500, marginBottom: "2px" }}>NOTAS VISUAIS</p>
          <p style={{ fontSize: "11px", color: "#6b7280" }}>{ad.video_visual_notes}</p>
        </div>
      )}
    </div>
  );

  return (
    <div style={containerStyle}>
      {/* Logo fixa em todas as páginas - canto superior direito */}
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "15px", borderBottom: "2px solid #1a1a1a" }}>
        <img src={logoXplo} alt="XPLO" style={{ height: "40px" }} />
        <span style={{ fontSize: "11px", color: "#6b7280" }}>{formattedDate}</span>
      </div>

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px" }}>ANÚNCIOS GERADOS</h1>
        <p style={{ fontSize: "14px", color: "#6b7280" }}>Cliente: {clientName}</p>
      </div>

      {/* Static Ads - Pain Based */}
      {painBasedAds.length > 0 && (
        <div>
          <h2 style={sectionTitleStyle}>
            ⚠️ ESTÁTICOS — BASEADOS EM DORES ({painBasedAds.length})
          </h2>
          {painBasedAds.map(renderStaticAd)}
        </div>
      )}

      {/* Static Ads - Desire Based */}
      {desireBasedAds.length > 0 && (
        <div>
          <h2 style={sectionTitleStyle}>
            ❤️ ESTÁTICOS — BASEADOS EM DESEJOS ({desireBasedAds.length})
          </h2>
          {desireBasedAds.map(renderStaticAd)}
        </div>
      )}

      {/* Static Ads - Other (Legacy) */}
      {otherAds.length > 0 && (
        <div>
          <h2 style={sectionTitleStyle}>
            📝 OUTROS ANÚNCIOS ESTÁTICOS ({otherAds.length})
          </h2>
          {otherAds.map(renderStaticAd)}
        </div>
      )}

      {/* Video Ads */}
      {videoAds.length > 0 && (
        <div>
          <h2 style={sectionTitleStyle}>
            🎬 ROTEIROS DE VÍDEO ({videoAds.length})
          </h2>
          {videoAds.map(renderVideoAd)}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: "30mm", paddingTop: "10px", borderTop: "1px solid #e5e7eb", textAlign: "center" }}>
        <p style={{ fontSize: "10px", color: "#9ca3af" }}>
          Gerado por XPLO Launchpad AI • {formattedDate}
        </p>
      </div>
    </div>
  );
}
