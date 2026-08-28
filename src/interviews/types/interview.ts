/**
 * MÓDULO ENTREVISTAS E PROCESSOS SELETIVOS - Tipos e Interfaces
 * RH TRANSFORMA - Sistema de Gestão de Pessoas
 */

export type InterviewType = 'Online (Google Meet)' | 'Online (Teams)' | 'Presencial' | 'Entrevista por Telefone' | 'Entrevista RH' | 'Teste Técnico' | 'Entrevista com Gestor' | 'Fit Cultural';

export type InterviewStatus = 'Agendada' | 'Aguardando início' | 'Em andamento' | 'Realizada' | 'Aguardando gravação' | 'Aguardando transcrição' | 'Processando IA' | 'Diagnóstico disponível' | 'Aprovada' | 'Reprovada' | 'Em Análise' | 'Cancelada' | 'Reagendada' | 'Concluída';

export type InterviewRecommendation = 'Aprovar' | 'Reprovar' | 'Manter no Banco' | 'Avançar para Próxima Etapa';

export interface InterviewFeedback {
  rating: number; // 1 a 5
  strengths: string;
  weaknesses: string;
  recommendation: InterviewRecommendation;
  evaluatedBy?: string;
  evaluatedAt?: string;
  internalNotes?: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateAvatar?: string;
  candidateRole?: string;
  jobId: string;
  jobTitle: string;
  department?: string;
  interviewerId?: string;
  interviewerName: string;
  interviewerEmail?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes?: number;
  type: InterviewType;
  modality?: 'Presencial' | 'Telefone' | 'Google Meet' | 'Outro';
  locationUrl?: string; // Link da videochamada ou endereço físico
  stageName?: string; // ex: "Entrevista Técnica", "Fit Cultural", "Entrevista com Gestor"
  status: InterviewStatus;
  feedback?: InterviewFeedback;
  notes?: string;
  reminderSent?: boolean;
  inviteCandidate?: boolean;
  inviteInterviewer?: boolean;
  recordingEnabled?: boolean;
  transcriptionEnabled?: boolean;
  aiAnalysisEnabled?: boolean;
  consentNoticeShown?: boolean;
  consentAcceptedAt?: string | null;
  googleCalendarEventId?: string;
  googleMeetSpaceId?: string;
  googleMeetSpaceName?: string;
  googleMeetConferenceId?: string;
  googleMeetUrl?: string;
  organizerEmail?: string;
  calendarId?: string;
  applicationId?: string;
  recordingAvailable?: boolean;
  transcriptionAvailable?: boolean;
  diagnosisAvailable?: boolean;
  participantCount?: number;
  googleRecordingUrl?: string;
  googleTranscriptUrl?: string;
  integrationWarnings?: string[];
  createdAt?: string;
}

export interface InterviewFilterParams {
  searchTerm?: string;
  status?: string;
  type?: string;
  jobId?: string;
  interviewerName?: string;
  dateRange?: 'Todos' | 'Hoje' | 'Esta Semana' | 'Próximos Dias';
}
