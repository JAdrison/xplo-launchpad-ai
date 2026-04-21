export type NicheType = "hospedagem" | "saude" | "generico";

export const NICHE_LABELS: Record<NicheType, { client: string; clients: string }> = {
  hospedagem: { client: "hóspede", clients: "hóspedes" },
  saude: { client: "paciente", clients: "pacientes" },
  generico: { client: "cliente", clients: "clientes" },
};

export function clientWord(niche: NicheType | null | undefined, plural = false): string {
  const n = niche ?? "generico";
  return plural ? NICHE_LABELS[n].clients : NICHE_LABELS[n].client;
}
