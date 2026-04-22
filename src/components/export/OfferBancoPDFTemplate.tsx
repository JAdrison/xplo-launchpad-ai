import logoXplo from "@/assets/logo-xplo.png";

interface OfferBancoPDFTemplateProps {
  clientName: string;
  createdAt: string;
  text: string;
}

export function OfferBancoPDFTemplate({ clientName, createdAt, text }: OfferBancoPDFTemplateProps) {
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
        lineHeight: 1.6,
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

      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24pt", fontWeight: 700, color: "#7c3aed", marginBottom: "8px" }}>
          BANCO DE OFERTAS
        </h1>
        <p style={{ fontSize: "14pt", color: "#374151" }}>
          Cliente: <strong>{clientName}</strong>
        </p>
      </div>

      <div
        style={{
          backgroundColor: "#fafafa",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "20px",
          whiteSpace: "pre-wrap",
          fontSize: "11pt",
          color: "#1f2937",
          lineHeight: 1.7,
        }}
      >
        {text}
      </div>

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
        <p style={{ margin: 0 }}>Documento gerado automaticamente pela plataforma XPLO em {formattedDate}</p>
      </div>
    </div>
  );
}
