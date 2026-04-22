// Parser para o "Banco de Ofertas" gerado por IA.
// Divide o texto em header, ofertas individuais e footer.
// Tolerante a variações: se não achar marcadores, devolve fallback.

export interface ParsedOffer {
  id: string;
  rawText: string; // bloco da oferta (sem o cabeçalho da parte)
  name: string;
  partLabel: string; // "Entrada", "Continuidade", etc — extraído do título da seção
  offerNumber: number; // número global (1..N)
}

export interface ParsedOfferBank {
  header: string; // texto antes da 1ª oferta
  offers: ParsedOffer[];
  footer: string; // texto após a última oferta
  partHeaders: Array<{ index: number; label: string; rawLine: string }>; // posições onde aparece um cabeçalho de parte
  isFallback: boolean;
}

export interface OfferState {
  enabled?: boolean; // default true
  deleted?: boolean; // default false
}

export type OfferStatesMap = Record<string, OfferState>;

const OFFER_MARKER_RE = /^\s*\[OFERTA\s+(\d+)\]\s*$/im;
// Cabeçalho de parte: linha contendo "BANCO DE OFERTAS — <algo>" (com qualquer emoji antes)
const PART_HEADER_RE = /BANCO\s+DE\s+OFERTAS\s*[—\-:]\s*(.+?)\s*$/i;
const NAME_LINE_RE = /^[^\n]*🏷️[^\n]*NOME[^\n]*$/im;

function makeId(partLabel: string, offerNumber: number) {
  // ID estável baseado em parte + número global
  const slug = partLabel
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "parte"}-${offerNumber}`;
}

function extractOfferName(block: string): string {
  // Procura pela linha logo após "🏷️ NOME DA OFERTA" ou linha que comece com 🏷️
  const lines = block.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/🏷️/.test(line) && /nome/i.test(line)) {
      // pega próxima linha não vazia
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j].trim();
        if (next) return next.replace(/^[*_#>\-•\s]+/, "").trim();
      }
    }
  }
  // fallback: procura por linha com 🏷️
  for (const line of lines) {
    if (/🏷️/.test(line)) {
      const cleaned = line
        .replace(/🏷️/g, "")
        .replace(/nome\s+da\s+oferta/i, "")
        .replace(/^[*_#>\-•:\s]+/, "")
        .trim();
      if (cleaned) return cleaned;
    }
  }
  return "Oferta";
}

export function parseOfferBank(text: string): ParsedOfferBank {
  if (!text || !text.trim()) {
    return { header: "", offers: [], footer: "", partHeaders: [], isFallback: false };
  }

  const lines = text.split("\n");

  // Indices das linhas que começam com [OFERTA N]
  const offerStarts: Array<{ line: number; num: number }> = [];
  // Indices de cabeçalhos de parte (BANCO DE OFERTAS — XXX)
  const partHeaders: Array<{ index: number; label: string; rawLine: string }> = [];

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(OFFER_MARKER_RE);
    if (m) offerStarts.push({ line: i, num: parseInt(m[1], 10) });
    const ph = lines[i].match(PART_HEADER_RE);
    if (ph) partHeaders.push({ index: i, label: ph[1].trim(), rawLine: lines[i] });
  }

  if (offerStarts.length === 0) {
    console.warn("[offerParser] Nenhum marcador [OFERTA N] encontrado — usando fallback.");
    return {
      header: "",
      offers: [],
      footer: text,
      partHeaders,
      isFallback: true,
    };
  }

  const header = lines.slice(0, offerStarts[0].line).join("\n").trim();

  const offers: ParsedOffer[] = [];
  for (let k = 0; k < offerStarts.length; k++) {
    const start = offerStarts[k].line;
    const end = k + 1 < offerStarts.length ? offerStarts[k + 1].line : lines.length;
    // Determinar se há um cabeçalho de parte logo antes (até 2 linhas) — se sim incluir no bloco para preservar contexto, mas aqui vamos manter parte como label apenas
    // Determina partLabel: último partHeader cujo index < start
    let partLabel = "Geral";
    for (const ph of partHeaders) {
      if (ph.index < start) partLabel = ph.label;
      else break;
    }
    // Bloco vai do [OFERTA N] até a próxima oferta ou fim, mas precisamos identificar o footer (texto após última oferta que NÃO pertence a ela). Vamos detectar: se na última oferta houver uma linha tipo "📋 COMO USAR" ou "---" trataremos como footer.
    const blockLines = lines.slice(start, end);
    offers.push({
      id: "", // preenchido depois
      rawText: blockLines.join("\n").trimEnd(),
      name: extractOfferName(blockLines.join("\n")),
      partLabel,
      offerNumber: k + 1,
    });
  }

  // IDs estáveis
  offers.forEach((o) => {
    o.id = makeId(o.partLabel, o.offerNumber);
  });

  // Detectar footer dentro da última oferta: tudo a partir de uma linha que comece com "📋", "Notas", "Como usar", "---" após o conteúdo principal
  let footer = "";
  if (offers.length) {
    const last = offers[offers.length - 1];
    const blkLines = last.rawText.split("\n");
    let footerStart = -1;
    for (let i = 1; i < blkLines.length; i++) {
      const line = blkLines[i].trim();
      if (
        /^📋/.test(line) ||
        /^---+$/.test(line) ||
        /^como\s+usar/i.test(line) ||
        /^notas?\s+/i.test(line) ||
        /^observa[cç][ãa]o/i.test(line)
      ) {
        footerStart = i;
        break;
      }
    }
    if (footerStart > 0) {
      footer = blkLines.slice(footerStart).join("\n").trim();
      last.rawText = blkLines.slice(0, footerStart).join("\n").trimEnd();
    }
  }

  return {
    header,
    offers,
    footer,
    partHeaders,
    isFallback: false,
  };
}

export function getOfferState(states: OfferStatesMap | null | undefined, id: string): Required<OfferState> {
  const s = states?.[id] || {};
  return {
    enabled: s.enabled !== false,
    deleted: s.deleted === true,
  };
}

export function serializeOfferBank(
  parsed: ParsedOfferBank,
  states: OfferStatesMap | null | undefined,
  opts?: { skipDisabled?: boolean }
): string {
  if (parsed.isFallback) {
    return parsed.footer; // footer guarda texto cru no fallback
  }
  const skip = opts?.skipDisabled !== false;
  const parts: string[] = [];
  if (parsed.header) parts.push(parsed.header);

  // Para preservar cabeçalhos de parte (🗓️/🩺/🎁 BANCO DE OFERTAS — X), reinserir antes da primeira oferta de cada parte.
  let currentPart: string | null = null;
  for (const offer of parsed.offers) {
    const st = getOfferState(states, offer.id);
    if (skip && (!st.enabled || st.deleted)) continue;
    if (offer.partLabel !== currentPart) {
      // procurar a rawLine correspondente
      const ph = parsed.partHeaders.find((p) => p.label === offer.partLabel);
      if (ph) parts.push("\n" + ph.rawLine.trim() + "\n");
      currentPart = offer.partLabel;
    }
    parts.push(offer.rawText);
  }
  if (parsed.footer) parts.push("\n" + parsed.footer);
  return parts.join("\n\n").trim();
}

export function replaceOfferBlock(
  parsed: ParsedOfferBank,
  offerId: string,
  newRawText: string,
  states: OfferStatesMap | null | undefined
): string {
  if (parsed.isFallback) return parsed.footer;
  const updated: ParsedOfferBank = {
    ...parsed,
    offers: parsed.offers.map((o) =>
      o.id === offerId ? { ...o, rawText: newRawText.trim(), name: extractOfferName(newRawText) } : o
    ),
  };
  // Serializa SEM pular ofertas desativadas (preservar texto bruto completo)
  return serializeOfferBank(updated, states, { skipDisabled: false });
}
