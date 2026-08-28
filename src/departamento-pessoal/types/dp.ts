/**
 * Tipos e Interfaces para o Módulo de Departamento Pessoal (DP)
 * RH TRANSFORMA - Plataforma SaaS de Gestão de Pessoas
 */

export type TipoContrato = 'CLT' | 'PJ' | 'Estágio' | 'Aprendiz' | 'Temporário' | 'Diretor Estatutário';
export type EstadoCivil = 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)' | 'União Estável';

export interface DadoPessoalColaborador {
  cpf: string;
  rg: string;
  dataNascimento: string;
  estadoCivil: EstadoCivil;
  nacionalidade?: string;
  genero?: string;
  endereco: {
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  telefone: string;
  emailPessoal: string;
  nomeMae?: string;
}

export interface DadoProfissionalColaborador {
  cargo: string;
  departamento: string;
  centroCusto: string;
  dataAdmissao: string;
  salarioBase: number;
  jornadaSemanalHours: number; // ex: 44h
  escalaTrabalho: string; // ex: '5x2 (Segunda a Sexta 08:00 - 18:00)'
  gestorResponsavel: string;
  status: 'Ativo' | 'Férias' | 'Afastado' | 'Rescindido' | 'Aviso Prévio';
  emailCorporativo: string;
  unidade?: string;
}

export interface DadoTrabalhistaColaborador {
  matricula?: string;
  pisPasep: string;
  ctpsNumero: string;
  ctpsSerie: string;
  ctpsUf: string;
  dependentesCount: number;
  sindicato: string;
  tipoContrato: TipoContrato;
  bancoAgenciaConta: string;
  optanteValeTransporte: boolean;
}

export interface AcessoColaborador {
  loginUsername: string;
  senhaProvisoria?: string;
  statusAcesso: 'Ativo' | 'Bloqueado' | 'Pendente' | 'Sem acesso' | 'Convite enviado';
  dataUltimoAcesso?: string;
  dataLiberacao?: string;
  senhaCriada: boolean;
}

export interface HistoricoOcorrenciaColaborador {
  id: string;
  data: string;
  tipo: 'Admissão' | 'Alteração Salarial' | 'Promoção' | 'Mudança de Cargo/Depto' | 'Atestado Médico' | 'Advertência/Elogio';
  descricao: string;
  responsavel: string;
}

export interface ColaboradorCompleto {
  id: string;
  companyId: string;
  empresaId?: string;
  candidatoId?: string;
  jobId?: string;
  nomeCompleto: string;
  fotoUrl?: string;
  pessoais: DadoPessoalColaborador;
  profissionais: DadoProfissionalColaborador;
  trabalhistas: DadoTrabalhistaColaborador;
  beneficiosAtivos: string[]; // IDs ou nomes de benefícios
  acessoColaborador?: AcessoColaborador;
  regraJornadaIndividual?: RegraJornadaIndividualColaborador;
  historico?: HistoricoOcorrenciaColaborador[];
  createdAt: string;
  updatedAt: string;
}

export interface UnidadeOrganizacional {
  id: string;
  companyId: string;
  nome: string;
  tipo: 'Empresa' | 'Unidade' | 'Departamento' | 'Setor';
  parentId?: string; // ID da empresa/unidade pai
  gestorId?: string;
  gestorNome?: string;
  descricao?: string;
  localizacao?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CargoSalarioItem {
  id: string;
  companyId: string;
  cargo: string;
  cbo: string;
  nivel: 'Júnior' | 'Pleno' | 'Sênior' | 'Especialista' | 'Coordenador' | 'Gerente' | 'Diretor';
  departamento: string;
  descricao: string;
  requisitos: string[];
  competencias: string[];
  salarioPiso: number;
  salarioTeto: number;
  salarioMedio: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ItemBeneficio {
  id: string;
  companyId: string;
  nome: string;
  descricao?: string;
  categoria: 
    | 'Vale Transporte' 
    | 'Vale Refeição' 
    | 'Vale Alimentação' 
    | 'Plano de Saúde' 
    | 'Plano Odontológico' 
    | 'Seguro de Vida' 
    | 'Auxílio Combustível' 
    | 'Auxílio Home Office' 
    | 'Auxílio Creche' 
    | 'Auxílio Educação' 
    | 'Bolsa de Estudos' 
    | 'Cesta Básica' 
    | 'Convênio Farmácia' 
    | 'Gympass / Academia' 
    | 'Comissão' 
    | 'Premiação' 
    | 'Assiduidade' 
    | 'Gratificação' 
    | 'Benefício Personalizado' 
    | 'Outros';
  tipoCalculo: 
    | 'Valor Fixo' 
    | 'Percentual do Salário' 
    | 'Percentual sobre Outra Base' 
    | 'Valor por Dia Trabalhado' 
    | 'Valor por Hora' 
    | 'Valor por Dependente' 
    | 'Faixa Salarial' 
    | 'Quantidade Utilizada' 
    | 'Valor Manual' 
    | 'Sem Custo Funcionário' 
    | 'Coparticipação' 
    | 'Desconto Limitado Teto'
    | 'Percentual Salário'; // backwards compat
  valorBeneficio: number;
  percentualDescontoFuncionario: number; // ex: 6% VT, 20% VR
  valorDescontoFixoFuncionario?: number;
  custoEmpresaEstimado: number;
  recorrencia?: 'Mensal' | 'Diário' | 'Eventual' | 'Anual';
  exigeDependente?: boolean;
  exigeDocumento?: boolean;
  ativo: boolean;
  fornecedor?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  status?: 'Ativo' | 'Inativo';
}

export type StatusBeneficioIndividual = 
  | 'Pendente' 
  | 'Ativo' 
  | 'Suspenso' 
  | 'Cancelado' 
  | 'Encerrado' 
  | 'Aguardando documento' 
  | 'Aguardando aprovação';

export interface DependenteBeneficio {
  dependentId?: string;
  name: string;
  cpf?: string;
  birthDate?: string;
  relationship: string;
  monthlyValue: number;
  employeeContribution: number;
  employerContribution: number;
  status: 'Ativo' | 'Inativo';
}

export interface DocumentoBeneficio {
  id: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  storagePath?: string;
  downloadUrl: string;
  uploadedBy?: string;
  uploadedAt: string;
}

export interface BeneficioColaboradorIndividual {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName?: string;
  employeeCpf?: string;
  department?: string;
  benefitTypeId: string;
  benefitName: string;
  category: string;
  startDate: string;
  endDate?: string;
  status: StatusBeneficioIndividual;
  employeeContribution: number; // Desconto do colaborador (R$)
  employerContribution: number; // Custo empresa (R$)
  totalValue: number; // Valor total do benefício (R$)
  calculationType: string;
  calculationBase?: number;
  dependents?: DependenteBeneficio[];
  documents?: DocumentoBeneficio[];
  observations?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface HistoricoAlteracaoBeneficio {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName?: string;
  benefitId: string;
  benefitName?: string;
  action: 'Concessão' | 'Alteração de Valor' | 'Mudança de Desconto' | 'Inclusão de Dependente' | 'Exclusão de Dependente' | 'Suspensão' | 'Reativação' | 'Cancelamento' | 'Encerramento Rescisão' | 'Alteração em Massa';
  previousValue?: string;
  newValue?: string;
  reason?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export type VisibilidadeAnotacao = 'somente_rh' | 'rh_e_gestor' | 'administrativa' | 'restrita';

export interface AnotacaoInternaColaborador {
  id: string;
  companyId: string;
  employeeId: string;
  content: string;
  visibility: VisibilidadeAnotacao;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PeriodoAquisitivoFerias {
  id: string;
  companyId: string;
  colaboradorId: string;
  colaboradorNome: string;
  cargo?: string;
  departamento?: string;
  dataInicioPeriodo: string; // YYYY-MM-DD
  dataFimPeriodo: string; // YYYY-MM-DD
  limiteConcessivo: string; // YYYY-MM-DD
  diasDireito: number; // Padrão 30, ajustado por faltas injustificadas
  diasFaltasInjustificadas: number;
  diasGozados: number;
  diasVendidos: number;
  diasSaldo: number;
  status: 'Em andamento' | 'Adquirido' | 'Parcialmente utilizado' | 'Utilizado' | 'Vencido' | 'Suspenso' | 'Cancelado';
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegraFeriasEmpresa {
  id: string;
  companyId: string;
  nome: string;
  vigenciaInicio: string;
  vigenciaFim?: string;
  prazoConcessivoMeses: number; // ex: 12
  diasPadraoDireito: number; // ex: 30
  permitirFracionamento: boolean;
  maxFracionamento: number; // ex: 3
  minDiasPrimeiroPeriodo: number; // ex: 14 (CLT Art. 134 § 1º)
  minDiasOutrosPeriodos: number; // ex: 5
  permitirAbonoPecuniario: boolean; // Venda de até 10 dias
  maxDiasAbono: number; // ex: 10
  permitirAdiantamento13: boolean;
  prazoMinimoSolicitacaoDias: number; // ex: 30 dias de antecedência
  ativo: boolean;
}

export type StatusSolicitacaoFerias = 
  | 'Rascunho' 
  | 'Solicitado' 
  | 'Em Aquisitivo' 
  | 'Disponível' 
  | 'Em análise' 
  | 'Aprovado' 
  | 'Reprovado' 
  | 'Programado' 
  | 'Em Gozo' 
  | 'Concluído' 
  | 'Vencido' 
  | 'Cancelado';

export interface RegistroFeriasColaborador {
  id: string;
  companyId: string;
  colaboradorId: string;
  colaboradorNome: string;
  cargo: string;
  departamento: string;
  periodoAquisitivoId?: string;
  periodoAquisitivoInicio: string;
  periodoAquisitivoFim: string;
  limiteConcessivo?: string;
  diasAdquiridos: number;
  diasGozados: number;
  diasSaldo: number;
  dataInicioGozo?: string;
  dataFimGozo?: string;
  diasGozoAbono?: number;
  diasVendidosAbono?: number; // Abono pecuniário (até 10 dias)
  fracionamentoOrdem?: number; // 1, 2 ou 3
  adiantamento13Salario?: boolean;
  dataPagamentoPrevista?: string;
  dataAvisoFeriasEmissao?: string;
  dataReciboFeriasEmissao?: string;
  documentoAvisoUrl?: string;
  documentoReciboUrl?: string;
  motivoReprovacao?: string;
  observacoes?: string;
  status: StatusSolicitacaoFerias;
  valorSalarioBaseGozo?: number;
  valorUmTercoConstitucional?: number;
  valorAbonoPecuniario?: number;
  valorUmTercoAbono?: number;
  valorTotalLiquidoFerias?: number;
  historicoAprovacao?: {
    dataHora: string;
    usuario: string;
    acao: string;
    observacao?: string;
  }[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TipoRescisao = 
  | 'Demissão sem Justa Causa (Iniciativa do Empregador)' 
  | 'Pedido de Demissão (Iniciativa do Empregado)'
  | 'Demissão com Justa Causa'
  | 'Acordo Mútuo (Art. 484-A CLT)'
  | 'Término do Contrato de Experiência/Prazo Determinado';

export interface CalculoRescisorio {
  id?: string;
  companyId: string;
  colaboradorId: string;
  colaboradorNome: string;
  cargo: string;
  salarioBase: number;
  dataAdmissao: string;
  dataDesligamento: string;
  tipoRescisao: TipoRescisao;
  avisoPrevio: 'Trabalhado' | 'Indenizado' | 'Dispensado';
  diasAvisoPrevio: number;
  
  // Proventos
  saldoSalarioDias: number;
  valorSaldoSalario: number;
  valorAvisoPrevioIndenizado: number;
  meses13Proporcional: number;
  valor13Proporcional: number;
  mesesFeriasProporcionais: number;
  valorFeriasProporcionais: number;
  valorFeriasVencidas: number;
  valorUmTercoFerias: number;
  
  // Descontos
  descontoInss: number;
  descontoIrrf: number;
  descontoFaltasAtrasos: number;
  descontoAvisoPrevioNaoCumprido: number;
  
  // Totais e FGTS
  totalProventos: number;
  totalDescontos: number;
  valorLiquidoRescisao: number;
  saldoFgtsEstimado: number;
  multaFgtsPercentual: number; // 40% ou 20% em acordo
  valorMultaFgts: number;
  
  status: 'Simulação' | 'Aprovado RH' | 'Homologado' | 'Pago';
  dataHomologacao?: string;
}

export type TipoControleJornada = 'Pagamento de hora extra' | 'Banco de horas' | 'Modelo misto';
export type JornadaSemanalTipo = '44h' | '40h' | 'Personalizada';
export type EscalaTrabalhoTipo = 'Segunda a sexta' | 'Segunda a sábado' | '12x36' | 'Escala personalizada';
export type PrazoCompensacaoBH = '3 meses' | '6 meses' | '12 meses' | 'Personalizado';
export type FormaAprovacaoBH = 'Automática' | 'Aprovação do Gestor' | 'Aprovação do RH';

export interface RegraJornadaEmpresa {
  tipoControle: TipoControleJornada;
  jornadaSemanal: JornadaSemanalTipo;
  jornadaSemanalHorasCustom?: number;
  jornadaDiariaHoras: number; // ex: 8.8, 8.0
  escalaPadrao: EscalaTrabalhoTipo;
  horariosPadrao: {
    entrada: string; // "08:00"
    intervaloSaida: string; // "12:00"
    intervaloRetorno: string; // "13:00"
    saida: string; // "17:00"
  };
  
  // Configuração de Hora Extra
  pagaHoraExtra: boolean; // SIM -> Envia pra folha, NÃO -> Envia pro banco
  horaExtraDiaUtilPercent: number; // ex: 50%
  horaExtraDomingoFeriadoPercent: number; // ex: 100%
  adicionalNoturnoPercent: number; // ex: 20%
  percentuaisPersonalizados?: { descricao: string; percentual: number }[];
  
  // Configuração de Banco de Horas
  ativarBancoHoras: boolean;
  prazoCompensacao: PrazoCompensacaoBH;
  limiteSaldoPositivoHoras: number; // ex: 20 horas (+20:00)
  limiteSaldoNegativoHoras: number; // ex: 5 horas (-05:00)
  formaAprovacao: FormaAprovacaoBH;
  
  // Regra do Modelo Misto
  modeloMistoRegra?: {
    limiteDiarioBancoHoras: number; // ex: até 2h extras vão pro banco, excedente pra folha
    limiteMensalBancoHoras: number; // ex: até 20h no mês pro banco, excedente pra folha
  };
}

export interface RegraJornadaIndividualColaborador {
  usarRegraEmpresa: boolean;
  tipoControleIndividual?: TipoControleJornada;
  jornadaSemanalIndividualHoras?: number;
  escalaIndividual?: EscalaTrabalhoTipo;
  horariosIndividuais?: {
    entrada: string;
    intervaloSaida: string;
    intervaloRetorno: string;
    saida: string;
  };
  regraCalculoIndividualObs?: string;
}

export interface ConfiguracoesTrabalhistas {
  companyId: string;
  toleranciaPontoMinutos: number; // ex: 10 min diários (Art. 58 CLT)
  adicionalHorasExtrasSemanaPercent: number; // ex: 50%
  adicionalHorasExtrasDomingoFeriadoPercent: number; // ex: 100%
  adicionalNoturnoPercent: number; // ex: 20% (CLT Urbana)
  horarioNoturnoInicio: string; // 22:00
  horarioNoturnoFim: string; // 05:00
  aliquotaFgtsPercent: number; // 8% geral, 2% aprendiz
  
  // Regras de Jornada, Banco de Horas e Hora Extra por Empresa
  regrasJornada: RegraJornadaEmpresa;
  
  // Tabelas Progressivas de INSS e IRRF (Ano Vigente 2026)
  tabelaInss: { ate: number; aliquota: number; deducao: number }[];
  tabelaIrrf: { ate: number; aliquota: number; deducao: number; deducaoDependente: number }[];
}

export interface DadosCat {
  numeroCat?: string;
  tipoCat: 'Inicial' | 'Reabertura' | 'Óbito';
  dataAcidente: string;
  horaAcidente?: string;
  tipoAcidente: 'Típico' | 'Trajeto' | 'Doença Ocupacional';
  localAcidente: string;
  descricaoAcidente: string;
  parteCorpoAtingida?: string;
  houveAfastamento: boolean;
  atendimentoMedico?: string;
  protocoloEsocial?: string;
  testemunhas?: string;
  documentoCatUrl?: string;
}

export interface DadosInss {
  numeroBeneficioInss?: string;
  especieBeneficio?: string; // B31, B91, etc.
  dataSolicitacao?: string;
  dataPericia?: string;
  dataConcessao?: string;
  dataFimBeneficio?: string;
  statusBeneficio: 'Aguardando Perícia' | 'Concedido' | 'Indeferido' | 'Prorrogação Solicitada' | 'Cessado';
  documentoDecisaoUrl?: string;
}

export interface DadosRetornoTrabalho {
  dataExameAso?: string;
  resultadoAso: 'Apto' | 'Inapto' | 'Apto com Restrições';
  medicoExaminador?: string;
  crmMedicoExaminador?: string;
  descricaoRestricoes?: string;
  adequacaoJornadaTemp?: boolean;
  observacoesGestor?: string;
  documentoAsoUrl?: string;
  concluidoPor?: string;
  dataConclusao?: string;
}

export type TipoAfastamentoCompleto = 
  | 'Atestado médico' 
  | 'Auxílio-doença' 
  | 'Acidente de trabalho' 
  | 'Licença-maternidade' 
  | 'Licença-paternidade' 
  | 'Afastamento pelo INSS' 
  | 'CAT' 
  | 'Licença Sem Remuneração' 
  | 'Serviço Militar' 
  | 'Licença Luto' 
  | 'Licença Casamento' 
  | 'Acompanhamento Dependente' 
  | 'Falta justificada' 
  | 'Falta injustificada' 
  | 'Outros';

export interface AfastamentoColaborador {
  id: string;
  empresaId: string;
  companyId?: string;
  colaboradorId: string;
  colaboradorNome: string;
  cargo?: string;
  departamento?: string;
  tipo: TipoAfastamentoCompleto;
  dataInicio: string;
  dataFim: string;
  diasAfastado: number;
  cid?: string;
  medicoResponsavel?: string;
  crmMedico?: string;
  clinicaOuHospital?: string;
  anexoUrl?: string;
  observacoes?: string;
  status: 'Em Análise' | 'Ativo' | 'Encaminhado INSS' | 'Concluído' | 'Indeferido' | 'Cancelado';
  retornoTrabalhoPrevisto?: string;
  retornoTrabalhoRealizado?: string;
  dadosCat?: DadosCat;
  dadosInss?: DadosInss;
  dadosRetornoTrabalho?: DadosRetornoTrabalho;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AlertaDp {
  id: string;
  companyId: string;
  colaboradorId?: string;
  colaboradorNome?: string;
  modulo: 'Férias' | 'Afastamentos' | 'ASO' | 'INSS' | 'Documentos';
  tipoAlerta: 
    | 'Período Concessivo Vencendo' 
    | 'Férias Vencidas' 
    | 'Início de Férias Próximo' 
    | 'Retorno ao Trabalho Próximo' 
    | 'Atestado Excedente INSS (>15d)' 
    | 'Aprovação Pendente' 
    | 'ASO Pendente';
  gravidade: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  titulo: string;
  mensagem: string;
  dataAlerta: string;
  lido: boolean;
  linkAcao?: string;
}

export interface DocumentoColaborador {
  id: string;
  empresaId: string;
  colaboradorId: string;
  colaboradorNome?: string;
  categoria: 'Pessoais' | 'Contratuais' | 'Admissionais' | 'Férias' | 'Afastamentos' | 'Advertências' | 'Suspensões' | 'Saúde ocupacional' | 'Rescisão' | 'Holerites' | 'Outros';
  tipoDocumento: string;
  nomeArquivo: string;
  arquivoUrl?: string;
  dataEmissao?: string;
  dataValidade?: string;
  status: 'Válido' | 'Vencido' | 'Próximo ao Vencimento' | 'Pendente';
  criadoPor?: string;
  criadoEm: string;
}

export interface AjustePontoColaborador {
  id: string;
  empresaId: string;
  colaboradorId: string;
  colaboradorNome: string;
  data: string;
  motivo: string;
  marcacoesOriginais: string[];
  marcacoesNovas: string[];
  comprovanteUrl?: string;
  status: 'Pendente' | 'Aprovado' | 'Recusado' | 'Cancelado';
  aprovadoPor?: string;
  dataAprovacao?: string;
  createdAt: string;
}

export interface HistoricoEventoColaborador {
  id: string;
  empresaId: string;
  colaboradorId: string;
  moduloOrigem: 'Colaboradores' | 'Admissões' | 'Jornada' | 'Benefícios' | 'Férias' | 'Afastamentos' | 'Documentos' | 'Folha' | 'Rescisões';
  tipoEvento: string;
  descricao: string;
  valorAnterior?: string;
  valorNovo?: string;
  usuarioId?: string;
  usuarioNome?: string;
  dataHora: string;
}

export type StatusAdmissao = 
  | 'Rascunho' 
  | 'Aguardando documentos' 
  | 'Em conferência' 
  | 'Aguardando exame' 
  | 'Aguardando assinatura' 
  | 'Pronta para efetivação' 
  | 'Documentação Pendente' 
  | 'Pronto para Efetivação' 
  | 'Efetivado' 
  | 'Cancelado';

export interface ItemChecklistAdmissao {
  id?: string;
  item: string;
  obrigatorio?: boolean;
  concluido: boolean;
  responsavel?: string;
  dataConclusao?: string;
  observacao?: string;
}

export interface AdmissaoPending {
  id: string;
  empresaId: string;
  candidatoId?: string;
  contratacaoId?: string;
  jobId?: string;
  vagaTitulo?: string;
  nomeCompleto: string;
  nomeSocial?: string;
  email: string;
  telefone?: string;
  cpf?: string;
  rg?: string;
  orgaoEmissor?: string;
  dataNascimento?: string;
  genero?: string;
  estadoCivil?: string;
  nacionalidade?: string;
  naturalidade?: string;
  nomeMae?: string;
  nomePai?: string;
  fotoUrl?: string;

  // Endereço
  endereco?: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
  };

  // Profissionais
  cargo: string;
  departamento?: string;
  salarioCombinado: number;
  tipoContrato: TipoContrato;
  dataAdmissaoPrevista: string;
  matricula?: string;
  centroCusto?: string;
  gestor?: string;
  unidade?: string;
  jornada?: string;
  horario?: string;
  modalidade?: 'Presencial' | 'Híbrido' | 'Home Office';
  periodoExperiencia?: string;
  sindicato?: string;
  cbo?: string;
  localTrabalho?: string;

  // Dados Bancários
  dadosBancarios?: {
    banco?: string;
    agencia?: string;
    conta?: string;
    tipoConta?: 'Corrente' | 'Poupança' | 'Salário';
    chavePix?: string;
    titular?: string;
    cpfTitular?: string;
  };

  // Dependentes
  dependentes?: {
    id?: string;
    nome: string;
    cpf?: string;
    dataNascimento?: string;
    parentesco: string;
    irrf: boolean;
    salarioFamilia: boolean;
  }[];

  // Benefícios
  beneficiosSelecionados?: string[];

  // Exame Admissional & Segurança
  exameAdmissional?: {
    asoUrl?: string;
    dataExame?: string;
    resultado?: 'Apto' | 'Inapto' | 'Apto com Restrições';
    validade?: string;
    clinica?: string;
    medico?: string;
    crm?: string;
    episEntregues?: boolean;
    treinamentoRealizado?: boolean;
  };

  // Contrato
  contratoGerado?: {
    modeloId?: string;
    conteudoGerado?: string;
    dataGeracao?: string;
    assinado?: boolean;
    dataAssinatura?: string;
    contratoAssinadoUrl?: string;
  };

  // Documentos Anexados
  documentosAnexados?: {
    id: string;
    tipo: string;
    nomeArquivo: string;
    url?: string;
    status: 'Enviado' | 'Aprovado' | 'Rejeitado' | 'Pendente';
    dataEnvio: string;
  }[];

  status: StatusAdmissao;
  checklist: ItemChecklistAdmissao[];
  historicoEtapas?: {
    id?: string;
    dataHora: string;
    usuario: string;
    acao: string;
    descricao: string;
  }[];

  colaboradorIdCriado?: string;
  dataEfetivacao?: string;
  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// RELATÓRIOS, INDICADORES E DASHBOARD TYPES
// ==========================================

export type DPPeriodType = 'mes_atual' | 'mes_anterior' | 'trimestre' | 'ano' | 'custom';

export interface DPGlobalFilterState {
  period: DPPeriodType;
  startDate: string;
  endDate: string;
  companyId: string;
  department: string;
  costCenter: string;
  unit: string;
  role: string;
  manager: string;
  contractType: string;
  employeeStatus: 'Ativo' | 'Afastado' | 'Ferias' | 'Rescindido' | 'Todos';
  competence: string;
  ageRange: string;
  tenure: string;
}

export type ReportDataSource = 
  | 'colaboradores' 
  | 'folha' 
  | 'ponto' 
  | 'ferias' 
  | 'afastamentos' 
  | 'beneficios' 
  | 'rescisoes' 
  | 'custos' 
  | 'diversidade';

export interface ReportTemplateModel {
  id: string;
  companyId: string;
  name: string;
  description: string;
  dataSource: ReportDataSource;
  selectedFields: string[];
  filters: Record<string, any>;
  grouping?: string;
  sorting?: string;
  visibility: 'private' | 'rh' | 'managers' | 'finance' | 'company';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledReportModel {
  id: string;
  companyId: string;
  templateId: string;
  templateName: string;
  frequency: 'diario' | 'semanal' | 'quinzenal' | 'mensal' | 'competencia';
  recipients: string[];
  fileFormat: 'PDF' | 'CSV' | 'XLSX';
  active: boolean;
  lastRunAt: string | null;
  nextRunAt: string;
  createdBy: string;
  createdAt: string;
}

export interface ReportJobModel {
  id: string;
  companyId: string;
  reportType: string;
  title: string;
  fileName: string;
  storagePath: string;
  fileSize: string;
  contentType: string;
  fileFormat: 'PDF' | 'CSV' | 'XLSX';
  generatedBy: string;
  generatedAt: string;
  expiresAt: string;
  status: 'Concluído' | 'Em Processamento' | 'Erro';
  dataUrl?: string;
}

export type AlertCategory = 'Critico' | 'Alto' | 'Medio' | 'Informativo';
export type AlertStatus = 'Pendente' | 'Em Andamento' | 'Resolvido' | 'Ignorado';

export interface DPAlertItem {
  id: string;
  companyId: string;
  category: AlertCategory;
  title: string;
  description: string;
  originModule: string;
  originId?: string;
  assignedTo?: string;
  status: AlertStatus;
  ignoreReason?: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface DPKpiDrilldownData {
  metricKey: string;
  title: string;
  formula: string;
  periodLabel: string;
  totalCount: number;
  totalValue?: number;
  items: any[];
  columns: { key: string; label: string; format?: 'currency' | 'date' | 'badge' | 'text' }[];
}

