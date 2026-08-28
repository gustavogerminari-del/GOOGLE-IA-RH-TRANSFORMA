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
import { RegistroPontoDoc } from '../ponto-digital/types/ponto';
import { AuditService } from './AuditService';
import { requireTenantId } from '../lib/tenant';

const COLLECTION_NAME = 'timeClock';

export class TimeClockService {
  static async create(itemData: Partial<RegistroPontoDoc> & { companyId?: string }): Promise<RegistroPontoDoc> {
    const id = itemData.id || `rec-${Date.now()}`;
    const user = auth.currentUser;
    const now = new Date().toISOString();
    const companyId = requireTenantId(itemData.companyId, 'registrar o ponto');

    const registro: RegistroPontoDoc & { companyId: string; createdBy: string; createdAt: string; updatedAt: string } = {
      id,
      funcionarioId: itemData.funcionarioId || 'func-01',
      funcionarioNome: itemData.funcionarioNome || 'Colaborador',
      empresaId: companyId,
      data: itemData.data || new Date().toISOString().split('T')[0],
      horaEntrada: itemData.horaEntrada || '08:00',
      inicioIntervalo: itemData.inicioIntervalo || '12:00',
      retornoIntervalo: itemData.retornoIntervalo || '13:00',
      horaSaida: itemData.horaSaida || '17:00',
      status: itemData.status || 'Finalizado',
      horasTrabalhadasMinutos: itemData.horasTrabalhadasMinutos || 480,
      horasExtrasMinutos: itemData.horasExtrasMinutos || 0,
      atrasoMinutos: itemData.atrasoMinutos || 0,
      companyId,
      createdBy: user?.uid || 'system',
      createdAt: now,
      updatedAt: now
    };

    try {
      await setDoc(doc(db, COLLECTION_NAME, id), sanitizeFirestoreData(registro), { merge: true });
      await AuditService.log({
        action: 'CREATE',
        description: `Registro de ponto de ${registro.funcionarioNome} para ${registro.data} salvo`,
        moduleName: 'Configurações',
        targetEntity: 'Ponto Digital',
        companyId
      });
    } catch (err) {
      console.error('Erro ao salvar registro de ponto no Firestore:', err);
      throw err;
    }

    return registro;
  }

  static async update(id: string, data: Partial<RegistroPontoDoc>): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTION_NAME, id), sanitizeFirestoreData({
        ...data,
        updatedAt: new Date().toISOString()
      }), { merge: true });

      await AuditService.log({
        action: 'UPDATE',
        description: `Registro de ponto ${id} atualizado`,
        moduleName: 'Configurações',
        targetEntity: 'Ponto Digital'
      });
    } catch (err) {
      console.error('Erro ao atualizar ponto no Firestore:', err);
      throw err;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      await AuditService.log({
        action: 'DELETE',
        description: `Registro de ponto ${id} excluído`,
        moduleName: 'Configurações',
        targetEntity: 'Ponto Digital'
      });
    } catch (err) {
      console.error('Erro ao excluir ponto no Firestore:', err);
      throw err;
    }
  }

  static async getById(id: string): Promise<RegistroPontoDoc | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTION_NAME, id));
      if (snap.exists()) {
        return snap.data() as RegistroPontoDoc;
      }
    } catch (err) {
      console.warn('Erro em TimeClockService.getById:', err);
    }
    return null;
  }

  static async get(id: string): Promise<RegistroPontoDoc | null> {
    return this.getById(id);
  }

  static async list(companyId?: string, date?: string): Promise<RegistroPontoDoc[]> {
    try {
      const q = companyId 
        ? query(collection(db, COLLECTION_NAME), where('companyId', '==', companyId))
        : collection(db, COLLECTION_NAME);
      const snap = await getDocs(q);
      if (!snap.empty) {
        let list: RegistroPontoDoc[] = [];
        snap.forEach(d => list.push(d.data() as RegistroPontoDoc));
        if (date) {
          list = list.filter(r => r.data === date);
        }
        return list;
      }
    } catch (err) {
      console.warn('Erro em TimeClockService.list:', err);
    }
    return [];
  }

  static async search(term: string, companyId?: string): Promise<RegistroPontoDoc[]> {
    const all = await this.list(companyId);
    const lower = term.toLowerCase();
    return all.filter(r => 
      r.funcionarioNome.toLowerCase().includes(lower) || 
      r.data.includes(lower)
    );
  }

  static async count(companyId?: string): Promise<number> {
    const all = await this.list(companyId);
    return all.length;
  }

  static async paginate(page: number, pageSize: number, companyId?: string): Promise<{ items: RegistroPontoDoc[]; total: number }> {
    const all = await this.list(companyId);
    const start = (page - 1) * pageSize;
    return {
      items: all.slice(start, start + pageSize),
      total: all.length
    };
  }
}
