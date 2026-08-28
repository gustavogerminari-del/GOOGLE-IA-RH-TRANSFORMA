import React, { useState } from 'react';
// RH_DP_DASHBOARD_REAL_V1 — indicadores sem valores estimados ou séries históricas inventadas.
import { 
  Users, 
  UserPlus, 
  Clock, 
  Gift, 
  Umbrella, 
  LogOut, 
  FileText, 
  ShieldAlert, 
  AlertTriangle, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Cake,
  ArrowRight,
  HelpCircle,
  FileCheck,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart2,
  TrendingDown,
  Award,
  Sparkles,
  RefreshCw,
  Zap,
  Briefcase
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  LineChart, 
  Line, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  ColaboradorCompleto, 
  RegistroFeriasColaborador, 
  CalculoRescisorio, 
  AfastamentoColaborador, 
  DocumentoColaborador, 
  AjustePontoColaborador, 
  AdmissaoPending, 
  DPGlobalFilterState, 
  DPKpiDrilldownData, 
  DPAlertItem, 
  AlertStatus 
} from '../types/dp';
import { DpGlobalFiltersBar } from './DpGlobalFiltersBar';
import { DpMetricDrilldownModal } from './DpMetricDrilldownModal';
import { DpAlertsPanel } from './DpAlertsPanel';
import { PermissionService } from '../../services/PermissionService';

interface DpDashboardProps {
  userRole?: string;
  companyId: string;
  colaboradores: ColaboradorCompleto[];
  ferias: RegistroFeriasColaborador[];
  rescisoes: CalculoRescisorio[];
  afastamentos: AfastamentoColaborador[];
  documentos: DocumentoColaborador[];
  ajustesPonto: AjustePontoColaborador[];
  admissoes: AdmissaoPending[];
  alerts: DPAlertItem[];
  onUpdateAlertStatus: (alertId: string, status: AlertStatus, ignoreReason?: string) => void;
  onNavigateSubTab: (subTab: string, filter?: string) => void;
  onOpenColaboradorProfile?: (colab: ColaboradorCompleto) => void;
}

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export const DpDashboard: React.FC<DpDashboardProps> = ({
  userRole = 'RH',
  companyId,
  colaboradores,
  ferias,
  rescisoes,
  afastamentos,
  documentos,
  ajustesPonto,
  admissoes,
  alerts,
  onUpdateAlertStatus,
  onNavigateSubTab,
  onOpenColaboradorProfile
}) => {
  // Permission checks
  const canViewFinancials = PermissionService.isRH(userRole) || PermissionService.isEmpresaAdmin(userRole);
  const isMasterUser = PermissionService.isMaster(userRole);

  // Global Filter State
  const [filters, setFilters] = useState<DPGlobalFilterState>({
    period: 'mes_atual',
    startDate: '',
    endDate: '',
    companyId,
    department: '',
    costCenter: '',
    unit: '',
    role: '',
    manager: '',
    contractType: '',
    employeeStatus: 'Ativo',
    competence: '',
    ageRange: '',
    tenure: ''
  });

  // Drilldown Modal State
  const [drilldownData, setDrilldownData] = useState<DPKpiDrilldownData | null>(null);

  // Filtered Lists
  const filteredColaboradores = colaboradores.filter(c => {
    if (filters.department && c.profissionais?.departamento !== filters.department) return false;
    if (filters.unit && c.profissionais?.unidade !== filters.unit) return false;
    if (filters.costCenter && c.profissionais?.centroCusto !== filters.costCenter) return false;
    if (filters.role && c.profissionais?.cargo !== filters.role) return false;
    if (filters.manager && c.profissionais?.gestor !== filters.manager) return false;
    if (filters.contractType && c.profissionais?.tipoContrato !== filters.contractType) return false;
    if (filters.employeeStatus !== 'Todos') {
      const st = c.profissionais?.status || 'Ativo';
      if (filters.employeeStatus === 'Ativo' && st !== 'Ativo') return false;
      if (filters.employeeStatus === 'Afastado' && st !== 'Afastado') return false;
      if (filters.employeeStatus === 'Ferias' && st !== 'Férias') return false;
      if (filters.employeeStatus === 'Rescindido' && st !== 'Rescindido') return false;
    }
    return true;
  });

  // Extract Lists for Filters
  const departments = Array.from(new Set(colaboradores.map(c => c.profissionais?.departamento).filter(Boolean))) as string[];
  const units = Array.from(new Set(colaboradores.map(c => c.profissionais?.unidade).filter(Boolean))) as string[];
  const costCenters = Array.from(new Set(colaboradores.map(c => c.profissionais?.centroCusto).filter(Boolean))) as string[];
  const roles = Array.from(new Set(colaboradores.map(c => c.profissionais?.cargo).filter(Boolean))) as string[];
  const managers = Array.from(new Set(colaboradores.map(c => c.profissionais?.gestor).filter(Boolean))) as string[];

  // METRIC CALCULATIONS FROM REAL CLOUDFLARE Firestore DATA
  const totalHeadcount = filteredColaboradores.length;
  const colaboradoresAtivos = filteredColaboradores.filter(c => c.profissionais?.status === 'Ativo');
  const colaboradoresAfastados = filteredColaboradores.filter(c => c.profissionais?.status === 'Afastado');
  const colaboradoresEmFerias = filteredColaboradores.filter(c => c.profissionais?.status === 'Férias');
  const admissoesPendentes = admissoes.filter(a => a.status !== 'Efetivado' && a.status !== 'Cancelado');

  // Turnover Formula: (Desligamentos / Média de Colaboradores) * 100
  const totalDesligamentosPeriodo = rescisoes.length;
  const mediaColaboradoresPeriodo = totalHeadcount || 1;
  const turnoverTaxaPercent = Number(((totalDesligamentosPeriodo / mediaColaboradoresPeriodo) * 100).toFixed(1));

  // Afastamentos são contados de registros reais. Taxa de absenteísmo só pode existir
  // quando horas previstas e horas ausentes vierem da apuração real do Ponto.
  const totalAfastamentosAtivos = afastamentos.filter(a => a.status === 'Ativo').length;
  const absenteismoTaxaPercent = 0;

  // Custos conhecidos: somente salários-base realmente cadastrados.
  // Encargos e benefícios só entram quando vierem do fechamento real da Folha/Benefícios.
  const folhaSalariosBruta = colaboradoresAtivos.reduce((acc, c) => acc + (c.profissionais?.salarioBase || 0), 0);
  const encargosTrabalhistasEstimados = 0;
  const custosBeneficiosTotal = 0;
  const custoTotalMensalDP = folhaSalariosBruta;

  // Birthdays of the month
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const aniversariantesMes = filteredColaboradores.filter(c => {
    if (!c.pessoais?.dataNascimento) return false;
    const dob = new Date(c.pessoais.dataNascimento);
    return dob.getMonth() === mesAtual;
  });

  // Experience periods expiring in 30 days
  const em30Dias = new Date(hoje.getTime() + 30 * 86400000);
  const experienciaVencendo = colaboradoresAtivos.filter(c => {
    if (!c.profissionais?.dataAdmissao) return false;
    const admDate = new Date(c.profissionais.dataAdmissao);
    const exp45 = new Date(admDate.getTime() + 45 * 86400000);
    const exp90 = new Date(admDate.getTime() + 90 * 86400000);
    return (exp45 >= hoje && exp45 <= em30Dias) || (exp90 >= hoje && exp90 <= em30Dias);
  });

  // Department Breakdown for Recharts
  const deptMap: Record<string, number> = {};
  filteredColaboradores.forEach(c => {
    const d = c.profissionais?.departamento || 'Não Especificado';
    deptMap[d] = (deptMap[d] || 0) + 1;
  });
  const deptChartData = Object.keys(deptMap).map(dept => ({
    name: dept,
    colaboradores: deptMap[dept],
    custoEstimado: deptMap[dept] * (folhaSalariosBruta / (totalHeadcount || 1))
  }));

  // Sem snapshots históricos não existe série mensal confiável.
  // Exibe somente a competência atual até que o histórico real esteja persistido.
  const trendChartData = [
    { mes: 'Atual', headcount: totalHeadcount, turnover: turnoverTaxaPercent, absenteismo: absenteismoTaxaPercent }
  ];

  // Drilldown Triggers
  const openHeadcountDrilldown = () => {
    setDrilldownData({
      metricKey: 'headcount',
      title: 'Quadro Geral de Colaboradores (Headcount Real)',
      formula: 'Ativos + Afastados + Em Férias (Exclui Rescindidos)',
      periodLabel: 'Mês Atual',
      totalCount: filteredColaboradores.length,
      items: filteredColaboradores.map(c => ({
        nomeCompleto: c.nomeCompleto,
        cpf: c.pessoais?.cpf || '-',
        cargo: c.profissionais?.cargo || '-',
        departamento: c.profissionais?.departamento || '-',
        status: c.profissionais?.status || 'Ativo',
        salarioBase: c.profissionais?.salarioBase || 0,
        dataAdmissao: c.profissionais?.dataAdmissao || '-'
      })),
      columns: [
        { key: 'nomeCompleto', label: 'Nome Completo' },
        { key: 'cpf', label: 'CPF' },
        { key: 'cargo', label: 'Cargo' },
        { key: 'departamento', label: 'Departamento' },
        { key: 'status', label: 'Status', format: 'badge' },
        { key: 'salarioBase', label: 'Salário Base', format: 'currency' },
        { key: 'dataAdmissao', label: 'Admissão' }
      ]
    });
  };

  const openCostsDrilldown = () => {
    if (!canViewFinancials) return;
    setDrilldownData({
      metricKey: 'custos_folha',
      title: 'Detalhamento de Custos Mensais da Folha de Pagamento',
      formula: 'Somatório dos salários-base cadastrados. Encargos e benefícios entram somente após fechamento real.',
      periodLabel: 'Competência Atual',
      totalCount: colaboradoresAtivos.length,
      totalValue: custoTotalMensalDP,
      items: colaboradoresAtivos.map(c => {
        const sal = c.profissionais?.salarioBase || 0;
        const enc = 0;
        const ben = 0;
        return {
          colaborador: c.nomeCompleto,
          cargo: c.profissionais?.cargo || '-',
          departamento: c.profissionais?.departamento || '-',
          salarioBase: sal,
          encargos: enc,
          beneficios: ben,
          total: sal + enc + ben
        };
      }),
      columns: [
        { key: 'colaborador', label: 'Colaborador' },
        { key: 'cargo', label: 'Cargo' },
        { key: 'departamento', label: 'Departamento' },
        { key: 'salarioBase', label: 'Salário Base', format: 'currency' },
        { key: 'encargos', label: 'Encargos (aguarda folha)', format: 'currency' },
        { key: 'beneficios', label: 'Benefícios (aguarda fechamento)', format: 'currency' },
        { key: 'total', label: 'Custo Total', format: 'currency' }
      ]
    });
  };

  const openTurnoverDrilldown = () => {
    setDrilldownData({
      metricKey: 'turnover',
      title: 'Detalhamento do Turnover & Histórico de Desligamentos',
      formula: 'Taxa = (Desligamentos do Período ÷ Média do Quadro) × 100',
      periodLabel: 'Registros disponíveis',
      totalCount: rescisoes.length,
      items: rescisoes.map(r => ({
        colaborador: r.colaboradorNome,
        tipoRescisao: r.tipoRescisao,
        dataDesligamento: r.dataDesligamento,
        avisoPrevio: r.avisoPrevio,
        valorPago: r.valorLiquidoRescisao
      })),
      columns: [
        { key: 'colaborador', label: 'Colaborador' },
        { key: 'tipoRescisao', label: 'Tipo de Rescisão', format: 'badge' },
        { key: 'dataDesligamento', label: 'Data Desligamento' },
        { key: 'avisoPrevio', label: 'Aviso Prévio' },
        { key: 'valorPago', label: 'Verbas Pagas', format: 'currency' }
      ]
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 text-xs font-black px-3 py-1 rounded-full border border-indigo-400/30">
              <Users className="w-3.5 h-3.5" />
              <span>Painel Executivo de Departamento Pessoal — dados persistidos</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Indicadores Globais de RH & Pessoal</h1>
            <p className="text-xs text-slate-300 font-medium max-w-2xl">
              Monitoramento de registros persistidos de headcount, admissões, desligamentos, afastamentos e alertas. Indicadores financeiros só exibem valores consolidados disponíveis.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateSubTab('colaboradores')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Colaborador</span>
            </button>
            <button
              onClick={() => onNavigateSubTab('relatorios-dp')}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/20 cursor-pointer flex items-center gap-1.5"
            >
              <BarChart2 className="w-4 h-4" />
              <span>Gerador de Relatórios</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Filters Bar */}
      <DpGlobalFiltersBar
        filters={filters}
        onChangeFilters={setFilters}
        departments={departments}
        units={units}
        costCenters={costCenters}
        roles={roles}
        managers={managers}
        isMasterUser={isMasterUser}
      />

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Headcount */}
        <div 
          onClick={openHeadcountDrilldown}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Headcount Total</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-black text-slate-900">{totalHeadcount}</p>
            <span className="text-xs font-bold text-slate-400">{colaboradoresAtivos.length} ativos</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-600 pt-2 border-t border-slate-100">
            <span>Ver quadro completo</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Turnover Rate */}
        <div 
          onClick={openTurnoverDrilldown}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Taxa de Turnover</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-black text-amber-700">{turnoverTaxaPercent}%</p>
            <span className="text-xs font-bold text-slate-400">{rescisoes.length} desligamentos</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-600 pt-2 border-t border-slate-100">
            <span>Análise de retenção</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Absenteeism Rate */}
        <div 
          onClick={() => onNavigateSubTab('ferias-afastamentos')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Afastamentos Ativos</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Umbrella className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-black text-rose-700">{totalAfastamentosAtivos}</p>
            <span className="text-xs font-bold text-slate-400">registros ativos</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-rose-600 pt-2 border-t border-slate-100">
            <span>Registros ativos de afastamento</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Custo Total DP (RH / Admin only) */}
        {canViewFinancials ? (
          <div 
            onClick={openCostsDrilldown}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Salários-base cadastrados</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black text-slate-900">
                {custoTotalMensalDP.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-600 pt-2 border-t border-slate-100">
              <span>Sem estimativas de encargos/benefícios</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3 opacity-80">
            <span className="text-[11px] font-black text-slate-400 uppercase">Custo Pessoal</span>
            <p className="text-sm font-bold text-slate-500">Restrito a Perfil RH / Financeiro</p>
            <p className="text-[11px] text-slate-400 border-t border-slate-200 pt-2">Acesso protegido por perfil</p>
          </div>
        )}

      </div>

      {/* Visual Recharts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Department Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Distribuição de Quadro por Departamento</h3>
              <p className="text-xs text-slate-500 font-medium">Quantidade real de colaboradores alocados</p>
            </div>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <BarChart2 className="w-4 h-4" />
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Bar dataKey="colaboradores" fill="#2563EB" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Evolution & Turnover Trends */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Indicadores da competência atual</h3>
              <p className="text-xs text-slate-500 font-medium">Histórico mensal será exibido quando houver snapshots reais</p>
            </div>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="headcount" name="Headcount Ativo" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="turnover" name="Turnover %" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Unified Alerts Center */}
      <DpAlertsPanel
        alerts={alerts}
        onUpdateAlertStatus={onUpdateAlertStatus}
        onNavigateSubTab={onNavigateSubTab}
      />

      {/* Drilldown Modal */}
      <DpMetricDrilldownModal
        data={drilldownData}
        onClose={() => setDrilldownData(null)}
      />

    </div>
  );
};
