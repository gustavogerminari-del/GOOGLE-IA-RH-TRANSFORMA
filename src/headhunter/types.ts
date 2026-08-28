export type HeadhunterRole = 'MASTER' | 'Administrador' | 'Gestor' | 'Headhunter' | 'Recrutador' | 'Financeiro';

export type LeadStage = 
  | 'Novo lead' 
  | 'Contato realizado' 
  | 'Diagnóstico' 
  | 'Proposta enviada' 
  | 'Negociação' 
  | 'Aguardando assinatura' 
  | 'Ganho' 
  | 'Perdido';

export type JobStatus = 'Rascunho' | 'Aberta' | 'Busca ativa' | 'Triagem' | 'Entrevistas' | 'Aguardando cliente' | 'Em Andamento' | 'Fechada' | 'Pausada' | 'Cancelada' | 'Arquivada';

export type CandidateClassification = 'Recomendado' | 'Alto potencial' | 'Pendente' | 'Arquivado';

export type ProcessStage = 'Mapeado' | 'Abordado' | 'Interessado' | 'Triagem' | 'Entrevista com headhunter' | 'Apresentado ao cliente' | 'Entrevista com cliente' | 'Referências' | 'Proposta' | 'Contratado' | 'Reprovado' | 'Desistiu';

export type HeadhunterStage = 
  | 'Identificado'
  | 'Em análise'
  | 'Contato pendente'
  | 'Contatado'
  | 'Interessado'
  | 'Vinculado à vaga'
  | 'Entrevista'
  | 'Recusado'
  | 'Sem retorno'
  | 'Contratado';

export type CandidateStatus = 'Triagem' | 'Entrevista Headhunter' | 'Entrevista Cliente' | 'Proposta' | 'Contratado' | 'Reprovado' | ProcessStage | HeadhunterStage;

export type ReceitaStatus = 'Prevista' | 'Aguardando' | 'Parcialmente Recebida' | 'Recebida' | 'Vencida' | 'Cancelada' | 'Estornada';
export type CommissionStatus = 'Prevista' | 'Aguardando recebimento' | 'Liberada' | 'Parcialmente paga' | 'Paga' | 'Cancelada';
export type CommissionType = 'Percentual' | 'Valor Fixo' | 'Sem Comissão' | 'Personalizado' | 'Comissão fixa' | 'Comissão percentual' | 'Comissão compartilhada' | 'Comissão por equipe' | 'Comissão por recrutador';
export type ExpenseCategory = 'Anúncio' | 'Plataforma / LinkedIn' | 'Testes & Avaliações' | 'Deslocamento / Uber' | 'Hospedagem' | 'Alimentação' | 'Terceirização' | 'Aluguel' | 'Energia & Internet' | 'Salários & Encargos' | 'Marketing' | 'Softwares & Licenças' | 'Equipamentos' | 'Impostos & Contador' | 'Despesas Bancárias' | 'Combustível' | 'Pedágio' | 'Uber' | 'Hotel' | 'Passagens' | 'Material' | 'Internet' | 'Telefone' | 'Outros';
export type GarantiaStatus = 'Ativa' | 'Próxima do Vencimento' | 'Encerrada' | 'Reposição solicitada' | 'Reposição em andamento' | 'Cancelada';

export type ProposalStatus = 'Rascunho' | 'Enviada' | 'Visualizada' | 'Aprovada' | 'Recusada' | 'Vencida' | 'Cancelada';
export type ContractStatus = 'Rascunho' | 'Em revisão' | 'Aguardando assinatura' | 'Assinado' | 'Vigente' | 'Encerrado' | 'Cancelado';

export interface HeadhunterBaseDoc {
  id: string;
  empresaId: string;
  companyId?: string;
  criadoPor: string;
  criadoEm: string;
  atualizadoEm?: string;
  status: string;
}

export interface HeadhunterReceitaParcela {
  numero: number;
  valor: number;
  vencimento: string;
  status: 'Pendente' | 'Pago' | 'Atrasado';
  dataPagamento?: string;
  formaPagamento?: string;
  observacoes?: string;
}

export type TipoReceitaHeadhunter = 
  | 'Principal'
  | 'Cobrança complementar'
  | 'Taxa adicional'
  | 'Multa'
  | 'Reembolso'
  | 'Outro lançamento extraordinário';

export interface HeadhunterReceita extends HeadhunterBaseDoc {
  statusLabel?: string;
  clienteId: string;
  clienteNome: string;
  vagaId?: string;
  vagaCodigo?: string;
  vagaTitulo?: string;
  candidatoId?: string;
  candidatoNome?: string;
  contratacaoId?: string;
  propostaId?: string;
  contratoId?: string;
  
  origemModulo?: 'headhunter' | string;
  origemTipo?: 'contratacao' | string;
  origemId?: string;

  tipoReceita?: TipoReceitaHeadhunter | string;
  justificativa?: string;

  valorContratado: number;
  valorRecebido: number;
  saldo: number;
  dataEmissao: string;
  dataVencimento: string;
  dataRecebimento?: string;
  formaPagamento: 'PIX' | 'Boleto' | 'Transferência' | 'Cartão' | 'Nota Fiscal' | 'Outro';
  numeroNotaFiscal?: string;
  observacoes?: string;
  situacao: ReceitaStatus;
  parcelas?: HeadhunterReceitaParcela[];
  historico?: Array<{ data: string; alteracao: string; usuario: string; valorAnterior?: number; valorNovo?: number; motivo?: string }>;
  historicoStatus?: Array<{ id: string; dataHora: string; statusAnterior: string; novoStatus: string; usuario: string; descricao?: string }>;
}

export interface HeadhunterExpense extends HeadhunterBaseDoc {
  tipoDespesa?: 'vaga' | 'geral';
  clienteId?: string | null;
  clienteNome?: string | null;
  vagaId?: string | null;
  vagaTitulo?: string | null;
  consultorNome: string;
  centroCusto: string;
  categoria: ExpenseCategory;
  descricao?: string;
  data: string;
  dataLancamento?: string;
  valor: number;
  comprovanteUrl?: string;
  responsavel?: string;
  situacao?: 'Pendente' | 'Pago' | 'Cancelado' | string;
  observacao?: string;
}

export interface HeadhunterCommission extends HeadhunterBaseDoc {
  beneficiarioId?: string;
  beneficiarioNome: string;
  clienteId: string;
  clienteNome: string;
  vagaId: string;
  vagaTitulo: string;
  contratacaoId?: string;
  consultorNome: string;
  tipoComissao: CommissionType;
  valorRecebidoVaga: number;
  percentual?: number;
  valorFixo?: number;
  valorComissao: number;
  valorPago: number;
  dataPrevista: string;
  dataLiberacao?: string;
  dataPagamento?: string;
  situacao: CommissionStatus;
  regraLiberacao: 'cliente_pagou' | 'proporcional' | 'manual';
  formaPagamento?: string;
  comprovanteUrl?: string;
  observacoes?: string;
  historico?: Array<{ data: string; acao: string; usuario: string }>;
}

export interface HeadhunterGarantia extends HeadhunterBaseDoc {
  clienteId: string;
  clienteNome: string;
  vagaId: string;
  vagaTitulo: string;
  candidatoId: string;
  candidatoNome: string;
  contratacaoId: string;
  dataInicial: string;
  dataFinal: string;
  prazoDias: number;
  situacao: GarantiaStatus;
  reposicaoVagaId?: string;
  observacoes?: string;
  diasRestantes?: number;
}

export interface RentabilidadeVaga {
  vagaId: string;
  vagaTitulo: string;
  clienteId: string;
  clienteNome: string;
  valorContratado: number;
  valorRecebido: number;
  despesasVaga: number;
  comissao: number;
  outrosCustos: number;
  lucroLiquido: number;
  margemPercentual: number;
}

export interface HeadhunterFinanceItem extends HeadhunterBaseDoc {
  tipo: 'Receita' | 'Despesa';
  categoria: string;
  descricao: string;
  clienteNome?: string;
  vagaTitulo?: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  formaPagamento: 'PIX' | 'Boleto' | 'Transferência' | 'Cartão' | 'Nota Fiscal';
  centroCusto: string;
  statusFinanceiro: 'Pendente' | 'Pago' | 'Atrasado' | 'Cancelado';
}

export interface HeadhunterClient extends HeadhunterBaseDoc {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  segmento: string;
  porte: string;
  qtdFuncionarios: number;
  responsavel: string;
  cargoResponsavel: string;
  telefone: string;
  whatsapp: string;
  email: string;
  site: string;
  endereco: string;
  // Comercial
  valorPadraoVaga: number;
  comissaoNegociadaPercent: number;
  formaCobranca: string;
  prazoPagamentoDias: number;
  contratoAtivo: boolean;
  // Relacionamentos
  historico: Array<{ data: string; descricao: string; autor: string }>;
  reunioesCount: number;
  pendenciasCount: number;
  vagasCount: number;
}

export interface HeadhunterLead extends HeadhunterBaseDoc {
  clienteId?: string;
  empresa: string;
  contato: string;
  email: string;
  telefone: string;
  origem: string;
  consultor: string;
  servico?: string;
  cargoOuQtdVagas?: string;
  qtdVagas?: number;
  etapa: LeadStage;
  valorPrevisto: number;
  probabilidadePercent: number;
  proximoContato: string;
  propostaAprovadaId?: string;
  contratoId?: string;
  vagaCriadaId?: string;
  historico: Array<{ data: string; anotacao: string; autor: string }>;
  observacoes: string;
}

export interface HeadhunterProposal extends HeadhunterBaseDoc {
  clienteId: string;
  clienteNome: string;
  oportunidadeId?: string;
  titulo: string;
  servico: string;
  qtdVagas: number;
  escopo: string;
  valor: number;
  modeloCobranca: 'Honorário Fixo' | 'Percentual do Anual' | 'Percentual do Salário' | 'Success Fee' | 'Retainer + Success';
  formaPagamento: string;
  prazoEntregaDias: number;
  prazoGarantiaDias: number;
  validadeData: string;
  status: ProposalStatus;
  observacoes?: string;
  contratoGeradoId?: string;
  versao?: number;
}

export interface HeadhunterJob extends HeadhunterBaseDoc {
  clienteId: string;
  clienteNome: string;
  consultorResponsavel: string;
  recrutador: string;
  departamento?: string;
  cargo: string;
  resumo?: string;
  descricao: string;
  requisitos: string[];
  salario: string;
  salarioValor: number;
  tipoContratacao: 'CLT' | 'PJ' | 'Executive' | 'Temporário';
  local: string;
  cidadeModalidade?: string;
  dataAbertura: string;
  dataPrevista: string;
  slaDias: number;
  diasEmAberto?: number;
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  valorNegociado: number;
  valorVaga: number;
  valorCobrado?: number;
  regraCobranca?: string;
  percentualComissao: number;
  comissaoCalculada: number;
  qtdVagas: number;
  posicoesPreenchidas?: number;
  candidatosIds: string[];
  candidatosCount?: number;
  documentosCount: number;
  historico: Array<{ data: string; evento: string; autor: string }>;
}

export interface HeadhunterCandidate extends HeadhunterBaseDoc {
  clienteId?: string;
  vagaId?: string;
  vagaTitulo?: string;
  clienteNome?: string;
  nome: string;
  email: string;
  cpf?: string;
  telefone: string;
  fotoUrl?: string;
  cidade?: string;
  cargoAtual: string;
  cargoPretendido?: string;
  area?: string;
  salarioAtual: number;
  pretensaoSalarial: number;
  disponibilidade?: string;
  experienciaAnos?: number;
  competencias?: string[];
  palavrasChave?: string[];
  classificacao?: CandidateClassification;
  curriculoTexto: string;
  compatibilidadePercent: number;
  triagemIaScore: number;
  triagemIaParecer: string;
  triagemRhStatus: string;
  parecerTecnico: string;
  etapaPipeline: CandidateStatus;
  etapaHeadhunter?: HeadhunterStage;
  etapaProcesso?: ProcessStage;
  diasNaEtapa?: number;
  dataEntradaEtapa?: string;
  dataUltimoContato?: string;
  proximaAcao?: string;
  responsavelNome?: string;
  responsavelId?: string;
  origem: string;
  observacoes?: string;
  convertidoCandidatoOficial?: boolean;
  incluidoBancoTalentos?: boolean;
  conviteEnviado?: boolean;
  // RH_HEADHUNTER_PROSPECTING_V2
  convitePreparadoEm?: string;
  consentimentoBancoTalentos?: boolean;
  consentimentoBancoTalentosEm?: string;
  consentimentoBancoTalentosOrigem?: 'candidato' | 'registrado_pelo_recrutador';
  consentimentoBancoTalentosRevogadoEm?: string;
  // RH_HEADHUNTER_COMPETITIVE_V1 — apresentação ao cliente permanece no mesmo candidato.
  apresentadoAoCliente?: boolean;
  dataApresentacaoCliente?: string;
  contatoLiberadoCliente?: boolean;
  decisaoCliente?: 'Aprovado para Entrevista' | 'Reprovado' | 'Solicitar mais informações' | 'Solicitar novo candidato' | 'Finalista' | 'Aprovado para Contratação';
  decisaoClienteComentario?: string;
  decisaoClienteEm?: string;
  decisaoClientePendente?: boolean;
  feedbackClienteHistorico?: Array<{ decisao: string; comentario: string; data: string; clienteNome?: string }>;
  historicoContatos?: Array<{ data: string; descricao: string; autor: string; canal?: string }>;
  historico: Array<{ data: string; evento: string }>;
  linhaDoTempo: Array<{ data: string; titulo: string; detalhe: string }>;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface HeadhunterInterview extends HeadhunterBaseDoc {
  vagaId?: string;
  candidatoId?: string;
  clienteNome: string;
  vagaTitulo: string;
  consultorNome: string;
  recrutadorNome: string;
  candidatoNome: string;
  candidatoFoto?: string;
  cargo?: string;
  tipoEntrevista?: string;
  dataHora: string;
  horario?: string;
  duracaoMinutos?: number;
  modalidade: 'Presencial' | 'Online (Meet)' | 'Online (Teams)' | 'Telefone';
  linkModalidade?: string;
  salaVirtual?: string;
  pauta: string;
  feedback: string;
  parecer: string;
  nota?: number;
  pontosFortes?: string[];
  pontosAtencao?: string[];
  resultado: 'Aprovado' | 'Em Avaliação' | 'Reprovado' | 'Standby';
  proximaEtapa: string;
}

export interface HeadhunterHiring extends HeadhunterBaseDoc {
  candidatoId: string;
  candidatoNome: string;
  vagaId: string;
  vagaTitulo: string;
  clienteId: string;
  clienteNome: string;
  consultorNome: string;
  dataContratacao: string;
  salarioFinal: number;
  receitaGerada: number;
  comissaoGerada: number;
  faturamentoGerado: boolean;
}

export interface HeadhunterEvent extends HeadhunterBaseDoc {
  tipo: 'Reunião' | 'Entrevista' | 'Visita' | 'Follow-up' | 'Pendência' | 'Retorno' | 'Ligação';
  titulo: string;
  clienteNome?: string;
  candidatoNome?: string;
  dataHora: string;
  consultorNome: string;
  descricao: string;
  concluido: boolean;
}

export interface HeadhunterContract extends HeadhunterBaseDoc {
  status: ContractStatus;
  clienteId: string;
  clienteNome: string;
  propostaId?: string;
  oportunidadeId?: string;
  tituloContrato: string;
  tipo: 'Contrato Mãe' | 'Aditivo' | 'Tabela Comercial' | 'NDA' | 'Outros';
  escopo?: string;
  honorarios?: string;
  valorContrato?: number;
  formaPagamento?: string;
  prazoSlaDias?: number;
  prazoGarantiaDias?: number;
  dataInicio: string;
  dataVencimento: string;
  vigencia?: string;
  responsavelComercial?: string;
  valorOuPercentual?: string;
  assinado: boolean;
  vagaCriadaId?: string;
  documentoUrl?: string;
  observacoes?: string;
}
