/**
 * Módulo PAINEL GERAL (DASHBOARD) - Contratos de Dados do Dashboard
 * Depende exclusivamente do Módulo NÚCLEO, COMPARTILHADO e AUTENTICAÇÃO.
 */

export interface DashboardSummaryMetrics {
  totalOpenJobs: number;
  activeProcesses: number;
  scheduledInterviews: number;
  talentBankCandidates: number;
  slaAvgDays: number;
  offerAcceptanceRate: number;
}

export interface DepartmentSummary {
  id: string;
  name: string;
  openJobs: number;
  activeCandidates: number;
  managerName: string;
  budgetStatus: 'Dentro do Limite' | 'Atenção' | 'Excedido';
}

export interface ResponsibleSummary {
  id: string;
  name: string;
  role: string;
  avatar: string;
  activeJobsCount: number;
  activeCandidatesCount: number;
  completedHiresThisMonth: number;
}

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface ProcessAlert {
  id: string;
  title: string;
  description: string;
  department: string;
  severity: AlertSeverity;
  daysPending: number;
  actionRequired: string;
  date: string;
}

export interface FunnelStepSummary {
  stageId: string;
  stageName: string;
  candidateCount: number;
  colorClass: string;
}
