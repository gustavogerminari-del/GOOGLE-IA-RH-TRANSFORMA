import React, { createContext, useContext, useState, useEffect } from 'react';
import { PageConfig, ComponentInstance, CustomFieldDefinition, NavigationMenuItem } from '../types/builderTypes';
import { visualBuilderStore } from '../store/visualBuilderStore';

interface VisualBuilderContextType {
  getEffectivePage: (pageId: string, companyId?: string) => PageConfig;
  getComponentOverride: (pageId: string, componentKey: string) => ComponentInstance | null;
  getCustomFieldsForEntity: (entityType: 'colaborador' | 'candidato' | 'vaga' | 'empresa' | 'beneficio' | 'documento', companyId?: string) => CustomFieldDefinition[];
  navigationMenus: NavigationMenuItem[];
  refreshRuntime: () => void;
}

const VisualBuilderContext = createContext<VisualBuilderContextType | null>(null);

export const VisualBuilderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [navigationMenus, setNavigationMenus] = useState<NavigationMenuItem[]>(() => visualBuilderStore.getNavigationMenus());
  const [tick, setTick] = useState(0);

  const refreshRuntime = () => {
    setNavigationMenus(visualBuilderStore.getNavigationMenus());
    setTick(t => t + 1);
  };

  useEffect(() => {
    refreshRuntime();
  }, []);

  const getEffectivePage = (pageId: string, companyId?: string): PageConfig => {
    return visualBuilderStore.getEffectivePageConfig(pageId, companyId);
  };

  const getComponentOverride = (pageId: string, componentKey: string): ComponentInstance | null => {
    const page = visualBuilderStore.getEffectivePageConfig(pageId);
    if (!page || !page.components) return null;
    return page.components.find(c => c.componentKey === componentKey) || null;
  };

  const getCustomFieldsForEntity = (
    entityType: 'colaborador' | 'candidato' | 'vaga' | 'empresa' | 'beneficio' | 'documento', 
    companyId?: string
  ): CustomFieldDefinition[] => {
    const fields = visualBuilderStore.getCustomFields();
    return fields.filter(f => f.entityType === entityType && f.active && (!f.companyId || f.companyId === companyId));
  };

  return (
    <VisualBuilderContext.Provider value={{
      getEffectivePage,
      getComponentOverride,
      getCustomFieldsForEntity,
      navigationMenus,
      refreshRuntime
    }}>
      {children}
    </VisualBuilderContext.Provider>
  );
};

export const useVisualBuilderRuntime = () => {
  const ctx = useContext(VisualBuilderContext);
  if (!ctx) {
    throw new Error('useVisualBuilderRuntime must be used within a VisualBuilderProvider');
  }
  return ctx;
};
