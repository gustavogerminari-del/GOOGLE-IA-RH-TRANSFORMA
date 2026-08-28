import React, { createContext, useContext, useState, useEffect } from 'react';
import { CompanyService } from '../services/CompanyService';
import { ClientTenant } from '../master-admin/types/master';
import { useAuth } from '../auth/context/AuthContext';
import { getCompanyId, isMasterProfile } from '../auth/profile';

export interface CompanyContextType {
  currentCompany: ClientTenant | null;
  companyId: string;
  companies: ClientTenant[];
  loading: boolean;
  impersonatedCompanyId: string | null;
  switchCompany: (id: string) => Promise<void>;
  startImpersonation: (id: string) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<ClientTenant[]>([]);
  const [currentCompany, setCurrentCompany] = useState<ClientTenant | null>(null);
  const [impersonatedCompanyId, setImpersonatedCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const activeCompanyId = impersonatedCompanyId || getCompanyId(user) || '';

  const refreshCompanies = async () => {
    setLoading(true);
    try {
      const list = isMasterProfile(user)
        ? await CompanyService.list()
        : activeCompanyId
          ? [await CompanyService.getById(activeCompanyId)].filter(Boolean) as ClientTenant[]
          : [];
      setCompanies(list);
      const active = list.find(c => c.id === activeCompanyId) || (isMasterProfile(user) ? list[0] : null) || null;
      setCurrentCompany(active);
    } catch (err) {
      console.warn('Erro ao carregar empresas no CompanyProvider:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCompanies();
  }, [activeCompanyId, user?.id]);

  const switchCompany = async (id: string) => {
    const found = companies.find(c => c.id === id);
    if (found) {
      setCurrentCompany(found);
    } else {
      const fetched = await CompanyService.getById(id);
      if (fetched) {
        setCurrentCompany(fetched);
      }
    }
  };

  const startImpersonation = async (id: string) => {
    setImpersonatedCompanyId(id);
    await switchCompany(id);
  };

  const stopImpersonation = async () => {
    setImpersonatedCompanyId(null);
    if (user) {
      const ownCompanyId = getCompanyId(user);
      if (ownCompanyId) await switchCompany(ownCompanyId);
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        currentCompany,
        companyId: currentCompany?.id || activeCompanyId,
        companies,
        loading,
        impersonatedCompanyId,
        switchCompany,
        startImpersonation,
        stopImpersonation,
        refreshCompanies
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany deve ser usado dentro de um CompanyProvider');
  }
  return context;
};
