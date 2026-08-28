/**
 * MÓDULO GESTÃO DE PLANOS E ASSINATURAS SAAS - Tipos TypeScript
 * RH TRANSFORMA - Sistema de Gestão de Pessoas
 */

export type PlanTier = 'Starter' | 'Professional' | 'Enterprise' | 'Custom Consultoria';

export type PaymentStatus = 'Em Dia / Ativo' | 'Aguardando Pagamento' | 'Inadimplente' | 'Cancelado';

export interface ModuleAccessConfig {
  vagas: boolean;
  bancoTalentos: boolean;
  entrevistas: boolean;
  equipeInterna: boolean;
  consultoriaRH: boolean;
  feriasBeneficios: boolean;
  documentosAssinatura: boolean;
  auditoriaLogs: boolean;
  folha?: boolean;
  ponto?: boolean;
}

export interface ClientSubscription {
  id: string;
  companyName: string;
  cnpj: string;
  planTier: PlanTier;
  mrrValue: number; // Monthly Recurring Revenue em R$
  billingCycle: 'Mensal' | 'Anual';
  contractStart: string;
  contractExpiration: string;
  paymentStatus: PaymentStatus;
  modulesEnabled: ModuleAccessConfig;
  userLimit: number;
  activeUsersCount: number;
  lastPaymentDate: string;
  nextRenewalDate: string;
}

export interface BillingInvoice {
  id: string;
  subscriptionId: string;
  companyName: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'Pago' | 'Pendente' | 'Vencido';
  invoicePdfUrl?: string;
}
