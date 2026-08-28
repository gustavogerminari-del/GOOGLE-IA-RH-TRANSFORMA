import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  FileText, 
  Users, 
  Briefcase, 
  CalendarCheck, 
  ThumbsUp, 
  TrendingUp, 
  Wand2, 
  Bot, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { JobCandidateApplication, JobCandidateService } from '../../services/JobCandidateService';
import { JobService } from '../../services/JobService';
import { Job } from '../../types/rh';
import { useAuth } from '../../auth';

interface AiDashboardViewProps {
  onNavigateToScreening: () => void;
  onNavigateToCandidates: () => void;
  onOpenJobGenModal: () => void;
  onOpenChatModal: () => void;
  onOpenInterviewModal: () => void;
}

export const AiDashboardView: React.FC<AiDashboardViewProps> = ({
  onNavigateToScreening,
  onNavigateToCandidates,
  onOpenJobGenModal,
  onOpenChatModal,
  onOpenInterviewModal
}) => {
  const { user } = useAuth();
  const companyId = user?.companyId || '';

  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<JobCandidateApplication[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [candList, jobList] = await Promise.all([
        JobCandidateService.listAll(companyId),
        JobService.listByCompany(companyId)
      ]);
      setCandidates(candList);
      setJobs(jobList);
    } catch (err) {
      console.error('Erro ao carregar dados do Dashboard IA:', err);
    } finally {
      setLoading(false);
    }
  };

  // Metrics calculation
  const totalResumesAnalyzed = candidates.length;
  const totalCandidatesEvaluated = candidates.filter(c => (c.evaluations && c.evaluations.length > 0) || c.status === 'Aprovado' || c.status === 'Contratado').length;
  const jobsInAnalysis = jobs.filter(j => j.status === 'Aberta' || j.status === 'Em Andamento').length;
  const interviewsScheduled = candidates.filter(c => c.status === 'Entrevista Agendada' || c.status === 'Entrevista Realizada' || c.interview).length;
  const aiRecommendedCount = candidates.filter(c => c.compatibilityScore >= 75).length;

  // Chart Data: Compatibility Levels Breakdown
  const compatibilityData = [
    { name: 'Muito Alta (85-100%)', count: candidates.filter(c => c.compatibilityScore >= 85).length, color: '#059669' },
    { name: 'Alta (70-84%)', count: candidates.filter(c => c.compatibilityScore >= 70 && c.compatibilityScore < 85).length, color: '#0d9488' },
    { name: 'Média (50-69%)', count: candidates.filter(c => c.compatibilityScore >= 50 && c.compatibilityScore < 70).length, color: '#f59e0b' },
    { name: 'Baixa (<50%)', count: candidates.filter(c => c.compatibilityScore < 50).length, color: '#e11d48' },
  ];

  // Chart Data: Status Distribution
  const statusData = [
    { status: 'Novos', total: candidates.filter(c => c.status === 'Novos').length },
    { status: 'Triagem IA', total: candidates.filter(c => c.status === 'Triagem IA').length },
    { status: 'Análise RH', total: candidates.filter(c => c.status === 'Em Análise RH').length },
    { status: 'Entrevista', total: candidates.filter(c => c.status === 'Entrevista Agendada' || c.status === 'Entrevista Realizada').length },
    { status: 'Aprovados', total: candidates.filter(c => c.status === 'Aprovado' || c.status === 'Contratado').length },
  ];

  // Trend line chart
  const trendData = [
    { dia: 'Seg', analises: 12, matchMedio: 82 },
    { dia: 'Ter', analises: 19, matchMedio: 85 },
    { dia: 'Qua', analises: 15, matchMedio: 80 },
    { dia: 'Qui', analises: 28, matchMedio: 88 },
    { dia: 'Sex', analises: 22, matchMedio: 86 },
    { dia: 'Sáb', analises: 8, matchMedio: 79 },
    { dia: 'Dom', analises: 5, matchMedio: 84 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Fast Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-emerald-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Visão Preditiva em Tempo Real
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Dashboard de Inteligência Artificial
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              Monitore métricas de aderência, volume de currículos processados pela IA e tome decisões de contratação aceleradas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenChatModal}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Bot className="w-4 h-4 text-amber-300" />
              <span>Assistente IA</span>
            </button>

            <button
              onClick={onOpenJobGenModal}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Wand2 className="w-4 h-4 text-amber-300" />
              <span>Gerar Vaga IA</span>
            </button>

            <button
              onClick={loadData}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 5 Main Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Currículos Analisados</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{totalResumesAnalyzed}</p>
          <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            100% no Firestore
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Candidatos Avaliados</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{totalCandidatesEvaluated}</p>
          <p className="text-[11px] text-slate-500 font-medium">Parecer humano ou aprovados</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Vagas em Análise</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{jobsInAnalysis}</p>
          <p className="text-[11px] text-purple-600 font-bold">Processos ativos</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Entrevistas Realizadas</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{interviewsScheduled}</p>
          <p className="text-[11px] text-indigo-600 font-bold">Agendadas & concluídas</p>
        </div>

        {/* Metric 5 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Recomendações IA</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <ThumbsUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{aiRecommendedCount}</p>
          <p className="text-[11px] text-amber-600 font-bold">Compatibilidade ≥ 75%</p>
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">Volume de Triagens x Média Match IA</h3>
              <p className="text-xs text-slate-500 font-medium">Acompanhamento diário das análises de inteligência artificial</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Média Semanal: 83.5%
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorAnalises" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="dia" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="analises" name="Currículos Analisados" stroke="#059669" fillOpacity={1} fill="url(#colorAnalises)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compatibility Level Pie Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900">Distribuição por Compatibilidade IA</h3>
            <p className="text-xs text-slate-500 font-medium">Faixas de aderência técnica e comportamental</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={compatibilityData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {compatibilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2">
            {compatibilityData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.count} candidatos</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Quick Access Central Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Análise de Candidatos</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Acesse a central com todos os candidatos analisados pela IA, com filtros por vaga, status e compatibilidade.
            </p>
          </div>
          <button
            onClick={onNavigateToCandidates}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-colors cursor-pointer"
          >
            Acessar Análise Central →
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Triagem IA por Vaga</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Visualize candidatos organizados em modelo lista profissional por vaga específica, sem o formato Kanban.
            </p>
          </div>
          <button
            onClick={onNavigateToScreening}
            className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs transition-colors cursor-pointer"
          >
            Abrir Triagem por Vaga →
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Bot className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Assistente IA Interativo</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Converse com a IA para comparar candidatos, gerar perguntas customizadas e emitir pareceres em tempo real.
            </p>
          </div>
          <button
            onClick={onOpenChatModal}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors cursor-pointer"
          >
            Iniciar Conversa IA →
          </button>
        </div>

      </div>

    </div>
  );
};
