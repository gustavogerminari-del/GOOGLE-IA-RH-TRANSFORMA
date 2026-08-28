import { ClientTenant, SystemAnnouncement, BackupRecord, SaaSPlan, PlatformModule, PlatformVisualConfig, AIPromptTemplate, AIUsageLog, PartnerBenefit, PlatformAdminUser, AuditSecurityLog } from '../types/master';

export const DEFAULT_TENANTS: ClientTenant[] = [];

export const DEFAULT_ANNOUNCEMENTS: SystemAnnouncement[] = [];

export const DEFAULT_BACKUPS: BackupRecord[] = [];

export const DEFAULT_SAAS_PLANS: SaaSPlan[] = [];

export const DEFAULT_PLATFORM_MODULES: PlatformModule[] = [];

export const DEFAULT_VISUAL_CONFIG: PlatformVisualConfig = {
  activeTheme: 'Indigo Moderno',
  primaryColor: '#4F46E5',
  secondaryColor: '#0EA5E9',
  fontFamily: 'Plus Jakarta Sans',
  globalLogoUrl: '',
  allowClientCustomLogo: true,
  enableCustomFields: true
};

export const DEFAULT_AI_PROMPTS: AIPromptTemplate[] = [];

export const DEFAULT_AI_LOGS: AIUsageLog[] = [];

export const DEFAULT_PARTNERS: PartnerBenefit[] = [];

export const DEFAULT_PLATFORM_ADMINS: PlatformAdminUser[] = [];

export const DEFAULT_SECURITY_LOGS: AuditSecurityLog[] = [];
