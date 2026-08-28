// RH_DP_MODULE_RESPONSIBILITIES_V1
export type SystemRole = 'MASTER' | 'EMPRESA_ADMIN' | 'RH' | 'GESTOR' | 'COLABORADOR';

export const HEADHUNTER_FINANCIAL_PERMISSIONS = {
  VIEW: 'headhunter.financeiro.visualizar',
  EDIT: 'headhunter.financeiro.editar',
  FORWARD: 'headhunter.financeiro.encaminhar',
  CHARGE: 'headhunter.financeiro.cobrar',
} as const;

export type HeadhunterFinancialPermission =
  typeof HEADHUNTER_FINANCIAL_PERMISSIONS[keyof typeof HEADHUNTER_FINANCIAL_PERMISSIONS];

const HEADHUNTER_FINANCIAL_ACTIONS = new Set<string>(Object.values(HEADHUNTER_FINANCIAL_PERMISSIONS));
const HEADHUNTER_FINANCE_ACCESS_ALIASES = [
  'financeiroHeadhunter',
  'financeiro_headhunter',
  'financeiroheadhunter',
  'headhunter-financeiro',
  'headhunter_financeiro',
  'enviar_cobranca',
] as const;

export type ModuleCategoryKey = 'RECRUTAMENTO' | 'BANCO_TALENTOS' | 'HEADHUNTER' | 'DEPARTAMENTO_PESSOAL' | 'GESTAO';

export interface ModuleDefinition {
  key: string;
  name: string;
  category: ModuleCategoryKey;
  description: string;
  aliases: string[];
}

export const PLATFORM_MODULE_CATEGORIES: Record<ModuleCategoryKey, { title: string; modules: ModuleDefinition[] }> = {
  RECRUTAMENTO: {
    title: 'Recrutamento & Seleção',
    modules: [
      { key: 'dashboard', name: 'Dashboard', category: 'RECRUTAMENTO', description: 'Painel geral e indicadores de recrutamento', aliases: ['dashboard', 'visaoGeral', 'visao_geral', 'inicio', 'visãogeral', 'visão_geral'] },
      { key: 'recrutamento', name: 'Recrutamento', category: 'RECRUTAMENTO', description: 'Módulo funcional de recrutamento e seleção', aliases: ['recrutamento', 'recrutamento-selecao', 'recrutamento_selecao'] },
      { key: 'vagas', name: 'Vagas', category: 'RECRUTAMENTO', description: 'Abertura, edição e gestão de vagas', aliases: ['vagas', 'jobs', 'create_job', 'edit_job', 'close_job'] },
      { key: 'candidatos', name: 'Candidatos', category: 'RECRUTAMENTO', description: 'Triagem, movimentação de pipeline e candidaturas', aliases: ['candidatos', 'delete_candidate', 'candidaturas'] },
      { key: 'entrevistas', name: 'Entrevistas', category: 'RECRUTAMENTO', description: 'Agendamento e avaliação de entrevistas', aliases: ['entrevistas', 'schedule_interview'] },
      { key: 'contratacoes', name: 'Contratações', category: 'RECRUTAMENTO', description: 'Fluxo unificado de aprovações e efetivação', aliases: ['contratacoes', 'contratações', 'contratacao', 'contratação', 'approve_hire'] },
    ],
  },
  BANCO_TALENTOS: {
    title: 'Banco de Talentos',
    modules: [
      { key: 'bancoTalentos', name: 'Banco de Talentos', category: 'BANCO_TALENTOS', description: 'Banco independente, pesquisa, match e análises de talentos', aliases: ['bancoTalentos', 'banco-talentos', 'banco_talentos', 'bancotalentos', 'banco_de_talentos', 'match_talentos'] },
    ],
  },
  HEADHUNTER: {
    title: 'Headhunter & Consultoria',
    modules: [
      { key: 'headhunter', name: 'Headhunter', category: 'HEADHUNTER', description: 'Módulo de recrutamento executivo e terceirizado', aliases: ['headhunter'] },
      { key: 'clientes', name: 'Clientes', category: 'HEADHUNTER', description: 'Gestão de empresas clientes e contas', aliases: ['clientes', 'headhunter-clientes', 'headhunter_clientes', 'headhunterclientes'] },
      { key: 'comercial', name: 'Comercial', category: 'HEADHUNTER', description: 'Propostas comerciais e CRM de vendas', aliases: ['comercial', 'headhunter-comercial', 'headhunter_comercial', 'headhuntercomercial', 'headhunter-crm', 'headhunter-propostas', 'headhunter-contratos'] },
      { key: 'financeiroHeadhunter', name: 'Financeiro (Headhunter)', category: 'HEADHUNTER', description: 'Faturamento de honorários e cobranças', aliases: ['financeiroHeadhunter', 'financeiro', 'financeiro_headhunter', 'financeiroheadhunter', 'headhunter-financeiro', 'headhunter_financeiro', 'headhunter-comissoes', 'headhunter-despesas', 'enviar_cobranca'] },
    ],
  },
  DEPARTAMENTO_PESSOAL: {
    title: 'Departamento Pessoal (DP)',
    modules: [
      { key: 'departamentoPessoal', name: 'Departamento Pessoal', category: 'DEPARTAMENTO_PESSOAL', description: 'Núcleo de DP: visão geral, SST, rescisões, acessos ao portal e configurações trabalhistas', aliases: ['departamentoPessoal', 'dp', 'departamento_pessoal', 'departamentopessoal', 'sst', 'rescisao', 'rescisões', 'rescisoes', 'acessos-portal', 'configuracoes-trabalhistas'] },
      { key: 'equipeInterna', name: 'Equipe Interna', category: 'DEPARTAMENTO_PESSOAL', description: 'Colaboradores, organograma, cargos e salários e admissões', aliases: ['equipeInterna', 'equipe-interna', 'equipe_interna', 'colaboradores', 'organograma', 'cargos-salarios', 'cargos_salarios', 'admissoes', 'admissões'] },
      { key: 'admissao', name: 'Admissão', category: 'DEPARTAMENTO_PESSOAL', description: 'Admissão digital, envio de kits e efetivação', aliases: ['admissao', 'admissões', 'admissoes', 'efetivar_admissao'] },
      { key: 'funcionarios', name: 'Funcionários', category: 'DEPARTAMENTO_PESSOAL', description: 'Cadastro e prontuário de colaboradores', aliases: ['funcionarios', 'funcionários', 'cadastrar_funcionario', 'manage_users'] },
      { key: 'documentos', name: 'Documentos', category: 'DEPARTAMENTO_PESSOAL', description: 'Gestão documental e assinatura digital', aliases: ['documentos', 'documentosAssinatura', 'documentos-assinatura'] },
      { key: 'pontoEletronico', name: 'Ponto e Jornada', category: 'DEPARTAMENTO_PESSOAL', description: 'Marcações, jornadas, escalas, banco de horas, horas extras, faltas, ajustes, espelho e fechamento para folha', aliases: ['pontoEletronico', 'pontoDigital', 'ponto-digital', 'ponto_digital', 'ponto', 'jornada', 'ponto-jornada'] },
      { key: 'folhaPagamento', name: 'Folha de Pagamento', category: 'DEPARTAMENTO_PESSOAL', description: 'Cálculo de holerites, eventos, proventos, descontos e fechamento da folha', aliases: ['folhaPagamento', 'folha', 'folha-pagamento', 'folha_pagamento', 'payroll'] },
      { key: 'feriasBeneficios', name: 'Férias & Benefícios', category: 'DEPARTAMENTO_PESSOAL', description: 'Benefícios, férias e afastamentos dos colaboradores', aliases: ['feriasBeneficios', 'ferias', 'férias', 'beneficios', 'benefícios', 'ferias-beneficios', 'afastamentos', 'ferias-afastamentos'] },
    ],
  },
  GESTAO: {
    title: 'Gestão & Tecnologia',
    modules: [
      { key: 'consultorRH', name: 'Consultor RH (IA)', category: 'GESTAO', description: 'Assistente inteligente e análises preditivas', aliases: ['consultorRH', 'iaConsultora', 'mais-rh-ia', 'consultor-rh', 'ia'] },
      { key: 'relatorios', name: 'Relatórios', category: 'GESTAO', description: 'Relatórios analíticos e exportação de dados', aliases: ['relatorios', 'relatórios', 'relatoriosAvancados', 'relatorios-dp', 'export_reports', 'relatorios-gerais'] },
      { key: 'auditoria', name: 'Auditoria', category: 'GESTAO', description: 'Trilha de auditoria e logs de segurança', aliases: ['auditoria', 'logs', 'auditoriaLogs', 'auditoria_logs'] },
      { key: 'siteVagas', name: 'Site de Vagas', category: 'GESTAO', description: 'Portal de carreiras e publicação pública de vagas', aliases: ['siteVagas', 'siteVagasPersonalizado', 'site-vagas'] },
      { key: 'api', name: 'API & Integrações', category: 'GESTAO', description: 'Acesso a endpoints de API e conectores externos', aliases: ['api', 'integracoes'] },
      { key: 'implantacaoMigracao', name: 'Implantação e Migração', category: 'GESTAO', description: 'Implantação, importação e migração de dados de sistemas anteriores', aliases: ['implantacaoMigracao', 'implantacao-migracao', 'implantacao_migracao', 'migracao', 'migração'] },
      { key: 'configuracoes', name: 'Configurações', category: 'GESTAO', description: 'Parâmetros corporativos e preferências', aliases: ['configuracoes', 'configurações', 'edit_settings', 'configuracoes-trabalhistas', 'empresa'] },
    ],
  },
};

/**
 * Normalizes any string, route, action or alias to its canonical platform module key.
 */
export function getCanonicalModuleKey(keyOrAlias: string): string {
  if (!keyOrAlias) return 'dashboard';
  const clean = String(keyOrAlias).trim();
  const lower = clean.toLowerCase();
  const normalizedClean = lower.replace(/[-_]/g, '');

  for (const cat of Object.values(PLATFORM_MODULE_CATEGORIES)) {
    for (const mod of cat.modules) {
      if (mod.key === clean || mod.key.toLowerCase() === lower || mod.key.toLowerCase().replace(/[-_]/g, '') === normalizedClean) {
        return mod.key;
      }
      if (mod.aliases.some((a) => a === clean || a.toLowerCase() === lower || a.toLowerCase().replace(/[-_]/g, '') === normalizedClean)) {
        return mod.key;
      }
    }
  }

  return clean;
}

export interface CompanyModulesMap {
  [moduleKey: string]: boolean;
}

export interface UserPermissionsMap {
  [moduleKey: string]: boolean;
}

export interface AccessCheckOptions {
  userRole?: string;
  isMaster?: boolean;
  companyModules?: CompanyModulesMap;
  userPermissions?: UserPermissionsMap | string[];
  userId?: string;
  companyId?: string;
  isTrial?: boolean;
}

export const ROLE_PERMISSIONS_MAP: Record<SystemRole, string[]> = {
  MASTER: ['*'],
  EMPRESA_ADMIN: [
    'dashboard',
    'vagas',
    'candidatos',
    'bancoTalentos',
    'entrevistas',
    'contratacoes',
    'headhunter',
    'clientes',
    'comercial',
    'financeiroHeadhunter',
    'departamentoPessoal',
    'admissao',
    'funcionarios',
    'documentos',
    'pontoEletronico',
    'folhaPagamento',
    'feriasBeneficios',
    'consultorRH',
    'relatorios',
    'siteVagas',
    'api',
    'configuracoes',
  ],
  RH: [
    'dashboard',
    'vagas',
    'candidatos',
    'bancoTalentos',
    'entrevistas',
    'contratacoes',
    'headhunter',
    'clientes',
    'comercial',
    'departamentoPessoal',
    'admissao',
    'funcionarios',
    'documentos',
    'pontoEletronico',
    'feriasBeneficios',
    'consultorRH',
    'relatorios',
    'siteVagas',
  ],
  GESTOR: [
    'dashboard',
    'vagas',
    'candidatos',
    'bancoTalentos',
    'entrevistas',
    'departamentoPessoal',
    'pontoEletronico',
    'relatorios',
  ],
  COLABORADOR: [
    'dashboard',
    'pontoEletronico',
    'documentos',
  ],
};

export class PermissionService {
  private static getPermissionFlag(
    permissions: UserPermissionsMap | string[] | undefined,
    permission: string
  ): boolean | undefined {
    if (Array.isArray(permissions)) return permissions.includes(permission) ? true : undefined;
    if (permissions && typeof permissions === 'object' && permission in permissions) {
      return permissions[permission] === true;
    }
    return undefined;
  }

  private static hasLegacyHeadhunterAccess(
    permission: HeadhunterFinancialPermission,
    options: AccessCheckOptions
  ): boolean {
    const userPermissions = options.userPermissions;
    const financePermission = HEADHUNTER_FINANCE_ACCESS_ALIASES.reduce<boolean | undefined>((resolved, alias) => {
      const current = this.getPermissionFlag(userPermissions, alias);
      if (current === false) return false;
      return resolved === true || current === true ? true : resolved;
    }, undefined);
    const headhunterPermission = this.getPermissionFlag(userPermissions, 'headhunter');

    if (permission === HEADHUNTER_FINANCIAL_PERMISSIONS.CHARGE) {
      return financePermission === true;
    }

    if (financePermission === true || headhunterPermission === true) return true;

    const normalizedRole = this.normalizeRole(options.userRole);
    return normalizedRole === 'RH';
  }

  private static checkHeadhunterFinancialAction(
    permission: HeadhunterFinancialPermission,
    options: AccessCheckOptions
  ): { allowed: boolean; reason?: string } {
    const companyHasHeadhunter = this.isCompanyModuleActive('headhunter', options.companyModules || {});
    const companyHasDp = this.isCompanyModuleActive('departamentoPessoal', options.companyModules || {});
    const companyHasFinance = this.isCompanyModuleActive('financeiroHeadhunter', options.companyModules || {});

    // Empresa no pacote Recrutamento + DP nunca recebe ação financeira/Headhunter,
    // mesmo que exista flag filha/legada no documento de módulos.
    if (companyHasDp && !companyHasHeadhunter) {
      return { allowed: false, reason: 'Acesso Headhunter/Financeiro bloqueado para empresa com fluxo Recrutamento + DP.' };
    }
    const requiredModuleActive = permission === HEADHUNTER_FINANCIAL_PERMISSIONS.CHARGE
      ? companyHasFinance
      : companyHasHeadhunter || companyHasFinance;

    if (!requiredModuleActive) {
      return { allowed: false, reason: 'O módulo Headhunter/Financeiro não está ativo para esta empresa.' };
    }

    if (options.isMaster || this.isMaster(options.userRole) || this.isCompanyAdmin(options.userRole)) {
      return { allowed: true };
    }

    const explicitPermission = this.getPermissionFlag(options.userPermissions, permission);
    if (explicitPermission !== undefined) {
      return explicitPermission
        ? { allowed: true }
        : { allowed: false, reason: `A permissão '${permission}' foi desativada para este usuário.` };
    }

    if (this.hasLegacyHeadhunterAccess(permission, options)) return { allowed: true };

    return { allowed: false, reason: `O usuário não possui a permissão '${permission}'.` };
  }

  /**
   * Identifies if a given role string belongs to a Company Administrator profile.
   * Recognizes: ADMIN_EMPRESA, ADMIN, ADMINISTRADOR, Administrador, EMPRESA_ADMIN, GESTOR_EMPRESA, EMPRESA
   */
  static isCompanyAdmin(role?: string): boolean {
    if (!role) return false;
    const upper = String(role).trim().toUpperCase().replace(/\s+/g, '_');
    return (
      upper === 'EMPRESA_ADMIN' ||
      upper === 'ADMIN_EMPRESA' ||
      upper === 'ADMIN' ||
      upper === 'ADMINISTRADOR' ||
      upper === 'ADMINISTRADOR_EMPRESA' ||
      upper === 'GESTOR_EMPRESA'
    );
  }

  /**
   * Identifies if a given role string belongs to a Master (Super Admin) profile.
   */
  static isMaster(role?: string): boolean {
    if (!role) return false;
    const upper = String(role).trim().toUpperCase().replace(/\s+/g, '_');
    return upper === 'MASTER';
  }

  /**
   * Evaluates access based on the Strict Hierarchy:
   * 1. MASTER: total access; ignores company & user restrictions.
   * 2. Base modules (dashboard, configuracoes): allowed for authenticated company users.
   * 3. LEVEL 1: Check if module is active for the company (companyModules).
   * 4. LEVEL 2 (ADMIN_EMPRESA): automatically accesses all active company modules (user.permissions is NOT required).
   * 5. LEVEL 2 (USUÁRIO COMUM): requires individual active user permission (userHasPermission).
   */
  static checkAccess(
    keyOrAlias: string,
    options: AccessCheckOptions
  ): { allowed: boolean; reason?: string } {
    if (HEADHUNTER_FINANCIAL_ACTIONS.has(keyOrAlias)) {
      const result = this.checkHeadhunterFinancialAction(keyOrAlias as HeadhunterFinancialPermission, options);
      this.logAccess(options, keyOrAlias, result.allowed, result.reason || 'Permissão financeira específica concedida');
      return result;
    }

    const canonicalKey = getCanonicalModuleKey(keyOrAlias);
    const role = options.userRole;

    // 1. MASTER Profile: Total unrestricted access
    if (options.isMaster || this.isMaster(role)) {
      this.logAccess(options, canonicalKey, true, 'Acesso Master Total Concedido');
      return { allowed: true };
    }

    // Isolamento obrigatório entre os dois produtos operacionais.
    // - Recrutamento + Headhunter: nenhuma tela/recurso do DP.
    // - Recrutamento + DP: nenhuma tela/recurso do Headhunter.
    const companyHasHeadhunter = this.isCompanyModuleActive('headhunter', options.companyModules || {});
    const companyHasDp = this.isCompanyModuleActive('departamentoPessoal', options.companyModules || {});
    const moduleDef = Object.values(PLATFORM_MODULE_CATEGORIES)
      .flatMap((category) => category.modules)
      .find((module) => module.key === canonicalKey);
    const moduleCategory = moduleDef?.category;

    if (companyHasHeadhunter && !companyHasDp && moduleCategory === 'DEPARTAMENTO_PESSOAL') {
      const reason = 'Acesso ao Departamento Pessoal bloqueado para empresa com fluxo Recrutamento + Headhunter.';
      this.logAccess(options, canonicalKey, false, reason);
      return { allowed: false, reason };
    }

    if (companyHasDp && !companyHasHeadhunter && moduleCategory === 'HEADHUNTER') {
      const reason = 'Acesso ao Headhunter bloqueado para empresa com fluxo Recrutamento + DP.';
      this.logAccess(options, canonicalKey, false, reason);
      return { allowed: false, reason };
    }

    if (options.isTrial && canonicalKey === 'bancoTalentos') {
      this.logAccess(options, canonicalKey, false, 'Banco de Talentos bloqueado no trial');
      return { allowed: false, reason: 'Banco de Talentos e Match Talentos não estão disponíveis no trial de 14 dias.' };
    }

    // 2. Base Modules: Always accessible for logged-in company users
    if (canonicalKey === 'dashboard' || canonicalKey === 'configuracoes') {
      return { allowed: true };
    }

    // 3. LEVEL 1: Check if Company has module active / contracted
    const companyAllowed = this.isCompanyModuleActive(canonicalKey, options.companyModules || {});
    if (!companyAllowed) {
      this.logAccess(options, canonicalKey, false, 'Módulo NÃO liberado para a empresa (Nível 1)');
      return {
        allowed: false,
        reason: `Acesso negado: O módulo '${canonicalKey}' não está ativado na licença da empresa.`,
      };
    }

    // 4. LEVEL 2 (ADMIN_EMPRESA): Automatically inherits all active company modules
    if (this.isCompanyAdmin(role)) {
      this.logAccess(options, canonicalKey, true, 'Acesso liberado para ADMIN_EMPRESA (Nível 2)');
      return { allowed: true };
    }

    // 5. LEVEL 2 (USUÁRIO COMUM): Requires individual user permission
    const userAllowed = this.isUserPermissionActive(canonicalKey, options);
    if (!userAllowed) {
      this.logAccess(options, canonicalKey, false, 'Usuário sem permissão individual ativa (Nível 2)');
      return {
        allowed: false,
        reason: `Acesso negado: Seu usuário não possui permissão para acessar o módulo '${canonicalKey}'.`,
      };
    }

    this.logAccess(options, canonicalKey, true, 'Acesso liberado para Usuário Comum (Nível 1 + Nível 2)');
    return { allowed: true };
  }

  /**
   * Helper to check Level 1 (Company Module Active)
   */
  static isCompanyModuleActive(keyOrAlias: string, companyModules: CompanyModulesMap): boolean {
    if (!companyModules) return false;
    const has = (key: string) => Object.prototype.hasOwnProperty.call(companyModules, key);

    // O valor explícito do checkbox é soberano, inclusive quando é false.
    if (has(keyOrAlias)) return companyModules[keyOrAlias] === true;

    const canonicalKey = getCanonicalModuleKey(keyOrAlias);
    if (has(canonicalKey)) return companyModules[canonicalKey] === true;

    // Compatibilidade apenas quando não existe valor explícito no mapa atual.
    for (const cat of Object.values(PLATFORM_MODULE_CATEGORIES)) {
      const mod = cat.modules.find((m) => m.key === canonicalKey);
      if (!mod) continue;
      const explicitAliases = mod.aliases.filter((alias) => has(alias));
      if (explicitAliases.length > 0) return explicitAliases.some((alias) => companyModules[alias] === true);
    }

    return false;
  }

  /**
   * Helper to check Level 2 (User Permission Active) for regular users.
   */
  static isUserPermissionActive(keyOrAlias: string, options: AccessCheckOptions): boolean {
    const canonicalKey = getCanonicalModuleKey(keyOrAlias);
    const role = options.userRole;

    // ADMIN_EMPRESA and MASTER automatically have permission for active company modules
    if (this.isMaster(role) || this.isCompanyAdmin(role)) {
      return true;
    }

    const userPerms = options.userPermissions;

    if (userPerms === undefined || userPerms === null) {
      const normRole = this.normalizeRole(role);
      const basePerms = ROLE_PERMISSIONS_MAP[normRole] || [];
      return basePerms.includes('*') || basePerms.includes(canonicalKey);
    }

    // Array format of user permissions: ['vagas', 'bancoTalentos', ...]
    if (Array.isArray(userPerms)) {
      if (userPerms.includes('*') || userPerms.includes(canonicalKey) || userPerms.includes(keyOrAlias)) return true;

      for (const cat of Object.values(PLATFORM_MODULE_CATEGORIES)) {
        const mod = cat.modules.find((m) => m.key === canonicalKey);
        if (mod && mod.aliases.some((a) => userPerms.includes(a))) return true;
      }
      return false;
    }

    // Map format of user permissions: { vagas: true, folhaPagamento: false }
    if (typeof userPerms === 'object') {
      if (userPerms[canonicalKey] === true || userPerms[keyOrAlias] === true) return true;

      for (const cat of Object.values(PLATFORM_MODULE_CATEGORIES)) {
        const mod = cat.modules.find((m) => m.key === canonicalKey);
        if (mod && mod.aliases.some((a) => userPerms[a] === true)) return true;
      }

      if (userPerms[canonicalKey] === undefined && userPerms[keyOrAlias] === undefined) {
        const normRole = this.normalizeRole(role);
        const basePerms = ROLE_PERMISSIONS_MAP[normRole] || [];
        return basePerms.includes('*') || basePerms.includes(canonicalKey);
      }

      return Boolean(userPerms[canonicalKey] ?? userPerms[keyOrAlias]);
    }

    return true;
  }

  /**
   * STRICT INHERITANCE RULE:
   * Sanitize user permissions so that NO user can be granted a permission
   * for a module that the company does NOT possess.
   */
  static sanitizeUserPermissions(
    requestedPermissions: Record<string, boolean>,
    companyModules: CompanyModulesMap
  ): Record<string, boolean> {
    const sanitized: Record<string, boolean> = {};

    Object.entries(requestedPermissions).forEach(([key, requestedValue]) => {
      const canonicalKey = getCanonicalModuleKey(key);
      const isCompanyActive = this.isCompanyModuleActive(canonicalKey, companyModules);

      sanitized[key] = isCompanyActive ? Boolean(requestedValue) : false;
    });

    return sanitized;
  }

  /**
   * Audit Logger for Access Attempts
   */
  static logAccess(
    options: AccessCheckOptions,
    moduleKey: string,
    granted: boolean,
    reason: string
  ): void {
    const logData = {
      timestamp: new Date().toISOString(),
      userId: options.userId || 'sessao_ativa',
      companyId: options.companyId || 'empresa_ativa',
      module: moduleKey,
      userRole: options.userRole || 'DESCONHECIDO',
      granted,
      reason,
    };

    if (!granted) {
      console.warn(`🔒 [MODULE_ACCESS_GUARD - BLOQUEADO]`, logData);
    }
  }

  /**
   * Strict Guard for Firestore Writes
   */
  static validateFirestoreWrite(
    moduleKey: string,
    options: AccessCheckOptions
  ): void {
    const check = this.checkAccess(moduleKey, options);
    if (!check.allowed) {
      const errorMsg = `[Firestore GUARD ERROR] Gravação bloqueada no módulo '${moduleKey}': ${check.reason}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  static normalizeRole(roleString?: string): SystemRole {
    if (!roleString) return 'COLABORADOR';
    if (this.isMaster(roleString)) return 'MASTER';
    if (this.isCompanyAdmin(roleString)) return 'EMPRESA_ADMIN';
    const upper = String(roleString).trim().toUpperCase().replace(/\s+/g, '_');
    if (
      upper === 'RH' ||
      upper === 'RECURSOS_HUMANOS' ||
      upper === 'HEADHUNTER' ||
      upper.startsWith('RECRUTADOR') ||
      upper.startsWith('ANALISTA_DE_RH') ||
      upper.startsWith('GESTOR_DE_SELE')
    ) return 'RH';
    if (upper === 'GESTOR' || upper === 'GERENTE' || upper === 'LIDER') return 'GESTOR';
    return 'COLABORADOR';
  }

  static isEmpresaAdmin(role?: string): boolean {
    return this.isMaster(role) || this.isCompanyAdmin(role);
  }

  static isRH(role?: string): boolean {
    const norm = this.normalizeRole(role);
    return norm === 'MASTER' || norm === 'EMPRESA_ADMIN' || norm === 'RH';
  }

  static isGestor(role?: string): boolean {
    const norm = this.normalizeRole(role);
    return norm === 'MASTER' || norm === 'EMPRESA_ADMIN' || norm === 'RH' || norm === 'GESTOR';
  }

  static isColaborador(): boolean {
    return true;
  }

  static hasPermission(userRole: string, permission: string, customPermissions?: string[]): boolean {
    return this.checkAccess(permission, { userRole, userPermissions: customPermissions }).allowed;
  }

  static canAccessRoute(userRole: string, route: string, enabledModules?: Record<string, boolean>, userPermissions?: any): boolean {
    const check = this.checkAccess(route, { userRole, companyModules: enabledModules, userPermissions });
    return check.allowed;
  }

  static getPermissionsForRole(role: string): string[] {
    const norm = this.normalizeRole(role);
    return ROLE_PERMISSIONS_MAP[norm] || ROLE_PERMISSIONS_MAP.COLABORADOR;
  }
}
