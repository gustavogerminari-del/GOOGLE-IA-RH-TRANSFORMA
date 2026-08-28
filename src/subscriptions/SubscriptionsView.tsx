import React, { useState } from 'react';
import { 
  CreditCard, 
  Building2, 
  Clock, 
  TrendingUp, 
  Lock, 
  Unlock, 
  DollarSign, 
  PlusCircle, 
  Sliders
} from 'lucide-react';
import { ClientSubscription, BillingInvoice, PlanTier, ModuleAccessConfig } from './types';
import { saveTenantAsync, updateTenantModule } from '../master-admin/masterTenantsStore';
import { SubscriptionService } from '../services/SubscriptionService';
import { ModuleService } from '../services/ModuleService';

export const SubscriptionsView: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<ClientSubscription[]>([]);
  const [invoices] = useState<BillingInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSubModal, setShowNewSubModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCnpj, setNewCnpj] = useState('');
  const [newPlanTier, setNewPlanTier] = useState<PlanTier>('Professional');
  const [newMrrValue, setNewMrrValue] = useState(1200);

  React.useEffect(() => {
    let isMounted = true;
    SubscriptionService.list().then(subs => {
      if (isMounted) {
        setSubscriptions(subs || []);
        setLoading(false);
      }
    }).catch(err => {
      console.warn('Erro ao carregar assinaturas:', err);
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  // Calculate MRR & ARR
  const totalMRR = subscriptions.reduce((acc, s) => acc + s.mrrValue, 0);
  const totalARR = totalMRR * 12;
  const expiringSoonSubs = subscriptions.filter(s => {
    const exp = new Date(s.contractExpiration);
    const now = new Date();
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 35 && diffDays >= 0;
  });

  // Toggle Module Permission
  const handleToggleModule = async (subId: string, moduleKey: keyof ModuleAccessConfig) => {
    const targetSub = subscriptions.find(s => s.id === subId);
    if (!targetSub) return;

    const nextState = !targetSub.modulesEnabled[moduleKey];

    const updatedModules = {
      ...targetSub.modulesEnabled,
      [moduleKey]: nextState
    };

    await SubscriptionService.update(subId, {
      modulesEnabled: updatedModules
    });

    const empresaId = (targetSub as ClientSubscription & { companyId?: string }).companyId || (subId.startsWith('sub-') ? `t-${subId.replace('sub-', '')}` : subId);
    await ModuleService.setCompanyModule(empresaId, moduleKey as string, nextState);
    await updateTenantModule(empresaId, moduleKey as string, nextState);

    setSubscriptions(subscriptions.map(s => {
      if (s.id === subId) {
        return {
          ...s,
          modulesEnabled: updatedModules
        };
      }
      return s;
    }));
  };

  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName) return;

    const newSubData: Partial<ClientSubscription> = {
      companyName: newCompanyName,
      cnpj: newCnpj || '00.000.000/0001-00',
      planTier: newPlanTier,
      mrrValue: newMrrValue,
      billingCycle: 'Mensal',
      paymentStatus: 'Em Dia / Ativo',
      modulesEnabled: {
        vagas: true,
        bancoTalentos: true,
        entrevistas: true,
        equipeInterna: true,
        consultoriaRH: newPlanTier === 'Enterprise' || newPlanTier === 'Custom Consultoria',
        feriasBeneficios: true,
        documentosAssinatura: true,
        auditoriaLogs: newPlanTier === 'Enterprise'
      },
      userLimit: newPlanTier === 'Enterprise' ? 50 : 10,
      activeUsersCount: 1
    };

    const newTenantId = `t-${Date.now()}`;
    const newSub = await SubscriptionService.create({ ...newSubData, companyId: newTenantId });
    setSubscriptions([...subscriptions, newSub]);

    // Sync with Master Admin Tenant store and Firestore
    await saveTenantAsync({
      id: newTenantId,
      code: newCompanyName.substring(0, 5).toUpperCase().replace(/\s/g, ''),
      companyName: newCompanyName,
      tradeName: newCompanyName,
      cnpj: newSub.cnpj,
      ownerName: 'Administrador Responsável',
      ownerEmail: `admin@${newCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br`,
      ownerPhone: '(11) 98888-7777',
      address: {
        cep: '01310-100',
        street: 'Avenida Paulista',
        number: '1000',
        complement: 'Conjunto 50',
        neighborhood: 'Bela Vista',
        cityUf: 'São Paulo / SP'
      },
      status: 'Ativo',
      maxUsers: newSub.userLimit,
      maxActiveJobs: 20,
      modules: {
        vagas: true,
        bancoTalentos: true,
        entrevistas: true,
        equipeInterna: true,
        consultorRH: newSub.modulesEnabled.consultoriaRH,
        feriasBeneficios: true,
        documentosAssinatura: true,
        auditoriaLogs: newSub.modulesEnabled.auditoriaLogs,
        relatoriosAvancados: true,
        siteVagasPersonalizado: true,
        implantacaoMigracao: true
      },
      branding: {
        primaryColor: '#4F46E5',
        companyDisplayName: newCompanyName,
        customDomain: ''
      },
      metrics: {
        activeUsersCount: 1,
        totalJobsCreated: 0,
        totalTalentsStored: 0,
        totalDocumentsSigned: 0,
        storageUsedMB: 10,
        lastLoginAt: 'Agora'
      },
      contract: {
        id: `ctr-${Date.now()}`,
        contractNumber: `CTR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        planName: newPlanTier === 'Enterprise' ? 'Completo / Enterprise' : 'Intermediário',
        monthlyFee: newMrrValue,
        billingCycle: 'Mensal',
        startDate: newSub.contractStart,
        expirationDate: newSub.contractExpiration,
        paymentMethod: 'Pix',
        autoRenew: true
      },
      createdAt: new Date().toISOString().split('T')[0],
      notes: 'Empresa criada via Módulo de Assinaturas SaaS'
    });

    setShowNewSubModal(false);
    setNewCompanyName('');
    setNewCnpj('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-400/30">
              Módulo Gestão SaaS & Licenciamento
            </span>
            <span className="text-xs text-slate-400">• Firebase Firestore Integrated</span>
          </div>
          <h1 className="text-2xl font-black mt-1 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-indigo-400" />
            Controle de Assinaturas & Módulos Liberados
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Gerencie o ciclo de vida dos contratos, libere módulos às empresas e acompanhe renovações de faturamento.
          </p>
        </div>

        <button
          onClick={() => setShowNewSubModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2 border border-indigo-400/30"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nova Assinatura / Cliente</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 flex items-center justify-between">
            MRR Ativo (Mensal)
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </span>
          <p className="text-2xl font-black text-slate-900">
            R$ {totalMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
            +14% vs mês anterior
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 flex items-center justify-between">
            ARR Projetado (Anual)
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </span>
          <p className="text-2xl font-black text-slate-900">
            R$ {totalARR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
            Base 100% adimplente
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 flex items-center justify-between">
            Total de Empresas
            <Building2 className="w-4 h-4 text-slate-600" />
          </span>
          <p className="text-2xl font-black text-slate-900">{subscriptions.length}</p>
          <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-md inline-block">
            Clientes ativos
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold text-slate-500 flex items-center justify-between">
            Vencimentos Próximos
            <Clock className="w-4 h-4 text-amber-600" />
          </span>
          <p className="text-2xl font-black text-amber-600">{expiringSoonSubs.length}</p>
          <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md inline-block">
            Exigem renovação
          </span>
        </div>
      </div>

      {/* Subscriptions Table with Module Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-900">Matriz de Relacionamento: Empresas x Módulos Liberados</h3>
            <p className="text-xs text-slate-500">
              Clique nas chaves abaixo para liberar ou revogar módulos instantaneamente para cada empresa em tempo real no Firestore.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                <th className="p-3">Empresa & Plano</th>
                <th className="p-3">Recrutamento</th>
                <th className="p-3">Banco Talentos</th>
                <th className="p-3">Entrevistas</th>
                <th className="p-3">DP / Colaboradores</th>
                <th className="p-3">Benefícios</th>
                <th className="p-3">Consultoria RH</th>
                <th className="p-3">Documentos</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {subscriptions.map(sub => (
                <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{sub.companyName}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <span>CNPJ: {sub.cnpj}</span>
                      <span>•</span>
                      <span className="font-extrabold text-indigo-600">{sub.planTier}</span>
                    </div>
                  </td>

                  {/* Recrutamento / Vagas */}
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleModule(sub.id, 'vagas')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                        sub.modulesEnabled.vagas 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {sub.modulesEnabled.vagas ? <Unlock className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-slate-400" />}
                      <span>{sub.modulesEnabled.vagas ? 'Liberado' : 'Bloqueado'}</span>
                    </button>
                  </td>

                  {/* Banco Talentos */}
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleModule(sub.id, 'bancoTalentos')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                        sub.modulesEnabled.bancoTalentos 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {sub.modulesEnabled.bancoTalentos ? <Unlock className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-slate-400" />}
                      <span>{sub.modulesEnabled.bancoTalentos ? 'Liberado' : 'Bloqueado'}</span>
                    </button>
                  </td>

                  {/* Entrevistas */}
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleModule(sub.id, 'entrevistas')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                        sub.modulesEnabled.entrevistas 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {sub.modulesEnabled.entrevistas ? <Unlock className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-slate-400" />}
                      <span>{sub.modulesEnabled.entrevistas ? 'Liberado' : 'Bloqueado'}</span>
                    </button>
                  </td>

                  {/* DP / Colaboradores */}
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleModule(sub.id, 'equipeInterna')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                        sub.modulesEnabled.equipeInterna 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {sub.modulesEnabled.equipeInterna ? <Unlock className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-slate-400" />}
                      <span>{sub.modulesEnabled.equipeInterna ? 'Liberado' : 'Bloqueado'}</span>
                    </button>
                  </td>

                  {/* Benefícios */}
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleModule(sub.id, 'feriasBeneficios')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                        sub.modulesEnabled.feriasBeneficios 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {sub.modulesEnabled.feriasBeneficios ? <Unlock className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-slate-400" />}
                      <span>{sub.modulesEnabled.feriasBeneficios ? 'Liberado' : 'Bloqueado'}</span>
                    </button>
                  </td>

                  {/* Consultoria RH */}
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleModule(sub.id, 'consultoriaRH')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                        sub.modulesEnabled.consultoriaRH 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {sub.modulesEnabled.consultoriaRH ? <Unlock className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-slate-400" />}
                      <span>{sub.modulesEnabled.consultoriaRH ? 'Liberado' : 'Bloqueado'}</span>
                    </button>
                  </td>

                  {/* Documentos Assinatura */}
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleModule(sub.id, 'documentosAssinatura')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all ${
                        sub.modulesEnabled.documentosAssinatura 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {sub.modulesEnabled.documentosAssinatura ? <Unlock className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-slate-400" />}
                      <span>{sub.modulesEnabled.documentosAssinatura ? 'Liberado' : 'Bloqueado'}</span>
                    </button>
                  </td>

                  <td className="p-3 text-right font-bold text-slate-800">
                    R$ {sub.mrrValue.toLocaleString('pt-BR')}/mês
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Assinatura */}
      {showNewSubModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Cadastrar Nova Assinatura de Empresa</h3>

            <form onSubmit={handleCreateSub} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Razão Social / Nome Fantasia *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: TechInnovate Soluções S/A"
                  value={newCompanyName}
                  onChange={e => setNewCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">CNPJ</label>
                <input
                  type="text"
                  placeholder="00.000.000/0001-00"
                  value={newCnpj}
                  onChange={e => setNewCnpj(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Plano do Contrato</label>
                <select
                  value={newPlanTier}
                  onChange={e => {
                    const tier = e.target.value as PlanTier;
                    setNewPlanTier(tier);
                    if (tier === 'Starter') setNewMrrValue(490);
                    else if (tier === 'Professional') setNewMrrValue(1200);
                    else if (tier === 'Enterprise') setNewMrrValue(3500);
                    else if (tier === 'Custom Consultoria') setNewMrrValue(5800);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800"
                >
                  <option value="Starter">Starter (R$ 490/mês)</option>
                  <option value="Professional">Professional (R$ 1.200/mês)</option>
                  <option value="Enterprise">Enterprise Corp (R$ 3.500/mês)</option>
                  <option value="Custom Consultoria">Custom Consultoria (R$ 5.800/mês)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Valor Mensal (MRR)</label>
                <input
                  type="number"
                  value={newMrrValue}
                  onChange={e => setNewMrrValue(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-extrabold text-indigo-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewSubModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-extrabold text-white cursor-pointer shadow-md"
                >
                  Confirmar e Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
