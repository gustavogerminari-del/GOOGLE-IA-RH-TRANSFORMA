// RH_PONTO_TERCEIRO_V1
export type SubMenuPonto =
  | 'visao-geral'
  | 'marcacoes'
  | 'jornadas-escalas'
  | 'banco-horas'
  | 'horas-extras'
  | 'atrasos-faltas'
  | 'ajustes-justificativas'
  | 'espelho'
  | 'fechamento-folha'
  | 'integracao';

export type StatusPonto = 'Trabalhando' | 'Intervalo' | 'Ausente' | 'Finalizado';

export type TipoEscala = 'Administrativo' | '12x36' | '6x1' | '5x2' | 'Plantão' | 'Flexível' | 'Parcial' | 'Personalizada';

export type TipoMarcacao = 
  | 'entrada' 
  | 'inicio_intervalo' 
  | 'fim_intervalo' 
  | 'saida' 
  | 'entrada_extra' 
  | 'saida_extra';

export interface MarcaPontoItem {
  timeEntryId: string;
  externalPunchId?: string;
  provider?: string;
  employeeId: string;
  userId: string;
  companyId: string;
  empresaId: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string
  type: TipoMarcacao;
  source: 'web' | 'mobile' | 'tablet' | 'relogio' | 'manual';
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  ip?: string;
  deviceId?: string;
  browser?: string;
  operatingSystem?: string;
  photoUrl?: string;
  status: 'valido' | 'inconsistente' | 'em_analise';
  createdAt: string;
  locationName?: string;
  isOutsideGeofence?: boolean;
}

export interface RegistroPontoDoc {
  id: string;
  externalRecordId?: string;
  provider?: string;
  funcionarioId: string;
  funcionarioNome: string;
  empresaId: string;
  companyId?: string;
  data: string; // YYYY-MM-DD
  horaEntrada?: string; // HH:mm
  inicioIntervalo?: string; // HH:mm
  retornoIntervalo?: string; // HH:mm
  horaSaida?: string; // HH:mm
  horaEntradaExtra?: string;
  horaSaidaExtra?: string;
  marcacoes?: MarcaPontoItem[];
  latitude?: number;
  longitude?: number;
  dispositivo?: string;
  fotoRegistro?: string; // Base64 or URL
  status: StatusPonto;
  observacao?: string;
  horasTrabalhadasMinutos?: number;
  horasExtrasMinutos?: number;
  horasExtras50Minutos?: number;
  horasExtras100Minutos?: number;
  horasExtras140Minutos?: number;
  atrasoMinutos?: number;
  faltasMinutos?: number;
  saidaAntecipadaMinutos?: number;
  adicionalNoturnoMinutos?: number;
  modalidadeTrabalho?: 'presencial' | 'remoto' | 'hibrido' | 'externo';
  inconsistencias?: string[];
  inconsistente?: boolean;
  fechado?: boolean;
}

export interface EscalaTrabalhoDoc {
  id: string;
  scheduleId?: string;
  companyId?: string;
  empresaId: string;
  nome: string;
  tipo: TipoEscala;
  cargaDiariaMinutos?: number;
  cargaSemanalMinutos?: number;
  horarioEntrada: string; // "08:00"
  horarioSaida: string; // "17:00"
  intervalo: string; // "01:00"
  toleranciaMinutos: number;
  diasTrabalho: string[]; // ["seg", "ter", "qua", "qui", "sex"]
  adicionalNoturnoAtivo?: boolean;
  regrasHorasExtras?: {
    percentualDiaUtil: number;
    percentualSabado: number;
    percentualDomingoFeriado: number;
  };
  status?: 'Ativo' | 'Inativo';
  createdAt?: string;
  updatedAt?: string;
}

export interface AjustePontoDoc {
  id: string;
  justificationId?: string;
  funcionarioId: string;
  employeeId?: string;
  funcionarioNome: string;
  companyId?: string;
  empresaId: string;
  data: string;
  horarioEntradaProp: string;
  horarioSaidaProp: string;
  inicioIntervaloProp?: string;
  fimIntervaloProp?: string;
  tipoAjuste?: 'esquecimento' | 'horario_incorreto' | 'atestado' | 'atividade_externa' | 'problema_tecnico' | 'outro';
  motivo: string;
  observacao?: string;
  anexoUrl?: string;
  registroOriginal?: Partial<RegistroPontoDoc>;
  status: 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Cancelado';
  aprovadoPor?: string;
  dataAprovacao?: string;
  decisaoObservacao?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HoraExtraSolicitacaoDoc {
  id: string;
  overtimeRequestId?: string;
  employeeId: string;
  funcionarioNome: string;
  companyId: string;
  empresaId: string;
  data: string;
  quantidadeMinutos: number;
  percentual: 50 | 100 | 140 | number;
  motivo: string;
  solicitante: string;
  aprovadorGestor?: string;
  validadorRh?: string;
  destinacao?: 'banco_horas' | 'pagamento_folha';
  status: 'pendente' | 'aprovada' | 'rejeitada' | 'cancelada' | 'realizada' | 'validada';
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BancoHorasDoc {
  id: string;
  bankEntryId?: string;
  funcionarioId: string;
  employeeId?: string;
  funcionarioNome: string;
  companyId?: string;
  empresaId: string;
  creditoMinutos: number;
  debitoMinutos: number;
  saldoMinutos: number;
  ultimaAtualizacao: string;
  validadeData?: string;
  historicoLancamentos?: {
    id: string;
    data: string;
    tipo: 'credito' | 'debito' | 'compensacao' | 'ajuste' | 'expiracao';
    minutos: number;
    origem: string;
    responsavel: string;
    createdAt: string;
  }[];
}

export interface CercaVirtualDoc {
  id: string;
  locationId?: string;
  companyId: string;
  empresaId: string;
  nome: string;
  tipo: 'matriz' | 'filial' | 'cliente' | 'obra' | 'deposito' | 'externo';
  endereco: string;
  latitude: number;
  longitude: number;
  raioPermitidoMetros: number;
  status: 'Ativo' | 'Inativo';
  createdAt?: string;
}

export interface TrocaEscalaDoc {
  id: string;
  shiftSwapId?: string;
  companyId: string;
  empresaId: string;
  solicitanteId: string;
  solicitanteNome: string;
  substitutoId: string;
  substitutoNome: string;
  dataOriginal: string;
  dataTroca: string;
  motivo: string;
  aprovadoPor?: string;
  status: 'Pendente' | 'Aprovado' | 'Rejeitado';
  createdAt: string;
}

export interface FeriadoDoc {
  id: string;
  holidayId?: string;
  companyId: string;
  empresaId: string;
  nome: string;
  data: string; // YYYY-MM-DD
  localidade: 'nacional' | 'estadual' | 'municipal' | 'interno';
  recorrente: boolean;
  status: 'Ativo' | 'Inativo';
}

export interface FechamentoPontoDoc {
  id: string;
  companyId: string;
  empresaId: string;
  mesAno: string; // "2026-08"
  dataInicial: string;
  dataFinal: string;
  totalFuncionarios: number;
  totalHorasTrabalhadasMinutos: number;
  totalHorasExtrasMinutos: number;
  totalFaltasMinutos: number;
  totalAtrasosMinutos: number;
  pendenciasAbertas: number;
  status: 'Aberto' | 'Fechado' | 'Reaberto';
  fechadoPor?: string;
  dataFechamento?: string;
  reabertoPor?: string;
  dataReabertura?: string;
  justificativaReabertura?: string;
}

export interface ComprovantePontoDoc {
  id: string;
  hashComprovante: string;
  funcionarioNome: string;
  matricula: string;
  empresaNome: string;
  cnpjEmpresa?: string;
  data: string;
  horario: string;
  tipoMarcacao: TipoMarcacao;
  origem: string;
  localizacaoStr?: string;
  codigoAutenticacao: string;
  createdAt: string;
}

export interface LogAuditoriaPontoDoc {
  id: string;
  companyId: string;
  empresaId: string;
  usuarioId: string;
  usuarioNome: string;
  acao: string;
  detalhes: string;
  ip?: string;
  createdAt: string;
}

export interface FuncionarioPontoInfo {
  id: string;
  employeeId?: string;
  externalEmployeeId?: string;
  provider?: string;
  companyId?: string;
  empresaId: string;
  nome: string;
  cpf: string;
  matricula?: string;
  cargo: string;
  setor: string;
  email: string;
  telefone: string;
  escalaId: string;
  escalaNome?: string;
  gestorId?: string;
  gestorNome?: string;
  status: 'Ativo' | 'Inativo' | 'Afastado' | 'Ferias';
  statusLivePonto?: StatusPonto;
  pontoLiberado?: boolean;
  dispositivosAutorizados?: string[];
  modalidadeTrabalhoPadrao?: 'presencial' | 'remoto' | 'hibrido' | 'externo';
}

export interface ConfiguracoesPonto {
  empresaId: string;
  companyId?: string;
  modoLocalizacao: 'sem_localizacao' | 'obrigatoria' | 'apenas_app' | 'perimetro' | 'externo';
  geofencingAtivo: boolean;
  latitudeCentro?: number;
  longitudeCentro?: number;
  raioPermitidoMetros: number;
  exigirFoto: boolean;
  toleranciaAtrasoMinutos: number;
  inicioAdicionalNoturno: string; // "22:00"
  fimAdicionalNoturno: string; // "05:00"
  sincronizarComFolha: boolean;
  dispositivosPermitidosTipo: 'qualquer' | 'cadastrados' | 'computador_empresa';
  bancoHorasAtivo: boolean;
  validadeBancoHorasMeses: number;
  integracaoExterna?: IntegracaoPontoExterna;
}



export type PontoProvider = 'nao_configurado' | 'solides' | 'tangerino' | 'ahgora' | 'pontotel' | 'outro';

// RH_PONTO_API_V2 — Sistema de Ponto independente é a fonte oficial; RH-MIL consome por API.
export interface IntegracaoPontoExterna {
  provider: PontoProvider;
  providerName?: string;
  apiBaseUrl?: string;
  externalCompanyId?: string;
  syncMode: 'webhook' | 'polling' | 'manual';
  enabled: boolean;
  webhookEnabled: boolean;
  credentialConfigured: boolean;
  status: 'nao_configurado' | 'configurando' | 'conectado' | 'erro';
  lastSyncAt?: string;
  lastSyncStatus?: string;
  employeeMappingField: 'cpf' | 'matricula' | 'externalEmployeeId';
  punchesReadOnly: true;
  sourceOfTruth?: 'external_api';
  apiContractVersion?: 'v1';
  externalProduct?: 'rh_mil_ponto';
  lastSuccessfulSyncAt?: string;
  lastError?: string;
}


export interface PontoApiStatus {
  connected: boolean;
  configured: boolean;
  service?: string;
  apiVersion?: string;
  companyId?: string;
  lastSyncAt?: string;
  message?: string;
}

export interface PontoPayrollSummary {
  companyId: string;
  competence: string;
  generatedAt?: string;
  employees?: number;
  pendingAdjustments?: number;
  totalWorkedMinutes?: number;
  overtime50Minutes?: number;
  overtime100Minutes?: number;
  overtime140Minutes?: number;
  absenceMinutes?: number;
  delayMinutes?: number;
  bankBalanceMinutes?: number;
  source?: string;
  records?: unknown[];
}
