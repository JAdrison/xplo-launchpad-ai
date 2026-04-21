// Mapa de tradução de chaves técnicas (profile_data, market_data, bloco*_data)
// para labels amigáveis em pt-BR.
export const LABELS_PT: Record<string, string> = {
  // Hospedagem / Negócio
  type: "Tipo de negócio",
  tipo: "Tipo de negócio",
  categoria: "Categoria",
  units: "Unidades / Quartos",
  unidades: "Unidades / Quartos",
  rooms: "Quartos",
  capacity: "Capacidade",
  capacidade: "Capacidade",
  diaria: "Diária média",
  daily_rate: "Diária média",
  ticket: "Ticket médio",
  ticket_medio: "Ticket médio",
  average_ticket: "Ticket médio",
  differentiators: "Diferenciais",
  diferenciais: "Diferenciais",
  comodidades: "Comodidades e estrutura",
  amenities: "Comodidades e estrutura",
  experiencia: "Experiência oferecida",
  experience: "Experiência oferecida",
  localizacao: "Localização",
  location: "Localização",
  region: "Região",
  regions: "Regiões",
  // Saúde
  especialidade: "Especialidade",
  specialty: "Especialidade",
  procedimentos: "Procedimentos / Serviços",
  procedures: "Procedimentos / Serviços",
  convenios: "Convênios aceitos",
  // Genérico
  product: "Produto / Serviço",
  product_name: "Nome do produto",
  product_description: "Descrição do produto",
  description: "Descrição",
  promotions: "Promoções",
  benefits: "Benefícios",
  // Mercado
  current_revenue: "Faturamento atual",
  monthly_investment: "Investimento mensal em marketing",
  initial_traffic_investment: "Investimento inicial em tráfego",
  revenue_goal: "Meta de faturamento",
  sales_team_size: "Tamanho da equipe de vendas",
  sales_model: "Modelo de venda",
  demand_channels: "Canais de geração de demanda",
  // ICP / Blocos
  motivacao: "Motivação principal",
  motivation: "Motivação principal",
  perfil: "Perfil",
  profile: "Perfil",
  comportamento: "Comportamento",
  behavior: "Comportamento",
  nao_funciona: "O que não funciona / evitar",
  evitar: "O que evitar",
  avoid: "O que evitar",
  caracteristicas: "Características",
  characteristics: "Características",
  idade: "Idade",
  age: "Idade",
  genero: "Gênero",
  gender: "Gênero",
  profissao: "Profissão",
  profession: "Profissão",
  segmento: "Segmento",
  segment: "Segmento",
  quando_busca: "Quando busca",
  when_seeks: "Quando busca",
  por_que_compra: "Por que compra",
  why_buys: "Por que compra",
  reason_needs_solution: "Por que precisa da solução",
  current_situation: "Situação atual",
  is_ideal: "É o cliente ideal?",
  awareness_level: "Nível de consciência",
  who_is: "Quem é",
};

export function humanizeKey(key: string): string {
  if (LABELS_PT[key]) return LABELS_PT[key];
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function formatValue(value: any): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "object") {
    // Render object inline as "key: value" pairs
    return Object.entries(value)
      .map(([k, v]) => `${humanizeKey(k)}: ${formatValue(v)}`)
      .join(" • ");
  }
  return String(value);
}
