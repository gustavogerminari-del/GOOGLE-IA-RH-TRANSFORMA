import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Video,
  CheckCircle2,
  AlertCircle,
  FileText,
  Bell,
  Award,
  Users,
  Briefcase,
  ShieldAlert,
} from 'lucide-react';
import { Interview, InterviewFilterParams, InterviewStatus } from '../types/interview';
import { normalizeInterviewStatus } from '../utils/interviewUtils';
import { InterviewCard } from './InterviewCard';
import { InterviewScheduleModal } from './InterviewScheduleModal';
import { InterviewFeedbackModal } from './InterviewFeedbackModal';
import { InterviewFiltersBar } from './InterviewFiltersBar';
import { Candidate } from '../../talent-bank';
import { Job } from '../../jobs';
import { useAuth } from '../../auth';
import { Button, Card } from '../../shared';
import { logger } from '../../core';
import { JobCandidateService } from '../../services/JobCandidateService';
import { JobService } from '../../services/JobService';
import { RecruitmentService } from '../../recruitment-core/services/recruitmentService';
import { GoogleWorkspaceService } from '../../services/GoogleWorkspaceService';
import { InterviewInsightsModal } from './InterviewInsightsModal';

const safeText = (value: unknown, fallback = '') => {
  const text = String(value ?? '').trim();
  return text || fallback;
};

const normalizeInterviewRecord = (raw: any): Interview => {
  const source = raw && typeof raw === 'object' ? raw : {};
  const modality = safeText(source.modality || source.modalidade);
  const rawType = safeText(source.type || source.tipo);
  const type = rawType || (
    modality === 'Presencial' ? 'Presencial'
      : modality === 'Telefone' ? 'Entrevista por Telefone'
        : modality === 'Google Meet' ? 'Online (Google Meet)'
          : 'Entrevista RH'
  );

  const candidateId = safeText(source.candidateId || source.candidatoId);
  const jobId = safeText(source.jobId || source.vagaId);
  const date = safeText(source.date || source.data);
  const time = safeText(source.time || source.horario, '00:00');
  const fallbackId = `int-incompleta-${safeText(source.applicationId || source.candidaturaId || candidateId, 'sem-candidato')}-${safeText(jobId, 'sem-vaga')}-${safeText(date, 'sem-data')}-${safeText(time, 'sem-hora')}`;

  const rawRating = Number(source.feedback?.rating);
  const feedback = source.feedback && typeof source.feedback === 'object'
    ? {
        ...source.feedback,
        rating: Number.isFinite(rawRating) ? Math.min(5, Math.max(1, Math.round(rawRating))) : 5,
        strengths: safeText(source.feedback.strengths),
        weaknesses: safeText(source.feedback.weaknesses),
        recommendation: safeText(source.feedback.recommendation, 'Em análise'),
        evaluatedBy: safeText(source.feedback.evaluatedBy) || undefined,
        evaluatedAt: safeText(source.feedback.evaluatedAt) || undefined,
        internalNotes: safeText(source.feedback.internalNotes) || undefined,
      }
    : undefined;

  const duration = Number(source.durationMinutes);
  return {
    ...source,
    id: safeText(source.id, fallbackId),
    candidateId,
    candidateName: safeText(source.candidateName || source.candidatoNome || source.name || source.nome, 'Candidato não informado'),
    candidateRole: safeText(source.candidateRole || source.role || source.cargo),
    candidateAvatar: safeText(source.candidateAvatar) || undefined,
    jobId,
    jobTitle: safeText(source.jobTitle || source.vagaTitulo || source.candidateRole || source.role, 'Vaga não informada'),
    interviewerName: safeText(source.interviewerName || source.entrevistadorNome || source.interviewer || source.entrevistador, 'Entrevistador não informado'),
    date,
    time,
    durationMinutes: Number.isFinite(duration) && duration > 0 ? Math.round(duration) : 45,
    type: type as Interview['type'],
    modality: (modality || undefined) as Interview['modality'],
    locationUrl: safeText(source.locationUrl || source.googleMeetUrl || source.meetingLink || source.location) || undefined,
    googleMeetUrl: safeText(source.googleMeetUrl || source.meetingLink) || undefined,
    googleCalendarEventId: safeText(source.googleCalendarEventId) || undefined,
    feedback: feedback as Interview['feedback'],
    integrationWarnings: Array.isArray(source.integrationWarnings) ? source.integrationWarnings.map((item: unknown) => safeText(item)).filter(Boolean) : [],
    status: normalizeInterviewStatus(source.status),
  };
};

const TERMINAL_JOB_STATUSES = new Set([
  'concluída', 'concluida', 'preenchida', 'fechada', 'encerrada', 'arquivada', 'cancelada', 'closed'
]);

const isOperationalJob = (job: any) => {
  if (!job?.id) return false;
  const status = safeText(job.status).toLowerCase();
  const statusVaga = safeText(job.statusVaga).toLowerCase();
  if (TERMINAL_JOB_STATUSES.has(status) || TERMINAL_JOB_STATUSES.has(statusVaga)) return false;
  if (job.archived === true || job.isArchived === true || job.concluidaEm || job.preenchidaEm) return false;
  return true;
};

export interface InterviewsManagementViewProps {
  initialInterviewsList?: Interview[];
  candidatesList?: Candidate[];
  jobsList?: Job[];
  onScheduleInterviewExternal?: () => void;
  onEditInterviewExternal?: (interview: Interview) => void;
  onCancelInterviewExternal?: (interview: Interview) => Promise<void>;
  onUpdateFeedbackExternal?: (
    interviewId: string,
    feedback: NonNullable<Interview['feedback']>
  ) => void;
}

export const InterviewsManagementView: React.FC<InterviewsManagementViewProps> = ({
  initialInterviewsList,
  candidatesList,
  jobsList,
  onScheduleInterviewExternal,
  onEditInterviewExternal,
  onCancelInterviewExternal,
  onUpdateFeedbackExternal,
}) => {
  const { user, hasActionAccess } = useAuth();

  const userCompanyId = user?.empresaId || user?.companyId || user?.tenantId;
  const isMaster = user?.role === 'Super Administrador' || user?.role === 'MASTER' || user?.tipoUsuario === 'MASTER' || user?.isMaster === true;

  const [interviews, setInterviews] = useState<Interview[]>(
    (initialInterviewsList || []).map(normalizeInterviewRecord)
  );
  const [candidates] = useState<Candidate[]>(
    candidatesList || []
  );

  const rawJobs = jobsList !== undefined ? jobsList : [];
  const [loadedJobs, setLoadedJobs] = useState<Job[]>([]);

  useEffect(() => {
    let cancelled = false;
    JobService.list(userCompanyId)
      .then(result => {
        if (!cancelled) setLoadedJobs(Array.isArray(result) ? result : []);
      })
      .catch(error => {
        console.warn('[INTERVIEWS_ACTIVE_JOBS_LOAD_FAILED]', error);
        if (!cancelled) setLoadedJobs([]);
      });
    return () => { cancelled = true; };
  }, [userCompanyId]);

  const jobs = useMemo(() => {
    const byId = new Map<string, Job>();
    [...rawJobs, ...loadedJobs].forEach((job: any) => {
      if (!job?.id) return;
      const cId = job.companyId || job.empresaId || job.tenantId;
      if (!isMaster && userCompanyId && cId && cId !== userCompanyId) return;
      byId.set(job.id, job);
    });
    return Array.from(byId.values()).filter(isOperationalJob);
  }, [rawJobs, loadedJobs, isMaster, userCompanyId]);

  const operationalJobIds = useMemo(() => new Set(jobs.map(job => String(job.id))), [jobs]);
  const operationalInterviews = useMemo(
    () => interviews.filter(interview => Boolean(interview.jobId) && operationalJobIds.has(String(interview.jobId))),
    [interviews, operationalJobIds]
  );

  useEffect(() => {
    let isMounted = true;
    async function loadAllInterviews() {
      try {
        const loadedApps = await JobCandidateService.listAll(userCompanyId);
        const apps = Array.isArray(loadedApps) ? loadedApps : [];
        const interviewsFromApps: Interview[] = apps
          .filter(a => a.interview && a.interview.date)
          .map(a => {
            const rawStatus = a.interviewStatus || a.interview!.status || a.status;
            const normStatus = normalizeInterviewStatus(rawStatus);

            let feedbackObj = a.interview!.feedback;
            if (!feedbackObj && a.evaluations && a.evaluations.length > 0) {
              const lastEval = a.evaluations[a.evaluations.length - 1];
              feedbackObj = {
                rating: lastEval.overallScore || 5,
                strengths: lastEval.parecerRH || '',
                weaknesses: lastEval.notes || '',
                recommendation: lastEval.finalOpinion === 'Aprovado' ? 'Aprovar' : lastEval.finalOpinion === 'Reprovado' ? 'Reprovar' : 'Em Dúvida',
                evaluatedBy: lastEval.evaluatedBy,
                evaluatedAt: lastEval.evaluatedAt,
              };
            }

            return {
              ...(a.interview as any),
              id: a.interview!.id || `int-app-${a.id}`,
              candidateId: a.candidateId || a.id,
              candidateName: a.name,
              candidateRole: a.role,
              jobId: a.jobId,
              jobTitle: a.role || 'Vaga Selecionada',
              interviewerName: a.interview!.interviewer || 'Recrutador RH',
              date: a.interview!.date,
              time: a.interview!.time || '10:00',
              type: (a.interview!.type === 'Presencial' ? 'Presencial' : a.interview!.type === 'Telefone' ? 'Telefone' : 'Online') as any,
              meetingLink: a.interview!.meetingLink,
              location: a.interview!.location,
              status: normStatus,
              feedback: feedbackObj,
              notes: a.interview!.notes
            };
          });

        const loadedRecruitmentInterviews = RecruitmentService.getInterviews(userCompanyId);
        const recInterviews = Array.isArray(loadedRecruitmentInterviews) ? loadedRecruitmentInterviews : [];
        const mappedRec: Interview[] = recInterviews.map(r => ({
          id: r.id,
          candidateId: r.candidatoId,
          candidateName: r.candidatoNome,
          candidateRole: r.candidateRole,
          jobId: r.vagaId,
          jobTitle: r.vagaTitulo,
          interviewerName: r.entrevistadorNome || r.interviewerName || 'Recrutador RH',
          date: r.date || (r.dataHora ? r.dataHora.split('T')[0] : new Date().toISOString().split('T')[0]),
          time: r.time || (r.dataHora && r.dataHora.includes('T') ? r.dataHora.split('T')[1].substring(0, 5) : '10:00'),
          type: (r.modalidade === 'Presencial' ? 'Presencial' : 'Online') as any,
          meetingLink: r.salaVirtualUrl,
          status: normalizeInterviewStatus(r.status),
          feedback: r.feedback,
          notes: r.pauta
        }));

        const combinedMap = new Map<string, Interview>();
        (initialInterviewsList || []).map(normalizeInterviewRecord).forEach(i => combinedMap.set(i.id, i));
        interviewsFromApps.map(normalizeInterviewRecord).forEach(i => combinedMap.set(i.id, i));
        mappedRec.map(normalizeInterviewRecord).forEach(i => combinedMap.set(i.id, i));

        if (isMounted) {
          setInterviews(Array.from(combinedMap.values()));
        }
      } catch (err) {
        console.warn('Erro ao carregar lista unificada de entrevistas:', err);
      }
    }

    loadAllInterviews();
    return () => { isMounted = false; };
  }, [userCompanyId, initialInterviewsList]);

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedForFeedback, setSelectedForFeedback] = useState<Interview | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedForInsights, setSelectedForInsights] = useState<Interview | null>(null);
  const autoSyncAttempted = useRef(new Set<string>());

  useEffect(() => {
    if (!userCompanyId) return;
    const now = Date.now();
    const targets = operationalInterviews.filter(interview => {
      if (!interview.googleMeetUrl || autoSyncAttempted.current.has(interview.id) || interview.status === 'Cancelada') return false;
      const scheduled = new Date(`${interview.date}T${interview.time || '00:00'}:00-03:00`).getTime();
      return scheduled < now && !interview.diagnosisAvailable;
    }).slice(0, 3);
    targets.forEach(interview => {
      autoSyncAttempted.current.add(interview.id);
      GoogleWorkspaceService.syncArtifacts(userCompanyId, interview.id)
        .then(async result => {
          if (result.interview) setInterviews(previous => previous.map(item => item.id === interview.id ? normalizeInterviewRecord(result.interview) : item));
          if (result.transcript && interview.aiAnalysisEnabled) {
            const diagnosis = await GoogleWorkspaceService.generateDiagnostic(userCompanyId, interview.id).catch(() => null);
            if (diagnosis?.diagnostic) setInterviews(previous => previous.map(item => item.id === interview.id ? { ...item, status: 'Diagnóstico disponível', diagnosisAvailable: true } : item));
          }
        })
        .catch(error => console.warn('[GOOGLE_INTERVIEW_BACKGROUND_SYNC_FAILED]', { interviewId: interview.id, message: error?.message || String(error) }));
    });
  }, [operationalInterviews, userCompanyId]);

  // Filters state
  const [filters, setFilters] = useState<InterviewFilterParams>({
    searchTerm: '',
    status: 'Todas',
    type: 'Todas',
    jobId: 'Todas',
    dateRange: 'Todos',
  });

  const handleFilterChange = (newFilters: Partial<InterviewFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchTerm: '',
      status: 'Todas',
      type: 'Todas',
      jobId: 'Todas',
      dateRange: 'Todos',
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtered List
  const filteredInterviews = useMemo(() => {
    return operationalInterviews.filter((item) => {
      const term = (filters.searchTerm || '').toLowerCase().trim();
      const matchesSearch =
        !term ||
        safeText(item.candidateName).toLowerCase().includes(term) ||
        safeText(item.jobTitle).toLowerCase().includes(term) ||
        safeText(item.interviewerName).toLowerCase().includes(term);

      const normItemStatus = normalizeInterviewStatus(item.status);
      const matchesStatus =
        !filters.status ||
        filters.status === 'Todas' ||
        normItemStatus === normalizeInterviewStatus(filters.status);

      const matchesType =
        !filters.type || filters.type === 'Todas' || item.type === filters.type;

      const matchesJob =
        !filters.jobId || filters.jobId === 'Todas' || item.jobId === filters.jobId;

      let matchesDate = true;
      if (filters.dateRange === 'Hoje') {
        matchesDate = item.date === todayStr;
      } else if (filters.dateRange === 'Próximos Dias') {
        matchesDate = item.date >= todayStr;
      }

      return matchesSearch && matchesStatus && matchesType && matchesJob && matchesDate;
    });
  }, [operationalInterviews, filters, todayStr]);

  // Stats Counters
  const totalCount = operationalInterviews.length;
  const scheduledCount = operationalInterviews.filter((i) => normalizeInterviewStatus(i.status) === 'Agendada').length;
  const todayCount = operationalInterviews.filter((i) => i.date === todayStr && normalizeInterviewStatus(i.status) === 'Agendada').length;
  const inAnalysisCount = operationalInterviews.filter((i) => {
    const norm = normalizeInterviewStatus(i.status);
    return norm === 'Em Análise' || (norm === 'Realizada' && !i.feedback);
  }).length;
  const approvedCount = operationalInterviews.filter((i) => normalizeInterviewStatus(i.status) === 'Aprovada').length;

  const handleAddSchedule = (newInterviewData: Omit<Interview, 'id' | 'status'>) => {
    const newInterview: Interview = {
      ...newInterviewData,
      id: `int-${Date.now()}`,
      status: 'Agendada',
    };
    setInterviews((prev) => [newInterview, ...prev]);
    logger.info(`Entrevista agendada para ${newInterview.candidateName}`, 'Interviews');
  };

  const handleSubmitFeedback = async (
    interviewId: string,
    feedback: NonNullable<Interview['feedback']>,
    newStatus: InterviewStatus
  ) => {
    const normNewStatus = normalizeInterviewStatus(
      newStatus || (feedback.recommendation === 'Aprovar' ? 'Aprovada' : feedback.recommendation === 'Reprovar' ? 'Reprovada' : 'Em Análise')
    );

    // Update state immediately for instant real-time UI refresh
    setInterviews((prev) =>
      prev.map((i) =>
        i.id === interviewId
          ? {
              ...i,
              status: normNewStatus,
              feedback: {
                ...feedback,
                recommendation: feedback.recommendation || (normNewStatus === 'Aprovada' ? 'Aprovar' : 'Reprovar')
              }
            }
          : i
      )
    );

    try {
      await JobCandidateService.saveInterviewFeedback(interviewId, feedback, normNewStatus);
    } catch (err) {
      console.error('Erro ao salvar feedback da entrevista no Firestore:', err);
    }

    if (onUpdateFeedbackExternal) {
      onUpdateFeedbackExternal(interviewId, feedback);
    }
    logger.info(`Feedback salvo para entrevista ${interviewId} (${normNewStatus})`, 'Interviews');
  };

  const handleDeleteInterview = async (interviewId: string) => {
    if (confirm('Deseja realmente cancelar este agendamento de entrevista?')) {
      const target = interviews.find(interview => interview.id === interviewId);
      if (!target) return;
      try {
        if (onCancelInterviewExternal) await onCancelInterviewExternal(target);
        setInterviews((prev) => prev.map((i) => (i.id === interviewId ? { ...i, status: 'Cancelada' } : i)));
        logger.info(`Entrevista ${interviewId} cancelada`, 'Interviews');
      } catch (error) {
        console.error('Erro ao cancelar entrevista:', error);
      }
    }
  };

  const handleOpenFeedback = (interview: Interview) => {
    setSelectedForFeedback(interview);
    setIsFeedbackModalOpen(true);
  };

  const handleOpenSchedule = () => {
    if (onScheduleInterviewExternal) {
      onScheduleInterviewExternal();
    } else {
      setIsScheduleModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Gestão de Entrevistas & Processos Seletivos
            </h2>
            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200">
              {totalCount} agendamentos
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Agendamentos, salas virtuais, atribuição de avaliadores e parecer de candidatos por etapa.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenSchedule}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shrink-0"
        >
          Agendar Entrevista
        </Button>
      </div>

      {/* Reminder Notification Banner for Today's Interviews */}
      {todayCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-bold">
            <Bell className="w-5 h-5 text-amber-600 shrink-0 animate-bounce" />
            <span>
              Lembrete: Você possui <strong>{todayCount} entrevista(s) agendada(s) para hoje ({todayStr})</strong>.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFilterChange({ dateRange: 'Hoje', status: 'Agendada' })}
            className="border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0"
          >
            Ver Agendamentos de Hoje
          </Button>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Total Agendado</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-slate-900">{scheduledCount}</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Agendadas para Hoje</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-amber-700">{todayCount}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Em Análise / Pendente</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-indigo-700">{inAnalysisCount}</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <p className="text-[10px] uppercase font-bold text-slate-400">Aprovados nas Etapas</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-emerald-700">{approvedCount}</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <InterviewFiltersBar
        filters={filters}
        jobs={jobs}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalResultsCount={filteredInterviews.length}
      />

      {/* List or Grid */}
      {filteredInterviews.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-800">
            Nenhuma entrevista encontrada
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Não existem agendamentos para o filtro selecionado. Tente alterar o status ou buscar por outro candidato.
          </p>
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            Limpar Filtros
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInterviews.map((item) => (
            <InterviewCard
              key={item.id}
              interview={item}
              onOpenFeedbackModal={handleOpenFeedback}
              onDeleteInterview={handleDeleteInterview}
              onEditInterview={onEditInterviewExternal}
              onOpenInsights={setSelectedForInsights}
              canManageInterview={
                user?.role === 'Administrador' ||
                user?.role === 'Gestor de Seleção' ||
                user?.role === 'Recrutador Sênior' ||
                hasActionAccess('schedule_interview') ||
                safeText(user?.name).toLowerCase() === safeText(item.interviewerName).toLowerCase()
              }
            />
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      <InterviewScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onScheduleInterview={handleAddSchedule}
        candidates={candidates}
        jobs={jobs}
      />

      <InterviewInsightsModal
        isOpen={Boolean(selectedForInsights)}
        onClose={() => setSelectedForInsights(null)}
        interview={selectedForInsights}
        companyId={userCompanyId || ''}
        onInterviewUpdate={updated => {
          const normalized = normalizeInterviewRecord(updated);
          setInterviews(previous => previous.map(item => item.id === normalized.id ? normalized : item));
          setSelectedForInsights(normalized);
        }}
      />

      {/* Feedback Modal */}
      <InterviewFeedbackModal
        interview={selectedForFeedback}
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmitFeedback={handleSubmitFeedback}
      />
    </div>
  );
};
