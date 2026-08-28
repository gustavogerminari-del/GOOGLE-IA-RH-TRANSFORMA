import { doc, getDoc, setDoc } from '../../firebase/firestore';
import { db } from '../../lib/firebase';

import { 
  PageConfig, 
  ComponentInstance, 
  PageVersion, 
  BuilderAuditLog, 
  CustomFieldDefinition, 
  NavigationMenuItem, 
  ClientTemplate,
  BuilderScope,
  CompanyThemeConfig,
  ThemeExportImportFormat,
  AiDesignProposal
} from '../types/builderTypes';

const BUILDER_COLLECTIONS = {
  PAGES: 'builder_pages',
  VERSIONS: 'builder_versions',
  AUDIT_LOGS: 'builder_audit_logs',
  CUSTOM_FIELDS: 'builder_fields',
  MENUS: 'builder_menus',
  TEMPLATES: 'builder_templates',
  THEMES: 'builder_themes'
} as const;

const cleanForFirestore = <T,>(value: T): T => JSON.parse(JSON.stringify(value));


// Initial Seed Pages
export const INITIAL_SYSTEM_PAGES: PageConfig[] = [
  {
    id: 'page-dashboard',
    name: 'Dashboard Operacional',
    slug: 'dashboard',
    route: '/dashboard',
    pageType: 'system',
    isSystemPage: true,
    scope: 'global',
    status: 'published',
    version: 1,
    layoutType: 'dashboard',
    requiredPermissions: ['dashboard.view'],
    updatedAt: new Date().toISOString(),
    updatedBy: 'MASTER Admin',
    components: [
      {
        id: 'comp-dash-header',
        pageId: 'page-dashboard',
        componentType: 'header',
        componentKey: 'header_main',
        name: 'Cabeçalho Principal',
        order: 1,
        protectionLevel: 'protected',
        content: {
          text: 'Painel Geral de Gestão de RH',
          helpText: 'Acompanhamento em tempo real de vagas, contratações e colaboradores'
        },
        styles: {
          fontSize: '24px',
          fontWeight: '800',
          textColor: '#0f172a',
          marginBottom: '16px'
        },
        responsive: { desktop: { fontSize: '24px' }, mobile: { fontSize: '18px' } },
        visibilityRules: { hidden: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'comp-dash-stat-vagas',
        pageId: 'page-dashboard',
        componentType: 'stat_card',
        componentKey: 'stat_vagas_ativas',
        name: 'Card Vagas Ativas',
        order: 2,
        protectionLevel: 'editable',
        content: {
          label: 'Vagas em Aberto',
          text: '12 Vagas',
          badgeText: '+2 esta semana',
          iconName: 'Briefcase'
        },
        styles: {
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0',
          borderRadius: '12px',
          paddingTop: '16px',
          paddingBottom: '16px'
        },
        responsive: { desktop: { width: '100%' } },
        visibilityRules: { hidden: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'comp-dash-btn-nova-vaga',
        pageId: 'page-dashboard',
        componentType: 'button',
        componentKey: 'btn_criar_vaga',
        name: 'Botão Nova Vaga',
        order: 3,
        protectionLevel: 'editable',
        content: {
          text: 'Criar Nova Vaga',
          iconName: 'Plus'
        },
        styles: {
          backgroundColor: '#4f46e5',
          textColor: '#ffffff',
          borderRadius: '8px',
          paddingTop: '10px',
          paddingBottom: '10px',
          fontWeight: '600'
        },
        responsive: { desktop: { display: 'inline-flex' } },
        visibilityRules: { hidden: false },
        actionConfig: { type: 'open_modal', targetModalId: 'new_job_modal' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'comp-dash-btn-logout',
        pageId: 'page-dashboard',
        componentType: 'button',
        componentKey: 'btn_logout_seguro',
        name: 'Botão Sair do Sistema',
        order: 99,
        protectionLevel: 'systemCritical',
        content: {
          text: 'Sair da Conta',
          iconName: 'LogOut'
        },
        styles: {
          backgroundColor: '#ef4444',
          textColor: '#ffffff',
          borderRadius: '8px'
        },
        responsive: {},
        visibilityRules: { hidden: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'page-vagas',
    name: 'Gestão de Vagas',
    slug: 'vagas',
    route: '/vagas',
    pageType: 'system',
    isSystemPage: true,
    scope: 'global',
    status: 'published',
    version: 1,
    layoutType: 'table_view',
    requiredPermissions: ['jobs.view'],
    updatedAt: new Date().toISOString(),
    updatedBy: 'MASTER Admin',
    components: [
      {
        id: 'comp-vagas-title',
        pageId: 'page-vagas',
        componentType: 'title',
        componentKey: 'title_vagas',
        name: 'Título Gestão de Vagas',
        order: 1,
        protectionLevel: 'protected',
        content: { text: 'Gestão Completa de Oportunidades & R&S' },
        styles: { fontSize: '22px', fontWeight: '800', textColor: '#0f172a' },
        responsive: {},
        visibilityRules: { hidden: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'comp-vagas-btn-cadastrar',
        pageId: 'page-vagas',
        componentType: 'button',
        componentKey: 'btn_cadastrar_vaga_main',
        name: 'Botão Cadastrar Vaga',
        order: 2,
        protectionLevel: 'editable',
        content: { text: 'Abrir Nova Vaga', iconName: 'PlusCircle' },
        styles: { backgroundColor: '#0d9488', textColor: '#ffffff', borderRadius: '8px' },
        responsive: {},
        visibilityRules: { hidden: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'page-candidatos',
    name: 'Banco de Talentos',
    slug: 'banco-talentos',
    route: '/banco-talentos',
    pageType: 'system',
    isSystemPage: true,
    scope: 'global',
    status: 'published',
    version: 1,
    layoutType: 'grid',
    requiredPermissions: ['candidates.view'],
    updatedAt: new Date().toISOString(),
    updatedBy: 'MASTER Admin',
    components: [
      {
        id: 'comp-cand-title',
        pageId: 'page-candidatos',
        componentType: 'title',
        componentKey: 'title_candidatos',
        name: 'Título Banco de Talentos',
        order: 1,
        protectionLevel: 'protected',
        content: { text: 'Banco Global de Talentos e Currículos' },
        styles: { fontSize: '22px', fontWeight: '800', textColor: '#0f172a' },
        responsive: {},
        visibilityRules: { hidden: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'comp-cand-btn-add',
        pageId: 'page-candidatos',
        componentType: 'button',
        componentKey: 'btn_adicionar_candidato',
        name: 'Botão Adicionar Candidato',
        order: 2,
        protectionLevel: 'editable',
        content: { text: 'Cadastrar Candidato', iconName: 'UserPlus' },
        styles: { backgroundColor: '#2563eb', textColor: '#ffffff', borderRadius: '8px' },
        responsive: {},
        visibilityRules: { hidden: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'page-ponto',
    name: 'Ponto Digital & Jornada',
    slug: 'ponto-digital',
    route: '/ponto-digital',
    pageType: 'system',
    isSystemPage: true,
    scope: 'global',
    status: 'published',
    version: 1,
    layoutType: 'flex',
    requiredPermissions: ['timeclock.view'],
    updatedAt: new Date().toISOString(),
    updatedBy: 'MASTER Admin',
    components: [
      {
        id: 'comp-ponto-title',
        pageId: 'page-ponto',
        componentType: 'title',
        componentKey: 'title_ponto',
        name: 'Título Ponto Eletrônico',
        order: 1,
        protectionLevel: 'protected',
        content: { text: 'Registro de Ponto e Controle de Jornada (Portaria 671)' },
        styles: { fontSize: '20px', fontWeight: '700', textColor: '#0f172a' },
        responsive: {},
        visibilityRules: { hidden: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'page-site-vagas',
    name: 'Portal Público de Vagas',
    slug: 'site-vagas',
    route: '/site-vagas',
    pageType: 'portal',
    isSystemPage: true,
    scope: 'global',
    status: 'published',
    version: 1,
    layoutType: 'flex',
    requiredPermissions: [],
    updatedAt: new Date().toISOString(),
    updatedBy: 'MASTER Admin',
    components: [
      {
        id: 'comp-portal-banner',
        pageId: 'page-site-vagas',
        componentType: 'banner',
        componentKey: 'hero_portal_vagas',
        name: 'Hero Banner Portal Vagas',
        order: 1,
        protectionLevel: 'editable',
        content: {
          text: 'Trabalhe Conosco — Transforme sua Carreira no RH TRANSFORMA',
          helpText: 'Confira nossas oportunidades em aberto e cadastre seu currículo diretamente.'
        },
        styles: {
          backgroundColor: '#1e1b4b',
          textColor: '#ffffff',
          paddingTop: '32px',
          paddingBottom: '32px',
          textAlign: 'center'
        },
        responsive: {},
        visibilityRules: { hidden: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'page-login',
    name: 'Tela de Login e Autenticação',
    slug: 'login',
    route: '/login',
    pageType: 'system',
    isSystemPage: true,
    scope: 'global',
    status: 'published',
    version: 1,
    layoutType: 'flex',
    requiredPermissions: [],
    updatedAt: new Date().toISOString(),
    updatedBy: 'MASTER Admin',
    components: [
      {
        id: 'comp-login-title',
        pageId: 'page-login',
        componentType: 'title',
        componentKey: 'title_login',
        name: 'Título de Boas-Vindas Login',
        order: 1,
        protectionLevel: 'editable',
        content: { text: 'Acesse sua Conta RH TRANSFORMA' },
        styles: { fontSize: '24px', fontWeight: '800', textColor: '#ffffff' },
        responsive: {},
        visibilityRules: { hidden: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'page-entrevistas',
    name: 'Agendamento & Entrevistas IA',
    slug: 'entrevistas',
    route: '/entrevistas',
    pageType: 'system',
    isSystemPage: true,
    scope: 'global',
    status: 'published',
    version: 1,
    layoutType: 'dashboard',
    requiredPermissions: ['interviews.view'],
    updatedAt: new Date().toISOString(),
    updatedBy: 'MASTER Admin',
    components: [
      {
        id: 'comp-ent-title',
        pageId: 'page-entrevistas',
        componentType: 'title',
        componentKey: 'title_entrevistas',
        name: 'Título Gestão de Entrevistas',
        order: 1,
        protectionLevel: 'protected',
        content: { text: 'Gestão de Entrevistas & Pareceres com IA' },
        styles: { fontSize: '22px', fontWeight: '800', textColor: '#0f172a' },
        responsive: {},
        visibilityRules: { hidden: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'page-headhunter',
    name: 'Consultoria & Headhunter',
    slug: 'headhunter',
    route: '/headhunter',
    pageType: 'system',
    isSystemPage: true,
    scope: 'global',
    status: 'published',
    version: 1,
    layoutType: 'dashboard',
    requiredPermissions: ['headhunter.view'],
    updatedAt: new Date().toISOString(),
    updatedBy: 'MASTER Admin',
    components: [
      {
        id: 'comp-head-title',
        pageId: 'page-headhunter',
        componentType: 'title',
        componentKey: 'title_headhunter',
        name: 'Título Módulo Headhunter',
        order: 1,
        protectionLevel: 'protected',
        content: { text: 'Painel do Consultor Headhunter' },
        styles: { fontSize: '22px', fontWeight: '800', textColor: '#0f172a' },
        responsive: {},
        visibilityRules: { hidden: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'page-clientes',
    name: 'Gestão de Empresas Clientes',
    slug: 'clientes',
    route: '/clientes',
    pageType: 'system',
    isSystemPage: true,
    scope: 'global',
    status: 'published',
    version: 1,
    layoutType: 'table_view',
    requiredPermissions: ['clients.view'],
    updatedAt: new Date().toISOString(),
    updatedBy: 'MASTER Admin',
    components: [
      {
        id: 'comp-cli-title',
        pageId: 'page-clientes',
        componentType: 'title',
        componentKey: 'title_clientes',
        name: 'Título Empresas Clientes',
        order: 1,
        protectionLevel: 'protected',
        content: { text: 'Empresas Parceiras & Contratos' },
        styles: { fontSize: '22px', fontWeight: '800', textColor: '#0f172a' },
        responsive: {},
        visibilityRules: { hidden: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'page-colaboradores',
    name: 'Departamento Pessoal & Colaboradores',
    slug: 'departamento-pessoal',
    route: '/departamento-pessoal',
    pageType: 'system',
    isSystemPage: true,
    scope: 'global',
    status: 'published',
    version: 1,
    layoutType: 'table_view',
    requiredPermissions: ['employees.view'],
    updatedAt: new Date().toISOString(),
    updatedBy: 'MASTER Admin',
    components: [
      {
        id: 'comp-dp-title',
        pageId: 'page-colaboradores',
        componentType: 'title',
        componentKey: 'title_dp',
        name: 'Título Departamento Pessoal',
        order: 1,
        protectionLevel: 'protected',
        content: { text: 'Gestão de Colaboradores & Admissão' },
        styles: { fontSize: '22px', fontWeight: '800', textColor: '#0f172a' },
        responsive: {},
        visibilityRules: { hidden: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'page-folha',
    name: 'Folha de Pagamento',
    slug: 'folha-pagamento',
    route: '/folha-pagamento',
    pageType: 'system',
    isSystemPage: true,
    scope: 'global',
    status: 'published',
    version: 1,
    layoutType: 'dashboard',
    requiredPermissions: ['payroll.view'],
    updatedAt: new Date().toISOString(),
    updatedBy: 'MASTER Admin',
    components: [
      {
        id: 'comp-folha-title',
        pageId: 'page-folha',
        componentType: 'title',
        componentKey: 'title_folha',
        name: 'Título Folha de Pagamento',
        order: 1,
        protectionLevel: 'protected',
        content: { text: 'Processamento de Folha & Encargos' },
        styles: { fontSize: '22px', fontWeight: '800', textColor: '#0f172a' },
        responsive: {},
        visibilityRules: { hidden: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'page-beneficios',
    name: 'Gestão de Benefícios',
    slug: 'beneficios',
    route: '/beneficios',
    pageType: 'system',
    isSystemPage: true,
    scope: 'global',
    status: 'published',
    version: 1,
    layoutType: 'grid',
    requiredPermissions: ['benefits.view'],
    updatedAt: new Date().toISOString(),
    updatedBy: 'MASTER Admin',
    components: [
      {
        id: 'comp-ben-title',
        pageId: 'page-beneficios',
        componentType: 'title',
        componentKey: 'title_beneficios',
        name: 'Título Benefícios',
        order: 1,
        protectionLevel: 'protected',
        content: { text: 'Plano de Benefícios & Vales' },
        styles: { fontSize: '22px', fontWeight: '800', textColor: '#0f172a' },
        responsive: {},
        visibilityRules: { hidden: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'page-ferias',
    name: 'Gestão de Férias & Afastamentos',
    slug: 'ferias',
    route: '/ferias',
    pageType: 'system',
    isSystemPage: true,
    scope: 'global',
    status: 'published',
    version: 1,
    layoutType: 'table_view',
    requiredPermissions: ['leaves.view'],
    updatedAt: new Date().toISOString(),
    updatedBy: 'MASTER Admin',
    components: [
      {
        id: 'comp-ferias-title',
        pageId: 'page-ferias',
        componentType: 'title',
        componentKey: 'title_ferias',
        name: 'Título Controle de Férias',
        order: 1,
        protectionLevel: 'protected',
        content: { text: 'Programação e Controle de Férias' },
        styles: { fontSize: '22px', fontWeight: '800', textColor: '#0f172a' },
        responsive: {},
        visibilityRules: { hidden: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'page-documentos',
    name: 'Documentos & Assinatura Digital',
    slug: 'documentos',
    route: '/documentos',
    pageType: 'system',
    isSystemPage: true,
    scope: 'global',
    status: 'published',
    version: 1,
    layoutType: 'grid',
    requiredPermissions: ['documents.view'],
    updatedAt: new Date().toISOString(),
    updatedBy: 'MASTER Admin',
    components: [
      {
        id: 'comp-doc-title',
        pageId: 'page-documentos',
        componentType: 'title',
        componentKey: 'title_documentos',
        name: 'Título Documentos',
        order: 1,
        protectionLevel: 'protected',
        content: { text: 'Ged & Assinatura Eletrônica' },
        styles: { fontSize: '22px', fontWeight: '800', textColor: '#0f172a' },
        responsive: {},
        visibilityRules: { hidden: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'page-relatorios',
    name: 'Relatórios & Business Intelligence',
    slug: 'relatorios',
    route: '/relatorios',
    pageType: 'system',
    isSystemPage: true,
    scope: 'global',
    status: 'published',
    version: 1,
    layoutType: 'dashboard',
    requiredPermissions: ['reports.view'],
    updatedAt: new Date().toISOString(),
    updatedBy: 'MASTER Admin',
    components: [
      {
        id: 'comp-rel-title',
        pageId: 'page-relatorios',
        componentType: 'title',
        componentKey: 'title_relatorios',
        name: 'Título Relatórios',
        order: 1,
        protectionLevel: 'protected',
        content: { text: 'Relatórios Gerenciais e Analytics de RH' },
        styles: { fontSize: '22px', fontWeight: '800', textColor: '#0f172a' },
        responsive: {},
        visibilityRules: { hidden: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'page-configuracoes',
    name: 'Configurações do Sistema',
    slug: 'configuracoes',
    route: '/configuracoes',
    pageType: 'system',
    isSystemPage: true,
    scope: 'global',
    status: 'published',
    version: 1,
    layoutType: 'flex',
    requiredPermissions: ['settings.manage'],
    updatedAt: new Date().toISOString(),
    updatedBy: 'MASTER Admin',
    components: [
      {
        id: 'comp-cfg-title',
        pageId: 'page-configuracoes',
        componentType: 'title',
        componentKey: 'title_configuracoes',
        name: 'Título Configurações',
        order: 1,
        protectionLevel: 'protected',
        content: { text: 'Configurações Gerais da Organização' },
        styles: { fontSize: '22px', fontWeight: '800', textColor: '#0f172a' },
        responsive: {},
        visibilityRules: { hidden: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'page-mais-ia',
    name: 'Assistente IA RH TRANSFORMA',
    slug: 'mais-rh-ia',
    route: '/mais-rh-ia',
    pageType: 'system',
    isSystemPage: true,
    scope: 'global',
    status: 'published',
    version: 1,
    layoutType: 'flex',
    requiredPermissions: [],
    updatedAt: new Date().toISOString(),
    updatedBy: 'MASTER Admin',
    components: [
      {
        id: 'comp-ia-title',
        pageId: 'page-mais-ia',
        componentType: 'title',
        componentKey: 'title_mais_ia',
        name: 'Título IA RH TRANSFORMA',
        order: 1,
        protectionLevel: 'protected',
        content: { text: 'Assistente Inteligente Copiloto de RH' },
        styles: { fontSize: '22px', fontWeight: '800', textColor: '#0f172a' },
        responsive: {},
        visibilityRules: { hidden: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  }
];

// Initial Seed Navigation Menus
export const INITIAL_NAVIGATION_MENUS: NavigationMenuItem[] = [
  { id: 'm-dash', label: 'Dashboard Operacional', icon: 'LayoutGrid', route: 'dashboard', order: 1, roles: ['TODOS'], hidden: false },
  { id: 'm-mais-ia', label: 'RH TRANSFORMA IA', icon: 'Sparkles', route: 'mais-rh-ia', order: 2, roles: ['TODOS'], hidden: false },
  { id: 'm-vagas', label: 'Gestão de Vagas', icon: 'Briefcase', route: 'vagas', order: 3, roles: ['TODOS'], hidden: false },
  { id: 'm-candidatos', label: 'Banco de Talentos', icon: 'Users', route: 'banco-talentos', order: 4, roles: ['TODOS'], hidden: false },
  { id: 'm-entrevistas', label: 'Entrevistas & IA', icon: 'Calendar', route: 'entrevistas', order: 6, roles: ['TODOS'], hidden: false },
  { id: 'm-dp', label: 'Departamento Pessoal', icon: 'Building', route: 'departamento-pessoal', order: 7, roles: ['Administrador', 'RH', 'Gestor'], hidden: false },
  { id: 'm-ponto', label: 'Ponto Eletrônico', icon: 'Clock', route: 'ponto-digital', order: 8, roles: ['TODOS'], hidden: false },
  { id: 'm-folha', label: 'Folha de Pagamento', icon: 'DollarSign', route: 'folha-pagamento', order: 9, roles: ['Administrador', 'RH'], hidden: false },
  { id: 'm-portal-pub', label: 'Portal de Vagas', icon: 'Globe', route: 'site-vagas', order: 10, roles: ['TODOS'], hidden: false },
  { id: 'm-headhunter', label: 'Headhunter / Consultoria', icon: 'Award', route: 'headhunter', order: 11, roles: ['Consultor RH', 'Super Administrador'], hidden: false },
  { id: 'm-master', label: 'Acesso MASTER', icon: 'Crown', route: 'acesso-master', order: 99, roles: ['Super Administrador'], hidden: false, isCritical: true }
];

// Initial Seed Custom Fields
export const INITIAL_CUSTOM_FIELDS: CustomFieldDefinition[] = [
  {
    id: 'cf-uniforme',
    entityType: 'colaborador',
    name: 'tamanho_uniforme',
    label: 'Tamanho do Uniforme (Camiseta/Calçado)',
    fieldType: 'select',
    required: false,
    options: ['P', 'M', 'G', 'GG', 'XGG', 'Outro'],
    order: 1,
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'cf-centro-custo',
    entityType: 'vaga',
    name: 'centro_custo_especifico',
    label: 'Centro de Custo / Código do Projeto',
    fieldType: 'text',
    required: true,
    placeholder: 'Ex: CC-2026-SP',
    order: 2,
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'cf-pretensao',
    entityType: 'candidato',
    name: 'pretensao_salarial_detalhada',
    label: 'Pretensão Salarial Mensal (R$)',
    fieldType: 'currency',
    required: true,
    order: 3,
    active: true,
    createdAt: new Date().toISOString()
  }
];

// Initial Seed Templates
export const INITIAL_CLIENT_TEMPLATES: ClientTemplate[] = [
  {
    id: 'tpl-ats-essencial',
    name: 'ATS Essencial & R&S Ágil',
    description: 'Foco exclusivo na atração de talentos, triagem por IA e publicação em portal de vagas.',
    category: 'Recrutamento',
    defaultTheme: {
      primaryColor: '#2563eb',
      secondaryColor: '#3b82f6',
      accentColor: '#10b981',
      fontFamily: 'Plus Jakarta Sans'
    },
    menus: INITIAL_NAVIGATION_MENUS.filter(m => ['dashboard', 'vagas', 'banco-talentos', 'entrevistas', 'site-vagas'].includes(m.route)),
    customFields: INITIAL_CUSTOM_FIELDS,
    pages: INITIAL_SYSTEM_PAGES,
    active: true
  },
  {
    id: 'tpl-rh-completo',
    name: 'RH Corporativo 360° + DP',
    description: 'Pacote completo incluindo Folha, Ponto Eletrônico 671, Férias, eSocial e SST.',
    category: 'Completo',
    defaultTheme: {
      primaryColor: '#0f172a',
      secondaryColor: '#334155',
      accentColor: '#f59e0b',
      fontFamily: 'Plus Jakarta Sans'
    },
    menus: INITIAL_NAVIGATION_MENUS,
    customFields: INITIAL_CUSTOM_FIELDS,
    pages: INITIAL_SYSTEM_PAGES,
    active: true
  }
];

// Memory Stores with LocalStorage syncing
class VisualBuilderStore {
  private pages: PageConfig[] = [];
  private versions: PageVersion[] = [];
  private auditLogs: BuilderAuditLog[] = [];
  private customFields: CustomFieldDefinition[] = [];
  private menus: NavigationMenuItem[] = [];
  private templates: ClientTemplate[] = [];
  private themes: Record<string, CompanyThemeConfig> = {};

  // Undo/Redo Stacks per Page
  private undoStack: Map<string, PageConfig[]> = new Map();
  private redoStack: Map<string, PageConfig[]> = new Map();

  constructor() {
    this.pages = INITIAL_SYSTEM_PAGES;
    this.versions = [];
    this.auditLogs = [];
    this.customFields = INITIAL_CUSTOM_FIELDS;
    this.menus = INITIAL_NAVIGATION_MENUS;
    this.templates = INITIAL_CLIENT_TEMPLATES;
    // A hidratação remota ocorre apenas quando o painel MASTER é aberto.
    // O portal público usa os padrões locais de interface e não consulta dados protegidos.
  }

  private async readBucket<T>(collectionName: string, fallback: T): Promise<T> {
    try {
      const snap = await getDoc(doc(db, collectionName, 'global'));
      if (!snap.exists()) return fallback;
      const data = snap.data() as { items?: T };
      return data.items ?? fallback;
    } catch (error) {
      console.warn(`[VisualBuilder] Falha ao carregar ${collectionName} do Firestore.`, error);
      return fallback;
    }
  }

  private persistBucket(collectionName: string, items: unknown): void {
    void setDoc(doc(db, collectionName, 'global'), cleanForFirestore({
      id: 'global',
      companyId: 'GLOBAL',
      items,
      updatedAt: new Date().toISOString()
    }), { merge: true }).catch(error => {
      console.error(`[VisualBuilder] Falha ao persistir ${collectionName} no Firestore.`, error);
    });
  }

  public async hydrateFromFirestore(): Promise<void> {
    const [pages, versions, logs, fields, menus, templates, themes] = await Promise.all([
      this.readBucket<PageConfig[]>(BUILDER_COLLECTIONS.PAGES, INITIAL_SYSTEM_PAGES),
      this.readBucket<PageVersion[]>(BUILDER_COLLECTIONS.VERSIONS, []),
      this.readBucket<BuilderAuditLog[]>(BUILDER_COLLECTIONS.AUDIT_LOGS, []),
      this.readBucket<CustomFieldDefinition[]>(BUILDER_COLLECTIONS.CUSTOM_FIELDS, INITIAL_CUSTOM_FIELDS),
      this.readBucket<NavigationMenuItem[]>(BUILDER_COLLECTIONS.MENUS, INITIAL_NAVIGATION_MENUS),
      this.readBucket<ClientTemplate[]>(BUILDER_COLLECTIONS.TEMPLATES, INITIAL_CLIENT_TEMPLATES),
      this.readBucket<Record<string, CompanyThemeConfig>>(BUILDER_COLLECTIONS.THEMES, {})
    ]);
    this.pages = pages;
    this.versions = versions;
    this.auditLogs = logs;
    this.customFields = fields;
    this.menus = menus;
    this.templates = templates;
    this.themes = themes;
  }

  private savePages() { this.persistBucket(BUILDER_COLLECTIONS.PAGES, this.pages); }
  private saveVersions() { this.persistBucket(BUILDER_COLLECTIONS.VERSIONS, this.versions); }
  private saveLogs() { this.persistBucket(BUILDER_COLLECTIONS.AUDIT_LOGS, this.auditLogs); }
  private saveCustomFieldsStorage() { this.persistBucket(BUILDER_COLLECTIONS.CUSTOM_FIELDS, this.customFields); }
  private saveMenusStorage() { this.persistBucket(BUILDER_COLLECTIONS.MENUS, this.menus); }

  // --- PAGES & COMPONENTS ---
  public getPages(): PageConfig[] {
    return this.pages;
  }

  public getPageById(id: string): PageConfig | undefined {
    return this.pages.find(p => p.id === id);
  }

  public getEffectivePageConfig(pageId: string, companyId?: string): PageConfig {
    const page = this.getPageById(pageId);
    if (!page) {
      return INITIAL_SYSTEM_PAGES[0];
    }

    if (!companyId || companyId === 'GLOBAL') {
      return page;
    }

    // Check if there is a company-specific version override
    const companyOverride = this.pages.find(p => p.id === `${pageId}_${companyId}` && p.companyId === companyId);
    if (companyOverride) {
      return companyOverride;
    }

    return page;
  }

  public updatePageConfig(pageConfig: PageConfig, authorName: string = 'MASTER Admin'): PageConfig {
    const existing = this.getPageById(pageConfig.id);
    if (existing) {
      // Push state to undo stack
      const stack = this.undoStack.get(pageConfig.id) || [];
      stack.push(JSON.parse(JSON.stringify(existing)));
      if (stack.length > 20) stack.shift(); // Limit to 20 history states
      this.undoStack.set(pageConfig.id, stack);
      this.redoStack.set(pageConfig.id, []);
    }

    const updated: PageConfig = {
      ...pageConfig,
      updatedAt: new Date().toISOString(),
      updatedBy: authorName,
      status: 'draft'
    };

    const idx = this.pages.findIndex(p => p.id === updated.id);
    if (idx >= 0) {
      this.pages[idx] = updated;
    } else {
      this.pages.push(updated);
    }

    this.savePages();
    return updated;
  }

  public canUndo(pageId: string): boolean {
    const stack = this.undoStack.get(pageId);
    return !!stack && stack.length > 0;
  }

  public canRedo(pageId: string): boolean {
    const stack = this.redoStack.get(pageId);
    return !!stack && stack.length > 0;
  }

  public undo(pageId: string): PageConfig | null {
    const stack = this.undoStack.get(pageId);
    if (!stack || stack.length === 0) return null;

    const current = this.getPageById(pageId);
    if (current) {
      const redos = this.redoStack.get(pageId) || [];
      redos.push(JSON.parse(JSON.stringify(current)));
      this.redoStack.set(pageId, redos);
    }

    const previousState = stack.pop()!;
    const idx = this.pages.findIndex(p => p.id === pageId);
    if (idx >= 0) {
      this.pages[idx] = previousState;
      this.savePages();
    }
    return previousState;
  }

  public redo(pageId: string): PageConfig | null {
    const redos = this.redoStack.get(pageId);
    if (!redos || redos.length === 0) return null;

    const current = this.getPageById(pageId);
    if (current) {
      const undos = this.undoStack.get(pageId) || [];
      undos.push(JSON.parse(JSON.stringify(current)));
      this.undoStack.set(pageId, undos);
    }

    const nextState = redos.pop()!;
    const idx = this.pages.findIndex(p => p.id === pageId);
    if (idx >= 0) {
      this.pages[idx] = nextState;
      this.savePages();
    }
    return nextState;
  }

  // --- PUBLICATION & VERSIONING ---
  public publishDraft(
    pageId: string, 
    changeSummary: string, 
    authorName: string, 
    scope: BuilderScope = 'global', 
    companyId?: string
  ): { page: PageConfig; version: PageVersion } {
    const page = this.getPageById(pageId);
    if (!page) {
      throw new Error(`Página ${pageId} não encontrada para publicação.`);
    }

    const nextVersionNum = (page.version || 1) + 1;
    const now = new Date().toISOString();

    const publishedPage: PageConfig = {
      ...page,
      version: nextVersionNum,
      status: 'published',
      updatedAt: now,
      updatedBy: authorName,
      scope,
      companyId
    };

    const newVersion: PageVersion = {
      versionId: `ver-${Date.now()}`,
      pageId: page.id,
      versionNumber: nextVersionNum,
      scope,
      companyId,
      configuration: JSON.parse(JSON.stringify(publishedPage)),
      changeSummary: changeSummary || 'Publicação de alterações no Construtor Visual',
      publishedAt: now,
      publishedBy: authorName,
      status: 'published'
    };

    // Mark previous versions as superseded
    this.versions = this.versions.map(v => v.pageId === pageId ? { ...v, status: 'superseded' as const } : v);
    this.versions.unshift(newVersion);

    // Update active page
    const idx = this.pages.findIndex(p => p.id === pageId);
    if (idx >= 0) {
      this.pages[idx] = publishedPage;
    }

    this.savePages();
    this.saveVersions();

    // Audit Log
    this.addAuditLog({
      scope,
      companyId,
      userId: 'master-user',
      userName: authorName,
      action: 'PUBLICAR_PAGINA',
      pageId,
      description: `Publicada versão v${nextVersionNum} da página ${page.name}. Resumo: ${changeSummary}`
    });

    return { page: publishedPage, version: newVersion };
  }

  public rollbackToVersion(versionId: string, authorName: string): PageConfig {
    const version = this.versions.find(v => v.versionId === versionId);
    if (!version) {
      throw new Error(`Versão ${versionId} não encontrada para restauração.`);
    }

    const pageId = version.pageId;
    const restoredPageConfig: PageConfig = {
      ...version.configuration,
      version: (version.configuration.version || 1) + 1,
      status: 'published',
      updatedAt: new Date().toISOString(),
      updatedBy: authorName
    };

    const idx = this.pages.findIndex(p => p.id === pageId);
    if (idx >= 0) {
      this.pages[idx] = restoredPageConfig;
    } else {
      this.pages.push(restoredPageConfig);
    }

    const newRestoreVersion: PageVersion = {
      versionId: `ver-restored-${Date.now()}`,
      pageId,
      versionNumber: restoredPageConfig.version,
      scope: version.scope,
      companyId: version.companyId,
      configuration: restoredPageConfig,
      changeSummary: `Restauração para versão v${version.versionNumber} (${version.changeSummary})`,
      publishedAt: new Date().toISOString(),
      publishedBy: authorName,
      status: 'published'
    };

    this.versions.unshift(newRestoreVersion);

    this.savePages();
    this.saveVersions();

    this.addAuditLog({
      scope: version.scope,
      companyId: version.companyId,
      userId: 'master-user',
      userName: authorName,
      action: 'RESTAURAR_VERSAO',
      pageId,
      description: `Restaurada versão v${version.versionNumber} para a página ${restoredPageConfig.name}`
    });

    return restoredPageConfig;
  }

  public getVersionsForPage(pageId: string): PageVersion[] {
    return this.versions.filter(v => v.pageId === pageId);
  }

  // --- CUSTOM FIELDS ---
  public getCustomFields(): CustomFieldDefinition[] {
    return this.customFields;
  }

  public saveCustomField(field: CustomFieldDefinition, authorName: string = 'MASTER Admin'): CustomFieldDefinition[] {
    const existingIdx = this.customFields.findIndex(f => f.id === field.id);
    if (existingIdx >= 0) {
      this.customFields[existingIdx] = field;
    } else {
      this.customFields.push(field);
    }
    this.saveCustomFieldsStorage();

    this.addAuditLog({
      scope: field.companyId ? 'company' : 'global',
      companyId: field.companyId,
      userId: 'master-user',
      userName: authorName,
      action: 'SALVAR_CAMPO_PERSONALIZADO',
      description: `Campo personalizado ${field.label} (${field.entityType}) foi salvo.`
    });

    return this.customFields;
  }

  public deleteCustomField(id: string): CustomFieldDefinition[] {
    this.customFields = this.customFields.filter(f => f.id !== id);
    this.saveCustomFieldsStorage();
    return this.customFields;
  }

  // --- MENUS ---
  public getNavigationMenus(): NavigationMenuItem[] {
    return this.menus;
  }

  public saveNavigationMenus(menus: NavigationMenuItem[], authorName: string = 'MASTER Admin'): NavigationMenuItem[] {
    // Safety check: ensure critical menus exist
    const hasMasterMenu = menus.some(m => m.route === 'acesso-master' || m.isCritical);
    if (!hasMasterMenu) {
      throw new Error('Não é permitido remover ou ocultar o Menu Crítico MASTER.');
    }

    this.menus = menus;
    this.saveMenusStorage();

    this.addAuditLog({
      scope: 'global',
      userId: 'master-user',
      userName: authorName,
      action: 'ATUALIZAR_MENUS',
      description: 'Reorganização da estrutura global de navegação e menus.'
    });

    return this.menus;
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): BuilderAuditLog[] {
    return this.auditLogs;
  }

  public addAuditLog(logData: Omit<BuilderAuditLog, 'id' | 'createdAt'>): BuilderAuditLog {
    const newLog: BuilderAuditLog = {
      ...logData,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };
    this.auditLogs.unshift(newLog);
    if (this.auditLogs.length > 500) this.auditLogs.pop(); // Limit 500 entries
    this.saveLogs();
    return newLog;
  }

  // --- TEMPLATES ---
  public getTemplates(): ClientTemplate[] {
    return this.templates;
  }

  public applyTemplateToCompany(templateId: string, companyId: string, companyName: string, authorName: string) {
    const tpl = this.templates.find(t => t.id === templateId);
    if (!tpl) throw new Error('Modelo não encontrado.');

    this.addAuditLog({
      scope: 'company',
      companyId,
      userId: 'master-user',
      userName: authorName,
      action: 'APLICAR_MODELO',
      description: `Modelo "${tpl.name}" aplicado à empresa ${companyName}.`
    });

    return true;
  }

  // --- SANITIZATION & SECURITY ---
  public sanitizeText(input: string): string {
    if (!input) return '';
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:[^\s'"]*/gi, '');
  }

  // --- THEMES & BRANDING ---
  public getCompanyTheme(companyId: string = 'GLOBAL'): CompanyThemeConfig {
    if (this.themes[companyId]) return this.themes[companyId];

    return {
      companyId: companyId || 'GLOBAL',
      companyName: 'RH TRANSFORMA - Gestão de RH',
      slogan: 'Plataforma Integrada de Inteligência e Departamento Pessoal',
      logoUrl: '/logo.png',
      primaryColor: '#2563eb',
      secondaryColor: '#1e293b',
      backgroundColor: '#0f172a',
      surfaceColor: '#1e293b',
      textColor: '#f8fafc',
      borderRadius: '12px',
      fontFamily: 'Plus Jakarta Sans',
      headingFontFamily: 'Plus Jakarta Sans',
      baseFontSize: '14px',
      sidebarWidth: '260px',
      headerHeight: '64px',
      updatedAt: new Date().toISOString(),
      updatedBy: 'MASTER Admin'
    };
  }

  public saveCompanyTheme(config: CompanyThemeConfig, authorName: string = 'MASTER Admin'): CompanyThemeConfig {
    const updated: CompanyThemeConfig = {
      ...config,
      companyName: this.sanitizeText(config.companyName || ''),
      slogan: this.sanitizeText(config.slogan || ''),
      updatedAt: new Date().toISOString(),
      updatedBy: authorName
    };

    this.themes[config.companyId || 'GLOBAL'] = updated;
    this.persistBucket(BUILDER_COLLECTIONS.THEMES, this.themes);

    this.addAuditLog({
      scope: config.companyId && config.companyId !== 'GLOBAL' ? 'company' : 'global',
      companyId: config.companyId,
      userId: 'master-user',
      userName: authorName,
      action: 'SALVAR_TEMA_VISUAL',
      description: `Tema e identidade visual atualizados para o escopo ${config.companyId || 'GLOBAL'}.`
    });

    return updated;
  }

  // --- EXPORT & IMPORT THEME ---
  public exportThemePackage(companyId: string = 'GLOBAL'): ThemeExportImportFormat {
    const themeConfig = this.getCompanyTheme(companyId);
    const pages = this.getPages();
    const menus = this.getNavigationMenus();
    const customFields = this.getCustomFields();

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: 'MASTER Admin',
      scope: companyId === 'GLOBAL' ? 'global' : 'company',
      companyId,
      themeConfig,
      menus,
      customFields,
      pages
    };
  }

  public importThemePackage(jsonContent: string, targetCompanyId: string = 'GLOBAL', authorName: string = 'MASTER Admin') {
    let parsed: ThemeExportImportFormat;
    try {
      parsed = JSON.parse(jsonContent);
    } catch (e) {
      throw new Error('Arquivo de tema inválido. Certifique-se de carregar um JSON válido do RH TRANSFORMA.');
    }

    if (/<script|javascript:/i.test(jsonContent)) {
      throw new Error('Bloqueio de Segurança: O arquivo importado contém código executável perigoso.');
    }

    if (parsed.themeConfig) {
      this.saveCompanyTheme({ ...parsed.themeConfig, companyId: targetCompanyId }, authorName);
    }

    if (parsed.menus && Array.isArray(parsed.menus)) {
      this.saveNavigationMenus(parsed.menus, authorName);
    }

    if (parsed.customFields && Array.isArray(parsed.customFields)) {
      parsed.customFields.forEach(f => this.saveCustomField({ ...f, companyId: targetCompanyId }, authorName));
    }

    this.addAuditLog({
      scope: targetCompanyId === 'GLOBAL' ? 'global' : 'company',
      companyId: targetCompanyId,
      userId: 'master-user',
      userName: authorName,
      action: 'IMPORTAR_PACOTE_TEMA',
      description: `Pacote visual e de configurações importado com sucesso para o escopo ${targetCompanyId}.`
    });

    return true;
  }

  // --- AI DESIGN ASSISTANT ---
  public generateAiDesignProposal(userPrompt: string, currentPageId: string): AiDesignProposal {
    const cleanPrompt = this.sanitizeText(userPrompt);
    const promptLower = cleanPrompt.toLowerCase();

    let summary = 'Proposta de design gerada pela IA com base nas suas instruções:';
    let themeChanges: Partial<CompanyThemeConfig> = {};
    let textChanges: { pageId: string; componentId: string; oldText: string; newText: string }[] = [];
    let menuChanges: { menuId: string; oldLabel: string; newLabel: string }[] = [];

    if (promptLower.includes('azul') || promptLower.includes('blue')) {
      themeChanges.primaryColor = '#2563eb';
      themeChanges.secondaryColor = '#1d4ed8';
      summary += ' • Aplicada paleta de cores azul corporativo.';
    } else if (promptLower.includes('verde') || promptLower.includes('green')) {
      themeChanges.primaryColor = '#059669';
      themeChanges.secondaryColor = '#047857';
      summary += ' • Aplicada paleta de cores verde moderna.';
    } else if (promptLower.includes('limp') || promptLower.includes('clean') || promptLower.includes('escuro')) {
      themeChanges.backgroundColor = '#0f172a';
      themeChanges.surfaceColor = '#1e293b';
      summary += ' • Layout ajustado para tema limpo de alto contraste.';
    }

    if (promptLower.includes('vagas') || promptLower.includes('recrutamento')) {
      const page = this.getPageById('page-vagas') || this.getPageById(currentPageId);
      if (page && page.components[0]) {
        textChanges.push({
          pageId: page.id,
          componentId: page.components[0].id,
          oldText: page.components[0].content.text || '',
          newText: 'Painel Central de Recrutamento & Seleção'
        });
      }

      const menuVagas = this.menus.find(m => m.route === 'vagas');
      if (menuVagas) {
        menuChanges.push({
          menuId: menuVagas.id,
          oldLabel: menuVagas.label,
          newLabel: 'Recrutamento & Seleção'
        });
      }

      summary += ' • Renomeado "Gestão de Vagas" para "Recrutamento & Seleção".';
    }

    return {
      proposalId: `prop-${Date.now()}`,
      userPrompt: cleanPrompt,
      suggestedChangesSummary: summary,
      affectedPageIds: [currentPageId],
      themeChanges,
      textChanges,
      menuChanges,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
  }

  public applyAiProposal(proposal: AiDesignProposal, authorName: string = 'MASTER Admin') {
    if (proposal.themeChanges && Object.keys(proposal.themeChanges).length > 0) {
      const currentTheme = this.getCompanyTheme('GLOBAL');
      this.saveCompanyTheme({ ...currentTheme, ...proposal.themeChanges }, authorName);
    }

    if (proposal.textChanges && proposal.textChanges.length > 0) {
      proposal.textChanges.forEach(tc => {
        const page = this.getPageById(tc.pageId);
        if (page) {
          const updatedComponents = page.components.map(c => {
            if (c.id === tc.componentId) {
              return { ...c, content: { ...c.content, text: tc.newText } };
            }
            return c;
          });
          this.updatePageConfig({ ...page, components: updatedComponents }, authorName);
        }
      });
    }

    if (proposal.menuChanges && proposal.menuChanges.length > 0) {
      const updatedMenus = this.menus.map(m => {
        const match = proposal.menuChanges?.find(mc => mc.menuId === m.id);
        if (match) {
          return { ...m, label: match.newLabel };
        }
        return m;
      });
      this.saveNavigationMenus(updatedMenus, authorName);
    }

    this.addAuditLog({
      scope: 'global',
      userId: 'master-user',
      userName: authorName,
      action: 'ACEITAR_PROPOSTA_IA',
      description: `Proposta de design por IA aceita e aplicada como rascunho: "${proposal.userPrompt}"`
    });

    return true;
  }
}


export const visualBuilderStore = new VisualBuilderStore();
