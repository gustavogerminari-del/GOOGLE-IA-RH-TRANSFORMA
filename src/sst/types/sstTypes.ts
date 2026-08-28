/**
 * Tipos e Interfaces para o Módulo de Saúde e Segurança do Trabalho (SST) e Medicina Ocupacional
 * RH TRANSFORMA - Plataforma SaaS de Gestão de Pessoas
 */

export type GrupoRisco = 
  | 'Físico' 
  | 'Químico' 
  | 'Biológico' 
  | 'Ergonômico' 
  | 'Mecânico / Acidentes' 
  | 'Psicossocial' 
  | 'Personalizado';

export type NivelRisco = 'Baixo' | 'Médio' | 'Alto' | 'Crítico';

export type TipoExposicao = 'Habitual' | 'Intermitente' | 'Ocasional';

export interface AmbienteTrabalho {
  id: string;
  companyId: string;
  unidadeId?: string;
  unidadeNome?: string;
  nome: string;
  descricao: string;
  departamentoIds?: string[];
  enderecoLocation?: string;
  descricaoAtividades: string;
  responsavelUserId?: string;
  responsavelNome?: string;
  ativo: boolean;
  vigenciaInicio: string;
  vigenciaFim?: string;
  status: 'Ativo' | 'Inativo' | 'Em Revisão';
  createdAt?: string;
  updatedAt?: string;
}

export interface RiscoOcupacional {
  id: string;
  companyId: string;
  grupoRisco: GrupoRisco;
  nomeRisco: string;
  descricao: string;
  fonteGeradora: string;
  tipoExposicao: TipoExposicao;
  frequenciaExposicao?: string; // ex: '4 horas/dia'
  severidade: number; // 1 a 5
  probabilidade: number; // 1 a 5
  nivelRisco: NivelRisco;
  unidadeMedida?: string; // ex: 'dB(A)', 'mg/m³'
  valorMedido?: number;
  limiteTolerancia?: number;
  medidasControleText: string;
  episObrigatoriosIds: string[];
  treinamentosObrigatoriosIds: string[];
  examesObrigatoriosIds: string[];
  exigeInsalubridade: boolean;
  percentualInsalubridade?: number; // 10%, 20%, 40%
  exigePericulosidade: boolean;
  percentualPericulosidade?: number; // 30%
  vigenciaInicio: string;
  vigenciaFim?: string;
  status: 'Ativo' | 'Inativo' | 'Em Revisão';
  createdAt?: string;
  updatedAt?: string;
}

export interface VinculoRisco {
  id: string;
  companyId: string;
  riscoId: string;
  nomeRisco: string;
  grupoRisco: GrupoRisco;
  ambienteId?: string;
  ambienteNome?: string;
  cargo?: string;
  funcao?: string;
  unidadeId?: string;
  colaboradorId?: string;
  colaboradorNome?: string;
  grupoHomogeneo?: string;
  vigenciaInicio: string;
  vigenciaFim?: string;
  createdAt?: string;
}

export type TipoProgramaSST = 
  | 'PGR' 
  | 'PCMSO' 
  | 'LTCAT' 
  | 'Laudo de Insalubridade' 
  | 'Laudo de Periculosidade' 
  | 'PCA' 
  | 'PPR' 
  | 'Outro';

export interface ProgramaSST {
  id: string;
  companyId: string;
  tipoPrograma: TipoProgramaSST;
  titulo: string;
  versao: string;
  status: 'Em Elaboração' | 'Vigente' | 'Aguardando Revisão' | 'Vencido' | 'Arquivado';
  responsavelTecnico: string;
  registroProfissional: string; // CREA, CRM, etc.
  dataElaboracao: string;
  dataVigenciaInicio: string;
  dataVigenciaFim: string;
  dataProximaRevisao: string;
  documentoUrl?: string;
  planosAcaoCount?: number;
  observacoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type OrigemPlanoAcao = 'PGR' | 'PCMSO' | 'Investigação de Acidente' | 'Inspeção' | 'Auditoria' | 'Outro';
export type PrioridadePlanoAcao = 'Baixa' | 'Média' | 'Alta' | 'Urgente';
export type StatusPlanoAcao = 'Aberto' | 'Em Andamento' | 'Aguardando Evidência' | 'Concluído' | 'Vencido' | 'Cancelado';

export interface PlanoAcaoSST {
  id: string;
  companyId: string;
  programaId?: string;
  riscoId?: string;
  acidenteId?: string;
  inspecaoId?: string;
  titulo: string;
  descricao: string;
  origemTipo: OrigemPlanoAcao;
  prioridade: PrioridadePlanoAcao;
  responsavelId?: string;
  responsavelNome: string;
  dataPrazo: string;
  status: StatusPlanoAcao;
  evidenciasUrls?: string[];
  dataConclusao?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TipoExameOcupacional = 
  | 'Admissional' 
  | 'Periódico' 
  | 'Mudança de Risco' 
  | 'Retorno ao Trabalho' 
  | 'Demissional' 
  | 'Complementar' 
  | 'Clínico' 
  | 'Audiometria' 
  | 'Espirometria' 
  | 'Outro';

export type StatusAgendamentoExame = 
  | 'Agendado' 
  | 'Confirmado' 
  | 'Realizado' 
  | 'Não Compareceu' 
  | 'Reagendado' 
  | 'Cancelado' 
  | 'Aguardando Resultado' 
  | 'Concluído';

export interface AgendamentoExame {
  id: string;
  companyId: string;
  colaboradorId: string;
  colaboradorNome: string;
  cpf?: string;
  cargo: string;
  departamento: string;
  tipoExame: TipoExameOcupacional;
  clinicaId?: string;
  clinicaNome: string;
  medicoResponsavel?: string;
  dataAgendamento: string;
  horario: string;
  status: StatusAgendamentoExame;
  observacoesInstrucoes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClinicaSST {
  id: string;
  companyId: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  email: string;
  contatoResponsavel: string;
  examesAtendidos: string[];
  medicoCoordenador?: string;
  crmCoordenador?: string;
  ativo: boolean;
  createdAt?: string;
}

export type StatusAptidaoAso = 'Apto' | 'Apto com Restrições' | 'Inapto' | 'Pendente';

export interface ResultadoExameASO {
  id: string;
  companyId: string;
  agendamentoId?: string;
  colaboradorId: string;
  colaboradorNome: string;
  cpf?: string;
  cargo: string;
  departamento: string;
  tipoExame: TipoExameOcupacional;
  dataExame: string;
  dataEmissaoAso: string;
  resultadoStatus: 'Concluído' | 'Pendente Exame Complementar' | 'Inconclusivo';
  statusAptidao: StatusAptidaoAso;
  restricoes?: string[];
  resumoRestricaoGestor?: string; // Visível a gestores (Sem CID)
  dataProximoExame: string;
  medicoExaminador: string;
  crmExaminador: string;
  crmUf: string;
  medicoCoordenadorPcmso?: string;
  crmCoordenadorPcmso?: string;
  clinicaNome: string;
  documentoAsoUrl?: string;
  versao: number;
  status: 'Vigente' | 'Substituído' | 'Cancelado';
  observacoesMedicasRestritas?: string; // Sigilo Médico (Somente Médico/RH Autorizado)
  createdAt?: string;
  updatedAt?: string;
}

export interface RestricaoMedica {
  id: string;
  companyId: string;
  colaboradorId: string;
  colaboradorNome: string;
  cargo: string;
  departamento: string;
  asoId?: string;
  tipoRestricao: 
    | 'Carga / Peso' 
    | 'Movimentação / Esforço' 
    | 'Postura' 
    | 'Exposição a Agente' 
    | 'Turno / Horário' 
    | 'Atividade Específica' 
    | 'Temporária' 
    | 'Permanente';
  resumoParaGestor: string; // Texto acessível sem CID
  descricaoMedicaRestrita?: string; // Sigilo Médico
  dataInicio: string;
  dataFimPrevista?: string;
  status: 'Ativa' | 'Concluída' | 'Renovada' | 'Cancelada';
  acoesAdaptacaoCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RetornoTrabalho {
  id: string;
  companyId: string;
  colaboradorId: string;
  colaboradorNome: string;
  afastamentoId?: string;
  motivoAfastamento: string;
  dataInicioAfastamento: string;
  dataPrevistaRetorno: string;
  dataEfetivaRetorno?: string;
  statusExameRetorno: 'Pendente' | 'Agendado' | 'Realizado' | 'Dispensado';
  statusAptidao: 'Apto' | 'Apto com Restrições' | 'Inapto' | 'Aguardando Exame';
  bloqueioPontoLiberado: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CategoriaEPI = 
  | 'Proteção Cabeça' 
  | 'Proteção Auditiva' 
  | 'Proteção Respiratória' 
  | 'Proteção Ocular / Facial' 
  | 'Proteção Tronco / Mãos / Braços' 
  | 'Proteção Membros Inferiores' 
  | 'Proteção Contra Quedas' 
  | 'Outros';

export interface EpiCatalogo {
  id: string;
  companyId: string;
  codigo: string;
  nomeEpi: string;
  categoria: CategoriaEPI;
  fabricante: string;
  modelo: string;
  numeroCa: string; // Certificado de Aprovação
  validadeCa: string;
  tamanhosDisponiveis: string[];
  unidadeMedida: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  periodoTrocaDias: number;
  exigeTreinamento: boolean;
  exigeAssinatura: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MovimentacaoEpi {
  id: string;
  companyId: string;
  epiId: string;
  nomeEpi: string;
  tipoMovimentacao: 'Entrada' | 'Saída Entrega' | 'Ajuste Estoque' | 'Perda / Danificado' | 'Descarte';
  quantidade: number;
  tamanho?: string;
  numeroLote?: string;
  dataMovimentacao: string;
  motivo: string;
  usuarioResponsavel: string;
  createdAt?: string;
}

export interface EntregaEpi {
  id: string;
  companyId: string;
  colaboradorId: string;
  colaboradorNome: string;
  cargo: string;
  departamento: string;
  epiId: string;
  nomeEpi: string;
  numeroCa: string;
  quantidade: number;
  tamanho: string;
  numeroLote?: string;
  dataEntrega: string;
  dataPrevisaoTroca: string;
  motivoEntrega: 'Admissão' | 'Substituição / Desgaste' | 'Perda' | 'Danificado' | 'Mudança de Função' | 'Solicitação';
  estadoEpi: 'Novo' | 'Higienizado / Usado em bom estado';
  statusAssinatura: 'Pendente' | 'Assinado Digitalmente' | 'Recusado';
  assinaturaHash?: string;
  dataAssinatura?: string;
  devolvido: boolean;
  dataDevolucao?: string;
  motivoDevolucao?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TreinamentoCatalogo {
  id: string;
  companyId: string;
  codigo: string;
  nomeTreinamento: string;
  categoria: 
    | 'NR-06 EPI' 
    | 'NR-10 Elétrica' 
    | 'NR-12 Máquinas' 
    | 'NR-33 Espaço Confinado' 
    | 'NR-35 Trabalho em Altura' 
    | 'CIPA' 
    | 'Primeiros Socorros' 
    | 'Brigada de Incêndio' 
    | 'Outro';
  duracaoHoras: number;
  validadeMeses: number; // Ex: 12 ou 24 meses
  conteudoProgramatico: string;
  riscosRelacionadosIds?: string[];
  cargosObrigatorios?: string[];
  notaMinimaAprovacao: number;
  exigeCertificado: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TurmaTreinamento {
  id: string;
  companyId: string;
  treinamentoId: string;
  nomeTreinamento: string;
  instrutor: string;
  registroInstrutor?: string;
  dataInicio: string;
  dataFim: string;
  localOuLink: string;
  formato: 'Presencial' | 'Online / EAD' | 'Híbrido';
  vagasMaximas: number;
  participantesCount: number;
  status: 'Agendada' | 'Em Andamento' | 'Concluída' | 'Cancelada';
  createdAt?: string;
  updatedAt?: string;
}

export interface MatriculaTreinamento {
  id: string;
  companyId: string;
  turmaId: string;
  treinamentoId: string;
  nomeTreinamento: string;
  colaboradorId: string;
  colaboradorNome: string;
  cargo: string;
  frequenciaPercentual: number;
  notaObtida?: number;
  statusConclusao: 'Inscrito' | 'Aprovado' | 'Reprovado' | 'Falta';
  dataConclusao?: string;
  dataValidade?: string;
  certificadoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TipoAcidente = 'Típico' | 'Trajeto' | 'Doença Ocupacional' | 'Incidente / Quase Acidente';
export type StatusInvestigacaoAcidente = 
  | 'Registrado' 
  | 'Em Investigação' 
  | 'Aguardando Laudo Médico' 
  | 'Aguardando CAT' 
  | 'Plano de Ação Criado' 
  | 'Concluído';

export interface TestemunhaAcidente {
  nome: string;
  contato: string;
  depoimento?: string;
}

export interface AcidenteTrabalho {
  id: string;
  companyId: string;
  colaboradorId: string;
  colaboradorNome: string;
  cargo: string;
  departamento: string;
  tipoAcidente: TipoAcidente;
  dataHoraOcorrencia: string;
  localExato: string;
  atividadeNoMomento: string;
  descricaoResumida: string;
  acaoImediata: string;
  teveAfastamento: boolean;
  diasAfastamentoProvaveis?: number;
  teveObito: boolean;
  statusInvestigacao: StatusInvestigacaoAcidente;
  causaRaizCincoPorques?: string;
  diagramaIshikawaResumo?: string;
  testemunhas?: TestemunhaAcidente[];
  evidenciasUrls?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type TipoCAT = 'Inicial' | 'Reabertura' | 'Comunicação de Óbito';
export type StatusCAT = 
  | 'Rascunho' 
  | 'Em Análise' 
  | 'Pronta para Envio' 
  | 'Enviada / Protocolada' 
  | 'Retificada' 
  | 'Cancelada';

export interface ComunicadoCat {
  id: string;
  companyId: string;
  acidenteId: string;
  colaboradorId: string;
  colaboradorNome: string;
  cpf?: string;
  tipoCat: TipoCAT;
  dataEmissao: string;
  numeroProtocoloeSocial?: string;
  atestadoMedicoData?: string;
  nomeMedicoAtestado?: string;
  crmMedicoAtestado?: string;
  statusCat: StatusCAT;
  documentoCatUrl?: string;
  versao: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InspecaoChecklistSST {
  id: string;
  companyId: string;
  tipoInspecao: 'Ambiente' | 'Extintores / Combate Incêndio' | 'Máquinas / NR-12' | 'EPI / EPC' | 'Ergonômica' | 'Geral';
  titulo: string;
  ambienteId?: string;
  ambienteNome?: string;
  dataInspecao: string;
  inspetorNome: string;
  itensInspecionadosCount: number;
  naoConformidadesCount: number;
  status: 'Concluída' | 'Aguardando Ações' | 'Regularizada';
  relatorioUrl?: string;
  createdAt?: string;
}

export interface AuditoriaSstLog {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  colaboradorId?: string;
  colaboradorNome?: string;
  entidade: 'Exame' | 'ASO' | 'Risco' | 'EPI' | 'Treinamento' | 'Acidente' | 'CAT' | 'Restrição' | 'Programa' | 'Ambiente';
  acao: 'Criar' | 'Editar' | 'Visualizar Dados Médicos' | 'Excluir' | 'Emitir' | 'Assinar' | 'Exportar';
  detalhes: string;
  timestamp: string;
}

export interface IndicadoresSST {
  totalColaboradores: number;
  examesEmDiaCount: number;
  examesProximosCount: number;
  examesVencidosCount: number;
  colaboradoresSemAsoValidoCount: number;
  episVencidosCount: number;
  episSemAssinaturaCount: number;
  treinamentosVencidosCount: number;
  treinamentosProximosCount: number;
  acidentesAnoCount: number;
  catsPendentesCount: number;
  afastamentosSstActivosCount: number;
  retornosPrevistosCount: number;
  restricoesAtivasCount: number;
  documentosPendentesCount: number;
  taxaFrequenciaAcidentes: number; // TF
  taxaGravidadeAcidentes: number; // TG
  diasPerdidosTotal: number;
}
