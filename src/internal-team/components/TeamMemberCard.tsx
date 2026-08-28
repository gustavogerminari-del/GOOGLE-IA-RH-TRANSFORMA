/**
 * MÓDULO EQUIPE INTERNA - Card Visual de Membro da Equipe
 * RH TRANSFORMA - Sistema de Gestão de Pessoas
 */

import React from 'react';
import { 
  User, 
  Briefcase, 
  Building2, 
  Star, 
  Clock, 
  CheckCircle2, 
  Edit, 
  BarChart3, 
  ArrowRightLeft, 
  Power,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { InternalTeamMember } from '../types/team';
import { InternalTeamService } from '../services/teamService';

interface TeamMemberCardProps {
  member: InternalTeamMember;
  isAdmin: boolean;
  onViewMetrics: (member: InternalTeamMember) => void;
  onEditMember: (member: InternalTeamMember) => void;
  onReassignJobs: (member: InternalTeamMember) => void;
  onToggleStatus: (member: InternalTeamMember) => void;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  member,
  isAdmin,
  onViewMetrics,
  onEditMember,
  onReassignJobs,
  onToggleStatus,
}) => {
  const workloadStatus = InternalTeamService.getWorkloadStatus(member);
  const activeCount = member.processControl.activeJobsCount;
  const maxCapacity = member.processControl.maxJobCapacity;
  const capacityPct = maxCapacity > 0 ? Math.min(100, Math.round((activeCount / maxCapacity) * 100)) : 0;

  // Workload badge styling
  const workloadColors = {
    'Livre': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Ideal': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Sobrecarregado': 'bg-amber-50 text-amber-700 border-amber-200',
  }[workloadStatus];

  const statusColors = {
    'Ativo': 'bg-emerald-100 text-emerald-800',
    'Em Férias': 'bg-amber-100 text-amber-800',
    'Licença': 'bg-blue-100 text-blue-800',
    'Inativo': 'bg-slate-100 text-slate-600',
  }[member.status];

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
      member.status === 'Inativo' ? 'border-slate-200 bg-slate-50/50 opacity-75' : 'border-slate-200 hover:border-indigo-300'
    }`}>
      {/* Top Header Section */}
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-13 h-13 rounded-full object-cover border-2 border-slate-100 shadow-2xs"
                />
              ) : (
                <div className="w-13 h-13 rounded-full bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-base border-2 border-slate-100 shadow-2xs">
                  {member.name ? member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'RH'}
                </div>
              )}
              <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                member.status === 'Ativo' ? 'bg-emerald-500' : member.status === 'Em Férias' ? 'bg-amber-500' : 'bg-slate-400'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 text-base leading-tight hover:text-indigo-600 transition-colors">
                  {member.name}
                </h3>
                {member.permissions.canManageTeam && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800" title="Perfil Administrador">
                    <ShieldCheck className="w-3 h-3" />
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">{member.jobTitle}</p>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-slate-400" />
                {member.departmentName}
              </p>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors}`}>
            {member.status}
          </span>
        </div>

        {/* Roles & Specialty Tags */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
            {member.roleType} ({member.seniority})
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-medium">
            🎯 {member.specialty}
          </span>
        </div>

        {/* Workload Progress Bar */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              Carga de Vagas Ativas
            </span>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${workloadColors}`}>
                {workloadStatus}
              </span>
              <span className="font-bold text-slate-800 text-xs">
                {activeCount} / {maxCapacity}
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                workloadStatus === 'Sobrecarregado'
                  ? 'bg-amber-500'
                  : workloadStatus === 'Ideal'
                  ? 'bg-indigo-600'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${capacityPct}%` }}
            />
          </div>
        </div>

        {/* Metrics Overview Grid */}
        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-indigo-500" /> SLA Médio
            </p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {member.metrics.avgTimeToHireDays} <span className="text-[10px] font-normal text-slate-500">dias</span>
            </p>
          </div>

          <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-400" /> NPS Gestor
            </p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {member.metrics.managerNpsScore} <span className="text-[10px] font-normal text-slate-500">/ 5.0</span>
            </p>
          </div>

          <div className="p-2 bg-slate-50/80 rounded-xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Aceite
            </p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {member.metrics.offerAcceptanceRate}%
            </p>
          </div>
        </div>

        {/* Assigned Processes Preview */}
        {member.processControl.assignedProcesses.length > 0 ? (
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Processos Sob Responsabilidade ({member.processControl.assignedProcesses.length})
            </p>
            <div className="space-y-1">
              {member.processControl.assignedProcesses.slice(0, 2).map((proc) => (
                <div key={proc.id} className="flex items-center justify-between text-xs p-1.5 bg-slate-50 rounded-lg hover:bg-slate-100/80 transition-colors">
                  <span className="font-medium text-slate-700 truncate max-w-[170px]" title={proc.title}>
                    • {proc.title}
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    proc.status === 'Urgente' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {proc.slaDaysLeft}d SLA
                  </span>
                </div>
              ))}
              {member.processControl.assignedProcesses.length > 2 && (
                <p className="text-[11px] text-indigo-600 font-medium pl-1">
                  + {member.processControl.assignedProcesses.length - 2} mais processo(s)
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-2 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
            Nenhum processo ativo no momento
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1">
        <button
          onClick={() => onViewMetrics(member)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-xs font-semibold rounded-xl transition-all shadow-2xs"
        >
          <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Métricas</span>
        </button>

        <button
          onClick={() => onReassignJobs(member)}
          disabled={member.processControl.activeJobsCount === 0}
          title={member.processControl.activeJobsCount === 0 ? "Sem vagas ativas para transferir" : "Realocar processos deste profissional"}
          className="inline-flex items-center justify-center gap-1 p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-all shadow-2xs disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-600" />
        </button>

        <button
          onClick={() => onEditMember(member)}
          title={isAdmin ? "Editar informações e permissões" : "Visualizar perfil (Edição requer Administrador)"}
          className="inline-flex items-center justify-center gap-1 p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-all shadow-2xs cursor-pointer"
        >
          <Edit className="w-3.5 h-3.5 text-slate-600" />
        </button>

        <button
          onClick={() => onToggleStatus(member)}
          title={member.status === 'Inativo' ? 'Ativar usuário' : 'Inativar usuário'}
          className={`inline-flex items-center justify-center gap-1 p-2 border text-xs font-medium rounded-xl transition-all shadow-2xs cursor-pointer ${
            member.status === 'Inativo'
              ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
              : 'bg-white hover:bg-rose-50 border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-700'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
