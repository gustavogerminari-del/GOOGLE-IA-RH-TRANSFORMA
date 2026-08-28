import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from '../../firebase/auth';
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  CloudCog,
  CreditCard,
  Crown,
  Database,
  FileCheck2,
  FileText,
  Headphones,
  KeyRound,
  Layers3,
  Loader2,
  PlusCircle,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../auth';
import { validarAcessoMaster, type MasterValidationResult } from '../../auth/masterValidation';
import { AuditService } from '../../services/AuditService';
import { UserService, type UserProfile } from '../../services/UserService';
import {
  fetchModulosFirestore,
  fetchPlansFirestore,
  savePlanFirestore,
  type PlanConfig,
} from '../../services/ModuleCatalogService';
import { MasterSectionErrorBoundary } from './MasterSectionErrorBoundary';
import { MasterTenantModal } from './MasterTenantModal';
import { MasterEditPlanModal } from './MasterEditPlanModal';
import { MasterCreateModuleModal } from './MasterCreateModuleModal';
import { MasterModulesByPlanView } from './MasterModulesByPlanView';
import {
  deleteTenant,
  saveTenantAsync,
  syncTenantsFromFirestore,
  toggleTenantStatus,
} from '../masterTenantsStore';
import { savePlatformModule } from '../masterModulesStore';
import { MasterOperationalService } from '../services/masterOperationalService';
import type {
  ClientTenant,
  MasterBackupRecord,
  MasterFinancialEntry,
  MasterGlobalSettings,
  MasterIntegrationStatus,
  MasterInvoiceRecord,
  MasterLead,
  MasterLeadStatus,
  MasterSupportTicket,
  PlatformModule,
  SaaSPlan,
} from '../types/master';

export type MasterNavigationSection =
  | 'dashboard'
  | 'leads'
  | 'empresas'
  | 'usuarios'
  | 'planos-modulos'
  | 'financeiro'
  | 'faturamento'
  | 'suporte'
  | 'integracoes'
  | 'saude'
  | 'backup'
  | 'auditoria'
  | 'configuracoes';

interface MasterAdminViewProps {
  initialSection?: MasterNavigationSection;
}

const LEAD_STATUSES: MasterLeadStatus[] = ['NOVO', 'EM_ATENDIMENTO', 'QUALIFICADO', 'PROPOSTA', 'NEGOCIACAO', 'GANHO', 'PERDIDO'];
const INTEGRATION_CATALOG = ['Google Calendar', 'Google Meet', 'n8n', 'OpenAI / IA', 'E-mail', 'Pagamentos', 'NFS-e', 'APIs externas'];

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const safeDate = (value?: string) => value ? new Date(value).toLocaleDateString('pt-BR') : '—';
const text = (value: unknown) => String(value || '').trim();

// RH_COMPANY_ACCESS_LEAD_V2 — solicitações públicas são exibidas na fonte oficial de Leads.
const siteLeadStatus = (value: unknown): MasterLeadStatus => {
  const status = text(value).toUpperCase();
  if (['NOVO','EM_ATENDIMENTO','QUALIFICADO','PROPOSTA','NEGOCIACAO','GANHO','PERDIDO'].includes(status)) return status as MasterLeadStatus;
  if (status === 'CONTATADA') return 'EM_ATENDIMENTO';
  if (status === 'APROVADA') return 'GANHO';
  if (status === 'REJEITADA') return 'PERDIDO';
  return 'NOVO';
};

async function listSiteCompanyLeads(): Promise<MasterLead[]> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) return [];
  const response = await fetch('/api/company-access-requests', {
    method: 'GET',
    credentials: 'same-origin',
    headers: { authorization: 'Bearer ' + token }
  });
  if (!response.ok) throw new Error('Não foi possível carregar os leads enviados pelo site.');
  const data = await response.json().catch(() => ({}));
  const rows = Array.isArray(data?.requests) ? data.requests : [];
  return rows.map((item: any) => ({
    id: String(item.id || ''),
    name: text(item.contactName) || 'Contato não informado',
    companyName: text(item.companyName),
    cnpj: text(item.cpfCnpj),
    phone: text(item.phone),
    email: text(item.email).toLowerCase(),
    source: 'SITE_PUBLICO_EMPRESA',
    interest: text(item.plan),
    notes: text(item.message),
    status: siteLeadStatus(item.status),
    createdAt: text(item.createdAt),
    updatedAt: text(item.updatedAt || item.createdAt),
    ...( { siteAccessRequest: true, addressText: text(item.address), companySize: text(item.companySize) } as any )
  }));
}

async function updateSiteCompanyLeadStatus(lead: MasterLead, status: MasterLeadStatus): Promise<MasterLead> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Sessão MASTER não encontrada.');
  const response = await fetch('/api/company-access-requests', {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
    body: JSON.stringify({ id: lead.id, status })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.success) throw new Error(data?.error || 'Não foi possível atualizar o lead.');
  return { ...lead, status, updatedAt: new Date().toISOString() };
}

function tenantDisplayStatus(tenant: ClientTenant): string {
  const explicit = text(tenant.status);
  if (['Bloqueado por Inadimplência', 'Vencido / Tolerância'].includes(explicit)) return explicit;
  const expiration = text(tenant.contract?.expirationDate);
  if (!expiration) return explicit || 'Sem dados disponíveis';
  const due = new Date(`${expiration}T23:59:59`);
  if (Number.isNaN(due.getTime())) return explicit || 'Sem dados disponíveis';
  const diffDays = Math.floor((Date.now() - due.getTime()) / 86_400_000);
  if (diffDays <= 0) return 'Ativo';
  if (diffDays <= 10) return 'Vencido / Tolerância';
  return 'Bloqueado por Inadimplência';
}

function statusClass(status: string) {
  const normalized = status.toUpperCase();
  if (normalized.includes('ATIVO') || normalized.includes('PAGO') || normalized.includes('CONECTADO') || normalized.includes('CONCLU')) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
  if (normalized.includes('ERRO') || normalized.includes('FALHA') || normalized.includes('VENCIDO') || normalized.includes('BLOQUEADO') || normalized.includes('CRITICA')) return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
  if (normalized.includes('PENDENTE') || normalized.includes('TOLER') || normalized.includes('ATENDIMENTO')) return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
  return 'bg-slate-700/50 text-slate-300 border-slate-600';
}

function Badge({ value }: { value: string }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black ${statusClass(value)}`}>{value.replaceAll('_', ' ')}</span>;
}

function EmptyState({ label = 'Sem dados disponíveis' }: { label?: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center text-sm text-slate-400">{label}</div>;
}

function SectionHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-xl font-black text-white">{title}</h2><p className="mt-1 text-xs text-slate-400">{description}</p></div>
      {action}
    </div>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-5 py-4">
          <h3 className="font-black text-white">{title}</h3><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const inputClass = 'w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400';
const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50';
const secondaryButton = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700';

export const MasterAdminView: React.FC<MasterAdminViewProps> = ({ initialSection = 'dashboard' }) => {
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState<MasterNavigationSection>(initialSection);
  const [validation, setValidation] = useState<MasterValidationResult | null>(null);
  const [validating, setValidating] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');

  const [tenants, setTenants] = useState<ClientTenant[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [modules, setModules] = useState<PlatformModule[]>([]);
  const [leads, setLeads] = useState<MasterLead[]>([]);
  const [receivables, setReceivables] = useState<MasterFinancialEntry[]>([]);
  const [payables, setPayables] = useState<MasterFinancialEntry[]>([]);
  const [invoices, setInvoices] = useState<MasterInvoiceRecord[]>([]);
  const [tickets, setTickets] = useState<MasterSupportTicket[]>([]);
  const [integrations, setIntegrations] = useState<MasterIntegrationStatus[]>([]);
  const [backups, setBackups] = useState<MasterBackupRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<MasterGlobalSettings>({ id: 'global', platformName: 'RH TRANSFORMA', billingPeriodDays: 30, gracePeriodDays: 10 });

  const [tenantModal, setTenantModal] = useState<ClientTenant | 'new' | null>(null);
  const [planModal, setPlanModal] = useState<SaaSPlan | null>(null);
  const [moduleModal, setModuleModal] = useState<PlatformModule | null>(null);
  const [formModal, setFormModal] = useState<'lead' | 'finance' | 'support' | 'user' | null>(null);
  const [saving, setSaving] = useState(false);

  const validate = useCallback(async () => {
    setValidating(true);
    try { setValidation(await validarAcessoMaster()); }
    catch (error) { setValidation({ autorizado: false, motivo: error instanceof Error ? error.message : 'Falha de validação.' }); }
    finally { setValidating(false); }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    const results = await Promise.allSettled([
      syncTenantsFromFirestore(),
      UserService.list(),
      fetchPlansFirestore(),
      fetchModulosFirestore(),
      MasterOperationalService.listLeads(),
      MasterOperationalService.listFinancialEntries('RECEBER'),
      MasterOperationalService.listFinancialEntries('PAGAR'),
      MasterOperationalService.listInvoices(),
      MasterOperationalService.listSupportTickets(),
      MasterOperationalService.listIntegrations(),
      MasterOperationalService.listBackups(),
      AuditService.list(),
      MasterOperationalService.getSettings(),
    ]);
    const value = <T,>(index: number, fallback: T): T => results[index].status === 'fulfilled' ? results[index].value as T : fallback;
    setTenants(value(0, []));
    setUsers(value(1, []));
    const rawPlans = value<PlanConfig[]>(2, []);
    setPlans(rawPlans.map((plan) => ({
      id: plan.id,
      name: plan.nome as SaaSPlan['name'],
      description: plan.descricao || '',
      monthlyPrice: Number(plan.preco || 0),
      annualDiscountPercent: 0,
      maxUsers: Number(plan.limites?.usuarios || 0),
      maxActiveJobs: Number(plan.limites?.vagas || 0),
      maxEmployees: Number(plan.limites?.colaboradores || 0),
      includedModules: (plan.modulos || []) as SaaSPlan['includedModules'],
      status: 'Ativo',
      subscribersCount: 0,
    })));
    const rawModules = value<any[]>(3, []);
    setModules(rawModules.map((module) => ({
      id: module.id,
      key: module.key,
      slug: module.key,
      name: module.nome,
      description: module.descricao,
      category: module.categoria || 'Ferramentas',
      status: module.ativo ? 'Ativo' : 'Inativo',
      isCore: false,
      activeTenantsCount: 0,
      iconName: module.icone || 'Layers',
      route: module.rota || '',
      displayOrder: module.ordem || 99,
    })));
    const operationalLeads = value<MasterLead[]>(4, []);
    let siteLeads: MasterLead[] = [];
    try { siteLeads = await listSiteCompanyLeads(); }
    catch (error) { console.warn('[MASTER LEADS] Falha ao carregar solicitações do site:', error); }
    const mergedLeads = new Map<string, MasterLead>();
    [...operationalLeads, ...siteLeads].forEach((lead) => { if (lead?.id) mergedLeads.set(lead.id, lead); });
    setLeads(Array.from(mergedLeads.values()).sort((a, b) => text(b.createdAt).localeCompare(text(a.createdAt))));
    setReceivables(value(5, [])); setPayables(value(6, [])); setInvoices(value(7, []));
    setTickets(value(8, [])); setIntegrations(value(9, [])); setBackups(value(10, [])); setAuditLogs(value(11, [])); setSettings(value(12, settings));
    const rejected = results.filter((item) => item.status === 'rejected').length;
    if (rejected) setLoadError(`${rejected} fonte(s) de dados não puderam ser carregadas. As demais áreas continuam disponíveis.`);
    setLoading(false);
  }, []);

  useEffect(() => {
    validate();
    const unsubscribe = onAuthStateChanged(auth, validate);
    return unsubscribe;
  }, [validate]);
  useEffect(() => { if (validation?.autorizado) loadData(); }, [validation?.autorizado, loadData]);

  const menuItems = [
    ['dashboard', 'Visão Geral', Activity], ['leads', 'Leads', UserPlusIcon], ['empresas', 'Empresas', Building2],
    ['usuarios', 'Usuários e Permissões', Users], ['planos-modulos', 'Planos e Módulos', Layers3], ['financeiro', 'Financeiro', CircleDollarSign],
    ['faturamento', 'Faturamento / NFS-e', FileCheck2], ['suporte', 'Suporte Técnico', Headphones], ['integracoes', 'Integrações / API', CloudCog],
    ['saude', 'Saúde do Sistema', CheckCircle2], ['backup', 'Backup', Database], ['auditoria', 'Auditoria e Logs', ShieldCheck], ['configuracoes', 'Configurações', Settings],
  ] as const;

  const metrics = useMemo(() => {
    const statuses = tenants.map(tenantDisplayStatus);
    return {
      companies: tenants.length,
      active: statuses.filter((status) => status === 'Ativo').length,
      grace: statuses.filter((status) => status === 'Vencido / Tolerância').length,
      blocked: statuses.filter((status) => status === 'Bloqueado por Inadimplência').length,
      newLeads: leads.filter((lead) => lead.status === 'NOVO').length,
      activeUsers: users.filter((user) => {
        const role = String(user.role || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
        const type = String(user.tipoUsuario || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
        const platformUser = ['MASTER', 'MASTER_ADMIN', 'DEVELOPER', 'DEVELOPER_ADMIN', 'DESENVOLVEDOR'].includes(role) || ['MASTER', 'MASTER_ADMIN', 'DEVELOPER'].includes(type);
        const activeStatus = !['INATIVO', 'BLOQUEADO', 'SUSPENSO', 'DESATIVADO'].includes(String(user.status || '').trim().toUpperCase());
        const linkedToExistingCompany = tenants.some((tenant) => tenant.id === user.companyId);
        return !platformUser && activeStatus && linkedToExistingCompany;
      }).length,
      due: receivables.filter((entry) => entry.status === 'PENDENTE').reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
      overdue: receivables.filter((entry) => entry.status === 'VENCIDO').reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
      received: receivables.filter((entry) => entry.status === 'PAGO').reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
    };
  }, [tenants, users, leads, receivables]);

  if (validating) return <LoadingState label="Validando sessão e permissão MASTER..." />;
  if (!validation?.autorizado) return (
    <div className="-m-4 flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white sm:-m-6 lg:-m-8">
      <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-900 p-6 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-rose-400" /><h2 className="mt-3 font-black">ACESSO MASTER RESTRITO</h2><p className="mt-2 text-sm text-slate-400">{validation?.motivo || 'Sessão sem permissão MASTER ativa.'}</p><button onClick={logout} className={`${primaryButton} mt-5 w-full`}>Entrar novamente</button></div>
    </div>
  );

  return (
    <div className="-m-4 flex min-h-screen flex-col bg-slate-950 text-slate-100 sm:-m-6 lg:-m-8">
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-5 py-4 shadow-lg">
        <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950"><Crown className="h-6 w-6" /></div><div><h1 className="font-black text-white">PAINEL MASTER RH TRANSFORMA</h1><p className="text-xs text-slate-400">Controle administrativo central da plataforma</p></div></div>
        <button onClick={loadData} disabled={loading} className={secondaryButton}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar dados</button>
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="w-full shrink-0 border-b border-slate-800 bg-slate-900/90 p-3 md:w-72 md:border-b-0 md:border-r">
          <div className="grid grid-cols-2 gap-1 md:grid-cols-1">
            {menuItems.map(([id, label, Icon]) => <button key={id} onClick={() => setActiveSection(id)} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold ${activeSection === id ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'}`}><Icon className="h-4 w-4 shrink-0" /><span>{label}</span></button>)}
          </div>
        </aside>
        <main className="min-w-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          {loadError && <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200"><AlertTriangle className="h-4 w-4" />{loadError}</div>}
          {loading ? <LoadingState label="Carregando dados administrativos..." compact /> : (
            <MasterSectionErrorBoundary section={activeSection} onGoHome={() => setActiveSection('dashboard')}>
              {activeSection === 'dashboard' && <DashboardSection metrics={metrics} integrations={integrations} backups={backups} />}
              {activeSection === 'leads' && <LeadsSection leads={leads} tenants={tenants} search={search} setSearch={setSearch} onNew={() => setFormModal('lead')} onStatus={async (lead: MasterLead, status: MasterLeadStatus) => { if ((lead as any).siteAccessRequest) { const saved = await updateSiteCompanyLeadStatus(lead, status); setLeads((all) => all.map((item) => item.id === saved.id ? saved : item)); return; } const match = status === 'GANHO' ? tenants.find((tenant: ClientTenant) => (lead.cnpj && tenant.cnpj === lead.cnpj) || tenant.ownerEmail?.toLowerCase() === lead.email.toLowerCase()) : undefined; const saved = await MasterOperationalService.updateLeadStatus(lead, status, match?.id); setLeads((all) => all.map((item) => item.id === saved.id ? saved : item)); }} />}
              {activeSection === 'empresas' && <CompaniesSection tenants={tenants} search={search} setSearch={setSearch} onNew={() => setTenantModal('new')} onEdit={setTenantModal} onToggle={async (tenant: ClientTenant) => { setTenants(await toggleTenantStatus(tenant.id, tenant.status)); }} onDelete={async (tenant: ClientTenant) => { if (window.confirm(`Excluir a empresa ${tenant.companyName}?`)) setTenants(await deleteTenant(tenant.id)); }} />}
              {activeSection === 'usuarios' && <UsersSection
                users={users}
                tenants={tenants}
                onNew={() => setFormModal('user')}
                onToggle={async (user: UserProfile) => {
                  const role = String(user.role || '').toUpperCase().replace(/[\s-]+/g, '_');
                  if (role === 'MASTER' || role === 'MASTER_ADMIN' || user.tipoUsuario === 'MASTER') return;
                  await UserService.update(user.uid, { status: user.status === 'Ativo' ? 'Bloqueado' : 'Ativo' });
                  await loadData();
                }}
                onDelete={async (user: UserProfile) => {
                  const role = String(user.role || '').toUpperCase().replace(/[\s-]+/g, '_');
                  if (role === 'MASTER' || role === 'MASTER_ADMIN' || user.tipoUsuario === 'MASTER') {
                    window.alert('O acesso MASTER é permanente e não pode ser excluído.');
                    return;
                  }
                  if (!window.confirm(`Excluir o acesso de ${user.displayName || user.email}? Esta ação remove o perfil do sistema.`)) return;
                  await UserService.delete(user.uid);
                  await loadData();
                }}
              />}
              {activeSection === 'planos-modulos' && <MasterModulesByPlanView />}
              {activeSection === 'financeiro' && <FinanceSection receivables={receivables} payables={payables} onNew={() => setFormModal('finance')} />}
              {activeSection === 'faturamento' && <InvoiceSection invoices={invoices} />}
              {activeSection === 'suporte' && <SupportSection tickets={tickets} onNew={() => setFormModal('support')} />}
              {activeSection === 'integracoes' && <IntegrationsSection integrations={integrations} tenants={tenants} />}
              {activeSection === 'saude' && <SystemHealthSection />}
              {activeSection === 'backup' && <BackupSection backups={backups} />}
              {activeSection === 'auditoria' && <AuditSection logs={auditLogs} />}
              {activeSection === 'configuracoes' && <SettingsSection settings={settings} onSave={async (next) => setSettings(await MasterOperationalService.saveSettings(next))} />}
            </MasterSectionErrorBoundary>
          )}
        </main>
      </div>

      {tenantModal && <MasterTenantModal tenant={tenantModal === 'new' ? null : tenantModal} onClose={() => setTenantModal(null)} onSave={async (data) => { await saveTenantAsync(data); setTenantModal(null); await loadData(); }} />}
      {planModal && <MasterEditPlanModal plan={planModal} onClose={() => setPlanModal(null)} onSave={async (plan) => { await savePlanFirestore({ id: plan.id, nome: plan.name, descricao: plan.description, preco: plan.monthlyPrice, modulos: plan.includedModules as string[], limites: { usuarios: plan.maxUsers, vagas: plan.maxActiveJobs, colaboradores: plan.maxEmployees } }); setPlanModal(null); await loadData(); }} />}
      {moduleModal && <MasterCreateModuleModal isOpen onClose={() => setModuleModal(null)} initialModule={moduleModal.id ? moduleModal : undefined} onSave={async (module) => { await savePlatformModule(module); setModuleModal(null); await loadData(); }} />}
      {formModal && <OperationalFormModal kind={formModal} tenants={tenants} modules={modules} saving={saving} onClose={() => setFormModal(null)} onSave={async (payload: any) => { setSaving(true); try { if (formModal === 'lead') await MasterOperationalService.saveLead(payload); if (formModal === 'finance') await MasterOperationalService.saveFinancialEntry(payload); if (formModal === 'support') await MasterOperationalService.saveSupportTicket(payload); if (formModal === 'user') await UserService.create(payload); setFormModal(null); await loadData(); } finally { setSaving(false); } }} />}
    </div>
  );
};

function UserPlusIcon(props: React.ComponentProps<typeof Users>) { return <PlusCircle {...props} />; }
function LoadingState({ label, compact = false }: { label: string; compact?: boolean }) { return <div className={`flex items-center justify-center gap-3 bg-slate-950 text-slate-300 ${compact ? 'min-h-[45vh]' : '-m-4 min-h-screen sm:-m-6 lg:-m-8'}`}><Loader2 className="h-6 w-6 animate-spin text-amber-400" /><span className="text-sm font-bold">{label}</span></div>; }

function DashboardSection({ metrics, integrations, backups }: { metrics: Record<string, number>; integrations: MasterIntegrationStatus[]; backups: MasterBackupRecord[] }) {
  const cards = [['Empresas cadastradas', metrics.companies], ['Empresas ativas', metrics.active], ['Em tolerância', metrics.grace], ['Bloqueadas', metrics.blocked], ['Leads novos', metrics.newLeads], ['Usuários ativos', metrics.activeUsers], ['Contas a receber', currency.format(metrics.due)], ['Contas vencidas', currency.format(metrics.overdue)], ['Recebimentos', currency.format(metrics.received)]];
  const latestBackup = [...backups].sort((a, b) => text(b.finishedAt || b.createdAt).localeCompare(text(a.finishedAt || a.createdAt)))[0];
  return <><SectionHeader title="Visão Geral" description="Indicadores calculados a partir dos registros atuais da plataforma." /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs font-bold text-slate-400">{label}</p><p className="mt-2 text-2xl font-black text-white">{value ?? 'Sem dados disponíveis'}</p></div>)}</div><div className="grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><h3 className="font-black text-white">Status das integrações</h3>{integrations.length ? <div className="mt-3 space-y-2">{integrations.slice(0, 6).map((item) => <div key={item.id} className="flex justify-between text-xs"><span>{item.name}</span><Badge value={item.status} /></div>)}</div> : <p className="mt-3 text-sm text-slate-400">Configuração pendente</p>}</div><div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><h3 className="font-black text-white">Último backup</h3>{latestBackup ? <div className="mt-3 text-sm"><Badge value={latestBackup.status} /><p className="mt-2 text-slate-400">{safeDate(latestBackup.finishedAt || latestBackup.createdAt)}</p></div> : <p className="mt-3 text-sm text-slate-400">Configuração pendente</p>}</div></div></>;
}

function LeadsSection({ leads, tenants, search, setSearch, onNew, onStatus }: any) { const filtered = leads.filter((lead: MasterLead) => `${lead.name} ${lead.companyName} ${lead.email} ${lead.cnpj || ''} ${lead.phone || ''} ${(lead as any).addressText || ''}`.toLowerCase().includes(search.toLowerCase())); return <><SectionHeader title="Leads" description="Interessados e oportunidades comerciais sem duplicar empresas." action={<button onClick={onNew} className={primaryButton}><PlusCircle className="h-4 w-4" />Novo lead</button>} /><SearchBox value={search} onChange={setSearch} />{filtered.length ? <div className="overflow-x-auto rounded-2xl border border-slate-800"><table className="w-full min-w-[780px] text-left text-xs"><thead className="bg-slate-900 text-slate-400"><tr><th className="p-3">Contato</th><th>Empresa</th><th>Origem</th><th>Status</th><th>Vínculo</th></tr></thead><tbody>{filtered.map((lead: MasterLead) => <tr key={lead.id} className="border-t border-slate-800"><td className="p-3"><b className="text-white">{lead.name}</b><div className="text-slate-400">{lead.email}</div></td><td><b className="text-white">{lead.companyName || '—'}</b><div className="text-slate-400">{lead.cnpj || 'CNPJ não informado'}</div>{(lead as any).addressText && <div className="max-w-[280px] truncate text-[10px] text-slate-500" title={(lead as any).addressText}>{(lead as any).addressText}</div>}</td><td><b>{lead.source}</b>{lead.interest && <div className="text-slate-400">{lead.interest}</div>}{lead.phone && <div className="text-slate-500">{lead.phone}</div>}</td><td><select className={inputClass} value={lead.status} onChange={(e) => onStatus(lead, e.target.value)}>{LEAD_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></td><td>{lead.companyId ? tenants.find((t: ClientTenant) => t.id === lead.companyId)?.companyName || lead.companyId : lead.status === 'GANHO' ? 'Empresa não localizada' : '—'}</td></tr>)}</tbody></table></div> : <EmptyState />}</> }

function CompaniesSection({ tenants, search, setSearch, onNew, onEdit, onToggle, onDelete }: any) { const filtered = tenants.filter((tenant: ClientTenant) => `${tenant.companyName} ${tenant.cnpj} ${tenant.ownerEmail}`.toLowerCase().includes(search.toLowerCase())); return <><SectionHeader title="Empresas" description="Cadastro, assinatura, módulos, situação financeira e usuários vinculados." action={<button onClick={onNew} className={primaryButton}><PlusCircle className="h-4 w-4" />Nova empresa</button>} /><SearchBox value={search} onChange={setSearch} />{filtered.length ? <div className="grid gap-3">{filtered.map((tenant: ClientTenant) => <div key={tenant.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-black text-white">{tenant.companyName}</h3><p className="text-xs text-slate-400">{tenant.cnpj || 'CNPJ não informado'} • {tenant.ownerEmail}</p></div><Badge value={tenantDisplayStatus(tenant)} /></div><div className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-4"><span>Plano: <b>{tenant.contract?.planName || '—'}</b></span><span>Vencimento: <b>{safeDate(tenant.contract?.expirationDate)}</b></span><span>Mensalidade: <b>{currency.format(Number(tenant.contract?.monthlyFee || 0))}</b></span><span>Usuários: <b>{tenant.metrics?.activeUsersCount || 0}</b></span></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => onEdit(tenant)} className={secondaryButton}>Editar</button><button onClick={() => onToggle(tenant)} className={secondaryButton}>{tenant.status === 'Ativo' ? 'Suspender' : 'Reativar'}</button><button onClick={() => onDelete(tenant)} className={`${secondaryButton} text-rose-300`}>Excluir</button></div></div>)}</div> : <EmptyState />}</> }

function UsersSection({ users, tenants, onToggle }: any) {
  return <>
    <SectionHeader
      title="Usuários e Acessos"
      description="O MASTER supervisiona os acessos da plataforma. O primeiro ADMIN_EMPRESA nasce no cadastro da empresa; a equipe interna é administrada pela própria empresa."
    />
    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-xs text-blue-100">
      <b>Fluxo oficial:</b> MASTER cadastra a empresa e cria somente o primeiro ADMIN_EMPRESA. Depois, o ADMIN_EMPRESA administra gestores e colaboradores da própria empresa. Aqui o MASTER mantém visão global e pode bloquear ou reativar acessos para suporte.
    </div>
    {users.length ? <div className="overflow-x-auto rounded-2xl border border-slate-800">
      <table className="w-full min-w-[820px] text-left text-xs">
        <thead className="bg-slate-900 text-slate-400"><tr><th className="p-3">Usuário</th><th>Empresa</th><th>Perfil</th><th>Permissões</th><th>Status</th><th>Intervenção MASTER</th></tr></thead>
        <tbody>{users.map((user: UserProfile) => {
          const role = String(user.role || '').toUpperCase().replace(/[\s-]+/g, '_');
          const protectedMaster = role === 'MASTER' || role === 'MASTER_ADMIN' || user.tipoUsuario === 'MASTER';
          const developer = ['DEVELOPER_ADMIN','DEVELOPER','DESENVOLVEDOR'].includes(role) || user.tipoUsuario === 'DEVELOPER';
          const linkedTenant = tenants.find((t: ClientTenant) => t.id === user.companyId);
          const orphaned = !protectedMaster && !developer && !linkedTenant;
          const companyLabel = protectedMaster
            ? 'Plataforma RH TRANSFORMA'
            : developer
              ? 'Tecnologia RH TRANSFORMA'
              : linkedTenant?.companyName || 'Sem empresa / acesso órfão';
          return <tr key={user.uid} className="border-t border-slate-800">
            <td className="p-3"><b className="text-white">{user.displayName}</b><div className="text-slate-400">{user.email}</div></td>
            <td><span className={orphaned ? 'font-bold text-amber-300' : ''}>{companyLabel}</span></td>
            <td>{user.role}</td>
            <td>{user.permissions?.length || 0}</td>
            <td><Badge value={protectedMaster ? 'PROTEGIDO' : user.status} />{orphaned && <div className="mt-1 text-[10px] font-black uppercase text-amber-300">Órfão</div>}</td>
            <td>{protectedMaster
              ? <span className="text-[10px] font-black uppercase text-emerald-300">MASTER permanente — protegido</span>
              : developer
                ? <span className="text-[10px] font-bold text-slate-400">Gerenciado pela Área do Programador</span>
                : <button onClick={() => onToggle(user)} className={secondaryButton}>{user.status === 'Ativo' ? 'Bloquear acesso' : 'Reativar acesso'}</button>}
            </td>
          </tr>;
        })}</tbody>
      </table>
    </div> : <EmptyState />}
  </>;
}

function PlansModulesSection({ plans, modules, onEditPlan, onEditModule, onNewModule }: any) { return <><SectionHeader title="Planos e Módulos" description="Uma única lista oficial de módulos usada por planos, empresas, permissões e menus." action={<button onClick={onNewModule} className={primaryButton}><PlusCircle className="h-4 w-4" />Novo módulo</button>} /><div className="grid gap-4 xl:grid-cols-2"><div className="space-y-3"><h3 className="font-black text-white">Planos</h3>{plans.length ? plans.map((plan: SaaSPlan) => <button key={plan.id} onClick={() => onEditPlan(plan)} className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-4 text-left hover:border-amber-500/50"><div className="flex justify-between"><b>{plan.name}</b><span>{currency.format(plan.monthlyPrice)}/mês</span></div><p className="mt-2 text-xs text-slate-400">{plan.includedModules.length} módulos • {plan.maxUsers} usuários • {plan.maxActiveJobs} vagas</p></button>) : <EmptyState />}</div><div className="space-y-3"><h3 className="font-black text-white">Módulos oficiais</h3>{modules.length ? modules.map((module: PlatformModule) => <button key={module.id} onClick={() => onEditModule(module)} className="w-full rounded-2xl border border-slate-800 bg-slate-900 p-4 text-left hover:border-amber-500/50"><div className="flex justify-between gap-2"><b>{module.name}</b><Badge value={module.status} /></div><p className="mt-2 text-xs text-slate-400">{module.description || 'Sem descrição'} • chave: {module.key}</p></button>) : <EmptyState />}</div></div></> }

function FinanceSection({ receivables, payables, onNew }: any) { const total = (items: MasterFinancialEntry[], status?: string) => items.filter((item) => !status || item.status === status).reduce((sum, item) => sum + Number(item.amount || 0), 0); return <><SectionHeader title="Financeiro" description="Financeiro da plataforma RH TRANSFORMA, separado do financeiro interno das empresas clientes." action={<button onClick={onNew} className={primaryButton}><PlusCircle className="h-4 w-4" />Novo lançamento</button>} /><div className="grid gap-3 sm:grid-cols-3"><Metric label="A receber" value={currency.format(total(receivables, 'PENDENTE'))} /><Metric label="Recebido" value={currency.format(total(receivables, 'PAGO'))} /><Metric label="A pagar" value={currency.format(total(payables, 'PENDENTE'))} /></div><div className="grid gap-4 xl:grid-cols-2"><FinancialList title="Contas a receber" items={receivables} /><FinancialList title="Contas a pagar" items={payables} /></div></> }
function FinancialList({ title, items }: { title: string; items: MasterFinancialEntry[] }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><h3 className="font-black text-white">{title}</h3>{items.length ? <div className="mt-3 space-y-2">{items.map((entry) => <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-950 p-3 text-xs"><div><b>{entry.description}</b><p className="text-slate-400">{entry.companyName || entry.supplier || 'Plataforma'} • {safeDate(entry.dueDate)}</p></div><div className="text-right"><b>{currency.format(entry.amount)}</b><div><Badge value={entry.status} /></div></div></div>)}</div> : <EmptyState />}</div> }

function InvoiceSection({ invoices }: { invoices: MasterInvoiceRecord[] }) { return <><SectionHeader title="Faturamento / NFS-e" description="Notas vinculadas à cobrança e ao pagamento. O provedor será definido posteriormente." />{invoices.length ? <div className="grid gap-3">{invoices.map((invoice) => <div key={invoice.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="flex justify-between"><b>{invoice.companyName || invoice.companyId || 'Cliente'}</b><Badge value={invoice.status} /></div><p className="mt-2 text-xs text-slate-400">{currency.format(invoice.amount)} • cobrança {invoice.financialEntryId || 'não vinculada'} • nota {invoice.number || 'pendente'}</p></div>)}</div> : <EmptyState label="Configuração pendente — nenhuma NFS-e real registrada." />}</> }
function SupportSection({ tickets, onNew }: any) { return <><SectionHeader title="Suporte Técnico" description="Atendimentos vinculados à empresa com histórico central na auditoria." action={<button onClick={onNew} className={primaryButton}><PlusCircle className="h-4 w-4" />Abrir atendimento</button>} />{tickets.length ? <div className="grid gap-3">{tickets.map((ticket: MasterSupportTicket) => <div key={ticket.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="flex justify-between"><b>{ticket.subject}</b><Badge value={ticket.status} /></div><p className="mt-2 text-xs text-slate-400">{ticket.companyName || ticket.companyId} • prioridade {ticket.priority} • {safeDate(ticket.createdAt)}</p></div>)}</div> : <EmptyState />}</> }
// MASTER_PLATFORM_V2
type PlatformHealthPayload = {
  ok?: boolean;
  timestamp?: string;
  firebase?: { worker?: string; storage?: string; firestore?: string };
  prontoRh?: { status?: string; httpStatus?: number; timestamp?: string };
  webhooks?: { prontoRhConfigured?: boolean };
};

function usePlatformHealthStatus() {
  const [health, setHealth] = useState<PlatformHealthPayload | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setChecking(true);
    setError('');
    try {
      const { getAuth } = await import('../../firebase/auth');
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) throw new Error('Sessão MASTER expirada. Entre novamente.');
      const response = await fetch('/api/master/platform-health', { headers: { accept: 'application/json', authorization: 'Bearer ' + token }, cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Não foi possível consultar a saúde da plataforma.');
      setHealth(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao consultar a saúde da plataforma.');
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { health, checking, error, refresh };
}

// MASTER_PRONTO_RH_CONFIG_V3
function IntegrationsSection({ integrations, tenants }: { integrations: MasterIntegrationStatus[]; tenants: ClientTenant[] }) {
  const byName = new Map(integrations.map((item) => [item.name.toLowerCase(), item]));
  const { health, checking, error, refresh } = usePlatformHealthStatus();
  const pontoTenants = tenants.filter((tenant) => Boolean((tenant.modules as any)?.ponto));
  const prontoStatus = health?.prontoRh?.status || (checking ? 'VERIFICANDO' : 'CONFIGURACAO_PENDENTE');
  const runtimeHealth = health as any;
  const integrationRuntimeStatus = (name: string) => {
    const normalized = name.toLowerCase();
    let service: any = null;
    if (normalized.includes('google calendar') || normalized.includes('google meet')) service = runtimeHealth?.services?.googleWorkspace;
    else if (normalized.includes('gemini') || normalized.includes('openai') || normalized.includes('/ ia')) service = runtimeHealth?.services?.gemini;
    else if (normalized.includes('n8n')) service = runtimeHealth?.services?.n8n;
    else if (normalized.includes('e-mail') || normalized.includes('email')) service = runtimeHealth?.services?.email;
    else if (normalized.includes('pagamento')) service = runtimeHealth?.services?.payments;
    else if (normalized.includes('nfs')) service = runtimeHealth?.services?.nfse;
    else if (normalized.includes('apis externas')) service = runtimeHealth?.services?.externalApis;
    const stored = byName.get(normalized);
    return {
      status: service?.status || stored?.status || (checking ? 'VERIFICANDO' : 'SEM_DADOS'),
      detail: service?.detail || (stored?.lastCheckedAt ? 'Última verificação: ' + safeDate(stored.lastCheckedAt) : 'Sem diagnóstico disponível.'),
    };
  };
  const [savedConfig, setSavedConfig] = useState<any>(null);
  const [form, setForm] = useState({
    baseUrl: String((import.meta as any).env?.VITE_PONTO_API_BASE_URL || ''),
    clientId: '',
    clientSecret: '',
    webhookSecret: '',
  });
  const [busyAction, setBusyAction] = useState('');
  const [feedback, setFeedback] = useState('');

  const masterRequest = async (suffix = '', init: RequestInit = {}) => {
    const { getAuth } = await import('../../firebase/auth');
    const token = await getAuth().currentUser?.getIdToken();
    if (!token) throw new Error('Sessão MASTER expirada. Entre novamente.');
    const response = await fetch('/api/master/integrations/pronto-rh' + suffix, {
      ...init,
      headers: {
        accept: 'application/json',
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        authorization: 'Bearer ' + token,
        ...(init.headers || {}),
      },
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.message || 'Não foi possível concluir a configuração do PRONTO-RH.');
    return payload;
  };

  const loadConfig = async () => {
    try {
      const payload = await masterRequest();
      const config = payload?.config || {};
      setSavedConfig(config);
      setForm((current) => ({
        ...current,
        baseUrl: config.baseUrl || current.baseUrl,
        clientId: config.clientId || '',
        clientSecret: '',
        webhookSecret: '',
      }));
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Falha ao carregar a configuração da API.');
    }
  };

  useEffect(() => { void loadConfig(); }, []);

  const saveConfig = async () => {
    setBusyAction('save'); setFeedback('');
    try {
      const payload = await masterRequest('', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setSavedConfig(payload?.config || null);
      setForm((current) => ({ ...current, clientSecret: '', webhookSecret: '' }));
      setFeedback('API do PRONTO-RH salva no backend. Agora use “Testar conexão”.');
      await refresh();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Não foi possível salvar a API.');
    } finally {
      setBusyAction('');
    }
  };

  const testConnection = async () => {
    setBusyAction('test'); setFeedback('');
    try {
      const payload = await masterRequest('/test', { method: 'POST' });
      setFeedback(payload?.message || 'Conexão com o PRONTO-RH validada com sucesso.');
      await loadConfig();
      await refresh();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Falha no teste da API.');
    } finally {
      setBusyAction('');
    }
  };

  const disconnect = async () => {
    if (!window.confirm('Desconectar o RH-MIL do PRONTO-RH? O acesso ao Ponto ficará indisponível até uma nova configuração.')) return;
    setBusyAction('disconnect'); setFeedback('');
    try {
      const payload = await masterRequest('', { method: 'DELETE' });
      setSavedConfig(payload?.config || null);
      setForm((current) => ({ ...current, clientId: '', clientSecret: '', webhookSecret: '' }));
      setFeedback('Integração PRONTO-RH desconectada.');
      await refresh();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Não foi possível desconectar a integração.');
    } finally {
      setBusyAction('');
    }
  };

  const inputStyle = 'mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500';
  const sourceLabel = savedConfig?.source === 'PAINEL_MASTER'
    ? 'Painel Master'
    : savedConfig?.source === 'CLOUDFLARE_ENV'
      ? 'Firebase (legado)'
      : savedConfig?.disabled
        ? 'Desconectado'
        : 'Não configurado';

  return <>
    <SectionHeader
      title="Integrações / API"
      description="Central das integrações oficiais da plataforma. A credencial global conecta o RH-MIL ao PRONTO-RH para todas as empresas com o módulo Ponto."
      action={<button onClick={() => void testConnection()} disabled={Boolean(busyAction)} className={secondaryButton}><RefreshCw className={'h-4 w-4 ' + (busyAction === 'test' ? 'animate-spin' : '')} />Testar conexão</button>}
    />

    <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-slate-900 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">Integração principal</p>
          <h3 className="mt-1 text-lg font-black text-white">PRONTO-RH • Ponto Eletrônico</h3>
          <p className="mt-1 text-xs text-slate-400">Uma única API RH-MIL → PRONTO-RH. Cada cliente continua isolado pelo companyId/externalCompanyId e entra por SSO.</p>
        </div>
        <Badge value={prontoStatus} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <Metric label="Empresas com Ponto" value={String(pontoTenants.length)} />
        <Metric label="API PRONTO-RH" value={prontoStatus.replaceAll('_', ' ')} />
        <Metric label="Credencial global" value={runtimeHealth?.prontoRh?.authStatus || (savedConfig?.clientSecretConfigured ? 'CONFIGURADA' : 'PENDENTE')} />
        <Metric label="Webhook" value={savedConfig?.webhookSecretConfigured || runtimeHealth?.webhooks?.prontoRhConfigured ? 'CONFIGURADO' : runtimeHealth?.webhooks?.receiverReady ? 'RECEPTOR PRONTO' : 'PENDENTE'} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="text-xs font-bold text-slate-300">URL da API do PRONTO-RH
          <input className={inputStyle} value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="https://pronto-rh.../api/v1" />
        </label>
        <label className="text-xs font-bold text-slate-300">Client ID
          <input className={inputStyle} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} placeholder="prh_..." autoComplete="off" />
        </label>
        <label className="text-xs font-bold text-slate-300">Client Secret
          <input className={inputStyle} type="password" value={form.clientSecret} onChange={(e) => setForm({ ...form, clientSecret: e.target.value })} placeholder={savedConfig?.clientSecretConfigured ? 'Configurado — deixe vazio para manter' : 'Cole o Client Secret do PRONTO-RH'} autoComplete="new-password" />
        </label>
        <label className="text-xs font-bold text-slate-300">Webhook Secret <span className="font-normal text-slate-500">(opcional)</span>
          <input className={inputStyle} type="password" value={form.webhookSecret} onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })} placeholder={savedConfig?.webhookSecretConfigured ? 'Configurado — deixe vazio para manter' : 'Segredo HMAC do webhook'} autoComplete="new-password" />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={() => void saveConfig()} disabled={Boolean(busyAction)} className={primaryButton}>{busyAction === 'save' ? 'Salvando...' : 'Salvar API'}</button>
        <button onClick={() => void testConnection()} disabled={Boolean(busyAction)} className={secondaryButton}>{busyAction === 'test' ? 'Testando...' : 'Testar conexão'}</button>
        <button onClick={() => void disconnect()} disabled={Boolean(busyAction)} className={secondaryButton + ' text-rose-300'}>{busyAction === 'disconnect' ? 'Desconectando...' : 'Desconectar'}</button>
        <span className="ml-auto text-[11px] text-slate-500">Origem atual: <b className="text-slate-300">{sourceLabel}</b></span>
      </div>

      {feedback && <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/70 p-3 text-xs font-bold text-slate-200">{feedback}</div>}
      {error && <p className="mt-3 text-xs font-bold text-rose-300">{error}</p>}
      <p className="mt-3 text-[11px] text-slate-500">O Client Secret e o Webhook Secret são enviados somente ao Worker do RH-MIL, ficam no armazenamento privado do backend e nunca são devolvidos ou exibidos novamente.</p>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{INTEGRATION_CATALOG.map((name) => {
      const state = integrationRuntimeStatus(name);
      return <div key={name} className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex justify-between gap-2"><b>{name}</b><Badge value={state.status} /></div>
        <p className="mt-2 text-xs text-slate-400">{state.detail}</p>
      </div>;
    })}</div>
  </>;
}

function SystemHealthSection() {
  const { health, checking, error, refresh } = usePlatformHealthStatus();
  const runtime = health as any;
  const cards = [
    ['RH-MIL Worker', health?.firebase?.worker || (checking ? 'VERIFICANDO' : 'SEM_DADOS')],
    ['Storage / Arquivos', health?.firebase?.storage || (checking ? 'VERIFICANDO' : 'SEM_DADOS')],
    ['Firestore / Banco', health?.firebase?.firestore || (checking ? 'VERIFICANDO' : 'SEM_DADOS')],
    ['PRONTO-RH API', health?.prontoRh?.status || (checking ? 'VERIFICANDO' : 'SEM_DADOS')],
    ['Credencial PRONTO-RH', runtime?.prontoRh?.authStatus || (checking ? 'VERIFICANDO' : 'SEM_DADOS')],
    ['Google Workspace', runtime?.services?.googleWorkspace?.status || (checking ? 'VERIFICANDO' : 'SEM_DADOS')],
    ['Gemini / IA', runtime?.services?.gemini?.status || (checking ? 'VERIFICANDO' : 'SEM_DADOS')],
    ['Webhook PRONTO-RH', runtime?.webhooks?.prontoRhConfigured ? 'CONFIGURADO' : runtime?.webhooks?.receiverReady ? 'RECEPTOR_PRONTO' : 'PENDENTE'],
  ];
  return <>
    <SectionHeader
      title="Saúde do Sistema"
      description="Visão técnica resumida dos serviços essenciais sem expor credenciais."
      action={<button onClick={() => void refresh()} disabled={checking} className={secondaryButton}><RefreshCw className={'h-4 w-4 ' + (checking ? 'animate-spin' : '')} />Atualizar status</button>}
    />
    {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-200">{error}</div>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map(([label, status]) => <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs font-bold text-slate-400">{label}</p><div className="mt-3"><Badge value={String(status)} /></div></div>)}
    </div>
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-xs text-slate-400">
      Última verificação: <b className="text-slate-200">{health?.timestamp ? new Date(health.timestamp).toLocaleString('pt-BR') : '—'}</b>
    </div>
  </>;
}

function BackupSection({ backups }: { backups: MasterBackupRecord[] }) { return <><SectionHeader title="Backup" description="Histórico de proteção dos dados e arquivos importantes da plataforma." />{backups.length ? <div className="grid gap-3">{backups.map((backup) => <div key={backup.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><div className="flex justify-between"><b>{backup.source || 'Plataforma'}</b><Badge value={backup.status} /></div><p className="mt-2 text-xs text-slate-400">{safeDate(backup.finishedAt || backup.createdAt)} • destino {backup.destination || 'não configurado'} • {backup.sizeBytes ? `${Math.round(backup.sizeBytes / 1_048_576)} MB` : 'tamanho indisponível'}</p></div>)}</div> : <EmptyState label="Configuração pendente — nenhum backup real registrado." />}</> }
function AuditSection({ logs }: { logs: any[] }) { return <><SectionHeader title="Auditoria e Logs" description="Trilha central de empresas, usuários, financeiro, suporte, configurações e integrações." />{logs.length ? <div className="grid gap-2">{logs.slice().sort((a, b) => text(b.createdAt || b.timestamp).localeCompare(text(a.createdAt || a.timestamp))).map((log) => <div key={log.id} className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs"><div className="flex justify-between gap-2"><b>{log.description || log.actionType || 'Evento'}</b><Badge value={log.severity || log.status || 'INFO'} /></div><p className="mt-1 text-slate-400">{log.moduleName || 'Sistema'} • {log.userEmail || log.userName || log.createdBy || 'Sistema'} • {safeDate(log.createdAt || log.timestamp)}</p></div>)}</div> : <EmptyState />}</> }
function SettingsSection({ settings, onSave }: { settings: MasterGlobalSettings; onSave: (next: MasterGlobalSettings) => Promise<void> }) { const [form, setForm] = useState(settings); const [saving, setSaving] = useState(false); useEffect(() => setForm(settings), [settings]); return <><SectionHeader title="Configurações" description="Somente parâmetros globais reais da plataforma. Integrações e planos permanecem em seus módulos próprios." /><form onSubmit={async (event) => { event.preventDefault(); setSaving(true); try { await onSave(form); } finally { setSaving(false); } }} className="max-w-2xl space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5"><Field label="Nome da plataforma"><input className={inputClass} value={form.platformName} onChange={(e) => setForm({ ...form, platformName: e.target.value })} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Período da assinatura"><input className={inputClass} value="30 dias" disabled /></Field><Field label="Período de tolerância"><input className={inputClass} value="10 dias" disabled /></Field></div><Field label="E-mail de suporte"><input className={inputClass} type="email" value={form.supportEmail || ''} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} /></Field><Field label="URL da política de privacidade"><input className={inputClass} value={form.privacyPolicyUrl || ''} onChange={(e) => setForm({ ...form, privacyPolicyUrl: e.target.value })} /></Field><button className={primaryButton} disabled={saving}><Save className="h-4 w-4" />{saving ? 'Salvando...' : 'Salvar configurações'}</button></form></> }

function OperationalFormModal({ kind, tenants, modules, saving, onClose, onSave }: any) { const [data, setData] = useState<any>(kind === 'lead' ? { status: 'NOVO', source: 'MANUAL' } : kind === 'finance' ? { type: 'RECEBER', status: 'PENDENTE' } : kind === 'support' ? { status: 'ABERTO', priority: 'NORMAL' } : { role: 'ADMIN_EMPRESA', status: 'Ativo', permissions: [], pontoAccess: 'TOTAL', externalEmployeeId: '' }); const title = kind === 'lead' ? 'Novo lead' : kind === 'finance' ? 'Novo lançamento financeiro' : kind === 'support' ? 'Novo atendimento' : 'Criar acesso RH-MIL / Ponto'; const submit = async (event: React.FormEvent) => { event.preventDefault(); const tenant = tenants.find((item: ClientTenant) => item.id === data.companyId); await onSave({ ...data, companyName: data.companyName || tenant?.companyName, displayName: data.displayName || data.name, modules: tenant?.modules || {}, tipoUsuario: data.role === 'ADMIN_EMPRESA' ? 'ADMIN_EMPRESA' : 'EMPRESA' }); }; return <Dialog title={title} onClose={onClose}><form onSubmit={submit} className="space-y-3">{kind === 'lead' && <><Field label="Nome"><input required className={inputClass} value={data.name || ''} onChange={(e) => setData({ ...data, name: e.target.value })} /></Field><Field label="Empresa"><input className={inputClass} value={data.companyName || ''} onChange={(e) => setData({ ...data, companyName: e.target.value })} /></Field><Field label="CNPJ"><input className={inputClass} value={data.cnpj || ''} onChange={(e) => setData({ ...data, cnpj: e.target.value })} /></Field><Field label="E-mail"><input required type="email" className={inputClass} value={data.email || ''} onChange={(e) => setData({ ...data, email: e.target.value })} /></Field><Field label="Telefone"><input className={inputClass} value={data.phone || ''} onChange={(e) => setData({ ...data, phone: e.target.value })} /></Field><Field label="Interesse"><textarea className={inputClass} value={data.interest || ''} onChange={(e) => setData({ ...data, interest: e.target.value })} /></Field></>}{kind === 'finance' && <><Field label="Tipo"><select className={inputClass} value={data.type} onChange={(e) => setData({ ...data, type: e.target.value })}><option value="RECEBER">Conta a receber</option><option value="PAGAR">Conta a pagar</option></select></Field><Field label="Descrição"><input required className={inputClass} value={data.description || ''} onChange={(e) => setData({ ...data, description: e.target.value })} /></Field><Field label="Empresa / fornecedor"><select className={inputClass} value={data.companyId || ''} onChange={(e) => setData({ ...data, companyId: e.target.value })}><option value="">Plataforma / fornecedor externo</option>{tenants.map((tenant: ClientTenant) => <option key={tenant.id} value={tenant.id}>{tenant.companyName}</option>)}</select></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="Valor"><input required type="number" min="0.01" step="0.01" className={inputClass} value={data.amount || ''} onChange={(e) => setData({ ...data, amount: Number(e.target.value) })} /></Field><Field label="Vencimento"><input required type="date" className={inputClass} value={data.dueDate || ''} onChange={(e) => setData({ ...data, dueDate: e.target.value })} /></Field></div></>}{kind === 'support' && <><Field label="Empresa"><select required className={inputClass} value={data.companyId || ''} onChange={(e) => setData({ ...data, companyId: e.target.value })}><option value="">Selecione</option>{tenants.map((tenant: ClientTenant) => <option key={tenant.id} value={tenant.id}>{tenant.companyName}</option>)}</select></Field><Field label="Assunto"><input required className={inputClass} value={data.subject || ''} onChange={(e) => setData({ ...data, subject: e.target.value })} /></Field><Field label="Descrição"><textarea required className={inputClass} value={data.description || ''} onChange={(e) => setData({ ...data, description: e.target.value })} /></Field></>}{kind === 'user' && <><Field label="Nome"><input required className={inputClass} value={data.displayName || ''} onChange={(e) => setData({ ...data, displayName: e.target.value })} /></Field><Field label="E-mail"><input required type="email" className={inputClass} value={data.email || ''} onChange={(e) => setData({ ...data, email: e.target.value })} /></Field><Field label="Senha temporária"><input required minLength={8} type="password" className={inputClass} value={data.password || ''} onChange={(e) => setData({ ...data, password: e.target.value })} /></Field><Field label="Empresa"><select required className={inputClass} value={data.companyId || ''} onChange={(e) => setData({ ...data, companyId: e.target.value })}><option value="">Selecione</option>{tenants.map((tenant: ClientTenant) => <option key={tenant.id} value={tenant.id}>{tenant.companyName}</option>)}</select></Field><Field label="Perfil"><select className={inputClass} value={data.role} onChange={(e) => setData({ ...data, role: e.target.value })}><option value="ADMIN_EMPRESA">Administrador da empresa</option><option value="RH">RH</option><option value="DP">Departamento Pessoal</option><option value="RECRUTADOR">Recrutador</option><option value="HEADHUNTER">Headhunter</option><option value="FINANCEIRO">Financeiro</option></select></Field><Field label="Acesso no sistema de Ponto"><select className={inputClass} value={data.pontoAccess || 'SEM_ACESSO'} onChange={(e) => setData({ ...data, pontoAccess: e.target.value })}><option value="SEM_ACESSO">Sem acesso ao Ponto</option><option value="TOTAL">Acesso total ao Ponto</option><option value="PONTO_ESPELHO">Bater ponto e consultar espelho</option></select></Field>{data.pontoAccess === 'PONTO_ESPELHO' && <Field label="ID do colaborador no RH-MIL (opcional se o e-mail for o mesmo)"><input className={inputClass} value={data.externalEmployeeId || ''} onChange={(e) => setData({ ...data, externalEmployeeId: e.target.value })} placeholder="ID do colaborador" /></Field>}<Field label="Permissões"><div className="grid gap-2 sm:grid-cols-2">{modules.map((module: PlatformModule) => <label key={module.key} className="flex items-center gap-2 rounded-lg border border-slate-800 p-2 text-xs"><input type="checkbox" checked={(data.permissions || []).includes(module.key)} onChange={(e) => setData({ ...data, permissions: e.target.checked ? [...(data.permissions || []), module.key] : (data.permissions || []).filter((item: string) => item !== module.key) })} />{module.name}</label>)}</div></Field></>}<button disabled={saving} className={`${primaryButton} w-full`}>{saving ? 'Salvando...' : 'Salvar no Firebase'}</button></form></Dialog> }

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1.5 text-xs font-bold text-slate-300"><span>{label}</span>{children}</label>; }
function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <div className="relative max-w-xl"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" /><input className={`${inputClass} pl-9`} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Buscar..." /></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 text-xl font-black text-white">{value}</p></div>; }

// MASTER_INTEGRATIONS_LIVE_V5
