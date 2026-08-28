import { ClientTenant, SystemAnnouncement, BackupRecord, SaaSPlan, PlatformModule, PlatformVisualConfig, AIPromptTemplate, AIUsageLog, PartnerBenefit, PlatformAdminUser, AuditSecurityLog } from '../types/master';

export const MOCK_TENANTS: ClientTenant[] = [];

export const MOCK_ANNOUNCEMENTS: SystemAnnouncement[] = [];

export const MOCK_BACKUPS: BackupRecord[] = [];

export const MOCK_SAAS_PLANS: SaaSPlan[] = [];

export const MOCK_PLATFORM_MODULES: PlatformModule[] = [];

export const MOCK_VISUAL_CONFIG: PlatformVisualConfig = {
  activeTheme: 'Indigo Moderno',
  primaryColor: '#4F46E5',
  secondaryColor: '#0EA5E9',
  fontFamily: 'Plus Jakarta Sans',
  globalLogoUrl: '',
  allowClientCustomLogo: true,
  enableCustomFields: true
};

export const MOCK_AI_PROMPTS: AIPromptTemplate[] = [];

export const MOCK_AI_LOGS: AIUsageLog[] = [];

export const MOCK_PARTNERS: PartnerBenefit[] = [];

export const MOCK_PLATFORM_ADMINS: PlatformAdminUser[] = [];

export const MOCK_SECURITY_LOGS: AuditSecurityLog[] = [];
