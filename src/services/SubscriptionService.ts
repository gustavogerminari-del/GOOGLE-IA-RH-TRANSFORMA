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
import { ClientSubscription } from '../subscriptions/types';
import { SaaSPlan } from '../master-admin/types/master';
import { AuditService } from './AuditService';
import { N8nService } from './N8nService';

const COLLECTION_NAME = 'subscriptions';
const PLANS_COLLECTION = 'plans';

export class SubscriptionService {
  static async create(subData: Partial<ClientSubscription> & { companyId?: string }): Promise<ClientSubscription> {
    const id = subData.id || `sub-${Date.now()}`;
    const user = auth.currentUser;
    const now = new Date().toISOString().split('T')[0];
    const companyId = subData.companyId || id;

    const subscription: ClientSubscription & { companyId: string; createdBy: string; createdAt: string; updatedAt: string; status: string } = {
      id,
      companyName: subData.companyName || 'Empresa Assinante',
      cnpj: subData.cnpj || '00.000.000/0001-00',
      planTier: subData.planTier || 'Professional',
      mrrValue: subData.mrrValue || 1200,
      billingCycle: subData.billingCycle || 'Mensal',
      contractStart: subData.contractStart || now,
      contractExpiration: subData.contractExpiration || '2027-01-01',
      paymentStatus: subData.paymentStatus || 'Em Dia / Ativo',
      modulesEnabled: subData.modulesEnabled || {
        vagas: true,
        bancoTalentos: true,
        entrevistas: true,
        equipeInterna: true,
        consultoriaRH: true,
        feriasBeneficios: true,
        documentosAssinatura: true,
        auditoriaLogs: true,
        folha: true,
        ponto: true
      },
      userLimit: subData.userLimit || 25,
      activeUsersCount: subData.activeUsersCount || 5,
      lastPaymentDate: subData.lastPaymentDate || now,
      nextRenewalDate: subData.nextRenewalDate || '2026-08-30',
      companyId,
      createdBy: user?.uid || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'Ativo'
    };

    try {
      await setDoc(doc(db, COLLECTION_NAME, id), sanitizeFirestoreData(subscription), { merge: true });
      await AuditService.log({
        action: 'CREATE',
        description: `Assinatura ${subscription.planTier} para ${subscription.companyName} ativada`,
        moduleName: 'Planos SaaS',
        targetEntity: 'Assinatura',
        companyId
      });
      await N8nService.sendSafely('subscription_created', companyId, {
        entityId: id,
        subscriptionId: id,
        companyId,
        planTier: subscription.planTier,
        billingCycle: subscription.billingCycle,
        paymentStatus: subscription.paymentStatus,
      });
    } catch (err) {
      console.warn('Erro ao salvar assinatura no Firestore:', err);
    }

    return subscription;
  }

  static async update(id: string, data: Partial<ClientSubscription>): Promise<void> {
    try {
      const existing = await this.getById(id);
      const companyId = String((data as any).companyId || (existing as any)?.companyId || '');
      await setDoc(doc(db, COLLECTION_NAME, id), sanitizeFirestoreData({
        ...data,
        updatedAt: new Date().toISOString()
      }), { merge: true });

      await AuditService.log({
        action: 'UPDATE',
        description: `Assinatura ${id} alterada`,
        moduleName: 'Planos SaaS',
        targetEntity: 'Assinatura'
      });
      if (companyId) {
        await N8nService.sendSafely('subscription_updated', companyId, {
          entityId: id,
          subscriptionId: id,
          companyId,
          ...data as Record<string, unknown>,
        });
        const paymentStatus = String((data as any).paymentStatus || '').toLowerCase();
        if (paymentStatus.includes('pago') || paymentStatus.includes('confirm') || paymentStatus.includes('em dia')) {
          await N8nService.sendSafely('payment_confirmed', companyId, {
            entityId: id,
            subscriptionId: id,
            companyId,
            paymentStatus: (data as any).paymentStatus,
            paymentId: (data as any).paymentId || '',
            amount: (data as any).amount || (existing as any)?.mrrValue || 0,
          });
        }
      }
    } catch (err) {
      console.warn('Erro ao atualizar assinatura no Firestore:', err);
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      await AuditService.log({
        action: 'DELETE',
        description: `Assinatura ${id} cancelada`,
        moduleName: 'Planos SaaS',
        targetEntity: 'Assinatura'
      });
    } catch (err) {
      console.warn('Erro ao excluir assinatura no Firestore:', err);
    }
  }

  static async getById(id: string): Promise<ClientSubscription | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTION_NAME, id));
      if (snap.exists()) {
        return snap.data() as ClientSubscription;
      }
    } catch (err) {
      console.warn('Erro em SubscriptionService.getById:', err);
    }
    return null;
  }

  static async get(id: string): Promise<ClientSubscription | null> {
    return this.getById(id);
  }

  static async list(companyId?: string): Promise<ClientSubscription[]> {
    try {
      const q = companyId 
        ? query(collection(db, COLLECTION_NAME), where('companyId', '==', companyId))
        : collection(db, COLLECTION_NAME);
      const snap = await getDocs(q);
      if (!snap.empty) {
        const list: ClientSubscription[] = [];
        snap.forEach(d => list.push(d.data() as ClientSubscription));
        return list;
      }
    } catch (err) {
      console.warn('Erro em SubscriptionService.list:', err);
    }
    return [];
  }

  static async search(term: string, companyId?: string): Promise<ClientSubscription[]> {
    const all = await this.list(companyId);
    const lower = term.toLowerCase();
    return all.filter(s => 
      s.companyName.toLowerCase().includes(lower) || 
      s.cnpj.includes(lower) ||
      s.planTier.toLowerCase().includes(lower)
    );
  }

  static async count(companyId?: string): Promise<number> {
    const all = await this.list(companyId);
    return all.length;
  }

  static async paginate(page: number, pageSize: number, companyId?: string): Promise<{ items: ClientSubscription[]; total: number }> {
    const all = await this.list(companyId);
    const start = (page - 1) * pageSize;
    return {
      items: all.slice(start, start + pageSize),
      total: all.length
    };
  }

  static async getByCompanyId(companyId: string): Promise<ClientSubscription | null> {
    const list = await this.list(companyId);
    if (list && list.length > 0) return list[0];
    return null;
  }

  static async updatePlan(id: string, planTier: 'Enterprise' | 'Professional' | 'Starter'): Promise<ClientSubscription | null> {
    const mrr = planTier === 'Enterprise' ? 2500 : planTier === 'Professional' ? 1200 : 590;
    await this.update(id, { planTier, mrrValue: mrr });
    return this.getById(id);
  }

  // PLANOS SAAS
  static async listPlans(): Promise<SaaSPlan[]> {
    try {
      const snap = await getDocs(collection(db, PLANS_COLLECTION));
      if (!snap.empty) {
        const list: SaaSPlan[] = [];
        snap.forEach(d => list.push(d.data() as SaaSPlan));
        return list;
      }
    } catch (err) {
      console.warn('Erro em SubscriptionService.listPlans:', err);
    }
    return [];
  }
}
