import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  updateDoc,
  deleteDoc, 
  query, 
  where 
} from '../../firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  sanitizeFirestoreData, 
  safeFirestoreRead, 
  safeFirestoreWrite, 
  OperationType 
} from '../../lib/firestoreUtils';
import { 
  HeadhunterReceita, 
  HeadhunterExpense, 
  HeadhunterCommission, 
  HeadhunterGarantia,
  RentabilidadeVaga,
  ReceitaStatus,
  CommissionStatus,
  GarantiaStatus
} from '../types';
import { billingStatusLabel, HeadhunterBillingStatus } from './contractBillingLinkService';
import { normalizeHeadhunterBillingStatus } from './headhunterFinanceUtils';

const COLLECTIONS = {
  RECEITAS: 'receitas',
  COBRANCAS: 'financeiro_cobrancas',
  DESPESAS: 'despesas',
  COMISSOES: 'comissoes',
  GARANTIAS: 'garantias',
  AUDIT: 'historicos_financeiros'
};

// In-memory caches for synchronous immediate access
let receitasCache: HeadhunterReceita[] = [];
let despesasCache: HeadhunterExpense[] = [];
let comissoesCache: HeadhunterCommission[] = [];
let garantiasCache: HeadhunterGarantia[] = [];

async function syncHiringFinancialStatus(receita: HeadhunterReceita, status: HeadhunterBillingStatus): Promise<void> {
  const contratacaoId = String((receita as any).contratacaoId || '').trim();
  const companyId = String(receita.companyId || receita.empresaId || '').trim();
  if (!contratacaoId || !companyId) return;
  const ref = doc(db, 'contratacoes', contratacaoId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Contratação vinculada à cobrança não encontrada.');
  const data = snap.data() as any;
  const hiringTenant = String(data.companyId || data.empresaId || '').trim();
  if (!hiringTenant || hiringTenant !== companyId) throw new Error('Cobrança e contratação pertencem a empresas diferentes.');
  await updateDoc(ref, sanitizeFirestoreData({
    statusFinanceiro: status,
    statusProcesso: status,
    statusEncaminhamento: status,
    financeiroId: receita.id,
    cobrancaId: receita.id,
    updatedAt: new Date().toISOString(),
  }));
}

// Sync function with Firestore
export async function syncHeadhunterFinanceWithFirestore(companyId: string): Promise<void> {
  if (!companyId) throw new Error('Não foi possível identificar a empresa do usuário.');
  const tenantQuery = (collectionName: string) =>
    query(collection(db, collectionName), where('empresaId', '==', companyId));
  const recRead = await safeFirestoreRead(
    async () => {
      const recSnap = await getDocs(tenantQuery(COLLECTIONS.RECEITAS));
      return recSnap.docs.map(d => ({ id: d.id, ...d.data() } as HeadhunterReceita));
    },
    OperationType.LIST,
    COLLECTIONS.RECEITAS,
    []
  );
  if (!recRead.success) throw new Error(`Falha ao consultar receitas: ${recRead.error?.error}`);
  const billingRead = await safeFirestoreRead(
    async () => {
      const billingSnap = await getDocs(tenantQuery(COLLECTIONS.COBRANCAS));
      return billingSnap.docs.map(d => {
        const data = d.data() as any;
        return {
          ...data,
          id: d.id,
          empresaId: data.empresaId || companyId,
          companyId: data.empresaId || companyId,
          clienteId: data.clienteId || '',
          clienteNome: data.clienteNome || '',
          vagaId: data.vagaId || data.jobId,
          candidatoId: data.candidatoId || data.candidateId,
          valorContratado: Number(data.valorContratado || data.feeValor || data.valor || 0),
          valorRecebido: Number(data.valorRecebido || 0),
          saldo: Number(data.saldo ?? data.valorContratado ?? data.feeValor ?? data.valor ?? 0),
          dataEmissao: data.dataEmissao || String(data.createdAt || '').slice(0, 10),
          dataVencimento: data.dataVencimento || '',
          formaPagamento: data.formaPagamento || '',
          situacao: data.situacao || 'Aguardando',
          criadoPor: data.criadoPor || '',
          criadoEm: data.criadoEm || String(data.createdAt || '').slice(0, 10),
          origemModulo: 'headhunter',
          origemTipo: 'contratacao',
          origemId: data.contratacaoId,
          status: normalizeHeadhunterBillingStatus(data.status),
          statusLabel: billingStatusLabel(data.status),
        } as HeadhunterReceita;
      });
    },
    OperationType.LIST,
    COLLECTIONS.COBRANCAS,
    []
  );
  if (!billingRead.success) throw new Error(`Falha ao consultar cobranças: ${billingRead.error?.error}`);
  const linkedIds = new Set(billingRead.data.map(item => item.contratacaoId).filter(Boolean));
  const extraReceitas = recRead.data.filter(item => !item.contratacaoId || !linkedIds.has(item.contratacaoId));
  receitasCache = [
    ...receitasCache.filter(item => item.empresaId !== companyId && item.companyId !== companyId),
    ...billingRead.data,
    ...extraReceitas,
  ];

  const despRead = await safeFirestoreRead(
    async () => {
      const despSnap = await getDocs(tenantQuery(COLLECTIONS.DESPESAS));
      return despSnap.docs.map(d => ({ id: d.id, ...d.data() } as HeadhunterExpense));
    },
    OperationType.LIST,
    COLLECTIONS.DESPESAS,
    []
  );
  if (!despRead.success) throw new Error(`Falha ao consultar despesas: ${despRead.error?.error}`);
  despesasCache = [...despesasCache.filter(item => item.empresaId !== companyId && item.companyId !== companyId), ...despRead.data];

  const comRead = await safeFirestoreRead(
    async () => {
      const comSnap = await getDocs(tenantQuery(COLLECTIONS.COMISSOES));
      return comSnap.docs.map(d => ({ id: d.id, ...d.data() } as HeadhunterCommission));
    },
    OperationType.LIST,
    COLLECTIONS.COMISSOES,
    []
  );
  if (!comRead.success) throw new Error(`Falha ao consultar comissões: ${comRead.error?.error}`);
  comissoesCache = [...comissoesCache.filter(item => item.empresaId !== companyId && item.companyId !== companyId), ...comRead.data];

  const garRead = await safeFirestoreRead(
    async () => {
      const garSnap = await getDocs(tenantQuery(COLLECTIONS.GARANTIAS));
      return garSnap.docs.map(d => ({ id: d.id, ...d.data() } as HeadhunterGarantia));
    },
    OperationType.LIST,
    COLLECTIONS.GARANTIAS,
    []
  );
  if (!garRead.success) throw new Error(`Falha ao consultar garantias: ${garRead.error?.error}`);
  garantiasCache = [...garantiasCache.filter(item => item.empresaId !== companyId && item.companyId !== companyId), ...garRead.data];
}

export class HeadhunterFinanceService {
  // RECEITAS
  static getReceitas(companyId?: string): HeadhunterReceita[] {
    return receitasCache.filter(r => !companyId || r.companyId === companyId || r.empresaId === companyId);
  }

  static async saveReceita(receita: HeadhunterReceita): Promise<HeadhunterReceita> {
    const companyId = receita.companyId || receita.empresaId;
    if (!companyId || companyId === '') {
      throw new Error("Não foi possível identificar a empresa do usuário.");
    }

    const isHiringBilling = receita.origemTipo === 'contratacao' || receita.id?.startsWith('cob_');
    const id = isHiringBilling && receita.contratacaoId ? `cob_${receita.contratacaoId}` : (receita.id || `rec-${Date.now()}`);
    const newReceita: HeadhunterReceita = {
      ...receita,
      id,
      companyId,
      empresaId: companyId,
      saldo: Math.max(0, (receita.valorContratado || 0) - (receita.valorRecebido || 0)),
      criadoEm: receita.criadoEm || new Date().toISOString().split('T')[0]
    };

    const res = await safeFirestoreWrite(
      async () => {
        const collectionName = isHiringBilling ? COLLECTIONS.COBRANCAS : COLLECTIONS.RECEITAS;
        await setDoc(doc(db, collectionName, id), sanitizeFirestoreData(newReceita), { merge: true });
        receitasCache = [newReceita, ...receitasCache.filter(r => r.id !== id)];
        return newReceita;
      },
      OperationType.WRITE,
      `${isHiringBilling ? COLLECTIONS.COBRANCAS : COLLECTIONS.RECEITAS}/${id}`
    );

    if (!res.success) {
      throw new Error(`Erro ao salvar receita no Firestore: ${res.error?.error}`);
    }

    return newReceita;
  }

  static async registrarPagamentoReceita(receitaId: string, valorPago: number, formaPagamento: string, dataPagamento: string, observacoes?: string): Promise<HeadhunterReceita | null> {
    const receita = receitasCache.find(r => r.id === receitaId);
    if (!receita) return null;
    if (!Number.isFinite(valorPago) || valorPago <= 0) throw new Error('Valor pago deve ser maior que zero.');
    if (!formaPagamento || !formaPagamento.trim()) throw new Error('Forma de pagamento é obrigatória.');
    if (!dataPagamento || Number.isNaN(new Date(dataPagamento).getTime())) throw new Error('Data de pagamento inválida.');
    const currentStatus = normalizeHeadhunterBillingStatus(receita.status || 'AGUARDANDO_COBRANCA');
    if (currentStatus !== 'FATURADO') throw new Error('A cobrança precisa estar FATURADA antes de registrar recebimento.');
    const saldoAtual = Number(receita.saldo ?? ((receita.valorContratado || 0) - (receita.valorRecebido || 0)));
    if (!Number.isFinite(saldoAtual) || saldoAtual <= 0) throw new Error('Cobrança não possui saldo em aberto.');
    if (valorPago > saldoAtual) throw new Error('Valor pago não pode superar o saldo da cobrança.');

    const novoValorRecebido = (receita.valorRecebido || 0) + valorPago;
    const novoSaldo = Math.max(0, receita.valorContratado - novoValorRecebido);
    const novaSituacao: ReceitaStatus = novoSaldo === 0 ? 'Recebida' : 'Parcialmente Recebida';

    const historicoAtual = [...(receita.historico || [])];
    historicoAtual.push({
      data: new Date().toISOString().split('T')[0],
      alteracao: `Baixa de R$ ${valorPago.toLocaleString('pt-BR')} via ${formaPagamento}`,
      usuario: 'Gestor Financeiro',
      valorAnterior: receita.valorRecebido,
      valorNovo: novoValorRecebido,
      motivo: observacoes || 'Recebimento de cliente'
    });

    const receitaAtualizada: HeadhunterReceita = {
      ...receita,
      valorRecebido: novoValorRecebido,
      saldo: novoSaldo,
      situacao: novaSituacao,
      formaPagamento: formaPagamento as any,
      dataRecebimento: dataPagamento,
      historico: historicoAtual,
      status: novoSaldo === 0 ? 'RECEBIDO' : receita.status,
      statusLabel: novoSaldo === 0 ? billingStatusLabel('RECEBIDO') : (receita as any).statusLabel,
    };

    const saved = await this.saveReceita(receitaAtualizada);
    if (novoSaldo === 0) await syncHiringFinancialStatus(saved, 'RECEBIDO');
    return saved;
  }

  static async atualizarStatusReceita(receitaId: string, target: HeadhunterBillingStatus): Promise<HeadhunterReceita | null> {
    const receita = receitasCache.find(r => r.id === receitaId);
    if (!receita) return null;
    const current = normalizeHeadhunterBillingStatus(receita.status || 'AGUARDANDO_COBRANCA');
    const allowed: Record<string, HeadhunterBillingStatus[]> = {
      AGUARDANDO_COBRANCA: ['FATURADO'],
      FATURADO: ['RECEBIDO'],
      RECEBIDO: ['FINALIZADO'],
    };
    if (!(allowed[current] || []).includes(target)) {
      throw new Error('Transição de status financeiro inválida.');
    }
    const saldo = Number(receita.saldo ?? ((receita.valorContratado || 0) - (receita.valorRecebido || 0)));
    if ((target === 'RECEBIDO' || target === 'FINALIZADO') && (!Number.isFinite(saldo) || saldo > 0)) {
      throw new Error('Não é possível marcar a cobrança como recebida/finalizada enquanto houver saldo em aberto.');
    }
    const now = new Date().toISOString();
    const historico = [...((receita as any).historicoStatus || []), {
      id: `hist-${Date.now()}`,
      dataHora: now,
      statusAnterior: current,
      novoStatus: target,
      usuario: 'Financeiro',
      descricao: `Cobrança alterada para ${billingStatusLabel(target)}.`,
    }];
    const saved = await this.saveReceita({
      ...receita,
      status: target,
      statusLabel: billingStatusLabel(target),
      situacao: target === 'RECEBIDO' || target === 'FINALIZADO' ? 'Recebida' : receita.situacao,
      historicoStatus: historico,
      atualizadoEm: now.slice(0, 10),
    } as HeadhunterReceita);
    await syncHiringFinancialStatus(saved, target);
    return saved;
  }

  static async estornarReceita(receitaId: string, motivo: string): Promise<HeadhunterReceita | null> {
    const receita = receitasCache.find(r => r.id === receitaId);
    if (!receita) return null;
    if (!motivo || !motivo.trim()) throw new Error('Motivo do estorno é obrigatório.');
    const currentStatus = normalizeHeadhunterBillingStatus(receita.status || 'AGUARDANDO_COBRANCA');
    if (currentStatus !== 'RECEBIDO' && currentStatus !== 'FINALIZADO') throw new Error('Somente cobrança recebida/finalizada pode ser estornada.');
    if (!Number.isFinite(Number(receita.valorRecebido)) || Number(receita.valorRecebido) <= 0) throw new Error('Não existe recebimento para estornar.');

    const historicoAtual = [...(receita.historico || [])];
    historicoAtual.push({
      data: new Date().toISOString().split('T')[0],
      alteracao: 'Estorno total do lançamento de receita',
      usuario: 'Gestor Financeiro',
      valorAnterior: receita.valorRecebido,
      valorNovo: 0,
      motivo
    });

    const receitaEstornada: HeadhunterReceita = {
      ...receita,
      situacao: 'Estornada',
      status: 'FATURADO',
      statusLabel: billingStatusLabel('FATURADO'),
      valorRecebido: 0,
      saldo: receita.valorContratado,
      historico: historicoAtual
    };

    const saved = await this.saveReceita(receitaEstornada);
    await syncHiringFinancialStatus(saved, 'FATURADO');
    return saved;
  }

  // DESPESAS
  static getDespesas(companyId?: string): HeadhunterExpense[] {
    return despesasCache.filter(d => !companyId || d.companyId === companyId || d.empresaId === companyId);
  }

  static async saveDespesa(expense: HeadhunterExpense): Promise<HeadhunterExpense> {
    const companyId = expense.companyId || expense.empresaId;
    if (!companyId || companyId === '') {
      throw new Error("Não foi possível identificar a empresa do usuário.");
    }

    const id = expense.id || `exp-${Date.now()}`;
    const newExpense: HeadhunterExpense = {
      ...expense,
      id,
      companyId,
      empresaId: companyId,
      criadoEm: expense.criadoEm || new Date().toISOString().split('T')[0]
    };

    const res = await safeFirestoreWrite(
      async () => {
        await setDoc(doc(db, COLLECTIONS.DESPESAS, id), sanitizeFirestoreData(newExpense), { merge: true });
        despesasCache = [newExpense, ...despesasCache.filter(d => d.id !== id)];
        return newExpense;
      },
      OperationType.WRITE,
      `${COLLECTIONS.DESPESAS}/${id}`
    );

    if (!res.success) {
      throw new Error(`Erro ao salvar despesa no Firestore: ${res.error?.error}`);
    }

    return newExpense;
  }

  // COMISSÕES
  static getComissoes(companyId?: string): HeadhunterCommission[] {
    return comissoesCache.filter(c => !companyId || c.companyId === companyId || c.empresaId === companyId);
  }

  static async saveComissao(commission: HeadhunterCommission): Promise<HeadhunterCommission> {
    const companyId = commission.companyId || commission.empresaId;
    if (!companyId || companyId === '') {
      throw new Error("Não foi possível identificar a empresa do usuário.");
    }

    const id = commission.id || `com-${Date.now()}`;
    const newCom: HeadhunterCommission = {
      ...commission,
      id,
      companyId,
      empresaId: companyId,
      criadoEm: commission.criadoEm || new Date().toISOString().split('T')[0]
    };

    const res = await safeFirestoreWrite(
      async () => {
        await setDoc(doc(db, COLLECTIONS.COMISSOES, id), sanitizeFirestoreData(newCom), { merge: true });
        comissoesCache = [newCom, ...comissoesCache.filter(c => c.id !== id)];
        return newCom;
      },
      OperationType.WRITE,
      `${COLLECTIONS.COMISSOES}/${id}`
    );

    if (!res.success) {
      throw new Error(`Erro ao salvar comissão no Firestore: ${res.error?.error}`);
    }

    return newCom;
  }

  static async liberarComissao(commissionId: string, observacao?: string): Promise<HeadhunterCommission | null> {
    const com = comissoesCache.find(c => c.id === commissionId);
    if (!com) return null;

    const hist = com.historico || [];
    hist.push({ data: new Date().toISOString().split('T')[0], acao: 'Comissão liberada para pagamento', usuario: 'Gestor Financeiro' });

    const updated: HeadhunterCommission = {
      ...com,
      situacao: 'Liberada',
      dataLiberacao: new Date().toISOString().split('T')[0],
      observacoes: observacao ? `${com.observacoes || ''} [Liberada: ${observacao}]` : com.observacoes,
      historico: hist
    };

    return this.saveComissao(updated);
  }

  static async registrarPagamentoComissao(commissionId: string, valorPago: number, formaPagamento: string, dataPagamento: string, observacoes?: string): Promise<HeadhunterCommission | null> {
    const com = comissoesCache.find(c => c.id === commissionId);
    if (!com) return null;
    if (!Number.isFinite(valorPago) || valorPago <= 0) throw new Error('Valor da comissão deve ser maior que zero.');
    if (!formaPagamento || !formaPagamento.trim()) throw new Error('Forma de pagamento da comissão é obrigatória.');
    if (!dataPagamento || Number.isNaN(new Date(dataPagamento).getTime())) throw new Error('Data de pagamento da comissão é inválida.');
    if (com.situacao !== 'Liberada') throw new Error('A comissão precisa estar liberada antes do pagamento.');
    const saldoComissao = Number(com.valorComissao || 0) - Number(com.valorPago || 0);
    if (!Number.isFinite(saldoComissao) || saldoComissao <= 0) throw new Error('Comissão não possui saldo em aberto.');
    if (valorPago > saldoComissao) throw new Error('Pagamento da comissão não pode superar o saldo em aberto.');

    const totalPago = (com.valorPago || 0) + valorPago;
    const novaSituacao: CommissionStatus = totalPago >= com.valorComissao ? 'Paga' : 'Liberada';

    const hist = com.historico || [];
    hist.push({ data: new Date().toISOString().split('T')[0], acao: `Pagamento de R$ ${valorPago.toLocaleString('pt-BR')} via ${formaPagamento}`, usuario: 'Gestor Financeiro' });

    const updated: HeadhunterCommission = {
      ...com,
      valorPago: totalPago,
      situacao: novaSituacao,
      dataPagamento: dataPagamento,
      formaPagamento,
      observacoes: observacoes ? `${com.observacoes || ''} [Pagamento: ${observacoes}]` : com.observacoes,
      historico: hist
    };

    return this.saveComissao(updated);
  }

  // GARANTIAS
  static getGarantias(companyId?: string): HeadhunterGarantia[] {
    const hoje = new Date();

    return garantiasCache
      .filter(g => !companyId || g.companyId === companyId || g.empresaId === companyId)
      .map(g => {
        const dataFim = new Date(g.dataFinal);
        const diffMs = dataFim.getTime() - hoje.getTime();
        const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        let situacao: GarantiaStatus = g.situacao;
        if (situacao === 'Ativa' && diasRestantes <= 15 && diasRestantes > 0) {
          situacao = 'Próxima do Vencimento';
        } else if (situacao === 'Ativa' && diasRestantes <= 0) {
          situacao = 'Encerrada';
        }

        return { ...g, situacao, diasRestantes };
      });
  }

  static async saveGarantia(garantia: HeadhunterGarantia): Promise<HeadhunterGarantia> {
    const companyId = garantia.companyId || garantia.empresaId;
    if (!companyId || companyId === '') {
      throw new Error("Não foi possível identificar a empresa do usuário.");
    }

    if (!garantia.dataInicial || Number.isNaN(new Date(garantia.dataInicial).getTime())) throw new Error('Data inicial da garantia é obrigatória e deve ser válida.');
    if (!garantia.dataFinal || Number.isNaN(new Date(garantia.dataFinal).getTime())) throw new Error('Data final da garantia é obrigatória e deve ser válida.');
    if (new Date(garantia.dataFinal).getTime() < new Date(garantia.dataInicial).getTime()) throw new Error('Data final da garantia não pode ser anterior à data inicial.');
    if (!garantia.contratacaoId || !garantia.candidatoId || !garantia.vagaId) throw new Error('Garantia deve estar vinculada à contratação, candidato e vaga.');

    const id = garantia.id || `gar-${Date.now()}`;
    const newGar: HeadhunterGarantia = {
      ...garantia,
      id,
      companyId,
      empresaId: companyId,
      criadoEm: garantia.criadoEm || new Date().toISOString().split('T')[0]
    };

    try {
      await setDoc(doc(db, COLLECTIONS.GARANTIAS, id), sanitizeFirestoreData(newGar), { merge: true });
      garantiasCache = [newGar, ...garantiasCache.filter(g => g.id !== id)];
      return newGar;
    } catch (err) {
      console.error('[HEADHUNTER] Erro real ao salvar garantia:', err);
      throw err;
    }
  }

  // RENTABILIDADE CALCULATOR
  static calculateRentabilidadeVagas(vagas: any[], companyId?: string): RentabilidadeVaga[] {
    const receitas = this.getReceitas(companyId);
    const despesas = this.getDespesas(companyId).filter(d => d.tipoDespesa === 'vaga');
    const comissoes = this.getComissoes(companyId);

    return vagas.map(vaga => {
      const recs = receitas.filter(r => r.vagaId === vaga.id && r.situacao !== 'Cancelada' && r.situacao !== 'Estornada');
      const valorContratado = recs.reduce((acc, r) => acc + (r.valorContratado || 0), 0) || vaga.valorNegociado || vaga.valorVaga || 0;
      const valorRecebido = recs.reduce((acc, r) => acc + (r.valorRecebido || 0), 0);

      const desps = despesas.filter(d => d.vagaId === vaga.id && d.situacao !== 'Cancelado');
      const totalDespesasVaga = desps.reduce((acc, d) => acc + d.valor, 0);

      const coms = comissoes.filter(c => c.vagaId === vaga.id && c.situacao !== 'Cancelada');
      const totalComissao = coms.reduce((acc, c) => acc + c.valorComissao, 0);

      const lucroLiquido = valorContratado - totalDespesasVaga - totalComissao;
      const margemPercentual = valorContratado > 0 ? (lucroLiquido / valorContratado) * 100 : 0;

      return {
        vagaId: vaga.id,
        vagaTitulo: vaga.titulo || vaga.cargo || 'Vaga Sem Título',
        clienteId: vaga.clienteId || '',
        clienteNome: vaga.clienteNome || 'Cliente Não Informado',
        valorContratado,
        valorRecebido,
        despesasVaga: totalDespesasVaga,
        comissao: totalComissao,
        outrosCustos: 0,
        lucroLiquido,
        margemPercentual
      };
    });
  }

  // FINALIZATION AUTOMATION
  static async finalizarVagaComercial(data: {
    vaga: any;
    candidatoContratado: any;
    dataContratacao: string;
    dataPrevistaAdmissao: string;
    salarioFinal: number;
    valorFinalCobrado: number;
    formaCobranca: string;
    dataPrevistaRecebimento: string;
    beneficiarioComissao: string;
    tipoComissao: any;
    percentualComissao?: number;
    valorFixoComissao?: number;
    prazoGarantiaDias: number;
    numeroNotaFiscal?: string;
    observacoes?: string;
  }): Promise<{
    receita: HeadhunterReceita;
    comissao: HeadhunterCommission;
    garantia: HeadhunterGarantia;
  }> {
    const { vaga, candidatoContratado, dataContratacao, valorFinalCobrado, formaCobranca, dataPrevistaRecebimento, beneficiarioComissao, tipoComissao, percentualComissao, valorFixoComissao, prazoGarantiaDias, numeroNotaFiscal, observacoes } = data;
    const resolvedCompanyId = String(vaga.companyId || vaga.empresaId || '').trim();
    if (!resolvedCompanyId) throw new Error('Não foi possível identificar a empresa do usuário.');
    const candidateId = String(candidatoContratado.id || candidatoContratado.candidatoId || '').trim();
    const candidateName = String(candidatoContratado.nome || candidatoContratado.name || '').trim();
    const clientId = String(vaga.clienteId || '').trim();
    const clientName = String(vaga.clienteNome || '').trim();
    const amount = Number(valorFinalCobrado);
    const guaranteeDays = Number(prazoGarantiaDias);
    if (!vaga.id || !candidateId || !candidateName) throw new Error('Vaga e candidato reais são obrigatórios para finalizar o Headhunter.');
    if (!clientId || !clientName) throw new Error('Cliente da vaga é obrigatório para finalizar o Headhunter.');
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Valor final cobrado deve ser maior que zero.');
    if (!dataPrevistaRecebimento) throw new Error('Data prevista de recebimento é obrigatória.');
    if (!Number.isFinite(guaranteeDays) || guaranteeDays < 0) throw new Error('Prazo de garantia deve ser informado corretamente.');
    const contratacaoId = `hir__${String(vaga.id).replace(/[^a-zA-Z0-9_-]/g, '_')}__${candidateId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    // 1. Calculate Commission
    let valorComissao = 0;
    if (tipoComissao === 'Percentual' && percentualComissao) {
      valorComissao = (valorFinalCobrado * percentualComissao) / 100;
    } else if (tipoComissao === 'Valor Fixo' && valorFixoComissao) {
      valorComissao = valorFixoComissao;
    } else if (tipoComissao === 'Personalizado' && valorFixoComissao) {
      valorComissao = valorFixoComissao;
    }

    // 2. Create Revenue Record
    const newReceita: HeadhunterReceita = {
      id: `rec__${contratacaoId}`,
      companyId: resolvedCompanyId,
      empresaId: resolvedCompanyId,
      criadoPor: 'Headhunter',
      criadoEm: new Date().toISOString().split('T')[0],
      status: 'AGUARDANDO_COBRANCA',
      clienteId: clientId,
      clienteNome: clientName,
      vagaId: vaga.id,
      vagaTitulo: vaga.titulo || vaga.cargo,
      contratacaoId,
      candidatoNome: candidateName,
      valorContratado: amount,
      valorRecebido: 0,
      saldo: valorFinalCobrado,
      dataEmissao: new Date().toISOString().split('T')[0],
      dataVencimento: dataPrevistaRecebimento,
      formaPagamento: (formaCobranca.includes('PIX') ? 'PIX' : formaCobranca.includes('Boleto') ? 'Boleto' : 'Nota Fiscal') as any,
      numeroNotaFiscal,
      observacoes,
      situacao: 'Aguardando'
    };

    // 3. Create Commission Record
    const newCommission: HeadhunterCommission = {
      id: `com__${contratacaoId}`,
      companyId: resolvedCompanyId,
      empresaId: resolvedCompanyId,
      criadoPor: 'Headhunter',
      criadoEm: new Date().toISOString().split('T')[0],
      status: 'Ativo',
      beneficiarioNome: beneficiarioComissao || '',
      clienteId: clientId,
      clienteNome: clientName,
      vagaId: vaga.id,
      vagaTitulo: vaga.titulo || vaga.cargo,
      consultorNome: beneficiarioComissao || vaga.consultorResponsavel || '',
      tipoComissao: tipoComissao || 'Percentual',
      valorRecebidoVaga: amount,
      percentual: percentualComissao,
      valorFixo: valorFixoComissao,
      valorComissao,
      valorPago: 0,
      dataPrevista: dataPrevistaRecebimento,
      situacao: 'Prevista',
      regraLiberacao: 'cliente_pagou',
      observacoes: `Comissão gerada na contratação de ${candidateName}`
    };

    // 4. Create Guarantee Record
    if (!dataContratacao) throw new Error('Data de contratação é obrigatória para iniciar a garantia.');
    const dataInicial = dataContratacao;
    const dataFimObj = new Date(dataInicial);
    dataFimObj.setDate(dataFimObj.getDate() + guaranteeDays);
    const dataFinal = dataFimObj.toISOString().split('T')[0];

    const newGarantia: HeadhunterGarantia = {
      id: `gar__${contratacaoId}`,
      companyId: resolvedCompanyId,
      empresaId: resolvedCompanyId,
      criadoPor: 'Headhunter',
      criadoEm: new Date().toISOString().split('T')[0],
      status: 'Ativo',
      clienteId: clientId,
      clienteNome: clientName,
      vagaId: vaga.id,
      vagaTitulo: vaga.titulo || vaga.cargo,
      candidatoId: candidateId,
      candidatoNome: candidateName,
      contratacaoId,
      dataInicial,
      dataFinal,
      prazoDias: guaranteeDays,
      situacao: 'Ativa',
      observacoes: `Garantia contratual de ${guaranteeDays} dias`
    };

    const savedReceita = await this.saveReceita(newReceita);
    const savedComissao = await this.saveComissao(newCommission);
    const savedGarantia = await this.saveGarantia(newGarantia);

    return {
      receita: savedReceita,
      comissao: savedComissao,
      garantia: savedGarantia
    };
  }
}
