/**
 * MÓDULO FOLHA DE PAGAMENTO - Contratos e Tipos TypeScript
 * RH TRANSFORMA - Sistema de Gestão de Pessoas (em conformidade com CLT / Legislação Brasileira 2026)
 * 
 * Depende apenas de NÚCLEO, COMPARTILHADO, AUTENTICAÇÃO, CADASTROS COMPLETOS, CONTROLE DE PONTO e BENEFÍCIOS.
 */

export type PayrollPeriodStatus = 
  | 'aberta' 
  | 'em_calculo' 
  | 'em_revisao' 
  | 'aprovada' 
  | 'fechada' 
  | 'reaberta' 
  | 'cancelada'
  | 'Aberto' 
  | 'Em Processamento' 
  | 'Fechado' 
  | 'Cancelado';

export type PayrollType = 
  | 'Mensal' 
  | 'Complementar' 
  | 'Rescisão' 
  | '13º Salário (1ª Parcela)' 
  | '13º Salário (2ª Parcela)' 
  | 'Férias' 
  | 'Adiantamento Salarial';

export type RubricType = 'Provento' | 'Desconto' | 'Informativa' | 'provento' | 'desconto' | 'base' | 'informativo';

export interface RubricDefinition {
  id?: string;
  eventId?: string;
  companyId?: string;
  code: string;           // Código eSocial / Interno (Ex: "1001", "5001")
  name: string;           // Nome da Rúbrica (Ex: "Salário Base", "INSS")
  type: RubricType;
  description: string;
  incidesINSS: boolean;
  incidesIRRF: boolean;
  incidesFGTS: boolean;
  incidesDSR?: boolean;
  isSystemDefault: boolean;
  formulaType?: 'Fixo' | 'Percentual' | 'Tabela' | 'Calculado';
  formulaExpression?: string;
  natureza?: string;
  prioridade?: number;
  ativo?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaystubItem {
  id: string;
  code: string;
  name: string;
  type: RubricType;
  reference: string;      // Ex: "220 hrs", "10 hrs 50%", "7,5%", "2 dependentes"
  amount: number;         // Valor em R$
  origin?: 'cadastro' | 'ponto' | 'beneficio' | 'manual' | 'ferias' | 'rescisao' | 'importacao';
  isManual?: boolean;     // Se foi adicionado/editado manualmente
  calculationMemory?: {
    baseValue?: number;
    rateUsed?: number;
    notes?: string;
    formulaApplied?: string;
    rounding?: string;
  };
}

export interface EmployerCharges {
  inssPatronal: number;    // INSS Patronal (20%)
  ratSat: number;          // RAT / SAT (2%)
  terceiros: number;       // Terceiros / Outras Entidades (5.8%)
  totalPatronal: number;   // Total Patronal (27.8%)
  fgtsValor: number;       // FGTS da empresa (8%)
}

export interface Paystub {
  id: string;
  companyId?: string;
  empresaId?: string;
  periodId: string;
  periodName: string;      // Ex: "Folha Mensal - Julho / 2026"
  employeeId: string;
  employeeName: string;
  cpf: string;
  cargo: string;
  departamento: string;
  admissaoDate: string;
  bancoInfo?: {
    banco: string;
    agencia: string;
    conta: string;
    tipoConta: 'Corrente' | 'Poupança' | 'Salário';
    pix?: string;
  };
  salarioBase: number;
  diasTrabalhados: number;
  dependentsCount: number;
  pensaoAlimenticiaValue: number;
  
  items: PaystubItem[];
  
  totalProventos: number;
  totalDescontos: number;
  valorLiquido: number;
  
  // Bases e Impostos Calculados
  baseINSS: number;
  valorINSS: number;
  baseIRRF: number;
  valorIRRF: number;
  baseFGTS: number;
  valorFGTS: number;
  
  // Encargos da Empresa
  employerCharges: EmployerCharges;
  
  // Assinatura e Segurança
  statusAssinatura: 'Pendente' | 'Assinado Digitalmente' | 'Recusado';
  dataAssinatura?: string;
  hashDigital?: string;
  ipAssinatura?: string;
  notes?: string;
  pdfUrl?: string;
}

export interface PayrollPeriod {
  id: string;
  payrollPeriodId?: string;
  companyId?: string;
  empresaId?: string;
  referenceMonth: string;  // Ex: "2026-07"
  year: number;
  month: number;
  type: PayrollType;
  status: PayrollPeriodStatus;
  
  dataInicial?: string;
  dataFinal?: string;
  dataDePagamento?: string;
  
  closedAt?: string;
  closedBy?: string;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenReason?: string;
  
  aprovadoPor?: string;
  aprovadoEm?: string;
  
  totalEmployees: number;
  totalGross: number;      // Total Proventos
  totalDiscounts: number;  // Total Descontos
  totalNet: number;        // Total Líquido a Pagar
  totalFGTS: number;       // Total FGTS 8%
  totalPatronal: number;   // Total Encargos Empresa
  
  paystubsCount: number;
  paystubsSignedCount: number;
  versionNumber?: number;
  hashVersion?: string;
  createdAt?: string;
  updatedAt: string;
}

export interface PayrollCompanySettings {
  payrollSettingsId: string;
  companyId: string;
  empresaId: string;
  razaoSocial: string;
  cnpj: string;
  regimeTributario: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | 'MEI';
  naturezaJuridica?: string;
  cnae?: string;
  fpas?: string;
  terceiros?: string;
  ratPercent: number;
  fapPercent: number;
  sindicatoDefault?: string;
  convenacaoColetiva?: string;
  dataPagamentoDia: number;
  formaPagamentoPadrao: 'PIX' | 'TED' | 'Depósito' | 'Cheque';
  contaBancaria: {
    banco: string;
    agencia: string;
    conta: string;
  };
  responsavelNome: string;
  responsavelEmail: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalaryHistoryDoc {
  salaryHistoryId: string;
  employeeId: string;
  companyId: string;
  salarioAnterior: number;
  salarioNovo: number;
  motivo: string;
  vigencia: string;
  responsavel: string;
  createdAt: string;
}

export interface VariablePayDoc {
  variablePayId: string;
  employeeId: string;
  companyId: string;
  competencia: string;
  tipo: 'comissao' | 'bonus' | 'premio' | 'produtividade' | 'metas' | 'reembolso' | 'ajuda_custo';
  valor: number;
  origem: string;
  aprovacao: 'pendente' | 'aprovado' | 'rejeitado';
  responsavel: string;
  createdAt: string;
}

export interface AlimonyDoc {
  alimonyId: string;
  employeeId: string;
  companyId: string;
  beneficiario: string;
  cpfBeneficiario: string;
  tipoCalculo: 'percentual_liquido' | 'percentual_bruto' | 'valor_fixo';
  valorOuPercentual: number;
  baseCalculoStr?: string;
  contaPagamento: string;
  vigenciaInicio: string;
  status: 'Ativo' | 'Inativo';
}

export interface LoanDoc {
  loanId: string;
  employeeId: string;
  companyId: string;
  instituicao: string;
  contratoNumero: string;
  valorTotal: number;
  valorParcela: number;
  totalParcelas: number;
  parcelasPagas: number;
  saldoDevedor: number;
  status: 'Ativo' | 'Quitado' | 'Suspenso';
}

export interface PayrollPaymentDoc {
  paymentId: string;
  payrollPeriodId: string;
  employeeId: string;
  employeeName: string;
  companyId: string;
  valor: number;
  banco: string;
  agencia: string;
  conta: string;
  pixKey?: string;
  forma: 'PIX' | 'TED' | 'DOC' | 'Cheque';
  status: 'pendente' | 'processando' | 'pago' | 'rejeitado' | 'cancelado';
  pagoEm?: string;
  comprovanteHash?: string;
}

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
  deduction?: number;
}

export interface TaxTableVersion {
  id: string;
  companyId: string;
  vigenciaInicio: string;  // Ex: "2026-01"
  vigenciaFim?: string;    // Opcional se for vigência atual
  description: string;     // Ex: "Tabela Oficial Fisco 2026"
  minimumWage: number;     // Ex: 1518.00
  inssCeiling: number;     // Ex: 8157.41
  irrfDependentDeduction: number; // Ex: 189.59
  irrfSimplifiedDeduction: number; // Ex: 564.80
  inssBrackets: TaxBracket[];
  irrfBrackets: TaxBracket[];
  ratPercent: number;      // Ex: 2.0
  terceirosPercent: number;// Ex: 5.8
  inssPatronalPercent: number; // Ex: 20.0
  fgtsPercent: number;     // Ex: 8.0
  isSystemDefault?: boolean;
}

export interface PayrollAuditLog {
  id: string;
  companyId: string;
  periodId?: string;
  action: string;
  userEmail: string;
  userName: string;
  details: string;
  timestamp: string;
}

export interface PayrollValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  totalEmployeesToCheck: number;
  employeesMissingSalary: string[];
  employeesWithPendingAbsences: string[];
}

export interface PayrollConfig {
  companyId: string;
  diaPagamento: number;      // Ex: 5 (5º dia útil)
  diaAdiantamento: number;   // Ex: 20
  percentualAdiantamento: number; // Ex: 40%
  pagaInsalubridade: boolean;
  pagaPericulosidade: boolean;
  bancoHorasAtivo: boolean;
  integracaoPontoAutomatica: boolean;
  integracaoBeneficiosAutomatica: boolean;
}

export interface ESocialEvent {
  id: string;
  code: 'S-1200' | 'S-1210' | 'S-2200' | 'S-2299';
  title: string;
  description: string;
  periodRef: string;
  totalRecords: number;
  status: 'Gerado' | 'Transmitido' | 'Validado com Sucesso' | 'Erro no Lote';
  xmlData: string;
  generatedAt: string;
  receiptNumber?: string;
}

export interface PayrollFilterParams {
  searchTerm?: string;
  department?: string;
  statusAssinatura?: 'Todos' | 'Pendente' | 'Assinado Digitalmente';
  payrollType?: PayrollType | 'Todos';
}
