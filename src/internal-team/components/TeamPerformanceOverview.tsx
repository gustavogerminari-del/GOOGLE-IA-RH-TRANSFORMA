/**
 * MÓDULO EQUIPE INTERNA - Painel de Visão Geral e Desempenho Operacional
 * RH TRANSFORMA - Sistema de Gestão de Pessoas
 */

import React from 'react';
import { 
  Users, 
  Briefcase, 
  Clock, 
  Star, 
  TrendingUp, 
  BarChart2, 
  Award, 
  CheckCircle2,
  PieChart,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { InternalTeamMember } from '../types/team';
import { InternalTeamService } from '../services/teamService';

interface TeamPerformanceOverviewProps {
  members: InternalTeamMember[];
  onSelectMember: (member: InternalTeamMember) => void;
}

export const TeamPerformanceOverview: React.FC<TeamPerformanceOverviewProps> = ({
  members,
  onSelectMember,
}) => {
  const kpis = InternalTeamService.calculateTeamKPIs(members);

  // Ordena por desempenho de SLA e NPS
  const topPerformers = [...members].sort((a, b) => b.metrics.slaComplianceRate - a.metrics.slaComplianceRate);

  return (
    <div className="space-y-6">
      
      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Equipe Ativa */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Profissionais de RH</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">{kpis.totalMembers}</p>
          <p className="text-xs text-slate-500 font-medium">
            <strong className="text-emerald-600">{kpis.activeMembers} ativos</strong> • {kpis.onVacationMembers} em férias
          </p>
        </div>

        {/* Card 2: Carga de Trabalho */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Uso de Capacidade</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {kpis.totalActiveJobs} <span className="text-sm font-semibold text-slate-400">/ {kpis.totalMaxCapacity} vagas</span>
          </p>
          <div className="flex items-center gap-2">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex-1">
              <div 
                className={`h-full rounded-full ${kpis.capacityUsagePercentage > 85 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                style={{ width: `${kpis.capacityUsagePercentage}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-700">{kpis.capacityUsagePercentage}%</span>
          </div>
        </div>

        {/* Card 3: SLA Médio Equipe */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>SLA Médio de Preenchimento</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {kpis.avgSlaDays} <span className="text-sm font-semibold text-slate-400">dias</span>
          </p>
          <p className="text-xs text-emerald-600 font-semibold">
            Meta corporativa: ≤ 25 dias
          </p>
        </div>

        {/* Card 4: NPS dos Gestores */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>NPS dos Requisitantes</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {kpis.avgNpsScore} <span className="text-sm font-semibold text-slate-400">/ 5.0</span>
          </p>
          <p className="text-xs text-indigo-600 font-semibold">
            Satisfação dos Gestores
          </p>
        </div>
      </div>

      {/* Main Grid: Workload Balance & Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Workload Balance List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-600" />
                Balanço de Carga de Vagas por Profissional
              </h3>
              <p className="text-xs text-slate-500">
                Acompanhe a distribuição de processos e identifique sobrecargas
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {members.map((member) => {
              const workload = InternalTeamService.getWorkloadStatus(member);
              const active = member.processControl.activeJobsCount;
              const max = member.processControl.maxJobCapacity;
              const pct = max > 0 ? Math.min(100, Math.round((active / max) * 100)) : 0;

              return (
                <div 
                  key={member.id}
                  onClick={() => onSelectMember(member)}
                  className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-200 rounded-xl transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <img src={member.avatar} alt={member.name} className="w-7 h-7 rounded-full object-cover" />
                      <div>
                        <p className="font-bold text-slate-800">{member.name}</p>
                        <p className="text-[11px] text-slate-500">{member.jobTitle}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{active} / {max} vagas</span>
                      <p className={`text-[10px] font-extrabold ${
                        workload === 'Sobrecarregado' ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {workload} ({pct}%)
                      </p>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        workload === 'Sobrecarregado' ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performers Ranking */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Destaques de Eficiência de Recrutamento
              </h3>
              <p className="text-xs text-slate-500">
                Ranking por taxa de cumprimento de SLA e NPS de atendimento
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {topPerformers.map((member, index) => (
              <div 
                key={member.id}
                onClick={() => onSelectMember(member)}
                className="p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                    index === 0 ? 'bg-amber-400 text-amber-950' : index === 1 ? 'bg-slate-300 text-slate-800' : index === 2 ? 'bg-amber-700 text-amber-50' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {index + 1}
                  </span>
                  <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{member.name}</h4>
                    <p className="text-[11px] text-slate-500">{member.specialty}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-xs font-bold text-indigo-600">{member.metrics.slaComplianceRate}% SLA</p>
                    <p className="text-[10px] text-slate-400">{member.metrics.avgTimeToHireDays}d médio</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-600 flex items-center justify-end gap-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {member.metrics.managerNpsScore}
                    </p>
                    <p className="text-[10px] text-slate-400">{member.metrics.hiredCandidatesYear} contratações</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
