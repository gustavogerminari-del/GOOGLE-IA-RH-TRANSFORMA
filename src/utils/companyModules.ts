import { fetchCompanyReleasedModules } from '../services/ModuleCatalogService';
import { resolveExplicitProcessOrigin } from '../recruitment-core/utils/processOrigin';

export interface CompanyModuleCapabilities {
  hasHeadhunter: boolean;
  hasDP: boolean;
}

/**
 * Normalizes company modules dictionary from any raw structure.
 */
export function normalizeCompanyModules(modulesObj: any): CompanyModuleCapabilities {
  if (!modulesObj || typeof modulesObj !== 'object') {
    return { hasHeadhunter: false, hasDP: false };
  }

  // Regra comercial canônica: somente os módulos-pai definem o fluxo.
  // Recursos filhos/legados não podem conceder acesso cruzado entre DP e Headhunter.
  const hasHeadhunter = modulesObj.headhunter === true || modulesObj.headhunterModule === true;
  const hasDP = modulesObj.departamentoPessoal === true || modulesObj.dp === true;

  return { hasHeadhunter, hasDP };
}

/**
 * Normalizes origin field saved on a job document.
 */
export function normalizeJobOrigin(job: any): 'HEADHUNTER' | 'RH_INTERNO' | null {
  return resolveExplicitProcessOrigin(job);
}

/**
 * Resolves job origin considering company module capabilities and legacy job handling.
 */
export function resolveJobOriginWithCompany(
  job: any,
  capabilities: CompanyModuleCapabilities
): 'HEADHUNTER' | 'RH_INTERNO' | 'REQUIRES_CHOICE' {
  // If company has ONLY Headhunter and NO DP, force HEADHUNTER
  if (capabilities.hasHeadhunter && !capabilities.hasDP) {
    return 'HEADHUNTER';
  }

  // If company has ONLY DP and NO Headhunter, force RH_INTERNO
  if (!capabilities.hasHeadhunter && capabilities.hasDP) {
    return 'RH_INTERNO';
  }

  const explicit = normalizeJobOrigin(job);
  
  if (explicit) {
    return explicit;
  }

  if (capabilities.hasHeadhunter && capabilities.hasDP) {
    return 'REQUIRES_CHOICE';
  }

  console.error('[PROCESS_ORIGIN_MISSING]', {
    context: 'resolveJobOriginWithCompany',
    id: job?.id || null,
  });
  return 'REQUIRES_CHOICE';
}

/**
 * Helper to fetch capabilities for a company directly from Firestore.
 */
export async function getCompanyCapabilitiesFromFirestore(companyId: string): Promise<CompanyModuleCapabilities> {
  if (!companyId) return { hasHeadhunter: false, hasDP: false };
  try {
    const rawModules = await fetchCompanyReleasedModules(companyId);
    if (!rawModules || Object.keys(rawModules).length === 0) {
      return { hasHeadhunter: false, hasDP: false };
    }
    return normalizeCompanyModules(rawModules);
  } catch (err) {
    console.warn('Erro ao obter módulos da empresa no Firestore:', err);
    return { hasHeadhunter: false, hasDP: false };
  }
}
