/**
 * Módulo AUTENTICAÇÃO E ACESSO - Perfis, Matriz de Permissões e Contas Demo
 */

import { RoleProfile, ScreenRouteKey, SystemActionKey, UserProfile } from '../types/auth';

const ALL_SCREENS: ScreenRouteKey[] = [
  'dashboard',
  'ponto-digital',
  'vagas',
  'banco-talentos',
  'entrevistas',
  'relatorios',
  'empresa',
  'colaboradores',
  'departamento-pessoal',
  'beneficios',
  'ferias',
  'rescisao',
  'relatorios-dp',
  'configuracoes-trabalhistas',
  'equipe-interna',
  'site-vagas',
  'consultor-rh',
  'ferias-beneficios',
  'documentos',
  'folha-pagamento',
  'auditoria',
  'planos-saas',
  'acesso-master',
  'configuracoes',
];

/**
 * Matriz de Telas Permitidas por Perfil de Acesso
 */
export const SCREEN_PERMISSIONS: Record<RoleProfile, ScreenRouteKey[]> = {
  'Super Administrador': ALL_SCREENS,
  'Administrador': ALL_SCREENS,
  'Gestor de Seleção': ALL_SCREENS,
  'Recrutador Sênior': ALL_SCREENS,
  'Analista de RH': ALL_SCREENS,
  'Colaborador': ['portal-colaborador', 'ponto-digital', 'documentos', 'ferias', 'folha-pagamento'],
};

const ALL_ACTIONS: SystemActionKey[] = [
  'create_job',
  'edit_job',
  'close_job',
  'edit_budget',
  'approve_hire',
  'delete_candidate',
  'schedule_interview',
  'export_reports',
  'edit_settings',
  'manage_users',
];

/**
 * Matriz de Ações do Sistema Permitidas por Perfil
 */
export const ACTION_PERMISSIONS: Record<RoleProfile, SystemActionKey[]> = {
  'Super Administrador': ALL_ACTIONS,
  'Administrador': ALL_ACTIONS,
  'Gestor de Seleção': ALL_ACTIONS,
  'Recrutador Sênior': ALL_ACTIONS,
  'Analista de RH': ALL_ACTIONS,
  'Colaborador': [],
};

/**
 * Usuários Demo removidos conforme diretrizes de produção.
 */
export const DEMO_USERS: UserProfile[] = [];
