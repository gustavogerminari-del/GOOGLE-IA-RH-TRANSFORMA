import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  SystemModule, 
  fetchModulosFirestore, 
  saveModuloFirestore, 
  deleteModuloFirestore, 
  toggleModuloStatusFirestore, 
  duplicateModuloFirestore,
  fetchCompanyReleasedModules,
  saveCompanyReleasedModules
} from '../services/ModuleCatalogService';
import { ModuleService } from '../services/ModuleService';
import { PermissionService } from '../services/PermissionService';
import { useAuth } from '../auth/context/AuthContext';

export interface ModuleContextType {
  modules: SystemModule[];
  companyModules: Record<string, boolean>;
  loading: boolean;
  error: string | null;
  isModuleEnabled: (moduleKey: string) => boolean;
  
  // CRUD Functions for 'modulos' collection in Firestore
  createModule: (moduleData: Partial<SystemModule>) => Promise<SystemModule>;
  updateModule: (id: string, moduleData: Partial<SystemModule>) => Promise<SystemModule>;
  deleteModule: (id: string) => Promise<void>;
  toggleModuleStatus: (id: string, currentStatus: boolean) => Promise<boolean>;
  duplicateModule: (module: SystemModule) => Promise<SystemModule>;
  
  // Company access management
  toggleCompanyModule: (companyId: string, moduleKey: string, enabled: boolean) => Promise<void>;
  refreshModules: () => Promise<void>;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export const ModuleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, activeModules, isModuleActive, refreshCompanyModules: syncAuthCompanyModules } = useAuth();
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [companyModulesMap, setCompanyModulesMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const companyId = user?.companyId || user?.empresaId || user?.tenantId;

  const refreshModules = async () => {
    if (!user) {
      setModules([]);
      setCompanyModulesMap({});
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const allMods = await fetchModulosFirestore(false);
      setModules(allMods);

      if (user?.tipoUsuario === 'MASTER' || user?.role === 'Super Administrador') {
        const fullAccess: Record<string, boolean> = {};
        allMods.forEach(m => { 
          fullAccess[m.key] = true;
          fullAccess[m.id] = true;
        });
        setCompanyModulesMap(fullAccess);
      } else if (companyId) {
        const compMods = await fetchCompanyReleasedModules(companyId);
        setCompanyModulesMap(compMods);
      } else {
        setCompanyModulesMap({});
      }
    } catch (err: any) {
      console.warn('Aviso/Erro ao carregar módulos no ModuleProvider:', err);
      setError(err?.message || 'Erro ao consultar coleção de módulos.');
      setCompanyModulesMap(activeModules || {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshModules();

    const handleUpdate = () => {
      refreshModules();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('company_modules_updated', handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('company_modules_updated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, [companyId, user?.id]);

  const isModuleEnabled = (moduleKey: string): boolean => {
    if (user?.tipoUsuario === 'MASTER' || user?.role === 'Super Administrador') {
      return true;
    }
    if (isModuleActive) {
      return isModuleActive(moduleKey);
    }
    const check = PermissionService.checkAccess(moduleKey, {
      userRole: user?.role || user?.tipoUsuario,
      companyModules: Object.keys(companyModulesMap).length > 0 ? companyModulesMap : activeModules,
      userPermissions: user?.permissions
    });
    return check.allowed;
  };

  // CRUD Functions for 'modulos'
  const createModule = async (moduleData: Partial<SystemModule>): Promise<SystemModule> => {
    const saved = await saveModuloFirestore(moduleData);
    await refreshModules();
    return saved;
  };

  const updateModule = async (id: string, moduleData: Partial<SystemModule>): Promise<SystemModule> => {
    const saved = await saveModuloFirestore({ ...moduleData, id, key: moduleData.key || id });
    await refreshModules();
    return saved;
  };

  const deleteModule = async (id: string): Promise<void> => {
    await deleteModuloFirestore(id);
    await refreshModules();
  };

  const toggleModuleStatus = async (id: string, currentStatus: boolean): Promise<boolean> => {
    const newStatus = await toggleModuloStatusFirestore(id, currentStatus);
    await refreshModules();
    return newStatus;
  };

  const duplicateModule = async (sourceModule: SystemModule): Promise<SystemModule> => {
    const duplicated = await duplicateModuloFirestore(sourceModule);
    await refreshModules();
    return duplicated;
  };

  const toggleCompanyModule = async (cId: string, moduleKey: string, enabled: boolean) => {
    await saveCompanyReleasedModules(cId, { [moduleKey]: enabled });
    await ModuleService.setCompanyModule(cId, moduleKey, enabled);
    setCompanyModulesMap(prev => ({
      ...prev,
      [moduleKey]: enabled
    }));
    if (syncAuthCompanyModules) {
      await syncAuthCompanyModules();
    }
  };

  return (
    <ModuleContext.Provider
      value={{
        modules,
        companyModules: companyModulesMap,
        loading,
        error,
        isModuleEnabled,
        createModule,
        updateModule,
        deleteModule,
        toggleModuleStatus,
        duplicateModule,
        toggleCompanyModule,
        refreshModules
      }}
    >
      {children}
    </ModuleContext.Provider>
  );
};

export const useModuleContext = (): ModuleContextType => {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModuleContext deve ser usado dentro de um ModuleProvider');
  }
  return context;
};
