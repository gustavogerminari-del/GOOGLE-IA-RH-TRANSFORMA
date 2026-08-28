import React, { createContext, useContext, useState, useEffect } from 'react';
import { SettingsService, CompanySettings } from '../services/SettingsService';
import { useAuth } from '../auth/context/AuthContext';

export interface SettingsContextType {
  settings: CompanySettings | null;
  loading: boolean;
  updateSettings: (newSettings: Partial<CompanySettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const companyId = user?.companyId || user?.empresaId || user?.tenantId || '';

  const refreshSettings = async () => {
    if (!companyId) {
      setSettings(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await SettingsService.getByCompanyId(companyId);
      setSettings(data);
    } catch (err) {
      console.warn('Erro ao carregar configurações no SettingsProvider:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, [companyId]);

  const updateSettings = async (newSettings: Partial<CompanySettings>) => {
    if (!companyId) throw new Error('Não foi possível identificar a empresa do usuário.');
    const updated = await SettingsService.update(companyId, newSettings);
    setSettings(updated);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        updateSettings,
        refreshSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings deve ser usado dentro de um SettingsProvider');
  }
  return context;
};
