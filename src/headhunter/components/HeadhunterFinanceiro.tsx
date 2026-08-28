import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  FileText, 
  Receipt, 
  CreditCard, 
  PieChart, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  Building2,
  Briefcase,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  RotateCcw,
  History,
  FileSpreadsheet,
  AlertTriangle,
  ChevronRight,
  Eye,
  Check,
  X,
  Pencil
} from 'lucide-react';
import { 
  HeadhunterClient,
  HeadhunterContract,
  HeadhunterProposal,
  HeadhunterReceita, 
  HeadhunterExpense, 
  HeadhunterCommission, 
  HeadhunterGarantia,
  TipoReceitaHeadhunter,
  RentabilidadeVaga,
  ReceitaStatus,
  CommissionStatus,
  GarantiaStatus,
  ExpenseCategory
} from '../types';
import { HeadhunterFinanceService, syncHeadhunterFinanceWithFirestore } from '../services/headhunterFinanceService';
import { billingStatusLabel } from '../services/contractBillingLinkService';
import { buildExpenseLink, isExpenseLinkedToJob } from '../services/headhunterFinanceUtils';

interface HeadhunterFinanceiroProps {
  companyId: string;
  financial?: any[];
  expenses?: any[];
  clients?: HeadhunterClient[];
  jobs?: any[];
  candidates?: any[];
  hirings?: any[];
  contracts?: HeadhunterContract[];
  proposals?: HeadhunterProposal[];
  selectedFinancialId?: string | null;
  onAddFinanceItem?: (item: any) => void;
  onOpenAiModal?: (type: string, data?: any) => void;
}

export const HeadhunterFinanceiro: React.FC<HeadhunterFinanceiroProps> = ({
  companyId,
  clients = [],
  jobs = [],
  candidates = [],
  hirings = [],
  contracts = [],
  proposals = [],
  selectedFinancialId,
  onOpenAiModal
}) => {
  const [activeTab, setActiveTab] = useState<
    'visao-geral' | 'receitas' | 'despesas' | 'comissoes' | 'garantias' | 'rentabilidade'
  >('visao-geral');

  // Unified available entities fallback to mock data
  const availableClients = useMemo(() => {
    return clients || [];
  }, [clients]);

  const availableJobs = useMemo(() => {
    return jobs || [];
  }, [jobs]);

  const availableCandidates = useMemo(() => {
    return candidates || [];
  }, [candidates]);

  const availableHirings = useMemo(() => {
    return hirings || [];
  }, [hirings]);

  const availableContracts = useMemo(() => {
    return contracts || [];
  }, [contracts]);

  const availableProposals = useMemo(() => {
    return proposals || [];
  }, [proposals]);

  // Local state initialized from Service
  const [receitas, setReceitas] = useState<HeadhunterReceita[]>([]);
  const [despesas, setDespesas] = useState<HeadhunterExpense[]>([]);
  const [comissoes, setComissoes] = useState<HeadhunterCommission[]>([]);
  const [garantias, setGarantias] = useState<HeadhunterGarantia[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [filterClient, setFilterClient] = useState('');
  const [filterVaga, setFilterVaga] = useState('');
  const [filterCandidato, setFilterCandidato] = useState('');

  // Modals state
  const [showReceitaModal, setShowReceitaModal] = useState(false);
  const [showDespesaModal, setShowDespesaModal] = useState(false);
  const [showBaixaModal, setShowBaixaModal] = useState<HeadhunterReceita | null>(null);
  const [showEstornoModal, setShowEstornoModal] = useState<HeadhunterReceita | null>(null);
  const [showComissaoPagamentoModal, setShowComissaoPagamentoModal] = useState<HeadhunterCommission | null>(null);
  const [showHistoricoModal, setShowHistoricoModal] = useState<any | null>(null);

  // Form states - Receita Form (linked fields)
  const [recClienteId, setRecClienteId] = useState('');
  const [recClienteNome, setRecClienteNome] = useState('');
  const [recVagaId, setRecVagaId] = useState('');
  const [recVagaCodigo, setRecVagaCodigo] = useState('');
  const [recVagaTitulo, setRecVagaTitulo] = useState('');
  const [recCandidatoId, setRecCandidatoId] = useState('');
  const [recCandidatoNome, setRecCandidatoNome] = useState('');
  const [recContratacaoId, setRecContratacaoId] = useState('');
  const [recPropostaId, setRecPropostaId] = useState('');
  const [recContratoId, setRecContratoId] = useState('');

  const [recTipoReceita, setRecTipoReceita] = useState<TipoReceitaHeadhunter>('Principal');
  const [recValor, setRecValor] = useState<number>(0);
  const [recVencimento, setRecVencimento] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [recForma, setRecForma] = useState<'PIX' | 'Boleto' | 'Transferência' | 'Cartão' | 'Nota Fiscal' | 'Outro'>('Boleto');
  const [recNotaFiscal, setRecNotaFiscal] = useState('');
  const [recObs, setRecObs] = useState('');
  const [recJustificativa, setRecJustificativa] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Cascading choices
  const filteredClientJobs = useMemo(() => {
    if (!recClienteId) return [];
    return availableJobs.filter(j => j.clienteId === recClienteId);
  }, [availableJobs, recClienteId]);

  const filteredVagaHirings = useMemo(() => {
    if (!recVagaId) return [];
    return availableHirings.filter(h => h.vagaId === recVagaId);
  }, [availableHirings, recVagaId]);

  const checkDuplicate = (vagaId: string, contratacaoId: string, tipo: TipoReceitaHeadhunter) => {
    if (!vagaId || !contratacaoId) {
      setDuplicateWarning(null);
      return;
    }
    const existingMain = receitas.find(r => 
      (r.empresaId === companyId || r.companyId === companyId) &&
      r.vagaId === vagaId && 
      r.contratacaoId === contratacaoId && 
      (r.tipoReceita === 'Principal' || !r.tipoReceita) &&
      r.situacao !== 'Estornada'
    );

    if (existingMain) {
      const msg = `Já existe uma receita principal vinculada a esta contratação (NF: ${existingMain.numeroNotaFiscal || 'Pendente'}, Valor: R$ ${existingMain.valorContratado.toLocaleString('pt-BR')}). Abra o lançamento existente para editar, parcelar ou registrar recebimento.`;
      setDuplicateWarning(msg);
    } else {
      setDuplicateWarning(null);
    }
  };

  const applyAutofill = (vg: any, h: any, clienteId: string) => {
    const cli = availableClients.find(c => c.id === clienteId);
    const contract = availableContracts.find(c => c.clienteId === clienteId || c.vagaCriadaId === vg?.id);
    const proposal = availableProposals.find(p => p.clienteId === clienteId);

    if (vg?.titulo || h?.vagaTitulo) {
      setRecVagaTitulo(vg?.titulo || h?.vagaTitulo);
    }

    const val = Number(h?.receitaGerada || vg?.valorCobrado || contract?.valorContrato || proposal?.valor || 0);
    setRecValor(val);

    if (cli?.formaCobranca) {
      if (cli.formaCobranca.toLowerCase().includes('pix')) setRecForma('PIX');
      else setRecForma('Boleto');
    }

    if (contract) setRecContratoId(contract.id);
    if (proposal) setRecPropostaId(proposal.id);
  };

  const handleClientChange = (clienteId: string) => {
    const cli = availableClients.find(c => c.id === clienteId);
    setRecClienteId(clienteId);
    setRecClienteNome(cli ? (cli.nomeFantasia || cli.razaoSocial) : '');
    setRecVagaId('');
    setRecVagaCodigo('');
    setRecVagaTitulo('');
    setRecCandidatoId('');
    setRecCandidatoNome('');
    setRecContratacaoId('');
    setRecPropostaId('');
    setRecContratoId('');
    setDuplicateWarning(null);
    setFormError(null);
  };

  const handleVagaChange = (vagaId: string) => {
    const vg = availableJobs.find(j => j.id === vagaId);
    setRecVagaId(vagaId);
    setRecVagaCodigo(vg ? (vg.codigo || vg.id.toUpperCase()) : '');
    setRecVagaTitulo(vg ? (vg.cargo || vg.titulo) : '');

    setRecCandidatoId('');
    setRecCandidatoNome('');
    setRecContratacaoId('');

    const matchingHirings = availableHirings.filter(h => h.vagaId === vagaId);
    if (matchingHirings.length === 1) {
      const h = matchingHirings[0];
      setRecContratacaoId(h.id);
      setRecCandidatoId(h.candidatoId);
      setRecCandidatoNome(h.candidatoNome);
      applyAutofill(vg, h, recClienteId);
      checkDuplicate(vagaId, h.id, recTipoReceita);
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleContratacaoChange = (contratacaoId: string) => {
    const h = availableHirings.find(item => item.id === contratacaoId);
    const vg = availableJobs.find(j => j.id === recVagaId);
    if (h) {
      setRecContratacaoId(h.id);
      setRecCandidatoId(h.candidatoId);
      setRecCandidatoNome(h.candidatoNome);
      applyAutofill(vg, h, recClienteId);
      checkDuplicate(recVagaId, h.id, recTipoReceita);
    } else {
      setRecContratacaoId('');
      setRecCandidatoId('');
      setRecCandidatoNome('');
      setDuplicateWarning(null);
    }
  };

  const handleTipoReceitaChange = (tipo: TipoReceitaHeadhunter) => {
    setRecTipoReceita(tipo);
    checkDuplicate(recVagaId, recContratacaoId, tipo);
  };

  // Baixa Form
  const [baixaValor, setBaixaValor] = useState(0);
  const [baixaForma, setBaixaForma] = useState('PIX');
  const [baixaData, setBaixaData] = useState(new Date().toISOString().split('T')[0]);
  const [baixaObs, setBaixaObs] = useState('');

  // Estorno Form
  const [estornoMotivo, setEstornoMotivo] = useState('');

  // Despesa Form
  const [despTipo, setDespTipo] = useState<'vaga' | 'geral'>('vaga');
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [despClienteId, setDespClienteId] = useState('');
  const [despClienteNome, setDespClienteNome] = useState('');
  const [despVagaId, setDespVagaId] = useState('');
  const [despVagaTitulo, setDespVagaTitulo] = useState('');
  const [despCategoria, setDespCategoria] = useState<ExpenseCategory>('Deslocamento / Uber');
  const [despDescricao, setDespDescricao] = useState('');
  const [despValor, setDespValor] = useState(150);
  const [despData, setDespData] = useState(new Date().toISOString().split('T')[0]);
  const [despResponsavel, setDespResponsavel] = useState('Consultor Responsável');

  const expenseJobs = useMemo(() => {
    if (!despClienteId) return [];

    const selectedClient = availableClients.find(client => client.id === despClienteId);
    const selectedClientNames = [
      selectedClient?.nomeFantasia,
      selectedClient?.razaoSocial,
      (selectedClient as any)?.name,
    ]
      .filter(Boolean)
      .map(value => String(value).trim().toLowerCase());

    const linkedJobs = availableJobs.filter(job => {
      const linkedClientId = String((job as any).clienteId || (job as any).clientId || '').trim();
      if (linkedClientId && linkedClientId === despClienteId) return true;

      const linkedClientName = String(
        (job as any).clienteNome ||
        (job as any).clientName ||
        (job as any).nomeCliente ||
        ''
      ).trim().toLowerCase();

      return Boolean(linkedClientName && selectedClientNames.includes(linkedClientName));
    });

    // Compatibilidade: vagas antigas podem não ter clienteId gravado. Como
    // availableJobs já pertence ao tenant atual, mantemos a opção de vínculo
    // exibindo as vagas da empresa quando não existe correspondência explícita.
    return linkedJobs.length > 0 ? linkedJobs : availableJobs;
  }, [availableJobs, availableClients, despClienteId]);

  const resetExpenseForm = () => {
    setEditingExpenseId(null);
    setDespTipo('vaga');
    setDespClienteId('');
    setDespClienteNome('');
    setDespVagaId('');
    setDespVagaTitulo('');
    setDespCategoria('Deslocamento / Uber');
    setDespDescricao('');
    setDespValor(150);
    setDespData(new Date().toISOString().split('T')[0]);
    setFormError(null);
  };

  const openNewExpense = () => {
    resetExpenseForm();
    setShowDespesaModal(true);
  };

  const openEditExpense = (expense: HeadhunterExpense) => {
    setEditingExpenseId(expense.id);
    setDespTipo(expense.tipoDespesa || 'geral');
    setDespClienteId(expense.clienteId || '');
    setDespClienteNome(expense.clienteNome || '');
    setDespVagaId(expense.vagaId || '');
    setDespVagaTitulo(expense.vagaTitulo || '');
    setDespCategoria(expense.categoria);
    setDespDescricao(expense.descricao || '');
    setDespValor(Number(expense.valor || 0));
    setDespData(expense.data || (expense as any).dataLancamento || new Date().toISOString().split('T')[0]);
    setDespResponsavel(expense.responsavel || expense.consultorNome || 'Consultor Responsável');
    setFormError(null);
    setShowDespesaModal(true);
  };

  // Comissão Pagamento Form
  const [comValorPago, setComValorPago] = useState(0);
  const [comForma, setComForma] = useState('PIX');
  const [comData, setComData] = useState(new Date().toISOString().split('T')[0]);
  const [comObs, setComObs] = useState('');

  const [highlightedFinancialId, setHighlightedFinancialId] = useState<string | null>(null);

  // Refresh data function
  const reloadData = () => {
    setReceitas(HeadhunterFinanceService.getReceitas(companyId));
    setDespesas(HeadhunterFinanceService.getDespesas(companyId));
    setComissoes(HeadhunterFinanceService.getComissoes(companyId));
    setGarantias(HeadhunterFinanceService.getGarantias(companyId));
  };

  useEffect(() => {
    let active = true;
    if (!companyId) return;
    syncHeadhunterFinanceWithFirestore(companyId)
      .then(() => { if (active) reloadData(); })
      .catch(error => {
        console.error('[HEADHUNTER FINANCEIRO] Falha ao carregar dados', { companyId, code: (error as any)?.code || null });
        if (active) setFormError('Não foi possível carregar as cobranças desta empresa.');
      });
    return () => { active = false; };
  }, [companyId]);

  // Auto-locate and highlight selected financial record
  useEffect(() => {
    const targetId = selectedFinancialId || localStorage.getItem('selectedFinancialId') || localStorage.getItem('selectedBillingId');
    if (!targetId) return;

    setActiveTab('receitas');
    setHighlightedFinancialId(targetId);

    const match = receitas.find(r => 
      r.id === targetId || 
      r.id === `cob_${targetId}` ||
      (r as any).contratacaoId === targetId ||
      (r as any).cobrancaId === targetId ||
      (r as any).candidateId === targetId ||
      (r as any).candidatoId === targetId
    );

    if (match) {
      setShowHistoricoModal(match);
    }
  }, [selectedFinancialId, receitas]);

  const resetReceitaForm = () => {
    setRecClienteId('');
    setRecClienteNome('');
    setRecVagaId('');
    setRecVagaCodigo('');
    setRecVagaTitulo('');
    setRecCandidatoId('');
    setRecCandidatoNome('');
    setRecContratacaoId('');
    setRecPropostaId('');
    setRecContratoId('');
    setRecTipoReceita('Principal');
    setRecValor(15000);
    setRecNotaFiscal('');
    setRecObs('');
    setRecJustificativa('');
    setDuplicateWarning(null);
    setFormError(null);
  };

  // Handlers
  const handleCreateReceita = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!recClienteId) {
      setFormError('Selecione o Cliente Corporativo.');
      return;
    }
    if (!recVagaId) {
      setFormError('Selecione a vaga Headhunter vinculada ao cliente.');
      return;
    }
    if (!recContratacaoId) {
      setFormError('Selecione o candidato contratado.');
      return;
    }
    if (!recValor || recValor <= 0) {
      setFormError('Informe um valor de receita válido.');
      return;
    }
    if (!recVencimento) {
      setFormError('Informe a data de vencimento.');
      return;
    }

    if (duplicateWarning && recTipoReceita === 'Principal') {
      setFormError('Não é possível criar duplicata de Receita Principal para a mesma contratação. Selecione um tipo extraordinário ou altere o lançamento existente.');
      return;
    }

    if (recTipoReceita !== 'Principal' && !recJustificativa.trim() && !recObs.trim()) {
      setFormError('Para lançamentos extraordinários (ex: cobrança complementar, multa, taxa adicional), preencha obrigatoriamente a Justificativa / Observações.');
      return;
    }

    const newReceita: HeadhunterReceita = {
      id: recTipoReceita === 'Principal' ? `cob_${recContratacaoId}` : `rec-${Date.now()}`,
      empresaId: companyId,
      companyId,
      clienteId: recClienteId,
      clienteNome: recClienteNome,
      vagaId: recVagaId,
      vagaCodigo: recVagaCodigo || recVagaId,
      vagaTitulo: recVagaTitulo,
      candidatoId: recCandidatoId,
      candidatoNome: recCandidatoNome,
      contratacaoId: recContratacaoId,
      propostaId: recPropostaId || undefined,
      contratoId: recContratoId || undefined,
      origemModulo: 'headhunter',
      origemTipo: 'contratacao',
      origemId: recContratacaoId,
      tipoReceita: recTipoReceita,
      justificativa: recTipoReceita !== 'Principal' ? (recJustificativa || recObs) : undefined,
      valorContratado: Number(recValor),
      valorRecebido: 0,
      saldo: Number(recValor),
      dataEmissao: new Date().toISOString().split('T')[0],
      dataVencimento: recVencimento,
      formaPagamento: recForma,
      numeroNotaFiscal: recNotaFiscal || undefined,
      observacoes: recObs || undefined,
      situacao: 'Aguardando',
      criadoPor: 'Financeiro',
      criadoEm: new Date().toISOString().split('T')[0],
      atualizadoEm: new Date().toISOString().split('T')[0],
      status: recNotaFiscal ? 'FATURADO' : 'AGUARDANDO_COBRANCA',
      statusLabel: recNotaFiscal ? 'Faturado' : 'Aguardando Cobrança'
    };

    await HeadhunterFinanceService.saveReceita(newReceita);
    resetReceitaForm();
    setShowReceitaModal(false);
    reloadData();
  };

  const handleConfirmBaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showBaixaModal) return;
    await HeadhunterFinanceService.registrarPagamentoReceita(
      showBaixaModal.id,
      baixaValor,
      baixaForma,
      baixaData,
      baixaObs
    );
    setShowBaixaModal(null);
    reloadData();
  };

  const handleConfirmEstorno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEstornoModal) return;
    await HeadhunterFinanceService.estornarReceita(showEstornoModal.id, estornoMotivo || 'Estorno solicitado pelo gestor');
    setShowEstornoModal(null);
    setEstornoMotivo('');
    reloadData();
  };

  const handleAdvanceBillingStatus = async (receita: HeadhunterReceita, target: 'FATURADO' | 'FINALIZADO') => {
    setFormError(null);
    try {
      await HeadhunterFinanceService.atualizarStatusReceita(receita.id, target);
      reloadData();
    } catch (error) {
      console.error('[HEADHUNTER FINANCEIRO] Erro ao avançar cobrança', { receitaId: receita.id, target, code: (error as any)?.code || null });
      setFormError('Não foi possível atualizar a cobrança. Verifique os dados e tente novamente.');
    }
  };

  const handleCreateDespesa = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const selectedClient = availableClients.find(client => client.id === despClienteId);
    const selectedJob = availableJobs.find(job => job.id === despVagaId);
    let link;
    try {
      link = buildExpenseLink({
        type: despTipo,
        client: selectedClient ? {
          id: selectedClient.id,
          name: selectedClient.nomeFantasia || selectedClient.razaoSocial || (selectedClient as any).name || '',
        } : null,
        job: selectedJob ? {
          id: selectedJob.id,
          title: selectedJob.titulo || selectedJob.title || selectedJob.cargo || 'Vaga sem título',
        } : null,
      });
    } catch (error) {
      setFormError(error instanceof Error && error.message === 'EXPENSE_CLIENT_REQUIRED'
        ? 'Selecione um cliente cadastrado.'
        : 'Selecione uma vaga real vinculada ao cliente.');
      return;
    }
    const existingExpense = editingExpenseId
      ? despesas.find(expense => expense.id === editingExpenseId)
      : undefined;
    await HeadhunterFinanceService.saveDespesa({
      ...existingExpense,
      id: editingExpenseId || `exp-${Date.now()}`,
      empresaId: companyId,
      companyId,
      criadoPor: 'Financeiro',
      criadoEm: existingExpense?.criadoEm || new Date().toISOString().split('T')[0],
      atualizadoEm: new Date().toISOString().split('T')[0],
      status: 'Ativo',
      tipoDespesa: despTipo,
      ...link,
      consultorNome: despResponsavel,
      responsavel: despResponsavel,
      centroCusto: despTipo === 'vaga' ? 'Operacional de Vaga' : 'Despesa Geral Consultoria',
      categoria: despCategoria,
      descricao: despDescricao,
      data: despData,
      dataLancamento: despData,
      valor: despValor,
      situacao: 'Pago'
    });
    setShowDespesaModal(false);
    resetExpenseForm();
    reloadData();
  };

  const handleLiberarComissao = async (id: string) => {
    await HeadhunterFinanceService.liberarComissao(id, 'Comissão aprovada após validação de recebimento');
    reloadData();
  };

  const handleConfirmPagamentoComissao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showComissaoPagamentoModal) return;
    await HeadhunterFinanceService.registrarPagamentoComissao(
      showComissaoPagamentoModal.id,
      comValorPago,
      comForma,
      comData,
      comObs
    );
    setShowComissaoPagamentoModal(null);
    reloadData();
  };

  // Calculations for Dashboards
  const totalReceitaContratada = receitas
    .filter(r => r.situacao !== 'Cancelada' && r.situacao !== 'Estornada')
    .reduce((acc, r) => acc + (r.valorContratado || 0), 0);

  const totalReceitaRecebida = receitas
    .filter(r => r.situacao !== 'Cancelada' && r.situacao !== 'Estornada')
    .reduce((acc, r) => acc + (r.valorRecebido || 0), 0);

  const totalReceitaAguardando = receitas
    .filter(r => r.situacao === 'Aguardando' || r.situacao === 'Parcialmente Recebida' || r.situacao === 'Prevista')
    .reduce((acc, r) => acc + (r.saldo || 0), 0);

  const totalDespesasVaga = despesas
    .filter(d => d.tipoDespesa === 'vaga' && d.situacao !== 'Cancelado')
    .reduce((acc, d) => acc + d.valor, 0);

  const totalDespesasGerais = despesas
    .filter(d => d.tipoDespesa === 'geral' && d.situacao !== 'Cancelado')
    .reduce((acc, d) => acc + d.valor, 0);

  const totalComissoesPrevistas = comissoes
    .filter(c => c.situacao !== 'Cancelada')
    .reduce((acc, c) => acc + c.valorComissao, 0);

  const totalComissoesPagas = comissoes
    .filter(c => c.situacao === 'Paga')
    .reduce((acc, c) => acc + (c.valorPago || c.valorComissao), 0);

  const lucroLiquidoCentral = totalReceitaContratada - totalDespesasVaga - totalDespesasGerais - totalComissoesPrevistas;
  const margemMediaCentral = totalReceitaContratada > 0 ? (lucroLiquidoCentral / totalReceitaContratada) * 100 : 0;
  const garantiasAtivasCount = garantias.filter(g => g.situacao === 'Ativa' || g.situacao === 'Próxima do Vencimento').length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-extrabold text-slate-900">Gestão Comercial & Financeiro Headhunter</h2>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full uppercase tracking-wider">
              Integrado ao Recrutamento
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle unificado de faturamento de vagas, contas a receber, comissões de consultores, despesas operacionais e garantias contratuais.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReceitaModal(true)}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar Receita</span>
          </button>

          <button
            onClick={openNewExpense}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar Despesa</span>
          </button>
        </div>
      </div>

      {/* Main Sub-tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'visao-geral', label: 'Visão Geral & Indicadores', icon: PieChart },
          { id: 'receitas', label: 'Receitas & Faturamento', icon: TrendingUp, badge: receitas.length },
          { id: 'despesas', label: 'Despesas (Vaga & Gerais)', icon: TrendingDown, badge: despesas.length },
          { id: 'comissoes', label: 'Comissões de Consultores', icon: UserCheck, badge: comissoes.length },
          { id: 'garantias', label: 'Garantias Contratuais', icon: ShieldCheck, badge: garantiasAtivasCount },
          { id: 'rentabilidade', label: 'Rentabilidade por Vaga', icon: FileSpreadsheet }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-2 py-0.2 text-[10px] font-black rounded-full ${
                  isActive ? 'bg-white text-indigo-700' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: VISÃO GERAL */}
      {activeTab === 'visao-geral' && (
        <div className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Receitas Faturadas</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">R$ {totalReceitaContratada.toLocaleString('pt-BR')}</p>
              <span className="text-[11px] text-slate-400 font-medium mt-1 block">Recebido: R$ {totalReceitaRecebida.toLocaleString('pt-BR')}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Contas a Receber (Aguardando)</span>
              <p className="text-2xl font-black text-amber-600 mt-1">R$ {totalReceitaAguardando.toLocaleString('pt-BR')}</p>
              <span className="text-[11px] text-slate-400 font-medium mt-1 block">Previsto em contrato</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Despesas Operacionais</span>
              <p className="text-2xl font-black text-rose-600 mt-1">R$ {(totalDespesasVaga + totalDespesasGerais).toLocaleString('pt-BR')}</p>
              <span className="text-[11px] text-slate-400 font-medium mt-1 block">Vagas: R$ {totalDespesasVaga.toLocaleString('pt-BR')} • Geral: R$ {totalDespesasGerais.toLocaleString('pt-BR')}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Lucro Líquido Estimado</span>
              <p className="text-2xl font-black text-indigo-700 mt-1">R$ {lucroLiquidoCentral.toLocaleString('pt-BR')}</p>
              <span className="text-[11px] text-emerald-600 font-bold mt-1 block">Margem Média: {margemMediaCentral.toFixed(1)}%</span>
            </div>
          </div>

          {/* Detailed Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span>Resumo de Comissões</span>
                </h3>
                <span className="text-xs font-bold text-slate-500">{comissoes.length} Registros</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600 font-bold">Total Comissões Previstas</span>
                  <strong className="text-slate-900 font-black">R$ {totalComissoesPrevistas.toLocaleString('pt-BR')}</strong>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                  <span className="text-emerald-800 font-bold">Comissões Pagas</span>
                  <strong className="text-emerald-900 font-black">R$ {totalComissoesPagas.toLocaleString('pt-BR')}</strong>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                  <span className="text-amber-800 font-bold">Pendente de Pagamento</span>
                  <strong className="text-amber-900 font-black">R$ {(totalComissoesPrevistas - totalComissoesPagas).toLocaleString('pt-BR')}</strong>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Status de Garantias</span>
                </h3>
                <span className="text-xs font-bold text-slate-500">{garantias.length} Total</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                  <span className="text-emerald-800 font-bold">Garantias Ativas</span>
                  <strong className="text-emerald-900 font-black">{garantias.filter(g => g.situacao === 'Ativa').length}</strong>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                  <span className="text-amber-800 font-bold">Próximas do Vencimento</span>
                  <strong className="text-amber-900 font-black">{garantias.filter(g => g.situacao === 'Próxima do Vencimento').length}</strong>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-100 rounded-xl">
                  <span className="text-slate-700 font-bold">Encerradas com Sucesso</span>
                  <strong className="text-slate-900 font-black">{garantias.filter(g => g.situacao === 'Encerrada').length}</strong>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>Top Clientes por Faturamento</span>
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                {receitas.slice(0, 3).map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                    <div>
                      <strong className="text-slate-900 block">{r.clienteNome}</strong>
                      <span className="text-[10px] text-slate-400">{r.vagaTitulo}</span>
                    </div>
                    <strong className="text-emerald-600 font-black">R$ {(r.valorContratado || 0).toLocaleString('pt-BR')}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECEITAS */}
      {activeTab === 'receitas' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900">Lançamentos de Receita & Faturamento</h3>
            <button
              onClick={() => setShowReceitaModal(true)}
              className="px-3.5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-indigo-700 flex items-center gap-1.5 self-start lg:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Lançar Nova Receita</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filtrar Cliente</label>
              <select
                value={filterClient}
                onChange={e => setFilterClient(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
              >
                <option value="">Todos os Clientes</option>
                {Array.from(new Set(receitas.map(r => r.clienteNome))).map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filtrar Vaga</label>
              <select
                value={filterVaga}
                onChange={e => setFilterVaga(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
              >
                <option value="">Todas as Vagas</option>
                {Array.from(new Set(receitas.map(r => r.vagaTitulo).filter(Boolean))).map((v, i) => (
                  <option key={i} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Filtrar Candidato</label>
              <select
                value={filterCandidato}
                onChange={e => setFilterCandidato(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
              >
                <option value="">Todos os Candidatos</option>
                {Array.from(new Set(receitas.map(r => r.candidatoNome).filter(Boolean))).map((cand, i) => (
                  <option key={i} value={cand}>{cand}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Busca Textual</label>
              <input
                type="text"
                placeholder="Buscar cliente, vaga, NF..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="p-3">Cliente & Vaga</th>
                  <th className="p-3 text-right">Valor Contratado</th>
                  <th className="p-3 text-right">Valor Recebido</th>
                  <th className="p-3 text-right">Saldo</th>
                  <th className="p-3 text-center">Vencimento</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {receitas
                  .filter(r => {
                    const matchesSearch = 
                      r.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      (r.vagaTitulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (r.candidatoNome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (r.numeroNotaFiscal || '').toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesClient = !filterClient || r.clienteNome === filterClient;
                    const matchesVaga = !filterVaga || r.vagaTitulo === filterVaga;
                    const matchesCandidato = !filterCandidato || r.candidatoNome === filterCandidato;
                    return matchesSearch && matchesClient && matchesVaga && matchesCandidato;
                  })
                  .map(r => {
                    const isHighlighted = highlightedFinancialId && (
                      r.id === highlightedFinancialId ||
                      r.id === `cob_${highlightedFinancialId}` ||
                      (r as any).contratacaoId === highlightedFinancialId ||
                      (r as any).cobrancaId === highlightedFinancialId
                    );

                    return (
                      <tr 
                        key={r.id} 
                        className={`transition-all ${
                          isHighlighted 
                            ? 'bg-indigo-50/90 border-l-4 border-indigo-600 shadow-xs ring-1 ring-indigo-300' 
                            : 'hover:bg-slate-50'
                        }`}
                      >
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <strong className="text-slate-900 block font-black">{r.clienteNome}</strong>
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                            r.tipoReceita === 'Principal' || !r.tipoReceita ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {r.tipoReceita || 'Principal'}
                          </span>
                        </div>

                        <div className="text-slate-600 text-[11px] flex flex-wrap items-center gap-2">
                          <span className="font-bold">{r.vagaTitulo || 'Vaga Executiva'}</span>
                          {r.vagaCodigo && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono font-bold">{r.vagaCodigo}</span>}
                        </div>

                        {r.candidatoNome && (
                          <div className="text-[11px] text-emerald-800 font-bold mt-0.5 flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-emerald-600" />
                            <span>Contratado: {r.candidatoNome}</span>
                          </div>
                        )}

                        {r.numeroNotaFiscal && (
                          <span className="text-[10px] text-indigo-600 font-extrabold block mt-0.5">NF: {r.numeroNotaFiscal}</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-black text-slate-900">R$ {(r.valorContratado || 0).toLocaleString('pt-BR')}</td>
                      <td className="p-3 text-right font-black text-emerald-600">R$ {(r.valorRecebido || 0).toLocaleString('pt-BR')}</td>
                      <td className="p-3 text-right font-black text-amber-600">R$ {(r.saldo || 0).toLocaleString('pt-BR')}</td>
                      <td className="p-3 text-center font-medium text-slate-600">{r.dataVencimento}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full ${
                          r.situacao === 'Recebida' ? 'bg-emerald-100 text-emerald-800' :
                          r.situacao === 'Parcialmente Recebida' ? 'bg-blue-100 text-blue-800' :
                          r.situacao === 'Estornada' ? 'bg-slate-200 text-slate-700' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {billingStatusLabel(r.status) || r.situacao}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {r.status === 'AGUARDANDO_COBRANCA' && (
                            <button
                              onClick={() => handleAdvanceBillingStatus(r, 'FATURADO')}
                              className="px-2 py-1 bg-indigo-50 text-indigo-700 font-bold text-[11px] rounded-lg hover:bg-indigo-100 cursor-pointer"
                              title="Confirmar faturamento"
                            >
                              Faturar
                            </button>
                          )}

                          {r.status === 'FATURADO' && r.situacao !== 'Recebida' && r.situacao !== 'Estornada' && (
                            <button
                              onClick={() => {
                                setShowBaixaModal(r);
                                setBaixaValor(r.saldo);
                              }}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded-lg hover:bg-emerald-100 cursor-pointer"
                              title="Registrar Pagamento"
                            >
                              Baixar
                            </button>
                          )}

                          {r.status === 'RECEBIDO' && (
                            <button
                              onClick={() => handleAdvanceBillingStatus(r, 'FINALIZADO')}
                              className="px-2 py-1 bg-slate-900 text-white font-bold text-[11px] rounded-lg hover:bg-slate-800 cursor-pointer"
                              title="Finalizar cobrança"
                            >
                              Finalizar
                            </button>
                          )}

                          {r.situacao !== 'Estornada' && (
                            <button
                              onClick={() => setShowEstornoModal(r)}
                              className="px-2 py-1 bg-rose-50 text-rose-700 font-bold text-[11px] rounded-lg hover:bg-rose-100 cursor-pointer"
                              title="Estornar lançamento"
                            >
                              Estornar
                            </button>
                          )}

                          {r.historico && r.historico.length > 0 && (
                            <button
                              onClick={() => setShowHistoricoModal(r)}
                              className="p-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
                              title="Ver Histórico de Auditoria"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DESPESAS */}
      {activeTab === 'despesas' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Despesas da Vaga & Despesas Gerais</h3>
              <p className="text-xs text-slate-500">Despesas da vaga impactam diretamente a rentabilidade da oportunidade; despesas gerais afetam a operação da consultoria.</p>
            </div>
            <button
              onClick={openNewExpense}
              className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-indigo-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Despesa</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="p-3">Tipo & Categoria</th>
                  <th className="p-3">Descrição</th>
                  <th className="p-3">Vaga / Cliente</th>
                  <th className="p-3 text-right">Valor</th>
                  <th className="p-3 text-center">Data</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {despesas.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase block w-fit ${
                        d.tipoDespesa === 'vaga' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {d.tipoDespesa === 'vaga' ? 'Despesa da Vaga' : 'Despesa Geral'}
                      </span>
                      <strong className="text-slate-900 mt-1 block">{d.categoria}</strong>
                    </td>
                    <td className="p-3 text-slate-700 font-medium">{d.descricao}</td>
                    <td className="p-3">
                      {d.tipoDespesa === 'vaga' ? (
                        <>
                          <strong className="text-slate-900 block">{d.clienteNome}</strong>
                          <span className="text-slate-500 text-[11px]">{d.vagaTitulo}</span>
                        </>
                      ) : (
                        <span className="text-slate-400 font-italic">Geral da Consultoria</span>
                      )}
                    </td>
                    <td className="p-3 text-right font-black text-rose-600">R$ {d.valor.toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-center font-medium text-slate-600">{d.data}</td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-100 text-emerald-800">
                        {d.situacao}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => openEditExpense(d)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: COMISSÕES */}
      {activeTab === 'comissoes' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900">Comissões de Consultores & Recrutadores</h3>
            <p className="text-xs text-slate-500">As comissões são geradas exclusivamente na finalização do processo seletivo da vaga.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="p-3">Beneficiário & Consultor</th>
                  <th className="p-3">Cliente & Vaga</th>
                  <th className="p-3">Regra</th>
                  <th className="p-3 text-right">Comissão Calculada</th>
                  <th className="p-3 text-right">Valor Pago</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {comissoes.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <strong className="text-slate-900 block">{c.beneficiarioNome}</strong>
                      <span className="text-slate-400 text-[11px]">{c.tipoComissao}</span>
                    </td>
                    <td className="p-3">
                      <strong className="text-slate-900 block">{c.clienteNome}</strong>
                      <span className="text-slate-500 text-[11px]">{c.vagaTitulo}</span>
                    </td>
                    <td className="p-3 font-medium text-slate-600">
                      {c.percentual ? `${c.percentual}% do Faturamento` : 'Valor Fixo'}
                    </td>
                    <td className="p-3 text-right font-black text-indigo-700">R$ {c.valorComissao.toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right font-black text-emerald-600">R$ {(c.valorPago || 0).toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full ${
                        c.situacao === 'Paga' ? 'bg-emerald-100 text-emerald-800' :
                        c.situacao === 'Liberada' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {c.situacao}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {c.situacao === 'Prevista' && (
                          <button
                            onClick={() => handleLiberarComissao(c.id)}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-[11px] rounded-lg hover:bg-blue-100 cursor-pointer"
                          >
                            Liberar
                          </button>
                        )}
                        {c.situacao !== 'Paga' && (
                          <button
                            onClick={() => {
                              setShowComissaoPagamentoModal(c);
                              setComValorPago(c.valorComissao - (c.valorPago || 0));
                            }}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded-lg hover:bg-emerald-100 cursor-pointer"
                          >
                            Pagar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: GARANTIAS */}
      {activeTab === 'garantias' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900">Garantias Contratuais do Headhunter</h3>
            <p className="text-xs text-slate-500">Acompanhamento do SLA de garantia para reposição gratuita de contratados.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {garantias.map(g => (
              <div key={g.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 block">{g.clienteNome}</span>
                    <h4 className="text-sm font-extrabold text-slate-900">{g.vagaTitulo}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">Candidato: <strong>{g.candidatoNome}</strong></p>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full ${
                    g.situacao === 'Ativa' ? 'bg-emerald-100 text-emerald-800' :
                    g.situacao === 'Próxima do Vencimento' ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {g.situacao}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 font-medium block">Data Início</span>
                    <strong className="text-slate-800">{g.dataInicial}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Data Término</span>
                    <strong className="text-slate-800">{g.dataFinal}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium block">Dias Restantes</span>
                    <strong className="text-indigo-700 font-black">{g.diasRestantes ?? g.prazoDias} dias</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">{g.observacoes}</span>
                  <button
                    onClick={() => alert(`Iniciando abertura de vaga de reposição para ${g.vagaTitulo} (${g.clienteNome}).`)}
                    className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 cursor-pointer shadow-2xs"
                  >
                    Abrir Reposição
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: RENTABILIDADE */}
      {activeTab === 'rentabilidade' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900">DRE & Rentabilidade por Vaga</h3>
            <p className="text-xs text-slate-500">Cálculo de margem líquida por vaga: Receita Contratada - Despesas Diretas da Vaga - Comissão = Lucro Líquido.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="p-3">Cliente & Vaga</th>
                  <th className="p-3 text-right">Faturamento</th>
                  <th className="p-3 text-right">Despesas Vaga</th>
                  <th className="p-3 text-right">Comissões</th>
                  <th className="p-3 text-right">Lucro Líquido</th>
                  <th className="p-3 text-right">Margem %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {receitas.map(r => {
                  const despsVaga = despesas
                    .filter(d => isExpenseLinkedToJob(d, { id: r.vagaId, titulo: r.vagaTitulo }) && d.situacao !== 'Cancelado')
                    .reduce((acc, d) => acc + d.valor, 0);

                  const comsVaga = comissoes
                    .filter(c => c.vagaTitulo === r.vagaTitulo && c.situacao !== 'Cancelada')
                    .reduce((acc, c) => acc + c.valorComissao, 0);

                  const lucro = (r.valorContratado || 0) - despsVaga - comsVaga;
                  const margem = (r.valorContratado || 0) > 0 ? (lucro / r.valorContratado) * 100 : 0;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <strong className="text-slate-900 block">{r.clienteNome}</strong>
                        <span className="text-slate-500 text-[11px]">{r.vagaTitulo}</span>
                      </td>
                      <td className="p-3 text-right font-black text-slate-900">R$ {(r.valorContratado || 0).toLocaleString('pt-BR')}</td>
                      <td className="p-3 text-right font-black text-rose-600">R$ {despsVaga.toLocaleString('pt-BR')}</td>
                      <td className="p-3 text-right font-black text-amber-600">R$ {comsVaga.toLocaleString('pt-BR')}</td>
                      <td className="p-3 text-right font-black text-indigo-700">R$ {lucro.toLocaleString('pt-BR')}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded-full">
                          {margem.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: NOVA RECEITA */}
      {showReceitaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Módulo Headhunter • Comercial & Financeiro</span>
                <h3 className="text-base font-black text-slate-900">Lançar Nova Receita Comercial</h3>
              </div>
              <button onClick={() => setShowReceitaModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg cursor-pointer">✕</button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {duplicateWarning && (
              <div className={`p-3.5 rounded-xl text-xs border flex items-start gap-2.5 ${
                recTipoReceita === 'Principal' ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}>
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                  recTipoReceita === 'Principal' ? 'text-amber-600' : 'text-blue-600'
                }`} />
                <div className="space-y-1">
                  <strong className="block font-bold">Aviso de Receita Vinculada</strong>
                  <p className="leading-relaxed">{duplicateWarning}</p>
                  {recTipoReceita === 'Principal' && (
                    <span className="inline-block text-[11px] font-extrabold text-amber-800 underline mt-1">
                      Para lançar cobranças adicionais nesta contratação, selecione um Tipo de Receita extraordinário abaixo (ex: Cobrança complementar).
                    </span>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleCreateReceita} className="space-y-5 text-xs">
              
              {/* SEÇÃO 1: DADOS DA CONTRATAÇÃO */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3.5">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide">1. Dados da Contratação</h4>
                </div>

                <div className="space-y-3">
                  {/* 1. Cliente Corporativo */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Cliente Corporativo *
                    </label>
                    <select
                      required
                      value={recClienteId}
                      onChange={e => handleClientChange(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                    >
                      <option value="">Selecione o cliente corporativo...</option>
                      {availableClients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nomeFantasia || c.razaoSocial} ({c.segmento || 'Cliente Headhunter'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Vaga */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Vaga Headhunter *
                    </label>
                    <select
                      required
                      disabled={!recClienteId}
                      value={recVagaId}
                      onChange={e => handleVagaChange(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {!recClienteId ? 'Selecione primeiro o cliente...' : filteredClientJobs.length === 0 ? 'Nenhuma vaga Headhunter encontrada para este cliente' : 'Selecione a vaga Headhunter...'}
                      </option>
                      {filteredClientJobs.map(j => {
                        const status = j.status || 'Em Andamento';
                        const dtEnc = j.dataPrevista || j.dataEncerramento || j.deadline || 'Em aberto';
                        const code = j.codigo || j.id.toUpperCase();
                        return (
                          <option key={j.id} value={j.id}>
                            {j.cargo || j.titulo} — {code} — {status} — {j.clienteNome || recClienteNome} — Encerramento: {dtEnc}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* 3. Candidato Contratado */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Candidato Contratado (Contratação) *
                    </label>
                    <select
                      required
                      disabled={!recVagaId}
                      value={recContratacaoId}
                      onChange={e => handleContratacaoChange(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {!recVagaId ? 'Selecione primeiro a vaga...' : filteredVagaHirings.length === 0 ? 'Nenhuma contratação confirmada para esta vaga' : 'Selecione o candidato contratado...'}
                      </option>
                      {filteredVagaHirings.map(h => (
                        <option key={h.id} value={h.id}>
                          {h.candidatoNome} — {h.cargo || h.vagaTitulo} — Contratação: {h.dataContratacao || 'Confirmada'} — Admissão: {h.garantiaAteData || 'Confirmada'}
                        </option>
                      ))}
                    </select>
                    {recVagaId && filteredVagaHirings.length === 0 && (
                      <p className="text-[11px] text-amber-700 mt-1 font-medium">
                        ⚠️ Somente candidatos com contratação confirmada nesta vaga podem ter receita lançada.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: DADOS FINANCEIROS */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3.5">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide">2. Dados Financeiros</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Tipo da Receita */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Tipo da Receita Comercial *
                    </label>
                    <select
                      value={recTipoReceita}
                      onChange={e => handleTipoReceitaChange(e.target.value as TipoReceitaHeadhunter)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900 cursor-pointer"
                    >
                      <option value="Principal">Receita Principal (Honorários de Contratação)</option>
                      <option value="Cobrança complementar">Cobrança complementar (Ajuste / Adicional)</option>
                      <option value="Taxa adicional">Taxa adicional (Despesas / Retainer extra)</option>
                      <option value="Multa">Multa rescisória / Cancelamento</option>
                      <option value="Reembolso">Reembolso de despesas operacionais</option>
                      <option value="Outro lançamento extraordinário">Outro lançamento extraordinário</option>
                    </select>
                  </div>

                  {/* Valor Contratado */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Valor Contratado (R$) *
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      step="0.01"
                      value={recValor}
                      onChange={e => setRecValor(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-black text-indigo-900 text-sm"
                    />
                  </div>

                  {/* Data de Vencimento */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Data de Vencimento *
                    </label>
                    <input
                      required
                      type="date"
                      value={recVencimento}
                      onChange={e => setRecVencimento(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  {/* Forma de Pagamento */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Forma de Pagamento *
                    </label>
                    <select
                      value={recForma}
                      onChange={e => setRecForma(e.target.value as any)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                    >
                      <option value="Boleto">Boleto Bancário</option>
                      <option value="PIX">PIX (Chave ou QR Code)</option>
                      <option value="Transferência">Transferência / TED / DOC</option>
                      <option value="Nota Fiscal">Faturamento NF Direct</option>
                      <option value="Cartão">Cartão de Crédito</option>
                      <option value="Outro">Outro Acordo</option>
                    </select>
                  </div>

                  {/* Número da NF */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Número da Nota Fiscal (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: NF-2026-089"
                      value={recNotaFiscal}
                      onChange={e => setRecNotaFiscal(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: INFORMAÇÕES ADICIONAIS */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3.5">
                <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide">3. Informações Adicionais</h4>
                </div>

                <div className="space-y-3">
                  {/* Título da Vaga ou Projeto */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Título da Vaga / Projeto
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Executive Search - CTO"
                      value={recVagaTitulo}
                      onChange={e => setRecVagaTitulo(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  {/* Observações e Justificativa */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Observações / Justificativa {recTipoReceita !== 'Principal' && <span className="text-rose-600 font-black">* (Obrigatório para lançamentos extraordinários)</span>}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={
                        recTipoReceita !== 'Principal'
                          ? "Informe a justificativa comercial para este lançamento extraordinário ou complementar..."
                          : "Observações adicionais, parcelamento, acordos com o cliente..."
                      }
                      value={recObs}
                      onChange={e => setRecObs(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReceitaModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={Boolean(duplicateWarning && recTipoReceita === 'Principal')}
                  className={`px-5 py-2.5 font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                    duplicateWarning && recTipoReceita === 'Principal'
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Receita Comercial</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVA DESPESA */}
      {showDespesaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">{editingExpenseId ? 'Editar Despesa' : 'Lançar Nova Despesa'}</h3>
              <button onClick={() => setShowDespesaModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateDespesa} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo da Despesa</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDespTipo('vaga')}
                    className={`p-2 rounded-xl font-bold cursor-pointer border ${
                      despTipo === 'vaga' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Despesa da Vaga
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDespTipo('geral');
                      setDespClienteId('');
                      setDespClienteNome('');
                      setDespVagaId('');
                      setDespVagaTitulo('');
                    }}
                    className={`p-2 rounded-xl font-bold cursor-pointer border ${
                      despTipo === 'geral' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Despesa Geral da Agência
                  </button>
                </div>
              </div>

              {despTipo === 'vaga' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cliente</label>
                    <select
                      required
                      value={despClienteId}
                      onChange={e => {
                        const id = e.target.value;
                        const client = availableClients.find(item => item.id === id);
                        setDespClienteId(id);
                        setDespClienteNome(client?.nomeFantasia || client?.razaoSocial || (client as any)?.name || '');
                        setDespVagaId('');
                        setDespVagaTitulo('');
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="">Selecione um cliente</option>
                      {availableClients.map(client => (
                        <option key={client.id} value={client.id}>{client.nomeFantasia || client.razaoSocial || (client as any).name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Vaga</label>
                    <select
                      required
                      value={despVagaId}
                      disabled={!despClienteId}
                      onChange={e => {
                        const id = e.target.value;
                        const job = availableJobs.find(item => item.id === id);
                        setDespVagaId(id);
                        setDespVagaTitulo(job?.titulo || job?.title || job?.cargo || '');
                      }}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-50"
                    >
                      <option value="">Selecione uma vaga</option>
                      {expenseJobs.map(job => (
                        <option key={job.id} value={job.id}>{job.titulo || job.title || job.cargo}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Categoria</label>
                <select value={despCategoria} onChange={e => setDespCategoria(e.target.value as any)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  <option value="Deslocamento / Uber">Deslocamento / Uber</option>
                  <option value="Anúncio">Anúncio de Vaga</option>
                  <option value="Plataforma / LinkedIn">Plataforma / LinkedIn</option>
                  <option value="Testes & Avaliações">Testes & Avaliações</option>
                  <option value="Alimentação">Alimentação</option>
                  <option value="Softwares & Licenças">Softwares & Licenças</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição</label>
                <input required type="text" value={despDescricao} onChange={e => setDespDescricao(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor (R$)</label>
                  <input required type="number" value={despValor} onChange={e => setDespValor(Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data Lançamento</label>
                  <input required type="date" value={despData} onChange={e => setDespData(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowDespesaModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 cursor-pointer">{editingExpenseId ? 'Salvar Alterações' : 'Salvar Despesa'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR PAGAMENTO / BAIXA */}
      {showBaixaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Dar Baixa em Receita</h3>
                <p className="text-xs text-slate-500">{showBaixaModal.clienteNome}</p>
              </div>
              <button onClick={() => setShowBaixaModal(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleConfirmBaixa} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Valor do Recebimento (R$)</label>
                <input required type="number" value={baixaValor} onChange={e => setBaixaValor(Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Forma de Pagamento</label>
                <select value={baixaForma} onChange={e => setBaixaForma(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  <option value="PIX">PIX</option>
                  <option value="Boleto">Boleto Quitados</option>
                  <option value="Transferência">TED / Transferência</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Data do Recebimento</label>
                <input required type="date" value={baixaData} onChange={e => setBaixaData(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowBaixaModal(null)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 cursor-pointer">Confirmar Baixa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ESTORNO DE RECEITA */}
      {showEstornoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-rose-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Estornar Receita (Auditoria)</span>
                </h3>
                <p className="text-xs text-slate-500">{showEstornoModal.clienteNome}</p>
              </div>
              <button onClick={() => setShowEstornoModal(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleConfirmEstorno} className="space-y-3 text-xs">
              <p className="text-slate-600 text-xs">
                O estorno não apagará o registro do banco de dados, registrando uma alteração de estorno para fins de auditoria financeira.
              </p>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo do Estorno / Cancelamento</label>
                <textarea required value={estornoMotivo} onChange={e => setEstornoMotivo(e.target.value)} rows={3} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" placeholder="Ex: Cancelamento de contrato ou erro de faturamento..." />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowEstornoModal(null)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 cursor-pointer">Confirmar Estorno</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAGAR COMISSÃO */}
      {showComissaoPagamentoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Registrar Pagamento de Comissão</h3>
                <p className="text-xs text-slate-500">{showComissaoPagamentoModal.beneficiarioNome}</p>
              </div>
              <button onClick={() => setShowComissaoPagamentoModal(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleConfirmPagamentoComissao} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Valor Pago (R$)</label>
                <input required type="number" value={comValorPago} onChange={e => setComValorPago(Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Forma de Pagamento</label>
                <input required type="text" value={comForma} onChange={e => setComForma(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Data do Pagamento</label>
                <input required type="date" value={comData} onChange={e => setComData(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowComissaoPagamentoModal(null)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 cursor-pointer">Confirmar Pagamento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HISTÓRICO DE AUDITORIA */}
      {showHistoricoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <span>Histórico de Auditoria Financeira</span>
              </h3>
              <button onClick={() => setShowHistoricoModal(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto text-xs">
              {showHistoricoModal.historico?.map((h: any, i: number) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <span>{h.data}</span>
                    <span>{h.usuario}</span>
                  </div>
                  <strong className="text-slate-900 block">{h.alteracao}</strong>
                  {h.motivo && <p className="text-slate-500 italic">Motivo: {h.motivo}</p>}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button onClick={() => setShowHistoricoModal(null)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
