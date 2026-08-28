import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Video,
  User,
  Briefcase,
  Plus,
  AlertCircle,
  Bell,
  MapPin,
  Send,
} from 'lucide-react';
import { Interview, InterviewType } from '../types/interview';
import {
  INTERVIEW_TYPE_OPTIONS,
  INTERVIEW_STAGE_OPTIONS,
} from '../constants/interviewOptions';
import { Candidate } from '../../talent-bank';
import { Job } from '../../jobs';
import { Button, Input, Select } from '../../shared';

export interface InterviewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduleInterview: (
    interviewData: Omit<Interview, 'id' | 'status'>
  ) => void;
  candidates: Candidate[];
  jobs: Job[];
  initialCandidateId?: string;
  initialJobId?: string;
}

export const InterviewScheduleModal: React.FC<InterviewScheduleModalProps> = ({
  isOpen,
  onClose,
  onScheduleInterview,
  candidates,
  jobs,
  initialCandidateId,
  initialJobId,
}) => {
  const [candidateId, setCandidateId] = useState(initialCandidateId || '');
  const [jobId, setJobId] = useState(initialJobId || '');
  const [interviewerName, setInterviewerName] = useState('Ana Paula Souza');
  const [interviewerEmail, setInterviewerEmail] = useState('ana.souza@maisrh.com.br');
  const [date, setDate] = useState('2026-07-28');
  const [time, setTime] = useState('14:30');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [type, setType] = useState<InterviewType>('Online (Google Meet)');
  const [locationUrl, setLocationUrl] = useState('https://meet.google.com/rh-session-demo');
  const [stageName, setStageName] = useState<string>(INTERVIEW_STAGE_OPTIONS[1]);
  const [notes, setNotes] = useState('');
  const [sendReminderEmail, setSendReminderEmail] = useState(true);

  const [error, setError] = useState('');

  // Synchronize initial selection
  useEffect(() => {
    if (initialCandidateId) setCandidateId(initialCandidateId);
    if (initialJobId) setJobId(initialJobId);
  }, [initialCandidateId, initialJobId, isOpen]);

  // When candidate changes, auto-select candidate's current job if assigned
  useEffect(() => {
    if (candidateId) {
      const selectedCand = candidates.find((c) => c.id === candidateId);
      if (selectedCand?.currentJobId) {
        setJobId(selectedCand.currentJobId);
      }
    }
  }, [candidateId, candidates]);

  // Auto generate link when type changes
  useEffect(() => {
    if (type.includes('Google Meet')) {
      setLocationUrl(`https://meet.google.com/rh-meet-${Math.floor(100 + Math.random() * 900)}`);
    } else if (type.includes('Teams')) {
      setLocationUrl(`https://teams.microsoft.com/l/meetup-join/rh-teams-${Math.floor(100 + Math.random() * 900)}`);
    } else if (type.includes('Presencial')) {
      setLocationUrl('Av. Paulista, 1000 - 12º Andar, Sala de Reunião A');
    } else {
      setLocationUrl('Ligação direta para número do candidato');
    }
  }, [type]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!candidateId || !jobId) {
      setError('Por favor, selecione obrigatoriamente o Candidato e a Vaga correspondente.');
      return;
    }

    if (!interviewerName.trim() || !date || !time) {
      setError('Preencha o nome do entrevistador responsável, data e horário.');
      return;
    }

    const targetCand = candidates.find((c) => c.id === candidateId);
    const targetJob = jobs.find((j) => j.id === jobId);

    onScheduleInterview({
      candidateId,
      candidateName: targetCand?.name || 'Candidato Não Identificado',
      candidateAvatar: targetCand?.avatar,
      candidateRole: targetCand?.role || targetJob?.title,
      jobId,
      jobTitle: targetJob?.title || 'Vaga Não Especificada',
      department: targetJob?.department || targetCand?.departmentArea,
      interviewerName: interviewerName.trim(),
      interviewerEmail: interviewerEmail.trim(),
      date,
      time,
      durationMinutes: Number(durationMinutes) || 45,
      type,
      locationUrl,
      stageName,
      notes,
      reminderSent: sendReminderEmail,
      createdAt: new Date().toISOString().split('T')[0],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-600" />
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Agendar Nova Entrevista
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Vincule o candidato à vaga, defina responsável e envie convite.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Candidate Selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Candidato Mapeado *
            </label>
            <select
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-3 outline-none focus:border-indigo-500 font-bold cursor-pointer"
            >
              <option value="">Selecione o candidato no Banco de Talentos...</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.role} ({c.location})
                </option>
              ))}
            </select>
          </div>

          {/* Job Selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Vaga Correspondente *
            </label>
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-3 outline-none focus:border-indigo-500 font-bold cursor-pointer"
            >
              <option value="">Selecione a vaga aberta...</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.department}) — {j.location}
                </option>
              ))}
            </select>
          </div>

          {/* Interviewer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Entrevistador / Responsável *"
              placeholder="Ex: Ana Paula Souza"
              value={interviewerName}
              onChange={(e) => setInterviewerName(e.target.value)}
              required
            />

            <Input
              label="E-mail do Entrevistador"
              type="email"
              placeholder="ana.souza@maisrh.com.br"
              value={interviewerEmail}
              onChange={(e) => setInterviewerEmail(e.target.value)}
            />
          </div>

          {/* Date, Time & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              type="date"
              label="Data da Entrevista *"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <Input
              type="time"
              label="Horário *"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />

            <Input
              type="number"
              label="Duração (Minutos)"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              min={15}
              step={15}
            />
          </div>

          {/* Mode & Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Tipo / Modalidade de Sessão"
              value={type}
              onChange={(e) => setType(e.target.value as InterviewType)}
              options={INTERVIEW_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))}
            />

            <Select
              label="Etapa do Processo Seletivo"
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              options={INTERVIEW_STAGE_OPTIONS.map((s) => ({ value: s, label: s }))}
            />
          </div>

          {/* Link or Location */}
          <Input
            label={type.includes('Presencial') ? 'Endereço / Sala' : 'Link da Reunião Virtual'}
            placeholder="Ex: https://meet.google.com/xyz..."
            value={locationUrl}
            onChange={(e) => setLocationUrl(e.target.value)}
          />

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Orientações ou Pauta da Entrevista
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-3 outline-none focus:border-indigo-500 font-medium"
              placeholder="Descreva pontos chaves a investigar (portfólio, pretensão, experiência técnica...)"
            />
          </div>

          {/* Automatic Reminder Alert Checkbox */}
          <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <span className="font-extrabold text-indigo-900 block">Notificação & Lembrete Automático</span>
                <span className="text-[11px] text-slate-600">Disparar lembrete por e-mail com convite de agenda.</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={sendReminderEmail}
              onChange={(e) => setSendReminderEmail(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" leftIcon={<Send className="w-4 h-4" />}>
              Confirmar Agendamento
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
