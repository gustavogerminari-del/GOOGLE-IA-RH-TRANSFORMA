import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from '../firebase/firestore';
import { auth, db } from '../lib/firebase';
import { sanitizeFirestoreData } from '../lib/firestoreUtils';

export interface PlanConfig {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  modulos: string[];
  limites?: { usuarios?: number; vagas?: number; colaboradores?: number };
  ativo?: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ModuloConfig {
  id: string;
  key: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  ativo?: boolean;
  icone?: string;
  rota?: string;
  ordem?: number;
  updatedAt?: string;
  updatedBy?: string;
}

const nowIso = () => new Date().toISOString();

// Catálogo comercial oficial do RH TRANSFORMA.
// Ele é exibido mesmo quando a coleção `modulos` ainda está vazia.
// Consultor RH não faz parte do catálogo comercial oficial.
export const OFFICIAL_MODULE_CATALOG: SystemModule[] = [
  { id: 'recrutamento', key: 'recrutamento', nome: 'Recrutamento e Seleção', descricao: 'Fluxo de recrutamento, candidatos e pipeline.', categoria: 'Recrutamento e Seleção', ativo: true, icone: 'UserSearch', rota: '/recrutamento', ordem: 10, comercializavel: true },
  { id: 'vagas', key: 'vagas', nome: 'Vagas', descricao: 'Criação, publicação e gestão de vagas.', categoria: 'Recrutamento e Seleção', ativo: true, icone: 'Briefcase', rota: '/vagas', ordem: 20, comercializavel: true },
  { id: 'bancoTalentos', key: 'bancoTalentos', nome: 'Banco de Talentos', descricao: 'Cadastro e consulta de talentos da empresa.', categoria: 'Recrutamento e Seleção', ativo: true, icone: 'Users', rota: '/banco-talentos', ordem: 30, comercializavel: true },
  { id: 'entrevistas', key: 'entrevistas', nome: 'Entrevistas', descricao: 'Agenda e gestão das entrevistas do processo seletivo.', categoria: 'Recrutamento e Seleção', ativo: true, icone: 'Calendar', rota: '/entrevistas', ordem: 40, comercializavel: true },
  { id: 'siteVagasPersonalizado', key: 'siteVagasPersonalizado', nome: 'Portal de Vagas', descricao: 'Portal público e personalizado de oportunidades.', categoria: 'Recrutamento e Seleção', ativo: true, icone: 'Globe', rota: '/portal-vagas', ordem: 50, comercializavel: true },
  { id: 'headhunter', key: 'headhunter', nome: 'Headhunter', descricao: 'Clientes, projetos, contratação, cobrança e financeiro Headhunter.', categoria: 'Headhunter', ativo: true, icone: 'UserSearch', rota: '/headhunter', ordem: 60, comercializavel: true },
  { id: 'equipeInterna', key: 'equipeInterna', nome: 'Equipe Interna', descricao: 'Gestão da equipe interna e acessos corporativos.', categoria: 'Gestão de Pessoas', ativo: true, icone: 'Users', rota: '/equipe-interna', ordem: 70, comercializavel: true },
  { id: 'departamentoPessoal', key: 'departamentoPessoal', nome: 'Departamento Pessoal', descricao: 'Admissão, colaboradores e rotinas de Departamento Pessoal.', categoria: 'Departamento Pessoal', ativo: true, icone: 'Users', rota: '/departamento-pessoal', ordem: 80, comercializavel: true },
  { id: 'ponto', key: 'ponto', nome: 'Ponto', descricao: 'Registros, escalas, ajustes e fechamento de ponto.', categoria: 'Departamento Pessoal', ativo: true, icone: 'Clock', rota: '/ponto', ordem: 90, comercializavel: true },
  { id: 'folha', key: 'folha', nome: 'Folha de Pagamento', descricao: 'Processamento e fechamento da folha de pagamento.', categoria: 'Departamento Pessoal', ativo: true, icone: 'CreditCard', rota: '/folha', ordem: 100, comercializavel: true },
  { id: 'feriasBeneficios', key: 'feriasBeneficios', nome: 'Férias e Benefícios', descricao: 'Gestão de férias e benefícios dos colaboradores.', categoria: 'Departamento Pessoal', ativo: true, icone: 'Calendar', rota: '/ferias-beneficios', ordem: 110, comercializavel: true },
  { id: 'documentosAssinatura', key: 'documentosAssinatura', nome: 'Documentos e Assinaturas', descricao: 'Documentos corporativos e fluxos de assinatura.', categoria: 'Gestão de Pessoas', ativo: true, icone: 'FileText', rota: '/documentos-assinatura', ordem: 120, comercializavel: true },
  { id: 'auditoriaLogs', key: 'auditoriaLogs', nome: 'Auditoria e Logs', descricao: 'Auditoria, rastreabilidade e registros de segurança.', categoria: 'Segurança e Governança', ativo: true, icone: 'Lock', rota: '/auditoria-logs', ordem: 130, comercializavel: true },
  { id: 'relatoriosAvancados', key: 'relatoriosAvancados', nome: 'Relatórios Avançados', descricao: 'Indicadores, métricas e relatórios gerenciais.', categoria: 'Análise e BI', ativo: true, icone: 'BarChart3', rota: '/relatorios-avancados', ordem: 140, comercializavel: true },
  { id: 'implantacaoMigracao', key: 'implantacaoMigracao', nome: 'Implantação e Migração', descricao: 'Importação, validação e migração assistida de dados de sistemas anteriores.', categoria: 'Gestão & Plataforma', ativo: true, icone: 'Database', rota: '/implantacao-migracao', ordem: 145, comercializavel: true },
];

export async function fetchPlansFirestore(): Promise<PlanConfig[]> {
  const snapshot = await getDocs(collection(db, 'planos'));
  return snapshot.docs
    .map((item) => {
      const raw = item.data() as Partial<PlanConfig>;
      return {
        ...raw,
        id: String(raw.id || item.id),
        nome: String(raw.nome || item.id),
        descricao: String(raw.descricao || ''),
        preco: Number(raw.preco || 0),
        modulos: Array.isArray(raw.modulos) ? raw.modulos.filter((key) => key !== 'consultorRH') : [],
        limites: raw.limites || {},
        ativo: raw.ativo !== false,
      } as PlanConfig;
    })
    .sort((a, b) => a.preco - b.preco || a.nome.localeCompare(b.nome, 'pt-BR'));
}

export async function savePlanFirestore(plan: PlanConfig): Promise<void> {
  const id = String(plan.id || '').trim();
  if (!id) throw new Error('Plano sem identificador.');
  await setDoc(doc(db, 'planos', id), sanitizeFirestoreData({
    ...plan,
    id,
    updatedAt: nowIso(),
    updatedBy: auth.currentUser?.uid || 'MASTER',
  }), { merge: true });
}

export async function deletePlanFirestore(planId: string): Promise<void> {
  const id = String(planId || '').trim();
  if (!id) return;
  await deleteDoc(doc(db, 'planos', id));
}

export async function fetchModulosFirestore(onlyActive = false): Promise<SystemModule[]> {
  const hiddenKeys = new Set(['consultorRH', 'consultor_rh', 'consultor-rh']);
  const byKey = new Map<string, SystemModule>(
    OFFICIAL_MODULE_CATALOG.map((item) => [item.key, { ...item }])
  );

  try {
    const snapshot = await getDocs(collection(db, 'modulos'));
    for (const item of snapshot.docs) {
      const raw = item.data() as Partial<SystemModule>;
      const key = String(raw.key || raw.id || item.id).trim();
      if (!key || hiddenKeys.has(key)) continue;
      const base = byKey.get(key);
      byKey.set(key, {
        ...(base || {}),
        ...raw,
        id: String(raw.id || item.id),
        key,
        nome: String(raw.nome || base?.nome || key),
        descricao: String(raw.descricao ?? base?.descricao ?? ''),
        categoria: String(raw.categoria || base?.categoria || 'Geral'),
        ativo: raw.ativo !== false,
        icone: String(raw.icone || base?.icone || 'Briefcase'),
        rota: String(raw.rota || base?.rota || '/' + key),
        ordem: Number(raw.ordem ?? base?.ordem ?? 99),
      } as SystemModule);
    }
  } catch (error) {
    console.warn('[ModuleCatalogService] Catálogo Firestore indisponível; usando catálogo oficial local.', error);
  }

  return Array.from(byKey.values())
    .filter((item) => !hiddenKeys.has(item.key))
    .filter((item) => !onlyActive || item.ativo)
    .sort((a, b) => Number(a.ordem || 99) - Number(b.ordem || 99));
}

// RH_GLOBAL_MODULE_DISABLE_V1
export async function applyGlobalModuleStatus(modules: Record<string, boolean>): Promise<Record<string, boolean>> {
  const result = { ...(modules || {}) };
  try {
    const catalog = await fetchModulosFirestore(false);
    for (const mod of catalog) {
      if (mod.ativo === false) result[String(mod.key || mod.id)] = false;
    }
  } catch (error) {
    console.warn('[ModuleCatalogService] Não foi possível aplicar status global dos módulos.', error);
  }
  return result;
}

export async function saveModuloFirestore(module: Partial<SystemModule>): Promise<SystemModule> {
  const id = String(module.id || module.key || '').trim();
  if (!id) throw new Error('Módulo sem identificador.');
  const key = String(module.key || id).trim();
  const normalized: SystemModule = {
    ...module,
    id,
    key,
    nome: String(module.nome || key),
    descricao: String(module.descricao || ''),
    categoria: String(module.categoria || 'Geral'),
    ativo: module.ativo !== false,
    icone: String(module.icone || 'Briefcase'),
    rota: String(module.rota || '/' + key),
    ordem: Number(module.ordem ?? 99),
    updatedAt: nowIso(),
    updatedBy: auth.currentUser?.uid || 'MASTER',
  };
  await setDoc(doc(db, 'modulos', id), sanitizeFirestoreData(normalized), { merge: true });
  return normalized;
}


export type SystemModule = ModuloConfig & {
  descricao: string;
  categoria: string;
  ativo: boolean;
  icone: string;
  ordem: number;
  comercializavel?: boolean;
  precoAdicional?: number;
  gratuito?: boolean;
  enterprise?: boolean;
  planosDisponiveis?: string[];
  permissions?: string[];
  dependencias?: string[];
  createdAt?: unknown;
};

export async function deleteModuloFirestore(moduleId: string): Promise<void> {
  const id = String(moduleId || '').trim();
  if (!id) return;
  await deleteDoc(doc(db, 'modulos', id));
}

export async function toggleModuloStatusFirestore(moduleId: string, currentStatus: boolean): Promise<boolean> {
  const id = String(moduleId || '').trim();
  if (!id) throw new Error('Módulo sem identificador.');
  const nextStatus = !Boolean(currentStatus);
  const catalog = await fetchModulosFirestore(false);
  const found = catalog.find((item) => item.id === id || item.key === id);
  const moduleKey = String(found?.key || id).trim();
  const timestamp = nowIso();

  await setDoc(doc(db, 'modulos', id), sanitizeFirestoreData({
    key: moduleKey,
    ativo: nextStatus,
    updatedAt: timestamp,
    updatedBy: auth.currentUser?.uid || 'MASTER'
  }), { merge: true });

  // Desativar no catálogo é GLOBAL: remove dos planos e grava false em todas as empresas.
  // Reativar o catálogo NÃO religa contratos/vínculos antigos automaticamente.
  if (!nextStatus) {
    const [plansSnap, companiesSnap, companyModulesSnap] = await Promise.all([
      getDocs(collection(db, 'planos')),
      getDocs(collection(db, 'empresas')),
      getDocs(collection(db, 'empresa_modulos')),
    ]);

    const writes: Promise<unknown>[] = [];

    for (const planDoc of plansSnap.docs) {
      const data = planDoc.data() as Record<string, any>;
      const patch: Record<string, any> = { updatedAt: timestamp, updatedBy: auth.currentUser?.uid || 'MASTER' };
      let changed = false;
      if (Array.isArray(data.modulos)) {
        patch.modulos = data.modulos.filter((key: unknown) => String(key) !== moduleKey);
        changed = patch.modulos.length !== data.modulos.length;
      }
      if (Array.isArray(data.modules)) {
        patch.modules = data.modules.filter((key: unknown) => String(key) !== moduleKey);
        changed = changed || patch.modules.length !== data.modules.length;
      }
      if (changed) writes.push(setDoc(doc(db, 'planos', planDoc.id), sanitizeFirestoreData(patch), { merge: true }));
    }

    for (const companyDoc of companiesSnap.docs) {
      const data = companyDoc.data() as Record<string, any>;
      const rawTenantData = data.rawTenantData && typeof data.rawTenantData === 'object' ? data.rawTenantData : {};
      const base = (data.modules && typeof data.modules === 'object' ? data.modules : null)
        || (data.modulos && typeof data.modulos === 'object' ? data.modulos : null)
        || (rawTenantData.modules && typeof rawTenantData.modules === 'object' ? rawTenantData.modules : null)
        || (rawTenantData.modulos && typeof rawTenantData.modulos === 'object' ? rawTenantData.modulos : null)
        || {};
      const nextModules = { ...base, [moduleKey]: false };
      writes.push(setDoc(doc(db, 'empresas', companyDoc.id), sanitizeFirestoreData({
        modules: nextModules,
        modulos: nextModules,
        rawTenantData: { ...rawTenantData, modules: nextModules, modulos: nextModules },
        updatedAt: timestamp,
        updatedBy: auth.currentUser?.uid || 'MASTER'
      }), { merge: true }));
    }

    for (const linkDoc of companyModulesSnap.docs) {
      const data = linkDoc.data() as Record<string, any>;
      const base = (data.modules && typeof data.modules === 'object' ? data.modules : null)
        || (data.modulos && typeof data.modulos === 'object' ? data.modulos : null)
        || {};
      const nextModules = { ...base, [moduleKey]: false };
      writes.push(setDoc(doc(db, 'empresa_modulos', linkDoc.id), sanitizeFirestoreData({
        empresaId: data.empresaId || linkDoc.id,
        companyId: data.companyId || data.empresaId || linkDoc.id,
        modules: nextModules,
        modulos: nextModules,
        updatedAt: timestamp,
        updatedBy: auth.currentUser?.uid || 'MASTER'
      }), { merge: true }));
    }

    for (let i = 0; i < writes.length; i += 50) {
      await Promise.all(writes.slice(i, i + 50));
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('platform_modules_updated', { detail: { moduleKey, active: nextStatus } }));
    window.dispatchEvent(new CustomEvent('company_modules_updated', { detail: { moduleKey, active: nextStatus, global: true } }));
  }
  return nextStatus;
}

export async function duplicateModuloFirestore(sourceModule: SystemModule): Promise<SystemModule> {
  const sourceKey = String(sourceModule.key || sourceModule.id || 'modulo').trim();
  const newKey = sourceKey + '_copia_' + Math.floor(Math.random() * 1000);
  return saveModuloFirestore({ ...sourceModule, id: newKey, key: newKey, nome: String(sourceModule.nome || sourceKey) + ' (Cópia)', ordem: Number(sourceModule.ordem || 0) + 1 });
}

export async function savePlanModulesFirestore(planId: string, modulos: string[]): Promise<void> {
  const id = String(planId || '').trim();
  if (!id) throw new Error('Plano sem identificador.');
  const catalog = await fetchModulosFirestore(false);
  const disabled = new Set(catalog.filter((item) => item.ativo === false).map((item) => String(item.key || item.id)));
  const safeModules = Array.isArray(modulos)
    ? modulos.filter((key) => key !== 'consultorRH' && !disabled.has(String(key)))
    : [];
  await setDoc(doc(db, 'planos', id), sanitizeFirestoreData({ modulos: safeModules, updatedAt: nowIso(), updatedBy: auth.currentUser?.uid || 'MASTER' }), { merge: true });
}

export async function fetchCompanyReleasedModules(empresaId: string): Promise<Record<string, boolean>> {
  const id = String(empresaId || '').trim();
  if (!id) return {};

  // 1. Fonte autoritativa: exatamente o mapa que o Painel Master exibe/salva.
  const companySnap = await getDoc(doc(db, 'empresas', id));
  if (companySnap.exists()) {
    const data = companySnap.data() as Record<string, any>;
    const rawTenant = data.rawTenantData && typeof data.rawTenantData === 'object' ? data.rawTenantData : {};
    const value = data.modules || data.modulos || rawTenant.modules || rawTenant.modulos;
    if (value && typeof value === 'object') {
      return applyGlobalModuleStatus(Object.fromEntries(Object.entries(value).map(([key, enabled]) => [key, enabled === true])));
    }
  }

  // 2. Compatibilidade para empresas legadas que ainda não possuem modules em empresas.
  const modulesSnap = await getDoc(doc(db, 'empresa_modulos', id));
  if (modulesSnap.exists()) {
    const data = modulesSnap.data() as Record<string, any>;
    const value = data.modules && typeof data.modules === 'object' ? data.modules : data.modulos;
    if (value && typeof value === 'object') {
      return applyGlobalModuleStatus(Object.fromEntries(Object.entries(value).map(([key, enabled]) => [key, enabled === true])));
    }
  }

  return {};
}

export async function saveCompanyReleasedModules(empresaId: string, modulos: Record<string, boolean>): Promise<void> {
  const id = String(empresaId || '').trim();
  if (!id) throw new Error('ID da empresa é obrigatório para salvar módulos.');
  const existing = await fetchCompanyReleasedModules(id);
  const merged = await applyGlobalModuleStatus({ ...existing, ...(modulos || {}) });
  const payload = sanitizeFirestoreData({ empresaId: id, companyId: id, modules: merged, modulos: merged, updatedAt: nowIso(), updatedBy: auth.currentUser?.uid || 'MASTER' });
  await setDoc(doc(db, 'empresa_modulos', id), payload, { merge: true });
  await setDoc(doc(db, 'empresas', id), sanitizeFirestoreData({ modules: merged, modulos: merged, rawTenantData: { modules: merged }, updatedAt: nowIso(), updatedBy: auth.currentUser?.uid || 'MASTER' }), { merge: true });
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('company_modules_updated', { detail: { empresaId: id, tenantId: id, modulos: merged, modules: merged } }));
}
