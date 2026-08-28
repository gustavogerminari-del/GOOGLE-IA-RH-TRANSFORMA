export type OrigemProcesso =
  | 'recrutamento_interno'
  | 'interno'
  | 'vaga_interna'
  | 'recrutamento_cliente'
  | 'headhunter'
  | 'HEADHUNTER'
  | 'RH_INTERNO';

export type JobStatus = 
  | 'Aberta' 
  | 'Pausada' 
  | 'Fechada' 
  | 'Rascunho' 
  | 'Busca ativa' 
  | 'Triagem' 
  | 'Aguardando cliente' 
  | 'ativa'
  | 'Arquivada';

export type JobType = 'CLT' | 'PJ' | 'Estágio' | 'Temporário' | 'Executive';

export type JobLocationType = 'Presencial' | 'Remoto' | 'Híbrido';

export type CandidateClassification = 'Recomendado' | 'Alto potencial' | 'Pendente' | 'Arquivado';

export type ProcessStage = 
  | 'Inscrito'
  | 'Triagem' 
  | 'Entrevista RH' 
  | 'Teste Técnico' 
  | 'Entrevista Gestor' 
  | 'Entrevista Headhunter' 
  | 'Apresentado ao cliente' 
  | 'Entrevista com cliente' 
  | 'Proposta' 
  | 'Contratado' 
  | 'Reprovado' 
  | 'Desistiu';

export type InterviewType = 
  | 'Triagem'
  | 'Entrevista RH'
  | 'Teste Técnico'
  | 'Entrevista com Gestor'
  | 'Fit Cultural'
  | 'Entrevista Headhunter'
  | 'Entrevista Cliente'
  | 'Entrevista Executiva';

export interface UnifiedJob {
  id: string;
  empresaId: string;
  companyId?: string;
  origemProcesso: OrigemProcesso;
  moduloOrigem?: string;
  origem?: string;
  tipoProcesso?: string;
  projetoHeadhunter?: boolean;
  criadaPorModulo?: string;
  isHeadhunter?: boolean;
  destinoContratacao?: string;
  
  // Cliente (Headhunter)
  clienteId?: string;
  clienteNome?: string;
  nomeEmpresa?: string;
  companyName?: string;
  
  // Dados do Cargo / Vaga
  titulo: string;
  title?: string;
  cargo?: string;
  codigoVaga?: string;
  descricao: string;
  description?: string;
  requisitos: string[];
  requirements?: string[];
  salario: string;
  salaryRange?: string;
  salarioValor?: number;
  tipoContrato: JobType;
  type?: JobType;
  location: string;
  cidade?: string;
  estado?: string;
  locationType?: JobLocationType;
  beneficios?: string[];
  benefits?: string[];
  quantidadeVagas: number;
  openings?: number;
  applicantsCount?: number;
  candidatosCount?: number;
  status: JobStatus;
  publicada?: boolean;
  
  // Responsáveis e Estrutura Interna
  responsavelId?: string;
  recruiterName?: string;
  consultorResponsavel?: string;
  recrutadorResponsavel?: string;
  department?: string;
  departamento?: string;
  gestorRequisitante?: string;
  centroCusto?: string;

  // Headhunter Específicos
  tipoVaga?: 'empresa' | 'headhunter';
  oportunidadeId?: string;
  propostaId?: string;
  contratoId?: string;
  responsavelComercial?: string;
  valorContratado?: number;
  prazoGarantia?: number;
  valorNegociado?: number;
  valorVaga?: number;
  valorCobrado?: number;
  regraCobranca?: string;
  percentualComissao?: number;
  comissaoCalculada?: number;
  receitaPrevista?: number;
  slaDias?: number;
  prazoSla?: number;
  dataPrevista?: string;
  contratoAtivo?: boolean;
  garantiaDias?: number;
  posicoesPreenchidas?: number;

  dataCriacao: string;
  dataAbertura?: string;
  createdAt?: string;
  deadline?: string;
  atualizadoEm?: string;
  diasEmAberto?: number;
  prioridade?: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  candidatosIds?: string[];
  documentosCount?: number;
  historico?: Array<{ data: string; evento: string; autor: string }>;
}

export interface UnifiedCandidate {
  id: string;
  empresaId: string;
  companyId?: string;
  candidatoId?: string;
  jobId?: string;
  origemProcesso?: OrigemProcesso;
  nome: string;
  name?: string;
  email: string;
  telefone: string;
  phone?: string;
  fotoUrl?: string;
  avatar?: string;
  cidade?: string;
  estado?: string;
  location?: string;
  cargoAtual: string;
  role?: string;
  cargoPretendido?: string;
  area?: string;
  salarioAtual?: number;
  pretensaoSalarial?: number;
  salaryExpectation?: string;
  disponibilidade?: string;
  experienciaAnos: number;
  experienceYears?: number;
  competencias: string[];
  skills?: string[];
  status: 'Ativo' | 'Em Processo' | 'Contratado' | 'Indisponível';
  rating?: number;
  notes?: string;
  appliedDate?: string;
  source?: 'LinkedIn' | 'Indicação' | 'Site Institucional' | 'Gupy' | 'Headhunter' | 'Outro' | string;
  origem?: 'Portal' | 'Busca Ativa' | 'LinkedIn' | 'Indicação' | 'Importação' | string;
  curriculoUrl?: string;
  resumeUrl?: string;
  curriculoTexto?: string;
  compatibilidadePercent?: number;
  matchIaPercent?: number;
  escolaridade?: string;
  etapaAtual?: ProcessStage;
  dataCandidatura?: string;
  anotacoes?: Array<{ id: string; autor: string; data: string; texto: string }>;
  documentos?: Array<{ id: string; nome: string; tipo: string; url: string; dataUpload: string; status: 'Pendente' | 'Verificado' | 'Rejeitado' }>;
  
  // Headhunter / Triagem IA
  classificacao?: CandidateClassification;
  triagemIaScore?: number;
  triagemIaParecer?: string;
  triagemRhStatus?: string;
  parecerTecnico?: string;
  abordagemStatus?: string;
  potencialComercial?: string;

  currentJobId?: string;
  currentStageId?: string;

  historico?: Array<{ data: string; evento: string; autor?: string }>;
  linhaDoTempo?: Array<{ data: string; titulo: string; detalhe: string }>;
}

export interface UnifiedCandidateProcess {
  id: string;
  empresaId: string;
  companyId?: string;
  candidatoId: string;
  vagaId: string;
  clienteId?: string;
  clienteNome?: string;
  origemProcesso: OrigemProcesso;
  etapaAtual: ProcessStage;
  status: 'Em Andamento' | 'Aprovado' | 'Reprovado' | 'Desistiu' | 'Contratado';
  responsavelId?: string;
  responsavelNome?: string;
  dataEntradaEtapa?: string;
  ultimaMovimentacao?: string;
  proximaAcao?: string;
  dataApresentacaoCliente?: string;
  retornoCliente?: string;
  valorVaga?: number;
  comissaoPrevista?: number;
  criadoEm: string;
  atualizadoEm?: string;
}

export interface UnifiedInterview {
  id: string;
  empresaId?: string;
  companyId?: string;
  origemProcesso: OrigemProcesso;
  candidatoId: string;
  candidatoNome: string;
  candidateRole?: string;
  vagaId: string;
  vagaTitulo: string;
  clienteId?: string;
  clienteNome?: string;
  entrevistadorNome: string;
  interviewerName?: string;
  dataHora: string;
  date?: string;
  time?: string;
  tipo: InterviewType;
  type?: string;
  modalidade?: 'Presencial' | 'Online (Meet)' | 'Online (Teams)' | 'Telefone';
  salaVirtualUrl?: string;
  status: 'Agendada' | 'Concluída' | 'Cancelada' | 'Reagendada';
  pauta?: string;
  feedback?: any;
  parecer?: string;
  nota?: number;
  resultado?: 'Aprovado' | 'Em Avaliação' | 'Reprovado' | 'Standby' | 'Manter no Banco';
  proximaEtapa?: string;
}

export interface UnifiedAgendaEvent {
  id: string;
  empresaId: string;
  companyId?: string;
  origemProcesso: OrigemProcesso;
  tipoEvento: 'Reunião' | 'Entrevista' | 'Visita' | 'Follow-up' | 'Pendência' | 'Retorno' | 'Ligação' | 'SLA / Prazo' | 'Garantia';
  titulo: string;
  clienteId?: string;
  clienteNome?: string;
  vagaId?: string;
  vagaTitulo?: string;
  candidatoId?: string;
  candidatoNome?: string;
  responsavelNome: string;
  dataHora: string;
  descricao: string;
  concluido: boolean;
}

export interface UnifiedHiring {
  id: string;
  empresaId: string;
  companyId?: string;
  origemProcesso: OrigemProcesso;
  candidatoId: string;
  candidatoNome: string;
  vagaId: string;
  vagaTitulo: string;
  cargo: string;
  clienteId?: string;
  clienteNome?: string;
  responsavelNome: string;
  dataContratacao: string;
  salarioFinal: number;
  status: 'Concluído' | 'Em Onboarding' | 'Cancelado';
  
  // Exclusivo Headhunter
  receitaGerada?: number;
  comissaoGerada?: number;
  faturamentoGerado?: boolean;
  garantiaAteData?: string;
}
