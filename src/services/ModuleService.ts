import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from '../firebase/firestore';
import { db, auth } from '../lib/firebase';
import { sanitizeFirestoreData } from '../lib/firestoreUtils';
import { PlatformModule } from '../master-admin/types/master';
import { AuditService } from './AuditService';

const COLLECTION_NAME = 'modules';
const COMPANY_MODULES_COLLECTION = 'companyModules';

export interface CompanyModuleBinding {
  id: string; // `${companyId}_${moduleId}`
  companyId: string;
  moduleId: string;
  active: boolean;
  enabledAt: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  status: string;
}

export type ModuleDoc = PlatformModule;
export type CompanyModuleDoc = CompanyModuleBinding;

export class ModuleService {
  static async listAllModules(): Promise<PlatformModule[]> {
    return this.list();
  }
  static async create(moduleData: Partial<PlatformModule>): Promise<PlatformModule> {
    const id = moduleData.id || `mod-${Date.now()}`;
    const user = auth.currentUser;
    const now = new Date().toISOString();

    const mod: PlatformModule & { createdBy: string; createdAt: string; updatedAt: string; status: string; companyId?: string } = {
      id,
      key: moduleData.key || `mod_${Date.now()}`,
      name: moduleData.name || 'Novo Módulo',
      category: moduleData.category || 'Gestão',
      description: moduleData.description || 'Descrição do módulo',
      status: moduleData.status || 'Ativo',
      isCore: !!moduleData.isCore,
      activeTenantsCount: moduleData.activeTenantsCount || 1,
      iconName: moduleData.iconName || 'Sliders',
      companyId: 'global',
      createdBy: user?.uid || 'system',
      createdAt: now,
      updatedAt: now
    };

    try {
      await setDoc(doc(db, COLLECTION_NAME, id), sanitizeFirestoreData(mod), { merge: true });
      await AuditService.log({
        action: 'CREATE',
        description: `Módulo de plataforma ${mod.name} (${mod.key}) criado`,
        moduleName: 'Configurações',
        targetEntity: 'Módulo'
      });
    } catch (err) {
      console.warn('Erro ao criar módulo no Firestore:', err);
    }

    return mod;
  }

  static async update(id: string, data: Partial<PlatformModule>): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTION_NAME, id), sanitizeFirestoreData({
        ...data,
        updatedAt: new Date().toISOString()
      }), { merge: true });

      await AuditService.log({
        action: 'UPDATE',
        description: `Módulo ${id} atualizado`,
        moduleName: 'Configurações',
        targetEntity: 'Módulo'
      });
    } catch (err) {
      console.warn('Erro ao atualizar módulo no Firestore:', err);
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      await AuditService.log({
        action: 'DELETE',
        description: `Módulo ${id} excluído`,
        moduleName: 'Configurações',
        targetEntity: 'Módulo'
      });
    } catch (err) {
      console.warn('Erro ao excluir módulo no Firestore:', err);
    }
  }

  static async getById(id: string): Promise<PlatformModule | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTION_NAME, id));
      if (snap.exists()) {
        return snap.data() as PlatformModule;
      }
    } catch (err) {
      console.warn('Erro em ModuleService.getById:', err);
    }
    return null;
  }

  static async get(id: string): Promise<PlatformModule | null> {
    return this.getById(id);
  }

  static async list(): Promise<PlatformModule[]> {
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      if (!snap.empty) {
        const list: PlatformModule[] = [];
        snap.forEach(d => list.push(d.data() as PlatformModule));
        return list;
      }
    } catch (err) {
      console.warn('Erro em ModuleService.list:', err);
    }
    return [];
  }

  static async search(term: string): Promise<PlatformModule[]> {
    const all = await this.list();
    const lower = term.toLowerCase();
    return all.filter(m => 
      m.name.toLowerCase().includes(lower) || 
      m.key.toLowerCase().includes(lower) ||
      m.description.toLowerCase().includes(lower)
    );
  }

  static async count(): Promise<number> {
    const all = await this.list();
    return all.length;
  }

  static async paginate(page: number, pageSize: number): Promise<{ items: PlatformModule[]; total: number }> {
    const all = await this.list();
    const start = (page - 1) * pageSize;
    return {
      items: all.slice(start, start + pageSize),
      total: all.length
    };
  }

  // GERENCIAMENTO EMPRESA X MÓDULO (companyModules)
  static async setCompanyModule(companyId: string, moduleId: string, active: boolean): Promise<void> {
    const bindingId = `${companyId}_${moduleId}`;
    const user = auth.currentUser;
    const now = new Date().toISOString();

    const binding: CompanyModuleBinding = {
      id: bindingId,
      companyId,
      moduleId,
      active,
      enabledAt: now,
      createdBy: user?.uid || 'system',
      createdAt: now,
      updatedAt: now,
      status: active ? 'Ativo' : 'Inativo'
    };

    try {
      await setDoc(doc(db, COMPANY_MODULES_COLLECTION, bindingId), sanitizeFirestoreData(binding), { merge: true });
      await AuditService.log({
        action: 'PERMISSION_CHANGE',
        description: `Módulo ${moduleId} ${active ? 'ativado' : 'desativado'} para a empresa ${companyId}`,
        moduleName: 'Configurações',
        targetEntity: 'EmpresaMódulo',
        companyId
      });
    } catch (err) {
      console.warn('Erro ao associar módulo à empresa no Firestore:', err);
    }
  }

  static async getCompanyModules(companyId: string): Promise<Record<string, boolean>> {
    const res: Record<string, boolean> = {};
    try {
      const q = query(collection(db, COMPANY_MODULES_COLLECTION), where('companyId', '==', companyId));
      const snap = await getDocs(q);
      snap.forEach(d => {
        const data = d.data() as CompanyModuleBinding;
        res[data.moduleId] = data.active;
      });
    } catch (err) {
      console.warn('Erro ao buscar módulos da empresa no Firestore:', err);
    }
    return res;
  }
}
