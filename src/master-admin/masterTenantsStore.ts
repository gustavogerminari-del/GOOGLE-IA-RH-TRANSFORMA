import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from '../firebase/firestore';
import { auth, db } from '../lib/firebase';
import { sanitizeFirestoreData } from '../lib/firestoreUtils';
import { AuditService } from '../services/AuditService';
import { UserService } from '../services/UserService';
import type { ClientTenant, TenantModulePermissions, TenantStatus } from './types/master';

export type TenantSaveInput = ClientTenant & { mode?: 'create' | 'edit'; adminPassword?: string; confirmAdminPassword?: string; sendCredentialsEmail?: boolean };
const nowIso = () => new Date().toISOString();
const newTenantId = () => `empresa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const DEFAULT_MODULES: TenantModulePermissions = { recrutamento: false, departamentoPessoal: false, vagas: false, headhunter: false, bancoTalentos: false, entrevistas: false, equipeInterna: false, consultorRH: false, feriasBeneficios: false, documentosAssinatura: false, auditoriaLogs: false, relatoriosAvancados: false, siteVagasPersonalizado: false, folha: false, ponto: false, implantacaoMigracao: false };
const normalizeModules = (value?: Partial<TenantModulePermissions>): TenantModulePermissions => ({ ...DEFAULT_MODULES, ...(value || {}) });
const modulesForUser = (modules: TenantModulePermissions): Record<string, boolean> => Object.fromEntries(Object.entries(modules).map(([key, value]) => [key, Boolean(value)]));
const normalizeRole = (value: unknown) => String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
const isPlatformIdentity = (role: unknown, tipoUsuario: unknown) => {
  const values = [normalizeRole(role), normalizeRole(tipoUsuario)];
  return values.some((value) => ['MASTER', 'MASTER_ADMIN', 'DEVELOPER', 'DEVELOPER_ADMIN', 'DESENVOLVEDOR'].includes(value));
};

async function safeAudit(input: Parameters<typeof AuditService.log>[0], context: string): Promise<void> {
  try {
    await AuditService.log(input);
  } catch (error) {
    // Auditoria é importante, mas nunca pode transformar uma operação já concluída
    // em falso erro de permissão nem desfazer empresa/usuário criado com sucesso.
    console.warn(`[Painel Master] ${context} concluído, mas a auditoria não pôde ser registrada.`, error);
  }
}

async function syncTenantAdminModules(tenant: ClientTenant): Promise<void> {
  const expectedModules = modulesForUser(tenant.modules);
  const companyUsers = await UserService.list(tenant.id);
  const adminUsers = companyUsers.filter((user) => {
    const role = normalizeRole(user.role || user.tipoUsuario);
    return ['ADMIN_EMPRESA', 'ADMINISTRADOR_EMPRESA', 'EMPRESA_ADMIN', 'GESTOR_EMPRESA', 'ADMIN'].includes(role);
  });

  for (const admin of adminUsers) {
    await UserService.update(admin.uid, { modules: expectedModules });
  }
}

function hasExactTenantModules(actual: Record<string, boolean> | undefined, expected: Record<string, boolean>): boolean {
  const current = actual || {};
  return Object.keys(expected).every((key) => Boolean(current[key]) === Boolean(expected[key]));
}

// Firestore_MASTER_COMPANIES_V1
async function firestoreMasterCompanyRequest(pathname = '', init: RequestInit = {}): Promise<any> {
  const { getAuth } = await import('../firebase/auth');
  const token = await getAuth().currentUser?.getIdToken();
  if (!token) throw new Error('Sessão MASTER expirada. Entre novamente.');
  const response = await fetch('/api/master/companies' + pathname, {
    ...init,
    headers: {
      accept: 'application/json',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      authorization: 'Bearer ' + token,
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.message || 'Não foi possível acessar as empresas no Firestore.');
  return payload;
}

export function normalizeTenantRecord(id: string, raw: Record<string, any>): ClientTenant {
  const source = raw.rawTenantData && typeof raw.rawTenantData === 'object' ? raw.rawTenantData : raw;
  const contract = source.contract && typeof source.contract === 'object' ? source.contract : {};
  const branding = source.branding && typeof source.branding === 'object' ? source.branding : {};
  const metrics = source.metrics && typeof source.metrics === 'object' ? source.metrics : {};
  const address = source.address && typeof source.address === 'object' ? source.address : undefined;
  const adminCredentials = source.adminCredentials && typeof source.adminCredentials === 'object' ? { adminEmail: String(source.adminCredentials.adminEmail || source.ownerEmail || raw.ownerEmail || '').trim().toLowerCase(), createdAt: source.adminCredentials.createdAt } : undefined;
  return {
    id, code: String(source.code || raw.code || id), companyName: String(source.companyName || source.nomeEmpresa || raw.companyName || raw.nomeEmpresa || '').trim(), tradeName: String(source.tradeName || source.nomeFantasia || raw.tradeName || raw.nomeFantasia || '').trim(), cnpj: String(source.cnpj || raw.cnpj || '').trim(), ownerName: String(source.ownerName || source.responsavel || raw.ownerName || raw.responsavel || '').trim(), ownerEmail: String(source.ownerEmail || raw.ownerEmail || '').trim().toLowerCase(), ownerPhone: String(source.ownerPhone || source.telefone || raw.ownerPhone || raw.telefone || '').trim(), address, adminCredentials,
    status: (source.status || raw.status || 'Ativo') as TenantStatus,
    maxUsers: Number(source.maxUsers ?? raw.maxUsers ?? contract.maxUsers ?? 5), maxActiveJobs: Number(source.maxActiveJobs ?? raw.maxActiveJobs ?? contract.maxActiveJobs ?? 10), modules: normalizeModules(source.modules || raw.modules || raw.modulos),
    branding: { logoUrl: String(branding.logoUrl || ''), primaryColor: String(branding.primaryColor || '#123657'), companyDisplayName: String(branding.companyDisplayName || source.tradeName || source.companyName || raw.companyName || ''), customDomain: String(branding.customDomain || '') },
    metrics: { activeUsersCount: Number(metrics.activeUsersCount || 0), totalJobsCreated: Number(metrics.totalJobsCreated || 0), totalTalentsStored: Number(metrics.totalTalentsStored || 0), totalDocumentsSigned: Number(metrics.totalDocumentsSigned || 0), storageUsedMB: Number(metrics.storageUsedMB || 0), lastLoginAt: String(metrics.lastLoginAt || '') },
    contract: { id: String(contract.id || `contract-${id}`), contractNumber: String(contract.contractNumber || ''), planName: contract.planName || source.planName || 'Básico', monthlyFee: Number(contract.monthlyFee || 0), billingCycle: contract.billingCycle || 'Mensal', startDate: String(contract.startDate || ''), expirationDate: String(contract.expirationDate || ''), paymentMethod: contract.paymentMethod || 'Pix', autoRenew: contract.autoRenew !== false },
    createdAt: String(source.createdAt || raw.createdAt || ''), notes: String(source.notes || raw.notes || ''), gracePeriodEndsAt: String(source.gracePeriodEndsAt || raw.gracePeriodEndsAt || ''), financialStatus: String(source.financialStatus || raw.financialStatus || ''), updatedAt: String(source.updatedAt || raw.updatedAt || ''),
  };
}

export async function syncTenantsFromFirestore(): Promise<ClientTenant[]> {
  const payload = await firestoreMasterCompanyRequest();
  const companies = Array.isArray(payload?.companies) ? payload.companies : [];
  return companies
    .map((company: Record<string, any>) => normalizeTenantRecord(String(company.id || ''), company))
    .filter((company: ClientTenant) => Boolean(company.id))
    .sort((left: ClientTenant, right: ClientTenant) => left.companyName.localeCompare(right.companyName, 'pt-BR'));
}

async function persistTenant(tenant: ClientTenant): Promise<void> {
  await firestoreMasterCompanyRequest('/' + encodeURIComponent(tenant.id), {
    method: 'PUT',
    body: JSON.stringify({ company: tenant }),
  });
}

export async function saveTenantAsync(input: TenantSaveInput): Promise<ClientTenant[]> {
  const isCreate = input.mode === 'create' || !String(input.id || '').trim();
  const password = String(input.adminPassword || '');
  const confirmation = String(input.confirmAdminPassword || '');
  const sendCredentialsEmail = Boolean(input.sendCredentialsEmail);
  const { mode: _mode, adminPassword: _password, confirmAdminPassword: _confirmation, sendCredentialsEmail: _send, ...tenantFields } = input;
  void _mode; void _password; void _confirmation; void _send;
  const id = isCreate ? newTenantId() : String(input.id).trim();
  const createdAt = isCreate ? nowIso() : (input.createdAt || nowIso());
  if (!input.companyName.trim()) throw new Error('Razão social é obrigatória.');
  if (!input.ownerEmail.trim()) throw new Error('E-mail de contato é obrigatório.');
  if (isCreate) {
    if (password.length < 6) throw new Error('Senha inicial deve ter pelo menos 6 caracteres.');
    if (password !== confirmation) throw new Error('Senha inicial e confirmação devem ser iguais.');
    if (!String(input.adminCredentials?.adminEmail || input.ownerEmail || '').trim()) throw new Error('E-mail do administrador é obrigatório.');
  }
  const tenant: ClientTenant = {
    ...tenantFields, id, code: input.code || id, modules: normalizeModules(input.modules),
    adminCredentials: isCreate ? { adminEmail: String(input.adminCredentials?.adminEmail || input.ownerEmail).trim().toLowerCase(), sendWelcomeEmail: sendCredentialsEmail, createdAt } : input.adminCredentials ? { adminEmail: String(input.adminCredentials.adminEmail || '').trim().toLowerCase(), createdAt: input.adminCredentials.createdAt } : undefined,
    createdAt, updatedAt: nowIso(),
  };

  // Edição comum nunca provisiona usuário e nunca altera senha no Authentication.
  if (!isCreate) {
    await persistTenant(tenant);
    await syncTenantAdminModules(tenant);
    await safeAudit({ action: 'UPDATE', description: `Empresa ${tenant.companyName} atualizada e módulos do ADMIN_EMPRESA sincronizados`, moduleName: 'Painel Master', targetEntity: 'Empresa', companyId: tenant.id }, 'Atualização da empresa');
    return syncTenantsFromFirestore();
  }

  await persistTenant(tenant);

  // Somente falha no provisionamento real do administrador desfaz a nova empresa.
  // Antes, uma simples falha no audit log caía neste catch, apagava a empresa e
  // deixava a conta recém-criada órfã no Firebase.
  try {
    const expectedAdminModules = modulesForUser(tenant.modules);
    const createdAdmin = await UserService.create({
      email: tenant.adminCredentials!.adminEmail,
      password,
      displayName: tenant.ownerName || tenant.companyName,
      role: 'ADMIN_EMPRESA',
      tipoUsuario: 'ADMIN_EMPRESA',
      companyId: tenant.id,
      status: 'Ativo',
      modules: expectedAdminModules,
    });

    let confirmedAdmin = await UserService.getById(createdAdmin.uid);
    if (confirmedAdmin && !hasExactTenantModules(confirmedAdmin.modules, expectedAdminModules)) {
      await UserService.update(createdAdmin.uid, { modules: expectedAdminModules });
      confirmedAdmin = await UserService.getById(createdAdmin.uid);
    }

    const confirmedCompanyId = String(confirmedAdmin?.companyId || '').trim();
    const confirmedEmail = String(confirmedAdmin?.email || '').trim().toLowerCase();
    const confirmedRole = normalizeRole(confirmedAdmin?.role || confirmedAdmin?.tipoUsuario);
    if (!confirmedAdmin
      || confirmedCompanyId !== tenant.id
      || confirmedEmail !== tenant.adminCredentials!.adminEmail
      || !hasExactTenantModules(confirmedAdmin.modules, expectedAdminModules)
      || !['ADMIN_EMPRESA', 'ADMINISTRADOR_EMPRESA', 'EMPRESA_ADMIN', 'GESTOR_EMPRESA', 'ADMIN'].includes(confirmedRole)) {
      throw new Error('A empresa não foi concluída porque o ADMIN_EMPRESA não pôde ser confirmado com a empresa e os módulos corretos no Firebase.');
    }

    const companyUsers = await UserService.list(tenant.id);
    const adminVisible = companyUsers.some((user) =>
      user.uid === createdAdmin.uid
      && String(user.email || '').trim().toLowerCase() === tenant.adminCredentials!.adminEmail
      && String(user.companyId || '').trim() === tenant.id
    );
    if (!adminVisible) {
      throw new Error('O ADMIN_EMPRESA foi criado, mas não apareceu em Usuários e Permissões. O cadastro da empresa foi interrompido para evitar acesso órfão.');
    }
  } catch (error) {
    await Promise.allSettled([
      deleteDoc(doc(db, 'empresa_modulos', tenant.id)),
      deleteDoc(doc(db, 'empresas', tenant.id)),
    ]);
    throw error;
  }

  tenant.metrics = { ...tenant.metrics, activeUsersCount: Math.max(1, Number(tenant.metrics?.activeUsersCount || 0)) };
  try {
    await persistTenant(tenant);
  } catch (metricError) {
    console.warn('[Painel Master] Empresa e ADMIN_EMPRESA foram criados, mas a métrica de usuários não pôde ser atualizada.', metricError);
  }

  // RH_PONTO_COMPANY_PROVISION_V3
  if (tenant.modules?.ponto) {
    try {
      const { getAuth } = await import('../firebase/auth');
      const sessionUser = getAuth().currentUser;
      const idToken = await sessionUser?.getIdToken();
      if (!idToken) throw new Error('Sessão MASTER indisponível para provisionar o Ponto.');
      const response = await fetch('/api/ponto/provision-company', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + idToken },
        body: JSON.stringify({
          companyId: tenant.id, companyName: tenant.companyName, tradeName: tenant.tradeName, cnpj: tenant.cnpj,
          ownerName: tenant.ownerName, ownerEmail: tenant.ownerEmail, ownerPhone: tenant.ownerPhone, address: tenant.address,
          planName: tenant.contract?.planName, pontoEnabled: true
        }),
      });
      const pontoResult = await response.json().catch(() => ({}));
      if (!response.ok || !pontoResult?.ok) throw new Error(pontoResult?.message || 'Falha ao provisionar a empresa no sistema de Ponto.');
    } catch (pontoError) {
      console.error('[Ponto] A empresa do RH-MIL foi criada, mas o provisionamento do Ponto falhou.', pontoError);
      window.alert('A empresa foi criada no RH-MIL, porém o Ponto não foi provisionado: ' + (pontoError instanceof Error ? pontoError.message : String(pontoError)));
    }
  }

  await safeAudit({ action: 'CREATE', description: `Empresa ${tenant.companyName} e administrador inicial criados`, moduleName: 'Painel Master', targetEntity: 'Empresa', companyId: tenant.id }, 'Criação da empresa');
  return syncTenantsFromFirestore();
}

export async function toggleTenantStatus(id: string, currentStatus: TenantStatus): Promise<ClientTenant[]> {
  const nextStatus: TenantStatus = currentStatus === 'Ativo' ? 'Suspenso' : 'Ativo';
  const batch = writeBatch(db);
  batch.set(doc(db, 'empresas', id), sanitizeFirestoreData({ status: nextStatus, updatedAt: nowIso(), updatedBy: auth.currentUser?.uid || 'MASTER' }), { merge: true });
  await batch.commit();
  await safeAudit({ action: 'UPDATE', description: `Empresa ${id} alterada para ${nextStatus}`, moduleName: 'Painel Master', targetEntity: 'Empresa', companyId: id }, 'Alteração de status da empresa');
  return syncTenantsFromFirestore();
}

type ServerDeleteResult = {
  deletedAuthUsers: number;
  removedProfileCount: number;
  authDeletionPending: number;
};

async function deleteTenantOnServer(id: string): Promise<ServerDeleteResult> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Sessão MASTER não encontrada. Entre novamente.');
  const idToken = await currentUser.getIdToken();
  const response = await fetch('/api/master/delete-tenant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ companyId: id }),
  });
  const contentType = response.headers.get('content-type') || '';
  const result = contentType.toLowerCase().includes('application/json')
    ? await response.json().catch(() => ({}))
    : { success: false, error: (await response.text()).slice(0, 250) };

  if (!response.ok || !result.success) {
    const error = new Error(result.error || `Não foi possível excluir a empresa (HTTP ${response.status}).`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return {
    deletedAuthUsers: Number(result.deletedAuthUsers || 0),
    removedProfileCount: Number(result.removedProfileCount || 0),
    authDeletionPending: Number(result.authDeletionPending || 0),
  };
}

async function linkedTenantProfileIds(id: string): Promise<Set<string>> {
  const linked = new Map<string, Record<string, any>>();
  const searches = await Promise.all([
    getDocs(query(collection(db, 'usuarios'), where('empresaId', '==', id))),
    getDocs(query(collection(db, 'usuarios'), where('companyId', '==', id))),
    getDocs(query(collection(db, 'users'), where('empresaId', '==', id))),
    getDocs(query(collection(db, 'users'), where('companyId', '==', id))),
  ]);

  searches.forEach(snapshot => snapshot.forEach(profileDoc => {
    const raw = profileDoc.data() as Record<string, any>;
    if (!isPlatformIdentity(raw.role, raw.tipoUsuario)) linked.set(profileDoc.id, raw);
  }));
  return new Set(linked.keys());
}

async function deleteTenantFromFirestore(id: string): Promise<number> {
  // Não depende mais da listagem visual de usuários. Procura o vínculo nos dois
  // nomes de coleção e nos dois nomes de campo usados historicamente pelo projeto.
  // Assim uma empresa excluída não deixa perfis órfãos por causa de companyId/empresaId.
  const linkedUserIds = await linkedTenantProfileIds(id);
  const batch = writeBatch(db);
  for (const uid of linkedUserIds) {
    batch.delete(doc(db, 'usuarios', uid));
    batch.delete(doc(db, 'users', uid));
  }
  batch.delete(doc(db, 'empresa_modulos', id));
  batch.delete(doc(db, 'companyModules', id));
  batch.delete(doc(db, 'companies', id));
  batch.delete(doc(db, 'tenants', id));
  batch.delete(doc(db, 'empresas', id));
  await batch.commit();
  return linkedUserIds.size;
}

export async function deleteTenant(id: string): Promise<ClientTenant[]> {
  let deletedAuthUsers = 0;
  let removedProfileCount = 0;
  let authDeletionPending = 0;
  let usedFirestoreFallback = false;

  try {
    const result = await deleteTenantOnServer(id);
    deletedAuthUsers = result.deletedAuthUsers;
    removedProfileCount = result.removedProfileCount;
    authDeletionPending = result.authDeletionPending;
  } catch (error: any) {
    const status = Number(error?.status || 0);
    const message = String(error?.message || '');
    const canFallback = status !== 403 && (
      !status ||
      [404, 405, 500, 501, 502, 503].includes(status) ||
      /Firestore|Firebase|não configurad|not found|formato inesperado|HTTP/i.test(message)
    );
    if (!canFallback) throw error;

    removedProfileCount = await deleteTenantFromFirestore(id);
    authDeletionPending = removedProfileCount;
    usedFirestoreFallback = true;
  }

  await safeAudit({
    action: 'DELETE',
    description: usedFirestoreFallback
      ? `Empresa ${id} removida do Firestore por fallback; ${removedProfileCount} perfil(is) removido(s) e ${authDeletionPending} conta(s) aguardando limpeza no Authentication`
      : `Empresa ${id} removida do cadastro Master, ${deletedAuthUsers} conta(s) excluída(s) do Firebase Authentication, ${removedProfileCount} perfil(is) removido(s) e ${authDeletionPending} conta(s) pendente(s) no Authentication`,
    moduleName: 'Painel Master',
    targetEntity: 'Empresa',
    companyId: id,
  }, 'Exclusão da empresa');

  return syncTenantsFromFirestore();
}


export async function updateTenantModule(tenantId: string, moduleKey: string, active: boolean): Promise<ClientTenant[]> {
  const id = String(tenantId || '').trim();
  const key = String(moduleKey || '').trim();
  if (!id || !key) throw new Error('Empresa e módulo são obrigatórios.');
  const current = await syncTenantsFromFirestore();
  const tenant = current.find((item) => item.id === id);
  if (!tenant) throw new Error('Empresa não encontrada para atualizar o módulo.');
  const modules = normalizeModules({ ...(tenant.modules || {}), [key]: Boolean(active) } as Partial<TenantModulePermissions>);
  await persistTenant({ ...tenant, modules, updatedAt: nowIso() });
  await safeAudit({ action: 'UPDATE', description: 'Módulo ' + key + ' da empresa ' + id + ' alterado para ' + (active ? 'ativo' : 'inativo'), moduleName: 'Painel Master', targetEntity: 'Empresa', companyId: id }, 'Atualização de módulo da empresa');
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('company_modules_updated', { detail: { tenantId: id, empresaId: id, moduleKey: key, active: Boolean(active) } }));
  return syncTenantsFromFirestore();
}
