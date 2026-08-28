import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  DollarSign, 
  Award, 
  CheckCircle2, 
  Sparkles, 
  Briefcase, 
  Building2, 
  TrendingUp,
  Send,
  Eye,
  X,
  Clock,
  AlertTriangle,
  Check,
  Loader2,
  FileText,
  ExternalLink,
  History,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { 
  UnifiedHiring, 
  OrigemProcesso 
} from '../../types/recruitment';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, setDoc } from '../../../firebase/firestore';
import { auth, db } from '../../../lib/firebase';
import { useAuth } from '../../../auth';
import { JobCandidateService } from '../../../services/JobCandidateService';
import { sanitizeFirestoreData } from '../../../lib/firestoreUtils';
import { billingStatusLabel, upsertBillingForHiring } from '../../../headhunter/services/contractBillingLinkService';
import { matchesHeadhunterHiringTab, normalizeHeadhunterBillingStatus } from '../../../headhunter/services/headhunterFinanceUtils';
import type { HeadhunterClient } from '../../../headhunter/types';
import { canSendToAdmission, resolveExplicitProcessOrigin } from '../../utils/processOrigin';

export interface UnifiedContratacoesViewProps {
  hirings?: UnifiedHiring[];
  origemProcesso?: OrigemProcesso;
  companyId?: string;
  onOpenAiModal?: (type: string, data?: any) => void;
  onNavigateToTab?: (tab: string, admissionId?: string) => void;
}

export const UnifiedContratacoesView: React.FC<UnifiedContratacoesViewProps> = ({
  hirings = [],
  origemProcesso = 'recrutamento_interno',
  companyId,
  onOpenAiModal,
  onNavigateToTab
}) => {
  const { user, isModuleActive, hasActionAccess } = useAuth();
  const hasDpModule = isModuleActive('departamentoPessoal');
  const hasAdmissaoModule = isModuleActive('admissao');
  const hasHeadhunterModule = isModuleActive('headhunter');
  const hasFinanceiroModule = isModuleActive('financeiroHeadhunter');
  // RH_UNIFIED_HIRING_FINALIZATION_VISIBILITY_V2
  // RH_UNIFIED_HIRING_FINALIZATION_VISIBILITY_V1
  const hasHeadhunterEntitlement = hasHeadhunterModule && hasFinanceiroModule;
  const canForwardHeadhunterFinance = hasActionAccess('headhunter.financeiro.encaminhar');
  const canChargeHeadhunterFinance = hasActionAccess('headhunter.financeiro.cobrar');
  const canEditHeadhunterFinance = hasActionAccess('headhunter.financeiro.editar') || canForwardHeadhunterFinance;
  const canViewHeadhunterFinance = hasActionAccess('headhunter.financeiro.visualizar') || canEditHeadhunterFinance || canChargeHeadhunterFinance;
  const [firestoreHirings, setFirestoreHirings] = useState<any[]>([]);
  const [admissoesMap, setAdmissoesMap] = useState<Record<string, any>>({});
  const [cobrancasMap, setCobrancasMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [openingAdmissionId, setOpeningAdmissionId] = useState<string | null>(null);
  const [openingFinancialId, setOpeningFinancialId] = useState<string | null>(null);
  const [financialError, setFinancialError] = useState<string | null>(null);

  // Modals state
  const [detailsItem, setDetailsItem] = useState<any | null>(null);
  const [commercialDraft, setCommercialDraft] = useState<Record<string, any>>({});
  const [savingCommercial, setSavingCommercial] = useState(false);
  const [commercialError, setCommercialError] = useState<string | null>(null);
  const [commercialSuccess, setCommercialSuccess] = useState<string | null>(null);
  const [commercialFlowMode, setCommercialFlowMode] = useState(false);
  const [companyClients, setCompanyClients] = useState<HeadhunterClient[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [newClientDraft, setNewClientDraft] = useState<Record<string, any>>({
    nomeFantasia: '', razaoSocial: '', cnpj: '', responsavel: '', email: '', telefone: '',
    comissaoNegociadaPercent: 0, valorPadraoVaga: 0, formaCobranca: 'Percentual do salário', prazoPagamentoDias: 30,
  });
  const [filterTab, setFilterTab] = useState<'TODAS' | 'DP' | 'HEADHUNTER' | 'AGUARDANDO_ADMISSAO' | 'AGUARDANDO_COBRANCA' | 'FINALIZADAS'>('TODAS');

  const activeCompanyId = companyId || user?.empresaId || user?.companyId || user?.tenantId;
  const isMaster = user?.role === 'Super Administrador' || user?.role === 'MASTER' || user?.tipoUsuario === 'MASTER' || user?.isMaster === true;
  const hasHeadhunterFlow = isMaster || hasHeadhunterEntitlement;
  // RH_UNIFIED_HIRING_REDUNDANT_ORIGIN_TABS_V1
  // Abas de origem só são úteis quando DP e Headhunter estão visíveis ao mesmo tempo.
  const showOriginTabs = isMaster || (hasDpModule && hasHeadhunterFlow);
  const isPermissionDenied = (error: unknown) =>
    (error as any)?.code === 'permission-denied' ||
    String((error as any)?.message || error).toLowerCase().includes('missing or insufficient permissions');

  const normalizeProcessStatus = (status: unknown) => String(status || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const isDpProcessFinalized = (status: unknown) => {
    const normalized = normalizeProcessStatus(status);
    return ['efetivad', 'admitid', 'concluid', 'finalizad'].some(token => normalized.includes(token));
  };

  const isHeadhunterProcessFinalized = (status: unknown) =>
    matchesHeadhunterHiringTab('FINALIZADAS', normalizeHeadhunterBillingStatus(String(status || '')));

  const canEditCommercialRules = canEditHeadhunterFinance || canForwardHeadhunterFinance;

  const getDueDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + Math.max(0, Number(days || 0)));
    return date.toISOString().slice(0, 10);
  };

  const getClientBillingType = (client?: Partial<HeadhunterClient> | null) => {
    const rule = String((client as any)?.tipoCobranca || client?.formaCobranca || '').toLowerCase();
    return rule.includes('fix') || rule.includes('valor') ? 'FIXO' : 'PERCENTUAL';
  };

  const selectCommercialClient = (client: HeadhunterClient) => {
    const tipoCobranca = getClientBillingType(client);
    setCommercialDraft(current => ({
      ...current,
      clienteId: client.id,
      clienteNome: client.nomeFantasia || client.razaoSocial,
      clienteRazaoSocial: client.razaoSocial || '',
      clienteDocumento: client.cnpj || '',
      clienteResponsavel: client.responsavel || '',
      clienteEmail: client.email || '',
      clienteTelefone: client.telefone || client.whatsapp || '',
      clienteStatus: client.status || '',
      tipoCobranca,
      feePercentual: tipoCobranca === 'PERCENTUAL'
        ? Number(client.comissaoNegociadaPercent || current.feePercentual || 0)
        : 0,
      feeFixo: tipoCobranca === 'FIXO'
        ? Number(client.valorPadraoVaga || current.feeFixo || current.feeValor || 0)
        : 0,
      feeValor: 0,
      dataVencimento: current.dataVencimento || getDueDate(client.prazoPagamentoDias || 30),
    }));
  };

  const loadCompanyClients = async (tenant: string, selectedClientId?: string) => {
    if (!tenant) return;
    setClientsLoading(true);
    setClientsError(null);
    try {
      const clientsQuery = query(
        collection(db, 'clientes_headhunter'),
        where('empresaId', '==', tenant)
      );
      const snapshot = await getDocs(clientsQuery);
      const clients = snapshot.docs
        .map(clientDoc => ({ id: clientDoc.id, ...clientDoc.data() } as HeadhunterClient))
        .filter(client => (client.empresaId || client.companyId) === tenant)
        .sort((a, b) => String(a.nomeFantasia || a.razaoSocial).localeCompare(String(b.nomeFantasia || b.razaoSocial), 'pt-BR'));
      setCompanyClients(clients);
      if (selectedClientId) {
        const selected = clients.find(client => client.id === selectedClientId);
        if (selected) selectCommercialClient(selected);
      }
    } catch (error) {
      console.error('[CLIENTES] Falha ao listar clientes da empresa', {
        operation: 'list', collection: 'clientes_headhunter', empresaId: tenant,
        uid: auth.currentUser?.uid || null, code: (error as any)?.code || null,
      });
      setClientsError(isPermissionDenied(error)
        ? 'Seu acesso não permite consultar os clientes desta empresa.'
        : 'Não foi possível carregar os clientes. Tente novamente.');
    } finally {
      setClientsLoading(false);
    }
  };

  const openHiringDetails = (hiring: any, admDoc: any, cobDoc: any, currentStatus: string, isHeadhunter: boolean, commercialMode = false) => {
    setCommercialError(null);
    setCommercialSuccess(null);
    setCommercialFlowMode(commercialMode);
    setShowClientForm(false);
    setCommercialDraft({
      clienteId: cobDoc?.clienteId || hiring.clienteId || '',
      clienteNome: cobDoc?.clienteNome || hiring.clienteNome || '',
      remuneracao: cobDoc?.remuneracao || hiring.salarioContratado || hiring.salarioFinal || 0,
      tipoCobranca: cobDoc?.tipoCobranca || (cobDoc?.feeValor && !cobDoc?.feePercentual ? 'FIXO' : 'PERCENTUAL'),
      feePercentual: cobDoc?.feePercentual || cobDoc?.percentual || hiring.feePercentual || 0,
      feeFixo: cobDoc?.feeFixo || (cobDoc?.tipoCobranca === 'FIXO' ? cobDoc?.feeValor || cobDoc?.valor : 0) || 0,
      feeValor: cobDoc?.feeValor || cobDoc?.valor || 0,
      dataVencimento: cobDoc?.dataVencimento || '',
      formaPagamento: cobDoc?.formaPagamento || 'Boleto',
      numeroNotaFiscal: cobDoc?.numeroNotaFiscal || '',
      observacoesComerciais: cobDoc?.observacoesComerciais || cobDoc?.observacoes || '',
    });
    setDetailsItem({ ...hiring, admDoc, cobDoc, currentStatus, isHeadhunter });
    if (isHeadhunter) {
      const tenant = activeCompanyId || hiring.empresaId || hiring.companyId || hiring.tenantId || '';
      void loadCompanyClients(tenant, cobDoc?.clienteId || hiring.clienteId || '');
    }
  };

  const handleCreateClientInline = async (event: React.FormEvent) => {
    event.preventDefault();
    if (savingClient) return;
    setClientsError(null);
    const tenant = activeCompanyId || detailsItem?.empresaId || detailsItem?.companyId || detailsItem?.tenantId || '';
    if (!tenant) {
      setClientsError('Não foi possível identificar a empresa desta contratação.');
      return;
    }
    if (!newClientDraft.nomeFantasia?.trim() || !newClientDraft.razaoSocial?.trim()) {
      setClientsError('Informe o nome e a razão social do cliente.');
      return;
    }
    setSavingClient(true);
    try {
      const id = `cli-${Date.now()}`;
      const now = new Date().toISOString();
      const newClient = sanitizeFirestoreData({
        id,
        empresaId: tenant,
        companyId: tenant,
        nomeFantasia: newClientDraft.nomeFantasia.trim(),
        razaoSocial: newClientDraft.razaoSocial.trim(),
        cnpj: newClientDraft.cnpj?.trim() || '',
        segmento: '',
        porte: '',
        qtdFuncionarios: 0,
        responsavel: newClientDraft.responsavel?.trim() || '',
        cargoResponsavel: '',
        email: newClientDraft.email?.trim() || '',
        telefone: newClientDraft.telefone?.trim() || '',
        whatsapp: newClientDraft.telefone?.trim() || '',
        site: '',
        endereco: '',
        status: 'Ativo',
        formaCobranca: newClientDraft.formaCobranca || 'Percentual do salário',
        comissaoNegociadaPercent: Number(newClientDraft.comissaoNegociadaPercent || 0),
        valorPadraoVaga: Number(newClientDraft.valorPadraoVaga || 0),
        prazoPagamentoDias: Number(newClientDraft.prazoPagamentoDias || 30),
        contratoAtivo: true,
        historico: [{ data: now.slice(0, 10), descricao: 'Cliente cadastrado durante o encaminhamento de contratação.', autor: user?.name || 'Usuário autenticado' }],
        reunioesCount: 0,
        pendenciasCount: 0,
        vagasCount: 0,
        criadoPor: user?.name || user?.email || 'Usuário autenticado',
        criadoEm: now.slice(0, 10),
        createdAt: now,
        updatedAt: now,
      }) as HeadhunterClient;
      await setDoc(doc(db, 'clientes_headhunter', id), newClient);
      setCompanyClients(current => [...current, newClient].sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia, 'pt-BR')));
      selectCommercialClient(newClient);
      setShowClientForm(false);
      setNewClientDraft({
        nomeFantasia: '', razaoSocial: '', cnpj: '', responsavel: '', email: '', telefone: '',
        comissaoNegociadaPercent: 0, valorPadraoVaga: 0, formaCobranca: 'Percentual do salário', prazoPagamentoDias: 30,
      });
    } catch (error) {
      console.error('[CLIENTES] Falha ao cadastrar cliente durante contratação', {
        operation: 'create', collection: 'clientes_headhunter', empresaId: tenant,
        uid: auth.currentUser?.uid || null, code: (error as any)?.code || null,
      });
      setClientsError(isPermissionDenied(error)
        ? 'Seu acesso não permite cadastrar clientes nesta empresa.'
        : 'Não foi possível cadastrar o cliente. Tente novamente.');
    } finally {
      setSavingClient(false);
    }
  };

  const handleSaveCommercialData = async () => {
    if (!detailsItem?.isHeadhunter || savingCommercial) return;
    // RH_UNIFIED_HIRING_FINALIZED_MODAL_ACTIONS_V1
    if (isHeadhunterProcessFinalized(detailsItem.cobDoc?.status || detailsItem.currentStatus || detailsItem.statusProcesso)) {
      setCommercialError('Esta contratação já foi finalizada. Os dados comerciais agora são somente para consulta.');
      return;
    }
    setCommercialError(null);
    if (!canForwardHeadhunterFinance) {
      setCommercialError('Seu usuário não possui permissão para encaminhar esta contratação ao Financeiro/Headhunter.');
      return;
    }
    setSavingCommercial(true);
    try {
      const tenant = activeCompanyId || detailsItem.empresaId || detailsItem.companyId || '';
      if (!tenant) throw new Error('TENANT_REQUIRED');
      const selectedClient = companyClients.find(client => client.id === commercialDraft.clienteId);
      if (!selectedClient) throw new Error('CLIENT_REQUIRED');
      if ((selectedClient.empresaId || selectedClient.companyId) !== tenant) throw new Error('CLIENT_TENANT_MISMATCH');
      const remuneracao = Number(commercialDraft.remuneracao || 0);
      const tipoCobranca = commercialDraft.tipoCobranca === 'FIXO' ? 'FIXO' : 'PERCENTUAL';
      const feePercentual = Number(commercialDraft.feePercentual || 0);
      const feeFixo = Number(commercialDraft.feeFixo || 0);
      if (remuneracao <= 0) throw new Error('REMUNERACAO_REQUIRED');
      if (tipoCobranca === 'PERCENTUAL' && feePercentual <= 0) throw new Error('FEE_PERCENT_REQUIRED');
      if (tipoCobranca === 'FIXO' && feeFixo <= 0) throw new Error('FEE_FIXED_REQUIRED');
      const valorCalculado = tipoCobranca === 'FIXO' ? feeFixo : remuneracao * feePercentual / 100;
      const result = await upsertBillingForHiring(
        { ...detailsItem, empresaId: tenant, companyId: tenant },
        {
          authenticatedEmpresaId: tenant,
          existing: detailsItem.cobDoc || null,
          commercial: {
            ...commercialDraft,
            clienteId: selectedClient.id,
            clienteNome: selectedClient.nomeFantasia || selectedClient.razaoSocial,
            clienteRazaoSocial: selectedClient.razaoSocial || '',
            clienteDocumento: selectedClient.cnpj || '',
            tipoCobranca,
            feeFixo,
            feeValor: valorCalculado,
          }
        }
      );
      if (!result.dadosCompletos) {
        setCommercialError('Informe cliente, remuneração e o percentual ou valor do fee para liberar a cobrança.');
      }
      setDetailsItem((current: any) => current ? {
        ...current,
        ...result.hiringPatch,
        cobDoc: result.billing,
        currentStatus: billingStatusLabel(result.status),
      } : current);
      setCobrancasMap(current => ({ ...current, [detailsItem.id]: { ...result.billing, id: result.billingId } }));
      setCommercialSuccess('Dados comerciais salvos e contratação encaminhada ao Financeiro/Headhunter.');
      setCommercialFlowMode(false);
    } catch (error) {
      console.error('[FINANCEIRO] Falha ao completar dados comerciais', {
        contratacaoId: detailsItem?.id,
        empresaId: activeCompanyId,
        uid: auth.currentUser?.uid || null,
        code: (error as any)?.code || null,
      });
      const code = error instanceof Error ? error.message : String(error);
      const validationMessages: Record<string, string> = {
        TENANT_REQUIRED: 'Não foi possível identificar a empresa desta contratação.',
        CLIENT_REQUIRED: 'Selecione um cliente cadastrado.',
        CLIENT_TENANT_MISMATCH: 'O cliente selecionado não pertence a esta empresa.',
        REMUNERACAO_REQUIRED: 'Informe a remuneração combinada.',
        FEE_PERCENT_REQUIRED: 'Informe o percentual do fee.',
        FEE_FIXED_REQUIRED: 'Informe o valor do fee fixo.',
        HEADHUNTER_FINANCE_PERMISSION_REQUIRED: 'Seu usuário não possui permissão para encaminhar esta contratação ao Financeiro/Headhunter.',
      };
      setCommercialError(validationMessages[code] || (isPermissionDenied(error)
        ? 'Seu acesso não permite atualizar esta contratação ou cobrança.'
        : 'Não foi possível salvar e encaminhar. Tente novamente.'));
    } finally {
      setSavingCommercial(false);
    }
  };

  // Auto-migration effect for old hires erroneously classified as DP when company lacks DP module
  useEffect(() => {
    if (activeCompanyId && hasHeadhunterModule && !hasDpModule) {
      JobCandidateService.migrateIncompatibleHirings(activeCompanyId)
        .then((res) => {
          if (res.migratedCount > 0) {
            console.log(`[MIGRAÇÃO AUTOMÁTICA] ${res.migratedCount} contratação(ões) migrada(s) para Financeiro/Headhunter:`, res.details);
          }
        })
        .catch((err) => {
          console.warn('[MIGRAÇÃO AUTOMÁTICA] Erro ao executar migração:', err);
        });
    }
  }, [activeCompanyId, hasHeadhunterModule, hasDpModule]);

  const vincularContratacaoEFinanceiro = async (hiring: any, financialId: string, billingData: any) => {
    const tenant = activeCompanyId || hiring.empresaId || hiring.companyId || '';
    if (!tenant) throw new Error('TENANT_REQUIRED');
    const hiringTenant = hiring.empresaId || hiring.companyId || hiring.tenantId || '';
    if (!isMaster && hiringTenant !== tenant) throw new Error('TENANT_MISMATCH');

    const now = new Date().toISOString();
    await setDoc(doc(db, 'contratacoes', hiring.id), sanitizeFirestoreData({
        empresaId: tenant,
        companyId: tenant,
        destino: 'Headhunter',
        destinoProcesso: 'Financeiro / Headhunter',
        statusProcesso: billingData?.status || 'Aguardando Cobrança',
        cobrancaId: financialId,
        financeiroId: financialId,
        encaminhadoFinanceiro: true,
        encaminhadoFinanceiroEm: now,
        updatedAt: now
      }), { merge: true });

    await setDoc(doc(db, 'financeiro_cobrancas', financialId), sanitizeFirestoreData({
        contratacaoId: hiring.id,
        applicationId: hiring.applicationId || hiring.candidaturaId || hiring.id,
        candidateId: hiring.candidateId || hiring.candidatoId,
        candidatoId: hiring.candidateId || hiring.candidatoId,
        jobId: hiring.jobId || hiring.vagaId,
        vagaId: hiring.jobId || hiring.vagaId,
        clientId: hiring.clientId || hiring.clienteId,
        empresaId: tenant,
        companyId: tenant,
        updatedAt: now
      }), { merge: true });
  };

  const localizarCobrancaPorContratacao = async (hiring: any): Promise<string | null> => {
    const contrId = hiring.id;
    const candId = hiring.candidateId || hiring.candidatoId;
    const jobId = hiring.jobId || hiring.vagaId;

    if (!activeCompanyId && !isMaster) throw new Error('TENANT_REQUIRED');
    const tenant = activeCompanyId || hiring.empresaId || hiring.companyId || '';

    // Toda consulta de coleção precisa declarar o tenant. Regras Firestore não
    // filtram resultados e recusam listagens sem empresaId.
    try {
      const q1 = query(
        collection(db, 'financeiro_cobrancas'),
        where('empresaId', '==', tenant),
        where('contratacaoId', '==', contrId)
      );
      const snap1 = await getDocs(q1);
      if (!snap1.empty) {
        const docFound = snap1.docs[0];
        const foundId = docFound.id;
        const foundData = docFound.data();
        await vincularContratacaoEFinanceiro(hiring, foundId, foundData);
        return foundId;
      }
    } catch (e) {
      if (isPermissionDenied(e)) throw e;
      console.warn('[FINANCEIRO] Erro na busca por contratacaoId:', e);
    }

    // Compatibilidade de leitura com receitas já persistidas pelo Financeiro.
    try {
      const q2 = query(
        collection(db, 'receitas'),
        where('empresaId', '==', tenant),
        where('contratacaoId', '==', contrId)
      );
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        const docFound = snap2.docs[0];
        const foundId = docFound.id;
        const foundData = docFound.data();
        await vincularContratacaoEFinanceiro(hiring, foundId, foundData);
        return foundId;
      }
    } catch (e) {
      if (isPermissionDenied(e)) throw e;
      console.warn('[FINANCEIRO] Erro na busca em receitas por contratacaoId:', e);
    }

    // 4. Query financeiro_cobrancas by candidateId + jobId
    if (candId && jobId) {
      try {
        const q3 = query(
          collection(db, 'financeiro_cobrancas'),
          where('empresaId', '==', tenant),
          where('candidateId', '==', candId),
          where('jobId', '==', jobId)
        );
        const snap3 = await getDocs(q3);
        if (!snap3.empty) {
          const docFound = snap3.docs[0];
          const foundId = docFound.id;
          const foundData = docFound.data();
          await vincularContratacaoEFinanceiro(hiring, foundId, foundData);
          return foundId;
        }
      } catch (e) {
        if (isPermissionDenied(e)) throw e;
        console.warn('[FINANCEIRO] Erro na busca por candidateId + jobId:', e);
      }
    }

    return null;
  };

  const handleOpenFinancial = async (hiring: any): Promise<void> => {
    if (openingFinancialId) return;
    setFinancialError(null);

    if (!hasHeadhunterFlow) {
      setFinancialError('Sua empresa não possui acesso aos módulos de Headhunter e Financeiro.');
      return;
    }

    const guardCobDoc = cobrancasMap[hiring.id]
      || cobrancasMap[`${hiring.jobId || hiring.vagaId}_${hiring.candidateId || hiring.candidatoId}`];
    const guardBillingStatus = guardCobDoc?.status || hiring.statusCobranca || hiring.statusFinanceiro || hiring.statusProcesso || hiring.statusEncaminhamento;
    if (isHeadhunterProcessFinalized(guardBillingStatus)) {
      setFinancialError('Esta contratação já foi finalizada e não pode ser reenviada ao Financeiro.');
      return;
    }

    const hiringOrigin = resolveExplicitProcessOrigin(hiring);
    if (!hiringOrigin) {
      console.error('[PROCESS_ORIGIN_MISSING]', { context: 'handleOpenFinancial', contratacaoId: hiring.id });
      setFinancialError('Esta contratação não possui origem definida. Corrija a origem da vaga antes de encaminhar.');
      return;
    }
    const isRh = hiringOrigin === 'RH_INTERNO';

    if (isRh) {
      console.warn('[FINANCEIRO GUARDS] Contratação de RH não pode ser enviada para o Financeiro. Redirecionando para DP.');
      return handleOpenAdmission(hiring);
    }

    setOpeningFinancialId(hiring.id);

    console.log("[FINANCEIRO] Abrindo cobrança:", {
      contratacaoId: hiring.id,
      financeiroId: hiring.financeiroId || hiring.cobrancaId,
      candidateId: hiring.candidateId || hiring.candidatoId,
      applicationId: hiring.applicationId || hiring.candidaturaId || hiring.id,
      jobId: hiring.jobId || hiring.vagaId,
      companyId: hiring.companyId || hiring.empresaId
    });

    try {
      const cobDoc = cobrancasMap[hiring.id] || cobrancasMap[`${hiring.jobId}_${hiring.candidateId}`] || cobrancasMap[`${hiring.jobId}_${hiring.candidatoId}`];
      const tenant = activeCompanyId || hiring.empresaId || hiring.companyId || '';
      const hiringTenant = hiring.empresaId || hiring.companyId || hiring.tenantId || '';
      if (!tenant) throw new Error('TENANT_REQUIRED');
      if (!isMaster && hiringTenant !== tenant) throw new Error('TENANT_MISMATCH');

      const linked = await upsertBillingForHiring(
        { ...hiring, empresaId: tenant, companyId: tenant },
        { existing: cobDoc || null, authenticatedEmpresaId: tenant }
      );
      const financialId = linked.billingId;

      localStorage.setItem('selectedFinancialId', financialId);
      localStorage.setItem('selectedBillingId', financialId);
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('selectedFinancialId', financialId);
        window.history.pushState({}, '', url.toString());
      } catch (err) {
        console.warn('Could not update window location params:', err);
      }

      if (onNavigateToTab) {
        onNavigateToTab('headhunter-financeiro', financialId);
      } else {
        window.location.hash = `headhunter-financeiro?id=${financialId}`;
      }
    } catch (error) {
      const technicalMessage = error instanceof Error ? error.message : String(error);
      console.error('[FINANCEIRO] Falha de autorização/persistência', {
        operation: 'get/list/create/update',
        collections: ['financeiro_cobrancas', 'receitas', 'contratacoes'],
        contratacaoPath: `contratacoes/${hiring.id}`,
        cobrancaPath: `financeiro_cobrancas/${hiring.financeiroId || hiring.cobrancaId || `cob_${hiring.id}`}`,
        uid: auth.currentUser?.uid || null,
        empresaId: activeCompanyId || null,
        role: user?.role || user?.tipoUsuario || null,
        code: (error as any)?.code || null,
        message: technicalMessage
      });
      setFinancialError(
        technicalMessage === 'TENANT_REQUIRED' || technicalMessage === 'TENANT_MISMATCH'
          ? 'Não foi possível confirmar o vínculo da sua empresa com esta contratação.'
          : 'Não foi possível abrir ou atualizar esta cobrança. Verifique seu acesso e tente novamente.'
      );
    } finally {
      setOpeningFinancialId(null);
    }
  };

  const vincularContratacaoEAdmissao = async (hiring: any, admissionId: string, admissionData: any) => {
    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'contratacoes', hiring.id), sanitizeFirestoreData({
        destino: 'DP',
        admissaoId: admissionId,
        statusAdmissao: admissionData?.status || 'Aguardando Admissão',
        encaminhadoAdmissao: true,
        encaminhadoAdmissaoEm: now,
        updatedAt: now
      }), { merge: true });

      await setDoc(doc(db, 'solicitacoes_admissao', admissionId), sanitizeFirestoreData({
        contratacaoId: hiring.id,
        applicationId: hiring.applicationId || hiring.candidaturaId || hiring.id,
        candidateId: hiring.candidateId || hiring.candidatoId,
        jobId: hiring.jobId || hiring.vagaId,
        companyId: hiring.companyId || hiring.empresaId || activeCompanyId || '',
        empresaId: hiring.companyId || hiring.empresaId || activeCompanyId || '',
        updatedAt: now
      }), { merge: true });
    } catch (err) {
      console.error('[ADMISSÃO] Erro ao salvar vínculo entre contratação e admissão:', err);
    }
  };

  const localizarAdmissaoPorContratacao = async (hiring: any): Promise<string | null> => {
    const contrId = hiring.id;
    const candId = hiring.candidateId || hiring.candidatoId;
    const jobId = hiring.jobId || hiring.vagaId;

    // 1. Direct doc lookup adm_${contrId}
    try {
      const directRef = doc(db, 'solicitacoes_admissao', `adm_${contrId}`);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        const foundId = directSnap.id;
        const foundData = directSnap.data();
        await vincularContratacaoEAdmissao(hiring, foundId, foundData);
        return foundId;
      }
    } catch (e) {
      console.warn('[ADMISSÃO] Erro na busca direta por ID:', e);
    }

    // 2. Query solicitacoes_admissao by contratacaoId
    try {
      const q1 = query(collection(db, 'solicitacoes_admissao'), where('contratacaoId', '==', contrId));
      const snap1 = await getDocs(q1);
      if (!snap1.empty) {
        const docFound = snap1.docs[0];
        const foundId = docFound.id;
        const foundData = docFound.data();
        await vincularContratacaoEAdmissao(hiring, foundId, foundData);
        return foundId;
      }
    } catch (e) {
      console.warn('[ADMISSÃO] Erro na busca por contratacaoId:', e);
    }

    // 3. Query solicitacoes_admissao by candidateId + jobId
    if (candId && jobId) {
      try {
        const q2 = query(
          collection(db, 'solicitacoes_admissao'),
          where('candidateId', '==', candId),
          where('jobId', '==', jobId)
        );
        const snap2 = await getDocs(q2);
        if (!snap2.empty) {
          const docFound = snap2.docs[0];
          const foundId = docFound.id;
          const foundData = docFound.data();
          await vincularContratacaoEAdmissao(hiring, foundId, foundData);
          return foundId;
        }
      } catch (e) {
        console.warn('[ADMISSÃO] Erro na busca por candidateId + jobId:', e);
      }

      try {
        const q3 = query(
          collection(db, 'solicitacoes_admissao'),
          where('candidatoId', '==', candId),
          where('vagaId', '==', jobId)
        );
        const snap3 = await getDocs(q3);
        if (!snap3.empty) {
          const docFound = snap3.docs[0];
          const foundId = docFound.id;
          const foundData = docFound.data();
          await vincularContratacaoEAdmissao(hiring, foundId, foundData);
          return foundId;
        }
      } catch (e) {
        console.warn('[ADMISSÃO] Erro na busca por candidatoId + vagaId:', e);
      }
    }

    return null;
  };

  const handleOpenAdmission = async (hiring: any): Promise<void> => {
    if (openingAdmissionId) return;

    if (!hasDpModule || !hasAdmissaoModule) {
      alert('Acesso não autorizado: Sua empresa não possui os módulos de Departamento Pessoal / Admissão contratados.');
      return;
    }

    const guardAdmDoc = admissoesMap[hiring.id]
      || admissoesMap[`${hiring.jobId || hiring.vagaId}_${hiring.candidateId || hiring.candidatoId}`];
    const guardAdmissionStatus = guardAdmDoc?.status || hiring.statusAdmissao || hiring.statusEncaminhamento || hiring.statusProcesso || hiring.status;
    if (isDpProcessFinalized(guardAdmissionStatus)) {
      alert('Esta contratação já foi finalizada no Departamento Pessoal.');
      return;
    }

    const hiringOrigin = resolveExplicitProcessOrigin(hiring);
    if (!hiringOrigin) {
      console.error('[PROCESS_ORIGIN_MISSING]', { context: 'handleOpenAdmission', contratacaoId: hiring.id });
      alert('Esta contratação não possui origem definida. Corrija a origem da vaga antes de encaminhar.');
      return;
    }
    const isHeadhunter = hiringOrigin === 'HEADHUNTER';

    if (isHeadhunter) {
      console.warn('[ADMISSÃO GUARDS] Contratação Headhunter não pode ser enviada para o DP. Redirecionando para o Financeiro.');
      return handleOpenFinancial(hiring);
    }

    setOpeningAdmissionId(hiring.id);

    console.log("[ADMISSÃO] Abrindo processo:", {
      contratacaoId: hiring.id,
      admissaoId: hiring.admissaoId,
      candidateId: hiring.candidateId || hiring.candidatoId,
      applicationId: hiring.applicationId || hiring.candidaturaId || hiring.id,
      jobId: hiring.jobId || hiring.vagaId,
      companyId: hiring.companyId || hiring.empresaId
    });

    try {
      const admDoc = admissoesMap[hiring.id] || admissoesMap[`${hiring.jobId}_${hiring.candidateId}`] || admissoesMap[`${hiring.jobId}_${hiring.candidatoId}`];
      
      let admissionId = hiring.admissaoId || admDoc?.id || `adm_${hiring.id}`;

      // Verify if admission doc exists, if not run locator
      const docRef = doc(db, 'solicitacoes_admissao', admissionId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const foundId = await localizarAdmissaoPorContratacao(hiring);
        if (foundId) {
          admissionId = foundId;
        } else {
          throw new Error("Não foi possível localizar a solicitação de admissão desta contratação.");
        }
      } else {
        await vincularContratacaoEAdmissao(hiring, admissionId, docSnap.data());
      }

      localStorage.setItem('selectedAdmissionId', admissionId);
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('selectedAdmissionId', admissionId);
        window.history.pushState({}, '', url.toString());
      } catch (err) {
        console.warn('Could not update window location params:', err);
      }

      if (onNavigateToTab) {
        onNavigateToTab('admissoes', admissionId);
      } else {
        window.location.hash = `admissoes?id=${admissionId}`;
      }
    } catch (error) {
      console.error("[ADMISSÃO] Erro ao abrir:", error);
      alert(error instanceof Error ? error.message : "Erro ao abrir a admissão.");
    } finally {
      setOpeningAdmissionId(null);
    }
  };

  // Real-time Firestore subscription to 'contratacoes', 'solicitacoes_admissao', and 'financeiro_cobrancas'
  useEffect(() => {
    setLoading(true);
    let q;
    if (isMaster || !activeCompanyId) {
      q = query(collection(db, 'contratacoes'));
    } else {
      q = query(collection(db, 'contratacoes'), where('empresaId', '==', activeCompanyId));
    }

    const unsubscribeHirings = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setFirestoreHirings(list);
        setLoading(false);
      },
      (err) => {
        console.error('Erro ao buscar contratações no Firestore:', err);
        setLoading(false);
      }
    );

    // DP só é consultado quando o módulo-pai Departamento Pessoal está ativo.
    let unsubscribeAdm = () => undefined;
    if (hasDpModule) {
      const qAdm = isMaster || !activeCompanyId
        ? query(collection(db, 'solicitacoes_admissao'))
        : query(collection(db, 'solicitacoes_admissao'), where('empresaId', '==', activeCompanyId));
      unsubscribeAdm = onSnapshot(qAdm, (snap) => {
        const map: Record<string, any> = {};
        snap.docs.forEach(d => {
          const data = d.data();
          const record = { id: d.id, ...data };
          if (data.contratacaoId) map[data.contratacaoId] = record;
          if (data.candidatoId && data.jobId) map[`${data.jobId}_${data.candidatoId}`] = record;
          if (data.candidateId && data.jobId) map[`${data.jobId}_${data.candidateId}`] = record;
          map[d.id] = record;
        });
        setAdmissoesMap(map);
      }, err => console.warn('Aviso subscription solicitacoes_admissao:', err));
    } else {
      setAdmissoesMap({});
    }

    // Subscribe to financeiro_cobrancas for Headhunter Financeiro status sync
    let unsubscribeCob = () => undefined;
    if (hasHeadhunterFlow && canViewHeadhunterFinance) {
      const qCob = isMaster || !activeCompanyId
        ? query(collection(db, 'financeiro_cobrancas'))
        : query(collection(db, 'financeiro_cobrancas'), where('empresaId', '==', activeCompanyId));
      unsubscribeCob = onSnapshot(qCob, (snap) => {
        const map: Record<string, any> = {};
        snap.docs.forEach(d => {
          const data = d.data();
          const record = { id: d.id, ...data };
          if (data.contratacaoId) map[data.contratacaoId] = record;
          if (data.candidatoId && data.jobId) map[`${data.jobId}_${data.candidatoId}`] = record;
          map[d.id] = record;
        });
        setCobrancasMap(map);
      }, err => console.warn('Aviso subscription financeiro_cobrancas:', err));
    } else {
      setCobrancasMap({});
    }

    return () => {
      unsubscribeHirings();
      unsubscribeAdm();
      unsubscribeCob();
    };
  }, [activeCompanyId, isMaster, canViewHeadhunterFinance, hasDpModule, hasHeadhunterModule, hasHeadhunterFlow]);

  // Combine Firestore list with prop list fallback
  const sourceList = firestoreHirings.length > 0 ? firestoreHirings : hirings;
  const rawList = sourceList.filter(h => {
    const origin = resolveExplicitProcessOrigin(h);
    return origin !== 'HEADHUNTER' || hasHeadhunterFlow;
  });

  // Format date helper
  const formatDate = (isoOrStr?: string) => {
    if (!isoOrStr) return 'Recente';
    try {
      const date = new Date(isoOrStr);
      if (isNaN(date.getTime())) return isoOrStr;
      return date.toLocaleDateString('pt-BR');
    } catch {
      return isoOrStr;
    }
  };

  const isHeadhunterView = origemProcesso === 'headhunter';

  // Calculate KPIs
  const totalContratacoes = rawList.length;
  const rhHirings = hasDpModule
    ? rawList.filter(h => resolveExplicitProcessOrigin(h) === 'RH_INTERNO')
    : [];

  const headhunterHirings = hasHeadhunterFlow
    ? rawList.filter(h => resolveExplicitProcessOrigin(h) === 'HEADHUNTER')
    : [];

  const filteredList = rawList.filter(h => {
    const isHead = resolveExplicitProcessOrigin(h) === 'HEADHUNTER';

    // Empresa Headhunter não enxerga registros DP; empresa DP não enxerga Headhunter.
    if (hasHeadhunterModule && !hasDpModule && !isHead) return false;
    if (hasDpModule && !hasHeadhunterModule && isHead) return false;

    const admDoc = admissoesMap[h.id] || admissoesMap[`${h.jobId || h.vagaId}_${h.candidateId || h.candidatoId}`];
    const cobDoc = cobrancasMap[h.id] || cobrancasMap[`${h.jobId || h.vagaId}_${h.candidateId || h.candidatoId}`];

    const rawBillingStatus = cobDoc?.status || h.statusCobranca || h.statusFinanceiro || h.statusProcesso;
    const canonicalBillingStatus = normalizeHeadhunterBillingStatus(rawBillingStatus);
    const currentStatus = isHead
      ? billingStatusLabel(canonicalBillingStatus)
      : (admDoc?.status || h.statusAdmissao || h.statusEncaminhamento || h.statusProcesso || h.status || 'Aguardando Admissão');

    const statusLower = String(currentStatus).toLowerCase();

    if (filterTab === 'DP') return !isHead;
    if (filterTab === 'HEADHUNTER') return isHead && matchesHeadhunterHiringTab('HEADHUNTER', canonicalBillingStatus);
    if (filterTab === 'AGUARDANDO_ADMISSAO') return !isHead && statusLower.includes('admissão');
    if (filterTab === 'AGUARDANDO_COBRANCA') return isHead && matchesHeadhunterHiringTab('AGUARDANDO_COBRANCA', canonicalBillingStatus);
    if (filterTab === 'FINALIZADAS') {
      return isHead
        ? isHeadhunterProcessFinalized(rawBillingStatus)
        : isDpProcessFinalized(currentStatus);
    }

    return true;
  });

  const selectedCommercialClient = companyClients.find(client => client.id === commercialDraft.clienteId);
  const remunerationValue = Number(commercialDraft.remuneracao || 0);
  const calculatedFee = commercialDraft.tipoCobranca === 'FIXO'
    ? Number(commercialDraft.feeFixo || 0)
    : remunerationValue * Number(commercialDraft.feePercentual || 0) / 100;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isHeadhunterView ? 'Histórico de Contratações & Headhunter' : 'Central Única de Contratações'}
            </h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
              {totalContratacoes} {totalContratacoes === 1 ? 'contratação' : 'contratações'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {hasHeadhunterFlow
              ? 'Central única de acompanhamento automático das contratações. Os processos são sincronizados em tempo real com o Departamento Pessoal ou Financeiro.'
              : 'Central única de acompanhamento automático das contratações. Os processos são sincronizados em tempo real com o Departamento Pessoal.'}
          </p>
        </div>
      </div>

      {financialError && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="font-semibold">{financialError}</span>
          </div>
          <button type="button" onClick={() => setFinancialError(null)} className="rounded-lg p-1 text-red-700 hover:bg-red-100" aria-label="Fechar mensagem">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className={`grid grid-cols-1 ${hasDpModule && hasHeadhunterFlow ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Total de Contratações</span>
          <p className="text-2xl font-black text-slate-900">{totalContratacoes}</p>
          <span className="text-[10px] text-slate-400 font-medium">Contratações concluídas</span>
        </div>

        {hasDpModule && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Encaminhadas para DP</span>
            <p className="text-2xl font-black text-emerald-600">{rhHirings.length}</p>
            <span className="text-[10px] text-emerald-600 font-bold">Fluxo RH / Departamento Pessoal</span>
          </div>
        )}

        {hasHeadhunterFlow && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Encaminhadas para Financeiro</span>
            <p className="text-2xl font-black text-indigo-600">{headhunterHirings.length}</p>
            <span className="text-[10px] text-indigo-600 font-bold">Fluxo Headhunter / Faturamento</span>
          </div>
        )}
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        {[
          { id: 'TODAS', label: 'Todas', count: rawList.length },
          ...(showOriginTabs && hasDpModule ? [{ id: 'DP', label: 'Departamento Pessoal', count: rhHirings.length }] : []),
          ...(showOriginTabs && hasHeadhunterFlow ? [{ id: 'HEADHUNTER', label: 'Financeiro / Headhunter', count: headhunterHirings.length }] : []),
          ...(hasDpModule ? [{ id: 'AGUARDANDO_ADMISSAO', label: 'Aguardando Admissão' }] : []),
          ...(hasHeadhunterFlow ? [{ id: 'AGUARDANDO_COBRANCA', label: 'Aguardando Cobrança' }] : []),
          { id: 'FINALIZADAS', label: 'Finalizadas' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterTab(tab.id as any)}
            className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              filterTab === tab.id
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                filterTab === tab.id ? 'bg-slate-100 text-slate-800 font-bold' : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mr-2" />
          <span className="text-xs text-slate-600 font-bold">Carregando registro de contratações...</span>
        </div>
      )}

      {/* Hirings Cards List */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.length === 0 ? (
            <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs font-medium">
              Nenhuma contratação encontrada para o filtro selecionado.
            </div>
          ) : (
            filteredList.map(h => {
              const itemKey = h.id;
              const processOrigin = resolveExplicitProcessOrigin(h);
              if (!processOrigin) {
                console.error('[PROCESS_ORIGIN_MISSING]', { context: 'UnifiedContratacoesView', contratacaoId: h.id });
              }
              const isHeadhunter = processOrigin === 'HEADHUNTER';
              const isDpHiring = canSendToAdmission(h);
              
              // Sincronização automática em tempo real dos status dos módulos DP e Financeiro
              const admDoc = admissoesMap[h.id] || admissoesMap[`${h.jobId}_${h.candidateId}`] || admissoesMap[`${h.jobId}_${h.candidatoId}`];
              const cobDoc = cobrancasMap[h.id] || cobrancasMap[`${h.jobId}_${h.candidateId}`] || cobrancasMap[`${h.jobId}_${h.candidatoId}`];

              const name = h.candidatoNome || h.candidateName || 'Candidato';
              const job = h.vagaTitulo || h.jobTitle || h.cargo || 'Vaga Corporativa';
              const dateStr = formatDate(h.contratadoEm || h.dataContratacao || h.createdAt);
              const salary = Number(h.salarioContratado || h.salarioFinal || h.salario || 0);

              const currentStatus = isHeadhunter
                ? billingStatusLabel(cobDoc?.status || h.statusFinanceiro || h.statusProcesso || h.statusEncaminhamento)
                : (admDoc?.status || h.statusAdmissao || h.statusEncaminhamento || h.statusProcesso || h.status || 'Aguardando Admissão');

              const processFinalized = isHeadhunter
                ? isHeadhunterProcessFinalized(cobDoc?.status || h.statusCobranca || h.statusFinanceiro || h.statusProcesso || h.statusEncaminhamento)
                : isDpProcessFinalized(currentStatus);

              const destinationLabel = isHeadhunter ? 'Financeiro / Headhunter' : 'Departamento Pessoal';

              return (
                <div key={itemKey} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Card Verde: Contratação Concluída */}
                    <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-emerald-950">Contratação concluída</h4>
                          <p className="text-[11px] font-medium text-emerald-700">
                            Data: <strong className="text-emerald-900">{dateStr}</strong>
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Contratado
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-black text-slate-900">{name}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Cargo/Vaga: <strong className="text-slate-800">{job}</strong>
                        {h.clienteNome && <span> | Cliente: <strong className="text-slate-800">{h.clienteNome}</strong></span>}
                      </p>
                    </div>

                    {/* Origem e Destino do Processo */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl text-xs border border-slate-100">
                      <div>
                        <span className="text-slate-400 font-medium block">Destino</span>
                        <strong className="text-slate-800 font-bold block mt-0.5">
                          {destinationLabel}
                        </strong>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium block">Status do Processo</span>
                        <span className={`inline-block px-2 py-0.5 mt-0.5 text-[10px] font-extrabold rounded-md ${
                          isHeadhunter 
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {currentStatus}
                        </span>
                      </div>

                      <div className="col-span-2 pt-1 border-t border-slate-100/60 flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Remuneração:</span>
                        <strong className="text-slate-800 font-bold">
                          {salary > 0 ? `R$ ${salary.toLocaleString('pt-BR')}` : 'Não informada'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 gap-2">
                    <button
                      onClick={() => openHiringDetails(h, admDoc, cobDoc, currentStatus, isHeadhunter)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver detalhes</span>
                    </button>

                    {/* Botão de Encaminhamento Direto para o Módulo Correto */}
                    {!processFinalized && (isHeadhunter ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!canForwardHeadhunterFinance) {
                            setFinancialError('Seu usuário não possui permissão para encaminhar contratações ao Financeiro/Headhunter.');
                            return;
                          }
                          openHiringDetails(h, admDoc, cobDoc, currentStatus, isHeadhunter, true);
                        }}
                        disabled={openingFinancialId === h.id || !canForwardHeadhunterFinance}
                        title={!canForwardHeadhunterFinance ? 'Permissão headhunter.financeiro.encaminhar necessária' : undefined}
                        className="px-4 py-2 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white"
                      >
                        {openingFinancialId === h.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Abrindo...</span>
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Finalizar Dados Comerciais</span>
                            <ArrowRight className="w-3 h-3 ml-0.5" />
                          </>
                        )}
                      </button>
                    ) : isDpHiring ? (
                      <button
                        type="button"
                        onClick={() => handleOpenAdmission(h)}
                        disabled={openingAdmissionId === h.id}
                        className="px-4 py-2 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white"
                      >
                        {openingAdmissionId === h.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Abrindo...</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Abrir Admissão</span>
                            <ArrowRight className="w-3 h-3 ml-0.5" />
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 font-bold text-amber-800">
                        Origem não informada
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL: Detalhes da Contratação & Auditoria Timeline */}
      {detailsItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {commercialFlowMode ? 'Dados Comerciais' : 'Detalhes & Linha do Tempo'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {commercialFlowMode
                      ? 'Selecione o cliente e confirme as condições antes de encaminhar.'
                      : 'Registro unificado de auditoria da contratação'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setDetailsItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Candidato</span>
                <strong className="text-slate-900 font-bold text-sm block mt-0.5">
                  {detailsItem.candidatoNome || detailsItem.candidateName}
                </strong>
                {detailsItem.cpf && <span className="text-slate-400 text-[10px]">CPF: {detailsItem.cpf}</span>}
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Vaga / Cargo</span>
                <strong className="text-slate-900 font-bold text-sm block mt-0.5">
                  {detailsItem.vagaTitulo || detailsItem.jobTitle}
                </strong>
                {detailsItem.department && <span className="text-slate-400 text-[10px]">Depto: {detailsItem.department}</span>}
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Data da Contratação</span>
                <strong className="text-slate-900 font-bold block mt-0.5">
                  {formatDate(detailsItem.contratadoEm || detailsItem.dataContratacao || detailsItem.createdAt)}
                </strong>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Remuneração Combinada</span>
                <strong className="text-emerald-700 font-black block mt-0.5">
                  {detailsItem.salarioContratado || detailsItem.salarioFinal
                    ? `R$ ${Number(detailsItem.salarioContratado || detailsItem.salarioFinal).toLocaleString('pt-BR')}`
                    : 'Não informada'}
                </strong>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Origem do Processo</span>
                <strong className="text-slate-900 font-bold block mt-0.5 capitalize">
                  {detailsItem.isHeadhunter
                    ? 'Headhunter'
                    : canSendToAdmission(detailsItem)
                      ? 'RH Interno / Empresa'
                      : 'Origem não informada'}
                </strong>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium block">Destino & Status Atual</span>
                <strong className="text-indigo-700 font-bold block mt-0.5">
                  {detailsItem.currentStatus}
                </strong>
              </div>
            </div>

            {detailsItem.isHeadhunter && !isHeadhunterProcessFinalized(detailsItem.cobDoc?.status || detailsItem.currentStatus || detailsItem.statusProcesso) && (
              <div className="space-y-3 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950">Cliente e condições comerciais</h4>
                  <p className="mt-1 text-[11px] text-indigo-700">O cliente é selecionado pelo nome e o identificador real é vinculado internamente.</p>
                </div>
                <div className="space-y-3 text-xs">
                  <label className="space-y-1 font-bold text-slate-700">
                    <span>Cliente de destino *</span>
                    <select
                      value={commercialDraft.clienteId || ''}
                      onChange={event => {
                        const client = companyClients.find(item => item.id === event.target.value);
                        if (client) selectCommercialClient(client);
                        else setCommercialDraft(current => ({ ...current, clienteId: '', clienteNome: '' }));
                      }}
                      disabled={clientsLoading}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 disabled:opacity-60"
                    >
                      <option value="">{clientsLoading ? 'Carregando clientes...' : 'Selecionar cliente'}</option>
                      {companyClients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.nomeFantasia || client.razaoSocial}{client.status ? ` — ${client.status}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>

                  {!clientsLoading && companyClients.length === 0 && !clientsError && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                      <p className="font-bold">Nenhum cliente cadastrado.</p>
                      <button type="button" onClick={() => setShowClientForm(true)} className="mt-2 rounded-lg bg-amber-600 px-3 py-2 font-extrabold text-white hover:bg-amber-700">
                        + Cadastrar cliente
                      </button>
                    </div>
                  )}

                  {companyClients.length > 0 && (
                    <button type="button" onClick={() => setShowClientForm(current => !current)} className="font-extrabold text-indigo-700 hover:text-indigo-900">
                      + Cadastrar cliente
                    </button>
                  )}

                  {clientsError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-2.5 font-semibold text-red-800">{clientsError}</p>}

                  {showClientForm && (
                    <form onSubmit={handleCreateClientInline} className="space-y-3 rounded-xl border border-indigo-200 bg-white p-3">
                      <div className="flex items-center justify-between">
                        <strong className="text-indigo-950">Cadastrar novo cliente</strong>
                        <button type="button" onClick={() => setShowClientForm(false)} className="text-slate-500" aria-label="Fechar cadastro de cliente"><X className="h-4 w-4" /></button>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <input required value={newClientDraft.nomeFantasia} onChange={e => setNewClientDraft(v => ({ ...v, nomeFantasia: e.target.value }))} className="rounded-lg border border-slate-200 p-2" placeholder="Nome do cliente *" />
                        <input required value={newClientDraft.razaoSocial} onChange={e => setNewClientDraft(v => ({ ...v, razaoSocial: e.target.value }))} className="rounded-lg border border-slate-200 p-2" placeholder="Razão social *" />
                        <input value={newClientDraft.cnpj} onChange={e => setNewClientDraft(v => ({ ...v, cnpj: e.target.value }))} className="rounded-lg border border-slate-200 p-2" placeholder="CNPJ/CPF" />
                        <input value={newClientDraft.responsavel} onChange={e => setNewClientDraft(v => ({ ...v, responsavel: e.target.value }))} className="rounded-lg border border-slate-200 p-2" placeholder="Responsável" />
                        <input type="email" value={newClientDraft.email} onChange={e => setNewClientDraft(v => ({ ...v, email: e.target.value }))} className="rounded-lg border border-slate-200 p-2" placeholder="E-mail" />
                        <input value={newClientDraft.telefone} onChange={e => setNewClientDraft(v => ({ ...v, telefone: e.target.value }))} className="rounded-lg border border-slate-200 p-2" placeholder="Telefone" />
                        <select value={newClientDraft.formaCobranca} onChange={e => setNewClientDraft(v => ({ ...v, formaCobranca: e.target.value }))} className="rounded-lg border border-slate-200 p-2">
                          <option value="Percentual do salário">Fee percentual</option>
                          <option value="Valor fixo">Fee fixo</option>
                        </select>
                        {getClientBillingType(newClientDraft) === 'PERCENTUAL' ? (
                          <input type="number" min="0" step="0.01" value={newClientDraft.comissaoNegociadaPercent || ''} onChange={e => setNewClientDraft(v => ({ ...v, comissaoNegociadaPercent: Number(e.target.value) }))} className="rounded-lg border border-slate-200 p-2" placeholder="Fee percentual (%)" />
                        ) : (
                          <input type="number" min="0" step="0.01" value={newClientDraft.valorPadraoVaga || ''} onChange={e => setNewClientDraft(v => ({ ...v, valorPadraoVaga: Number(e.target.value) }))} className="rounded-lg border border-slate-200 p-2" placeholder="Fee fixo (R$)" />
                        )}
                      </div>
                      <button type="submit" disabled={savingClient} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 font-extrabold text-white disabled:opacity-50">
                        {savingClient && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Salvar cliente e continuar
                      </button>
                    </form>
                  )}

                  {selectedCommercialClient && (
                    <div className="grid grid-cols-1 gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 sm:grid-cols-2">
                      <div><span className="text-slate-500">Nome</span><strong className="block text-slate-900">{selectedCommercialClient.nomeFantasia || selectedCommercialClient.razaoSocial}</strong></div>
                      <div><span className="text-slate-500">Razão social</span><strong className="block text-slate-900">{selectedCommercialClient.razaoSocial || 'Não informada'}</strong></div>
                      <div><span className="text-slate-500">CNPJ/CPF</span><strong className="block text-slate-900">{selectedCommercialClient.cnpj || 'Não informado'}</strong></div>
                      <div><span className="text-slate-500">Responsável</span><strong className="block text-slate-900">{selectedCommercialClient.responsavel || 'Não informado'}</strong></div>
                      <div><span className="text-slate-500">E-mail</span><strong className="block break-all text-slate-900">{selectedCommercialClient.email || 'Não informado'}</strong></div>
                      <div><span className="text-slate-500">Telefone</span><strong className="block text-slate-900">{selectedCommercialClient.telefone || selectedCommercialClient.whatsapp || 'Não informado'}</strong></div>
                      <div><span className="text-slate-500">Status</span><strong className="block text-emerald-800">{selectedCommercialClient.status || 'Não informado'}</strong></div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1 font-bold text-slate-700">
                    <span>Remuneração combinada (R$) *</span>
                    <input type="number" min="0" step="0.01" value={commercialDraft.remuneracao || ''} onChange={e => setCommercialDraft(v => ({ ...v, remuneracao: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-200 bg-white p-2.5" />
                  </label>
                  <label className="space-y-1 font-bold text-slate-700">
                    <span>Tipo de cobrança *</span>
                    <select disabled={!canEditCommercialRules} value={commercialDraft.tipoCobranca || 'PERCENTUAL'} onChange={e => setCommercialDraft(v => ({ ...v, tipoCobranca: e.target.value, feeValor: 0 }))} className="w-full rounded-xl border border-slate-200 bg-white p-2.5 disabled:bg-slate-100">
                      <option value="PERCENTUAL">Fee percentual</option>
                      <option value="FIXO">Fee fixo</option>
                    </select>
                  </label>
                  {commercialDraft.tipoCobranca !== 'FIXO' ? (
                  <label className="space-y-1 font-bold text-slate-700">
                    <span>Fee percentual (%)</span>
                    <input disabled={!canEditCommercialRules} type="number" min="0" step="0.01" value={commercialDraft.feePercentual || ''} onChange={e => setCommercialDraft(v => ({ ...v, feePercentual: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-200 bg-white p-2.5 disabled:bg-slate-100" />
                  </label>
                  ) : (
                  <label className="space-y-1 font-bold text-slate-700">
                    <span>Fee fixo (R$)</span>
                    <input disabled={!canEditCommercialRules} type="number" min="0" step="0.01" value={commercialDraft.feeFixo || ''} onChange={e => setCommercialDraft(v => ({ ...v, feeFixo: Number(e.target.value) }))} className="w-full rounded-xl border border-slate-200 bg-white p-2.5 disabled:bg-slate-100" />
                  </label>
                  )}
                  <div className="rounded-xl border border-indigo-200 bg-indigo-100/70 p-2.5">
                    <span className="font-bold text-indigo-700">Valor calculado</span>
                    <strong className="mt-1 block text-base font-black text-indigo-950">{calculatedFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                  </div>
                  <label className="space-y-1 font-bold text-slate-700">
                    <span>Vencimento</span>
                    <input type="date" value={commercialDraft.dataVencimento || ''} onChange={e => setCommercialDraft(v => ({ ...v, dataVencimento: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white p-2.5" />
                  </label>
                  <label className="space-y-1 font-bold text-slate-700 sm:col-span-2">
                    <span>Observações comerciais</span>
                    <textarea rows={3} value={commercialDraft.observacoesComerciais || ''} onChange={e => setCommercialDraft(v => ({ ...v, observacoesComerciais: e.target.value }))} className="w-full resize-none rounded-xl border border-slate-200 bg-white p-2.5" placeholder="Condições, exceções ou instruções para cobrança" />
                  </label>
                  </div>
                </div>
                {commercialError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-800">{commercialError}</p>}
                {commercialSuccess && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-semibold text-emerald-800">{commercialSuccess}</p>}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-indigo-900">Status: {detailsItem.currentStatus}</span>
                  <button type="button" onClick={handleSaveCommercialData} disabled={savingCommercial || !canForwardHeadhunterFinance} title={!canForwardHeadhunterFinance ? 'Permissão headhunter.financeiro.encaminhar necessária' : undefined} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-indigo-700 disabled:opacity-50">
                    {savingCommercial && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Salvar e Encaminhar ao Cliente
                  </button>
                </div>
              </div>
            )}

            {/* Linha do Tempo e Auditoria Sincronizada */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <History className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Histórico de Auditoria & Timeline Sincronizada</h4>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {/* Timeline unificada */}
                {[
                  ...(detailsItem.timeline || []),
                  ...(detailsItem.admDoc?.historicoEtapas || []).map((e: any) => ({
                    id: e.id || `adm-evt-${e.dataHora}`,
                    title: e.acao || 'Atualização DP',
                    description: e.descricao || `Status: ${e.novoStatus || 'Sincronizado'}`,
                    date: e.dataHora ? e.dataHora.replace('T', ' ').substring(0, 16) : 'Recente',
                    by: e.usuario || 'Departamento Pessoal'
                  })),
                  ...(detailsItem.cobDoc?.historicoStatus || []).map((e: any) => ({
                    id: e.id || `cob-evt-${e.dataHora}`,
                    title: 'Atualização Financeiro',
                    description: e.descricao || `Status: ${e.novoStatus}`,
                    date: e.dataHora ? e.dataHora.replace('T', ' ').substring(0, 16) : 'Recente',
                    by: e.usuario || 'Financeiro'
                  }))
                ].length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Sem registros adicionais na linha do tempo.</p>
                ) : (
                  [
                    ...(detailsItem.timeline || []),
                    ...(detailsItem.admDoc?.historicoEtapas || []).map((e: any) => ({
                      id: e.id || `adm-evt-${e.dataHora}`,
                      title: e.acao || 'Atualização DP',
                      description: e.descricao || `Status: ${e.novoStatus || 'Sincronizado'}`,
                      date: e.dataHora ? e.dataHora.replace('T', ' ').substring(0, 16) : 'Recente',
                      by: e.usuario || 'Departamento Pessoal'
                    })),
                    ...(detailsItem.cobDoc?.historicoStatus || []).map((e: any) => ({
                      id: e.id || `cob-evt-${e.dataHora}`,
                      title: 'Atualização Financeiro',
                      description: e.descricao || `Status: ${e.novoStatus}`,
                      date: e.dataHora ? e.dataHora.replace('T', ' ').substring(0, 16) : 'Recente',
                      by: e.usuario || 'Financeiro'
                    }))
                  ].map((evt: any, idx: number) => (
                    <div key={evt.id || idx} className="flex gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 items-start">
                      <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                      <div className="space-y-0.5 flex-1">
                        <div className="flex justify-between items-center">
                          <strong className="text-slate-900 font-bold">{evt.title}</strong>
                          <span className="text-[10px] text-slate-400">{evt.date}</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{evt.description}</p>
                        {evt.by && <span className="text-[10px] text-slate-400 block">Por: {evt.by}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailsItem(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
