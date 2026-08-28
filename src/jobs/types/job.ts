/**
 * Módulo GESTÃO DE VAGAS - Contratos de Dados
 * Depende exclusivamente do Módulo NÚCLEO, COMPARTILHADO, AUTENTICAÇÃO e DASHBOARD.
 */

export type JobStatus = 'Aberta' | 'Pausada' | 'Fechada' | 'Arquivada' | 'Rascunho' | 'Em andamento' | 'Em Andamento' | 'Concluída' | 'Cancelada';
export type JobType = 'CLT' | 'PJ' | 'Estágio' | 'Temporário' | 'Executive';
export type JobLocationType = 'Presencial' | 'Remoto' | 'Híbrido';

export interface JobBudgetInfo {
  approvedSalaryRange: string;
  monthlyCostLimit?: number;
  centerCostCode: string;
  isApproved: boolean;
}

export interface Job {
  id: string;
  empresaId?: string;
  companyId?: string;
  nomeEmpresa?: string;
  companyName?: string;
  titulo?: string;
  title: string;
  descricao?: string;
  description: string;
  requisitos?: string[];
  requirements: string[];
  cidade?: string;
  estado?: string;
  location: string;
  locationType: JobLocationType;
  salario?: string;
  salaryRange: string;
  tipoContrato?: JobType;
  type: JobType;
  beneficios?: string[];
  benefits?: string[];
  quantidadeVagas?: number;
  openings: number;
  applicantsCount: number;
  dataCriacao?: string;
  createdAt: string;
  deadline: string;
  status: JobStatus | 'ativa';
  publicada?: boolean;
  department: string;
  recruiterName: string;
  recruiterId?: string;
  managerName?: string;
  origemProcesso?: 'vaga_interna' | 'recrutamento_cliente' | 'headhunter' | 'HEADHUNTER' | 'RH_INTERNO' | 'recrutamento_interno' | 'banco_talent';
  moduloOrigem?: string;
  origem?: string;
  tipoProcesso?: string;
  isHeadhunter?: boolean;
  projetoHeadhunter?: boolean;
  clientId?: string;
  clienteId?: string;
  clienteNome?: string;
  budget?: JobBudgetInfo;
  isArchived?: boolean;
  archived?: boolean;
  archivedAt?: string | null;
  updatedAt?: string;
}

export interface JobFilterParams {
  searchTerm: string;
  department: string;
  status: string;
  origem?: string;
  type: string;
  startDate?: string;
  endDate?: string;
  includeArchived: boolean;
}

export interface DepartmentOpenJobCount {
  departmentName: string;
  openCount: number;
  totalCount: number;
}
