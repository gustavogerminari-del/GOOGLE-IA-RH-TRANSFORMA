import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Lock,
  Award,
} from 'lucide-react';
import { Interview, InterviewRecommendation, InterviewStatus } from '../types/interview';
import {
  INTERVIEW_RECOMMENDATION_OPTIONS,
  INTERVIEW_STATUS_OPTIONS,
} from '../constants/interviewOptions';
import { useAuth } from '../../auth';
import { Button, Select } from '../../shared';

export interface InterviewFeedbackModalProps {
  interview: Interview | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitFeedback: (
    interviewId: string,
    feedback: NonNullable<Interview['feedback']>,
    newStatus: InterviewStatus
  ) => void;
}

export const InterviewFeedbackModal: React.FC<InterviewFeedbackModalProps> = ({
  interview,
  isOpen,
  onClose,
  onSubmitFeedback,
}) => {
  const { user, hasActionAccess } = useAuth();

  const [rating, setRating] = useState<number>(5);
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [recommendation, setRecommendation] = useState<InterviewRecommendation>('Aprovar');
  const [newStatus, setNewStatus] = useState<InterviewStatus>('Aprovada');
  const [internalNotes, setInternalNotes] = useState('');

  const [error, setError] = useState('');

  // Permission Check: only responsible interviewer OR Admin/Gestor/Recruiter can edit feedback
  const canUserEvaluate =
    user?.role === 'Administrador' ||
    user?.role === 'Gestor de Seleção' ||
    user?.role === 'Recrutador Sênior' ||
    hasActionAccess('schedule_interview') ||
    user?.name?.toLowerCase() === interview?.interviewerName?.toLowerCase();

  useEffect(() => {
    if (interview?.feedback) {
      setRating(interview.feedback.rating);
      setStrengths(interview.feedback.strengths || '');
      setWeaknesses(interview.feedback.weaknesses || '');
      setRecommendation(interview.feedback.recommendation);
      setInternalNotes(interview.feedback.internalNotes || '');
    } else {
      setRating(5);
      setStrengths('');
      setWeaknesses('');
      setRecommendation('Aprovar');
      setInternalNotes('');
    }
    if (interview) {
      setNewStatus(
        interview.status === 'Agendada' || interview.status === 'Realizada'
          ? 'Aprovada'
          : interview.status
      );
    }
    setError('');
  }, [interview, isOpen]);

  if (!isOpen || !interview) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canUserEvaluate) {
      setError('Permissão negada: Somente o entrevistador responsável ou Administradores do RH podem alterar a avaliação.');
      return;
    }

    if (!strengths.trim()) {
      setError('Descreva ao menos um ponto forte observado durante a sessão.');
      return;
    }

    onSubmitFeedback(
      interview.id,
      {
        rating,
        strengths: strengths.trim(),
        weaknesses: weaknesses.trim(),
        recommendation,
        evaluatedBy: user?.name || interview.interviewerName,
        evaluatedAt: new Date().toLocaleString('pt-BR'),
        internalNotes: internalNotes.trim(),
      },
      newStatus
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-extrabold text-slate-900">
              Parecer & Avaliação de Entrevista
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Candidato: <strong className="text-slate-900">{interview.candidateName}</strong> • Vaga:{' '}
            <strong className="text-indigo-700">{interview.jobTitle}</strong>
          </p>
        </div>

        {/* Permission Warning if not authorized */}
        {!canUserEvaluate && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl flex items-center gap-2 font-bold">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Atenção: Apenas <strong>{interview.interviewerName}</strong> ou Gestores podem modificar esta avaliação.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Rating Stars */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Classificação / Nota Geral do Candidato (1 a 5)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={!canUserEvaluate}
                  onClick={() => setRating(s)}
                  className={`flex-1 py-2 rounded-xl border text-sm font-extrabold transition-all cursor-pointer ${
                    rating >= s
                      ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  ★ {s}
                </button>
              ))}
            </div>
          </div>

          {/* Strengths */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Pontos Fortes & Competências Demonstradas *
            </label>
            <textarea
              required
              rows={2}
              disabled={!canUserEvaluate}
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="Ex: Domínio avançado de React, excelente postura e boa comunicação interpessoal..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-3 outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Weaknesses */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Pontos de Atenção / Oportunidades de Melhoria
            </label>
            <textarea
              rows={2}
              disabled={!canUserEvaluate}
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
              placeholder="Ex: Pouca familiaridade com CI/CD, necessita acompanhamento em testes..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-3 outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Recommendation & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Recomendação do Entrevistador"
              disabled={!canUserEvaluate}
              value={recommendation}
              onChange={(e) => {
                const rec = e.target.value as InterviewRecommendation;
                setRecommendation(rec);
                if (rec === 'Aprovar' || rec === 'Avançar para Próxima Etapa') {
                  setNewStatus('Aprovada');
                } else if (rec === 'Reprovar') {
                  setNewStatus('Reprovada');
                } else if (rec === 'Manter no Banco') {
                  setNewStatus('Em Análise');
                }
              }}
              options={INTERVIEW_RECOMMENDATION_OPTIONS.map((r) => ({ value: r, label: r }))}
            />

            <Select
              label="Novo Status do Agendamento"
              disabled={!canUserEvaluate}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as InterviewStatus)}
              options={INTERVIEW_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
            />
          </div>

          {/* Internal Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Observações Internas (Confidencial RH)
            </label>
            <textarea
              rows={2}
              disabled={!canUserEvaluate}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Anotações sobre pretensão salarial, disponibilidade de inicio, etc..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-3 outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Fechar
            </Button>
            {canUserEvaluate && (
              <Button type="submit" variant="primary" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
                Salvar Avaliação
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
