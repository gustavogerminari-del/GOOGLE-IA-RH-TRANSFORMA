import type { HeadhunterExpense } from '../types';

export type CanonicalHeadhunterBillingStatus =
  | 'PENDENTE_DADOS_COMERCIAIS'
  | 'AGUARDANDO_COBRANCA'
  | 'FATURADO'
  | 'RECEBIDO'
  | 'FINALIZADO';

export function normalizeHeadhunterBillingStatus(status: unknown): CanonicalHeadhunterBillingStatus {
  const normalized = String(status || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[\s/-]+/g, '_');
  if (normalized === 'GUARDANDO_COBRANCA') return 'AGUARDANDO_COBRANCA';
  if (normalized === 'PENDENTE_DE_DADOS_COMERCIAIS') return 'PENDENTE_DADOS_COMERCIAIS';
  if (normalized === 'FINALIZADA' || normalized === 'FINALIZADO') return 'FINALIZADO';
  if (normalized === 'RECEBIDA' || normalized === 'PAGO') return 'RECEBIDO';
  if (
    normalized === 'AGUARDANDO_COBRANCA' ||
    normalized === 'FATURADO' ||
    normalized === 'RECEBIDO' ||
    normalized === 'FINALIZADO'
  ) return normalized;
  return 'PENDENTE_DADOS_COMERCIAIS';
}

export function matchesHeadhunterHiringTab(
  tab: 'HEADHUNTER' | 'AGUARDANDO_COBRANCA' | 'FINALIZADAS',
  status: unknown,
): boolean {
  const canonical = normalizeHeadhunterBillingStatus(status);
  if (tab === 'HEADHUNTER') return canonical === 'PENDENTE_DADOS_COMERCIAIS';
  if (tab === 'AGUARDANDO_COBRANCA') return canonical === 'AGUARDANDO_COBRANCA';
  return canonical === 'RECEBIDO' || canonical === 'FINALIZADO';
}

export function resolveHeadhunterBillingStatus(input: {
  currentStatus?: unknown;
  commercialDataComplete: boolean;
  forcePendingCommercial?: boolean;
}): CanonicalHeadhunterBillingStatus {
  const hasCurrentStatus = Boolean(String(input.currentStatus || '').trim());
  const current = normalizeHeadhunterBillingStatus(input.currentStatus);
  if (hasCurrentStatus && ['FATURADO', 'RECEBIDO', 'FINALIZADO'].includes(current)) return current;
  if (input.forcePendingCommercial) return 'PENDENTE_DADOS_COMERCIAIS';
  return input.commercialDataComplete ? 'AGUARDANDO_COBRANCA' : 'PENDENTE_DADOS_COMERCIAIS';
}

export function isExpenseLinkedToJob(
  expense: Pick<HeadhunterExpense, 'tipoDespesa' | 'vagaId' | 'vagaTitulo'>,
  job: { id?: string; vagaId?: string; titulo?: string; title?: string; cargo?: string },
): boolean {
  if (expense.tipoDespesa !== 'vaga') return false;
  const jobId = String(job.id || job.vagaId || '').trim();
  const expenseJobId = String(expense.vagaId || '').trim();
  if (expenseJobId || jobId) return Boolean(expenseJobId && jobId && expenseJobId === jobId);

  // Compatibilidade somente para lançamentos antigos que não possuem ID.
  const title = String(job.titulo || job.title || job.cargo || '').trim();
  return Boolean(title && expense.vagaTitulo === title);
}

export function buildExpenseLink(input: {
  type: 'vaga' | 'geral';
  client?: { id: string; name: string } | null;
  job?: { id: string; title: string } | null;
}) {
  if (input.type === 'geral') {
    return { clienteId: null, clienteNome: null, vagaId: null, vagaTitulo: null };
  }
  if (!input.client?.id) throw new Error('EXPENSE_CLIENT_REQUIRED');
  if (!input.job?.id) throw new Error('EXPENSE_JOB_REQUIRED');
  return {
    clienteId: input.client.id,
    clienteNome: input.client.name,
    vagaId: input.job.id,
    vagaTitulo: input.job.title,
  };
}
