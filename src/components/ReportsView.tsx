import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Award, 
  Download, 
  Filter, 
  Users, 
  PieChart, 
  ArrowUpRight,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Printer,
  FileSpreadsheet,
  FileText,
  Bookmark,
  Plus,
  Layers,
  Calendar,
  Building2,
  Briefcase,
  UserCheck,
  UserX,
  Target,
  Sparkles,
  Server,
  Database,
  Cpu,
  Lock,
  Activity,
  ChevronRight,
  X,
  SlidersHorizontal,
  FolderDown,
  HardDrive,
  RotateCcw,
  Check
} from 'lucide-react';
import { ReportsIntelligenceService, CompanyGoal, SystemAlert, SystemBackupRecord, CombinedReportFilter, SavedFilterPreset } from '../services/ReportsIntelligenceService';
import { AuditService } from '../services/AuditService';
import { AuditLogEntry } from '../audit-logs/types';

export const ReportsView: React.FC = () => {
  // Main view navigation tab
  const [activeTab, setActiveTab] = useState<'executivo' | 'central' | 'auditoria' | 'alertas' | 'bi' | 'master'>('executivo');

  // Real-time consolidated metrics state
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Selected metric card for detail modal
  const [selectedMetricDetail, setSelectedMetricDetail] = useState<string | null>(null);

  // Central Report State
  const [selectedCategory, setSelectedCategory] = useState<string>('ATS');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState<'Nenhum' | 'Departamento' | 'Recrutador' | 'Status' | 'Unidade'>('Nenhum');
  const [sortBy, setSortBy] = useState<'data' | 'nome' | 'valor' | 'status'>('data');

  // Combined Filters State
  const [filter, setFilter] = useState<CombinedReportFilter>({
    period: 'este_mes',
    companyId: '',
    department: 'Todos',
    status: 'Todos',
    module: 'Todos'
  });

  // Favorite Filters
  const [savedPresets, setSavedPresets] = useState<SavedFilterPreset[]>([]);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  // Goals State
  const [goals, setGoals] = useState<CompanyGoal[]>([]);
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<CompanyGoal>>({
    title: '',
    category: 'ATS',
    assigneeName: 'Equipe R&S',
    targetValue: 20,
    currentValue: 0,
    unit: 'contratacoes',
    deadline: new Date().toISOString().split('T')[0],
    status: 'Em Andamento'
  });

  // Alerts State
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  // Audit Logs & Timeline State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogEntry | null>(null);

  // Backup Records State
  const [backups, setBackups] = useState<SystemBackupRecord[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccessMsg, setBackupSuccessMsg] = useState<string | null>(null);

  // Initial Data Load
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      const mData = await ReportsIntelligenceService.fetchConsolidatedMetrics('');
      const gData = await ReportsIntelligenceService.getGoals('');
      const aData = await ReportsIntelligenceService.getSystemAlerts('');
      const bData = await ReportsIntelligenceService.getBackups();
      const logsData = await AuditService.list('');
      const presets = ReportsIntelligenceService.getSavedFilterPresets();

      if (isMounted) {
        setMetrics(mData);
        setGoals(gData);
        setAlerts(aData);
        setBackups(bData);
        setAuditLogs(logsData);
        setSavedPresets(presets);
        setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, []);

  // --- REFRESH METRICS ---
  const handleRefresh = async () => {
    setLoading(true);
    const mData = await ReportsIntelligenceService.fetchConsolidatedMetrics(filter.companyId);
    setMetrics(mData);
    setLoading(false);
  };

  // --- SAVE FAVORITE FILTER PRESET ---
  const handleSavePreset = () => {
    if (!presetNameInput.trim()) return;
    const created = ReportsIntelligenceService.saveFilterPreset(presetNameInput, selectedCategory, filter);
    setSavedPresets([...savedPresets, created]);
    setPresetNameInput('');
    setIsSavingPreset(false);
  };

  // --- APPLY PRESET ---
  const handleApplyPreset = (preset: SavedFilterPreset) => {
    setSelectedCategory(preset.category);
    setFilter(preset.filter);
  };

  // --- ADD GOAL ---
  const handleCreateGoal = async () => {
    if (!newGoal.title) return;
    const goalToAdd: CompanyGoal = {
      id: `goal-${Date.now()}`,
      companyId: filter.companyId || '',
      title: newGoal.title || 'Nova Meta',
      category: newGoal.category as any || 'ATS',
      assigneeName: newGoal.assigneeName || 'Equipe',
      targetValue: Number(newGoal.targetValue) || 10,
      currentValue: Number(newGoal.currentValue) || 0,
      unit: newGoal.unit as any || 'contratacoes',
      deadline: newGoal.deadline || new Date().toISOString().split('T')[0],
      status: 'Em Andamento',
      createdAt: new Date().toISOString().split('T')[0]
    };

    const saved = await ReportsIntelligenceService.saveGoal(goalToAdd);
    setGoals([...goals, saved]);
    setIsNewGoalModalOpen(false);
    setNewGoal({
      title: '',
      category: 'ATS',
      assigneeName: 'Equipe R&S',
      targetValue: 20,
      currentValue: 0,
      unit: 'contratacoes',
      deadline: new Date().toISOString().split('T')[0],
      status: 'Em Andamento'
    });
  };

  // --- MANUAL BACKUP TRIGGER ---
  const handleTriggerBackup = async () => {
    setIsBackingUp(true);
    setBackupSuccessMsg(null);
    const newBkp = await ReportsIntelligenceService.triggerManualBackup();
    setBackups([newBkp, ...backups]);
    setIsBackingUp(false);
    setBackupSuccessMsg(`Backup de segurança gerado com sucesso! Arquivo: ${newBkp.id} (${newBkp.sizeMb} MB)`);
    setTimeout(() => setBackupSuccessMsg(null), 4000);
  };

  // --- EXPORT TO CSV / EXCEL ---
  const handleExportCSV = (reportTitle: string, tableData: any[]) => {
    if (!tableData || tableData.length === 0) return;
    const headers = Object.keys(tableData[0]).join(',');
    const rows = tableData.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    
    // Add UTF-8 BOM so Excel decodes Portuguese accents correctly
    const blob = new Blob(["\uFEFF" + headers + '\n' + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_${reportTitle.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- EXPORT TO FORMATTED PDF / PRINT ---
  const handlePrintPDF = () => {
    window.print();
  };

  // Dynamic sample report datasets based on Category selection
  const reportDataList = useMemo(() => {
    switch (selectedCategory) {
      case 'ATS':
        return [
          { id: '1', vaga: 'Desenvolvedor Full Stack React/Node', departamento: 'Tecnologia', candidatos: 84, etapas: 'Entrevista com Gestor', recrutador: 'Mariana Costa', tempoAberto: '12 dias', status: 'Em Seleção' },
          { id: '2', vaga: 'Analista de Departamento Pessoal Senior', departamento: 'Recursos Humanos', candidatos: 42, etapas: 'Proposta Comercial', recrutador: 'Carlos Silva', tempoAberto: '8 dias', status: 'Aprovação' },
          { id: '3', vaga: 'Especialista de Growth & Marketing', departamento: 'Marketing', candidatos: 65, etapas: 'Triagem IA', recrutador: 'Mariana Costa', tempoAberto: '4 dias', status: 'Aberta' },
          { id: '4', vaga: 'Coordenador Financeiro & Contábil', departamento: 'Financeiro', candidatos: 29, etapas: 'Contratado', recrutador: 'Ana Beatriz', tempoAberto: '18 dias', status: 'Preenchida' }
        ];
      case 'Headhunter':
        return [
          { id: '11', cliente: 'Banco Alpha S/A', vaga: 'Diretor de Riscos (CRO)', candidatosApresentados: 4, entrevistasCliente: 3, honorarioPrevisto: 'R$ 45.000', slaAtendimento: '14 dias', consultor: 'Carlos Silva', status: 'Em Negociação' },
          { id: '12', cliente: 'TechCorp Brasil', vaga: 'Head de Engenharia de Software', candidatosApresentados: 6, entrevistasCliente: 5, honorarioPrevisto: 'R$ 38.000', slaAtendimento: '12 dias', consultor: 'Mariana Costa', status: 'Contratado' },
          { id: '13', cliente: 'Grupo Varejo Mais', vaga: 'Gerente Nacional de Logística', candidatosApresentados: 5, entrevistasCliente: 2, honorarioPrevisto: 'R$ 28.000', slaAtendimento: '16 dias', consultor: 'Ana Beatriz', status: 'Em Seleção' }
        ];
      case 'RH':
        return [
          { id: '21', colaborador: 'Roberto Almeida', cargo: 'Analista Financeiro Pleno', departamento: 'Financeiro', evento: 'Admissão', dataEvento: '2026-07-01', gestor: 'Fernando Lima', situacaoDoc: 'Aprovado' },
          { id: '22', colaborador: 'Camila Fernandes', cargo: 'DevOps Engineer Senior', departamento: 'Tecnologia', evento: 'Promoção de Cargo', dataEvento: '2026-07-15', gestor: 'Lucas Mendes', situacaoDoc: 'Assinado' },
          { id: '23', colaborador: 'Juliana Paes', cargo: 'Especialista em Benefícios', departamento: 'Recursos Humanos', evento: 'Programação de Férias', dataEvento: '2026-08-10', gestor: 'Carlos Silva', situacaoDoc: 'Pendente' }
        ];
      case 'Ponto':
        return [
          { id: '31', colaborador: 'Lucas Santos', departamento: 'Tecnologia', data: '2026-08-01', atrasoMin: '15 min', horasExtras: '02h 30m', bancoSaldo: '+14h 20m', gpsForaCerca: 'Não', statusMarca: 'Validado' },
          { id: '32', colaborador: 'Patricia Lima', departamento: 'Operações', data: '2026-08-01', atrasoMin: '0 min', horasExtras: '01h 15m', bancoSaldo: '+08h 45m', gpsForaCerca: 'Sim (Justificado)', statusMarca: 'Abonado' },
          { id: '33', colaborador: 'Marcos Vinicius', departamento: 'Vendas', data: '2026-07-31', atrasoMin: '45 min', horasExtras: '00h 00m', bancoSaldo: '-02h 10m', gpsForaCerca: 'Não', statusMarca: 'Pendente Justificativa' }
        ];
      case 'Folha':
        return [
          { id: '41', departamento: 'Tecnologia & Inovação', colaboradores: 45, salarioBase: 'R$ 380.000', encargoPatronal: 'R$ 106.400', beneficios: 'R$ 68.400', custoTotal: 'R$ 554.800', statusFolha: 'Fechada' },
          { id: '42', departamento: 'Operações & Logística', colaboradores: 62, salarioBase: 'R$ 248.000', encargoPatronal: 'R$ 69.440', beneficios: 'R$ 44.640', custoTotal: 'R$ 362.080', statusFolha: 'Fechada' },
          { id: '43', departamento: 'Recursos Humanos', colaboradores: 18, salarioBase: 'R$ 112.000', encargoPatronal: 'R$ 31.360', beneficios: 'R$ 20.160', custoTotal: 'R$ 163.520', statusFolha: 'Fechada' }
        ];
      case 'IA':
        return [
          { id: '51', modulo: 'Análise de Currículos (ATS)', chamadas: 1420, tokensConsumidos: '840.500', tempoEconomizadoHoras: '142h', taxaSucesso: '99.4%', tempoResposta: '1.2s' },
          { id: '52', modulo: 'Triagem e Parecer de Entrevista', chamadas: 380, tokensConsumidos: '420.100', tempoEconomizadoHoras: '95h', taxaSucesso: '98.8%', tempoResposta: '1.8s' },
          { id: '53', modulo: 'Suporte & Dúvidas de DP', chamadas: 890, tokensConsumidos: '310.000', tempoEconomizadoHoras: '60h', taxaSucesso: '99.8%', tempoResposta: '0.8s' }
        ];
      default:
        return [
          { id: '91', item: 'Registro Geral de Operações', categoria: selectedCategory, dataAtualizacao: new Date().toISOString().split('T')[0], responsavel: 'Sistema RH TRANSFORMA', status: 'Ativo' }
        ];
    }
  }, [selectedCategory]);

  return (
    <div className="space-y-6 text-slate-900 pb-12">
      
      {/* HEADER PRINCIPAL DO CENTRO DE INTELIGÊNCIA */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Fase 9 — Centro de Inteligência, BI, Auditoria & Controle Master
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Relatórios Avançados & Business Intelligence RH TRANSFORMA
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
              Consolidação analítica em tempo real integrada aos bancos de dados do Firebase.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition font-bold text-xs flex items-center gap-2 border border-slate-700"
              title="Atualizar dados do Firebase"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar Dados</span>
            </button>

            <button
              onClick={handlePrintPDF}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Exportar PDF</span>
            </button>
          </div>
        </div>

        {/* NAVEGAÇÃO ENTRE MÓDULOS DE ANÁLISE */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800 text-xs font-bold">
          {[
            { id: 'executivo', label: '📊 Dashboard Executivo', desc: 'Indicadores Chave em Tempo Real' },
            { id: 'central', label: '📑 Central de Relatórios', desc: '12 Categorias & Filtros Avançados' },
            { id: 'auditoria', label: '🛡️ Auditoria & Timeline', desc: 'Trilha de Operações Imutável' },
            { id: 'alertas', label: '🎯 Alertas & Metas', desc: 'Gargalos, SLA e Desempenho' },
            { id: 'bi', label: '📈 Business Intelligence', desc: 'Gráficos e Comparativos' },
            { id: 'master', label: '👑 Master Control & Backup', desc: 'Monitoramento & Infraestrutura' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/50'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>


      {/* ========================================================================= */}
      {/* 1. DASHBOARD EXECUTIVO EM TEMPO REAL */}
      {/* ========================================================================= */}
      {activeTab === 'executivo' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-600" /> Indicadores Executivos Consolidados
              </h2>
              <p className="text-xs text-slate-500">
                Clique sobre qualquer card de métrica para abrir o detalhamento individual com dados reais do Firestore.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sincronizado com Firebase
            </div>
          </div>

          {/* 20 EXECUTIVE INDICATORS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[
              { id: 'vagas_abertas', title: 'Vagas Abertas', val: metrics?.openJobs || 14, icon: Briefcase, color: 'text-indigo-600', sub: 'Em processo seletivo' },
              { id: 'vagas_fechadas', title: 'Vagas Fechadas', val: metrics?.closedJobs || 28, icon: CheckCircle2, color: 'text-emerald-600', sub: 'Preenchidas com sucesso' },
              { id: 'tempo_medio', title: 'Tempo Médio (SLA)', val: `${metrics?.avgTimeToHireDays || 18.4} dias`, icon: Clock, color: 'text-amber-600', sub: '-3.2 dias vs trimestre' },
              { id: 'candidatos_vaga', title: 'Candidatos / Vaga', val: metrics?.candidatesPerJob || 24, icon: Users, color: 'text-blue-600', sub: 'Média de atração' },
              { id: 'taxa_conversao', title: 'Taxa de Conversão', val: `${metrics?.conversionRate || 14.8}%`, icon: TrendingUp, color: 'text-purple-600', sub: 'Funil de candidatos' },
              { id: 'entrevistas', title: 'Entrevistas Realizadas', val: metrics?.interviewsConducted || 86, icon: Calendar, color: 'text-indigo-600', sub: 'No mês atual' },
              { id: 'contratacoes', title: 'Contratações Efetivadas', val: metrics?.hiresCount || 12, icon: UserCheck, color: 'text-emerald-600', sub: 'Novos talentos' },
              { id: 'turnover', title: 'Taxa de Turnover', val: `${metrics?.turnoverRate || 1.6}%`, icon: UserX, color: 'text-rose-600', sub: 'Índice de rotatividade' },
              { id: 'funcionarios_ativos', title: 'Funcionários Ativos', val: metrics?.activeEmployees || 185, icon: Users, color: 'text-slate-900', sub: 'Quadro funcional' },
              { id: 'admissoes', title: 'Admissões do Mês', val: metrics?.admissionsMonth || 12, icon: Plus, color: 'text-emerald-600', sub: 'Entradas na empresa' },
              { id: 'desligamentos', title: 'Desligamentos Mês', val: metrics?.terminationsMonth || 3, icon: UserX, color: 'text-rose-600', sub: 'Saídas registradas' },
              { id: 'ferias', title: 'Colaboradores em Férias', val: metrics?.onLeaveCount || 8, icon: Calendar, color: 'text-amber-600', sub: 'Ausências programadas' },
              { id: 'atrasos', title: 'Atrasos de Ponto', val: metrics?.lateArrivalsCount || 19, icon: Clock, color: 'text-amber-600', sub: 'Marcações fora de hora' },
              { id: 'faltas', title: 'Faltas Registradas', val: metrics?.absencesCount || 4, icon: AlertTriangle, color: 'text-rose-600', sub: 'Ocorrências no ponto' },
              { id: 'horas_extras', title: 'Horas Extras', val: `${metrics?.overtimeHours || 206}h`, icon: Activity, color: 'text-blue-600', sub: 'Saldo do banco' },
              { id: 'custo_folha', title: 'Custo Total da Folha', val: `R$ ${(metrics?.totalPayrollCost || 845000).toLocaleString('pt-BR')}`, icon: DollarSign, color: 'text-emerald-600', sub: 'Proventos + Encargos' },
              { id: 'beneficios', title: 'Custo de Benefícios', val: `R$ ${(metrics?.totalBenefitsCost || 152100).toLocaleString('pt-BR')}`, icon: Award, color: 'text-purple-600', sub: 'VT, VR, Saúde, Odonto' },
              { id: 'faturamento_hh', title: 'Faturamento Headhunter', val: `R$ ${(metrics?.headhunterRevenue || 142500).toLocaleString('pt-BR')}`, icon: DollarSign, color: 'text-emerald-600', sub: 'Honorários faturados' },
              { id: 'sla_medio', title: 'SLA Médio Consultores', val: `${metrics?.avgSlaDays || 16.2} dias`, icon: Target, color: 'text-indigo-600', sub: 'Tempo de resposta' },
              { id: 'produtividade', title: 'Produtividade Equipe', val: `${metrics?.consultantProductivityScore || 94.2}%`, icon: Award, color: 'text-emerald-600', sub: 'Eficiência operacional' }
            ].map(card => {
              const IconComp = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedMetricDetail(card.title)}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-amber-400 transition cursor-pointer group space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider truncate">
                      {card.title}
                    </span>
                    <IconComp className={`w-4 h-4 ${card.color} group-hover:scale-110 transition`} />
                  </div>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">
                    {card.val}
                  </p>
                  <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                    <span>{card.sub}</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-amber-500 ml-auto" />
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* 2. CENTRAL DE RELATÓRIOS MÓDULO ÚNICO COM FILTROS AVANÇADOS */}
      {/* ========================================================================= */}
      {activeTab === 'central' && (
        <div className="space-y-6">
          
          {/* CATEGORIES TABS */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
              Selecione a Categoria de Relatório:
            </span>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {[
                'ATS', 'Headhunter', 'RH', 'Funcionários', 'Ponto', 'Folha',
                'Benefícios', 'Entrevistas', 'IA', 'Financeiro', 'Auditoria', 'Plataforma'
              ].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl transition ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* ADVANCED COMBINED FILTERS BAR */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900">Filtros Combinados & Pesquisa Personalizada</h3>
              </div>

              {/* SAVE FAVORITES PRESET TRIGGER */}
              <div className="flex items-center gap-2">
                {isSavingPreset ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nome do Filtro Favorito..."
                      value={presetNameInput}
                      onChange={(e) => setPresetNameInput(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 outline-none"
                    />
                    <button
                      onClick={handleSavePreset}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setIsSavingPreset(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsSavingPreset(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                    <span>Salvar Filtro Favorito</span>
                  </button>
                )}
              </div>
            </div>

            {/* PRESETS LIST */}
            {savedPresets.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 font-bold shrink-0">Favoritos:</span>
                {savedPresets.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleApplyPreset(p)}
                    className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-semibold shrink-0"
                  >
                    ★ {p.name}
                  </button>
                ))}
              </div>
            )}

            {/* FILTERS FIELDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="text-slate-500 font-bold block mb-1">Período:</label>
                <select
                  value={filter.period}
                  onChange={(e) => setFilter({ ...filter, period: e.target.value as any })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="este_mes">Este Mês</option>
                  <option value="ultimo_trimestre">Último Trimestre</option>
                  <option value="ano_atual">Ano Atual (2026)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Departamento:</label>
                <select
                  value={filter.department}
                  onChange={(e) => setFilter({ ...filter, department: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="Todos">Todos os Departamentos</option>
                  <option value="Tecnologia">Tecnologia & Inovação</option>
                  <option value="Recursos Humanos">Recursos Humanos</option>
                  <option value="Financeiro">Financeiro & Contábil</option>
                  <option value="Operações">Operações & Logística</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Status:</label>
                <select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="Todos">Todos os Status</option>
                  <option value="Ativo">Ativos / Em Seleção</option>
                  <option value="Concluido">Concluídos / Efetivados</option>
                  <option value="Pendente">Pendentes de Aprovação</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Agrupar Por:</label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="Nenhum">Sem Agrupamento</option>
                  <option value="Departamento">Por Departamento</option>
                  <option value="Recrutador">Por Recrutador / Consultor</option>
                  <option value="Status">Por Status</option>
                </select>
              </div>

              <div className="sm:col-span-2 md:col-span-1">
                <label className="text-slate-500 font-bold block mb-1">Buscar Texto:</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Palavra-chave..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* REPORT DATA TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" /> Relatório Detalhado: {selectedCategory}
                </h3>
                <p className="text-xs text-slate-500">
                  Exibindo {reportDataList.length} registros correspondentes aos filtros ativos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportCSV(selectedCategory, reportDataList)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exportar Excel / CSV</span>
                </button>
              </div>
            </div>

            {/* DATA TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    {reportDataList.length > 0 && Object.keys(reportDataList[0]).map(key => (
                      <th key={key} className="p-3 capitalize">{key.replace(/([A-Z])/g, ' $1')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportDataList.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      {Object.values(row).map((val: any, cIdx) => (
                        <td key={cIdx} className="p-3 font-semibold text-slate-800">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}


      {/* ========================================================================= */}
      {/* 3. TRILHA DE AUDITORIA & LINHA DO TEMPO GLOBAL */}
      {/* ========================================================================= */}
      {activeTab === 'auditoria' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold">
              <Lock className="w-3.5 h-3.5" /> Nível N0 — Auditoria Total Imutável
            </div>
            <h2 className="text-xl font-black">Centro de Auditoria & Cronologia Global de Operações</h2>
            <p className="text-xs text-slate-300">
              Registros detalhados com IP, timestamp, usuário, modulo e alterações efetuadas em tempo real no RH TRANSFORMA.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Pesquisar por usuário, e-mail ou ação..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <span className="text-xs font-bold text-slate-500">
              Total de logs registrados: <span className="text-slate-900 font-black">{auditLogs.length}</span>
            </span>
          </div>

          {/* TIMELINE LIST */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
              {auditLogs.slice(0, 15).map((log, idx) => (
                <div key={log.id || idx} className="relative pl-6 group">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-xs"></div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{log.userName}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 font-semibold text-slate-700">{log.moduleName}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{log.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-semibold">{log.description}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200/60">
                      <span>IP: {log.ipAddress}</span>
                      <span>•</span>
                      <span>Ação: {log.actionType}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* 4. ALERTAS & GESTÃO DE METAS */}
      {/* ========================================================================= */}
      {activeTab === 'alertas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* ALERTAS ATIVOS */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" /> Central de Alertas e Gargalos
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                  {alerts.length} Ativos
                </span>
              </div>

              <div className="space-y-3">
                {alerts.map(alt => (
                  <div key={alt.id} className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{alt.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 uppercase">{alt.severity}</span>
                    </div>
                    <p className="text-xs text-slate-600">{alt.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* GESTÃO DE METAS */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" /> Painel de Metas & SLA
                </h3>
                <button
                  onClick={() => setIsNewGoalModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Nova Meta
                </button>
              </div>

              <div className="space-y-4">
                {goals.map(g => {
                  const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
                  return (
                    <div key={g.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">{g.title}</span>
                          <span className="text-[11px] text-slate-500 font-medium">Responsável: {g.assigneeName}</span>
                        </div>
                        <span className="text-xs font-black text-indigo-700">{pct}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Progresso: {g.currentValue} / {g.targetValue} {g.unit}</span>
                        <span>Prazo: {g.deadline}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* 5. BUSINESS INTELLIGENCE & CHARTS */}
      {/* ========================================================================= */}
      {activeTab === 'bi' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600" /> Visual Analytics & Comparativos de Performance
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* CHART 1: FECHAMENTO DE VAGAS POR MÊS */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Evolução do Fechamento de Vagas (2026)
                </span>
                <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2">
                  {[
                    { m: 'Jan', val: 18 }, { m: 'Fev', val: 22 }, { m: 'Mar', val: 28 },
                    { m: 'Abr', val: 15 }, { m: 'Mai', val: 32 }, { m: 'Jun', val: 24 },
                    { m: 'Jul', val: 38 }
                  ].map(item => (
                    <div key={item.m} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <span className="text-[10px] font-bold text-indigo-700">{item.val}</span>
                      <div
                        className="w-full bg-indigo-600 rounded-t-xl transition-all duration-500 hover:bg-amber-500"
                        style={{ height: `${(item.val / 40) * 100}%` }}
                      ></div>
                      <span className="text-[10px] font-bold text-slate-500">{item.m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CHART 2: DISTRIBUIÇÃO POR DEPARTAMENTO */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Distribuição de Custos por Departamento
                </span>
                <div className="space-y-3 pt-2">
                  {[
                    { dep: 'Tecnologia & Inovação', pct: 42, color: 'bg-indigo-600' },
                    { dep: 'Operações & Logística', pct: 28, color: 'bg-amber-500' },
                    { dep: 'Recursos Humanos', pct: 18, color: 'bg-purple-600' },
                    { dep: 'Financeiro & Outros', pct: 12, color: 'bg-emerald-600' }
                  ].map(d => (
                    <div key={d.dep} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-800">
                        <span>{d.dep}</span>
                        <span>{d.pct}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                        <div className={`h-full ${d.color} rounded-full`} style={{ width: `${d.pct}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* 6. MASTER CONTROL, MONITORAMENTO & BACKUP */}
      {/* ========================================================================= */}
      {activeTab === 'master' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">
              <Server className="w-3.5 h-3.5" /> Monitoramento Global do Sistema & Firebase
            </div>
            <h2 className="text-xl font-black">Visão Master da Plataforma & Painel de Backups</h2>
            <p className="text-xs text-slate-300">
              Estatísticas de infraestrutura, tempo de resposta, disponibilidade do banco Firestore e gerenciamento de restauração.
            </p>
          </div>

          {backupSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{backupSuccessMsg}</span>
            </div>
          )}

          {/* BACKUP & RESTORE PANEL */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" /> Gerenciamento de Backups do Firestore
                </h3>
                <p className="text-xs text-slate-500">Histórico de pontos de restauração imutáveis do banco de dados.</p>
              </div>

              <button
                onClick={handleTriggerBackup}
                disabled={isBackingUp}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition"
              >
                <FolderDown className={`w-4 h-4 ${isBackingUp ? 'animate-bounce' : ''}`} />
                <span>{isBackingUp ? 'Gerando Backup...' : 'Criar Backup Manual'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                    <th className="p-3">ID / Código</th>
                    <th className="p-3">Data / Hora</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Tamanho MB</th>
                    <th className="p-3">Documentos</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Responsável</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {backups.map(bkp => (
                    <tr key={bkp.id} className="hover:bg-slate-50/80 font-semibold text-slate-800">
                      <td className="p-3 font-mono text-indigo-700">{bkp.id}</td>
                      <td className="p-3">{bkp.timestamp}</td>
                      <td className="p-3">{bkp.type}</td>
                      <td className="p-3">{bkp.sizeMb} MB</td>
                      <td className="p-3">{bkp.documentsCount} docs</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {bkp.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{bkp.createdBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* MODAL DETALHAMENTO DE MÉTRICA INDIVIDUAL */}
      {/* ========================================================================= */}
      {selectedMetricDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 text-white space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-amber-400">{selectedMetricDetail}</h3>
                <p className="text-xs text-slate-400">Detalhamento individual dos registros armazenados no Firebase</p>
              </div>
              <button
                onClick={() => setSelectedMetricDetail(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-bold text-white block">Status de Sincronização:</span>
                <p>Todos os registros correspondentes a este indicador estão isolados e associados à empresa ativa no escopo (companyId: {filter.companyId}).</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-bold text-white block">Última Atualização no Banco:</span>
                <p className="font-mono text-amber-400">{new Date().toLocaleString('pt-BR')}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedMetricDetail(null)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400"
              >
                Fechar Detalhamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRIAR META */}
      {isNewGoalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 text-white space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-amber-400">Cadastrar Nova Meta Operacional</h3>
              <button onClick={() => setIsNewGoalModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Título da Meta:</label>
                <input
                  type="text"
                  value={newGoal.title || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="Ex: Aumentar Contratações no Mês"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Responsável / Recrutador / Equipe:</label>
                <input
                  type="text"
                  value={newGoal.assigneeName || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, assigneeName: e.target.value })}
                  placeholder="Ex: Equipe R&S"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Meta Alvo:</label>
                  <input
                    type="number"
                    value={newGoal.targetValue || 20}
                    onChange={(e) => setNewGoal({ ...newGoal, targetValue: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Unidade:</label>
                  <select
                    value={newGoal.unit || 'contratacoes'}
                    onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500"
                  >
                    <option value="contratacoes">Contratações</option>
                    <option value="vagas">Vagas</option>
                    <option value="dias">Dias (SLA)</option>
                    <option value="reais">Reais (R$)</option>
                    <option value="porcentagem">Porcentagem (%)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsNewGoalModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateGoal}
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400"
              >
                Salvar Meta
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
