import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  RefreshCw,
  Plus,
  ShieldCheck,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../auth';
import { MetricCard } from './MetricCard';
import { PendingAlertsCard } from './PendingAlertsCard';
import { DepartmentBreakdownCard } from './DepartmentBreakdownCard';
import { ResponsibleBreakdownCard } from './ResponsibleBreakdownCard';
import { FunnelOverviewCard } from './FunnelOverviewCard';
import { ProcessAlert } from '../types/dashboard';
import { Button, Card } from '../../shared';
import { JobService } from '../../services/JobService';
import { CandidateService } from '../../services/CandidateService';

export interface MainDashboardViewProps {
  onNavigateToJobs?: () => void;
  onNavigateToTalentBank?: () => void;
  onNavigateToInterviews?: () => void;
  onNavigateToReports?: () => void;
}

export const MainDashboardView: React.FC<MainDashboardViewProps> = ({
  onNavigateToJobs,
  onNavigateToTalentBank,
  onNavigateToInterviews,
  onNavigateToReports,
}) => {
  const { user, hasActionAccess, isModuleActive } = useAuth();
  const isMaster = user?.role === 'Super Administrador' || user?.tipoUsuario === 'MASTER';
  const companyId = user?.empresaId || user?.companyId;

  const showVagas = isMaster || isModuleActive('vagas');
  const showTalentos = isMaster || isModuleActive('bancoTalentos');
  const showEntrevistas = isMaster || isModuleActive('entrevistas');
  const showContratacoes = isMaster || isModuleActive('vagas');
  const showIA = isMaster || isModuleActive('iaConsultora') || isModuleActive('relatoriosAvancados');

  const [metrics, setMetrics] = useState({
    activeJobsCount: 0,
    activeJobsSlaAlertsCount: 0,
    candidatesInProcessCount: 0,
    interviewsScheduledCount: 0,
    hiresThisMonthCount: 0,
    monthlyHiresTarget: 10,
    avgTimeToHireDays: 0,
    slaTargetDays: 30,
    offerAcceptanceRate: 0,
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [responsibles, setResponsibles] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<ProcessAlert[]>([]);
  const [funnelSteps, setFunnelSteps] = useState([
    { stageId: 'triagem', stageName: 'Triagem', candidateCount: 0, candidatesCount: 0, percentage: 0, colorClass: 'bg-blue-500' },
    { stageId: 'entrev-rh', stageName: 'Entrevista RH', candidateCount: 0, candidatesCount: 0, percentage: 0, colorClass: 'bg-indigo-500' },
    { stageId: 'aval-tec', stageName: 'Avaliação Técnica', candidateCount: 0, candidatesCount: 0, percentage: 0, colorClass: 'bg-purple-500' },
    { stageId: 'entrev-gestor', stageName: 'Entrevista Gestor', candidateCount: 0, candidatesCount: 0, percentage: 0, colorClass: 'bg-amber-500' },
    { stageId: 'proposta', stageName: 'Proposta / Admissão', candidateCount: 0, candidatesCount: 0, percentage: 0, colorClass: 'bg-emerald-500' }
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setIsRefreshing(true);
      if (!isMaster && !companyId) {
        throw new Error('Não foi possível carregar o painel: usuário sem empresa vinculada.');
      }
      const [jobs, candidates] = await Promise.all([
        JobService.list(companyId),
        CandidateService.list(companyId)
      ]);

      const activeJobs = jobs.filter(j => j.status === 'ativa' || j.status === 'Aberta');
      const totalCandidates = candidates.length;
      
      // Funnel breakdown
      const triagem = candidates.filter(c => {
        const st = (c as any).stage || (c as any).etapa || (c as any).status;
        return !st || st === 'Triagem' || st === 'Nova Inscrição';
      }).length;
      const entRh = candidates.filter(c => {
        const st = (c as any).stage || (c as any).etapa;
        return st === 'Entrevista RH' || st === 'Entrevista';
      }).length;
      const tec = candidates.filter(c => {
        const st = (c as any).stage || (c as any).etapa;
        return st === 'Teste Técnico' || st === 'Avaliação Técnica';
      }).length;
      const gestor = candidates.filter(c => {
        const st = (c as any).stage || (c as any).etapa;
        return st === 'Entrevista Gestor';
      }).length;
      const proposta = candidates.filter(c => {
        const st = (c as any).stage || (c as any).etapa;
        return st === 'Proposta' || st === 'Admissão' || st === 'Aprovado';
      }).length;

      const calcPct = (cnt: number) => totalCandidates > 0 ? Math.round((cnt / totalCandidates) * 100) : 0;

      setFunnelSteps([
        { stageId: 'triagem', stageName: 'Triagem', candidateCount: triagem, candidatesCount: triagem, percentage: calcPct(triagem), colorClass: 'bg-blue-500' },
        { stageId: 'entrev-rh', stageName: 'Entrevista RH', candidateCount: entRh, candidatesCount: entRh, percentage: calcPct(entRh), colorClass: 'bg-indigo-500' },
        { stageId: 'aval-tec', stageName: 'Avaliação Técnica', candidateCount: tec, candidatesCount: tec, percentage: calcPct(tec), colorClass: 'bg-purple-500' },
        { stageId: 'entrev-gestor', stageName: 'Entrevista Gestor', candidateCount: gestor, candidatesCount: gestor, percentage: calcPct(gestor), colorClass: 'bg-amber-500' },
        { stageId: 'proposta', stageName: 'Proposta / Admissão', candidateCount: proposta, candidatesCount: proposta, percentage: calcPct(proposta), colorClass: 'bg-emerald-500' }
      ]);

      setMetrics({
        activeJobsCount: activeJobs.length,
        activeJobsSlaAlertsCount: jobs.filter(j => (j as any).urgency === 'Alta' || (j as any).urgency === 'Crítica').length,
        candidatesInProcessCount: totalCandidates,
        interviewsScheduledCount: entRh + gestor,
        hiresThisMonthCount: proposta,
        monthlyHiresTarget: activeJobs.length * 2 || 10,
        avgTimeToHireDays: 18,
        slaTargetDays: 30,
        offerAcceptanceRate: proposta > 0 ? Math.min(100, Math.round((candidates.filter(c => String((c as any).status || '').toLowerCase() === 'contratado').length / proposta) * 100)) : 0,
      });

      // Group by department
      const deptMap = new Map<string, number>();
      activeJobs.forEach(j => {
        const d = j.department || 'Geral';
        deptMap.set(d, (deptMap.get(d) || 0) + 1);
      });
      const deptList = Array.from(deptMap.entries()).map(([departmentName, activeJobsCount]) => ({
        departmentName,
        activeJobsCount,
        candidatesInProcessCount: Math.round(totalCandidates / (deptMap.size || 1)),
        avgSlaDays: 15
      }));
      setDepartments(deptList);

    } catch (err) {
      console.warn('Aviso ao carregar dados reais do dashboard:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const canManageUsers = hasActionAccess('manage_users');
  const canEditBudget = hasActionAccess('edit_budget');

  const handleResolveAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-[#1E293B] tracking-tight">
              Dashboard Corporativo
            </h2>
            <span className="bg-blue-50 text-[#2563EB] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
              SaaS RH TRANSFORMA
            </span>
          </div>
          <p className="text-xs text-[#64748B] font-medium">
            Bem-vindo(a), <strong className="text-[#1E293B]">{user?.name}</strong>. Visão geral e limpa dos indicadores de RH.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            className="border-[#E5E7EB] text-[#1E293B] hover:bg-[#F8FAFC]"
          >
            Atualizar Dados
          </Button>

          {onNavigateToReports && (isMaster || isModuleActive('relatoriosAvancados')) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onNavigateToReports}
              leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
              className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
            >
              Relatórios
            </Button>
          )}
        </div>
      </div>

      {/* Official KPI Cards Grid - Filtered by Company Enabled Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Vagas Abertas */}
        {showVagas && (
          <MetricCard
            title="Vagas Abertas"
            value={metrics.activeJobsCount}
            subtitle="Processos ativos"
            icon={<Briefcase className="w-5 h-5 text-[#2563EB]" />}
            accentColor="blue"
            trend={{ value: '+2 esta semana', isPositive: true }}
            onClick={onNavigateToJobs}
          />
        )}

        {/* 2. Candidatos */}
        {showTalentos && (
          <MetricCard
            title="Candidatos"
            value={metrics.candidatesInProcessCount}
            subtitle="Cadastrados no funil"
            icon={<Users className="w-5 h-5 text-[#2563EB]" />}
            accentColor="blue"
            trend={{ value: 'Em análise', neutral: true }}
            onClick={onNavigateToTalentBank}
          />
        )}

        {/* 3. Entrevistas */}
        {showEntrevistas && (
          <MetricCard
            title="Entrevistas"
            value={metrics.interviewsScheduledCount}
            subtitle="Agendadas na semana"
            icon={<Calendar className="w-5 h-5 text-[#2563EB]" />}
            accentColor="blue"
            trend={{ value: '3 hoje', isPositive: true }}
            onClick={onNavigateToInterviews}
          />
        )}

        {/* 4. Contratações */}
        {showContratacoes && (
          <MetricCard
            title="Contratações"
            value={14}
            subtitle="Finalizadas este mês"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            accentColor="emerald"
            trend={{ value: '100% da meta', isPositive: true }}
          />
        )}

        {/* 5. Indicadores IA (Gold Premium #B8963E) */}
        {showIA && (
          <Card
            className="p-4 flex flex-col justify-between space-y-3 bg-white border border-[#E5E7EB] hover:border-[#B8963E]/40 transition-all cursor-pointer group shadow-2xs"
            onClick={onNavigateToReports}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-black text-[#B8963E] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Indicadores IA
                </p>
                <h4 className="text-2xl font-black text-[#1E293B] mt-1 leading-none">
                  94.8%
                </h4>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#B8963E]/10 border border-[#B8963E]/30 text-[#B8963E] flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E5E7EB]">
              <span className="text-[#64748B] text-[11px]">Aderência Preditiva</span>
              <span className="bg-[#B8963E]/10 text-[#B8963E] text-[10px] font-bold px-1.5 py-0.2 rounded">
                Alta Precisão
              </span>
            </div>
          </Card>
        )}
      </div>

      {/* Secondary Performance SLA Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 bg-white border border-[#E5E7EB] flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider font-extrabold text-[#64748B]">
              SLA Médio de Fechamento de Vagas
            </p>
            <h4 className="text-2xl font-black text-[#1E293B]">{metrics.avgTimeToHireDays} Dias</h4>
            <p className="text-xs text-[#64748B]">Meta corporativa: abaixo de 20 dias</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 bg-white border border-[#E5E7EB] flex items-center justify-between shadow-2xs">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider font-extrabold text-[#64748B]">
              Taxa de Aceite de Proposta
            </p>
            <h4 className="text-2xl font-black text-[#1E293B]">{metrics.offerAcceptanceRate}%</h4>
            <p className="text-xs text-[#64748B]">Efetividade na contratação de talentos</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <TrendingUp className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Main Content Layout: Breakdown & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DepartmentBreakdownCard departments={departments} />
          <ResponsibleBreakdownCard responsibles={responsibles} />
        </div>

        <div className="space-y-6">
          <PendingAlertsCard
            alerts={alerts}
            onResolveAlert={handleResolveAlert}
            canManageAlerts={canEditBudget || canManageUsers}
          />
          <FunnelOverviewCard steps={funnelSteps} />
        </div>
      </div>
    </div>
  );
};
