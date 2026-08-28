/**
 * MÓDULO EQUIPE INTERNA - Opções e Constantes Padrão
 * RH TRANSFORMA - Sistema de Gestão de Pessoas
 */

import { RoleProfile } from '../../auth';
import { 
  InternalPermissions, 
  TeamMemberRoleType, 
  TeamMemberSeniority, 
  TeamMemberStatus 
} from '../types/team';

export const TEAM_ROLE_TYPES: TeamMemberRoleType[] = [
  'Recrutador',
  'Analista de RH',
  'Gestor de Seleção',
  'Business Partner (BP)',
  'Administrador'
];

export const TEAM_SENIORITIES: TeamMemberSeniority[] = [
  'Júnior',
  'Pleno',
  'Sênior',
  'Especialista',
  'Líder / Coordenador'
];

export const TEAM_STATUSES: TeamMemberStatus[] = [
  'Ativo',
  'Em Férias',
  'Licença',
  'Inativo'
];

export const TEAM_SPECIALTIES = [
  'Tecnologia & Engenharia',
  'Comercial & Vendas',
  'Marketing & Produto',
  'Financeiro & Controladoria',
  'Operações & Logística',
  'Recursos Humanos & BP',
  'Geral / Multidisciplinar'
];

/**
 * Matriz de Permissões Padrão por Perfil do Sistema (Presets)
 */
export const DEFAULT_PERMISSIONS_BY_PROFILE: Record<RoleProfile, InternalPermissions> = {
  'Super Administrador': {
    canCreateJobs: true,
    canEditJobs: true,
    canCloseJobs: true,
    canViewSalaries: true,
    canApproveHires: true,
    canDeleteCandidates: true,
    canScheduleInterviews: true,
    canExportReports: true,
    canManageTeam: true,
  },
  'Administrador': {
    canCreateJobs: true,
    canEditJobs: true,
    canCloseJobs: true,
    canViewSalaries: true,
    canApproveHires: true,
    canDeleteCandidates: true,
    canScheduleInterviews: true,
    canExportReports: true,
    canManageTeam: true,
  },
  'Gestor de Seleção': {
    canCreateJobs: true,
    canEditJobs: true,
    canCloseJobs: true,
    canViewSalaries: true,
    canApproveHires: true,
    canDeleteCandidates: true,
    canScheduleInterviews: true,
    canExportReports: true,
    canManageTeam: false,
  },
  'Recrutador Sênior': {
    canCreateJobs: true,
    canEditJobs: true,
    canCloseJobs: false,
    canViewSalaries: true,
    canApproveHires: false,
    canDeleteCandidates: false,
    canScheduleInterviews: true,
    canExportReports: true,
    canManageTeam: false,
  },
  'Analista de RH': {
    canCreateJobs: false,
    canEditJobs: false,
    canCloseJobs: false,
    canViewSalaries: false,
    canApproveHires: false,
    canDeleteCandidates: false,
    canScheduleInterviews: true,
    canExportReports: false,
    canManageTeam: false,
  },
  'Colaborador': {
    canCreateJobs: false,
    canEditJobs: false,
    canCloseJobs: false,
    canViewSalaries: false,
    canApproveHires: false,
    canDeleteCandidates: false,
    canScheduleInterviews: false,
    canExportReports: false,
    canManageTeam: false,
  },
};
