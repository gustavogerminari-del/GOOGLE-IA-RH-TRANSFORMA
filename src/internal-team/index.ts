/**
 * Módulo EQUIPE INTERNA - Exportação Unificada
 * RH TRANSFORMA - Sistema de Gestão de Pessoas
 * 
 * Depende exclusivamente de:
 * 1. NÚCLEO (/src/core)
 * 2. COMPARTILHADO (/src/shared)
 * 3. AUTENTICAÇÃO (/src/auth)
 * 4. ESTRUTURA ORGANIZACIONAL (/src/organization)
 * 
 * Sem dependências circulares com outros módulos.
 */

export * from './types/team';
export * from './constants/teamOptions';
export * from './services/teamService';
export * from './components/TeamMemberCard';
export * from './components/TeamMemberModal';
export * from './components/TeamMemberMetricsModal';
export * from './components/ReassignJobsModal';
export * from './components/TeamPerformanceOverview';
export * from './components/TeamManagementView';
