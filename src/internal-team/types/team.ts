/**
 * MÓDULO EQUIPE INTERNA - Contratos e Tipos TypeScript
 * RH TRANSFORMA - Sistema de Gestão de Pessoas
 * 
 * Regra Arquitetural: Depende apenas do NÚCLEO, COMPARTILHADO, AUTENTICAÇÃO e ESTRUTURA ORGANIZACIONAL.
 */

import { RoleProfile } from '../../auth';
import { Department } from '../../organization';

export type TeamMemberRoleType = 'Administrador' | 'Gestor de Seleção' | 'Recrutador' | 'Analista de RH' | 'Business Partner (BP)';

export type TeamMemberSeniority = 'Júnior' | 'Pleno' | 'Sênior' | 'Especialista' | 'Líder / Coordenador';

export type TeamMemberStatus = 'Ativo' | 'Em Férias' | 'Licença' | 'Inativo';

export interface AssignedProcess {
  id: string;
  code: string;
  title: string;
  departmentName: string;
  openings: number;
  applicantsCount: number;
  status: 'Aberta' | 'Pausada' | 'Em Triagem' | 'Urgente';
  slaDaysLeft: number;
  targetDays: number;
  startDate: string;
}

export interface InternalPermissions {
  canCreateJobs: boolean;
  canEditJobs: boolean;
  canCloseJobs: boolean;
  canViewSalaries: boolean;
  canApproveHires: boolean;
  canDeleteCandidates: boolean;
  canScheduleInterviews: boolean;
  canExportReports: boolean;
  canManageTeam: boolean;
}

export interface PerformanceMetrics {
  avgTimeToHireDays: number; // Tempo médio de preenchimento de vaga (SLA)
  slaTargetDays: number;     // Meta de SLA em dias
  slaComplianceRate: number; // Porcentagem de cumprimento do SLA (ex: 92%)
  interviewsConductedMonth: number; // Entrevistas conduzidas no mês
  screenedCandidatesMonth: number;  // Candidatos triados no mês
  hiredCandidatesYear: number;      // Contratações finalizadas no ano
  managerNpsScore: number;          // NPS de satisfação dos gestores requisitantes (1.0 a 5.0)
  offerAcceptanceRate: number;      // Taxa de aceite de propostas (%)
}

export interface ProcessControl {
  maxJobCapacity: number;     // Capacidade máxima de vagas simultâneas
  activeJobsCount: number;    // Vagas ativas sob responsabilidade atual
  assignedProcesses: AssignedProcess[];
}

export interface InternalTeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleProfile: RoleProfile;       // Perfil base no sistema de Autenticação
  roleType: TeamMemberRoleType;  // Classificação funcional
  jobTitle: string;             // Cargo exato (Ex: "Recrutador Sênior Tech")
  seniority: TeamMemberSeniority;
  departmentId: string;          // Vínculo com Módulo Estrutura Organizacional
  departmentName: string;
  specialty: string;             // Área de especialidade (Ex: "Tecnologia", "Finanças", "Geral")
  avatar: string;
  status: TeamMemberStatus;
  hireDate: string;
  processControl: ProcessControl;
  metrics: PerformanceMetrics;
  permissions: InternalPermissions;
  notes?: string;
  salary?: number;
  directCoordinator?: string;
  dependentsCount?: number;
  hasVT?: boolean;
  updatedAt: string;
}

export interface TeamMemberFilterParams {
  searchTerm?: string;
  departmentId?: string;
  roleType?: string;
  status?: TeamMemberStatus | 'Todos';
  workloadStatus?: 'Todos' | 'Livre' | 'Ideal' | 'Sobrecarregado';
}

export interface ReassignJobPayload {
  jobId: string;
  sourceMemberId: string;
  targetMemberId: string;
  reason?: string;
}
