import { doc, getDoc } from '../firebase/firestore';
import { db } from '../lib/firebase';
import {
  deleteEmpresaFirestore,
  fetchEmpresasFirestore,
  saveEmpresaFirestore,
} from '../lib/firestoreServices';
import { ClientTenant, TenantModulePermissions } from '../master-admin/types/master';
import { AuditService } from './AuditService';
import { N8nService } from './N8nService';

const COLLECTION_NAME = 'empresas';

const withoutPassword = (tenant: Partial<ClientTenant>): Partial<ClientTenant> => ({
  ...tenant,
  adminCredentials: tenant.adminCredentials ? {
    adminEmail: tenant.adminCredentials.adminEmail,
    sendWelcomeEmail: tenant.adminCredentials.sendWelcomeEmail,
    createdAt: tenant.adminCredentials.createdAt,
  } : undefined,
});

const normalizeCompany = (id: string, raw: Record<string, any>): ClientTenant => {
  const source = (raw.rawTenantData || raw) as Partial<ClientTenant>;
  return {
    ...source,
    id,
    code: source.code || String(raw.nomeEmpresa || id).slice(0, 5).toUpperCase(),
    companyName: source.companyName || raw.nomeEmpresa || '',
    tradeName: source.tradeName || source.companyName || raw.nomeEmpresa || '',
    cnpj: source.cnpj || raw.CNPJ || '',
    ownerName: source.ownerName || '',
    ownerEmail: source.ownerEmail || raw.email || '',
    ownerPhone: source.ownerPhone || '',
    status: source.status || raw.status || 'Ativo',
    maxUsers: source.maxUsers || 0,
    maxActiveJobs: source.maxActiveJobs || 0,
    modules: source.modules || {} as TenantModulePermissions,
    branding: source.branding || { primaryColor: '#2563EB', companyDisplayName: source.companyName || raw.nomeEmpresa || '' },
    metrics: source.metrics || {
      activeUsersCount: 0,
      totalJobsCreated: 0,
      totalTalentsStored: 0,
      totalDocumentsSigned: 0,
      storageUsedMB: 0,
      lastLoginAt: '',
    },
    contract: source.contract || {
      id: '',
      contractNumber: '',
      planName: 'Básico',
      monthlyFee: 0,
      billingCycle: 'Mensal',
      startDate: raw.dataCriacao || '',
      expirationDate: '',
      paymentMethod: 'Pix',
      autoRenew: false,
    },
    adminCredentials: source.adminCredentials ? {
      adminEmail: source.adminCredentials.adminEmail,
      sendWelcomeEmail: source.adminCredentials.sendWelcomeEmail,
      createdAt: source.adminCredentials.createdAt,
    } : undefined,
    createdAt: source.createdAt || raw.dataCriacao || '',
  } as ClientTenant;
};

export class CompanyService {
  static async create(tenantData: Partial<ClientTenant>): Promise<ClientTenant> {
    const id = tenantData.id || `emp-${Date.now()}`;
    const companyName = String(tenantData.companyName || tenantData.tradeName || '').trim();
    const ownerEmail = String(tenantData.ownerEmail || '').trim().toLowerCase();
    if (!companyName) throw new Error('Nome da empresa é obrigatório.');
    if (!ownerEmail) throw new Error('E-mail responsável da empresa é obrigatório.');
    const now = new Date().toISOString();
    const companyDoc = normalizeCompany(id, withoutPassword({
      ...tenantData,
      id,
      companyName,
      tradeName: tenantData.tradeName || companyName,
      ownerEmail,
      createdAt: tenantData.createdAt || now.slice(0, 10),
    }) as Record<string, any>);

    await saveEmpresaFirestore(companyDoc);
    await AuditService.log({
      action: 'CREATE',
      description: `Empresa ${companyDoc.companyName} cadastrada`,
      moduleName: 'Configurações',
      targetEntity: 'Empresa',
      companyId: id,
    });
    await N8nService.sendSafely('company_registered', id, {
      entityId: id,
      companyId: id,
      companyName: companyDoc.companyName,
      tradeName: companyDoc.tradeName,
      ownerName: companyDoc.ownerName,
      ownerEmail: companyDoc.ownerEmail,
      cnpj: companyDoc.cnpj,
    });
    return companyDoc;
  }

  static async update(id: string, data: Partial<ClientTenant>): Promise<void> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Empresa não encontrada.');
    const updated = withoutPassword({ ...existing, ...data, id });
    await saveEmpresaFirestore(updated);
    await AuditService.log({
      action: 'UPDATE',
      description: `Dados da empresa ${updated.companyName || id} atualizados`,
      moduleName: 'Configurações',
      targetEntity: 'Empresa',
      companyId: id,
    });
  }

  static async delete(id: string): Promise<void> {
    await deleteEmpresaFirestore(id);
    await AuditService.log({
      action: 'DELETE',
      description: `Empresa ${id} excluída do sistema`,
      moduleName: 'Configurações',
      targetEntity: 'Empresa',
      companyId: id,
    });
  }

  static async getById(id: string): Promise<ClientTenant | null> {
    const snap = await getDoc(doc(db, COLLECTION_NAME, id));
    return snap.exists() ? normalizeCompany(snap.id, snap.data()) : null;
  }

  static async get(id: string): Promise<ClientTenant | null> { return this.getById(id); }

  static async list(): Promise<ClientTenant[]> { return fetchEmpresasFirestore(); }

  static async search(term: string): Promise<ClientTenant[]> {
    const lower = term.toLowerCase();
    return (await this.list()).filter(t =>
      t.companyName.toLowerCase().includes(lower) ||
      t.cnpj.includes(lower) ||
      t.ownerEmail.toLowerCase().includes(lower)
    );
  }

  static async count(): Promise<number> { return (await this.list()).length; }

  static async paginate(page: number, pageSize: number): Promise<{ items: ClientTenant[]; total: number }> {
    const all = await this.list();
    const start = (page - 1) * pageSize;
    return { items: all.slice(start, start + pageSize), total: all.length };
  }
}
