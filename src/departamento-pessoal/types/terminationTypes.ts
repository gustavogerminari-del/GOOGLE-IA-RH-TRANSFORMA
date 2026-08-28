/**
 * Tipos e Interfaces para o Módulo Completo de Rescisão e Desligamento
 * RH TRANSFORMA - Plataforma SaaS de Gestão de Pessoas
 * Em conformidade com as regras de cálculo trabalhista, eSocial e legislação vigente.
 */

export type TipoDesligamento = 
  | 'Pedido de demissão'
  | 'Dispensa sem justa causa'
  | 'Dispensa por justa causa'
  | 'Rescisão por acordo (Art. 484-A CLT)'
  | 'Término de contrato por prazo determinado'
  | 'Término de contrato de experiência'
  | 'Rescisão antecipada pelo empregador'
  | 'Rescisão antecipada pelo empregado'
  | 'Rescisão indireta'
  | 'Aposentadoria'
  | 'Falecimento'
  | 'Abandono de emprego'
  | 'Transferência entre empresas do grupo'
  | 'Desligamento personalizado';

export type StatusRescisao = 
  | 'Rascunho'
  | 'Solicitada'
  | 'Em análise'
  | 'Aguardando aprovação'
  | 'Aprovada'
  | 'Em processamento'
  | 'Aguardando documentos'
  | 'Aguardando devoluções'
  | 'Aguardando assinatura'
  | 'Pronta para conclusão'
  | 'Concluída'
  | 'Cancelada'
  | 'Reaberta';

export type TipoAvisoPrevio = 
  | 'Trabalhado' 
  | 'Indenizado' 
  | 'Dispensado' 
  | 'Cumprido parcialmente' 
  | 'Não aplicável';

export type OpcaoReducaoJornada = '2 horas diárias' | '7 dias corridos' | 'Sem redução';

export interface AprovaRescisao {
  id: string;
  approverId: string;
  approverName: string;
  approverRole: string;
  decision: 'Aprovado' | 'Reprovado' | 'Pendente';
  reason?: string;
  createdAt: string;
}

export interface DadoAvisoPrevio {
  noticeType: TipoAvisoPrevio;
  noticeStartDate: string;
  noticeEndDate: string;
  noticeDays: number;
  workedDays: number;
  indemnifiedDays: number;
  employeeReleased: boolean;
  reductionOption: OpcaoReducaoJornada;
  observations?: string;
}

export interface HistoricoItemCalculo {
  updatedAt: string;
  updatedBy: string;
  previousValue: number;
  newValue: number;
  reason: string;
}

export interface ItemMemoriaCalculo {
  id: string;
  companyId: string;
  terminationId: string;
  employeeId: string;
  eventCode: string;
  eventName: string;
  type: 'Provento' | 'Desconto';
  calculationBase: number;
  quantity: number;
  rate?: number;
  reference?: string;
  grossValue: number;
  discountValue: number;
  netValue: number;
  source: 'Calculado' | 'Manual';
  manual: boolean;
  notes?: string;
  editHistory?: HistoricoItemCalculo[];
  createdAt: string;
  updatedAt: string;
}

export interface ItemChecklistDesligamento {
  id: string;
  companyId: string;
  terminationId: string;
  title: string;
  description?: string;
  required: boolean;
  responsibleRole: string;
  responsibleUserId?: string;
  responsibleUserName?: string;
  status: 'Pendente' | 'Concluído' | 'Não aplicável';
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

export interface EquipamentoDevolucao {
  id: string;
  companyId: string;
  terminationId: string;
  assetId: string;
  assetName: string;
  serialNumber?: string;
  conditionAtDelivery: 'Novo' | 'Bom' | 'Regular' | 'Usado';
  conditionAtReturn?: 'Bom' | 'Regular' | 'Danificado' | 'Não Devolvido';
  returned: boolean;
  returnDate?: string;
  returnedTo?: string;
  photoUrl?: string;
  notes?: string;
}

export interface ExameAsoDemissional {
  needsExam: boolean;
  clinicName?: string;
  examDate?: string;
  doctorName?: string;
  doctorCrm?: string;
  result: 'Apto' | 'Inapto' | 'Pendente';
  asoFileUrl?: string;
  notes?: string;
}

export interface EntrevistaDesligamento {
  id: string;
  companyId: string;
  terminationId: string;
  employeeId: string;
  reasonForLeaving: string;
  leadershipRating: number; // 1 to 5
  environmentRating: number;
  compensationRating: number;
  cultureRating: number;
  growthRating: number;
  wouldRecommend: boolean;
  wouldReturn: boolean;
  openFeedback?: string;
  interviewerName?: string;
  completedAt: string;
}

export type ElegibilidadeRecontratacao = 'Elegível' | 'Não elegível' | 'Condicionado' | 'Não avaliado';

export interface DadoElegibilidadeRehire {
  rehireEligibility: ElegibilidadeRecontratacao;
  rehireReason?: string;
  rehireNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ProcessoRescisaoCompleto {
  id: string;
  companyId: string;
  empresaId?: string;
  employeeId: string;
  employeeName: string;
  employeeCpf?: string;
  employeeDepartment?: string;
  employeeRole?: string;
  salaryBase: number;
  admissionDate: string;
  
  // Solicitante e Datas
  terminationType: TipoDesligamento;
  requestDate: string;
  plannedTerminationDate: string;
  lastWorkingDay: string;
  reason?: string;
  requestedBy: string;
  requestedByName?: string;
  managerId?: string;
  managerName?: string;
  notes?: string;
  status: StatusRescisao;

  // Fluxos do Processo
  approvals: AprovaRescisao[];
  notice: DadoAvisoPrevio;
  calculationItems: ItemMemoriaCalculo[];
  checklist: ItemChecklistDesligamento[];
  assets: EquipamentoDevolucao[];
  medicalExam: ExameAsoDemissional;
  exitInterview?: EntrevistaDesligamento;
  rehireInfo?: DadoElegibilidadeRehire;

  // Totais de Cálculo
  totalGross: number;
  totalDiscounts: number;
  totalNet: number;
  fgtsBalanceEstimate: number;
  fgtsFinePercentage: number;
  fgtsFineValue: number;

  // Finalização e Auditoria
  completedAt?: string;
  completedBy?: string;
  canceledAt?: string;
  canceledBy?: string;
  cancellationReason?: string;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenedReason?: string;

  createdAt: string;
  updatedAt: string;
}

export interface RegraDesligamentoEmpresa {
  id: string;
  companyId: string;
  name: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  terminationTypes: TipoDesligamento[];
  noticeDaysDefault: number;
  noticeBonusPerYearDays: number; // +3 dias por ano trabalhado
  maxNoticeDays: number; // max 90 dias
  fgtsFineRates: Record<string, number>; // ex: { 'Dispensa sem justa causa': 40, 'Rescisão por acordo (Art. 484-A CLT)': 20 }
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
