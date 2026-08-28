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
import { Paystub, PayrollPeriod } from '../payroll/types/payroll';
import { AuditService } from './AuditService';
import { requireTenantId } from '../lib/tenant';

const COLLECTION_NAME = 'payroll';

export class PayrollService {
  static async create(itemData: Partial<Paystub> & { companyId?: string }): Promise<Paystub> {
    const id = itemData.id || `hol-${Date.now()}`;
    const user = auth.currentUser;
    const now = new Date().toISOString();
    const companyId = requireTenantId(itemData.companyId, 'gerar o holerite');

    const holerite: Paystub & { companyId: string; createdBy: string; createdAt: string; updatedAt: string } = {
      id,
      periodId: itemData.periodId || 'period-01',
      periodName: itemData.periodName || 'Folha Mensal - Julho / 2026',
      employeeId: itemData.employeeId || 'emp-01',
      employeeName: itemData.employeeName || 'Colaborador',
      cpf: itemData.cpf || '000.000.000-00',
      cargo: itemData.cargo || 'Analista',
      departamento: itemData.departamento || 'Geral',
      admissaoDate: itemData.admissaoDate || '2025-01-10',
      salarioBase: itemData.salarioBase || 5000,
      diasTrabalhados: itemData.diasTrabalhados || 30,
      dependentsCount: itemData.dependentsCount || 0,
      pensaoAlimenticiaValue: itemData.pensaoAlimenticiaValue || 0,
      items: itemData.items || [],
      totalProventos: itemData.totalProventos || 5000,
      totalDescontos: itemData.totalDescontos || 1000,
      valorLiquido: itemData.valorLiquido || 4000,
      baseINSS: itemData.baseINSS || 5000,
      valorINSS: itemData.valorINSS || 550,
      baseIRRF: itemData.baseIRRF || 4450,
      valorIRRF: itemData.valorIRRF || 320,
      baseFGTS: itemData.baseFGTS || 5000,
      valorFGTS: itemData.valorFGTS || 400,
      employerCharges: itemData.employerCharges || {
        inssPatronal: 1000,
        ratSat: 100,
        terceiros: 290,
        totalPatronal: 1390,
        fgtsValor: 400
      },
      statusAssinatura: itemData.statusAssinatura || 'Pendente',
      companyId,
      createdBy: user?.uid || 'system',
      createdAt: now,
      updatedAt: now
    };

    try {
      await setDoc(doc(db, COLLECTION_NAME, id), sanitizeFirestoreData(holerite), { merge: true });
      await AuditService.log({
        action: 'CREATE',
        description: `Holerite de ${holerite.employeeName} gerado`,
        moduleName: 'Folha de Pagamento',
        targetEntity: 'Folha de Pagamento',
        companyId
      });
    } catch (err) {
      console.error('Erro ao salvar holerite no Firestore:', err);
      throw err;
    }

    return holerite;
  }

  static async update(id: string, data: Partial<Paystub>): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTION_NAME, id), sanitizeFirestoreData({
        ...data,
        updatedAt: new Date().toISOString()
      }), { merge: true });

      await AuditService.log({
        action: 'UPDATE',
        description: `Holerite ${id} atualizado`,
        moduleName: 'Folha de Pagamento',
        targetEntity: 'Folha de Pagamento'
      });
    } catch (err) {
      console.error('Erro ao atualizar holerite no Firestore:', err);
      throw err;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      await AuditService.log({
        action: 'DELETE',
        description: `Holerite ${id} excluído`,
        moduleName: 'Folha de Pagamento',
        targetEntity: 'Folha de Pagamento'
      });
    } catch (err) {
      console.error('Erro ao excluir holerite no Firestore:', err);
      throw err;
    }
  }

  static async getById(id: string): Promise<Paystub | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTION_NAME, id));
      if (snap.exists()) {
        return snap.data() as Paystub;
      }
    } catch (err) {
      console.warn('Erro em PayrollService.getById:', err);
    }
    return null;
  }

  static async get(id: string): Promise<Paystub | null> {
    return this.getById(id);
  }

  static async list(companyId?: string, periodId?: string): Promise<Paystub[]> {
    try {
      const q = companyId 
        ? query(collection(db, COLLECTION_NAME), where('companyId', '==', companyId))
        : collection(db, COLLECTION_NAME);
      const snap = await getDocs(q);
      if (!snap.empty) {
        let list: Paystub[] = [];
        snap.forEach(d => list.push(d.data() as Paystub));
        if (periodId) {
          list = list.filter(h => h.periodId === periodId);
        }
        return list;
      }
    } catch (err) {
      console.warn('Erro em PayrollService.list:', err);
    }
    return [];
  }

  static async search(term: string, companyId?: string): Promise<Paystub[]> {
    const all = await this.list(companyId);
    const lower = term.toLowerCase();
    return all.filter(h => 
      h.employeeName.toLowerCase().includes(lower) || 
      h.cpf.includes(lower) ||
      h.periodName.toLowerCase().includes(lower)
    );
  }

  static async count(companyId?: string): Promise<number> {
    const all = await this.list(companyId);
    return all.length;
  }

  static async paginate(page: number, pageSize: number, companyId?: string): Promise<{ items: Paystub[]; total: number }> {
    const all = await this.list(companyId);
    const start = (page - 1) * pageSize;
    return {
      items: all.slice(start, start + pageSize),
      total: all.length
    };
  }
}
