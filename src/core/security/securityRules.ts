/**
 * Módulo NÚCLEO - Rotas Base e Regras de Segurança Geral
 */

import { UserRole, AuthSession } from '../types';

export interface RouteDefinition {
  path: string;
  name: string;
  allowedRoles: UserRole[];
  requiresAuth: boolean;
}

/**
 * Mapeamento de rotas base do sistema e exigências de perfil
 */
export const BASE_ROUTES: RouteDefinition[] = [
  { path: '/dashboard', name: 'Painel Principal', allowedRoles: ['ADMIN', 'GESTOR', 'RECRUTADOR', 'COLABORADOR'], requiresAuth: true },
  { path: '/vagas', name: 'Gestão de Vagas', allowedRoles: ['ADMIN', 'GESTOR', 'RECRUTADOR'], requiresAuth: true },
  { path: '/banco-talentos', name: 'Banco de Talentos', allowedRoles: ['ADMIN', 'GESTOR', 'RECRUTADOR'], requiresAuth: true },
  { path: '/entrevistas', name: 'Agenda de Entrevistas', allowedRoles: ['ADMIN', 'GESTOR', 'RECRUTADOR'], requiresAuth: true },
  { path: '/relatorios', name: 'Relatórios & Analytics', allowedRoles: ['ADMIN', 'GESTOR'], requiresAuth: true },
  { path: '/empresa', name: 'Estrutura Organizacional', allowedRoles: ['ADMIN', 'GESTOR'], requiresAuth: true },
  { path: '/configuracoes', name: 'Configurações', allowedRoles: ['ADMIN'], requiresAuth: true },
];

/**
 * Verifica se uma sessão de usuário ativa possui permissão para acessar a rota ou recurso
 */
export const hasPermission = (
  session: AuthSession | null | undefined,
  requiredRoles: UserRole[]
): boolean => {
  if (!session) return false;
  if (session.role === 'ADMIN') return true; // ADMIN tem permissão total
  return requiredRoles.includes(session.role);
};

/**
 * Sanitiza strings para prevenir injeções de scripts maliciosos básicos (XSS)
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};
