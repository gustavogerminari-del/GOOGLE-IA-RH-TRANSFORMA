/**
 * MÓDULO EQUIPE INTERNA - Modal de Visualização de Desempenho e Métricas Individuais
 * RH TRANSFORMA - Sistema de Gestão de Pessoas
 */

import React from 'react';
import { 
  X, 
  BarChart3, 
  Clock, 
  Star, 
  TrendingUp, 
  CheckCircle2, 
  Users, 
  Briefcase, 
  Calendar, 
  Award,
  Building2,
  AlertCircle
} from 'lucide-react';
import { InternalTeamMember } from '../types/team';

interface TeamMemberMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: InternalTeamMember | null;
}

export const TeamMemberMetricsModal: React.FC<TeamMemberMetricsModalProps> = ({
  isOpen,
  onClose,
  member,
}) => {
  if (!isOpen || !member) return null;

  const { metrics, processControl } = member;

  const slaPerformancePct = Math.min(100, Math.round((metrics.slaComplianceRate)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img
              src={member.avatar}
              alt={member.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-indigo-400"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{member.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {member.roleType} ({member.seniority})
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {member.jobTitle} • {member.departmentName}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50/50">
          
          {/* Top Scorecard Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* KPI 1: SLA Tempo Médio */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Tempo Médio (SLA)</span>
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {metrics.avgTimeToHireDays} <span className="text-xs font-normal text-slate-500">dias</span>
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold">
                Meta: {metrics.slaTargetDays} dias ({metrics.slaComplianceRate}% cump.)
              </p>
            </div>

            {/* KPI 2: NPS dos Gestores */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>NPS Requisitantes</span>
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {metrics.managerNpsScore} <span className="text-xs font-normal text-slate-500">/ 5.0</span>
              </p>
              <p className="text-[11px] text-indigo-600 font-semibold">
                Satisfação de Atendimento
              </p>
            </div>

            {/* KPI 3: Entrevistas no Mês */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Entrevistas Mês</span>
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {metrics.interviewsConductedMonth}
              </p>
              <p className="text-[11px] text-slate-500">
                {metrics.screenedCandidatesMonth} triagens
              </p>
            </div>

            {/* KPI 4: Contratações Ano */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Contratações Ano</span>
                <Award className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {metrics.hiredCandidatesYear}
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold">
                {metrics.offerAcceptanceRate}% aceite de oferta
              </p>
            </div>
          </div>

          {/* Performance Gauges / Progress Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Bar 1: Cumprimento de SLA */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Taxa de Cumprimento de SLA de Vagas
                </span>
                <span className="text-indigo-600 font-extrabold">{metrics.slaComplianceRate}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${slaPerformancePct}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                Média corporativa de preenchimento de vaga dentro da janela estipulada pelo SLA.
              </p>
            </div>

            {/* Bar 2: Taxa de Aceite de Proposta */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Taxa de Conversão e Aceite de Oferta
                </span>
                <span className="text-emerald-600 font-extrabold">{metrics.offerAcceptanceRate}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${metrics.offerAcceptanceRate}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                Percentual de propostas formais de trabalho aceitas pelos candidatos finalistas.
              </p>
            </div>
          </div>

          {/* Detailed Active Processes List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  Processos Seletivos Sob Responsabilidade Ativa
                </h3>
                <p className="text-xs text-slate-500">
                  Total de {processControl.activeJobsCount} de {processControl.maxJobCapacity} vagas da capacidade máxima do profissional
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                Carga: {Math.round((processControl.activeJobsCount / processControl.maxJobCapacity) * 100)}%
              </span>
            </div>

            {processControl.assignedProcesses.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                {processControl.assignedProcesses.map((proc) => (
                  <div key={proc.id} className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400 font-bold">{proc.code}</span>
                        <h4 className="font-bold text-slate-800 text-sm">{proc.title}</h4>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <span>{proc.departmentName}</span> • 
                        <span>{proc.openings} vaga(s)</span> • 
                        <span>{proc.applicantsCount} inscritos</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          proc.status === 'Urgente' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {proc.status}
                        </span>
                        <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                          SLA: <strong className={proc.slaDaysLeft <= 5 ? 'text-rose-600' : 'text-slate-800'}>{proc.slaDaysLeft} dias restantes</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                O profissional não possui processos ativados no momento.
              </div>
            )}
          </div>

          {/* Notes & Strategic Insights */}
          {member.notes && (
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
              <strong className="font-bold text-indigo-950">Anotações do Gestor:</strong>
              <p>{member.notes}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all"
          >
            Fechar Painel
          </button>
        </div>
      </div>
    </div>
  );
};
