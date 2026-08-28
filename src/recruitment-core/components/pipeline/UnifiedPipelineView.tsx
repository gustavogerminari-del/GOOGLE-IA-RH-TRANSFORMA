import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Users, 
  Sparkles, 
  UserCheck, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Briefcase, 
  MapPin, 
  Building2, 
  Clock, 
  FileText, 
  Phone, 
  Mail, 
  MessageCircle, 
  Plus, 
  Star, 
  ChevronRight,
  TrendingUp,
  Award,
  RefreshCw,
  Share2,
  SlidersHorizontal,
  ExternalLink,
  Layers,
  GraduationCap
} from 'lucide-react';
import { 
  UnifiedJob, 
  OrigemProcesso, 
  ProcessStage,
  UnifiedInterview
} from '../../types/recruitment';
import { useAuth } from '../../../auth';
import { CandidateWithProcess, VagaCandidatosService } from '../../services/vagaCandidatosService';
import { JobCandidateService } from '../../../services/JobCandidateService';
import { CandidateDrawer } from './CandidateDrawer';
import { JobShareModal } from './JobShareModal';
import { UnifiedInterviewScheduleModal } from '../entrevistas/UnifiedInterviewScheduleModal';

interface UnifiedPipelineViewProps {
  job: UnifiedJob;
  candidates?: CandidateWithProcess[];
  origemProcesso?: OrigemProcesso;
  onBack: () => void;
  onSelectCandidate?: (candidate: CandidateWithProcess) => void;
  onScheduleInterview?: (candidate: CandidateWithProcess, job: UnifiedJob) => void;
  onOpenAiModal?: (type: string, data?: any) => void;
}

const STAGES_KANBAN: ProcessStage[] = [
  'Inscrito',
  'Triagem',
  'Entrevista RH',
  'Teste Técnico',
  'Entrevista Gestor',
  'Proposta',
  'Contratado',
  'Reprovado'
];

export const UnifiedPipelineView: React.FC<UnifiedPipelineViewProps> = ({
  job,
  candidates: propCandidates = [],
  origemProcesso = 'recrutamento_interno',
  onBack,
  onSelectCandidate,
  onScheduleInterview,
  onOpenAiModal
}) => {
  const { user } = useAuth();
  const userCompanyId = user?.empresaId || user?.companyId || '';

  // State for candidates loaded strictly for THIS job (vagaId)
  const [jobCandidates, setJobCandidates] = useState<CandidateWithProcess[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Top Menu Sub-tabs (Strictly 4 tabs per requirement 3)
  const [activeTab, setActiveTab] = useState<'candidatos' | 'pipeline' | 'agenda' | 'relatorios'>('candidatos');

  // Clickable Counter Filter state (Requirement 4)
  const [counterFilter, setCounterFilter] = useState<
    'TODOS' | 'NOVOS' | 'TRIAGEM_IA' | 'EM_ANALISE' | 'ENTREVISTAS' | 'CONTRATADOS' | 'REPROVADOS'
  >('TODOS');

  // Search state (Requirement 5)
  const [searchTerm, setSearchTerm] = useState('');

  // Filters state (Requirement 6)
  const [fCidade, setFCidade] = useState('Todas');
  const [fEscolaridade, setFEscolaridade] = useState('Todas');
  const [fExperiencia, setFExperiencia] = useState('Todas');
  const [fPcd, setFPcd] = useState('Todos');
  const [fMatchIa, setFMatchIa] = useState('Todos');
  const [fSituacao, setFSituacao] = useState('Todas');
  const [fOrigem, setFOrigem] = useState('Todas');
  const [fOrdenacao, setFOrdenacao] = useState<'recentes' | 'match' | 'nome' | 'experiencia'>('recentes');

  // Modals and Drawer state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedCandidateForDrawer, setSelectedCandidateForDrawer] = useState<CandidateWithProcess | null>(null);
  const [selectedCandidateForSchedule, setSelectedCandidateForSchedule] = useState<CandidateWithProcess | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // REALTIME CLOUDFLARE Firestore SUBSCRIPTION FOR THIS VAGA (Requirement 2 & 11)
  useEffect(() => {
    if (!job?.id) return;

    // Subscribe specifically to candidatures where vagaId == job.id
    const unsubscribe = VagaCandidatosService.subscribeToVagaCandidates(
      job.id, 
      userCompanyId, 
      (loaded) => {
        setJobCandidates(loaded);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [job?.id, userCompanyId]);

  // Handle Manual Refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  // COUNTERS CALCULATIONS (Requirement 4)
  const counts = useMemo(() => {
    const total = jobCandidates.length;
    const novos = jobCandidates.filter(c => c.etapaAtual === 'Inscrito').length;
    const triagemIa = jobCandidates.filter(c => c.etapaAtual === 'Triagem' || (c.matchIaPercent && c.matchIaPercent >= 80)).length;
    const emAnalise = jobCandidates.filter(c => ['Em Análise', 'Teste Técnico', 'Entrevista RH', 'Entrevista Gestor'].includes(c.etapaAtual)).length;
    const entrevistas = jobCandidates.filter(c => c.etapaAtual.toLowerCase().includes('entrevista')).length;
    const contratados = jobCandidates.filter(c => c.etapaAtual === 'Contratado' || c.status === 'Contratado').length;
    const reprovados = jobCandidates.filter(c => c.etapaAtual === 'Reprovado' || c.etapaAtual === 'Desistiu' || c.status === 'Indisponível').length;

    return { total, novos, triagemIa, emAnalise, entrevistas, contratados, reprovados };
  }, [jobCandidates]);

  // SMART FILTERING (Requirement 5 & 6)
  const filteredCandidates = useMemo(() => {
    return jobCandidates.filter(c => {
      // 1. Counter Filter
      if (counterFilter === 'NOVOS' && c.etapaAtual !== 'Inscrito') return false;
      if (counterFilter === 'TRIAGEM_IA' && !(c.etapaAtual === 'Triagem' || (c.matchIaPercent && c.matchIaPercent >= 80))) return false;
      if (counterFilter === 'EM_ANALISE' && !['Em Análise', 'Teste Técnico', 'Entrevista RH', 'Entrevista Gestor'].includes(c.etapaAtual)) return false;
      if (counterFilter === 'ENTREVISTAS' && !c.etapaAtual.toLowerCase().includes('entrevista')) return false;
      if (counterFilter === 'CONTRATADOS' && c.etapaAtual !== 'Contratado' && c.status !== 'Contratado') return false;
      if (counterFilter === 'REPROVADOS' && c.etapaAtual !== 'Reprovado' && c.etapaAtual !== 'Desistiu') return false;

      // 2. Real-Time Smart Search across 10 fields (Requirement 5)
      const term = searchTerm.toLowerCase().trim();
      if (term) {
        const matchesName = (c.nome || '').toLowerCase().includes(term);
        const matchesCpf = (c.cpf || '').toLowerCase().includes(term);
        const matchesPhone = (c.telefone || '').toLowerCase().includes(term);
        const matchesCity = (c.cidade || '').toLowerCase().includes(term);
        const matchesEmail = (c.email || '').toLowerCase().includes(term);
        const matchesCourse = (c.curso || '').toLowerCase().includes(term);
        const matchesSchool = (c.escolaridade || '').toLowerCase().includes(term);
        const matchesCompany = (c.empresaAnterior || '').toLowerCase().includes(term);
        const matchesSkills = (c.competencias || []).some(s => s.toLowerCase().includes(term));
        const matchesResumeText = (c.curriculoTexto || '').toLowerCase().includes(term);

        if (!matchesName && !matchesCpf && !matchesPhone && !matchesCity && !matchesEmail &&
            !matchesCourse && !matchesSchool && !matchesCompany && !matchesSkills && !matchesResumeText) {
          return false;
        }
      }

      // 3. Dropdown Filters (Requirement 6)
      if (fCidade !== 'Todas' && !(c.cidade || '').toLowerCase().includes(fCidade.toLowerCase())) return false;
      if (fEscolaridade !== 'Todas' && !(c.escolaridade || '').toLowerCase().includes(fEscolaridade.toLowerCase())) return false;
      if (fExperiencia !== 'Todas') {
        const exp = c.experienciaAnos || 0;
        if (fExperiencia === '1-3' && (exp < 1 || exp > 3)) return false;
        if (fExperiencia === '3-5' && (exp < 3 || exp > 5)) return false;
        if (fExperiencia === '+5' && exp < 5) return false;
      }
      if (fPcd === 'Sim' && !c.pcd) return false;
      if (fPcd === 'Não' && c.pcd) return false;

      if (fMatchIa !== 'Todos') {
        const score = c.matchIaPercent || 0;
        if (fMatchIa === '90+' && score < 90) return false;
        if (fMatchIa === '80+' && score < 80) return false;
        if (fMatchIa === '70+' && score < 70) return false;
      }

      if (fSituacao !== 'Todas' && c.etapaAtual !== fSituacao) return false;
      if (fOrigem !== 'Todas' && !(c.source || c.origemCandidatura || '').toLowerCase().includes(fOrigem.toLowerCase())) return false;

      return true;
    }).sort((a, b) => {
      if (fOrdenacao === 'match') {
        return (b.matchIaPercent || 0) - (a.matchIaPercent || 0);
      }
      if (fOrdenacao === 'nome') {
        return a.nome.localeCompare(b.nome);
      }
      if (fOrdenacao === 'experiencia') {
        return (b.experienciaAnos || 0) - (a.experienciaAnos || 0);
      }
      // Default: recentes
      return new Date(b.dataCandidatura || 0).getTime() - new Date(a.dataCandidatura || 0).getTime();
    });
  }, [jobCandidates, counterFilter, searchTerm, fCidade, fEscolaridade, fExperiencia, fPcd, fMatchIa, fSituacao, fOrigem, fOrdenacao]);

  // Unique Cities and Sources for filter options
  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    jobCandidates.forEach(c => { if (c.cidade) set.add(c.cidade); });
    return Array.from(set);
  }, [jobCandidates]);

  // Stage Move Handler
  const handleMoveStage = async (candidateId: string, newStage: ProcessStage) => {
    const cand = jobCandidates.find(c => c.id === candidateId);
    if (!cand) return;
    if (!userCompanyId) throw new Error('Empresa do usuário não identificada.');
    if (!cand.candidaturaId) throw new Error('Candidatura real não identificada.');

    if (newStage === 'Contratado') {
      // O último card não é apenas uma mudança visual: ele executa a mesma
      // contratação oficial que cria contratacoes e encaminha para DP ou
      // Financeiro/Headhunter conforme a origem real da vaga.
      await JobCandidateService.hireCandidate({
        id: cand.candidaturaId,
        candidateId: cand.id,
        companyId: userCompanyId,
        empresaId: userCompanyId,
        jobId: job.id,
        name: cand.nome,
        email: cand.email || '',
        phone: cand.telefone || '',
        cpf: cand.cpf || '',
        city: cand.cidade || '',
        role: cand.cargoPretendido || cand.cargoAtual || job.titulo || job.title || '',
        salaryExpectation: Number(cand.pretensaoSalarial || 0),
        status: cand.status === 'Contratado' ? 'Contratado' : 'Em Processo',
        timeline: cand.linhaDoTempo || [],
        origemProcesso,
      } as any, job.titulo || job.title || '');
    } else {
      await VagaCandidatosService.moveStage(cand.candidaturaId, candidateId, newStage, userCompanyId);
    }

    setJobCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        return {
          ...c,
          etapaAtual: newStage,
          status: newStage === 'Contratado' ? 'Contratado' : newStage === 'Reprovado' ? 'Indisponível' : 'Em Processo'
        };
      }
      return c;
    }));
  };

  return (
    <div className="space-y-6 text-slate-900 pb-12">
      
      {/* ========================================================================= */}
      {/* 1. CABEÇALHO COMPACTO (Compact Header) */}
      {/* ========================================================================= */}
      <div className="bg-[#082747] text-white p-5 rounded-3xl border border-[#0f3761] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition cursor-pointer"
              title="Voltar para Vagas"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-base font-black text-white tracking-tight">
                  {job.titulo || job.title}
                </span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-slate-300 border border-white/10">
                  {job.codigoVaga || job.id}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  job.status === 'Aberta' || job.status === 'ativa' ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                }`}>
                  {job.status || 'Aberta'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  {job.location || job.cidade || 'Presencial'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                  {job.tipoContrato || job.type || 'CLT'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Aberta em: {job.dataAbertura || job.createdAt || job.dataCriacao || '01/08/2026'}
                </span>
              </div>
            </div>
          </div>

          {/* Header Right Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="px-3.5 py-1.5 rounded-2xl bg-white/10 border border-white/10 text-xs font-black text-amber-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              <span>{jobCandidates.length} Candidatos</span>
            </div>

            <button
              onClick={() => setIsShareModalOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartilhar Vaga</span>
            </button>

            <button
              onClick={handleRefresh}
              className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 3. MENU SUPERIOR (Sub-tabs: strictly 4 tabs) */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10 text-xs font-bold">
          {[
            { id: 'candidatos', label: '👥 Candidatos', desc: 'Lista & Cards' },
            { id: 'pipeline', label: '📊 Pipeline (Kanban)', desc: 'Funil de Seleção' },
            { id: 'agenda', label: '📅 Agenda de Entrevistas', desc: 'Compromissos' },
            { id: 'relatorios', label: '📈 Relatórios da Vaga', desc: 'Métricas & Conversão' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-2xl transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CONTADORES CLICÁVEIS (Clickable KPI Counters) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
        {[
          { key: 'TODOS', label: 'TOTAL', count: counts.total, color: 'border-slate-300 text-slate-900 bg-white' },
          { key: 'NOVOS', label: 'NOVOS', count: counts.novos, color: 'border-blue-300 text-blue-900 bg-blue-50/50' },
          { key: 'TRIAGEM_IA', label: 'TRIAGEM IA', count: counts.triagemIa, color: 'border-indigo-300 text-indigo-900 bg-indigo-50/50' },
          { key: 'EM_ANALISE', label: 'EM ANÁLISE', count: counts.emAnalise, color: 'border-amber-300 text-amber-900 bg-amber-50/50' },
          { key: 'ENTREVISTAS', label: 'ENTREVISTAS', count: counts.entrevistas, color: 'border-purple-300 text-purple-900 bg-purple-50/50' },
          { key: 'CONTRATADOS', label: 'CONTRATADOS', count: counts.contratados, color: 'border-emerald-300 text-emerald-900 bg-emerald-50/50' },
          { key: 'REPROVADOS', label: 'REPROVADOS', count: counts.reprovados, color: 'border-rose-300 text-rose-900 bg-rose-50/50' }
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setCounterFilter(item.key as any)}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs flex flex-col justify-between ${item.color} ${
              counterFilter === item.key ? 'ring-2 ring-indigo-600 font-black shadow-md scale-[1.02]' : 'hover:border-indigo-400'
            }`}
          >
            <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-80">{item.label}</span>
            <span className="text-xl font-black mt-1">{item.count}</span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 5 & 6. BARRA DE BUSCA EM TEMPO REAL & FILTROS AVANÇADOS */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisa inteligente: Nome, CPF, Telefone, Cidade, Email, Curso, Escolaridade, Empresa, Competências, Currículo..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-xs font-bold">
          
          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-0.5">Cidade:</label>
            <select
              value={fCidade}
              onChange={(e) => setFCidade(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none"
            >
              <option value="Todas">Todas</option>
              {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-0.5">Escolaridade:</label>
            <select
              value={fEscolaridade}
              onChange={(e) => setFEscolaridade(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none"
            >
              <option value="Todas">Todas</option>
              <option value="Superior">Superior Completo</option>
              <option value="Pós">Pós/MBA</option>
              <option value="Mestrado">Mestrado</option>
              <option value="Médio">Ensino Médio</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-0.5">Experiência:</label>
            <select
              value={fExperiencia}
              onChange={(e) => setFExperiencia(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none"
            >
              <option value="Todas">Todas</option>
              <option value="1-3">1 a 3 anos</option>
              <option value="3-5">3 a 5 anos</option>
              <option value="+5">+5 anos</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-0.5">PCD:</label>
            <select
              value={fPcd}
              onChange={(e) => setFPcd(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none"
            >
              <option value="Todos">Todos</option>
              <option value="Sim">Apenas PCD</option>
              <option value="Não">Não PCD</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-0.5">Match IA:</label>
            <select
              value={fMatchIa}
              onChange={(e) => setFMatchIa(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none"
            >
              <option value="Todos">Todos</option>
              <option value="90+">&gt; 90%</option>
              <option value="80+">&gt; 80%</option>
              <option value="70+">&gt; 70%</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-0.5">Etapa:</label>
            <select
              value={fSituacao}
              onChange={(e) => setFSituacao(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none"
            >
              <option value="Todas">Todas</option>
              {STAGES_KANBAN.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-0.5">Origem:</label>
            <select
              value={fOrigem}
              onChange={(e) => setFOrigem(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none"
            >
              <option value="Todas">Todas</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Portal">Portal de Vagas</option>
              <option value="Indicação">Indicação</option>
              <option value="Headhunter">Headhunter</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-400 uppercase block mb-0.5">Ordenar por:</label>
            <select
              value={fOrdenacao}
              onChange={(e) => setFOrdenacao(e.target.value as any)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none"
            >
              <option value="recentes">Mais Recentes</option>
              <option value="match">Maior Match IA</option>
              <option value="nome">Nome A-Z</option>
              <option value="experiencia">Mais Experientes</option>
            </select>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: LISTA DOS CANDIDATOS (CARDS) */}
      {/* ========================================================================= */}
      {activeTab === 'candidatos' && (
        <div className="space-y-4">
          {filteredCandidates.length === 0 ? (
            /* Requirement 2: Empty state when no candidate is enrolled */
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-2xs">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Users className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">Nenhum candidato inscrito nesta vaga.</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Compartilhe a vaga para atrair talentos qualificados através do portal público e redes sociais.
                </p>
              </div>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition inline-flex items-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" /> Compartilhar Vaga
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCandidates.map(candidate => {
                const waPhone = (candidate.telefone || '').replace(/\D/g, '');
                const waLink = `https://wa.me/55${waPhone}?text=${encodeURIComponent(`Olá ${candidate.nome}, sou do RH referente à vaga de ${job.titulo}.`)}`;

                return (
                  <div 
                    key={candidate.id} 
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:border-indigo-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Top Header Card */}
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-sm shrink-0 overflow-hidden">
                            {candidate.fotoUrl ? (
                              <img src={candidate.fotoUrl} alt={candidate.nome} className="w-full h-full object-cover" />
                            ) : (
                              <span>{candidate.nome.substring(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900 leading-tight">{candidate.nome}</h3>
                            <p className="text-xs text-slate-500 font-extrabold">{candidate.cargoAtual || 'Profissional'}</p>
                          </div>
                        </div>

                        {/* Match IA Badge */}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 ${
                          (candidate.matchIaPercent || 85) >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          Match {candidate.matchIaPercent || 85}%
                        </span>
                      </div>

                      {/* Info Pills */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400 font-bold block">Cidade:</span>
                          <strong className="text-slate-800">{candidate.cidade || 'São Paulo - SP'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block">Etapa:</span>
                          <strong className="text-indigo-700 font-black">{candidate.etapaAtual}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block">Experiência:</span>
                          <strong className="text-slate-800">{candidate.experienciaAnos || 3} anos</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block">Inscrição:</span>
                          <strong className="text-slate-800">{candidate.dataCandidatura ? candidate.dataCandidatura.substring(0, 10) : '2026-08-01'}</strong>
                        </div>
                      </div>

                      {/* Contact Badges */}
                      <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-500 pt-1">
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                          <Mail className="w-3 h-3 text-slate-400" /> {candidate.email}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                          <Phone className="w-3 h-3 text-slate-400" /> {candidate.telefone || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons (Requirement 7) */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => setSelectedCandidateForDrawer(candidate)}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> Abrir
                      </button>

                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 transition"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>

                      <a
                        href={`mailto:${candidate.email}`}
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition"
                        title="Enviar E-mail"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: PIPELINE KANBAN */}
      {/* ========================================================================= */}
      {activeTab === 'pipeline' && (
        <div className="overflow-x-auto pb-4 scrollbar-thin">
          <div className="flex gap-4 min-w-[1200px]">
            {STAGES_KANBAN.map(stage => {
              const stageCandidates = filteredCandidates.filter(c => c.etapaAtual === stage);

              return (
                <div key={stage} className="w-72 bg-slate-100/70 p-3 rounded-2xl border border-slate-200/80 space-y-3 shrink-0">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="font-black text-xs text-slate-800 uppercase tracking-wider">{stage}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold text-xs">
                      {stageCandidates.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 min-h-[300px]">
                    {stageCandidates.map(cand => (
                      <div
                        key={cand.id}
                        onClick={() => setSelectedCandidateForDrawer(cand)}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-400 transition cursor-pointer space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-black text-xs text-slate-900">{cand.nome}</span>
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {cand.matchIaPercent || 85}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold">{cand.cargoAtual || 'Profissional'}</p>
                        <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-100">
                          <span>{cand.cidade || 'Brasil'}</span>
                          <span>{cand.experienciaAnos || 3} anos exp.</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: AGENDA DE ENTREVISTAS */}
      {/* ========================================================================= */}
      {activeTab === 'agenda' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-2xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Agenda de Entrevistas para {job.titulo}
              </h3>
              <p className="text-xs text-slate-500">Agende e gerencie entrevistas com os candidatos desta vaga.</p>
            </div>

            <button
              onClick={() => {
                if (jobCandidates.length > 0) {
                  setSelectedCandidateForSchedule(jobCandidates[0]);
                  setIsScheduleModalOpen(true);
                } else {
                  alert('Não há candidatos disponíveis nesta vaga para agendar entrevista.');
                }
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Agendar Entrevista
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobCandidates.slice(0, 3).map(cand => (
              <div key={cand.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-black text-slate-900">{cand.nome}</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">Agendada</span>
                </div>
                <p className="text-xs text-slate-600">Entrevista de Alinhamento Técnico & Comportamental via Google Meet.</p>
                <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-200">
                  <span>Data: 04/08/2026 às 14:00</span>
                  <button 
                    onClick={() => {
                      setSelectedCandidateForSchedule(cand);
                      setIsScheduleModalOpen(true);
                    }}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Reagendar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: RELATÓRIOS DA VAGA */}
      {/* ========================================================================= */}
      {activeTab === 'relatorios' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Total de Candidaturas</span>
              <p className="text-2xl font-black text-slate-900">{jobCandidates.length}</p>
              <span className="text-[10px] text-emerald-600 font-bold">Inscrições válidas</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Média de Match IA</span>
              <p className="text-2xl font-black text-indigo-600">
                {(jobCandidates.reduce((acc, c) => acc + (c.matchIaPercent || 85), 0) / (jobCandidates.length || 1)).toFixed(0)}%
              </p>
              <span className="text-[10px] text-indigo-600 font-bold">Score de aderência técnica</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Taxa de Conversão</span>
              <p className="text-2xl font-black text-emerald-600">
                {((counts.contratados / (jobCandidates.length || 1)) * 100).toFixed(0)}%
              </p>
              <span className="text-[10px] text-slate-400 font-bold">Candidatos contratados</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAIS & DRAWER */}
      {/* ========================================================================= */}
      {selectedCandidateForDrawer && (
        <CandidateDrawer
          candidate={selectedCandidateForDrawer}
          job={job}
          onClose={() => setSelectedCandidateForDrawer(null)}
          onMoveStage={handleMoveStage}
          onScheduleInterview={(cand) => {
            setSelectedCandidateForSchedule(cand);
            setIsScheduleModalOpen(true);
          }}
          onUpdateCandidate={(updated) => {
            setJobCandidates(prev => prev.map(c => c.id === updated.id ? updated : c));
          }}
        />
      )}

      {isShareModalOpen && (
        <JobShareModal
          job={job}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}

      {isScheduleModalOpen && (
        <UnifiedInterviewScheduleModal
          candidate={selectedCandidateForSchedule}
          job={job}
          origemProcesso={origemProcesso}
          onClose={() => setIsScheduleModalOpen(false)}
          onSchedule={(interview) => {
            alert(`Entrevista agendada com sucesso para ${interview.candidatoNome}!`);
            setIsScheduleModalOpen(false);
          }}
        />
      )}

    </div>
  );
};
