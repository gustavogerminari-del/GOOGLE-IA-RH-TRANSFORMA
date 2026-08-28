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
import { InternalTeamMember } from '../internal-team/types/team';
import { AuditService } from './AuditService';
import { requireTenantId } from '../lib/tenant';
import { N8nService } from './N8nService';

const COLLECTION_NAME = 'employees';

export class EmployeeService {
  static async create(empData: Partial<InternalTeamMember> & { companyId?: string }): Promise<InternalTeamMember> {
    const id = empData.id || `emp-${Date.now()}`;
    const user = auth.currentUser;
    const now = new Date().toISOString();
    const companyId = requireTenantId(empData.companyId, 'cadastrar o colaborador');

    const employee: InternalTeamMember & { companyId: string; createdBy: string; createdAt: string; updatedAt: string } = {
      id,
      name: empData.name || 'Novo Colaborador',
      email: empData.email || 'colaborador@empresa.com.br',
      phone: empData.phone || '(11) 98888-7777',
      roleProfile: empData.roleProfile || 'Gestor de Seleção',
      roleType: empData.roleType || 'Recrutador',
      jobTitle: empData.jobTitle || 'Analista de RH',
      seniority: empData.seniority || 'Pleno',
      departmentId: empData.departmentId || 'dep-1',
      departmentName: empData.departmentName || 'Recursos Humanos',
      specialty: empData.specialty || 'Geral',
      avatar: empData.avatar || '',
      status: empData.status || 'Ativo',
      hireDate: empData.hireDate || new Date().toISOString().split('T')[0],
      processControl: empData.processControl || { maxJobCapacity: 10, activeJobsCount: 0, assignedProcesses: [] },
      metrics: empData.metrics || {
        avgTimeToHireDays: 20,
        slaTargetDays: 25,
        slaComplianceRate: 95,
        interviewsConductedMonth: 12,
        screenedCandidatesMonth: 45,
        hiredCandidatesYear: 8,
        managerNpsScore: 4.8,
        offerAcceptanceRate: 90
      },
      permissions: empData.permissions || {
        canCreateJobs: true,
        canEditJobs: true,
        canCloseJobs: false,
        canViewSalaries: false,
        canApproveHires: true,
        canDeleteCandidates: false,
        canScheduleInterviews: true,
        canExportReports: true,
        canManageTeam: false
      },
      companyId,
      createdBy: user?.uid || 'system',
      createdAt: now,
      updatedAt: now
    };

    try {
      await setDoc(doc(db, COLLECTION_NAME, id), sanitizeFirestoreData(employee), { merge: true });
      await AuditService.log({
        action: 'CREATE',
        description: `Colaborador ${employee.name} admitido no departamento ${employee.departmentName}`,
        moduleName: 'Equipe Interna',
        targetEntity: 'Funcionário',
        companyId
      });
      await N8nService.sendSafely('employee_created', companyId, {
        entityId: id,
        employeeId: id,
        candidateId: (empData as any).candidateId || '',
        applicationId: (empData as any).applicationId || '',
        admissionId: (empData as any).admissionId || '',
        hiringId: (empData as any).hiringId || '',
        name: employee.name,
        email: employee.email,
      });
    } catch (err) {
      console.error('Erro ao salvar funcionário no Firestore:', err);
      throw err;
    }

    return employee;
  }

  static async update(id: string, data: Partial<InternalTeamMember>): Promise<void> {
    try {
      await setDoc(doc(db, COLLECTION_NAME, id), sanitizeFirestoreData({
        ...data,
        updatedAt: new Date().toISOString()
      }), { merge: true });

      await AuditService.log({
        action: 'UPDATE',
        description: `Cadastro do colaborador ${id} atualizado`,
        moduleName: 'Equipe Interna',
        targetEntity: 'Funcionário'
      });
    } catch (err) {
      console.error('Erro ao atualizar funcionário no Firestore:', err);
      throw err;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      await AuditService.log({
        action: 'DELETE',
        description: `Colaborador ${id} desativado / removido`,
        moduleName: 'Equipe Interna',
        targetEntity: 'Funcionário'
      });
    } catch (err) {
      console.error('Erro ao excluir funcionário no Firestore:', err);
      throw err;
    }
  }

  static async getById(id: string): Promise<InternalTeamMember | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTION_NAME, id));
      if (snap.exists()) {
        return snap.data() as InternalTeamMember;
      }
    } catch (err) {
      console.warn('Erro em EmployeeService.getById:', err);
    }
    return null;
  }

  static async get(id: string): Promise<InternalTeamMember | null> {
    return this.getById(id);
  }

  static async list(companyId?: string): Promise<InternalTeamMember[]> {
    try {
      const q = companyId 
        ? query(collection(db, COLLECTION_NAME), where('companyId', '==', companyId))
        : collection(db, COLLECTION_NAME);
      const snap = await getDocs(q);
      if (!snap.empty) {
        const list: InternalTeamMember[] = [];
        snap.forEach(d => list.push(d.data() as InternalTeamMember));
        return list;
      }
    } catch (err) {
      console.warn('Erro em EmployeeService.list:', err);
    }
    return [];
  }

  static async search(term: string, companyId?: string): Promise<InternalTeamMember[]> {
    const all = await this.list(companyId);
    const lower = term.toLowerCase();
    return all.filter(e => 
      e.name.toLowerCase().includes(lower) || 
      e.email.toLowerCase().includes(lower) ||
      e.departmentName.toLowerCase().includes(lower) ||
      e.jobTitle.toLowerCase().includes(lower)
    );
  }

  static async count(companyId?: string): Promise<number> {
    const all = await this.list(companyId);
    return all.length;
  }

  static async paginate(page: number, pageSize: number, companyId?: string): Promise<{ items: InternalTeamMember[]; total: number }> {
    const all = await this.list(companyId);
    const start = (page - 1) * pageSize;
    return {
      items: all.slice(start, start + pageSize),
      total: all.length
    };
  }
}
