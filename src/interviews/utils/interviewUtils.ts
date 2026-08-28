import { InterviewStatus } from '../types/interview';

/**
 * Normaliza qualquer string de status de entrevista para um dos valores padronizados:
 * 'Agendada' | 'Realizada' | 'Aprovada' | 'Reprovada' | 'Em Análise' | 'Cancelada'
 */
export function normalizeInterviewStatus(status?: string | null): InterviewStatus {
  if (!status) return 'Agendada';
  const s = status.toString().trim().toLowerCase();

  if (s.includes('diagnóstico disponível') || s.includes('diagnostico disponivel')) return 'Diagnóstico disponível';
  if (s.includes('processando ia')) return 'Processando IA';
  if (s.includes('aguardando transcri')) return 'Aguardando transcrição';
  if (s.includes('aguardando grava')) return 'Aguardando gravação';
  if (s.includes('em andamento')) return 'Em andamento';
  if (s.includes('aguardando início') || s.includes('aguardando inicio')) return 'Aguardando início';

  if (s.includes('aprovad') || s === 'aprovar' || s === 'aprovado' || s === 'aprovada') {
    return 'Aprovada';
  }
  if (s.includes('reprovad') || s === 'reprovar' || s === 'reprovado' || s === 'reprovada') {
    return 'Reprovada';
  }
  if (
    s.includes('análise') ||
    s.includes('analise') ||
    s.includes('dúvida') ||
    s.includes('duvida') ||
    s.includes('pendente') ||
    s.includes('manter')
  ) {
    return 'Em Análise';
  }
  if (s.includes('realizad') || s.includes('concluíd') || s.includes('concluid')) {
    return 'Realizada';
  }
  if (s.includes('cancelad')) {
    return 'Cancelada';
  }
  if (s.includes('reagendad')) return 'Reagendada';
  if (s.includes('agendad')) return 'Agendada';
  return 'Agendada';
}
