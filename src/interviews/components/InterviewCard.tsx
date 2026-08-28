import React from 'react';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  User,
  Briefcase,
  Star,
  CheckCircle2,
  AlertCircle,
  FileText,
  Edit3,
  Trash2,
  Bell,
  Lock,
  ExternalLink,
  Brain,
} from 'lucide-react';
import { Interview } from '../types/interview';
import { normalizeInterviewStatus } from '../utils/interviewUtils';
import { InterviewStatusBadge, InterviewTypeBadge } from './InterviewStatusBadge';
import { Card, Button } from '../../shared';

export interface InterviewCardProps {
  interview: Interview;
  onOpenFeedbackModal: (interview: Interview) => void;
  onUpdateStatus?: (interviewId: string, status: Interview['status']) => void;
  onDeleteInterview?: (interviewId: string) => void;
  onEditInterview?: (interview: Interview) => void;
  onOpenInsights?: (interview: Interview) => void;
  canManageInterview?: boolean;
}

export const InterviewCard: React.FC<InterviewCardProps> = ({
  interview,
  onOpenFeedbackModal,
  onUpdateStatus,
  onDeleteInterview,
  onEditInterview,
  onOpenInsights,
  canManageInterview = true,
}) => {
  const normStatus = normalizeInterviewStatus(interview?.status);
  const safeType = String(interview?.type || interview?.modality || 'Entrevista RH');
  const candidateName = String(interview?.candidateName || 'Candidato não informado');
  const candidateRole = String(interview?.candidateRole || interview?.jobTitle || 'Vaga não informada');
  const jobTitle = String(interview?.jobTitle || 'Vaga não informada');
  const interviewerName = String(interview?.interviewerName || 'Entrevistador não informado');
  const locationUrl = typeof interview?.locationUrl === 'string' ? interview.locationUrl.trim() : '';
  const rawRating = Number(interview?.feedback?.rating);
  const feedbackRating = Number.isFinite(rawRating) ? Math.min(5, Math.max(1, Math.round(rawRating))) : 5;
  const feedbackRecommendation = String(interview?.feedback?.recommendation || 'Em análise');
  const feedbackStrengths = String(interview?.feedback?.strengths || '');
  const feedbackEvaluator = String(interview?.feedback?.evaluatedBy || '');
  const isToday =
    new Date().toISOString().split('T')[0] === interview?.date;

  return (
    <Card className="p-5 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all group">
      <div className="space-y-3">
        {/* Header: Candidate Avatar + Name & Status Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {interview.candidateAvatar ? (
              <img
                src={interview.candidateAvatar}
                alt={interview.candidateName}
                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-sm border-2 border-indigo-100 shadow-2xs shrink-0">
                {candidateName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'C'}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug truncate">
                  {candidateName}
                </h3>
                {isToday && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">
                    Hoje
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-indigo-700 mt-0.5 truncate">
                {candidateRole}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <InterviewStatusBadge status={normStatus} />
            <InterviewTypeBadge type={(interview.modality || safeType) as any} />
          </div>
        </div>

        {/* Date, Time & Stage Details */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 font-medium bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="font-extrabold text-slate-900">{interview.date}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="font-extrabold text-slate-900">{interview.time} ({interview.durationMinutes || 45} min)</span>
          </div>

          <div className="col-span-2 flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              Responsável: <strong className="text-slate-800">{interviewerName}</strong>
            </span>
          </div>
        </div>

        {/* Job Title & Stage Tag */}
        <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
          <div className="flex items-center gap-1 text-slate-600 truncate">
            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold truncate">{jobTitle}</span>
          </div>

          {interview.stageName && (
            <span className="bg-indigo-50 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-indigo-100 shrink-0">
              {interview.stageName}
            </span>
          )}
        </div>

        {/* Meeting Link / Address */}
        {locationUrl && (
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
            {safeType.includes('Presencial') ? (
              <p className="text-slate-700 font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{locationUrl}</span>
              </p>
            ) : (
              <a
                href={locationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1.5 transition-colors"
              >
                <Video className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">Acessar Sala Virtual</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {(interview.googleMeetUrl || interview.googleCalendarEventId) && (
          <div className="grid grid-cols-3 gap-2 text-[10px] font-bold">
            <span className={`rounded-lg border px-2 py-1.5 text-center ${interview.recordingAvailable ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>🎥 {interview.recordingAvailable ? 'Gravação' : 'Aguardando'}</span>
            <span className={`rounded-lg border px-2 py-1.5 text-center ${interview.transcriptionAvailable ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>📝 {interview.transcriptionAvailable ? 'Transcrição' : 'Aguardando'}</span>
            <span className={`rounded-lg border px-2 py-1.5 text-center ${interview.diagnosisAvailable ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>🧠 {interview.diagnosisAvailable ? 'Diagnóstico' : 'IA pendente'}</span>
          </div>
        )}

        {/* Feedback Summary if evaluated */}
        {interview.feedback ? (
          <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between font-extrabold text-emerald-900">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Parecer: {feedbackRecommendation}
              </span>
              <span className="text-amber-700 font-extrabold">
                {'★'.repeat(feedbackRating)} ({feedbackRating}/5)
              </span>
            </div>
            {feedbackStrengths && (
              <p className="text-slate-700 text-[11px] leading-relaxed line-clamp-2">
                <strong className="text-slate-900">Pontos Fortes:</strong> {feedbackStrengths}
              </p>
            )}
            {feedbackEvaluator && (
              <p className="text-[10px] text-slate-400 text-right italic">
                Avaliador: {feedbackEvaluator}
              </p>
            )}
          </div>
        ) : (
          (normStatus === 'Realizada' || normStatus === 'Em Análise') && (
            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-xs text-amber-800 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              Entrevista realizada. Aguardando registro de feedback do entrevistador.
            </div>
          )
        )}
      </div>

      {/* Footer Actions & Permission Control */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {interview.reminderSent && (
            <span
              className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center gap-1 text-[10px] font-bold"
              title="Lembrete automático enviado para o candidato e entrevistador"
            >
              <Bell className="w-3 h-3" /> Lembrete Ativo
            </span>
          )}

          {onDeleteInterview && canManageInterview && (
            <button
              type="button"
              onClick={() => onDeleteInterview(interview.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Cancelar / Excluir Agendamento"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onOpenInsights && (interview.googleMeetUrl || interview.googleCalendarEventId) && (
            <Button variant="outline" size="sm" onClick={() => onOpenInsights(interview)} leftIcon={<Brain className="w-3.5 h-3.5" />}>Entrevista & IA</Button>
          )}
          {onEditInterview && canManageInterview && normStatus !== 'Cancelada' && (
            <Button variant="outline" size="sm" onClick={() => onEditInterview(interview)} leftIcon={<Edit3 className="w-3.5 h-3.5" />}>Editar</Button>
          )}
          {canManageInterview ? (
            <Button
              variant={interview.feedback ? 'outline' : 'primary'}
              size="sm"
              onClick={() => onOpenFeedbackModal(interview)}
              leftIcon={<FileText className="w-3.5 h-3.5" />}
            >
              {interview.feedback ? 'Editar Feedback' : 'Avaliar & Feedback'}
            </Button>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium italic">
              <Lock className="w-3 h-3" /> Somente Responsável
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
