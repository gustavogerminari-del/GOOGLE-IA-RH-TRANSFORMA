export interface HeadhunterFinanceBatchResult {
  billingId: string;
  billing: Record<string, any>;
  hiringPatch: Record<string, any>;
  status: string;
  dadosCompletos: boolean;
}

export function buildHeadhunterFinanceBatchPayloads(
  result: HeadhunterFinanceBatchResult,
  hiringId: string,
  user: { id: string; name: string }
) {
  const empresaId = result.billing.empresaId;
  if (!empresaId || result.billing.companyId !== empresaId) throw new Error('TENANT_REQUIRED');
  if (!user.id) throw new Error('AUTH_REQUIRED');

  const billing = { ...result.billing, empresaId, companyId: empresaId };
  const hiring = { ...result.hiringPatch, empresaId, companyId: empresaId };
  const auditBase = {
    empresaId,
    companyId: empresaId,
    userId: user.id,
    usuarioId: user.id,
    usuario: user.name,
    entidade: 'contratacao',
    entidadeId: hiringId,
    contratacaoId: hiringId,
    cobrancaId: result.billingId,
    clienteId: result.billing.clienteId,
    clienteNome: result.billing.clienteNome,
    valor: result.billing.feeValor,
    status: result.status,
    createdAt: result.billing.updatedAt,
    updatedAt: result.billing.updatedAt,
  };

  return {
    billing,
    hiring,
    dadosComerciaisAudit: result.dadosCompletos ? {
      ...auditBase,
      id: `dados_comerciais_${hiringId}`,
      acao: 'DADOS_COMERCIAIS_DEFINIDOS',
      descricao: 'Dados comerciais definidos',
    } : null,
    encaminhamentoFinanceiroAudit: result.dadosCompletos ? {
      ...auditBase,
      id: `encaminhamento_financeiro_${hiringId}`,
      acao: 'ENCAMINHADO_FINANCEIRO_HEADHUNTER',
      descricao: 'Encaminhado para Financeiro / Headhunter',
    } : null,
  };
}
