/**
 * MÓDULO EQUIPE INTERNA - Regras de Negócio e Serviço de Gestão
 * RH TRANSFORMA - Sistema de Gestão de Pessoas
 * 
 * Depende apenas do NÚCLEO, COMPARTILHADO, AUTENTICAÇÃO e ESTRUTURA ORGANIZACIONAL.
 */

import { AppError } from '../../core';
import { 
  InternalTeamMember, 
  TeamMemberFilterParams, 
  ReassignJobPayload,
  AssignedProcess
} from '../types/team';

export class InternalTeamService {

  /**
   * Calcula o status de carga de trabalho do profissional baseado no limite
   */
  static getWorkloadStatus(member: InternalTeamMember): 'Livre' | 'Ideal' | 'Sobrecarregado' {
    const active = member.processControl.activeJobsCount;
    const max = member.processControl.maxJobCapacity;

    if (max <= 0) return 'Livre';
    const ratio = active / max;

    if (ratio > 0.85) return 'Sobrecarregado';
    if (ratio < 0.40) return 'Livre';
    return 'Ideal';
  }

  /**
   * Aplica filtros e busca textual sobre a lista de membros da equipe
   */
  static filterMembers(members: InternalTeamMember[], params: TeamMemberFilterParams): InternalTeamMember[] {
    return members.filter(member => {
      // Busca por nome, email, cargo ou especialidade
      if (params.searchTerm) {
        const term = params.searchTerm.toLowerCase().trim();
        const matchesName = member.name.toLowerCase().includes(term);
        const matchesEmail = member.email.toLowerCase().includes(term);
        const matchesJobTitle = member.jobTitle.toLowerCase().includes(term);
        const matchesSpecialty = member.specialty.toLowerCase().includes(term);
        if (!matchesName && !matchesEmail && !matchesJobTitle && !matchesSpecialty) {
          return false;
        }
      }

      // Filtro por departamento
      if (params.departmentId && params.departmentId !== 'Todos') {
        if (member.departmentId !== params.departmentId) return false;
      }

      // Filtro por tipo de cargo/função
      if (params.roleType && params.roleType !== 'Todos') {
        if (member.roleType !== params.roleType) return false;
      }

      // Filtro por status
      if (params.status && params.status !== 'Todos') {
        if (member.status !== params.status) return false;
      }

      // Filtro por carga de trabalho
      if (params.workloadStatus && params.workloadStatus !== 'Todos') {
        const workload = this.getWorkloadStatus(member);
        if (workload !== params.workloadStatus) return false;
      }

      return true;
    });
  }

  /**
   * Valida autorização de Administrador para ações críticas de segurança (RBAC)
   */
  static validateAdminPermission(userRoleProfile: string, canManageTeamPermission?: boolean): void {
    const isAdmin = userRoleProfile === 'Administrador' || canManageTeamPermission === true;
    if (!isAdmin) {
      throw new AppError(
        'Acesso negado: Apenas usuários com perfil Administrador podem incluir, alterar ou inativar usuários da equipe.',
        403,
        'FORBIDDEN_ACTION'
      );
    }
  }

  /**
   * Transfere uma vaga/processo seletivo sob responsabilidade de um profissional para outro
   */
  static reassignProcess(
    members: InternalTeamMember[],
    payload: ReassignJobPayload,
    adminRoleProfile: string
  ): InternalTeamMember[] {
    this.validateAdminPermission(adminRoleProfile);

    const sourceIndex = members.findIndex(m => m.id === payload.sourceMemberId);
    const targetIndex = members.findIndex(m => m.id === payload.targetMemberId);

    if (sourceIndex === -1 || targetIndex === -1) {
      throw new AppError('Membro de origem ou destino não encontrado.', 404, 'NOT_FOUND');
    }

    const source = members[sourceIndex];
    const target = members[targetIndex];

    const processToMove = source.processControl.assignedProcesses.find(p => p.id === payload.jobId);
    if (!processToMove) {
      throw new AppError('Processo/Vaga não encontrado sob responsabilidade do profissional de origem.', 404, 'NOT_FOUND');
    }

    // Remove do origem
    const updatedSourceProcesses = source.processControl.assignedProcesses.filter(p => p.id !== payload.jobId);
    const updatedSourceMember: InternalTeamMember = {
      ...source,
      processControl: {
        ...source.processControl,
        assignedProcesses: updatedSourceProcesses,
        activeJobsCount: Math.max(0, updatedSourceProcesses.length)
      },
      updatedAt: new Date().toISOString().split('T')[0]
    };

    // Adiciona ao destino
    const updatedTargetProcesses = [...target.processControl.assignedProcesses, processToMove];
    const updatedTargetMember: InternalTeamMember = {
      ...target,
      processControl: {
        ...target.processControl,
        assignedProcesses: updatedTargetProcesses,
        activeJobsCount: updatedTargetProcesses.length
      },
      updatedAt: new Date().toISOString().split('T')[0]
    };

    const newMembers = [...members];
    newMembers[sourceIndex] = updatedSourceMember;
    newMembers[targetIndex] = updatedTargetMember;

    return newMembers;
  }

  /**
   * Calcula estatísticas globais da equipe para o Dashboard de Gestão Interna
   */
  static calculateTeamKPIs(members: InternalTeamMember[]) {
    const totalMembers = members.length;
    const activeMembers = members.filter(m => m.status === 'Ativo').length;
    const onVacationMembers = members.filter(m => m.status === 'Em Férias').length;
    
    const totalActiveJobs = members.reduce((acc, m) => acc + m.processControl.activeJobsCount, 0);
    const totalMaxCapacity = members.reduce((acc, m) => acc + m.processControl.maxJobCapacity, 0);
    const capacityUsagePercentage = totalMaxCapacity > 0 ? Math.round((totalActiveJobs / totalMaxCapacity) * 100) : 0;

    const avgSlaDays = Math.round(
      members.reduce((acc, m) => acc + m.metrics.avgTimeToHireDays, 0) / (totalMembers || 1)
    );

    const avgNpsScore = Number(
      (members.reduce((acc, m) => acc + m.metrics.managerNpsScore, 0) / (totalMembers || 1)).toFixed(1)
    );

    const totalInterviewsMonth = members.reduce((acc, m) => acc + m.metrics.interviewsConductedMonth, 0);
    const totalHiredYear = members.reduce((acc, m) => acc + m.metrics.hiredCandidatesYear, 0);

    return {
      totalMembers,
      activeMembers,
      onVacationMembers,
      totalActiveJobs,
      totalMaxCapacity,
      capacityUsagePercentage,
      avgSlaDays,
      avgNpsScore,
      totalInterviewsMonth,
      totalHiredYear
    };
  }
}
