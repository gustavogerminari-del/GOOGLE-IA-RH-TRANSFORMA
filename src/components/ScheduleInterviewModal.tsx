import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle2, Clock, ShieldCheck, Video, X } from 'lucide-react';
import { Candidate, Interview, InterviewScheduleInput, Job } from '../types/rh';
import { useAuth } from '../auth';
import { getCompanyId } from '../auth/profile';
import { GoogleWorkspaceService } from '../services/GoogleWorkspaceService';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (interview: InterviewScheduleInput) => Promise<void>;
  candidates: Candidate[];
  jobs: Job[];
  initialInterview?: Interview | null;
}

const emptyForm = {
  candidateId: '', jobId: '', interviewerName: '', interviewerEmail: '', date: '', time: '', endTime: '',
  durationMinutes: 45, type: 'Entrevista RH' as Interview['type'], modality: 'Google Meet' as NonNullable<Interview['modality']>,
  locationUrl: '', notes: '', inviteCandidate: true, inviteInterviewer: true,
  recordingEnabled: false, transcriptionEnabled: false, aiAnalysisEnabled: true, consentAccepted: false,
};
export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  isOpen, onClose, onSubmit, candidates, jobs, initialInterview,
}) => {
  const { user } = useAuth();
  const companyId = getCompanyId(user) || '';
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [googleStatus, setGoogleStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [allowFallback, setAllowFallback] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setAllowFallback(false);
    if (initialInterview) {
      setForm({
        candidateId: initialInterview.candidateId,
        jobId: initialInterview.jobId,
        interviewerName: initialInterview.interviewerName,
        interviewerEmail: initialInterview.interviewerEmail || '',
        date: initialInterview.date,
        time: initialInterview.time,
        endTime: initialInterview.endTime || '',
        durationMinutes: initialInterview.durationMinutes || 45,
        type: initialInterview.type,
        modality: initialInterview.modality || (initialInterview.googleMeetUrl ? 'Google Meet' : 'Outro'),
        locationUrl: initialInterview.locationUrl || '',
        notes: initialInterview.notes || '',
        inviteCandidate: initialInterview.inviteCandidate !== false,
        inviteInterviewer: initialInterview.inviteInterviewer !== false,
        recordingEnabled: initialInterview.recordingEnabled === true,
        transcriptionEnabled: initialInterview.transcriptionEnabled === true,
        aiAnalysisEnabled: initialInterview.aiAnalysisEnabled !== false,
        consentAccepted: initialInterview.consentNoticeShown === true,
      });
    } else {
      setForm({ ...emptyForm, interviewerName: user?.name || '', interviewerEmail: user?.email || '' });
    }
    if (!companyId) {
      setGoogleStatus('disconnected');
      return;
    }
    setGoogleStatus('checking');
    GoogleWorkspaceService.getStatus(companyId)
      .then(result => setGoogleStatus(result.integration.status === 'connected' ? 'connected' : 'disconnected'))
      .catch(() => setGoogleStatus('disconnected'));
  }, [isOpen, initialInterview, companyId, user?.name, user?.email]);

  const selectedCandidate = useMemo(() => candidates.find(candidate => candidate.id === form.candidateId), [candidates, form.candidateId]);
  const selectedJob = useMemo(() => jobs.find(job => job.id === form.jobId), [jobs, form.jobId]);
  const googleMeet = form.modality === 'Google Meet';
  const disclosureRequired = googleMeet && (form.recordingEnabled || form.transcriptionEnabled || form.aiAnalysisEnabled);

  if (!isOpen) return null;

  const update = <K extends keyof typeof form>(key: K, value: typeof form[K]) => setForm(previous => ({ ...previous, [key]: value }));

  const payload = (forceWithoutGoogle = false): InterviewScheduleInput => ({
    id: initialInterview?.id,
    candidateId: form.candidateId,
    candidateName: selectedCandidate?.name || initialInterview?.candidateName || '',
    candidateRole: selectedCandidate?.role || selectedJob?.title || initialInterview?.candidateRole || '',
    jobId: form.jobId,
    jobTitle: selectedJob?.title || initialInterview?.jobTitle || '',
    interviewerName: form.interviewerName.trim(),
    interviewerEmail: form.interviewerEmail.trim().toLowerCase(),
    date: form.date,
    time: form.time,
    endTime: form.endTime,
    durationMinutes: Number(form.durationMinutes) || 45,
    type: form.type,
    modality: forceWithoutGoogle ? 'Outro' : form.modality,
    locationUrl: forceWithoutGoogle ? '' : form.locationUrl,
    notes: forceWithoutGoogle ? `${form.notes}${form.notes ? '\n' : ''}Google Meet pendente de criação.` : form.notes,
    inviteCandidate: form.inviteCandidate,
    inviteInterviewer: form.inviteInterviewer,
    recordingEnabled: forceWithoutGoogle ? false : form.recordingEnabled,
    transcriptionEnabled: forceWithoutGoogle ? false : form.transcriptionEnabled,
    aiAnalysisEnabled: forceWithoutGoogle ? false : form.aiAnalysisEnabled,
    consentNoticeShown: disclosureRequired && form.consentAccepted,
    consentAcceptedAt: disclosureRequired && form.consentAccepted ? new Date().toISOString() : null,
    forceWithoutGoogle,
  });

  const submit = async (forceWithoutGoogle = false) => {
    setError('');
    if (!form.candidateId || !form.jobId || !form.interviewerName.trim() || !form.date || !form.time) {
      setError('Candidato, vaga, entrevistador, data e horário são obrigatórios.');
      return;
    }
    if (googleMeet && !forceWithoutGoogle && googleStatus !== 'connected') {
      setError('Conecte a conta Google Workspace da empresa em Configurações > Integrações antes de criar o Meet.');
      setAllowFallback(true);
      return;
    }
    if (disclosureRequired && !forceWithoutGoogle && !form.consentAccepted) {
      setError('Confirme o aviso de gravação, transcrição e análise por IA antes de continuar.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(payload(forceWithoutGoogle));
      onClose();
    } catch (submitError: any) {
      setError(submitError?.message || 'Não foi possível agendar a entrevista.');
      if (googleMeet && !forceWithoutGoogle) setAllowFallback(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl relative my-6 max-h-[92vh] overflow-y-auto">
        <button type="button" onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full" aria-label="Fechar"><X className="w-5 h-5" /></button>
        <div className="flex items-center gap-3 pr-12">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center"><Calendar className="w-5 h-5 text-indigo-600" /></div>
          <div><h3 className="text-xl font-extrabold text-slate-900">{initialInterview ? 'Editar Agendamento' : 'Agendar Entrevista'}</h3><p className="text-xs text-slate-500">Um único agendamento vinculado ao candidato, à vaga e à empresa.</p></div>
        </div>

        {error && <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-semibold flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1 font-bold text-slate-700">Candidato *<select value={form.candidateId} disabled={Boolean(initialInterview)} onChange={event => update('candidateId', event.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl disabled:opacity-70"><option value="">Selecione o candidato...</option>{candidates.map(candidate => <option key={candidate.id} value={candidate.id}>{candidate.name} — {candidate.role}</option>)}</select></label>
            <label className="space-y-1 font-bold text-slate-700">Vaga *<select value={form.jobId} disabled={Boolean(initialInterview)} onChange={event => update('jobId', event.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl disabled:opacity-70"><option value="">Selecione a vaga...</option>{jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}</select></label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1 font-bold text-slate-700">Entrevistador *<input value={form.interviewerName} onChange={event => update('interviewerName', event.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl" /></label>
            <label className="space-y-1 font-bold text-slate-700">E-mail do entrevistador<input type="email" value={form.interviewerEmail} onChange={event => update('interviewerEmail', event.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl" /></label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="space-y-1 font-bold text-slate-700">Data *<input type="date" value={form.date} onChange={event => update('date', event.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl" /></label>
            <label className="space-y-1 font-bold text-slate-700">Início *<input type="time" value={form.time} onChange={event => update('time', event.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl" /></label>
            <label className="space-y-1 font-bold text-slate-700">Final<input type="time" value={form.endTime} onChange={event => update('endTime', event.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl" /></label>
            <label className="space-y-1 font-bold text-slate-700">Duração<input type="number" min={15} step={15} value={form.durationMinutes} onChange={event => update('durationMinutes', Number(event.target.value))} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl" /></label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1 font-bold text-slate-700">Etapa / avaliação<select value={form.type} onChange={event => update('type', event.target.value as Interview['type'])} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl"><option>Entrevista RH</option><option>Teste Técnico</option><option>Entrevista com Gestor</option><option>Fit Cultural</option></select></label>
            <label className="space-y-1 font-bold text-slate-700">Modalidade<select value={form.modality} onChange={event => update('modality', event.target.value as NonNullable<Interview['modality']>)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl"><option>Presencial</option><option>Telefone</option><option>Google Meet</option><option>Outro</option></select></label>
          </div>

          {!googleMeet && <label className="space-y-1 font-bold text-slate-700">Local ou instrução<input value={form.locationUrl} onChange={event => update('locationUrl', event.target.value)} placeholder="Endereço, telefone ou outro link" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl" /></label>}

          {googleMeet && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2"><span className="font-black text-blue-900 flex items-center gap-1.5"><Video className="w-4 h-4" /> Google Meet automático</span><span className={`text-[10px] font-black ${googleStatus === 'connected' ? 'text-emerald-700' : 'text-amber-700'}`}>{googleStatus === 'checking' ? 'Verificando integração...' : googleStatus === 'connected' ? 'Conta conectada' : 'Conta não conectada'}</span></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  ['inviteCandidate', 'Enviar convite ao candidato'], ['inviteInterviewer', 'Enviar convite ao entrevistador'],
                  ['recordingEnabled', 'Ativar gravação automática'], ['transcriptionEnabled', 'Ativar transcrição automática'], ['aiAnalysisEnabled', 'Gerar diagnóstico IA'],
                ].map(([key, label]) => <label key={key} className="flex items-center gap-2 bg-white border border-blue-100 rounded-xl p-2.5 font-semibold"><input type="checkbox" checked={Boolean(form[key as keyof typeof form])} onChange={event => update(key as keyof typeof form, event.target.checked as any)} />{label}</label>)}
              </div>
              {(form.recordingEnabled || form.transcriptionEnabled) && <p className="text-[11px] text-blue-800">A ativação automática depende do plano Google Workspace e da permissão do organizador. Se indisponível, o evento e o Meet continuarão sendo criados.</p>}
            </div>
          )}

          {disclosureRequired && (
            <label className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3 text-amber-950"><input type="checkbox" checked={form.consentAccepted} onChange={event => update('consentAccepted', event.target.checked)} className="mt-0.5" /><span><strong className="block mb-1">Aviso obrigatório de gravação, transcrição e IA</strong>Esta entrevista poderá ser gravada e transcrita para geração de resumo e apoio à avaliação do processo seletivo por inteligência artificial. A decisão final permanece sob responsabilidade do recrutador. Não existe gravação oculta.</span></label>
          )}

          <label className="space-y-1 font-bold text-slate-700">Observações<textarea rows={3} value={form.notes} onChange={event => update('notes', event.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl" placeholder="Pauta, orientações e pontos profissionais a aprofundar..." /></label>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[10px] text-slate-500 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" />Tokens e chaves permanecem somente no backend.</div>
          <div className="flex flex-wrap justify-end gap-2">
            {allowFallback && <button type="button" disabled={isSubmitting} onClick={() => submit(true)} className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold">Salvar entrevista sem Meet</button>}
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="button" disabled={isSubmitting} onClick={() => submit(false)} className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5">{isSubmitting ? <Clock className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}{isSubmitting ? 'Confirmando...' : 'Confirmar Agendamento'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
