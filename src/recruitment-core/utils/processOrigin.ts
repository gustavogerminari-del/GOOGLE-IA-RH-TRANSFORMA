export type CanonicalProcessOrigin = 'HEADHUNTER' | 'RH_INTERNO';

export const HEADHUNTER_ORIGIN_FIELDS = Object.freeze({
  isHeadhunter: true,
  projetoHeadhunter: true,
  moduloOrigem: 'HEADHUNTER',
  origem: 'headhunter',
  origemProcesso: 'HEADHUNTER',
  tipoProcesso: 'headhunter',
  destinoContratacao: 'FINANCEIRO_HEADHUNTER',
});

const normalize = (value: unknown) => String(value ?? '').trim().toLowerCase();

export function resolveExplicitProcessOrigin(record: any): CanonicalProcessOrigin | null {
  if (!record) return null;

  const values = [
    record.origemProcesso,
    record.moduloOrigem,
    record.origem,
    record.tipoProcesso,
    record.tipoVaga,
    record.destinoContratacao,
    record.destinoProcesso,
    record.encaminhadoPara,
  ].map(normalize).filter(Boolean);

  if (
    record.isHeadhunter === true ||
    record.projetoHeadhunter === true ||
    values.some(value => value.includes('headhunter') || value === 'financeiro')
  ) {
    return 'HEADHUNTER';
  }

  if (
    values.some(value => [
      'rh_interno',
      'recrutamento_interno',
      'vaga_interna',
      'rh',
      'dp',
      'departamento_pessoal',
    ].includes(value))
  ) {
    return 'RH_INTERNO';
  }

  return null;
}

export function requireProcessOrigin(record: any, context: string): CanonicalProcessOrigin {
  const origin = resolveExplicitProcessOrigin(record);
  if (origin) return origin;

  console.error('[PROCESS_ORIGIN_MISSING]', {
    context,
    id: record?.id || null,
    vagaId: record?.vagaId || record?.jobId || null,
  });
  throw new Error('PROCESS_ORIGIN_MISSING');
}

export function canSendToAdmission(record: any): boolean {
  const origin = resolveExplicitProcessOrigin(record);
  const destination = normalize(record?.destinoContratacao);
  return destination === 'dp' || destination === 'departamento_pessoal' || origin === 'RH_INTERNO';
}

export function isHeadhunterProcess(record: any): boolean {
  return resolveExplicitProcessOrigin(record) === 'HEADHUNTER';
}
