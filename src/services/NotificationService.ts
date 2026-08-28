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
import { AuditService } from './AuditService';
import { requireTenantId } from '../lib/tenant';

const COLLECTION_NAME = 'notifications';

export interface NotificationDoc {
  id: string;
  companyId: string;
  userId?: string;
  title: string;
  message: string;
  type?: 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT';
  read: boolean;
  isRead?: boolean;
  linkUrl?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  status: string;
}

export class NotificationService {
  static async listForUser(userId: string, companyId?: string): Promise<NotificationDoc[]> {
    const list = await this.list(companyId, userId);
    return list.map(n => ({ ...n, isRead: n.read || n.isRead || false }));
  }
  static async create(notifData: Partial<NotificationDoc> & { companyId?: string }): Promise<NotificationDoc> {
    const id = notifData.id || `notif-${Date.now()}`;
    const user = auth.currentUser;
    const now = new Date().toISOString();
    const companyId = requireTenantId(notifData.companyId, 'criar a notificação');

    const notif: NotificationDoc = {
      id,
      companyId,
      userId: notifData.userId || user?.uid || 'all',
      title: notifData.title || 'Notificação',
      message: notifData.message || 'Nova mensagem do sistema',
      type: notifData.type || 'INFO',
      read: notifData.read || false,
      linkUrl: notifData.linkUrl,
      createdBy: user?.uid || 'system',
      createdAt: now,
      updatedAt: now,
      status: 'Ativo'
    };

    try {
      await setDoc(doc(db, COLLECTION_NAME, id), sanitizeFirestoreData(notif), { merge: true });
    } catch (err) {
      console.error('Erro ao salvar notificação no Firestore:', err);
      throw err;
    }

    return notif;
  }

  static async update(id: string, data: Partial<NotificationDoc>): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTION_NAME, id), sanitizeFirestoreData({
        ...data,
        updatedAt: new Date().toISOString()
      }), { merge: true });
    } catch (err) {
      console.warn('Erro ao atualizar notificação no Firestore:', err);
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (err) {
      console.warn('Erro ao excluir notificação no Firestore:', err);
    }
  }

  static async getById(id: string): Promise<NotificationDoc | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTION_NAME, id));
      if (snap.exists()) {
        return snap.data() as NotificationDoc;
      }
    } catch (err) {
      console.warn('Erro em NotificationService.getById:', err);
    }
    return null;
  }

  static async get(id: string): Promise<NotificationDoc | null> {
    return this.getById(id);
  }

  static async list(companyId?: string, userId?: string): Promise<NotificationDoc[]> {
    try {
      const q = companyId 
        ? query(collection(db, COLLECTION_NAME), where('companyId', '==', companyId))
        : collection(db, COLLECTION_NAME);
      const snap = await getDocs(q);
      if (!snap.empty) {
        let list: NotificationDoc[] = [];
        snap.forEach(d => list.push(d.data() as NotificationDoc));
        if (userId) {
          list = list.filter(n => n.userId === userId || n.userId === 'all');
        }
        return list;
      }
    } catch (err) {
      console.warn('Erro em NotificationService.list:', err);
    }
    return [];
  }

  static async search(term: string, companyId?: string): Promise<NotificationDoc[]> {
    const all = await this.list(companyId);
    const lower = term.toLowerCase();
    return all.filter(n => 
      n.title.toLowerCase().includes(lower) || 
      n.message.toLowerCase().includes(lower)
    );
  }

  static async count(companyId?: string): Promise<number> {
    const all = await this.list(companyId);
    return all.length;
  }

  static async paginate(page: number, pageSize: number, companyId?: string): Promise<{ items: NotificationDoc[]; total: number }> {
    const all = await this.list(companyId);
    const start = (page - 1) * pageSize;
    return {
      items: all.slice(start, start + pageSize),
      total: all.length
    };
  }

  static async markAsRead(id: string): Promise<void> {
    await this.update(id, { read: true });
  }

  static async markAllAsRead(companyId?: string, userId?: string): Promise<void> {
    const all = await this.list(companyId, userId);
    for (const notif of all) {
      if (!notif.read) {
        await this.markAsRead(notif.id);
      }
    }
  }
}
