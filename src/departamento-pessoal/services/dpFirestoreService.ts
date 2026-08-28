import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  serverTimestamp 
} from '../../firebase/firestore';
import { db } from '../../lib/firebase';
import { auth } from '../../lib/firebase';
import { sanitizeFirestoreData } from '../../lib/firestoreUtils';
import { 
  ColaboradorCompleto, 
  EstadoCivil,
  ItemBeneficio, 
  BeneficioColaboradorIndividual,
  HistoricoAlteracaoBeneficio,
  AnotacaoInternaColaborador,
  StatusBeneficioIndividual,
  RegistroFeriasColaborador, 
  PeriodoAquisitivoFerias,
  RegraFeriasEmpresa,
  CalculoRescisorio, 
  AfastamentoColaborador, 
  DadosCat,
  DadosInss,
  DadosRetornoTrabalho,
  AlertaDp,
  DocumentoColaborador, 
  AjustePontoColaborador, 
  HistoricoEventoColaborador, 
  AdmissaoPending, 
  ConfiguracoesTrabalhistas,
  UnidadeOrganizacional,
  CargoSalarioItem
} from '../types/dp';
import {
  SolicitacaoPortalItem,
  ChamadoSuporteItem,
  ComunicadoItem,
  DocumentoAssinaturaItem
} from '../types/portalTypes';
import { 
  DEFAULT_CONFIG_TRABALHISTA 
} from '../data/dpDefaults';
import { N8nService } from '../../services/N8nService';

// Firestore Collection Constants
export const DP_COLLECTIONS = {
  COLABORADORES: 'colaboradores',
  CONTRATOS: 'contratos_trabalho',
  JORNADAS: 'jornadas',
  MARCACOES_PONTO: 'marcacoes_ponto',
  AJUSTES_PONTO: 'ajustes_ponto',
  BANCO_HORAS: 'banco_horas',
  BENEFICIOS: 'beneficios_colaboradores',
  BENEFICIOS_CATALOGO: 'beneficios_catalogo',
  EMPLOYEE_BENEFITS: 'employee_benefits',
  HISTORICO_BENEFICIOS: 'historico_beneficios',
  ANOTACOES_INTERNAS: 'anotacoes_internas_colaborador',
  FERIAS: 'ferias',
  PERIODOS_AQUISITIVOS: 'periodos_aquisitivos',
  REGRAS_FERIAS: 'regras_ferias',
  AFASTAMENTOS: 'afastamentos',
  CAT: 'cat_registros',
  INSS: 'inss_processos',
  RETORNO_TRABALHO: 'retorno_trabalho',
  ALERTAS: 'alertas_dp',
  AUDIT_LOGS: 'audit_logs',
  DOCUMENTOS: 'documentos_colaboradores',
  FOLHAS: 'folhas_pagamento',
  RESCISOES: 'rescisoes',
  HISTORICO: 'historico_colaborador',
  ADMISSOES: 'solicitacoes_admissao',
  CONFIGURACÕES: 'configuracoes_trabalhistas',
  SOLICITACOES_PORTAL: 'solicitacoes_portal',
  CHAMADOS_SUPORTE: 'chamados_suporte',
  COMUNICADOS: 'comunicados_empresa',
  DOCUMENTOS_ASSINATURA: 'documentos_assinatura_portal',
  ORGANOGRAMA: 'organograma_empresa',
  CARGOS: 'cargos_salarios'
} as const;

/**
 * Normaliza o ID do cliente/empresa
 */
function normalizeCompanyId(companyId?: string): string {
  const normalized = companyId?.trim();
  if (!normalized) throw new Error('empresaId é obrigatório para operações do Departamento Pessoal.');
  return normalized;
}

// ==========================================
// 1. COLABORADORES
// ==========================================

export async function getColaboradoresFirestore(companyId: string): Promise<ColaboradorCompleto[]> {
  const empId = normalizeCompanyId(companyId);
  try {
    const q = query(
      collection(db, DP_COLLECTIONS.COLABORADORES),
      where('companyId', '==', empId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    const list: ColaboradorCompleto[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as ColaboradorCompleto);
    });
    return list;
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar colaboradores:', error);
    return [];
  }
}

export async function saveColaboradorFirestore(colaborador: ColaboradorCompleto): Promise<void> {
  try {
    const companyId = normalizeCompanyId(colaborador.companyId);
    const docRef = doc(db, DP_COLLECTIONS.COLABORADORES, colaborador.id);
    const sanitized = sanitizeFirestoreData({
      ...colaborador,
      companyId,
      empresaId: companyId,
      status: colaborador.profissionais?.status || 'Ativo',
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, sanitized, { merge: true });

    // Registra evento no Histórico Único
    await addHistoricoEventoFirestore({
      empresaId: colaborador.companyId,
      colaboradorId: colaborador.id,
      moduloOrigem: 'Colaboradores',
      tipoEvento: 'Atualização Cadastral',
      descricao: `Dados do colaborador ${colaborador.nomeCompleto} atualizados no cadastro principal.`,
      dataHora: new Date().toISOString()
    });
  } catch (error) {
    console.error('[DP Firestore] Erro ao salvar colaborador:', error);
    throw error;
  }
}

// ==========================================
// 2. ADMISSÕES & INTEGRAÇÃO RECRUTAMENTO -> DP
// ==========================================

export async function getAdmissoesPendenteFirestore(companyId: string): Promise<AdmissaoPending[]> {
  const empId = normalizeCompanyId(companyId);
  try {
    const q = query(
      collection(db, DP_COLLECTIONS.ADMISSOES),
      where('empresaId', '==', empId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    const list: AdmissaoPending[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as AdmissaoPending);
    });
    return list;
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar admissões:', error);
    return [];
  }
}

export async function saveAdmissaoFirestore(admissao: AdmissaoPending): Promise<void> {
  const RH_ADMISSION_SAFE_PREREAD_V1 = 'RH_ADMISSION_SAFE_PREREAD_V1';
  void RH_ADMISSION_SAFE_PREREAD_V1;
  const docRef = doc(db, DP_COLLECTIONS.ADMISSOES, admissao.id);
  const companyId = normalizeCompanyId(admissao.empresaId || (admissao as any).companyId);
  let previousAdmissionExists: boolean | null = null;
  try {
    const previousAdmission = await getDoc(docRef);
    previousAdmissionExists = previousAdmission.exists();
  } catch (preReadError: any) {
    // Documento legado pode existir sem tenant canônico. A leitura prévia é apenas
    // auxiliar para decidir se envia o evento admission_created e nunca pode
    // impedir o salvamento/efetivação do registro da própria empresa.
    console.warn('[ADMISSAO_PREREAD_SKIPPED]', {
      uid: auth.currentUser?.uid || null,
      empresaId: companyId,
      admissaoId: admissao.id,
      collection: DP_COLLECTIONS.ADMISSOES,
      path: DP_COLLECTIONS.ADMISSOES + '/' + admissao.id,
      operation: 'getDoc:best-effort',
      code: preReadError?.code || null,
      error: preReadError,
    });
  }
  const contrId = (admissao as any).contratacaoId || (admissao.jobId && admissao.candidatoId ? `${admissao.jobId}_${admissao.candidatoId}` : null);
  const diagnosticContext = {
    uid: auth.currentUser?.uid || null,
    empresaId: companyId,
    admissaoId: admissao.id,
    contratacaoId: contrId,
  };
  const sanitized = sanitizeFirestoreData({
    ...admissao,
    empresaId: companyId,
    companyId: companyId,
    updatedAt: new Date().toISOString()
  });

  try {
    await setDoc(docRef, sanitized, { merge: true });
  } catch (error: any) {
    console.error('[ADMISSAO_DRAFT_WRITE_DENIED]', {
      ...diagnosticContext,
      collection: DP_COLLECTIONS.ADMISSOES,
      path: `${DP_COLLECTIONS.ADMISSOES}/${admissao.id}`,
      operation: 'setDoc:merge',
      code: error?.code || null,
      error,
    });
    throw error;
  }

  // Sincronização auxiliar: nunca cria contratação órfã e nunca invalida o rascunho.
  if (contrId) {
    const contratacaoRef = doc(db, 'contratacoes', contrId);
    try {
      const contratacaoSnap = await getDoc(contratacaoRef);
      if (contratacaoSnap.exists()) {
        const contratacao = contratacaoSnap.data() as Record<string, any>;
        const contratacaoTenant = String(contratacao.empresaId || contratacao.companyId || '').trim();
        if (!contratacaoTenant || contratacaoTenant !== companyId) {
          throw new Error('ADMISSAO_SYNC_TENANT_MISMATCH');
        }
        await updateDoc(contratacaoRef, sanitizeFirestoreData({
          statusEncaminhamento: admissao.status,
          encaminhadoPara: 'departamento_pessoal',
          empresaId: contratacao.empresaId || companyId,
          companyId: contratacao.companyId || companyId,
          updatedAt: new Date().toISOString()
        }));
      } else {
        console.warn('[ADMISSAO_SYNC_CONTRATACAO_WARNING]', {
          ...diagnosticContext,
          collection: 'contratacoes',
          path: `contratacoes/${contrId}`,
          operation: 'update-existing-only',
          code: 'not-found',
          error: 'Contratação não encontrada; sincronização auxiliar ignorada.',
        });
      }
    } catch (syncErr: any) {
      console.warn('[ADMISSAO_SYNC_CONTRATACAO_WARNING]', {
        ...diagnosticContext,
        collection: 'contratacoes',
        path: `contratacoes/${contrId}`,
        operation: 'getDoc/updateDoc',
        code: syncErr?.code || null,
        error: syncErr,
      });
    }
  }

  try {
    await addHistoricoEventoFirestore({
      empresaId: companyId,
      colaboradorId: admissao.id,
      moduloOrigem: 'Admissões',
      tipoEvento: 'Atualização de Admissão',
      descricao: `Admissão de ${admissao.nomeCompleto} atualizada. Status: ${admissao.status}`,
      dataHora: new Date().toISOString()
    });
  } catch (historyErr) {
    console.warn('[ADMISSÃO] Rascunho salvo; histórico auxiliar não registrado.', historyErr);
  }
  if (previousAdmissionExists === false) {
    await N8nService.sendSafely('admission_created', companyId, {
      entityId: admissao.id,
      admissionId: admissao.id,
      candidateId: admissao.candidatoId || '',
      applicationId: (admissao as any).candidaturaId || '',
      hiringId: contrId || '',
      jobId: admissao.jobId || '',
      employeeId: (admissao as any).colaboradorId || '',
      status: admissao.status,
    }, `admission-created-${admissao.id}`);
  }
}

export async function deleteAdmissaoFirestore(admissaoId: string): Promise<void> {
  try {
    const docRef = doc(db, DP_COLLECTIONS.ADMISSOES, admissaoId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('[DP Firestore] Erro ao deletar admissão:', error);
    throw error;
  }
}

export async function concluirEfetivacaoAdmissao(
  admissao: AdmissaoPending,
  dadosAdicionais?: {
    gestor?: string;
    escala?: string;
    bancoAgencia?: string;
    rg?: string;
  }
): Promise<ColaboradorCompleto> {
  const companyId = normalizeCompanyId(admissao.empresaId || (admissao as any).companyId);
  if (!admissao.nomeCompleto?.trim()) throw new Error('Nome do colaborador é obrigatório para concluir a admissão.');
  if (!admissao.cpf?.trim()) throw new Error('CPF é obrigatório para concluir a admissão.');
  if (!admissao.email?.trim()) throw new Error('E-mail é obrigatório para concluir a admissão.');
  if (!admissao.cargo?.trim()) throw new Error('Cargo é obrigatório para concluir a admissão.');
  const salarioAdmissao = Number(admissao.salarioCombinado || 0);
  if (!Number.isFinite(salarioAdmissao) || salarioAdmissao <= 0) throw new Error('Salário base é obrigatório para concluir a admissão.');
  if (!String(admissao.dataAdmissaoPrevista || '').trim()) throw new Error('Data de admissão é obrigatória para concluir a admissão.');
  
  // 1. Verifica duplicidade no Firestore
  const colabs = await getColaboradoresFirestore(companyId);
  const jaExiste = colabs.find(c => 
    (admissao.candidatoId && (c as any).candidatoId === admissao.candidatoId) ||
    (admissao.cpf && c.pessoais?.cpf === admissao.cpf)
  );

  // 2. Monta o novo ColaboradorCompleto
  const cpfKey = String(admissao.cpf || '').replace(/\D/g, '');
  const emailKey = String(admissao.email || '').trim().toLowerCase();
  const admissionKey = String(admissao.id || '').trim().replace(/[^a-zA-Z0-9_-]+/g, '-');
  const stablePersonKey = cpfKey
    ? `cpf:${cpfKey}`
    : emailKey
      ? `email:${emailKey}`
      : `admissao:${admissionKey}`;
  const stableEmployeeSuffix = cpfKey
    ? `cpf-${cpfKey}`
    : emailKey
      ? `email-${emailKey.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)}`
      : `admissao-${admissionKey}`;
  const novoId = jaExiste?.id || (admissao as any).colaboradorId || `colab-${stableEmployeeSuffix}`;
  const contratoId = String((admissao as any).contratoTrabalhoId || `ct-${novoId}`).replace(/[^a-zA-Z0-9_-]+/g, '-');

  const novoColaborador: ColaboradorCompleto = {
    id: novoId,
    companyId: companyId,
    nomeCompleto: admissao.nomeCompleto,
    pessoais: {
      cpf: admissao.cpf,
      rg: admissao.rg || dadosAdicionais?.rg || '',
      dataNascimento: admissao.dataNascimento || '',
      estadoCivil: (admissao.estadoCivil as EstadoCivil) || 'Solteiro(a)',
      genero: admissao.genero || 'Não informado',
      endereco: {
        logradouro: admissao.endereco?.logradouro || '',
        numero: admissao.endereco?.numero || '',
        bairro: admissao.endereco?.bairro || '',
        cidade: admissao.endereco?.cidade || '',
        estado: admissao.endereco?.estado || '',
        cep: admissao.endereco?.cep || ''
      },
      telefone: admissao.telefone || '',
      emailPessoal: admissao.email
    },
    profissionais: {
      cargo: admissao.cargo,
      departamento: admissao.departamento || 'Geral',
      centroCusto: admissao.centroCusto || '',
      dataAdmissao: admissao.dataAdmissaoPrevista || new Date().toISOString().split('T')[0],
      salarioBase: admissao.salarioCombinado || 0,
      jornadaSemanalHours: 44,
      escalaTrabalho: admissao.jornada || dadosAdicionais?.escala || '',
      gestorResponsavel: admissao.gestor || dadosAdicionais?.gestor || '',
      status: 'Ativo',
      emailCorporativo: String((admissao as any).emailCorporativo || admissao.email || '').trim()
    },
    trabalhistas: {
      pisPasep: String((admissao as any).pisPasep || '').trim(),
      ctpsNumero: String((admissao as any).ctpsNumero || '').trim(),
      ctpsSerie: String((admissao as any).ctpsSerie || '').trim(),
      ctpsUf: String((admissao as any).ctpsUf || admissao.endereco?.estado || '').trim(),
      dependentesCount: (admissao.dependentes || []).length,
      sindicato: admissao.sindicato || '',
      tipoContrato: admissao.tipoContrato || 'CLT',
      bancoAgenciaConta: admissao.dadosBancarios?.banco 
        ? `${admissao.dadosBancarios.banco} | Ag. ${admissao.dadosBancarios.agencia || ''} | C/C ${admissao.dadosBancarios.conta || ''}`
        : (dadosAdicionais?.bancoAgencia || ''),
      optanteValeTransporte: Boolean((admissao as any).optanteValeTransporte)
    },
    beneficiosAtivos: admissao.beneficiosSelecionados?.length 
      ? admissao.beneficiosSelecionados 
      : [],
    acessoColaborador: {
      loginUsername: admissao.email,
      statusAcesso: 'Pendente',
      senhaCriada: false
    },
    historico: [
      {
        id: `h-${Date.now()}`,
        data: new Date().toISOString().split('T')[0],
        tipo: 'Admissão',
        descricao: `Contratação concluída e efetivada no DP.`,
        responsavel: 'Sistema de RH'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Anexa metadados
  (novoColaborador as any).personKey = (admissao as any).personKey || stablePersonKey;
  (novoColaborador as any).lifecycleStage = 'COLABORADOR';
  (novoColaborador as any).candidatoId = admissao.candidatoId || (admissao as any).sourceCandidateId || null;
  (novoColaborador as any).admissaoId = admissao.id;
  (novoColaborador as any).contratacaoId = (admissao as any).contratacaoId || null;
  (novoColaborador as any).contratoTrabalhoId = contratoId;

  // 3. Persiste no Firestore
  try {
    await saveColaboradorFirestore(novoColaborador);
  } catch (error: any) {
    console.error('[ADMISSAO_COLABORADOR_WRITE_DENIED]', {
      uid: auth.currentUser?.uid || null,
      empresaId: companyId,
      admissaoId: admissao.id,
      contratacaoId: (admissao as any).contratacaoId || null,
      collection: DP_COLLECTIONS.COLABORADORES,
      path: `${DP_COLLECTIONS.COLABORADORES}/${novoId}`,
      operation: 'setDoc:merge',
      code: error?.code || null,
      error,
    });
    throw error;
  }

  // 4. Salva o Contrato de Trabalho
  await setDoc(doc(db, DP_COLLECTIONS.CONTRATOS, contratoId), sanitizeFirestoreData({
    id: contratoId,
    empresaId: companyId,
    colaboradorId: novoId,
    tipoContrato: admissao.tipoContrato || 'CLT',
    salarioBase: admissao.salarioCombinado,
    dataAdmissao: novoColaborador.profissionais.dataAdmissao,
    cargo: admissao.cargo,
    departamento: admissao.departamento,
    conteudoContrato: admissao.contratoGerado?.conteudoGerado || '',
    createdAt: new Date().toISOString()
  }));

  // 5. Integrações automáticas que nascem da admissão: férias, ponto e SST.
  const admissionDate = new Date(`${novoColaborador.profissionais.dataAdmissao}T00:00:00`);
  if (Number.isNaN(admissionDate.getTime())) throw new Error('Data de admissão inválida.');
  const acquisitionEnd = new Date(admissionDate);
  acquisitionEnd.setFullYear(acquisitionEnd.getFullYear() + 1);
  acquisitionEnd.setDate(acquisitionEnd.getDate() - 1);
  const concessionLimit = new Date(acquisitionEnd);
  concessionLimit.setFullYear(concessionLimit.getFullYear() + 1);
  const dateOnly = (value: Date) => value.toISOString().slice(0, 10);
  const vacationPeriodId = `pa-${novoId}-${dateOnly(admissionDate)}`;
  const admissionExamId = `sst-adm-${novoId}`;
  const now = new Date().toISOString();

  await Promise.all([
    setDoc(doc(db, DP_COLLECTIONS.PERIODOS_AQUISITIVOS, vacationPeriodId), sanitizeFirestoreData({
      id: vacationPeriodId,
      companyId,
      empresaId: companyId,
      colaboradorId: novoId,
      colaboradorNome: novoColaborador.nomeCompleto,
      cargo: novoColaborador.profissionais.cargo,
      departamento: novoColaborador.profissionais.departamento,
      dataInicioPeriodo: dateOnly(admissionDate),
      dataFimPeriodo: dateOnly(acquisitionEnd),
      limiteConcessivo: dateOnly(concessionLimit),
      diasDireito: 30,
      diasFaltasInjustificadas: 0,
      diasGozados: 0,
      diasVendidos: 0,
      diasSaldo: 30,
      status: 'Em andamento',
      createdAt: now,
      updatedAt: now,
    }), { merge: true }),
    setDoc(doc(db, 'funcionarios', novoId), sanitizeFirestoreData({
      id: novoId,
      employeeId: novoId,
      companyId,
      empresaId: companyId,
      nome: novoColaborador.nomeCompleto,
      cpf: novoColaborador.pessoais.cpf,
      cargo: novoColaborador.profissionais.cargo,
      setor: novoColaborador.profissionais.departamento,
      email: novoColaborador.pessoais.emailPessoal,
      telefone: novoColaborador.pessoais.telefone,
      escalaId: (admissao as any).escalaId || '',
      escalaNome: novoColaborador.profissionais.escalaTrabalho,
      gestorNome: novoColaborador.profissionais.gestorResponsavel,
      status: 'Ativo',
      pontoLiberado: true,
      createdAt: now,
      updatedAt: now,
    }), { merge: true }),
    setDoc(doc(db, 'sst_agendamentos_exame', admissionExamId), sanitizeFirestoreData({
      id: admissionExamId,
      companyId,
      empresaId: companyId,
      colaboradorId: novoId,
      colaboradorNome: novoColaborador.nomeCompleto,
      cpf: novoColaborador.pessoais.cpf,
      cargo: novoColaborador.profissionais.cargo,
      departamento: novoColaborador.profissionais.departamento,
      tipoExame: 'Admissional',
      clinicaNome: '',
      dataAgendamento: '',
      horario: '',
      status: 'Pendente de Agendamento',
      observacoesInstrucoes: 'Pendência admissional criada automaticamente. Informar clínica, data e horário antes de confirmar o exame.',
      createdAt: now,
      updatedAt: now,
    }), { merge: true }),
  ]);

  // 6. Concede Benefícios Selecionados na Admissão
  if (admissao.beneficiosSelecionados && admissao.beneficiosSelecionados.length > 0) {
    try {
      const catalog = await getBeneficiosFirestore(companyId);
      for (const benIdOrName of admissao.beneficiosSelecionados) {
        const catItem = catalog.find(b => b.id === benIdOrName || b.nome.toLowerCase() === benIdOrName.toLowerCase());
        if (catItem) {
          const indId = `ben-ind-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const nowStr = new Date().toISOString();
          let colabCost = 0;
          let empCost = catItem.custoEmpresaEstimado || 0;
          if (catItem.percentualDescontoFuncionario > 0) {
            colabCost = (admissao.salarioCombinado || 0) * (catItem.percentualDescontoFuncionario / 100);
            empCost = Math.max(0, catItem.valorBeneficio - colabCost);
          }

          await saveEmployeeBenefitFirestore({
            id: indId,
            companyId,
            employeeId: novoId,
            employeeName: novoColaborador.nomeCompleto,
            employeeCpf: novoColaborador.pessoais?.cpf,
            department: novoColaborador.profissionais?.departamento,
            benefitTypeId: catItem.id,
            benefitName: catItem.nome,
            category: catItem.categoria,
            startDate: novoColaborador.profissionais.dataAdmissao,
            status: 'Ativo',
            employeeContribution: Math.round(colabCost * 100) / 100,
            employerContribution: Math.round(empCost * 100) / 100,
            totalValue: catItem.valorBeneficio || 0,
            calculationType: catItem.tipoCalculo || 'Valor Fixo',
            createdAt: nowStr,
            updatedAt: nowStr,
            createdBy: 'admissao-flow',
            updatedBy: 'admissao-flow'
          }, 'admissao-flow', 'Admissão de Colaborador', 'Concessão automática do processo admissional');
        }
      }
    } catch (errBen) {
      console.error('[DP Firestore] Erro ao conceder benefícios na efetivação:', errBen);
      throw errBen;
    }
  }

  // 7. Atualiza o status da Admissão para 'Efetivado'
  await setDoc(doc(db, DP_COLLECTIONS.ADMISSOES, admissao.id), sanitizeFirestoreData({
    ...admissao,
    status: 'Efetivado',
    colaboradorIdCriado: novoId,
    dataEfetivacao: new Date().toISOString()
  }), { merge: true });

  await N8nService.sendSafely('admission_completed', companyId, {
    entityId: admissao.id,
    admissionId: admissao.id,
    candidateId: admissao.candidatoId || '',
    applicationId: (admissao as any).candidaturaId || '',
    hiringId: (admissao as any).contratacaoId || '',
    employeeId: novoId,
    status: 'Efetivado',
  }, `admission-completed-${admissao.id}`);
  await N8nService.sendSafely('employee_created', companyId, {
    entityId: novoId,
    employeeId: novoId,
    candidateId: admissao.candidatoId || '',
    applicationId: (admissao as any).candidaturaId || '',
    admissionId: admissao.id,
    hiringId: (admissao as any).contratacaoId || '',
    name: novoColaborador.nomeCompleto,
    email: novoColaborador.pessoais.emailPessoal,
  }, `employee-created-${novoId}`);

  return novoColaborador;
}

export async function markColaboradorAccessCreatedFirestore(
  colaboradorId: string,
  companyIdInput: string,
  loginUsername: string
): Promise<void> {
  const companyId = normalizeCompanyId(companyIdInput);
  await updateDoc(doc(db, DP_COLLECTIONS.COLABORADORES, colaboradorId), sanitizeFirestoreData({
    companyId,
    empresaId: companyId,
    acessoColaborador: {
      loginUsername,
      statusAcesso: 'Ativo',
      senhaCriada: true,
    },
    updatedAt: new Date().toISOString(),
  }));
}

// ==========================================
// 3. BENEFÍCIOS (CATÁLOGO & INDIVIDUAL)
// ==========================================

// RH_BENEFITS_CATALOG_ADMISSION_SYNC_V1
// Catálogo único compartilhado por Gestão de Benefícios, Admissão e concessões do colaborador.
function buildDefaultCompanyBenefits(companyId: string): ItemBeneficio[] {
  const now = new Date().toISOString();
  return [
    { id: 'ben-default-vale-transporte', companyId, nome: 'Vale Transporte', descricao: 'Desconto em folha de até 6%', categoria: 'Vale Transporte', tipoCalculo: 'Desconto Limitado Teto', valorBeneficio: 0, percentualDescontoFuncionario: 6, custoEmpresaEstimado: 0, recorrencia: 'Mensal', exigeDependente: false, exigeDocumento: false, ativo: true, fornecedor: '', status: 'Ativo', createdAt: now, updatedAt: now },
    { id: 'ben-default-vale-refeicao', companyId, nome: 'Vale Refeição', descricao: 'R$ 35,00 / dia trabalhado', categoria: 'Vale Refeição', tipoCalculo: 'Valor por Dia Trabalhado', valorBeneficio: 35, percentualDescontoFuncionario: 0, custoEmpresaEstimado: 35, recorrencia: 'Diário', exigeDependente: false, exigeDocumento: false, ativo: true, fornecedor: '', status: 'Ativo', createdAt: now, updatedAt: now },
    { id: 'ben-default-vale-alimentacao', companyId, nome: 'Vale Alimentação', descricao: 'R$ 450,00 / mês', categoria: 'Vale Alimentação', tipoCalculo: 'Valor Fixo', valorBeneficio: 450, percentualDescontoFuncionario: 0, custoEmpresaEstimado: 450, recorrencia: 'Mensal', exigeDependente: false, exigeDocumento: false, ativo: true, fornecedor: '', status: 'Ativo', createdAt: now, updatedAt: now },
    { id: 'ben-default-plano-saude', companyId, nome: 'Plano de Saúde', descricao: 'Unimed / Bradesco Saúde sem coparticipação', categoria: 'Plano de Saúde', tipoCalculo: 'Sem Custo Funcionário', valorBeneficio: 0, percentualDescontoFuncionario: 0, custoEmpresaEstimado: 0, recorrencia: 'Mensal', exigeDependente: true, exigeDocumento: true, ativo: true, fornecedor: 'Unimed / Bradesco Saúde', status: 'Ativo', createdAt: now, updatedAt: now },
    { id: 'ben-default-plano-odonto', companyId, nome: 'Plano Odontológico', descricao: 'Amil Dental cobertura nacional', categoria: 'Plano Odontológico', tipoCalculo: 'Sem Custo Funcionário', valorBeneficio: 0, percentualDescontoFuncionario: 0, custoEmpresaEstimado: 0, recorrencia: 'Mensal', exigeDependente: true, exigeDocumento: false, ativo: true, fornecedor: 'Amil Dental', status: 'Ativo', createdAt: now, updatedAt: now },
    { id: 'ben-default-seguro-vida', companyId, nome: 'Seguro de Vida', descricao: 'Cobertura integral em apólice de grupo', categoria: 'Seguro de Vida', tipoCalculo: 'Sem Custo Funcionário', valorBeneficio: 0, percentualDescontoFuncionario: 0, custoEmpresaEstimado: 0, recorrencia: 'Mensal', exigeDependente: false, exigeDocumento: false, ativo: true, fornecedor: '', status: 'Ativo', createdAt: now, updatedAt: now },
    { id: 'ben-default-home-office', companyId, nome: 'Auxílio Home Office', descricao: 'R$ 150,00 ajuda de custo infraestrutura', categoria: 'Auxílio Home Office', tipoCalculo: 'Valor Fixo', valorBeneficio: 150, percentualDescontoFuncionario: 0, custoEmpresaEstimado: 150, recorrencia: 'Mensal', exigeDependente: false, exigeDocumento: false, ativo: true, fornecedor: '', status: 'Ativo', createdAt: now, updatedAt: now },
    { id: 'ben-default-gympass', companyId, nome: 'Gympass / TotalPass', descricao: 'Acesso a academias e bem-estar', categoria: 'Gympass / Academia', tipoCalculo: 'Valor Manual', valorBeneficio: 0, percentualDescontoFuncionario: 0, custoEmpresaEstimado: 0, recorrencia: 'Mensal', exigeDependente: false, exigeDocumento: false, ativo: true, fornecedor: 'Gympass / TotalPass', status: 'Ativo', createdAt: now, updatedAt: now }
  ];
}

export async function getBeneficiosFirestore(companyId: string): Promise<ItemBeneficio[]> {
  const empId = normalizeCompanyId(companyId);
  try {
    const q = query(
      collection(db, DP_COLLECTIONS.BENEFICIOS),
      where('companyId', '==', empId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      const defaults = buildDefaultCompanyBenefits(empId);
      await Promise.all(defaults.map(beneficio =>
        setDoc(
          doc(db, DP_COLLECTIONS.BENEFICIOS, beneficio.id),
          sanitizeFirestoreData({ ...beneficio, companyId: empId, empresaId: empId, status: 'Ativo' }),
          { merge: true }
        )
      ));
      return defaults;
    }

    const list: ItemBeneficio[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as ItemBeneficio);
    });
    return list;
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar benefícios:', error);
    return [];
  }
}

export async function saveBeneficioFirestore(beneficio: ItemBeneficio): Promise<void> {
  try {
    const docRef = doc(db, DP_COLLECTIONS.BENEFICIOS, beneficio.id);
    await setDoc(docRef, sanitizeFirestoreData({
      ...beneficio,
      companyId: beneficio.companyId || '',
      empresaId: beneficio.companyId || '',
      status: beneficio.ativo ? 'Ativo' : 'Inativo',
      updatedAt: new Date().toISOString()
    }), { merge: true });
  } catch (error) {
    console.error('[DP Firestore] Erro ao salvar benefício:', error);
  }
}

export async function deleteBeneficioFirestore(companyId: string, id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, DP_COLLECTIONS.BENEFICIOS, id));
  } catch (error) {
    console.error('[DP Firestore] Erro ao excluir benefício:', error);
  }
}

// ------------------------------------------
// BENEFÍCIOS INDIVIDUAIS DO COLABORADOR
// ------------------------------------------

export async function getEmployeeBenefitsFirestore(companyId: string, employeeId?: string): Promise<BeneficioColaboradorIndividual[]> {
  const empId = normalizeCompanyId(companyId);
  try {
    let q = query(
      collection(db, DP_COLLECTIONS.EMPLOYEE_BENEFITS),
      where('companyId', '==', empId)
    );

    if (employeeId) {
      q = query(
        collection(db, DP_COLLECTIONS.EMPLOYEE_BENEFITS),
        where('companyId', '==', empId),
        where('employeeId', '==', employeeId)
      );
    }

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    const list: BeneficioColaboradorIndividual[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as BeneficioColaboradorIndividual);
    });
    return list;
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar benefícios individuais:', error);
    return [];
  }
}

export async function saveEmployeeBenefitFirestore(
  benefit: BeneficioColaboradorIndividual,
  userId = 'rh-system',
  userName = 'Analista DP',
  reason = 'Concessão/Atualização de benefício'
): Promise<void> {
  try {
    const empId = normalizeCompanyId(benefit.companyId);
    const docRef = doc(db, DP_COLLECTIONS.EMPLOYEE_BENEFITS, benefit.id);

    const isNew = !benefit.createdAt;
    const now = new Date().toISOString();

    const dataToSave: BeneficioColaboradorIndividual = {
      ...benefit,
      companyId: empId,
      createdAt: benefit.createdAt || now,
      updatedAt: now,
      createdBy: benefit.createdBy || userId,
      updatedBy: userId
    };

    await setDoc(docRef, sanitizeFirestoreData(dataToSave), { merge: true });

    // Registra Auditoria no Histórico de Benefícios
    await addHistoricoBeneficioFirestore({
      id: `hben-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      companyId: empId,
      employeeId: benefit.employeeId,
      employeeName: benefit.employeeName,
      benefitId: benefit.id,
      benefitName: benefit.benefitName,
      action: isNew ? 'Concessão' : 'Alteração de Valor',
      previousValue: isNew ? 'N/A' : `R$ ${benefit.totalValue}`,
      newValue: `R$ ${benefit.totalValue} (Colab: R$ ${benefit.employeeContribution} | Emp: R$ ${benefit.employerContribution})`,
      reason,
      userId,
      userName,
      createdAt: now
    });

    // Registra no Prontuário Histórico do Colaborador
    await addHistoricoEventoFirestore({
      empresaId: empId,
      colaboradorId: benefit.employeeId,
      moduloOrigem: 'Benefícios',
      tipoEvento: isNew ? 'Concessão de Benefício' : 'Atualização de Benefício',
      descricao: `Benefício "${benefit.benefitName}" (${benefit.status}) atualizado. Custo Colaborador: R$ ${benefit.employeeContribution} | Empresa: R$ ${benefit.employerContribution}.`,
      usuarioId: userId,
      usuarioNome: userName,
      dataHora: now
    });

  } catch (error) {
    console.error('[DP Firestore] Erro ao salvar benefício individual:', error);
  }
}

export async function updateEmployeeBenefitStatusFirestore(
  companyId: string,
  benefitId: string,
  newStatus: StatusBeneficioIndividual,
  userId = 'rh-system',
  userName = 'Analista DP',
  reason = 'Alteração de status do benefício'
): Promise<void> {
  try {
    const empId = normalizeCompanyId(companyId);
    const docRef = doc(db, DP_COLLECTIONS.EMPLOYEE_BENEFITS, benefitId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return;

    const currentData = docSnap.data() as BeneficioColaboradorIndividual;
    const now = new Date().toISOString();

    const updatedData: Partial<BeneficioColaboradorIndividual> = {
      status: newStatus,
      updatedAt: now,
      updatedBy: userId
    };

    if (newStatus === 'Encerrado' || newStatus === 'Cancelado') {
      updatedData.endDate = now.split('T')[0];
    }

    await setDoc(docRef, sanitizeFirestoreData(updatedData), { merge: true });

    // Auditoria de Benefício
    await addHistoricoBeneficioFirestore({
      id: `hben-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      companyId: empId,
      employeeId: currentData.employeeId,
      employeeName: currentData.employeeName,
      benefitId,
      benefitName: currentData.benefitName,
      action: newStatus === 'Suspenso' ? 'Suspensão' : newStatus === 'Ativo' ? 'Reativação' : newStatus === 'Cancelado' ? 'Cancelamento' : 'Encerramento Rescisão',
      previousValue: currentData.status,
      newValue: newStatus,
      reason,
      userId,
      userName,
      createdAt: now
    });

  } catch (error) {
    console.error('[DP Firestore] Erro ao atualizar status do benefício:', error);
  }
}

export async function applyMassBenefitsFirestore(
  companyId: string,
  catalogItem: ItemBeneficio,
  colaboradoresElegiveis: ColaboradorCompleto[],
  userId = 'rh-system',
  userName = 'Analista DP',
  startDate = new Date().toISOString().split('T')[0]
): Promise<{ successCount: number; existingCount: number }> {
  const empId = normalizeCompanyId(companyId);
  let successCount = 0;
  let existingCount = 0;

  try {
    const existingBenefits = await getEmployeeBenefitsFirestore(empId);

    for (const colab of colaboradoresElegiveis) {
      // Verifica duplicidade ativa
      const hasActive = existingBenefits.some(
        b => b.employeeId === colab.id && 
             b.benefitTypeId === catalogItem.id && 
             (b.status === 'Ativo' || b.status === 'Pendente')
      );

      if (hasActive) {
        existingCount++;
        continue;
      }

      // Calcula valores
      const totalVal = catalogItem.valorBeneficio || 0;
      let empCost = catalogItem.custoEmpresaEstimado || 0;
      let colabCost = 0;

      if (catalogItem.percentualDescontoFuncionario > 0) {
        colabCost = (colab.profissionais?.salarioBase || 0) * (catalogItem.percentualDescontoFuncionario / 100);
        if (catalogItem.tipoCalculo === 'Desconto Limitado Teto' || catalogItem.categoria === 'Vale Transporte') {
          colabCost = Math.min(colabCost, totalVal);
        }
        empCost = Math.max(0, totalVal - colabCost);
      } else if (catalogItem.valorDescontoFixoFuncionario) {
        colabCost = catalogItem.valorDescontoFixoFuncionario;
        empCost = Math.max(0, totalVal - colabCost);
      }

      const newBenId = `ben-ind-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();

      const newIndBen: BeneficioColaboradorIndividual = {
        id: newBenId,
        companyId: empId,
        employeeId: colab.id,
        employeeName: colab.nomeCompleto,
        employeeCpf: colab.pessoais?.cpf,
        department: colab.profissionais?.departamento,
        benefitTypeId: catalogItem.id,
        benefitName: catalogItem.nome,
        category: catalogItem.categoria,
        startDate,
        status: 'Ativo',
        employeeContribution: Math.round(colabCost * 100) / 100,
        employerContribution: Math.round(empCost * 100) / 100,
        totalValue: totalVal,
        calculationType: catalogItem.tipoCalculo || 'Valor Fixo',
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId
      };

      await setDoc(doc(db, DP_COLLECTIONS.EMPLOYEE_BENEFITS, newBenId), sanitizeFirestoreData(newIndBen));

      await addHistoricoBeneficioFirestore({
        id: `hben-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        companyId: empId,
        employeeId: colab.id,
        employeeName: colab.nomeCompleto,
        benefitId: newBenId,
        benefitName: catalogItem.nome,
        action: 'Alteração em Massa',
        previousValue: 'Sem Benefício',
        newValue: `Atribuído em massa (R$ ${totalVal})`,
        reason: 'Concessão de benefício em massa por departamento/cargo',
        userId,
        userName,
        createdAt: now
      });

      successCount++;
    }

    return { successCount, existingCount };
  } catch (error) {
    console.error('[DP Firestore] Erro na concessão em massa de benefícios:', error);
    return { successCount, existingCount };
  }
}

// Auditoria de benefícios
export async function addHistoricoBeneficioFirestore(evento: HistoricoAlteracaoBeneficio): Promise<void> {
  try {
    const docRef = doc(db, DP_COLLECTIONS.HISTORICO_BENEFICIOS, evento.id || `hben-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`);
    await setDoc(docRef, sanitizeFirestoreData({
      ...evento,
      id: evento.id || `hben-${Date.now()}`,
      createdAt: evento.createdAt || new Date().toISOString()
    }));
  } catch (error) {
    console.error('[DP Firestore] Erro ao salvar histórico de benefício:', error);
  }
}

export async function getHistoricoBeneficiosFirestore(companyId: string, employeeId?: string): Promise<HistoricoAlteracaoBeneficio[]> {
  const empId = normalizeCompanyId(companyId);
  try {
    let q = query(
      collection(db, DP_COLLECTIONS.HISTORICO_BENEFICIOS),
      where('companyId', '==', empId)
    );

    if (employeeId) {
      q = query(
        collection(db, DP_COLLECTIONS.HISTORICO_BENEFICIOS),
        where('companyId', '==', empId),
        where('employeeId', '==', employeeId)
      );
    }

    const snapshot = await getDocs(q);
    const list: HistoricoAlteracaoBeneficio[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as HistoricoAlteracaoBeneficio);
    });

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar histórico de benefícios:', error);
    return [];
  }
}

// ------------------------------------------
// PERÍODOS AQUISITIVOS DE FÉRIAS
// ------------------------------------------

export async function getPeriodosAquisitivosFirestore(companyId: string, colaboradorId?: string): Promise<PeriodoAquisitivoFerias[]> {
  const empId = normalizeCompanyId(companyId);
  try {
    let q = query(
      collection(db, DP_COLLECTIONS.PERIODOS_AQUISITIVOS),
      where('companyId', '==', empId)
    );

    if (colaboradorId) {
      q = query(
        collection(db, DP_COLLECTIONS.PERIODOS_AQUISITIVOS),
        where('companyId', '==', empId),
        where('colaboradorId', '==', colaboradorId)
      );
    }

    const snapshot = await getDocs(q);
    const list: PeriodoAquisitivoFerias[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as PeriodoAquisitivoFerias);
    });

    list.sort((a, b) => new Date(b.dataInicioPeriodo).getTime() - new Date(a.dataInicioPeriodo).getTime());
    return list;
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar períodos aquisitivos:', error);
    return [];
  }
}

export async function savePeriodoAquisitivoFirestore(pa: PeriodoAquisitivoFerias): Promise<void> {
  try {
    const companyId = normalizeCompanyId(pa.companyId);
    const docRef = doc(db, DP_COLLECTIONS.PERIODOS_AQUISITIVOS, pa.id);
    await setDoc(docRef, sanitizeFirestoreData({
      ...pa,
      companyId,
      empresaId: companyId,
      updatedAt: new Date().toISOString()
    }), { merge: true });
  } catch (error) {
    console.error('[DP Firestore] Erro ao salvar período aquisitivo:', error);
    throw error;
  }
}

export async function getRegraFeriasEmpresaFirestore(companyId: string): Promise<RegraFeriasEmpresa> {
  const empId = normalizeCompanyId(companyId);
  try {
    const docRef = doc(db, DP_COLLECTIONS.REGRAS_FERIAS, empId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as RegraFeriasEmpresa;
    }
    throw new Error('REGRA_FERIAS_NAO_CONFIGURADA');
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar regra de férias da empresa:', error);
    throw error;
  }
}

export async function saveRegraFeriasEmpresaFirestore(regra: RegraFeriasEmpresa): Promise<void> {
  try {
    const docRef = doc(db, DP_COLLECTIONS.REGRAS_FERIAS, regra.companyId);
    await setDoc(docRef, sanitizeFirestoreData(regra), { merge: true });
  } catch (error) {
    console.error('[DP Firestore] Erro ao salvar regra de férias:', error);
  }
}

export async function getAnotacoesInternasFirestore(companyId: string, employeeId: string): Promise<AnotacaoInternaColaborador[]> {
  const empId = normalizeCompanyId(companyId);
  try {
    const q = query(
      collection(db, DP_COLLECTIONS.ANOTACOES_INTERNAS),
      where('companyId', '==', empId),
      where('employeeId', '==', employeeId)
    );
    const snapshot = await getDocs(q);

    const list: AnotacaoInternaColaborador[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as AnotacaoInternaColaborador);
    });

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar anotações internas:', error);
    return [];
  }
}

export async function saveAnotacaoInternaFirestore(anotacao: AnotacaoInternaColaborador): Promise<void> {
  try {
    const empId = normalizeCompanyId(anotacao.companyId);
    const docRef = doc(db, DP_COLLECTIONS.ANOTACOES_INTERNAS, anotacao.id || `anot-${Date.now()}`);
    await setDoc(docRef, sanitizeFirestoreData({
      ...anotacao,
      companyId: empId,
      id: anotacao.id || `anot-${Date.now()}`,
      createdAt: anotacao.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }), { merge: true });
  } catch (error) {
    console.error('[DP Firestore] Erro ao salvar anotação interna:', error);
  }
}

export async function deleteAnotacaoInternaFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, DP_COLLECTIONS.ANOTACOES_INTERNAS, id));
  } catch (error) {
    console.error('[DP Firestore] Erro ao excluir anotação interna:', error);
  }
}

// ==========================================
// 4. FÉRIAS
// ==========================================

export async function getFeriasFirestore(companyId: string): Promise<RegistroFeriasColaborador[]> {
  const empId = normalizeCompanyId(companyId);
  try {
    const q = query(
      collection(db, DP_COLLECTIONS.FERIAS),
      where('companyId', '==', empId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    const list: RegistroFeriasColaborador[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as RegistroFeriasColaborador);
    });
    return list;
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar férias:', error);
    return [];
  }
}

export async function saveFeriasFirestore(ferias: RegistroFeriasColaborador): Promise<void> {
  try {
    const companyId = normalizeCompanyId(ferias.companyId);
    const docRef = doc(db, DP_COLLECTIONS.FERIAS, ferias.id);
    await setDoc(docRef, sanitizeFirestoreData({
      ...ferias,
      companyId,
      empresaId: companyId,
      updatedAt: new Date().toISOString()
    }), { merge: true });

    // Registra evento no Histórico do Colaborador
    if (ferias.colaboradorId) {
      await addHistoricoEventoFirestore({
        empresaId: ferias.companyId,
        colaboradorId: ferias.colaboradorId,
        moduloOrigem: 'Férias',
        tipoEvento: 'Programação de Férias',
        descricao: `Férias alteradas/programadas (${ferias.status}). Período: ${ferias.dataInicioGozo || 'A definir'} a ${ferias.dataFimGozo || 'A definir'}.`,
        dataHora: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('[DP Firestore] Erro ao salvar férias:', error);
    throw error;
  }
}

// ==========================================
// 5. AFASTAMENTOS
// ==========================================

export async function getAfastamentosFirestore(companyId: string): Promise<AfastamentoColaborador[]> {
  const empId = normalizeCompanyId(companyId);
  try {
    const q = query(
      collection(db, DP_COLLECTIONS.AFASTAMENTOS),
      where('empresaId', '==', empId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    const list: AfastamentoColaborador[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as AfastamentoColaborador);
    });
    return list;
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar afastamentos:', error);
    return [];
  }
}

export async function saveAfastamentoFirestore(afastamento: AfastamentoColaborador): Promise<void> {
  try {
    const docRef = doc(db, DP_COLLECTIONS.AFASTAMENTOS, afastamento.id);
    await setDoc(docRef, sanitizeFirestoreData(afastamento), { merge: true });

    // Atualiza status do colaborador para 'Afastado' se for afastamento ativo
    if (afastamento.status === 'Ativo') {
      const colabRef = doc(db, DP_COLLECTIONS.COLABORADORES, afastamento.colaboradorId);
      const colabSnap = await getDoc(colabRef);
      if (colabSnap.exists()) {
        const cData = colabSnap.data() as ColaboradorCompleto;
        await setDoc(colabRef, sanitizeFirestoreData({
          ...cData,
          profissionais: {
            ...cData.profissionais,
            status: 'Afastado'
          }
        }), { merge: true });
      }
    }

    // Histórico
    await addHistoricoEventoFirestore({
      empresaId: afastamento.empresaId,
      colaboradorId: afastamento.colaboradorId,
      moduloOrigem: 'Afastamentos',
      tipoEvento: 'Registro de Afastamento',
      descricao: `Afastamento do tipo "${afastamento.tipo}" de ${afastamento.dataInicio} a ${afastamento.dataFim} (${afastamento.diasAfastado} dias).`,
      dataHora: new Date().toISOString()
    });
  } catch (error) {
    console.error('[DP Firestore] Erro ao salvar afastamento:', error);
  }
}

export async function concluirRetornoAoTrabalhoFirestore(
  afastamento: AfastamentoColaborador,
  dadosRetorno: DadosRetornoTrabalho
): Promise<void> {
  try {
    const docRef = doc(db, DP_COLLECTIONS.AFASTAMENTOS, afastamento.id);
    const now = new Date().toISOString();
    
    const updatedAfastamento: AfastamentoColaborador = {
      ...afastamento,
      status: 'Concluído',
      retornoTrabalhoRealizado: dadosRetorno.dataConclusao || now.split('T')[0],
      dadosRetornoTrabalho: dadosRetorno,
      updatedAt: now
    };

    await setDoc(docRef, sanitizeFirestoreData(updatedAfastamento), { merge: true });

    // Restaura status do colaborador para 'Ativo'
    const colabRef = doc(db, DP_COLLECTIONS.COLABORADORES, afastamento.colaboradorId);
    const colabSnap = await getDoc(colabRef);
    if (colabSnap.exists()) {
      const cData = colabSnap.data() as ColaboradorCompleto;
      await setDoc(colabRef, sanitizeFirestoreData({
        ...cData,
        profissionais: {
          ...cData.profissionais,
          status: 'Ativo'
        }
      }), { merge: true });
    }

    // Registra evento no histórico
    await addHistoricoEventoFirestore({
      empresaId: afastamento.empresaId,
      colaboradorId: afastamento.colaboradorId,
      moduloOrigem: 'Afastamentos',
      tipoEvento: 'Retorno ao Trabalho',
      descricao: `Colaborador retornou ao trabalho. ASO: ${dadosRetorno.resultadoAso}. Restrições: ${dadosRetorno.descricaoRestricoes || 'Nenhuma'}.`,
      dataHora: now
    });

  } catch (error) {
    console.error('[DP Firestore] Erro ao concluir retorno ao trabalho:', error);
  }
}

// ------------------------------------------
// ALERTAS DO DP
// ------------------------------------------

export async function getAlertasDpFirestore(companyId: string): Promise<AlertaDp[]> {
  const empId = normalizeCompanyId(companyId);
  try {
    const q = query(
      collection(db, DP_COLLECTIONS.ALERTAS),
      where('companyId', '==', empId)
    );
    const snapshot = await getDocs(q);

    const list: AlertaDp[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as AlertaDp);
    });

    list.sort((a, b) => new Date(b.dataAlerta).getTime() - new Date(a.dataAlerta).getTime());
    return list;
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar alertas do DP:', error);
    return [];
  }
}

export async function saveAlertaDpFirestore(alerta: AlertaDp): Promise<void> {
  try {
    const docRef = doc(db, DP_COLLECTIONS.ALERTAS, alerta.id);
    await setDoc(docRef, sanitizeFirestoreData({
      ...alerta,
      companyId: alerta.companyId || ''
    }), { merge: true });
  } catch (error) {
    console.error('[DP Firestore] Erro ao salvar alerta:', error);
  }
}

export async function marcarAlertaComoLidoFirestore(alertaId: string): Promise<void> {
  try {
    const docRef = doc(db, DP_COLLECTIONS.ALERTAS, alertaId);
    await updateDoc(docRef, { lido: true });
  } catch (error) {
    console.error('[DP Firestore] Erro ao marcar alerta como lido:', error);
  }
}

// ==========================================
// 6. DOCUMENTOS
// ==========================================

export async function getDocumentosFirestore(companyId: string, colaboradorId?: string): Promise<DocumentoColaborador[]> {
  const empId = normalizeCompanyId(companyId);
  try {
    let q = query(
      collection(db, DP_COLLECTIONS.DOCUMENTOS),
      where('empresaId', '==', empId)
    );
    if (colaboradorId) {
      q = query(
        collection(db, DP_COLLECTIONS.DOCUMENTOS),
        where('empresaId', '==', empId),
        where('colaboradorId', '==', colaboradorId)
      );
    }
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    const list: DocumentoColaborador[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as DocumentoColaborador);
    });
    return list;
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar documentos:', error);
    return [];
  }
}

export async function saveDocumentoFirestore(docData: DocumentoColaborador): Promise<void> {
  try {
    const companyId = normalizeCompanyId(docData.empresaId);
    const docRef = doc(db, DP_COLLECTIONS.DOCUMENTOS, docData.id);
    await setDoc(docRef, sanitizeFirestoreData({
      ...docData,
      empresaId: companyId,
      companyId,
      status: docData.status || 'Válido',
      criadoEm: docData.criadoEm || new Date().toISOString()
    }), { merge: true });

    await addHistoricoEventoFirestore({
      empresaId: docData.empresaId,
      colaboradorId: docData.colaboradorId,
      moduloOrigem: 'Documentos',
      tipoEvento: 'Anexo de Documento',
      descricao: `Documento "${docData.tipoDocumento}" adicionado na categoria ${docData.categoria}.`,
      dataHora: new Date().toISOString()
    });
  } catch (error) {
    console.error('[DP Firestore] Erro ao salvar documento:', error);
    throw error;
  }
}

// ==========================================
// 7. AJUSTES DE PONTO
// ==========================================

export async function getAjustesPontoFirestore(companyId: string): Promise<AjustePontoColaborador[]> {
  const empId = normalizeCompanyId(companyId);
  try {
    const q = query(
      collection(db, DP_COLLECTIONS.AJUSTES_PONTO),
      where('empresaId', '==', empId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    const list: AjustePontoColaborador[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as AjustePontoColaborador);
    });
    return list;
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar ajustes de ponto:', error);
    return [];
  }
}

export async function saveAjustePontoFirestore(ajuste: AjustePontoColaborador): Promise<void> {
  try {
    const companyId = normalizeCompanyId(ajuste.empresaId || (ajuste as any).companyId);
    if (!ajuste.id || !ajuste.colaboradorId || !ajuste.data || !ajuste.motivo?.trim()) throw new Error('Ajuste de ponto exige id, colaborador, data e motivo.');
    const docRef = doc(db, DP_COLLECTIONS.AJUSTES_PONTO, ajuste.id);
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      const d = existing.data() as any;
      const existingCompany = String(d.companyId || d.empresaId || '').trim();
      if (existingCompany && existingCompany !== companyId) throw new Error('TENANT_MISMATCH_AJUSTE_PONTO');
    }
    await setDoc(docRef, sanitizeFirestoreData({
      ...ajuste,
      empresaId: companyId,
      companyId,
      status: ajuste.status || 'Pendente',
      createdAt: ajuste.createdAt || new Date().toISOString()
    }), { merge: true });

    await addHistoricoEventoFirestore({
      empresaId: companyId,
      colaboradorId: ajuste.colaboradorId,
      moduloOrigem: 'Jornada',
      tipoEvento: 'Solicitação de Ajuste de Ponto',
      descricao: `Ajuste de ponto do dia ${ajuste.data} alterado para status "${ajuste.status}". Motivo: ${ajuste.motivo}`,
      dataHora: new Date().toISOString()
    });
  } catch (error) {
    console.error('[DP Firestore] Erro ao salvar ajuste de ponto:', error);
    throw error;
  }
}

// ==========================================
// 8. RESCISÕES
// ==========================================

export async function getRescisoesFirestore(companyId: string): Promise<CalculoRescisorio[]> {
  const empId = normalizeCompanyId(companyId);
  try {
    const q = query(
      collection(db, DP_COLLECTIONS.RESCISOES),
      where('companyId', '==', empId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    const list: CalculoRescisorio[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as CalculoRescisorio);
    });
    return list;
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar rescisões:', error);
    return [];
  }
}

export async function concluirRescisaoEBloquearColaborador(rescisao: CalculoRescisorio): Promise<void> {
  const companyId = rescisao.companyId || '';
  const resId = rescisao.id || `resc-${Date.now()}`;

  try {
    // 1. Salva a Rescisão no Firestore
    await setDoc(doc(db, DP_COLLECTIONS.RESCISOES, resId), sanitizeFirestoreData({
      ...rescisao,
      id: resId,
      status: 'Homologado'
    }), { merge: true });

    // 2. Atualiza o status do Colaborador para 'Rescindido' e Bloqueia Acesso ao Portal
    const colabRef = doc(db, DP_COLLECTIONS.COLABORADORES, rescisao.colaboradorId);
    const colabSnap = await getDoc(colabRef);

    if (colabSnap.exists()) {
      const cData = colabSnap.data() as ColaboradorCompleto;

      const colabAtualizado: ColaboradorCompleto = {
        ...cData,
        profissionais: {
          ...cData.profissionais,
          status: 'Rescindido'
        },
        acessoColaborador: {
          ...(cData.acessoColaborador || { loginUsername: cData.pessoais.emailPessoal, senhaCriada: false }),
          statusAcesso: 'Bloqueado'
        },
        updatedAt: new Date().toISOString()
      };

      await setDoc(colabRef, sanitizeFirestoreData(colabAtualizado), { merge: true });
    }

    // 3. Encerra Benefícios Ativos APENAS do Colaborador Desligado no Firestore
    const colabBenefits = await getEmployeeBenefitsFirestore(companyId, rescisao.colaboradorId);
    const activeBenefits = colabBenefits.filter(b => b.status === 'Ativo' || b.status === 'Pendente');
    
    for (const b of activeBenefits) {
      await updateEmployeeBenefitStatusFirestore(
        companyId,
        b.id,
        'Encerrado',
        'rh-system',
        'Módulo de Rescisão',
        `Encerrado automaticamente devido ao desligamento em ${rescisao.dataDesligamento}`
      );
    }

    // 4. Registra no Histórico Único do Colaborador
    await addHistoricoEventoFirestore({
      empresaId: companyId,
      colaboradorId: rescisao.colaboradorId,
      moduloOrigem: 'Rescisões',
      tipoEvento: 'Desligamento e Rescisão Contratual',
      descricao: `Rescisão concluída (${rescisao.tipoRescisao}). Valor líquido: R$ ${rescisao.valorLiquidoRescisao.toLocaleString('pt-BR')}. Acesso ao portal e ponto bloqueados.`,
      dataHora: new Date().toISOString()
    });

  } catch (error) {
    console.error('[DP Firestore] Erro ao concluir rescisão:', error);
  }
}

// ==========================================
// 9. HISTÓRICO ÚNICO DO COLABORADOR
// ==========================================

export async function addHistoricoEventoFirestore(evento: {
  empresaId: string;
  colaboradorId: string;
  moduloOrigem: 'Colaboradores' | 'Admissões' | 'Jornada' | 'Benefícios' | 'Férias' | 'Afastamentos' | 'Documentos' | 'Folha' | 'Rescisões';
  tipoEvento: string;
  descricao: string;
  valorAnterior?: string;
  valorNovo?: string;
  usuarioId?: string;
  usuarioNome?: string;
  dataHora?: string;
}): Promise<void> {
  try {
    const id = `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const eventDoc: HistoricoEventoColaborador = {
      id,
      empresaId: evento.empresaId,
      colaboradorId: evento.colaboradorId,
      moduloOrigem: evento.moduloOrigem,
      tipoEvento: evento.tipoEvento,
      descricao: evento.descricao,
      valorAnterior: evento.valorAnterior,
      valorNovo: evento.valorNovo,
      usuarioId: evento.usuarioId || 'rh-system',
      usuarioNome: evento.usuarioNome || 'Analista DP',
      dataHora: evento.dataHora || new Date().toISOString()
    };
    await setDoc(doc(db, DP_COLLECTIONS.HISTORICO, id), sanitizeFirestoreData(eventDoc));
  } catch (error) {
    console.error('[DP Firestore] Erro ao registrar histórico:', error);
  }
}

export async function getHistoricoColaboradorFirestore(companyId: string, colaboradorId: string): Promise<HistoricoEventoColaborador[]> {
  const empId = normalizeCompanyId(companyId);
  try {
    const q = query(
      collection(db, DP_COLLECTIONS.HISTORICO),
      where('empresaId', '==', empId),
      where('colaboradorId', '==', colaboradorId)
    );
    const snapshot = await getDocs(q);

    const list: HistoricoEventoColaborador[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as HistoricoEventoColaborador);
    });

    list.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
    return list;
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar histórico:', error);
    return [];
  }
}

// ==========================================
// 10. CONFIGURAÇÕES TRABALHISTAS
// ==========================================

export async function getConfigTrabalhistaFirestore(companyId: string): Promise<ConfiguracoesTrabalhistas> {
  const empId = normalizeCompanyId(companyId);
  try {
    const docRef = doc(db, DP_COLLECTIONS.CONFIGURACÕES, empId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as ConfiguracoesTrabalhistas;
    } else {
      const defaultConfig = {
        ...DEFAULT_CONFIG_TRABALHISTA,
        companyId: empId
      };
      await setDoc(docRef, sanitizeFirestoreData(defaultConfig));
      return defaultConfig;
    }
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar configurações:', error);
    return { ...DEFAULT_CONFIG_TRABALHISTA, companyId: empId };
  }
}

export async function saveConfigTrabalhistaFirestore(config: ConfiguracoesTrabalhistas): Promise<void> {
  try {
    const docRef = doc(db, DP_COLLECTIONS.CONFIGURACÕES, config.companyId);
    await setDoc(docRef, sanitizeFirestoreData(config), { merge: true });
  } catch (error) {
    console.error('[DP Firestore] Erro ao salvar configurações:', error);
  }
}

// ==========================================
// 11. PORTAL DO COLABORADOR - SOLICITAÇÕES
// ==========================================

export async function getSolicitacoesPortalFirestore(companyId: string, employeeId?: string): Promise<SolicitacaoPortalItem[]> {
  const empId = normalizeCompanyId(companyId);
  try {
    let q;
    if (employeeId) {
      q = query(
        collection(db, DP_COLLECTIONS.SOLICITACOES_PORTAL),
        where('companyId', '==', empId),
        where('employeeId', '==', employeeId)
      );
    } else {
      q = query(
        collection(db, DP_COLLECTIONS.SOLICITACOES_PORTAL),
        where('companyId', '==', empId)
      );
    }
    const snapshot = await getDocs(q);
    const list: SolicitacaoPortalItem[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as SolicitacaoPortalItem);
    });
    list.sort((a, b) => new Date(b.dataSolicitacao).getTime() - new Date(a.dataSolicitacao).getTime());
    return list;
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar solicitações do portal:', error);
    return [];
  }
}

export async function saveSolicitacaoPortalFirestore(solicitacao: SolicitacaoPortalItem): Promise<void> {
  try {
    const docRef = doc(db, DP_COLLECTIONS.SOLICITACOES_PORTAL, solicitacao.id);
    await setDoc(docRef, sanitizeFirestoreData({
      ...solicitacao,
      companyId: solicitacao.companyId || '',
      updatedAt: new Date().toISOString()
    }), { merge: true });
  } catch (error) {
    console.error('[DP Firestore] Erro ao salvar solicitação do portal:', error);
  }
}

// ==========================================
// 12. PORTAL DO COLABORADOR - CHAMADOS SUPORTE
// ==========================================

export async function getChamadosSuporteFirestore(companyId: string, employeeId?: string): Promise<ChamadoSuporteItem[]> {
  const empId = normalizeCompanyId(companyId);
  try {
    let q;
    if (employeeId) {
      q = query(
        collection(db, DP_COLLECTIONS.CHAMADOS_SUPORTE),
        where('companyId', '==', empId),
        where('employeeId', '==', employeeId)
      );
    } else {
      q = query(
        collection(db, DP_COLLECTIONS.CHAMADOS_SUPORTE),
        where('companyId', '==', empId)
      );
    }
    const snapshot = await getDocs(q);
    const list: ChamadoSuporteItem[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as ChamadoSuporteItem);
    });
    list.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
    return list;
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar chamados de suporte:', error);
    return [];
  }
}

export async function saveChamadoSuporteFirestore(chamado: ChamadoSuporteItem): Promise<void> {
  try {
    const docRef = doc(db, DP_COLLECTIONS.CHAMADOS_SUPORTE, chamado.id);
    await setDoc(docRef, sanitizeFirestoreData({
      ...chamado,
      companyId: chamado.companyId || '',
      atualizadoEm: new Date().toISOString()
    }), { merge: true });
  } catch (error) {
    console.error('[DP Firestore] Erro ao salvar chamado de suporte:', error);
  }
}

// ==========================================
// 13. PORTAL DO COLABORADOR - COMUNICADOS
// ==========================================

export async function getComunicadosFirestore(companyId: string): Promise<ComunicadoItem[]> {
  const empId = normalizeCompanyId(companyId);
  try {
    const q = query(
      collection(db, DP_COLLECTIONS.COMUNICADOS),
      where('companyId', '==', empId)
    );
    const snapshot = await getDocs(q);
    const list: ComunicadoItem[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as ComunicadoItem);
    });
    list.sort((a, b) => new Date(b.dataPublicacao).getTime() - new Date(a.dataPublicacao).getTime());
    return list;
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar comunicados:', error);
    return [];
  }
}

export async function saveComunicadoFirestore(comunicado: ComunicadoItem): Promise<void> {
  try {
    const docRef = doc(db, DP_COLLECTIONS.COMUNICADOS, comunicado.id);
    await setDoc(docRef, sanitizeFirestoreData({
      ...comunicado,
      companyId: comunicado.companyId || ''
    }), { merge: true });
  } catch (error) {
    console.error('[DP Firestore] Erro ao salvar comunicado:', error);
  }
}

// ==========================================
// 14. PORTAL DO COLABORADOR - DOCUMENTOS DE ASSINATURA
// ==========================================

export async function getDocumentosAssinaturaFirestore(companyId: string, employeeId?: string): Promise<DocumentoAssinaturaItem[]> {
  const empId = normalizeCompanyId(companyId);
  try {
    let q;
    if (employeeId) {
      q = query(
        collection(db, DP_COLLECTIONS.DOCUMENTOS_ASSINATURA),
        where('companyId', '==', empId),
        where('employeeId', '==', employeeId)
      );
    } else {
      q = query(
        collection(db, DP_COLLECTIONS.DOCUMENTOS_ASSINATURA),
        where('companyId', '==', empId)
      );
    }
    const snapshot = await getDocs(q);
    const list: DocumentoAssinaturaItem[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as DocumentoAssinaturaItem);
    });
    return list;
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar documentos de assinatura:', error);
    return [];
  }
}

export async function saveDocumentoAssinaturaFirestore(docItem: DocumentoAssinaturaItem): Promise<void> {
  try {
    const docRef = doc(db, DP_COLLECTIONS.DOCUMENTOS_ASSINATURA, docItem.id);
    await setDoc(docRef, sanitizeFirestoreData({
      ...docItem,
      companyId: docItem.companyId || ''
    }), { merge: true });
  } catch (error) {
    console.error('[DP Firestore] Erro ao salvar documento de assinatura:', error);
  }
}

// ==========================================
// 15. CONVERSÃO DE CANDIDATO EM ADMISSÃO DP
// ==========================================

export async function enviarCandidatoParaAdmissaoDP(candidato: {
  id?: string;
  candidateId?: string;
  jobId?: string;
  companyId?: string;
  empresaId?: string;
  name?: string;
  nome?: string;
  email?: string;
  phone?: string;
  telefone?: string;
  cpf?: string;
  rg?: string;
  role?: string;
  cargoAtual?: string;
  vagaTitulo?: string;
  department?: string;
  departamento?: string;
  salaryExpectation?: string | number;
  pretensaoSalarial?: number;
  city?: string;
  state?: string;
  cidade?: string;
  responsavel?: string;
}): Promise<AdmissaoPending> {
  const companyId = candidateCompanyId(candidato);
  const candId = candidato.candidateId || candidato.id || `cand-${Date.now()}`;
  const admId = `adm-${candId.replace(/[^a-zA-Z0-9]/g, '')}`;

  const nome = (candidato.name || candidato.nome || '').trim();
  const email = (candidato.email || '').trim().toLowerCase();
  const telefone = candidato.phone || candidato.telefone || '';
  const cargo = candidato.role || candidato.cargoAtual || candidato.vagaTitulo || '';
  const depto = candidato.department || candidato.departamento || '';
  if (!nome || !email || !cargo) {
    throw new Error('Nome, e-mail e cargo são obrigatórios para iniciar a admissão.');
  }
  
  let salario = 0;
  if (typeof candidato.salaryExpectation === 'number') salario = candidato.salaryExpectation;
  else if (typeof candidato.salaryExpectation === 'string') {
    const parsed = parseFloat(candidato.salaryExpectation.replace(/\D/g, ''));
    if (!isNaN(parsed) && parsed > 0) salario = parsed;
  } else if (candidato.pretensaoSalarial) {
    salario = candidato.pretensaoSalarial;
  }

  const newAdmissao: AdmissaoPending = {
    id: admId,
    empresaId: companyId,
    candidatoId: candId,
    contratacaoId: candidato.id,
    jobId: candidato.jobId || '',
    vagaTitulo: candidato.vagaTitulo || cargo,
    nomeCompleto: nome,
    email: email,
    telefone: telefone,
    cpf: candidato.cpf || '',
    rg: candidato.rg || '',
    cargo: cargo,
    departamento: depto,
    salarioCombinado: salario,
    tipoContrato: 'CLT',
    dataAdmissaoPrevista: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    gestor: candidato.responsavel || '',
    endereco: {
      cidade: candidato.city || candidato.cidade || '',
      estado: candidato.state || ''
    },
    status: 'Documentação Pendente',
    checklist: [
      { item: 'RG', obrigatorio: true, concluido: !!candidato.rg },
      { item: 'CPF', obrigatorio: true, concluido: !!candidato.cpf },
      { item: 'Carteira de Trabalho (CTPS)', obrigatorio: true, concluido: false },
      { item: 'Comprovante de Residência', obrigatorio: true, concluido: false },
      { item: 'Título de Eleitor', obrigatorio: false, concluido: false },
      { item: 'Certificado Militar', obrigatorio: false, concluido: false },
      { item: 'Exame Admissional (ASO)', obrigatorio: true, concluido: false },
      { item: 'Foto 3x4', obrigatorio: false, concluido: false },
      { item: 'Diploma / Certificados', obrigatorio: false, concluido: false }
    ],
    historicoEtapas: [
      {
        dataHora: new Date().toISOString(),
        usuario: candidato.responsavel || 'Sistema ATS',
        acao: 'Candidato Enviado para Admissão',
        descricao: `Processo de admissão iniciado no DP a partir do ATS (Vaga: ${candidato.jobId || 'N/A'})`
      }
    ],
    createdAt: new Date().toISOString()
  };

  await saveAdmissaoFirestore(newAdmissao);
  return newAdmissao;
}

function candidateCompanyId(cand: any): string {
  return normalizeCompanyId(cand.companyId || cand.empresaId);
}

// ==========================================
// 16. ORGANOGRAMA E ESTRUTURA ORGANIZACIONAL
// ==========================================

export async function getOrganogramaFirestore(companyId: string): Promise<UnidadeOrganizacional[]> {
  const empId = normalizeCompanyId(companyId);
  try {
    const q = query(
      collection(db, DP_COLLECTIONS.ORGANOGRAMA),
      where('companyId', '==', empId)
    );
    const snapshot = await getDocs(q);
    const list: UnidadeOrganizacional[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as UnidadeOrganizacional);
    });
    return list;
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar organograma:', error);
    return [];
  }
}

export async function saveUnidadeOrganizacionalFirestore(unidade: UnidadeOrganizacional): Promise<void> {
  try {
    const companyId = normalizeCompanyId(unidade.companyId);
    const docRef = doc(db, DP_COLLECTIONS.ORGANOGRAMA, unidade.id);
    await setDoc(docRef, sanitizeFirestoreData({
      ...unidade,
      companyId,
      empresaId: companyId,
      updatedAt: new Date().toISOString()
    }), { merge: true });
  } catch (error) {
    console.error('[DP Firestore] Erro ao salvar unidade do organograma:', error);
    throw error;
  }
}

export async function deleteUnidadeOrganizacionalFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, DP_COLLECTIONS.ORGANOGRAMA, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('[DP Firestore] Erro ao excluir unidade do organograma:', error);
    throw error;
  }
}

// ==========================================
// 17. GESTÃO DE CARGOS E SALÁRIOS
// ==========================================

export async function getCargosSalariosFirestore(companyId: string): Promise<CargoSalarioItem[]> {
  const empId = normalizeCompanyId(companyId);
  try {
    const q = query(
      collection(db, DP_COLLECTIONS.CARGOS),
      where('companyId', '==', empId)
    );
    const snapshot = await getDocs(q);
    const list: CargoSalarioItem[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as CargoSalarioItem);
    });
    return list;
  } catch (error) {
    console.warn('[DP Firestore] Erro ao buscar cargos e salários:', error);
    return [];
  }
}

export async function saveCargoSalarioFirestore(cargoItem: CargoSalarioItem): Promise<void> {
  try {
    const companyId = normalizeCompanyId(cargoItem.companyId);
    const docRef = doc(db, DP_COLLECTIONS.CARGOS, cargoItem.id);
    await setDoc(docRef, sanitizeFirestoreData({
      ...cargoItem,
      companyId,
      empresaId: companyId,
      updatedAt: new Date().toISOString()
    }), { merge: true });
  } catch (error) {
    console.error('[DP Firestore] Erro ao salvar cargo e salário:', error);
    throw error;
  }
}

export async function deleteCargoSalarioFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, DP_COLLECTIONS.CARGOS, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('[DP Firestore] Erro ao excluir cargo e salário:', error);
  }
}
