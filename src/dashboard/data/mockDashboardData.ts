import {
  DashboardSummaryMetrics,
  DepartmentSummary,
  ResponsibleSummary,
  ProcessAlert,
  FunnelStepSummary,
} from '../types/dashboard';

export const INITIAL_DASHBOARD_METRICS: DashboardSummaryMetrics = {
  totalOpenJobs: 0,
  activeProcesses: 0,
  scheduledInterviews: 0,
  talentBankCandidates: 0,
  slaAvgDays: 0,
  offerAcceptanceRate: 0,
};

export const INITIAL_DEPARTMENTS_SUMMARY: DepartmentSummary[] = [];

export const INITIAL_RESPONSIBLE_SUMMARY: ResponsibleSummary[] = [];

export const INITIAL_PROCESS_ALERTS: ProcessAlert[] = [];

export const INITIAL_FUNNEL_STEPS: FunnelStepSummary[] = [
  { stageId: 'triagem', stageName: 'Triagem Inicial', candidateCount: 0, colorClass: 'bg-indigo-500' },
  { stageId: 'entrevista_rh', stageName: 'Entrevista RH', candidateCount: 0, colorClass: 'bg-purple-500' },
  { stageId: 'teste_tecnico', stageName: 'Avaliação Técnica', candidateCount: 0, colorClass: 'bg-amber-500' },
  { stageId: 'entrevista_gestor', stageName: 'Entrevista Gestor', candidateCount: 0, colorClass: 'bg-blue-500' },
  { stageId: 'proposta', stageName: 'Proposta / Emissão', candidateCount: 0, colorClass: 'bg-emerald-500' },
];
