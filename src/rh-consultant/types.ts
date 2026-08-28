/**
 * MÓDULO CONSULTOR DE RH - Tipos e Interfaces
 * RH TRANSFORMA - Sistema de Gestão de Pessoas
 */

export interface ConsultantClient {
  id: string;
  name: string;
  cnpj: string;
  contactName: string;
  email: string;
  phone: string;
  activeJobsCount: number;
  totalFeeValue: number;
}

export interface JobFinancial {
  feeValue: number;          // Valor Cobrado (ex: R$ 8.000)
  paymentMethod: 'Pix' | 'Boleto' | 'Transferência' | 'Cartão' | 'Faturamento 30 Dias';
  commissionRatePercent: number; // Ex: 15%
  commissionValue: number;       // Calculado/Definido
  amountReceived: number;        // Valor efetivamente recebido
  isPaid: boolean;
  paymentDate?: string;
}

export interface JobExpense {
  id: string;
  jobId: string;
  clientId: string;
  description: string;
  category: 'Anúncio de Vaga' | 'Análise de Perfil/Assessment' | 'Viagem/Deslocamento' | 'Softwares/Testes' | 'Outros';
  amount: number;
  date: string;
}

export interface ConsultantJob {
  id: string;
  code: string;
  title: string;
  clientId: string;
  clientName: string;
  status: 'Em Triagem' | 'Entrevistas' | 'Aprovado / Fechada' | 'Cancelada';
  candidatesCount: number;
  financial: JobFinancial;
  expenses: JobExpense[];
  createdAt: string;
  deadline?: string;
}

export interface ConsultantCandidateScreening {
  id: string;
  jobId: string;
  candidateName: string;
  email: string;
  phone: string;
  rating: number; // 1 to 5 stars
  tag: 'Altamente Recomendado' | 'Em Análise' | 'Aguardando Cliente' | 'Reprovado';
  notes: string;
  interviewFeedback?: string;
  interviewScheduledDate?: string;
}
