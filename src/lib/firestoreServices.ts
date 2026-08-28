import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query, 
  where 
} from '../firebase/firestore';
import { db, auth } from './firebase';
import { sanitizeFirestoreData } from './firestoreUtils';
import { ClientTenant, PlatformModule, TenantModulePermissions } from '../master-admin/types/master';
import { mergeUserDocuments } from '../auth/profile';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: (auth.currentUser as any)?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

export const COLLECTIONS = {
  EMPRESAS: 'empresas',
  MODULOS: 'modulos',
  EMPRESA_MODULOS: 'empresa_modulos',
  USUARIOS: 'usuarios',
  VAGAS: 'vagas',
  CANDIDATOS: 'candidatos',
  CANDIDATURAS: 'candidaturas',
} as const;

export interface EmpresaFirestoreDoc {
  empresaId: string;
  nomeEmpresa: string;
  CNPJ: string;
  email: string;
  plano: string;
  status: string;
  dataCriacao: string;
  rawTenantData?: ClientTenant;
}

export interface ModuloFirestoreDoc {
  moduloId: string;
  nome: string;
  codigo: string;
  descricao: string;
  ativo: boolean;
  rawModuleData?: PlatformModule;
}

export interface EmpresaModuloDoc {
  id: string;
  empresaId: string;
  moduloId: string;
  ativo: boolean;
  dataLiberacao: string;
}

export interface UsuarioFirestoreDoc {
  uid: string;
  nome: string;
  email: string;
  role?: string;
  tipoUsuario?: 'MASTER' | 'EMPRESA' | 'CANDIDATO' | 'FUNCIONARIO' | 'COLABORADOR';
  empresaId?: string | null;
  ativo?: boolean;
  isMaster?: boolean;
  status?: string;
  permissions?: string[];
  dataCriacao?: string;
  createdAt?: string;
  updatedAt?: string;
  companyId?: string | null;
  companyName?: string;
  modules?: Record<string, boolean>;
}

/**
 * Utility to seed initial Firestore collections if empty.
 */
export async function seedFirestoreIfEmpty(): Promise<void> {
  // Seeds de desenvolvimento desativados conforme diretrizes de segurança de produção.
}

// ----------------------------------------------------------------------------
// EMPRESAS
// ----------------------------------------------------------------------------
export async function fetchEmpresasFirestore(): Promise<ClientTenant[]> {
  try {
    await seedFirestoreIfEmpty();
    const snap = await getDocs(collection(db, COLLECTIONS.EMPRESAS));
    if (!snap.empty) {
      const list: ClientTenant[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data() as EmpresaFirestoreDoc;
        if (data.rawTenantData) {
          list.push({
            ...data.rawTenantData,
            id: data.empresaId || docSnap.id,
            companyName: data.nomeEmpresa || data.rawTenantData.companyName,
            cnpj: data.CNPJ || data.rawTenantData.cnpj,
            ownerEmail: data.email || data.rawTenantData.ownerEmail
          });
        } else {
          list.push({
            id: data.empresaId || docSnap.id,
            code: (data.nomeEmpresa || docSnap.id).substring(0, 5).toUpperCase(),
            companyName: data.nomeEmpresa || '',
            tradeName: data.nomeEmpresa || '',
            cnpj: data.CNPJ || '',
            ownerName: '',
            ownerEmail: data.email || '',
            ownerPhone: '',
            status: (data.status as any) || 'Ativo',
            maxUsers: 0,
            maxActiveJobs: 0,
            modules: {} as TenantModulePermissions,
            branding: {
              primaryColor: '#2563EB',
              companyDisplayName: data.nomeEmpresa
            },
            metrics: {
              activeUsersCount: 0,
              totalJobsCreated: 0,
              totalTalentsStored: 0,
              totalDocumentsSigned: 0,
              storageUsedMB: 0,
              lastLoginAt: ''
            },
            contract: {
              id: `ctr-${docSnap.id}`,
              contractNumber: '',
              planName: (data.plano as any) || '',
              monthlyFee: 0,
              billingCycle: 'Mensal',
              startDate: data.dataCriacao || '',
              expirationDate: '',
              paymentMethod: 'Pix',
              autoRenew: false
            },
            createdAt: data.dataCriacao
          });
        }
      });
      return list;
    }
  } catch (err: any) {
    console.error('Erro ao buscar empresas do Firestore:', err?.message || err);
    throw err;
  }

  return [];
}

export async function fetchEmpresaAccessRecord(empresaId: string): Promise<Record<string, unknown> | null> {
  if (!empresaId) return null;
  const snapshot = await getDoc(doc(db, COLLECTIONS.EMPRESAS, empresaId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

export async function saveEmpresaFirestore(tenantData: Partial<ClientTenant>): Promise<void> {
  const empresaId = tenantData.id || `emp-${Date.now()}`;
  const nomeEmpresa = String(tenantData.companyName || tenantData.tradeName || '').trim();
  const email = String(tenantData.ownerEmail || '').trim().toLowerCase();
  if (!nomeEmpresa) throw new Error('Nome da empresa é obrigatório.');
  if (!email) throw new Error('E-mail responsável da empresa é obrigatório.');
  const empresaDocRef = doc(db, COLLECTIONS.EMPRESAS, empresaId);

  const docData: EmpresaFirestoreDoc = {
    empresaId,
    nomeEmpresa,
    CNPJ: tenantData.cnpj || '',
    email,
    plano: tenantData.contract?.planName || '',
    status: tenantData.status || 'Ativo',
    dataCriacao: tenantData.createdAt || new Date().toISOString().split('T')[0],
    rawTenantData: {
      ...tenantData,
      id: empresaId
    } as ClientTenant
  };

  try {
    const batch = writeBatch(db);
    batch.set(empresaDocRef, sanitizeFirestoreData(docData), { merge: true });
    if (tenantData.modules) {
      batch.set(doc(db, COLLECTIONS.EMPRESA_MODULOS, empresaId), sanitizeFirestoreData({
        empresaId,
        companyId: empresaId,
        modules: tenantData.modules as unknown as Record<string, boolean>,
        modulos: tenantData.modules as unknown as Record<string, boolean>,
        updatedAt: new Date().toISOString(),
      }));
    }
    batch.set(doc(db, 'configuracoes_gerais', empresaId), sanitizeFirestoreData({
      empresaId,
      companyName: nomeEmpresa,
      cnpj: tenantData.cnpj || '',
      email,
      phone: tenantData.ownerPhone || '',
      updatedAt: new Date().toISOString(),
    }), { merge: true });
    await batch.commit();
  } catch (err) {
    console.error('Erro ao salvar empresa no Firestore:', err);
    throw err;
  }
}

export async function deleteEmpresaFirestore(empresaId: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, COLLECTIONS.EMPRESAS, empresaId));
    batch.delete(doc(db, COLLECTIONS.EMPRESA_MODULOS, empresaId));
    batch.delete(doc(db, 'configuracoes_gerais', empresaId));
    await batch.commit();
  } catch (err) {
    console.error('Erro ao excluir empresa do Firestore:', err);
    throw err;
  }
}

// ----------------------------------------------------------------------------
// MÓDULOS
// ----------------------------------------------------------------------------
export async function fetchModulosFirestore(): Promise<PlatformModule[]> {
  try {
    await seedFirestoreIfEmpty();
    const snap = await getDocs(collection(db, COLLECTIONS.MODULOS));
    if (!snap.empty) {
      const list: PlatformModule[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data() as ModuloFirestoreDoc;
        if (data.rawModuleData) {
          list.push({
            ...data.rawModuleData,
            id: data.moduloId || docSnap.id,
            name: data.nome || data.rawModuleData.name,
            key: data.codigo || data.rawModuleData.key,
            description: data.descricao || data.rawModuleData.description,
            status: data.ativo ? 'Ativo' : 'Inativo'
          });
        } else {
          list.push({
            id: data.moduloId || docSnap.id,
            key: data.codigo,
            name: data.nome,
            category: 'Recrutamento',
            description: data.descricao,
            status: data.ativo ? 'Ativo' : 'Inativo',
            isCore: false,
            activeTenantsCount: 1,
            iconName: 'Sliders'
          });
        }
      });
      return list;
    }
  } catch (err: any) {
    console.warn('Erro ao buscar módulos do Firestore:', err?.message || err);
  }

  return [];
}

export async function saveModuloFirestore(moduleData: PlatformModule): Promise<void> {
  const moduloId = moduleData.id || `mod-${Date.now()}`;
  const docRef = doc(db, COLLECTIONS.MODULOS, moduloId);

  const docData: ModuloFirestoreDoc = {
    moduloId,
    nome: moduleData.name,
    codigo: moduleData.key,
    descricao: moduleData.description,
    ativo: moduleData.status === 'Ativo',
    rawModuleData: {
      ...moduleData,
      id: moduloId
    }
  };

  try {
    await setDoc(docRef, sanitizeFirestoreData(docData), { merge: true });
  } catch (err) {
    console.error('Erro ao salvar módulo no Firestore:', err);
    throw err;
  }
}

// ----------------------------------------------------------------------------
// RELAÇÃO EMPRESA X MÓDULO (empresa_modulos)
// ----------------------------------------------------------------------------
export async function saveEmpresaModuloFirestore(
  empresaId: string, 
  moduloId: string, 
  ativo: boolean
): Promise<void> {
  try {
    const { saveCompanyReleasedModules } = await import('../services/ModuleCatalogService');
    await saveCompanyReleasedModules(empresaId, { [moduloId]: ativo });
  } catch (err) {
    console.error('Erro ao salvar permissão de módulo no Firestore:', err);
    throw err;
  }
}

export async function fetchEmpresaModulosFirestore(empresaId: string): Promise<Record<string, boolean>> {
  if (!empresaId) return {};
  try {
    const { fetchCompanyReleasedModules } = await import('../services/ModuleCatalogService');
    const result = await fetchCompanyReleasedModules(empresaId);
    if (result && Object.keys(result).length > 0) {
      return result;
    }
  } catch (err: any) {
    console.warn('Informação de empresa_modulos indisponível no Firestore:', err?.message || err);
  }

  return {};
}

// ----------------------------------------------------------------------------
// USUÁRIOS
// ----------------------------------------------------------------------------
export async function saveUsuarioFirestore(userDoc: UsuarioFirestoreDoc): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Firebase Auth é obrigatório para salvar perfil de usuário.');
  }
  try {
    const docRef = doc(db, COLLECTIONS.USUARIOS, userDoc.uid);
    const sanitized = sanitizeFirestoreData(userDoc);
    await setDoc(docRef, sanitized, { merge: true });

    // Also sync to `users` collection for compatibility
    const usersDocRef = doc(db, 'users', userDoc.uid);
    await setDoc(usersDocRef, sanitizeFirestoreData({
      ...sanitized,
      displayName: userDoc.nome,
      companyId: userDoc.empresaId
    }), { merge: true });
  } catch (err) {
    console.error(`Erro ao salvar usuário (${userDoc.uid}) no Firestore:`, err);
    throw err;
  }
}

export async function fetchUsuarioFirestore(uid: string): Promise<UsuarioFirestoreDoc | null> {
  try {
    const [primarySnap, legacySnap] = await Promise.all([
      getDoc(doc(db, COLLECTIONS.USUARIOS, uid)),
      getDoc(doc(db, 'users', uid)),
    ]);
    return mergeUserDocuments(
      uid,
      primarySnap.exists() ? primarySnap.data() : null,
      legacySnap.exists() ? legacySnap.data() : null
    ) as UsuarioFirestoreDoc | null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `${COLLECTIONS.USUARIOS}/${uid}`);
  }
  return null;
}
