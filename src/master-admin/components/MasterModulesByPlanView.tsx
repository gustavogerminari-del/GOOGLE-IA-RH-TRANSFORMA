import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Check, 
  X, 
  Edit3, 
  Copy, 
  Trash2, 
  Power, 
  Layers, 
  Grid, 
  Table, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  DollarSign, 
  Crown, 
  Sparkles, 
  Briefcase, 
  Users, 
  Calendar, 
  Globe, 
  ShieldCheck, 
  BarChart3, 
  FileText, 
  Clock, 
  CreditCard, 
  Lock, 
  UserSearch, 
  HelpCircle,
  Save
} from 'lucide-react';
import { 
  SystemModule, 
  PlanConfig, 
  fetchModulosFirestore, 
  fetchPlansFirestore, 
  toggleModuloStatusFirestore, 
  duplicateModuloFirestore, 
  deleteModuloFirestore, 
  savePlanModulesFirestore,
  savePlanFirestore,
  deletePlanFirestore 
} from '../../services/ModuleCatalogService';
import { MasterModuleModal } from './MasterModuleModal';

const ICON_MAP: Record<string, any> = {
  UserSearch,
  Briefcase,
  Users,
  Sparkles,
  Globe,
  ShieldCheck,
  Calendar,
  BarChart3,
  FileText,
  Clock,
  CreditCard,
  Lock
};

export const MasterModulesByPlanView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'matrix'>('catalog');
  
  const [modules, setModules] = useState<SystemModule[]>([]);
  const [plans, setPlans] = useState<PlanConfig[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters for Catalog
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState('Todos');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<SystemModule | null>(null);

  // Deleting module state
  const [deletingModuleId, setDeletingModuleId] = useState<string | null>(null);

  // Planos comerciais
  const [planEditorOpen, setPlanEditorOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null);
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planUsers, setPlanUsers] = useState('');
  const [planJobs, setPlanJobs] = useState('');
  const [planEmployees, setPlanEmployees] = useState('');
  const [planActive, setPlanActive] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);

  // Saving matrix state
  const [isSavingMatrix, setIsSavingMatrix] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [modList, planList] = await Promise.all([
        fetchModulosFirestore(false),
        fetchPlansFirestore()
      ]);
      setModules(modList);
      setPlans(planList);
    } catch (err: any) {
      console.error('Erro ao carregar catálogo e planos do Firestore:', err);
      setError(`Erro ao carregar dados do Firestore: ${err?.message || String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleOpenCreateModal = () => {
    setEditingModule(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (mod: SystemModule) => {
    setEditingModule(mod);
    setIsModalOpen(true);
  };

  const handleModuleSaved = (savedMod: SystemModule) => {
    showToast(`Módulo "${savedMod.nome}" salvo com sucesso no Firestore!`);
    loadData();
  };

  const resetPlanForm = () => {
    setEditingPlan(null);
    setPlanName('');
    setPlanDescription('');
    setPlanPrice('');
    setPlanUsers('');
    setPlanJobs('');
    setPlanEmployees('');
    setPlanActive(true);
  };

  const openCreatePlan = () => {
    resetPlanForm();
    setPlanEditorOpen(true);
  };

  const openEditPlan = (plan: PlanConfig) => {
    setEditingPlan(plan);
    setPlanName(plan.nome || '');
    setPlanDescription(plan.descricao || '');
    setPlanPrice(String(plan.preco ?? 0));
    setPlanUsers(plan.limites?.usuarios != null ? String(plan.limites.usuarios) : '');
    setPlanJobs(plan.limites?.vagas != null ? String(plan.limites.vagas) : '');
    setPlanEmployees(plan.limites?.colaboradores != null ? String(plan.limites.colaboradores) : '');
    setPlanActive(plan.ativo !== false);
    setPlanEditorOpen(true);
  };

  const makePlanId = (name: string) => name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const savePlan = async () => {
    const nome = planName.trim();
    if (!nome) { alert('Informe o nome do plano.'); return; }
    const preco = Number(String(planPrice || '0').replace(',', '.'));
    if (!Number.isFinite(preco) || preco < 0) { alert('Informe um preço válido para o plano.'); return; }
    const id = editingPlan?.id || makePlanId(nome);
    if (!id) { alert('Não foi possível gerar o identificador do plano.'); return; }
    const numberOrUndefined = (value: string) => value.trim() === '' ? undefined : Math.max(0, Number(value));
    const usuarios = numberOrUndefined(planUsers);
    const vagas = numberOrUndefined(planJobs);
    const colaboradores = numberOrUndefined(planEmployees);
    if ([usuarios, vagas, colaboradores].some((value) => value !== undefined && !Number.isFinite(value))) {
      alert('Os limites do plano precisam ser números válidos.');
      return;
    }
    setSavingPlan(true);
    try {
      await savePlanFirestore({
        id,
        nome,
        descricao: planDescription.trim(),
        preco,
        modulos: editingPlan?.modulos || [],
        limites: { usuarios, vagas, colaboradores },
        ativo: planActive,
      });
      showToast(`Plano "${nome}" salvo com sucesso. Agora marque os módulos na matriz.`);
      setPlanEditorOpen(false);
      resetPlanForm();
      await loadData();
      setActiveTab('matrix');
    } catch (err: any) {
      alert(`Erro ao salvar plano: ${err?.message || err}`);
    } finally {
      setSavingPlan(false);
    }
  };

  const removePlan = async (plan: PlanConfig) => {
    if (!window.confirm(`Excluir o plano "${plan.nome}"? As empresas existentes não serão apagadas.`)) return;
    try {
      await deletePlanFirestore(plan.id);
      showToast(`Plano "${plan.nome}" excluído.`);
      await loadData();
    } catch (err: any) {
      alert(`Erro ao excluir plano: ${err?.message || err}`);
    }
  };

  const handleToggleStatus = async (mod: SystemModule) => {
    try {
      const newStatus = await toggleModuloStatusFirestore(mod.key, mod.ativo);
      await loadData();
      showToast(newStatus
        ? `Módulo "${mod.nome}" reativado no catálogo. Libere novamente nos planos/empresas desejados.`
        : `Módulo "${mod.nome}" desativado globalmente em planos, empresas, menus e rotas.`);
    } catch (err: any) {
      alert(`Erro ao alterar status do módulo: ${err?.message || err}`);
    }
  };

  const handleDuplicate = async (mod: SystemModule) => {
    try {
      const duplicated = await duplicateModuloFirestore(mod);
      showToast(`Módulo "${duplicated.nome}" duplicado com sucesso!`);
      loadData();
    } catch (err: any) {
      alert(`Erro ao duplicar módulo: ${err?.message || err}`);
    }
  };

  const handleDelete = async (mod: SystemModule) => {
    if (!window.confirm(`Tem certeza que deseja excluir o módulo "${mod.nome}" do catálogo? Essa ação não poderá ser desfeita.`)) {
      return;
    }
    setDeletingModuleId(mod.key);
    try {
      await deleteModuloFirestore(mod.key);
      showToast(`Módulo "${mod.nome}" excluído do Firestore.`);
      setModules(prev => prev.filter(m => m.key !== mod.key));
    } catch (err: any) {
      alert(`Erro ao excluir módulo: ${err?.message || err}`);
    } finally {
      setDeletingModuleId(null);
    }
  };

  // Matrix Checkbox Toggle
  const handleToggleMatrixModule = async (planId: string, moduleKey: string) => {
    const targetPlan = plans.find(p => p.id === planId);
    if (!targetPlan) return;

    const isCurrentlyIncluded = targetPlan.modulos.includes(moduleKey);
    const updatedModules = isCurrentlyIncluded
      ? targetPlan.modulos.filter(k => k !== moduleKey)
      : [...targetPlan.modulos, moduleKey];

    // Local optimistic update
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, modulos: updatedModules } : p));

    // Save to Firestore
    try {
      await savePlanModulesFirestore(planId, updatedModules);
      showToast(`Plano "${targetPlan.nome}" atualizado no Firestore.`);
    } catch (err: any) {
      console.error('Erro ao salvar alteração da matriz no Firestore:', err);
      // Revert
      setPlans(prev => prev.map(p => p.id === planId ? targetPlan : p));
      alert(`Falha ao salvar no Firestore: ${err?.message || err}`);
    }
  };

  // Filtered Catalog List
  const categories = Array.from(new Set(modules.map(m => m.categoria).filter(Boolean)));

  const filteredModules = modules.filter(m => {
    const matchesSearch = 
      m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'Todas' || m.categoria === selectedCategory;
    
    const matchesStatus = 
      selectedStatus === 'Todos' ||
      (selectedStatus === 'Ativos' && m.ativo) ||
      (selectedStatus === 'Inativos' && !m.ativo);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Top Bar: Tabs + Criar Novo Módulo Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Catálogo de Módulos</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-slate-900/60 rounded-full">
              {modules.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'matrix'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Vinculação aos Planos (Matriz)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl transition-colors cursor-pointer"
            title="Recarregar catálogo do Firestore"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Módulo</span>
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="p-12 text-center text-slate-400 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-xs font-semibold">Consultando coleção <code className="text-amber-300">modulos</code> e <code className="text-amber-300">planos</code> no Firestore...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1.5 bg-red-500 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* VIEW 1: CATÁLOGO DE MÓDULOS */}
      {!isLoading && !error && activeTab === 'catalog' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, identificador ou descrição..."
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:border-amber-500 outline-none"
              >
                <option value="Todas">Todas as Categorias ({categories.length})</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:border-amber-500 outline-none"
              >
                <option value="Todos">Todos os Status</option>
                <option value="Ativos">Apenas Ativos</option>
                <option value="Inativos">Apenas Inativos</option>
              </select>
            </div>
          </div>

          {/* Empty Search Result */}
          {filteredModules.length === 0 && (
            <div className="p-8 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
              <p className="text-xs font-bold text-slate-300">Nenhum módulo encontrado com os filtros aplicados.</p>
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setSelectedCategory('Todas'); setSelectedStatus('Todos'); }}
                className="mt-2 text-xs text-amber-400 font-semibold hover:underline cursor-pointer"
              >
                Limpar filtros
              </button>
            </div>
          )}

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredModules.map((mod) => {
              const IconComponent = ICON_MAP[mod.icone] || Briefcase;
              const isDeleting = deletingModuleId === mod.key;

              return (
                <div
                  key={mod.key}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-4 bg-slate-900 ${
                    mod.ativo
                      ? 'border-slate-800 hover:border-slate-700'
                      : 'border-slate-800/60 opacity-60 bg-slate-950/50'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl border ${
                          mod.ativo
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-white leading-tight">
                            {mod.nome}
                          </h3>
                          <span className="text-[10px] font-mono text-amber-300/80 block mt-0.5">
                            {mod.key}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        mod.ativo
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        {mod.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {mod.descricao}
                    </p>

                    {/* Metadata Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      <span className="text-[10px] px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 font-semibold rounded-md">
                        {mod.categoria}
                      </span>

                      {mod.precoAdicional ? (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold rounded-md">
                          +R$ {mod.precoAdicional}/mês
                        </span>
                      ) : mod.gratuito ? (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold rounded-md">
                          Gratuito
                        </span>
                      ) : null}

                      {mod.enterprise && (
                        <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold rounded-md flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-400" /> Enterprise
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(mod)}
                      className={`p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                        mod.ativo
                          ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                          : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                      title={mod.ativo ? 'Desativar módulo' : 'Ativar módulo'}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span className="text-[11px]">{mod.ativo ? 'Desativar' : 'Ativar'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDuplicate(mod)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Duplicar módulo"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(mod)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Editar módulo"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(mod)}
                        disabled={isDeleting}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Excluir módulo"
                      >
                        {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Planos comerciais configuráveis */}
      {!isLoading && !error && activeTab === 'matrix' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Planos Comerciais</h3>
              <p className="text-xs text-slate-400 mt-0.5">Crie o plano, defina preço e limites e depois marque exatamente os módulos incluídos na matriz abaixo.</p>
            </div>
            <button type="button" onClick={openCreatePlan} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl flex items-center gap-2">
              <Plus className="w-4 h-4" /> Criar Plano
            </button>
          </div>

          {planEditorOpen && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-slate-950/70 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-white">{editingPlan ? 'Editar Plano' : 'Novo Plano'}</h4>
                <button type="button" onClick={() => { setPlanEditorOpen(false); resetPlanForm(); }} className="p-1.5 text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="Nome do plano" className="text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" />
                <input value={planPrice} onChange={(e) => setPlanPrice(e.target.value)} inputMode="decimal" placeholder="Preço mensal (R$)" className="text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" />
              </div>
              <textarea value={planDescription} onChange={(e) => setPlanDescription(e.target.value)} placeholder="Descrição do plano" rows={2} className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-amber-500" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input value={planUsers} onChange={(e) => setPlanUsers(e.target.value)} inputMode="numeric" placeholder="Limite de usuários" className="text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white" />
                <input value={planJobs} onChange={(e) => setPlanJobs(e.target.value)} inputMode="numeric" placeholder="Limite de vagas" className="text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white" />
                <input value={planEmployees} onChange={(e) => setPlanEmployees(e.target.value)} inputMode="numeric" placeholder="Limite de colaboradores" className="text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <input type="checkbox" checked={planActive} onChange={(e) => setPlanActive(e.target.checked)} className="accent-amber-500" /> Plano ativo
                </label>
                <button type="button" onClick={savePlan} disabled={savingPlan} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 text-xs font-extrabold rounded-xl flex items-center justify-center gap-2">
                  {savingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar Plano
                </button>
              </div>
            </div>
          )}

          {plans.length === 0 ? (
            <div className="p-5 text-center rounded-xl border border-dashed border-slate-700 text-slate-400 text-xs">Nenhum plano criado ainda. Toque em <b className="text-amber-300">Criar Plano</b>.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {plans.map((plan) => (
                <div key={plan.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/70">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2"><h4 className="text-sm font-bold text-white">{plan.nome}</h4><span className={`text-[10px] px-2 py-0.5 rounded-full border ${plan.ativo !== false ? 'text-emerald-400 border-emerald-500/30' : 'text-slate-500 border-slate-700'}`}>{plan.ativo !== false ? 'Ativo' : 'Inativo'}</span></div>
                      <p className="text-xs text-amber-400 font-bold mt-1">R$ {Number(plan.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</p>
                      <p className="text-[11px] text-slate-500 mt-1">{plan.modulos.length} módulo(s) incluído(s)</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => openEditPlan(plan)} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => removePlan(plan)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: MATRIZ DE VINCULAÇÃO AOS PLANOS */}
      {!isLoading && !error && activeTab === 'matrix' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">Matriz de Habilitação de Módulos por Plano Comercial</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Marque ou desmarque os módulos incluídos em cada plano. As alterações são salvas na coleção <code className="text-amber-300 font-mono">planos</code>.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-300 border-b border-slate-800">
                  <th className="p-3 font-bold">Módulo da Plataforma</th>
                  <th className="p-3 text-slate-400">Categoria</th>
                  {plans.map((pl) => (
                    <th key={pl.id} className="p-3 text-center min-w-[120px]">
                      <span className="font-extrabold text-white block">{pl.nome}</span>
                      <span className="text-[10px] text-amber-400 font-semibold block">R$ {pl.preco}/mês</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {modules.map((mod) => (
                  <tr key={mod.key} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-white">{mod.nome}</span>
                        {!mod.ativo && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-red-500/10 text-red-400 border border-red-500/30 rounded font-semibold">
                            Inativo
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 block">{mod.key}</span>
                    </td>

                    <td className="p-3 text-slate-400 font-medium text-[11px]">
                      {mod.categoria}
                    </td>

                    {plans.map((pl) => {
                      const isIncluded = pl.modulos.includes(mod.key);
                      return (
                        <td key={pl.id} className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleMatrixModule(pl.id, mod.key)}
                            className={`w-6 h-6 rounded-lg border inline-flex items-center justify-center transition-all cursor-pointer ${
                              isIncluded
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-2xs'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-600'
                            }`}
                            title={`${isIncluded ? 'Remover' : 'Incluir'} "${mod.nome}" no plano "${pl.nome}"`}
                          >
                            {isIncluded && <Check className="w-4 h-4 stroke-[3]" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Master Module Create/Edit Modal */}
      <MasterModuleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleModuleSaved}
        initialModule={editingModule}
        existingModules={modules}
      />

    </div>
  );
};
