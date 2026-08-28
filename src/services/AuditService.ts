import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from '../firebase/firestore';
import { db, auth } from '../lib/firebase';
import { sanitizeFirestoreData } from '../lib/firestoreUtils';
import { AuditLogEntry, AuditActionType, AuditSeverity } from '../audit-logs/types';

const COLLECTION_NAME = 'auditLogs';

export class AuditService {
  /**
   * Registra um novo log de auditoria no Firestore.
   */
  static async log(data: {
    action: AuditActionType;
    description: string;
    moduleName?: string;
    targetEntity?: string;
    severity?: AuditSeverity;
    companyId?: string;
    createdBy?: string;
  }): Promise<AuditLogEntry> {
    const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const user = auth.currentUser;
    const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const entry: AuditLogEntry & { companyId?: string; createdBy?: string; createdAt: string; updatedAt: string; status: string } = {
      id,
      timestamp: nowIso,
      userName: user?.displayName || user?.email?.split('@')[0] || 'Usuário do Sistema',
      userEmail: user?.email || '',
      userRole: 'Usuário autenticado',
      ipAddress: '',
      locationState: '',
      moduleName: (data.moduleName as any) || 'Configurações',
      actionType: data.action,
      description: data.description,
      targetEntity: data.targetEntity || 'Sistema',
      severity: data.severity || 'INFO',
      companyId: data.companyId,
      createdBy: data.createdBy || user?.uid || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'ativo'
    };

    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await setDoc(docRef, sanitizeFirestoreData(entry), { merge: true });
    } catch (err) {
      console.warn('Erro ao salvar audit log no Firestore:', err);
    }

    return entry;
  }

  static async create(data: Partial<AuditLogEntry> & { companyId?: string }): Promise<AuditLogEntry> {
    const id = data.id || `log-${Date.now()}`;
    const entry: AuditLogEntry & { companyId?: string; createdBy?: string; createdAt: string; updatedAt: string; status: string } = {
      id,
      timestamp: data.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
      userName: data.userName || 'Sistema',
      userEmail: data.userEmail || auth.currentUser?.email || '',
      userRole: data.userRole || 'RH',
      ipAddress: data.ipAddress || '',
      locationState: data.locationState || '',
      moduleName: data.moduleName || 'Configurações',
      actionType: data.actionType || 'CREATE',
      description: data.description || 'Ação registrada',
      targetEntity: data.targetEntity || 'Geral',
      severity: data.severity || 'INFO',
      companyId: data.companyId,
      createdBy: auth.currentUser?.uid || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'ativo'
    };

    try {
      await setDoc(doc(db, COLLECTION_NAME, id), sanitizeFirestoreData(entry), { merge: true });
    } catch (err) {
      console.warn('Erro em AuditService.create:', err);
    }
    return entry;
  }

  static async update(id: string, data: Partial<AuditLogEntry>): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTION_NAME, id), sanitizeFirestoreData({
        ...data,
        updatedAt: new Date().toISOString()
      }), { merge: true });
    } catch (err) {
      console.warn('Erro em AuditService.update:', err);
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (err) {
      console.warn('Erro em AuditService.delete:', err);
    }
  }

  static async getById(id: string): Promise<AuditLogEntry | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTION_NAME, id));
      if (snap.exists()) {
        return snap.data() as AuditLogEntry;
      }
    } catch (err) {
      console.warn('Erro em AuditService.getById:', err);
    }
    return null;
  }

  static async list(companyId?: string): Promise<AuditLogEntry[]> {
    try {
      const q = companyId 
        ? query(collection(db, COLLECTION_NAME), where('companyId', '==', companyId))
        : collection(db, COLLECTION_NAME);
      const snap = await getDocs(q);
      if (!snap.empty) {
        const list: AuditLogEntry[] = [];
        snap.forEach(d => list.push(d.data() as AuditLogEntry));
        return list;
      }
    } catch (err) {
      console.warn('Erro em AuditService.list:', err);
    }
    return [];
  }

  static async search(term: string, companyId?: string): Promise<AuditLogEntry[]> {
    const all = await this.list(companyId);
    const lower = term.toLowerCase();
    return all.filter(l => 
      l.description.toLowerCase().includes(lower) ||
      l.userName.toLowerCase().includes(lower) ||
      l.userEmail.toLowerCase().includes(lower)
    );
  }

  static async count(companyId?: string): Promise<number> {
    const all = await this.list(companyId);
    return all.length;
  }

  static async paginate(page: number, pageSize: number, companyId?: string): Promise<{ items: AuditLogEntry[]; total: number }> {
    const all = await this.list(companyId);
    const start = (page - 1) * pageSize;
    return {
      items: all.slice(start, start + pageSize),
      total: all.length
    };
  }
}
