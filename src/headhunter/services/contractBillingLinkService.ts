import { doc, writeBatch } from '../../firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { sanitizeFirestoreData } from '../../lib/firestoreUtils';
import { buildHeadhunterFinanceBatchPayloads } from './contractBillingBatchPayloads';
import { normalizeHeadhunterBillingStatus, resolveHeadhunterBillingStatus } from './headhunterFinanceUtils';

export type HeadhunterBillingStatus =
  | 'PENDENTE_DADOS_COMERCIAIS'
  | 'AGUARDANDO_COBRANCA'
  | 'FATURADO'
  | 'RECEBIDO'
  | 'FINALIZADO';

const parseLocalizedNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;

  let normalized = value.trim();
  if (!normalized) return 0;
  normalized = normalized.replace(/[^0-9,.-]/g, '');
  if (!normalized) return 0;

  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');
  if (hasComma && hasDot) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    normalized = normalized.replace(',', '.');
  } else if (hasDot) {
    const parts = normalized.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1]?.length === 3 && parts[0]?.length <= 3)) {
      normalized = parts.join('');
    }
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const asNumber = (...values: unknown[]): number => {
  for (const value of values) {
    const parsed = parseLocalizedNumber(value);
    if (parsed > 0) return parsed;
  }
  return 0;
};

const asText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

export const billingStatusLabel = (status?: string) => ({
  PENDENTE_DADOS_COMERCIAIS: 'Pendente de Dados Comerciais',
  AGUARDANDO_COBRANCA: 'Aguardando Cobrança',
  FATURADO: 'Faturado',
  RECEBIDO: 'Recebido',
  FINALIZADO: 'Finalizado',
}[normalizeHeadhunterBillingStatus(status)] || status || 'Pendente de Dados Comerciais');

export const getBillingId = (contratacaoId: string) => {
  if (!contratacaoId || contratacaoId.includes('/')) throw new Error('CONTRATACAO_ID_INVALIDO');
  return `cob_${contratacaoId}`;
};

export interface BuildBillingOptions {
  existing?: Record<string, any> | null;
  commercial?: Record<string, any> | null;
  /** Tenant resolved from the authenticated user's profile/AuthContext. */
  authenticatedEmpresaId?: string;
  /** Used only when a hiring is first created; commercial confirmation advances it. */
  forcePendingCommercial?: boolean;
  now?: string;
}

export function buildBillingLink(hiring: Record<string, any>, options: BuildBillingOptions = {}) {
  const existing = options.existing || {};
  const commercial = options.commercial || {};
  const now = options.now || new Date().toISOString();
  const contratacaoId = asText(hiring.id, hiring.contratacaoId);
  const hiringEmpresaId = asText(hiring.empresaId, hiring.companyId, hiring.tenantId);
  const authenticatedEmpresaId = asText(options.authenticatedEmpresaId);
  if (authenticatedEmpresaId && hiringEmpresaId && authenticatedEmpresaId !== hiringEmpresaId) {
    throw new Error('TENANT_MISMATCH');
  }
  const empresaId = authenticatedEmpresaId || hiringEmpresaId;
  if (!contratacaoId) throw new Error('CONTRATACAO_ID_OBRIGATORIO');
  if (!empresaId) throw new Error('EMPRESA_ID_OBRIGATORIO');

  const candidateId = asText(hiring.candidateId, hiring.candidatoId, existing.candidateId, existing.candidatoId);
  const vagaId = asText(hiring.vagaId, hiring.jobId, existing.vagaId, existing.jobId);
  const clienteId = asText(commercial.clienteId, commercial.clientId, existing.clienteId, existing.clientId, hiring.clienteId, hiring.clientId);
  const clienteNome = asText(commercial.clienteNome, existing.clienteNome, hiring.clienteNome, hiring.clientName);
  const remuneracao = asNumber(
    commercial.remuneracao,
    commercial.salarioContratado,
    existing.remuneracao,
    existing.salarioContratado,
    hiring.salarioContratado,
    hiring.salarioFinal,
    hiring.salaryExpectation,
    hiring.salario
  );
  const feePercentual = asNumber(
    commercial.feePercentual,
    commercial.percentual,
    existing.feePercentual,
    existing.percentual,
    hiring.feePercentual,
    hiring.percentualFee
  );
  const tipoCobranca = asText(
    commercial.tipoCobranca,
    existing.tipoCobranca,
    hiring.tipoCobranca,
    asNumber(commercial.feeFixo, existing.feeFixo) > 0 ? 'FIXO' : 'PERCENTUAL'
  ).toUpperCase() === 'FIXO' ? 'FIXO' : 'PERCENTUAL';
  const feeFixo = asNumber(commercial.feeFixo, existing.feeFixo, tipoCobranca === 'FIXO' ? existing.feeValor : 0);
  const valorFaturamento = tipoCobranca === 'FIXO'
    ? feeFixo
    : (remuneracao > 0 && feePercentual > 0 ? remuneracao * feePercentual / 100 : 0);
  const dadosCompletos = Boolean(clienteId && remuneracao > 0 && valorFaturamento > 0);
  const rawCurrentStatus = String(existing.status || '').toUpperCase();
  const currentStatus = rawCurrentStatus
    ? normalizeHeadhunterBillingStatus(rawCurrentStatus) as HeadhunterBillingStatus
    : '' as HeadhunterBillingStatus;
  const status = resolveHeadhunterBillingStatus({
    currentStatus,
    commercialDataComplete: dadosCompletos,
    forcePendingCommercial: options.forcePendingCommercial,
  }) as HeadhunterBillingStatus;
  // Registros legados já vinculados são atualizados no próprio documento; para
  // novas cobranças, o ID é sempre determinístico por contratacaoId.
  const billingId = asText(existing.id) && existing.contratacaoId === contratacaoId
    ? existing.id
    : getBillingId(contratacaoId);
  const previousHistory = Array.isArray(existing.historicoStatus) ? existing.historicoStatus : [];
  const statusChanged = currentStatus !== status;

  const billing = sanitizeFirestoreData({
    ...existing,
    id: billingId,
    contratacaoId,
    empresaId,
    companyId: empresaId,
    candidateId,
    candidatoId: candidateId,
    vagaId,
    jobId: vagaId,
    clienteId,
    clientId: clienteId,
    clienteNome,
    clienteRazaoSocial: asText(commercial.clienteRazaoSocial, existing.clienteRazaoSocial),
    clienteDocumento: asText(commercial.clienteDocumento, existing.clienteDocumento),
    candidatoNome: asText(hiring.candidatoNome, hiring.candidateName, existing.candidatoNome),
    vagaTitulo: asText(hiring.vagaTitulo, hiring.jobTitle, hiring.cargo, existing.vagaTitulo),
    remuneracao,
    salarioContratado: remuneracao,
    tipoCobranca,
    feePercentual,
    percentual: feePercentual,
    feeFixo,
    feeValor: valorFaturamento,
    valor: valorFaturamento,
    valorContratado: valorFaturamento,
    valorRecebido: Number(existing.valorRecebido || 0),
    saldo: Math.max(0, valorFaturamento - Number(existing.valorRecebido || 0)),
    dataContratacao: asText(hiring.contratadoEm, hiring.dataContratacao, existing.dataContratacao, now),
    dataEmissao: asText(existing.dataEmissao, now.slice(0, 10)),
    dataVencimento: asText(commercial.dataVencimento, existing.dataVencimento),
    formaPagamento: asText(commercial.formaPagamento, existing.formaPagamento, 'Boleto'),
    numeroNotaFiscal: asText(commercial.numeroNotaFiscal, existing.numeroNotaFiscal),
    observacoesComerciais: asText(commercial.observacoesComerciais, existing.observacoesComerciais, existing.observacoes),
    origemModulo: 'headhunter',
    origemTipo: 'contratacao',
    origemId: contratacaoId,
    tipoReceita: 'Principal',
    status,
    statusLabel: billingStatusLabel(status),
    situacao: status === 'RECEBIDO' || status === 'FINALIZADO' ? 'Recebida' : 'Aguardando',
    dadosComerciaisCompletos: dadosCompletos,
    pendenciasComerciais: [
      ...(!clienteId ? ['clienteId'] : []),
      ...(remuneracao <= 0 ? ['remuneracao'] : []),
      ...(valorFaturamento <= 0 ? ['fee'] : []),
    ],
    historicoStatus: statusChanged ? [
      ...previousHistory,
      {
        id: `hist-${Date.now()}`,
        dataHora: now,
        statusAnterior: currentStatus || 'CONTRATADO',
        novoStatus: status,
        usuario: auth.currentUser?.displayName || 'Sistema ATS',
        descricao: status === 'PENDENTE_DADOS_COMERCIAIS'
          ? 'Cobrança criada e vinculada; aguardando dados comerciais.'
          : 'Dados comerciais completos; cobrança liberada para faturamento.'
      }
    ] : previousHistory,
    createdAt: existing.createdAt || now,
    updatedAt: now,
    criadoEm: existing.criadoEm || now.slice(0, 10),
    atualizadoEm: now.slice(0, 10),
    criadoPor: existing.criadoPor || 'Sistema ATS',
  });

  const hiringTimeline = Array.isArray(hiring.timeline) ? hiring.timeline : [];
  const commercialEventId = `dados-comerciais-${contratacaoId}`;
  const forwardEventId = `encaminhamento-financeiro-${contratacaoId}`;
  const auditUser = auth.currentUser?.displayName || auth.currentUser?.email || 'Usuário autenticado';
  const auditUserId = auth.currentUser?.uid || '';
  const commercialEvents = dadosCompletos ? [
    {
      id: commercialEventId,
      tipo: 'dados_comerciais_definidos',
      title: 'Dados comerciais definidos',
      description: `${clienteNome || 'Cliente selecionado'} • ${valorFaturamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`,
      date: now,
      by: auditUser,
      usuarioId: auditUserId,
      clienteId,
      clienteNome,
      valor: valorFaturamento,
      contratacaoId,
    },
    {
      id: forwardEventId,
      tipo: 'encaminhamento_financeiro_headhunter',
      title: 'Encaminhado para Financeiro / Headhunter',
      description: `Cobrança ${billingId} criada ou atualizada sem duplicidade.`,
      date: now,
      by: auditUser,
      usuarioId: auditUserId,
      clienteId,
      clienteNome,
      valor: valorFaturamento,
      contratacaoId,
      cobrancaId: billingId,
    },
  ] : [];
  const nextHiringTimeline = commercialEvents.reduce<any[]>((timeline, event) => {
    const withoutPreviousVersion = timeline.filter((current: any) => current?.id !== event.id);
    return [...withoutPreviousVersion, event];
  }, hiringTimeline);

  const hiringPatch = sanitizeFirestoreData({
    empresaId,
    companyId: empresaId,
    clienteId,
    clientId: clienteId,
    clienteNome,
    remuneracaoCombinada: remuneracao,
    tipoCobranca,
    feePercentual,
    feeFixo,
    valorFee: valorFaturamento,
    dataVencimento: asText(commercial.dataVencimento, existing.dataVencimento),
    observacoesComerciais: asText(commercial.observacoesComerciais, existing.observacoesComerciais, existing.observacoes),
    cobrancaId: billingId,
    financeiroId: billingId,
    destino: 'Financeiro / Headhunter',
    destinoContratacao: 'FINANCEIRO_HEADHUNTER',
    destinoProcesso: 'Financeiro / Headhunter',
    encaminhadoPara: 'financeiro',
    encaminhadoFinanceiro: true,
    encaminhadoFinanceiroEm: existing.createdAt || now,
    statusFinanceiro: status,
    statusProcesso: status,
    statusEncaminhamento: status,
    timeline: nextHiringTimeline,
    updatedAt: now,
  });

  return { billingId, billing, hiringPatch, status, dadosCompletos };
}

export async function upsertBillingForHiring(
  hiring: Record<string, any>,
  options: BuildBillingOptions = {}
) {
  const result = buildBillingLink(hiring, options);
  const userId = auth.currentUser?.uid || '';
  const payloads = buildHeadhunterFinanceBatchPayloads(result, hiring.id, {
    id: userId,
    name: auth.currentUser?.displayName || auth.currentUser?.email || 'Usuário autenticado',
  });
  const batch = writeBatch(db);
  batch.set(doc(db, 'financeiro_cobrancas', result.billingId), sanitizeFirestoreData(payloads.billing), { merge: true });
  // A contratação já existe. update() preserva todos os demais campos e evita
  // substituir acidentalmente o documento sem os campos de tenant.
  batch.update(doc(db, 'contratacoes', hiring.id), sanitizeFirestoreData(payloads.hiring));
  try {
    await batch.commit();
  } catch (error) {
    console.error('[FINANCEIRO_HEADHUNTER_WRITE_DENIED]', {
      operation: 'batch-write',
      uid: auth.currentUser?.uid || null,
      empresaId: payloads.billing.empresaId,
      contratacaoId: hiring.id,
      cobrancaId: result.billingId,
      writes: [
        `financeiro_cobrancas/${result.billingId}`,
        `contratacoes/${hiring.id}`,
      ],
      code: (error as any)?.code || null,
    });
    throw error;
  }

  // Auditoria é intencionalmente executada depois do commit financeiro. Uma
  // indisponibilidade ou regra incompatível em audit_logs não pode desfazer a
  // cobrança e a atualização da contratação que já foram confirmadas juntas.
  if (payloads.dadosComerciaisAudit && payloads.encaminhamentoFinanceiroAudit) {
    const auditBatch = writeBatch(db);
    auditBatch.set(
      doc(db, 'audit_logs', `dados_comerciais_${hiring.id}`),
      sanitizeFirestoreData(payloads.dadosComerciaisAudit),
      { merge: true },
    );
    auditBatch.set(
      doc(db, 'audit_logs', `encaminhamento_financeiro_${hiring.id}`),
      sanitizeFirestoreData(payloads.encaminhamentoFinanceiroAudit),
      { merge: true },
    );
    try {
      await auditBatch.commit();
    } catch (error) {
      console.warn('[FINANCEIRO_HEADHUNTER_AUDIT_WRITE_FAILED]', {
        uid: userId,
        empresaId: payloads.billing.empresaId,
        contratacaoId: hiring.id,
        cobrancaId: result.billingId,
        code: (error as any)?.code || null,
      });
    }
  }
  return result;
}
