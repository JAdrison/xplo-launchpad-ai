// Funções operacionais (job_function) — espelha o enum do banco.
import { Megaphone, Palette, PenTool, PhoneCall, Handshake, MessageCircle, FolderKanban, Bot } from "lucide-react";

export type JobFunction =
  | "gestor_trafego"
  | "designer"
  | "copywriter"
  | "sdr"
  | "vendedor"
  | "contato_cliente"
  | "gestor_projetos"
  | "ia_specialist";

export const JOB_FUNCTIONS: JobFunction[] = [
  "gestor_trafego",
  "designer",
  "copywriter",
  "sdr",
  "vendedor",
  "contato_cliente",
  "gestor_projetos",
  "ia_specialist",
];

export const JOB_FUNCTION_LABELS: Record<JobFunction, string> = {
  gestor_trafego: "Gestor de Tráfego",
  designer: "Designer",
  copywriter: "Copywriter",
  sdr: "SDR",
  vendedor: "Vendedor",
  contato_cliente: "Contato com Cliente",
  gestor_projetos: "Gestor de Projetos",
  ia_specialist: "IA Specialist",
};

export const JOB_FUNCTION_COLORS: Record<JobFunction, string> = {
  gestor_trafego: "bg-blue-100 text-blue-700 border-blue-200",
  designer: "bg-pink-100 text-pink-700 border-pink-200",
  copywriter: "bg-amber-100 text-amber-700 border-amber-200",
  sdr: "bg-emerald-100 text-emerald-700 border-emerald-200",
  vendedor: "bg-green-100 text-green-700 border-green-200",
  contato_cliente: "bg-purple-100 text-purple-700 border-purple-200",
  gestor_projetos: "bg-indigo-100 text-indigo-700 border-indigo-200",
  ia_specialist: "bg-violet-100 text-violet-700 border-violet-200",
};

export const JOB_FUNCTION_ICONS: Record<JobFunction, any> = {
  gestor_trafego: Megaphone,
  designer: Palette,
  copywriter: PenTool,
  sdr: PhoneCall,
  vendedor: Handshake,
  contato_cliente: MessageCircle,
  gestor_projetos: FolderKanban,
  ia_specialist: Bot,
};
