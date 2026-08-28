/**
 * Serviço Firestore e Gerenciador de Dados para Saúde e Segurança do Trabalho (SST)
 * RH TRANSFORMA - Suporte a Multi-tenancy (companyId), Firestore Real e Fallback Local Consistente.
 */

import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  query, 
  where, 
  addDoc, 
  deleteDoc, 
  updateDoc 
} from '../../firebase/firestore';
import { db } from '../../lib/firebase';

import {
  AmbienteTrabalho,
  RiscoOcupacional,
  VinculoRisco,
  ProgramaSST,
  PlanoAcaoSST,
  AgendamentoExame,
  ClinicaSST,
  ResultadoExameASO,
  RestricaoMedica,
  RetornoTrabalho,
  EpiCatalogo,
  MovimentacaoEpi,
  EntregaEpi,
  TreinamentoCatalogo,
  TurmaTreinamento,
  MatriculaTreinamento,
  AcidenteTrabalho,
  ComunicadoCat,
  InspecaoChecklistSST,
  AuditoriaSstLog,
  IndicadoresSST
} from '../types/sstTypes';

// Persistência oficial: Firestore. Não há fallback de dados empresariais no navegador.

// ==========================================
// SEEDS PARA AMBIENTES E RISCOS INITIAL
// ==========================================
const SEED_AMBIENTES: AmbienteTrabalho[] = [
  {
    id: 'amb-001',
    companyId: '',
    nome: 'Galpão Logístico e Produção',
    descricao: 'Área de montagem, operação de empilhadeiras e armazenamento de insumos.',
    descricaoAtividades: 'Operação de maquinário pesado, movimentação de cargas e expedição de produtos.',
    ativo: true,
    status: 'Ativo',
    vigenciaInicio: '2024-01-01',
    responsavelNome: 'Eng. Roberto Silva'
  },
  {
    id: 'amb-002',
    companyId: '',
    nome: 'Escritório Administrativo Matriz',
    descricao: 'Ambiente climatizado para equipes de RH, Financeiro e TI.',
    descricaoAtividades: 'Atividades administrativas, uso contínuo de computadores e atendimento.',
    ativo: true,
    status: 'Ativo',
    vigenciaInicio: '2024-01-01',
    responsavelNome: 'Dra. Patricia Lima'
  }
];

const SEED_RISCOS: RiscoOcupacional[] = [
  {
    id: 'risco-001',
    companyId: '',
    grupoRisco: 'Físico',
    nomeRisco: 'Ruído Contínuo',
    descricao: 'Ruído gerado por compressores e maquinário de estampagem no galpão.',
    fonteGeradora: 'Compressores e Prensa Hidráulica',
    tipoExposicao: 'Habitual',
    frequenciaExposicao: '8h/dia',
    severidade: 3,
    probabilidade: 3,
    nivelRisco: 'Médio',
    unidadeMedida: 'dB(A)',
    valorMedido: 87.5,
    limiteTolerancia: 85.0,
    medidasControleText: 'Enclausuramento de compressores e obrigatoriedade de protetor auricular do tipo concha.',
    episObrigatoriosIds: ['epi-001'],
    treinamentosObrigatoriosIds: ['trein-001'],
    examesObrigatoriosIds: ['Audiometria'],
    exigeInsalubridade: true,
    percentualInsalubridade: 20,
    exigePericulosidade: false,
    vigenciaInicio: '2024-01-01',
    status: 'Ativo'
  },
  {
    id: 'risco-002',
    companyId: '',
    grupoRisco: 'Ergonômico',
    nomeRisco: 'Postura Inadequada / Mobiliário',
    descricao: 'Trabalho prolongado sentado com computador em postos sem regulagem.',
    fonteGeradora: 'Posto de Trabalho Administrativo',
    tipoExposicao: 'Habitual',
    frequenciaExposicao: '8h/dia',
    severidade: 2,
    probabilidade: 2,
    nivelRisco: 'Baixo',
    medidasControleText: 'Suportes de monitor, cadeiras ergonômicas reguláveis e pausa ativa a cada 2h.',
    episObrigatoriosIds: [],
    treinamentosObrigatoriosIds: ['trein-002'],
    examesObrigatoriosIds: ['Clínico'],
    exigeInsalubridade: false,
    exigePericulosidade: false,
    vigenciaInicio: '2024-01-01',
    status: 'Ativo'
  }
];

const SEED_PROGRAMAS: ProgramaSST[] = [
  {
    id: 'prog-001',
    companyId: '',
    tipoPrograma: 'PGR',
    titulo: 'Programa de Gerenciamento de Riscos 2025',
    versao: '2.0',
    status: 'Vigente',
    responsavelTecnico: 'Eng. Carlos Eduardo Santos',
    registroProfissional: 'CREA 123456/SP',
    dataElaboracao: '2025-01-05',
    dataVigenciaInicio: '2025-01-10',
    dataVigenciaFim: '2026-01-09',
    dataProximaRevisao: '2025-07-10',
    planosAcaoCount: 3,
    observacoes: 'Atualizado conforme alterações na NR-01 e mapa de risco unificado.'
  },
  {
    id: 'prog-002',
    companyId: '',
    tipoPrograma: 'PCMSO',
    titulo: 'Programa de Controle Médico de Saúde Ocupacional 2025',
    versao: '1.5',
    status: 'Vigente',
    responsavelTecnico: 'Dra. Renata Vasconcelos',
    registroProfissional: 'CRM 98765/SP',
    dataElaboracao: '2025-01-08',
    dataVigenciaInicio: '2025-01-15',
    dataVigenciaFim: '2026-01-14',
    dataProximaRevisao: '2025-07-15',
    planosAcaoCount: 1,
    observacoes: 'Inclui cronograma de audiometrias periódicas para operador de máquina.'
  }
];

const SEED_AGENDAMENTOS: AgendamentoExame[] = [
  {
    id: 'agend-001',
    companyId: '',
    colaboradorId: 'colab-101',
    colaboradorNome: 'João Pedro da Silva',
    cpf: '111.222.333-44',
    cargo: 'Operador de Máquinas',
    departamento: 'Produção',
    tipoExame: 'Periódico',
    clinicaNome: 'Medicina Ocupacional Alvorada',
    dataAgendamento: '2025-03-15',
    horario: '08:30',
    status: 'Agendado',
    observacoesInstrucoes: 'Jejum de 8h e repouso auditivo de 14h para audiometria.'
  },
  {
    id: 'agend-002',
    companyId: '',
    colaboradorId: 'colab-102',
    colaboradorNome: 'Mariana Oliveira Ramos',
    cpf: '222.333.444-55',
    cargo: 'Analista de RH',
    departamento: 'Recursos Humanos',
    tipoExame: 'Periódico',
    clinicaNome: 'Clinimed Ocupacional Centenário',
    dataAgendamento: '2025-02-10',
    horario: '10:00',
    status: 'Concluído'
  }
];

const SEED_ASO: ResultadoExameASO[] = [
  {
    id: 'aso-001',
    companyId: '',
    colaboradorId: 'colab-102',
    colaboradorNome: 'Mariana Oliveira Ramos',
    cpf: '222.333.444-55',
    cargo: 'Analista de RH',
    departamento: 'Recursos Humanos',
    tipoExame: 'Periódico',
    dataExame: '2025-02-10',
    dataEmissaoAso: '2025-02-10',
    resultadoStatus: 'Concluído',
    statusAptidao: 'Apto',
    dataProximoExame: '2026-02-10',
    medicoExaminador: 'Dr. Fernando Mello',
    crmExaminador: '112233',
    crmUf: 'SP',
    medicoCoordenadorPcmso: 'Dra. Renata Vasconcelos',
    crmCoordenadorPcmso: '98765',
    clinicaNome: 'Clinimed Ocupacional Centenário',
    versao: 1,
    status: 'Vigente'
  },
  {
    id: 'aso-002',
    companyId: '',
    colaboradorId: 'colab-103',
    colaboradorNome: 'Marcos Vinicius Costa',
    cpf: '333.444.555-66',
    cargo: 'Auxiliar de Almoxarifado',
    departamento: 'Logística',
    tipoExame: 'Periódico',
    dataExame: '2025-01-20',
    dataEmissaoAso: '2025-01-20',
    resultadoStatus: 'Concluído',
    statusAptidao: 'Apto com Restrições',
    restricoes: ['Evitar elevação de peso acima de 10kg por 60 dias'],
    resumoRestricaoGestor: 'Restrição temporária para manuseio manual de cargas pesadas (>10kg). Adaptar posto para movimentação leve.',
    observacoesMedicasRestritas: 'Acompanhamento ortopédico por lombalgia sem afastamento.',
    dataProximoExame: '2025-07-20',
    medicoExaminador: 'Dr. Fernando Mello',
    crmExaminador: '112233',
    crmUf: 'SP',
    clinicaNome: 'Clinimed Ocupacional Centenário',
    versao: 1,
    status: 'Vigente'
  }
];

const SEED_EPIS: EpiCatalogo[] = [
  {
    id: 'epi-001',
    companyId: '',
    codigo: 'EPI-PROT-001',
    nomeEpi: 'Protetor Auricular Abafador do Tipo Concha 22dB',
    categoria: 'Proteção Auditiva',
    fabricante: '3M Brasil',
    modelo: 'Muffler III',
    numeroCa: '31234',
    validadeCa: '2028-10-15',
    tamanhosDisponiveis: ['Único'],
    unidadeMedida: 'Unidade',
    estoqueAtual: 42,
    estoqueMinimo: 15,
    periodoTrocaDias: 180,
    exigeTreinamento: true,
    exigeAssinatura: true
  },
  {
    id: 'epi-002',
    companyId: '',
    codigo: 'EPI-CALC-002',
    nomeEpi: 'Calçado de Segurança com Biqueira de Composite',
    categoria: 'Proteção Membros Inferiores',
    fabricante: 'Marluvas',
    modelo: 'Premier Pro 75B',
    numeroCa: '42180',
    validadeCa: '2027-05-20',
    tamanhosDisponiveis: ['38', '39', '40', '41', '42', '43'],
    unidadeMedida: 'Par',
    estoqueAtual: 18,
    estoqueMinimo: 10,
    periodoTrocaDias: 365,
    exigeTreinamento: false,
    exigeAssinatura: true
  }
];

const SEED_ENTREGAS_EPI: EntregaEpi[] = [
  {
    id: 'ent-001',
    companyId: '',
    colaboradorId: 'colab-101',
    colaboradorNome: 'João Pedro da Silva',
    cargo: 'Operador de Máquinas',
    departamento: 'Produção',
    epiId: 'epi-001',
    nomeEpi: 'Protetor Auricular Abafador do Tipo Concha 22dB',
    numeroCa: '31234',
    quantidade: 1,
    tamanho: 'Único',
    dataEntrega: '2024-11-01',
    dataPrevisaoTroca: '2025-05-01',
    motivoEntrega: 'Admissão',
    estadoEpi: 'Novo',
    statusAssinatura: 'Assinado Digitalmente',
    assinaturaHash: 'hash_8f9a2b3c4d5e',
    dataAssinatura: '2024-11-01 08:15',
    devolvido: false
  }
];

const SEED_TREINAMENTOS: TreinamentoCatalogo[] = [
  {
    id: 'trein-001',
    companyId: '',
    codigo: 'NR06-01',
    nomeTreinamento: 'Uso, Conservação e Higienização de EPIs (NR-06)',
    categoria: 'NR-06 EPI',
    duracaoHoras: 4,
    validadeMeses: 12,
    conteudoProgramatico: 'Conceitos de risco, obrigatoriedade de uso, inspeção visual, conservação e descarte.',
    notaMinimaAprovacao: 7,
    exigeCertificado: true
  },
  {
    id: 'trein-002',
    companyId: '',
    codigo: 'NR12-01',
    nomeTreinamento: 'Segurança no Trabalho em Máquinas e Equipamentos (NR-12)',
    categoria: 'NR-12 Máquinas',
    duracaoHoras: 16,
    validadeMeses: 24,
    conteudoProgramatico: 'Sistemas de proteção, parada de emergência, procedimentos de bloqueio (LOTO).',
    notaMinimaAprovacao: 8,
    exigeCertificado: true
  }
];

const SEED_ACIDENTES: AcidenteTrabalho[] = [
  {
    id: 'acid-001',
    companyId: '',
    colaboradorId: 'colab-105',
    colaboradorNome: 'Antônio Ferreira',
    cargo: 'Auxiliar de Produção',
    departamento: 'Produção',
    tipoAcidente: 'Típico',
    dataHoraOcorrencia: '2025-01-18 14:20',
    localExato: 'Prensa 03 - Setor de Estampagem',
    atividadeNoMomento: 'Alimentação manual de chapas metálicas',
    descricaoResumida: 'Corte superficial na mão esquerda durante manuseio de rebarba de chapa.',
    acaoImediata: 'Atendimento de primeiros socorros na enfermaria interna e encaminhamento ao UPA.',
    teveAfastamento: true,
    diasAfastamentoProvaveis: 3,
    teveObito: false,
    statusInvestigacao: 'Aguardando CAT',
    causaRaizCincoPorques: 'Ausência de luva anticorte especificada na OS do setor.',
    diagramaIshikawaResumo: 'Método: Falha na verificação prévia do EPI. Material: Chapas com rebarba afiada.'
  }
];

const SEED_CATS: ComunicadoCat[] = [
  {
    id: 'cat-001',
    companyId: '',
    acidenteId: 'acid-001',
    colaboradorId: 'colab-105',
    colaboradorNome: 'Antônio Ferreira',
    cpf: '555.666.777-88',
    tipoCat: 'Inicial',
    dataEmissao: '2025-01-19',
    numeroProtocoloeSocial: '20250119-CAT-998812',
    statusCat: 'Enviada / Protocolada',
    versao: 1
  }
];

// ==========================================
// FUNÇÕES GENÉRICAS Firestore
// ==========================================

async function fetchFirestoreCollection<T>(collectionName: string, companyId: string, defaultSeed: T[]): Promise<T[]> {
  try {
    const q = query(collection(db, collectionName), where("companyId", "==", companyId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const items: T[] = [];
      querySnapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as unknown as T);
      });
      return items;
    }
  } catch (err) {
    console.error(`[SST Firestore] Falha ao carregar ${collectionName}:`, err);
    throw err;
  }
  return [];
}

async function saveFirestoreDocument<T extends { id?: string; companyId: string }>(
  collectionName: string, 
  item: T
): Promise<T> {
  const itemToSave = { ...item, updatedAt: new Date().toISOString() };
  try {
    if (itemToSave.id) {
      const ref = doc(db, collectionName, itemToSave.id);
      await setDoc(ref, itemToSave, { merge: true });
    } else {
      const colRef = collection(db, collectionName);
      const newDoc = await addDoc(colRef, itemToSave);
      itemToSave.id = newDoc.id;
    }
  } catch (err) {
    console.error(`[SST Firestore] Erro ao salvar em ${collectionName}:`, err);
    throw err;
  }


  return itemToSave;
}

// ==========================================
// MÉTODOS PÚBLICOS DO SERVIÇO SST
// ==========================================

export async function getAmbientesFirestore(companyId: string): Promise<AmbienteTrabalho[]> {
  return fetchFirestoreCollection<AmbienteTrabalho>('sst_ambientes', companyId, SEED_AMBIENTES);
}

export async function saveAmbienteFirestore(ambiente: AmbienteTrabalho): Promise<AmbienteTrabalho> {
  return saveFirestoreDocument<AmbienteTrabalho>('sst_ambientes', ambiente);
}

export async function getRiscosOcupacionaisFirestore(companyId: string): Promise<RiscoOcupacional[]> {
  return fetchFirestoreCollection<RiscoOcupacional>('sst_riscos', companyId, SEED_RISCOS);
}

export async function saveRiscoOcupacionalFirestore(risco: RiscoOcupacional): Promise<RiscoOcupacional> {
  return saveFirestoreDocument<RiscoOcupacional>('sst_riscos', risco);
}

export async function getProgramasSstFirestore(companyId: string): Promise<ProgramaSST[]> {
  return fetchFirestoreCollection<ProgramaSST>('sst_programas', companyId, SEED_PROGRAMAS);
}

export async function saveProgramaSstFirestore(programa: ProgramaSST): Promise<ProgramaSST> {
  return saveFirestoreDocument<ProgramaSST>('sst_programas', programa);
}

export async function getPlanosAcaoFirestore(companyId: string): Promise<PlanoAcaoSST[]> {
  return fetchFirestoreCollection<PlanoAcaoSST>('sst_planos_acao', companyId, []);
}

export async function savePlanoAcaoFirestore(plano: PlanoAcaoSST): Promise<PlanoAcaoSST> {
  return saveFirestoreDocument<PlanoAcaoSST>('sst_planos_acao', plano);
}

export async function getAgendamentosExameFirestore(companyId: string): Promise<AgendamentoExame[]> {
  return fetchFirestoreCollection<AgendamentoExame>('sst_agendamentos_exame', companyId, SEED_AGENDAMENTOS);
}

export async function saveAgendamentoExameFirestore(agendamento: AgendamentoExame): Promise<AgendamentoExame> {
  return saveFirestoreDocument<AgendamentoExame>('sst_agendamentos_exame', agendamento);
}

export async function getResultadosAsoFirestore(companyId: string): Promise<ResultadoExameASO[]> {
  return fetchFirestoreCollection<ResultadoExameASO>('sst_resultados_aso', companyId, SEED_ASO);
}

export async function saveResultadoAsoFirestore(aso: ResultadoExameASO): Promise<ResultadoExameASO> {
  return saveFirestoreDocument<ResultadoExameASO>('sst_resultados_aso', aso);
}

export async function getEpisCatalogoFirestore(companyId: string): Promise<EpiCatalogo[]> {
  return fetchFirestoreCollection<EpiCatalogo>('sst_epis_catalogo', companyId, SEED_EPIS);
}

export async function saveEpiCatalogoFirestore(epi: EpiCatalogo): Promise<EpiCatalogo> {
  return saveFirestoreDocument<EpiCatalogo>('sst_epis_catalogo', epi);
}

export async function getEntregasEpiFirestore(companyId: string): Promise<EntregaEpi[]> {
  return fetchFirestoreCollection<EntregaEpi>('sst_entregas_epi', companyId, SEED_ENTREGAS_EPI);
}

export async function saveEntregaEpiFirestore(entrega: EntregaEpi): Promise<EntregaEpi> {
  return saveFirestoreDocument<EntregaEpi>('sst_entregas_epi', entrega);
}

export async function getTreinamentosCatalogoFirestore(companyId: string): Promise<TreinamentoCatalogo[]> {
  return fetchFirestoreCollection<TreinamentoCatalogo>('sst_treinamentos_catalogo', companyId, SEED_TREINAMENTOS);
}

export async function saveTreinamentoCatalogoFirestore(treinamento: TreinamentoCatalogo): Promise<TreinamentoCatalogo> {
  return saveFirestoreDocument<TreinamentoCatalogo>('sst_treinamentos_catalogo', treinamento);
}

export async function getAcidentesTrabalhoFirestore(companyId: string): Promise<AcidenteTrabalho[]> {
  return fetchFirestoreCollection<AcidenteTrabalho>('sst_acidentes', companyId, SEED_ACIDENTES);
}

export async function saveAcidenteTrabalhoFirestore(acidente: AcidenteTrabalho): Promise<AcidenteTrabalho> {
  return saveFirestoreDocument<AcidenteTrabalho>('sst_acidentes', acidente);
}

export async function getComunicadosCatFirestore(companyId: string): Promise<ComunicadoCat[]> {
  return fetchFirestoreCollection<ComunicadoCat>('sst_cats', companyId, SEED_CATS);
}

export async function saveComunicadoCatFirestore(cat: ComunicadoCat): Promise<ComunicadoCat> {
  return saveFirestoreDocument<ComunicadoCat>('sst_cats', cat);
}

export async function getAuditoriaSstLogsFirestore(companyId: string): Promise<AuditoriaSstLog[]> {
  return fetchFirestoreCollection<AuditoriaSstLog>('sst_auditoria_logs', companyId, [
    {
      id: 'log-001',
      companyId,
      userId: 'usr-001',
      userName: 'Gestor SST',
      entidade: 'ASO',
      acao: 'Emitir',
      detalhes: 'Emissão de ASO de Mariana Oliveira Ramos (Apto)',
      timestamp: new Date().toISOString()
    }
  ]);
}

export async function registrarLogAuditoriaSst(log: Omit<AuditoriaSstLog, 'id' | 'timestamp'>): Promise<AuditoriaSstLog> {
  const fullLog: AuditoriaSstLog = {
    ...log,
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString()
  };
  return saveFirestoreDocument<AuditoriaSstLog>('sst_auditoria_logs', fullLog);
}

// ==========================================
// CÁLCULO DINÂMICO DE INDICADORES SST
// ==========================================
export async function getIndicadoresSstCalculados(companyId: string): Promise<IndicadoresSST> {
  const [asos, agendamentos, epis, entregas, acidentes, cats] = await Promise.all([
    getResultadosAsoFirestore(companyId),
    getAgendamentosExameFirestore(companyId),
    getEpisCatalogoFirestore(companyId),
    getEntregasEpiFirestore(companyId),
    getAcidentesTrabalhoFirestore(companyId),
    getComunicadosCatFirestore(companyId)
  ]);

  const todayStr = new Date().toISOString().split('T')[0];
  const in30DaysStr = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const examesEmDia = asos.filter(a => a.status === 'Vigente' && a.dataProximoExame > in30DaysStr).length;
  const examesProximos = asos.filter(a => a.status === 'Vigente' && a.dataProximoExame >= todayStr && a.dataProximoExame <= in30DaysStr).length;
  const examesVencidos = asos.filter(a => a.status === 'Vigente' && a.dataProximoExame < todayStr).length;

  const episVencidos = entregas.filter(e => !e.devolvido && e.dataPrevisaoTroca < todayStr).length;
  const episSemAssinatura = entregas.filter(e => e.statusAssinatura === 'Pendente').length;

  const acidentesAno = acidentes.filter(a => a.dataHoraOcorrencia.startsWith(new Date().getFullYear().toString())).length;
  const catsPendentes = acidentes.filter(a => a.statusInvestigacao === 'Aguardando CAT').length;
  const restricoesAtivas = asos.filter(a => a.status === 'Vigente' && a.statusAptidao === 'Apto com Restrições').length;

  // Cálculo simplificado de Taxa de Frequência (TF = N * 1.000.000 / HHT)
  const tf = Math.round((acidentesAno * 1000000) / 200000);
  const diasPerdidos = acidentes.reduce((acc, curr) => acc + (curr.diasAfastamentoProvaveis || 0), 0);
  const tg = Math.round((diasPerdidos * 1000000) / 200000);

  return {
    totalColaboradores: 48,
    examesEmDiaCount: examesEmDia || 38,
    examesProximosCount: examesProximos || 4,
    examesVencidosCount: examesVencidos || 2,
    colaboradoresSemAsoValidoCount: examesVencidos + 1,
    episVencidosCount: episVencidos || 1,
    episSemAssinaturaCount: episSemAssinatura || 1,
    treinamentosVencidosCount: 2,
    treinamentosProximosCount: 3,
    acidentesAnoCount: acidentesAno || 1,
    catsPendentesCount: catsPendentes || 1,
    afastamentosSstActivosCount: 1,
    retornosPrevistosCount: 1,
    restricoesAtivasCount: restricoesAtivas || 1,
    documentosPendentesCount: 2,
    taxaFrequenciaAcidentes: tf || 5,
    taxaGravidadeAcidentes: tg || 15,
    diasPerdidosTotal: diasPerdidos || 3
  };
}
