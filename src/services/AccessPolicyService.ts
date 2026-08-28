export type FunctionalModuleKey = 'recrutamento' | 'bancoTalentos' | 'departamentoPessoal';

const RECRUITMENT_RESOURCES = ['vagas', 'candidatos', 'entrevistas', 'contratacoes', 'siteVagasPersonalizado'];
const DP_RESOURCES = [
  'equipeInterna', 'admissao', 'funcionarios', 'documentosAssinatura', 'documentos',
  'pontoDigital', 'pontoEletronico', 'feriasBeneficios', 'beneficios', 'sst',
  'folha', 'folhaPagamento', 'rescisao',
];

const hasEnabled = (modules: Record<string, boolean>, keys: string[]) =>
  keys.some(key => modules[key] === true);

/**
 * Converts legacy feature flags into the three commercial modules without
 * making Banco de Talentos an implicit part of Recrutamento or DP.
 */
export function normalizeModuleEntitlements(raw: Record<string, boolean>): Record<string, boolean> {
  const modules = { ...raw };

  // Entitlements comerciais explícitos do Painel Master.
  modules.recrutamento = modules.recrutamento === true;
  modules.headhunter = modules.headhunter === true;
  modules.departamentoPessoal = modules.departamentoPessoal === true || modules.dp === true;
  modules.bancoTalentos = modules.bancoTalentos === true || modules['banco-talentos'] === true;

  // Recursos internos sem checkbox comercial próprio podem acompanhar o módulo-pai.
  if (modules.recrutamento) {
    if (modules.candidatos !== false) modules.candidatos = true;
    if (modules.contratacoes !== false) modules.contratacoes = true;
  }

  if (modules.headhunter) {
    if (modules.clientes !== false) modules.clientes = true;
    if (modules.comercial !== false) modules.comercial = true;
    if (modules.financeiroHeadhunter !== false) modules.financeiroHeadhunter = true;
  }

  if (modules.departamentoPessoal) {
    if (modules.admissao !== false) modules.admissao = true;
    if (modules.funcionarios !== false) modules.funcionarios = true;
  }

  return modules;
}

export function isTrialCompanyRecord(record: Record<string, unknown> | null | undefined): boolean {
  if (!record) return false;
  const rawTenant = record.rawTenantData && typeof record.rawTenantData === 'object'
    ? record.rawTenantData as Record<string, unknown>
    : {};
  const status = String(record.status || rawTenant.status || '').toLowerCase();
  const plan = String(record.plano || record.plan || rawTenant.plan || '').toLowerCase();
  return status.includes('trial') || status.includes('teste') || plan === 'trial';
}

export function isTalentBankEntitled(modules: Record<string, boolean>, isTrial: boolean): boolean {
  return !isTrial && normalizeModuleEntitlements(modules).bancoTalentos === true;
}

export function canUseTalentMatch(modules: Record<string, boolean>, isTrial: boolean): boolean {
  const normalized = normalizeModuleEntitlements(modules);
  return !isTrial && normalized.recrutamento === true && normalized.bancoTalentos === true;
}
