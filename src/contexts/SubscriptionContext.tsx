import React, { createContext, useContext, useState, useEffect } from 'react';
import { SubscriptionService } from '../services/SubscriptionService';
import { ClientSubscription } from '../subscriptions/types';
import { SaaSPlan } from '../master-admin/types/master';
import { useAuth } from '../auth/context/AuthContext';

export interface SubscriptionContextType {
  subscription: ClientSubscription | null;
  plans: SaaSPlan[];
  loading: boolean;
  mrr: number;
  arr: number;
  upgradePlan: (companyId: string, planTier: 'Enterprise' | 'Professional' | 'Starter') => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<ClientSubscription | null>(null);
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const companyId = user?.companyId || user?.empresaId || user?.tenantId || '';

  const refreshSubscription = async () => {
    if (!companyId) {
      setSubscription(null);
      setPlans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [sub, allPlans] = await Promise.all([
        SubscriptionService.getByCompanyId(companyId),
        SubscriptionService.listPlans()
      ]);
      setSubscription(sub);
      setPlans(allPlans);
    } catch (err) {
      console.warn('Erro ao carregar assinatura no SubscriptionProvider:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, [companyId]);

  const upgradePlan = async (cId: string, planTier: 'Enterprise' | 'Professional' | 'Starter') => {
    if (subscription) {
      const updated = await SubscriptionService.updatePlan(subscription.id, planTier);
      setSubscription(updated);
    }
  };

  const mrr = subscription?.mrrValue || 0;
  const arr = mrr * 12;

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        plans,
        loading,
        mrr,
        arr,
        upgradePlan,
        refreshSubscription
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription deve ser usado dentro de um SubscriptionProvider');
  }
  return context;
};
