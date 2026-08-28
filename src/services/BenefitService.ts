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
import { BenefitItem, LeaveRequest, EmployeeLeaveBalance } from '../benefits-leaves/types';
import { AuditService } from './AuditService';
import { requireTenantId } from '../lib/tenant';

const COLLECTION_NAME = 'benefits';
const LEAVES_COLLECTION = 'ferias_solicitacoes';

export class BenefitService {
  static async create(itemData: Partial<BenefitItem> & { companyId?: string }): Promise<BenefitItem> {
    const id = itemData.id || `ben-${Date.now()}`;
    const user = auth.currentUser;
    const now = new Date().toISOString();
    const companyId = requireTenantId(itemData.companyId, 'cadastrar o benefício');

    const benefit: BenefitItem & { companyId: string; createdBy: string; createdAt: string; updatedAt: string } = {
      id,
      code: itemData.code || `BEN-${Date.now()}`,
      title: itemData.title || 'Novo Benefício',
      category: itemData.category || 'Vale Refeição (VR)',
      provider: itemData.provider || 'Fornecedor Benefícios',
      monthlyValuePerEmployee: itemData.monthlyValuePerEmployee || 500,
      companyDiscountPercent: itemData.companyDiscountPercent || 0,
      activeEnrolledEmployees: itemData.activeEnrolledEmployees || 1,
      renewalDate: itemData.renewalDate || '2027-01-01',
      status: itemData.status || 'Ativo',
      companyId,
      createdBy: user?.uid || 'system',
      createdAt: now,
      updatedAt: now
    };

    try {
      await setDoc(doc(db, COLLECTION_NAME, id), sanitizeFirestoreData(benefit), { merge: true });
      await AuditService.log({
        action: 'CREATE',
        description: `Benefício ${benefit.title} (${benefit.category}) cadastrado`,
        moduleName: 'FeriasBeneficios',
        targetEntity: 'Benefício',
        companyId
      });
    } catch (err) {
      console.error('Erro ao salvar benefício no Firestore:', err);
      throw err;
    }

    return benefit;
  }

  static async update(id: string, data: Partial<BenefitItem>): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTION_NAME, id), sanitizeFirestoreData({
        ...data,
        updatedAt: new Date().toISOString()
      }), { merge: true });

      await AuditService.log({
        action: 'UPDATE',
        description: `Benefício ${id} atualizado`,
        moduleName: 'FeriasBeneficios',
        targetEntity: 'Benefício'
      });
    } catch (err) {
      console.error('Erro ao atualizar benefício no Firestore:', err);
      throw err;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      await AuditService.log({
        action: 'DELETE',
        description: `Benefício ${id} desativado / removido`,
        moduleName: 'FeriasBeneficios',
        targetEntity: 'Benefício'
      });
    } catch (err) {
      console.error('Erro ao excluir benefício no Firestore:', err);
      throw err;
    }
  }

  static async getById(id: string): Promise<BenefitItem | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTION_NAME, id));
      if (snap.exists()) {
        return snap.data() as BenefitItem;
      }
    } catch (err) {
      console.warn('Erro em BenefitService.getById:', err);
    }
    return null;
  }

  static async get(id: string): Promise<BenefitItem | null> {
    return this.getById(id);
  }

  static async list(companyId?: string): Promise<BenefitItem[]> {
    try {
      const q = companyId 
        ? query(collection(db, COLLECTION_NAME), where('companyId', '==', companyId))
        : collection(db, COLLECTION_NAME);
      const snap = await getDocs(q);
      if (!snap.empty) {
        const list: BenefitItem[] = [];
        snap.forEach(d => list.push(d.data() as BenefitItem));
        return list;
      }
    } catch (err) {
      console.warn('Erro em BenefitService.list:', err);
    }
    return [];
  }

  static async search(term: string, companyId?: string): Promise<BenefitItem[]> {
    const all = await this.list(companyId);
    const lower = term.toLowerCase();
    return all.filter(b => 
      b.title.toLowerCase().includes(lower) || 
      b.provider.toLowerCase().includes(lower) ||
      b.category.toLowerCase().includes(lower)
    );
  }

  static async count(companyId?: string): Promise<number> {
    const all = await this.list(companyId);
    return all.length;
  }

  static async paginate(page: number, pageSize: number, companyId?: string): Promise<{ items: BenefitItem[]; total: number }> {
    const all = await this.list(companyId);
    const start = (page - 1) * pageSize;
    return {
      items: all.slice(start, start + pageSize),
      total: all.length
    };
  }

  // FÉRIAS E AFASTAMENTOS
  static async createLeaveRequest(req: Partial<LeaveRequest> & { companyId?: string }): Promise<LeaveRequest> {
    const id = req.id || `req-${Date.now()}`;
    const user = auth.currentUser;
    const now = new Date().toISOString().split('T')[0];
    const companyId = requireTenantId(req.companyId, 'registrar a solicitação de benefício');

    const leaveDoc: LeaveRequest & { companyId: string; createdBy: string; createdAt: string; updatedAt: string } = {
      id,
      employeeId: req.employeeId || 'emp-101',
      employeeName: req.employeeName || 'Colaborador',
      department: req.department || 'Geral',
      type: req.type || 'Férias Regulamentares',
      startDate: req.startDate || now,
      endDate: req.endDate || now,
      totalDays: req.totalDays || 15,
      status: req.status || 'Pendente de Aprovação',
      requestedAt: req.requestedAt || now,
      notes: req.notes,
      approverName: req.approverName,
      companyId,
      createdBy: user?.uid || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, LEAVES_COLLECTION, id), sanitizeFirestoreData(leaveDoc), { merge: true });
      await AuditService.log({
        action: 'CREATE',
        description: `Solicitação de ${leaveDoc.type} (${leaveDoc.totalDays} dias) para ${leaveDoc.employeeName} enviada`,
        moduleName: 'FeriasBeneficios',
        targetEntity: 'Férias',
        companyId
      });
    } catch (err) {
      console.error('Erro ao salvar solicitação de férias no Firestore:', err);
      throw err;
    }

    return leaveDoc;
  }

  static async listLeaveRequests(companyId?: string): Promise<LeaveRequest[]> {
    try {
      const q = companyId 
        ? query(collection(db, LEAVES_COLLECTION), where('companyId', '==', companyId))
        : collection(db, LEAVES_COLLECTION);
      const snap = await getDocs(q);
      if (!snap.empty) {
        const list: LeaveRequest[] = [];
        snap.forEach(d => list.push(d.data() as LeaveRequest));
        return list;
      }
    } catch (err) {
      console.warn('Erro em BenefitService.listLeaveRequests:', err);
    }
    return [];
  }
}
