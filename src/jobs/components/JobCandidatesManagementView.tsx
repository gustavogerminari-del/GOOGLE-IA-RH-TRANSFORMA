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
  MoreVertical, 
  FileText, 
  RefreshCw,
  Plus,
  History,
  Award,
  BarChart2,
  Edit3,
  Play,
  Pause,
  RotateCcw,
  Eye,
  X,
  Send,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Phone,
  Mail,
  GraduationCap,
  Layers
} from 'lucide-react';
import { Job } from '../types/job';
import { JobService } from '../../services/JobService';
import { 
  JobCandidateApplication, 
  JobCandidateService, 
  ApplicationStatus 
} from '../../services/JobCandidateService';
import { CandidateDrawerPanel } from './CandidateDrawerPanel';
import { JobFormModal } from './JobFormModal';
import { TalentMatchDrawer } from './TalentMatchDrawer';
import { useAuth } from '../../auth';
import { formatFirestoreDate } from '../../lib/firestoreUtils';
import { CandidateService } from '../../services/CandidateService';
import { rankTalentBankCandidates, TalentMatchResult } from '../../recruitment-core/services/talentMatchService';
import { calcularMatchVaga } from '../../ai/services/recruitmentAiGateway';
import { AiMatchAuditService } from '../../ai/services/aiMatchAuditService';

export type MainCandidatosViewMode = 'por_vaga' | 'todos_candidatos';
export type JobFilterStatus = 'Todas' | 'Abertas' | 'Em andamento' | 'Pausadas' | 'Preenchidas' | 'Canceladas';

interface JobCandidatesManagementViewProps {
  job?: Job | null;
  onBack?: () => void;
  openNewJobModal?: () => void;
}

const closedTalentBackfillAttempted = new Set<string>();

export const JobCandidatesManagementView: React.FC<JobCandidatesManagementViewProps> = ({
  job,
  onBack,
  openNewJobModal,
}) => {
  const { user, isModuleActive, isTrial } = useAuth();
  const companyId = user?.empresaId || user?.companyId || user?.tenantId || '';
  const canUseTalentMatch = !isTrial && isModuleActive('vagas') && isModuleActive('bancoTalentos');

  // Subtab navigation inside Candidatos module (Por Vaga vs Todos os Candidatos)
  const [viewMode, setViewMode] = useState<MainCandidatosViewMode>('por_vaga');

  const [candidates, setCandidates] = useState<JobCandidateApplication[]>([]);
  const [companyJobs, setCompanyJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected candidate for Drawer
  const [selectedCandidate, setSelectedCandidate] = useState<JobCandidateApplication | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter controls for "Por Vaga"
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState<JobFilterStatus>('Abertas');
  const [showJobFilters, setShowJobFilters] = useState(false);

  // Filter controls for "Todos os Candidatos"
  const [candidateSearchTerm, setCandidateSearchTerm] = useState('');
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('Todas');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [cityFilter, setCityFilter] = useState<string>('Todas');
  const [educationFilter, setEducationFilter] = useState<string>('Todas');
  const [experienceFilter, setExperienceFilter] = useState<string>('Todas');
  const [iaFilter, setIaFilter] = useState<string>('Todas');

  // Job Editing & Modals
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [metricsModalJob, setMetricsModalJob] = useState<Job | null>(null);
  const [historyModalJob, setHistoryModalJob] = useState<Job | null>(null);
  const [openMoreOptionsJobId, setOpenMoreOptionsJobId] = useState<string | null>(null);
  const [talentCandidates, setTalentCandidates] = useState<any[]>([]);
  const [selectedMatchJob, setSelectedMatchJob] = useState<Job | null>(null);
  const [enhancedMatchesByJob, setEnhancedMatchesByJob] = useState<Record<string, TalentMatchResult[]>>({});
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState('');

  useEffect(() => {
    if (!companyId || !canUseTalentMatch) {
      setTalentCandidates([]);
      return;
    }
    CandidateService.listTalentBank(companyId)
      .then(list => setTalentCandidates(list as any[]))
      .catch(err => {
        console.error('Erro ao carregar Banco de Talentos:', err);
        setTalentCandidates([]);
        setMatchError('Não foi possível consultar o Banco de Talentos no Firebase.');
      });
  }, [companyId, canUseTalentMatch]);

  const objectiveMatchesByJob = useMemo(() => {
    if (!companyId || !canUseTalentMatch) return {} as Record<string, TalentMatchResult[]>;
    const result: Record<string, TalentMatchResult[]> = {};
    companyJobs.forEach(currentJob => {
      const linked = new Set(candidates.filter(item => item.jobId === currentJob.id).map(item => item.candidateId));
      try {
        result[currentJob.id] = rankTalentBankCandidates(currentJob as any, talentCandidates as any, companyId, linked);
      } catch (error) {
        console.error(`Match objetivo bloqueado para a vaga ${currentJob.id}:`, error);
        result[currentJob.id] = [];
      }
    });
    return result;
  }, [companyJobs, talentCandidates, candidates, companyId, canUseTalentMatch]);

  const getTalentMatches = (jobId: string) => {
    const linked = new Set(candidates.filter(item => item.jobId === jobId).map(item => item.candidateId));
    const source = enhancedMatchesByJob[jobId] || objectiveMatchesByJob[jobId] || [];
    return source.map(match => ({ ...match, alreadyLinked: linked.has(match.candidateId) }));
  };

  const refreshTalentMatches = async (currentJob: Job, onlyCandidateId?: string) => {
    if (!canUseTalentMatch) throw new Error('Match Talentos não está contratado para esta empresa.');
    const baseMatches = objectiveMatchesByJob[currentJob.id] || [];
    const targetMatches = onlyCandidateId ? baseMatches.filter(match => match.candidateId === onlyCandidateId) : baseMatches;
    if (!targetMatches.length) return;
    setMatchLoading(true);
    setMatchError('');
    try {
      const response = await calcularMatchVaga({ companyId, job: currentJob as any, matches: targetMatches });
      const aiByCandidate = new Map((response.data?.matches || []).map(item => [item.candidateId, item]));
      const enhancedTargets = targetMatches.map(match => {
        const ai = aiByCandidate.get(match.candidateId);
        if (!ai) return match;
        const complementaryScore = Math.max(0, Math.min(100, Number(ai.complementaryScore || 0)));
        return {
          ...match,
          score: Math.round(match.objectiveScore * 0.7 + complementaryScore * 0.3),
          strengths: [...new Set([...match.strengths, ...(ai.strengths || [])])].slice(0, 5),
          attentionPoints: [...new Set([...match.attentionPoints, ...(ai.attentionPoints || [])])].slice(0, 4),
          provider: response.provider,
          model: response.model,
        } as TalentMatchResult;
      });

      await AiMatchAuditService.logMatches({
        companyId,
        jobId: currentJob.id,
        provider: response.provider || 'gemini',
        model: response.model || 'não informado',
        processedAt: response.processedAt || new Date().toISOString(),
        matches: enhancedTargets,
      });

      setEnhancedMatchesByJob(previous => {
        const current = previous[currentJob.id] || baseMatches;
        const updates = new Map(enhancedTargets.map(match => [match.candidateId, match]));
        return { ...previous, [currentJob.id]: current.map(match => updates.get(match.candidateId) || match).sort((a, b) => b.score - a.score) };
      });
    } catch (error: any) {
      console.error('Falha no match complementar por IA:', error);
      setMatchError(error?.message || 'Gemini está indisponível no momento. O match objetivo continua disponível.');
    } finally {
      setMatchLoading(false);
    }
  };

  const linkTalentToJob = async (match: TalentMatchResult) => {
    if (!selectedMatchJob) return;
    if (!canUseTalentMatch) throw new Error('Banco de Talentos e Match Talentos não estão disponíveis neste plano.');
    setMatchError('');
    try {
      const result = await JobCandidateService.linkTalentBankCandidate({
        companyId,
        jobId: selectedMatchJob.id,
        candidateId: match.candidateId,
        compatibilityScore: match.score,
        strengths: match.strengths,
        attentionPoints: match.attentionPoints,
        provider: match.provider,
        model: match.model,
      });
      if (!result.created) {
        setMatchError('Este candidato já estava vinculado à vaga. Nenhuma candidatura duplicada foi criada.');
        return;
      }
      setCandidates(previous => previous.some(item => item.id === result.application.id)
        ? previous
        : [result.application, ...previous]);
    } catch (error: any) {
      console.error('Erro ao vincular talento à vaga:', error);
      setMatchError(error?.message || 'Não foi possível vincular o candidato à vaga.');
      throw error;
    }
  };

  // Load Company Jobs & Subscribe Candidates
  const handleRefresh = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      if (job?.id) {
        const list = await JobCandidateService.listByJob(job.id, companyId);
        setCandidates(list);
      } else {
        const list = await JobCandidateService.listAll(companyId);
        setCandidates(list);
      }
      const jobsList = await JobService.listByCompany(companyId);
      setCompanyJobs(jobsList);
    } catch (err) {
      console.error('Erro ao recarregar dados do Firestore:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!companyId) return;
    JobService.listByCompany(companyId)
      .then(list => setCompanyJobs(list))
      .catch(err => console.warn('Erro ao carregar vagas:', err));
  }, [companyId]);

  useEffect(() => {
    if (!companyId) {
      setCandidates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubscribe: () => void;

    if (job?.id) {
      unsubscribe = JobCandidateService.subscribeByJob(
        job.id,
        companyId,
        (list) => {
          setCandidates(list);
          setLoading(false);
        },
        (err) => {
          console.error('Erro na assinatura de candidatos da vaga:', err);
          setCandidates([]);
          setLoading(false);
        }
      );
    } else {
      unsubscribe = JobCandidateService.subscribeByCompany(
        companyId,
        (list) => {
          setCandidates(list);
          setLoading(false);
        },
        (err) => {
          console.error('Erro na assinatura de candidaturas:', err);
          setCandidates([]);
          setLoading(false);
        }
      );
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [job?.id, companyId]);

  // Sync selected candidate
  useEffect(() => {
    if (selectedCandidate) {
      const updated = candidates.find(c => c.id === selectedCandidate.id);
      if (updated) setSelectedCandidate(updated);
    }
  }, [candidates]);

  // Helper for job positions count
  const getJobPositions = (j: Job): number => {
    return j.openings || j.quantidadeVagas || (j as any).positions || (j as any).numeroVagas || (j as any).totalPositions || (j as any).quantidadePosicoes || 1;
  };

  // Helper for job candidates
  const getJobCandidates = (jobId: string) => {
    return candidates.filter(c => c.jobId === jobId);
  };

  // Helper for hired count
  const getJobHiredCount = (jobId: string) => {
    return getJobCandidates(jobId).filter(c => c.status === 'Contratado' || c.status === 'Aprovado').length;
  };

  // Helper to check if job is filled
  const isJobFilled = (j: Job): boolean => {
    const hired = getJobHiredCount(j.id);
    const positions = getJobPositions(j);
    const normalizedStatus = String(j.status || '').trim().toLowerCase();
    return hired >= positions || ['preenchida', 'concluída', 'concluida'].includes(normalizedStatus);
  };

  // Reparo automático de vagas antigas que ficaram como Aberta mesmo após contratação.
  // A origem de verdade para esse reparo é a própria candidatura com status Contratado.
  useEffect(() => {
    if (!companyId || loading || companyJobs.length === 0 || candidates.length === 0) return;

    const terminalStatuses = new Set([
      'concluída', 'concluida', 'preenchida', 'fechada', 'encerrada', 'arquivada', 'cancelada', 'closed'
    ]);

    const staleFilledJobs = companyJobs.filter(currentJob => {
      const normalizedStatus = String(currentJob.status || '').trim().toLowerCase();
      const normalizedSecondary = String((currentJob as any).statusVaga || '').trim().toLowerCase();
      if (terminalStatuses.has(normalizedStatus) || terminalStatuses.has(normalizedSecondary)) return false;

      const positions = Number(
        currentJob.openings ||
        currentJob.quantidadeVagas ||
        (currentJob as any).positions ||
        (currentJob as any).numeroVagas ||
        (currentJob as any).totalPositions ||
        (currentJob as any).quantidadePosicoes ||
        1
      );
      const hired = candidates.filter(item => item.jobId === currentJob.id && item.status === 'Contratado').length;
      return hired >= Math.max(1, positions);
    });

    if (staleFilledJobs.length === 0) return;
    let cancelled = false;
    const now = new Date().toISOString();

    Promise.all(staleFilledJobs.map(async currentJob => {
      try {
        await JobService.update(currentJob.id, {
          status: 'Concluída',
          statusVaga: 'Concluída',
          publicada: false,
          preenchidaEm: (currentJob as any).preenchidaEm || now,
          concluidaEm: (currentJob as any).concluidaEm || now,
        } as any);
        return currentJob.id;
      } catch (error) {
        console.error('[VAGA RECONCILIACAO] Falha ao concluir vaga já preenchida:', currentJob.id, error);
        return '';
      }
    })).then(updatedIds => {
      if (cancelled) return;
      const ids = new Set(updatedIds.filter(Boolean));
      if (ids.size === 0) return;
      setCompanyJobs(prev => prev.map(item => ids.has(item.id)
        ? ({ ...item, status: 'Concluída', publicada: false, statusVaga: 'Concluída' } as any)
        : item
      ));
    });

    return () => { cancelled = true; };
  }, [companyId, loading, companyJobs, candidates]);

  // Retroativo: vagas que já estavam concluídas antes da implantação também precisam
  // enviar os participantes não contratados ao Banco de Talentos.
  useEffect(() => {
    if (!companyId || loading || companyJobs.length === 0) return;
    const terminalStatuses = new Set([
      'concluída', 'concluida', 'preenchida', 'fechada', 'encerrada', 'arquivada', 'cancelada', 'closed'
    ]);
    const closedJobs = companyJobs.filter(job => {
      const status = String((job as any).status || '').trim().toLowerCase();
      const statusVaga = String((job as any).statusVaga || '').trim().toLowerCase();
      return terminalStatuses.has(status) || terminalStatuses.has(statusVaga) || Boolean((job as any).concluidaEm || (job as any).preenchidaEm);
    });
    const pending = closedJobs.filter(job => {
      const key = companyId + ':' + job.id;
      if (closedTalentBackfillAttempted.has(key)) return false;
      closedTalentBackfillAttempted.add(key);
      return true;
    });
    if (pending.length === 0) return;

    void Promise.all(pending.map(async job => {
      try {
        await JobService.syncClosedCandidatesToTalentBank(
          job.id,
          companyId,
          String((job as any).status || (job as any).statusVaga || 'Concluída')
        );
        console.info('[CLOSED_JOB_TALENT_BACKFILL]', { jobId: job.id, companyId, status: 'OK' });
      } catch (error) {
        closedTalentBackfillAttempted.delete(companyId + ':' + job.id);
        console.error('[CLOSED_JOB_TALENT_BACKFILL]', { jobId: job.id, companyId, status: 'FAIL', error });
      }
    }));
  }, [companyId, loading, companyJobs]);

  // Helper to get normalized status display for a job
  const getJobStatusBadge = (j: Job) => {
    if (isJobFilled(j)) {
      return {
        label: ['concluída', 'concluida'].includes(String(j.status || '').trim().toLowerCase()) ? 'Concluída' : 'Preenchida',
        colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      };
    }
    const st = (j.status as string) || 'Aberta';
    if (st === 'Aberta' || st === 'ativa') {
      return {
        label: 'Aberta',
        colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      };
    }
    if (st === 'Em andamento') {
      return {
        label: 'Em andamento',
        colorClass: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: <span className="w-2 h-2 rounded-full bg-amber-500" />
      };
    }
    if (st === 'Pausada') {
      return {
        label: 'Pausada',
        colorClass: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Pause className="w-3 h-3 text-blue-600" />
      };
    }
    if (st === 'Cancelada' || st === 'Fechada' || st === 'Encerrada' || st === 'Arquivada') {
      return {
        label: st === 'Cancelada' ? 'Cancelada' : 'Fechada',
        colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
        icon: <XCircle className="w-3.5 h-3.5 text-slate-500" />
      };
    }
    return {
      label: st,
      colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: null
    };
  };

  // Classify Jobs (Active vs Finished)
  const { activeJobs, finishedJobs, statusCounts, globalMetrics } = useMemo(() => {
    let abertas = 0;
    let emAndamento = 0;
    let pausadas = 0;
    let preenchidas = 0;
    let canceladas = 0;

    const actives: Job[] = [];
    const finished: Job[] = [];

    companyJobs.forEach(j => {
      const filled = isJobFilled(j);
      const st = (j.status as string) || 'Aberta';

      if (filled || st === 'Preenchida') {
        preenchidas++;
        finished.push(j);
      } else if (st === 'Cancelada' || st === 'Fechada' || st === 'Encerrada' || st === 'Arquivada') {
        canceladas++;
        finished.push(j);
      } else {
        actives.push(j);
        if (st === 'Aberta' || st === 'ativa') abertas++;
        else if (st === 'Em andamento') emAndamento++;
        else if (st === 'Pausada') pausadas++;
        else abertas++;
      }
    });

    const activePriority = (currentJob: Job) => {
      const status = String(currentJob.status || '').trim().toLowerCase();
      if (status === 'aberta' || status === 'ativa') return 0;
      if (status === 'em andamento') return 1;
      if (status === 'pausada') return 2;
      return 3;
    };
    actives.sort((a, b) => activePriority(a) - activePriority(b));

    const totalHired = candidates.filter(c => c.status === 'Contratado' || c.status === 'Aprovado').length;

    return {
      activeJobs: actives,
      finishedJobs: finished,
      statusCounts: {
        todas: companyJobs.length,
        abertas,
        emAndamento,
        pausadas,
        preenchidas,
        canceladas
      },
      globalMetrics: {
        totalJobs: companyJobs.length,
        abertas,
        emAndamento,
        preenchidas,
        totalHired
      }
    };
  }, [companyJobs, candidates]);

  // Filter Jobs based on Search Term and Selected Status Filter
  const filterJobsList = (jobsList: Job[]) => {
    return jobsList.filter(j => {
      // Search term
      const term = jobSearchTerm.toLowerCase().trim();
      const code = (j.id || '').toLowerCase();
      const title = (j.title || j.titulo || '').toLowerCase();
      const dept = (j.department || '').toLowerCase();
      const loc = (j.location || `${j.cidade || ''} ${j.estado || ''}`).toLowerCase();

      const matchesSearch = !term || code.includes(term) || title.includes(term) || dept.includes(term) || loc.includes(term);

      if (!matchesSearch) return false;

      // Status Filter
      if (jobStatusFilter === 'Todas') return true;

      const filled = isJobFilled(j);
      const st = (j.status as string) || 'Aberta';

      if (jobStatusFilter === 'Abertas') return (st === 'Aberta' || st === 'ativa') && !filled;
      if (jobStatusFilter === 'Em andamento') return st === 'Em andamento' && !filled;
      if (jobStatusFilter === 'Pausadas') return st === 'Pausada' && !filled;
      if (jobStatusFilter === 'Preenchidas') return filled || st === 'Preenchida';
      if (jobStatusFilter === 'Canceladas') return (st === 'Cancelada' || st === 'Fechada' || st === 'Encerrada' || st === 'Arquivada') && !filled;

      return true;
    });
  };

  const filteredActiveJobs = useMemo(() => filterJobsList(activeJobs), [activeJobs, jobSearchTerm, jobStatusFilter, candidates]);
  const filteredFinishedJobs = useMemo(() => filterJobsList(finishedJobs), [finishedJobs, jobSearchTerm, jobStatusFilter, candidates]);

  // Handlers for Job Actions
  const handleOpenJobCandidates = (jobId: string) => {
    setSelectedJobFilter(jobId);
    setViewMode('todos_candidatos');
  };

  const handleOpenHiredCandidate = (jobId: string) => {
    const hired = candidates.find(c => c.jobId === jobId && (c.status === 'Contratado' || c.status === 'Aprovado'));
    if (hired) {
      setSelectedCandidate(hired);
      setIsDrawerOpen(true);
    } else {
      alert('Nenhum candidato com status "Contratado" encontrado para esta vaga.');
    }
  };

  const handleReopenJob = async (j: Job) => {
    if (!window.confirm(`Tem certeza que deseja reabrir a vaga "${j.title || j.titulo}"?`)) return;
    try {
      await JobService.update(j.id, { status: 'Aberta' });
      await handleRefresh();
      alert('Vaga reaberta com sucesso!');
    } catch (err: any) {
      alert(`Erro ao reabrir vaga: ${err?.message || 'Falha no Firestore'}`);
    }
  };

  const handleSaveJobData = async (jobData: Omit<Job, 'id' | 'applicantsCount' | 'createdAt'>, existingId?: string) => {
    try {
      if (existingId) {
        await JobService.update(existingId, jobData);
      } else {
        await JobService.create({
          ...jobData,
          companyId,
          empresaId: companyId
        });
      }
      await handleRefresh();
      setEditingJob(null);
      setIsCreateJobOpen(false);
    } catch (err: any) {
      alert(`Erro ao salvar vaga: ${err?.message || 'Falha na operação'}`);
    }
  };

  // Filtered Candidates List for "Todos os Candidatos"
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach(c => { if (c.city) set.add(c.city); });
    return Array.from(set);
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      if (selectedJobFilter !== 'Todas' && c.jobId !== selectedJobFilter) return false;

      const term = candidateSearchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        c.name.toLowerCase().includes(term) ||
        (c.cpf && c.cpf.includes(term)) ||
        c.city.toLowerCase().includes(term) ||
        c.phone.includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.education.toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter || 
        (statusFilter === 'Entrevistas' && (c.status === 'Entrevista Agendada' || c.status === 'Entrevista Realizada')) ||
        (statusFilter === 'Contratados' && (c.status === 'Contratado' || c.status === 'Aprovado'));

      const matchesCity = cityFilter === 'Todas' || c.city === cityFilter;
      const matchesEducation = educationFilter === 'Todas' || c.education === educationFilter;

      const matchesIa = iaFilter === 'Todas' ||
        (iaFilter === 'Muito' && c.compatibilityScore >= 85) ||
        (iaFilter === 'Compativel' && c.compatibilityScore >= 65 && c.compatibilityScore < 85) ||
        (iaFilter === 'Baixa' && c.compatibilityScore < 65);

      return matchesSearch && matchesStatus && matchesCity && matchesEducation && matchesIa;
    });
  }, [candidates, selectedJobFilter, candidateSearchTerm, statusFilter, cityFilter, educationFilter, iaFilter]);

  return (
    <div data-vagas-prioridade="abertas" className="space-y-6 animate-in fade-in duration-200">

      {/* TOP NAVIGATION HEADER & SUBTAB TOGGLE (Section 14: Menu Candidatos) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 mr-1"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {viewMode === 'por_vaga' ? 'Candidatos por Vaga' : 'Todos os Candidatos'}
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Gerencie todos os candidatos das suas vagas de forma centralizada e organizada
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* SUBTAB SWITCHER: Por Vaga vs Todos os Candidatos */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('por_vaga')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'por_vaga'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                <span>Por Vaga</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('todos_candidatos')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'todos_candidatos'
                    ? 'bg-white text-indigo-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Todos os Candidatos</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Atualizar dados do Firestore"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                if (openNewJobModal) openNewJobModal();
                else setIsCreateJobOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nova Vaga</span>
            </button>
          </div>
        </div>

        {/* SECTION 2 & 3: CONTROLES DE BUSCA E FILTROS DE STATUS DE VAGA */}
        {viewMode === 'por_vaga' && (
          <div className="border-t border-slate-100 pt-4 space-y-4">
            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={jobSearchTerm}
                  onChange={(e) => setJobSearchTerm(e.target.value)}
                  placeholder="Buscar vaga por título, código ou área..."
                  className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowJobFilters(!showJobFilters)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    showJobFilters ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filtros</span>
                </button>
              </div>
            </div>

            {/* STATUS FILTER BUTTONS (Section 3) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {(
                [
                  { id: 'Abertas', label: 'Abertas', count: statusCounts.abertas, color: 'emerald' },
                  { id: 'Todas', label: 'Todas', count: statusCounts.todas, color: 'indigo' },
                  { id: 'Em andamento', label: 'Em andamento', count: statusCounts.emAndamento, color: 'amber' },
                  { id: 'Pausadas', label: 'Pausadas', count: statusCounts.pausadas, color: 'blue' },
                  { id: 'Preenchidas', label: 'Preenchidas', count: statusCounts.preenchidas, color: 'emerald' },
                  { id: 'Canceladas', label: 'Canceladas', count: statusCounts.canceladas, color: 'rose' },
                ] as const
              ).map((f) => {
                const isActive = jobStatusFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setJobStatusFilter(f.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer shrink-0 border ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      isActive ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {f.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: INDICADORES GERAIS (KPI CARDS) */}
      {viewMode === 'por_vaga' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total de Vagas</span>
            <p className="text-2xl font-black text-slate-900">{globalMetrics.totalJobs}</p>
            <span className="text-[10px] text-slate-400 font-medium">Cadastradas no sistema</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">Abertas</span>
            <p className="text-2xl font-black text-emerald-600">{globalMetrics.abertas}</p>
            <span className="text-[10px] text-emerald-700 font-medium">Recebendo candidaturas</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider block">Em andamento</span>
            <p className="text-2xl font-black text-amber-600">{globalMetrics.emAndamento}</p>
            <span className="text-[10px] text-amber-700 font-medium">Fase de seleção</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold text-teal-600 uppercase tracking-wider block">Preenchidas</span>
            <p className="text-2xl font-black text-teal-600">{globalMetrics.preenchidas}</p>
            <span className="text-[10px] text-teal-700 font-medium">Posições concluídas</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block">Total de Contratados</span>
            <p className="text-2xl font-black text-indigo-600">{globalMetrics.totalHired}</p>
            <span className="text-[10px] text-indigo-700 font-medium">Candidatos aprovados</span>
          </div>
        </div>
      )}

      {/* VIEW MODE 1: CANDIDATOS POR VAGA */}
      {viewMode === 'por_vaga' && (
        <div className="space-y-8">
          
          {/* SECTION 5: VAGAS ATIVAS */}
          {jobStatusFilter !== 'Preenchidas' && jobStatusFilter !== 'Canceladas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                    Vagas Ativas
                  </h2>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {filteredActiveJobs.length}
                  </span>
                </div>
              </div>

              {filteredActiveJobs.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-3">
                  <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-600">Nenhuma vaga ativa encontrada com os filtros selecionados.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredActiveJobs.map((j) => {
                    const cands = getJobCandidates(j.id);
                    const hiredCount = getJobHiredCount(j.id);
                    const positions = getJobPositions(j);
                    const percentage = Math.min(100, Math.round((hiredCount / positions) * 100));
                    const statusInfo = getJobStatusBadge(j);

                    const novosCount = cands.filter(c => c.status === 'Novos' || c.status === 'Novos').length;
                    const triagemCount = cands.filter(c => ['Triagem IA', 'Em Análise', 'Em Análise RH', 'Triagem', 'Análise'].includes(c.status)).length;
                    const entrevistaCount = cands.filter(c => ['Entrevista', 'Entrevista Agendada', 'Entrevista Realizada', 'Entrevistas'].includes(c.status)).length;

                    return (
                      <div key={j.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all p-5 space-y-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          
                          {/* Coluna VAGA */}
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h3 className="text-base font-black text-slate-900">{j.title || j.titulo}</h3>
                              <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                #{j.id}
                              </span>
                              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${statusInfo.colorClass}`}>
                                {statusInfo.icon}
                                {statusInfo.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs font-medium text-slate-500 flex-wrap">
                              <span className="flex items-center gap-1 text-slate-700 font-bold">
                                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                                {j.department || 'Geral'}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {j.location || `${j.cidade || 'São Paulo'} - ${j.estado || 'SP'}`}
                              </span>
                              <span>•</span>
                              <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                                {j.type || j.tipoContrato || 'CLT'}
                              </span>
                            </div>
                          </div>

                          {/* Coluna PROGRESSO DE CONTRATAÇÃO */}
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shrink-0 w-full lg:w-56 space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-slate-500">Contratações:</span>
                              <span className="text-slate-900 font-black">{hiredCount} / {positions}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 block text-right">
                              {percentage}% preenchido
                            </span>
                          </div>

                          {/* Coluna ETAPAS DOS CANDIDATOS */}
                          <div className="grid grid-cols-4 gap-1.5 shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                            <div className="px-2 py-1 bg-white rounded-lg border border-slate-100">
                              <span className="text-[9px] font-extrabold text-blue-600 uppercase block">Novos</span>
                              <span className="text-xs font-black text-slate-900">{novosCount}</span>
                            </div>

                            <div className="px-2 py-1 bg-white rounded-lg border border-slate-100">
                              <span className="text-[9px] font-extrabold text-purple-600 uppercase block">Triagem</span>
                              <span className="text-xs font-black text-slate-900">{triagemCount}</span>
                            </div>

                            <div className="px-2 py-1 bg-white rounded-lg border border-slate-100">
                              <span className="text-[9px] font-extrabold text-indigo-600 uppercase block">Entrevistas</span>
                              <span className="text-xs font-black text-slate-900">{entrevistaCount}</span>
                            </div>

                            <div className="px-2 py-1 bg-white rounded-lg border border-slate-100">
                              <span className="text-[9px] font-extrabold text-emerald-600 uppercase block">Contratados</span>
                              <span className="text-xs font-black text-slate-900">{hiredCount}</span>
                            </div>
                          </div>

                          {/* Coluna AÇÕES RÁPIDAS */}
                          <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleOpenJobCandidates(j.id)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>Ver candidatos ({cands.length})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => canUseTalentMatch && (setSelectedMatchJob(j), setMatchError(''))}
                              disabled={!canUseTalentMatch}
                              title={!canUseTalentMatch ? 'Disponível somente com Recrutamento + Banco de Talentos contratados; bloqueado no trial.' : 'Encontrar talentos compatíveis'}
                              className={`px-3 py-1.5 border text-xs font-extrabold rounded-xl transition-all flex items-center gap-1 ${canUseTalentMatch ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 cursor-pointer' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'}`}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{canUseTalentMatch ? `Match Talentos (${(objectiveMatchesByJob[j.id] || []).length})` : 'Match Talentos bloqueado'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setMetricsModalJob(j)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                              title="Ver indicadores"
                            >
                              <BarChart2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingJob(j)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                              title="Editar vaga"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setOpenMoreOptionsJobId(openMoreOptionsJobId === j.id ? null : j.id)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {openMoreOptionsJobId === j.id && (
                                <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-xl shadow-xl z-20 w-44 py-1 animate-in fade-in">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const nextStatus = j.status === 'Pausada' ? 'Aberta' : 'Pausada';
                                      await JobService.update(j.id, { status: nextStatus });
                                      await handleRefresh();
                                      setOpenMoreOptionsJobId(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    {j.status === 'Pausada' ? <Play className="w-3.5 h-3.5 text-emerald-600" /> : <Pause className="w-3.5 h-3.5 text-amber-600" />}
                                    <span>{j.status === 'Pausada' ? 'Retomar Vaga' : 'Pausar Vaga'}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (confirm('Deseja cancelar esta vaga?')) {
                                        await JobService.update(j.id, { status: 'Cancelada' });
                                        await handleRefresh();
                                      }
                                      setOpenMoreOptionsJobId(null);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Cancelar Vaga</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 8: VAGAS FINALIZADAS */}
          {jobStatusFilter !== 'Abertas' && jobStatusFilter !== 'Em andamento' && jobStatusFilter !== 'Pausadas' && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <h2 className="text-base font-black text-slate-700 uppercase tracking-wide">
                    Vagas Concluídas
                  </h2>
                  <span className="bg-slate-200 text-slate-700 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                    {filteredFinishedJobs.length}
                  </span>
                </div>
              </div>

              {filteredFinishedJobs.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-slate-200">
                  <p className="text-xs font-medium text-slate-400">Nenhuma vaga concluída encontrada com estes filtros.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFinishedJobs.map((j) => {
                    const cands = getJobCandidates(j.id);
                    const hiredCount = getJobHiredCount(j.id);
                    const positions = getJobPositions(j);
                    const percentage = Math.min(100, Math.round((hiredCount / positions) * 100));
                    const statusInfo = getJobStatusBadge(j);

                    return (
                      <div key={j.id} className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5 space-y-4 hover:bg-white transition-all">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          
                          {/* Coluna VAGA */}
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h3 className="text-base font-black text-slate-800">{j.title || j.titulo}</h3>
                              <span className="text-[10px] font-extrabold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-md">
                                #{j.id}
                              </span>
                              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${statusInfo.colorClass}`}>
                                {statusInfo.icon}
                                {statusInfo.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs font-medium text-slate-500 flex-wrap">
                              <span className="flex items-center gap-1 text-slate-700 font-bold">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                {j.department || 'Geral'}
                              </span>
                              <span>•</span>
                              <span>{j.location || `${j.cidade || 'São Paulo'} - ${j.estado || 'SP'}`}</span>
                            </div>
                          </div>

                          {/* Coluna PROGRESSO DE CONTRATAÇÃO */}
                          <div className="bg-white p-3 rounded-xl border border-slate-200 shrink-0 w-full lg:w-52 space-y-1">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-slate-500">Contratações:</span>
                              <span className="text-slate-900 font-black">{hiredCount} / {positions}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 block text-right">
                              {percentage}% preenchido
                            </span>
                          </div>

                          {/* Coluna AÇÕES VAGAS FINALIZADAS (Section 11) */}
                          <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleOpenJobCandidates(j.id)}
                              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>Ver candidatos ({cands.length})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenHiredCandidate(j.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Ver contratado</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setHistoryModalJob(j)}
                              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                              title="Ver histórico"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReopenJob(j)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reabrir vaga</span>
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* VIEW MODE 2: TODOS OS CANDIDATOS */}
      {viewMode === 'todos_candidatos' && (
        <div className="space-y-6">
          
          {/* BARRA DE PESQUISA E FILTROS DE CANDIDATOS */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={candidateSearchTerm}
                onChange={(e) => setCandidateSearchTerm(e.target.value)}
                placeholder="Buscar candidato por Nome, CPF, Cidade, Telefone, E-mail..."
                className="w-full text-xs font-semibold pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filtrar por Vaga</label>
                <select
                  value={selectedJobFilter}
                  onChange={(e) => setSelectedJobFilter(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Todas">Todas as Vagas ({companyJobs.length})</option>
                  {companyJobs.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.title} (#{j.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status do Candidato</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Todos">Todos os Status</option>
                  <option value="Novos">Novos</option>
                  <option value="Triagem IA">Triagem IA</option>
                  <option value="Em Análise RH">Em Análise RH</option>
                  <option value="Entrevistas">Entrevistas</option>
                  <option value="Contratados">Contratados</option>
                  <option value="Encerrado">Encerrado / Preenchido</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cidade</label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Todas">Todas as Cidades</option>
                  {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Escolaridade</label>
                <select
                  value={educationFilter}
                  onChange={(e) => setEducationFilter(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Todas">Todas</option>
                  <option value="Ensino Médio">Ensino Médio</option>
                  <option value="Superior Incompleto">Superior Incompleto</option>
                  <option value="Superior Completo">Superior Completo</option>
                  <option value="Pós-Graduação">Pós-Graduação</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Compatibilidade IA</label>
                <select
                  value={iaFilter}
                  onChange={(e) => setIaFilter(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Todas">Qualquer Match</option>
                  <option value="Muito">Alta (85%+)</option>
                  <option value="Compativel">Média (65-84%)</option>
                  <option value="Baixa">Baixa (&lt;65%)</option>
                </select>
              </div>
            </div>
          </div>

          {/* CANDIDATES LIST / CARDS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                Exibindo <strong className="text-slate-900">{filteredCandidates.length}</strong> candidatos
              </span>
            </div>

            {filteredCandidates.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 space-y-3">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-600">Nenhum candidato encontrado com os filtros selecionados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCandidates.map(c => {
                  const matchedJ = companyJobs.find(j => j.id === c.jobId);
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCandidate(c);
                        setIsDrawerOpen(true);
                      }}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-base font-black text-slate-900">{c.name}</h4>
                            <p className="text-xs text-slate-500 font-medium">
                              Vaga: <strong className="text-slate-800">{matchedJ?.title || c.role}</strong>
                            </p>
                          </div>
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shrink-0 ${
                            c.status === 'Contratado' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {c.status}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-slate-600">
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{c.city}, {c.state}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{c.phone}</span>
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                        <span>Ver detalhes do candidato</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* CANDIDATE DRAWER PANEL */}
      <CandidateDrawerPanel
        candidate={selectedCandidate}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onRefresh={handleRefresh}
        jobTitle={companyJobs.find(j => j.id === selectedCandidate?.jobId)?.title}
      />

      {/* JOB EDIT / CREATE FORM MODAL */}
      {(isCreateJobOpen || editingJob) && (
        <JobFormModal
          isOpen={isCreateJobOpen || !!editingJob}
          initialJob={editingJob}
          onClose={() => {
            setIsCreateJobOpen(false);
            setEditingJob(null);
          }}
          onSaveJob={handleSaveJobData}
        />
      )}

      {/* JOB INDICATORS / METRICS MODAL */}
      {metricsModalJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">{metricsModalJob.title || metricsModalJob.titulo}</h3>
                <p className="text-xs text-slate-500 font-medium">Indicadores da Vaga #{metricsModalJob.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setMetricsModalJob(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Inscritos</span>
                <span className="text-2xl font-black text-slate-900">{getJobCandidates(metricsModalJob.id).length}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 uppercase block">Contratados</span>
                <span className="text-2xl font-black text-emerald-600">{getJobHiredCount(metricsModalJob.id)} / {getJobPositions(metricsModalJob)}</span>
              </div>
            </div>

            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2 text-xs text-indigo-950">
              <p><strong>Departamento:</strong> {metricsModalJob.department}</p>
              <p><strong>Localização:</strong> {metricsModalJob.location}</p>
              <p><strong>Tipo de Contrato:</strong> {metricsModalJob.type || metricsModalJob.tipoContrato}</p>
              <p><strong>Salário:</strong> {metricsModalJob.salaryRange || metricsModalJob.salario}</p>
              <p><strong>Criada em:</strong> {formatFirestoreDate(metricsModalJob.createdAt || metricsModalJob.dataCriacao)}</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setMetricsModalJob(null)}
                className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JOB HISTORY MODAL */}
      {historyModalJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-black text-slate-900">Histórico da Vaga</h3>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalJob(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto text-xs text-slate-700 pr-1">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400">Criada em:</span>
                <p className="font-bold">{formatFirestoreDate(historyModalJob.createdAt || historyModalJob.dataCriacao)}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400">Total de candidaturas recebidas:</span>
                <p className="font-bold">{getJobCandidates(historyModalJob.id).length} candidatos</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-emerald-600">Total de contratações finalizadas:</span>
                <p className="font-bold text-emerald-900">{getJobHiredCount(historyModalJob.id)} contratações</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setHistoryModalJob(null)}
                className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMatchJob && canUseTalentMatch && (
        <TalentMatchDrawer
          job={selectedMatchJob}
          matches={getTalentMatches(selectedMatchJob.id)}
          loading={matchLoading}
          error={matchError}
          onClose={() => setSelectedMatchJob(null)}
          onRefresh={() => refreshTalentMatches(selectedMatchJob)}
          onAnalyze={(match) => refreshTalentMatches(selectedMatchJob, match.candidateId)}
          onLink={linkTalentToJob}
        />
      )}

    </div>
  );
};
