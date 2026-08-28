/**
 * MÓDULO ENTREVISTAS - Opções e Constantes
 */

export const INTERVIEW_TYPE_OPTIONS = [
  'Online (Google Meet)',
  'Online (Teams)',
  'Presencial',
  'Entrevista por Telefone',
] as const;

export const INTERVIEW_STATUS_OPTIONS = [
  'Agendada',
  'Realizada',
  'Aprovada',
  'Reprovada',
  'Em Análise',
  'Cancelada',
] as const;

export const INTERVIEW_STAGE_OPTIONS = [
  'Triagem Inicial',
  'Entrevista RH / Fit Cultural',
  'Entrevista Técnica / Teste Пра́tico',
  'Entrevista com Gestor / Diretoria',
  'Proposta Comercial & Alinhamento',
] as const;

export const INTERVIEW_RECOMMENDATION_OPTIONS = [
  'Aprovar',
  'Reprovar',
  'Manter no Banco',
  'Avançar para Próxima Etapa',
] as const;
