/**
 * MÓDULO FÉRIAS, AFASTAMENTOS E BENEFÍCIOS - Tipos TypeScript
 * RH TRANSFORMA - Sistema de Gestão de Pessoas
 */

export type LeaveType = 'Férias Regulamentares' | 'Licença Maternidade/Paternidade' | 'Atestado Médico' | 'Licença Luto' | 'Folga Compensatória';

export type LeaveStatus = 'Pendente de Aprovação' | 'Aprovado' | 'Em Andamento' | 'Concluído' | 'Rejeitado';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: LeaveStatus;
  requestedAt: string;
  approverName?: string;
  medicalCertificateFile?: string;
  notes?: string;
}

export interface EmployeeLeaveBalance {
  employeeId: string;
  employeeName: string;
  department: string;
  vestingPeriodStart: string; // Inicio periodo aquisitivo (ex: 2025-05-10)
  vestingPeriodEnd: string;   // Fim periodo aquisitivo (ex: 2026-05-09)
  expirationDate: string;      // Limite para gozo antes de dobrar (ex: 2027-04-09)
  accruedDays: number;         // Saldo acumulado (ex: 30 dias)
  takenDays: number;           // Dias gozados
  remainingDays: number;       // Saldo restante
  isExpiringSoon?: boolean;
}

export type BenefitCategory = 'Vale Transporte (VT)' | 'Vale Refeição (VR)' | 'Vale Alimentação (VA)' | 'Plano de Saúde' | 'Plano Odontológico' | 'Seguro de Vida' | 'Auxílio Creche';

export interface BenefitItem {
  id: string;
  code: string;
  title: string;
  category: BenefitCategory;
  provider: string;
  monthlyValuePerEmployee: number;
  companyDiscountPercent: number; // Ex: 6% VT ou 20% VR
  activeEnrolledEmployees: number;
  renewalDate: string;
  status: 'Ativo' | 'Em Renovação' | 'Suspenso';
}
