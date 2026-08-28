/**
 * MÓDULO AUDITORIA E REGISTRO DE AÇÕES - Tipos TypeScript
 * RH TRANSFORMA - Sistema de Gestão de Pessoas
 */

export type AuditActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'PERMISSION_CHANGE';

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SECURITY';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // Ex: 2026-07-26 14:22:10
  userName: string;
  userEmail: string;
  userRole: string;
  ipAddress: string;
  locationState?: string;
  moduleName: 'Vagas' | 'Banco de Talentos' | 'Entrevistas' | 'Equipe Interna' | 'Consultoria RH' | 'Planos SaaS' | 'Configurações';
  actionType: AuditActionType;
  description: string;
  targetEntity?: string;
  severity: AuditSeverity;
}
