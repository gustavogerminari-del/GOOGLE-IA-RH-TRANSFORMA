import React, { useState, useEffect } from 'react';
import { formatFirestoreDate } from '../../lib/firestoreUtils';
import { 
  Gift, 
  Plus, 
  Users, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  Search,
  Filter,
  Layers,
  History,
  FileText,
  AlertCircle,
  X,
  UserCheck,
  Building2,
  DollarSign,
  Briefcase,
  Play,
  Pause,
  Ban,
  Check,
  Calendar
} from 'lucide-react';
import { 
  ItemBeneficio, 
  ColaboradorCompleto, 
  BeneficioColaboradorIndividual, 
  HistoricoAlteracaoBeneficio,
  StatusBeneficioIndividual
} from '../types/dp';
import { 
  getEmployeeBenefitsFirestore, 
  saveEmployeeBenefitFirestore, 
  updateEmployeeBenefitStatusFirestore, 
  applyMassBenefitsFirestore, 
  getHistoricoBeneficiosFirestore,
  deleteBeneficioFirestore
} from '../services/dpFirestoreService';

interface GestaoBeneficiosProps {
  beneficios: ItemBeneficio[];
  colaboradores: ColaboradorCompleto[];
  onSalvarBeneficio: (beneficio: ItemBeneficio) => void;
  companyId: string;
}

export const GestaoBeneficios: React.FC<GestaoBeneficiosProps> = ({
  beneficios,
  colaboradores,
  onSalvarBeneficio,
  companyId
}) => {
  const [activeTab, setActiveTab] = useState<'catalogo' | 'individuais' | 'massa' | 'historico'>('catalogo');
  
  // Firestore Individual Benefits State
  const [individualBenefits, setIndividualBenefits] = useState<BeneficioColaboradorIndividual[]>([]);
  const [auditHistory, setAuditHistory] = useState<HistoricoAlteracaoBeneficio[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(false);

  // Filters & Searches
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('todos');

  // Modals State
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<Partial<ItemBeneficio> | null>(null);

  const [isIndividualModalOpen, setIsIndividualModalOpen] = useState(false);
  const [editingIndividual, setEditingIndividual] = useState<Partial<BeneficioColaboradorIndividual> | null>(null);

  // Mass Concession State
  const [selectedCatalogItemMass, setSelectedCatalogItemMass] = useState<string>('');
  const [massFilterDept, setMassFilterDept] = useState<string>('todos');
  const [massFilterCargo, setMassFilterCargo] = useState<string>('todos');
  const [selectedEmployeeIdsMass, setSelectedEmployeeIdsMass] = useState<string[]>([]);
  const [massStartDate, setMassStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isExecutingMass, setIsExecutingMass] = useState(false);
  const [massFeedback, setMassFeedback] = useState<{ success: number; existing: number } | null>(null);

  // Load Extra Firestore Data (Individual Benefits & Audit History)
  const loadExtraData = async () => {
    setLoadingExtra(true);
    try {
      const [indData, histData] = await Promise.all([
        getEmployeeBenefitsFirestore(companyId),
        getHistoricoBeneficiosFirestore(companyId)
      ]);
      setIndividualBenefits(indData);
      setAuditHistory(histData);
    } catch (err) {
      console.error('[GestaoBeneficios] Erro ao carregar dados:', err);
    } finally {
      setLoadingExtra(false);
    }
  };

  useEffect(() => {
    loadExtraData();
  }, [companyId]);

  // Catalog Handlers
  const handleOpenNewCatalog = () => {
    setEditingCatalog({
      companyId,
      nome: '',
      descricao: '',
      categoria: 'Vale Refeição',
      tipoCalculo: 'Valor Fixo',
      valorBeneficio: 800.00,
      percentualDescontoFuncionario: 0,
      valorDescontoFixoFuncionario: 0,
      custoEmpresaEstimado: 800.00,
      recorrencia: 'Mensal',
      exigeDependente: false,
      exigeDocumento: false,
      ativo: true,
      fornecedor: ''
    });
    setIsCatalogModalOpen(true);
  };

  const handleOpenEditCatalog = (ben: ItemBeneficio) => {
    setEditingCatalog({ ...ben });
    setIsCatalogModalOpen(true);
  };

  const handleSaveCatalog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCatalog || !editingCatalog.nome) return;

    const saved: ItemBeneficio = {
      id: editingCatalog.id || `ben-${Date.now()}`,
      companyId: editingCatalog.companyId || companyId,
      nome: editingCatalog.nome,
      descricao: editingCatalog.descricao || '',
      categoria: editingCatalog.categoria as any || 'Outros',
      tipoCalculo: editingCatalog.tipoCalculo as any || 'Valor Fixo',
      valorBeneficio: Number(editingCatalog.valorBeneficio) || 0,
      percentualDescontoFuncionario: Number(editingCatalog.percentualDescontoFuncionario) || 0,
      valorDescontoFixoFuncionario: Number(editingCatalog.valorDescontoFixoFuncionario) || 0,
      custoEmpresaEstimado: Number(editingCatalog.custoEmpresaEstimado) || 0,
      recorrencia: editingCatalog.recorrencia || 'Mensal',
      exigeDependente: editingCatalog.exigeDependente || false,
      exigeDocumento: editingCatalog.exigeDocumento || false,
      ativo: editingCatalog.ativo ?? true,
      fornecedor: editingCatalog.fornecedor || '',
      status: editingCatalog.ativo ? 'Ativo' : 'Inativo'
    };

    onSalvarBeneficio(saved);
    setIsCatalogModalOpen(false);
  };

  const handleDeleteCatalog = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este benefício do catálogo?')) {
      await deleteBeneficioFirestore(companyId, id);
    }
  };

  // Individual Benefits Handlers
  const handleOpenNewIndividual = () => {
    setEditingIndividual({
      companyId,
      employeeId: colaboradores[0]?.id || '',
      benefitTypeId: beneficios[0]?.id || '',
      startDate: new Date().toISOString().split('T')[0],
      status: 'Ativo',
      employeeContribution: 0,
      employerContribution: beneficios[0]?.valorBeneficio || 0,
      totalValue: beneficios[0]?.valorBeneficio || 0,
      observations: ''
    });
    setIsIndividualModalOpen(true);
  };

  const handleSaveIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIndividual || !editingIndividual.employeeId || !editingIndividual.benefitTypeId) return;

    const colab = colaboradores.find(c => c.id === editingIndividual.employeeId);
    const catItem = beneficios.find(b => b.id === editingIndividual.benefitTypeId);

    const newInd: BeneficioColaboradorIndividual = {
      id: editingIndividual.id || `ben-ind-${Date.now()}`,
      companyId,
      employeeId: editingIndividual.employeeId,
      employeeName: colab?.nomeCompleto || 'Colaborador',
      employeeCpf: colab?.pessoais?.cpf,
      department: colab?.profissionais?.departamento,
      benefitTypeId: editingIndividual.benefitTypeId,
      benefitName: catItem?.nome || 'Benefício Customizado',
      category: catItem?.categoria || 'Outros',
      startDate: editingIndividual.startDate || new Date().toISOString().split('T')[0],
      endDate: editingIndividual.endDate,
      status: (editingIndividual.status as StatusBeneficioIndividual) || 'Ativo',
      employeeContribution: Number(editingIndividual.employeeContribution) || 0,
      employerContribution: Number(editingIndividual.employerContribution) || 0,
      totalValue: Number(editingIndividual.totalValue) || (catItem?.valorBeneficio || 0),
      calculationType: catItem?.tipoCalculo || 'Valor Fixo',
      observations: editingIndividual.observations || '',
      createdAt: editingIndividual.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await saveEmployeeBenefitFirestore(newInd, 'rh-user', 'Gestor de RH', 'Salvo manualmente via Central de Benefícios');
    setIsIndividualModalOpen(false);
    loadExtraData();
  };

  const handleStatusChangeIndividual = async (id: string, newStatus: StatusBeneficioIndividual) => {
    await updateEmployeeBenefitStatusFirestore(companyId, id, newStatus, 'rh-user', 'Gestor de RH', `Status alterado para ${newStatus}`);
    loadExtraData();
  };

  // Mass Assignment Execution
  const handleExecuteMassConcession = async () => {
    const catItem = beneficios.find(b => b.id === selectedCatalogItemMass);
    if (!catItem) {
      alert('Selecione um benefício do catálogo.');
      return;
    }

    const eligibleColabs = colaboradores.filter(c => selectedEmployeeIdsMass.includes(c.id));
    if (eligibleColabs.length === 0) {
      alert('Selecione ao menos um colaborador elegível.');
      return;
    }

    setIsExecutingMass(true);
    setMassFeedback(null);

    const result = await applyMassBenefitsFirestore(
      companyId,
      catItem,
      eligibleColabs,
      'rh-user',
      'Gestor de RH em Massa',
      massStartDate
    );

    setIsExecutingMass(false);
    setMassFeedback({ success: result.successCount, existing: result.existingCount });
    loadExtraData();
  };

  // Auto Select Mass Employees based on Dept/Cargo
  useEffect(() => {
    let list = colaboradores.filter(c => c.profissionais?.status !== 'Rescindido');
    if (massFilterDept !== 'todos') {
      list = list.filter(c => c.profissionais?.departamento === massFilterDept);
    }
    if (massFilterCargo !== 'todos') {
      list = list.filter(c => c.profissionais?.cargo === massFilterCargo);
    }
    setSelectedEmployeeIdsMass(list.map(c => c.id));
  }, [massFilterDept, massFilterCargo, colaboradores]);

  // Calculations for KPIs
  const totalCatCount = beneficios.length;
  const activeIndCount = individualBenefits.filter(b => b.status === 'Ativo').length;
  const totalMonthlyCompanyCost = individualBenefits
    .filter(b => b.status === 'Ativo')
    .reduce((acc, b) => acc + (b.employerContribution || 0), 0);
  const totalMonthlyEmployeeDiscount = individualBenefits
    .filter(b => b.status === 'Ativo')
    .reduce((acc, b) => acc + (b.employeeContribution || 0), 0);

  // Filtered List for Individual Benefits
  const filteredIndividualBenefits = individualBenefits.filter(b => {
    const matchesSearch = 
      (b.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.benefitName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = selectedDeptFilter === 'todos' || b.department === selectedDeptFilter;
    const matchesStatus = selectedStatusFilter === 'todos' || b.status === selectedStatusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Extract Departments & Positions for Filters
  const uniqueDepts = Array.from(new Set(colaboradores.map(c => c.profissionais?.departamento).filter(Boolean)));
  const uniqueCargos = Array.from(new Set(colaboradores.map(c => c.profissionais?.cargo).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header & Sub-tab Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Gift className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Módulo de Gestão de Benefícios</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Catálogo corporativo, concessões individuais, atribuição em massa e auditoria em tempo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'catalogo' && (
              <button
                onClick={handleOpenNewCatalog}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Benefício no Catálogo</span>
              </button>
            )}

            {activeTab === 'individuais' && (
              <button
                onClick={handleOpenNewIndividual}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Concessão Individual</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('catalogo')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'catalogo'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Catálogo da Empresa ({totalCatCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('individuais')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'individuais'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Concessões Individuais ({individualBenefits.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('massa')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'massa'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Atribuição em Massa</span>
          </button>

          <button
            onClick={() => setActiveTab('historico')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'historico'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Auditoria & Histórico ({auditHistory.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Catálogo Ativo</span>
          <div className="text-2xl font-black text-[#1E293B] mt-1">{totalCatCount} Tipos</div>
          <p className="text-[11px] text-slate-400 mt-1">Benefícios configurados na empresa</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Benefícios Ativos (Colabs)</span>
          <div className="text-2xl font-black text-purple-600 mt-1">{activeIndCount} Ativos</div>
          <p className="text-[11px] text-slate-400 mt-1">Vinculados atualmente a colaboradores</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Custo Empresa Mensal</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {totalMonthlyCompanyCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Investimento mensal líquido</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Desconto Colaboradores</span>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {totalMonthlyEmployeeDiscount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Previsão de desconto na folha</p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: CATÁLOGO DE BENEFÍCIOS                            */}
      {/* ======================================================== */}
      {activeTab === 'catalogo' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#1E293B] text-sm">Catálogo de Benefícios Oferecidos</h3>
              <p className="text-xs text-slate-500">Modelos e regras de cálculo para cada benefício da empresa.</p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              {beneficios.length} Modelos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-3.5">Nome do Benefício</th>
                  <th className="p-3.5">Categoria</th>
                  <th className="p-3.5">Tipo de Cálculo</th>
                  <th className="p-3.5">Valor Base</th>
                  <th className="p-3.5">Desconto Func. (%)</th>
                  <th className="p-3.5">Custo Estimado Empresa</th>
                  <th className="p-3.5">Fornecedor</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[#1E293B]">
                {beneficios.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                      Nenhum benefício cadastrado no catálogo para esta empresa. Clique em "Novo Benefício no Catálogo" acima.
                    </td>
                  </tr>
                ) : (
                  beneficios.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        <div>
                          <span>{b.nome}</span>
                          {b.descricao && <p className="text-[11px] text-slate-400 font-normal">{b.descricao}</p>}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">
                        <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-semibold text-[11px]">
                          {b.categoria}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">{b.tipoCalculo}</td>
                      <td className="p-3.5 font-mono font-bold">
                        {b.valorBeneficio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">
                        {b.percentualDescontoFuncionario > 0 
                          ? `${b.percentualDescontoFuncionario}% em folha` 
                          : b.valorDescontoFixoFuncionario 
                          ? `R$ ${b.valorDescontoFixoFuncionario} fixo` 
                          : 'Isento (100% Empresa)'}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-emerald-700">
                        {b.custoEmpresaEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="p-3.5 text-slate-500">{b.fornecedor || 'Próprio / Interno'}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          b.ativo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {b.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditCatalog(b)}
                            className="p-1.5 text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCatalog(b.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CONCESSÕES INDIVIDUAIS                            */}
      {/* ======================================================== */}
      {activeTab === 'individuais' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por colaborador ou benefício..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedDeptFilter}
                onChange={e => setSelectedDeptFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              >
                <option value="todos">Todos os Departamentos</option>
                {uniqueDepts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={e => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
              >
                <option value="todos">Todos os Status</option>
                <option value="Ativo">Ativo</option>
                <option value="Pendente">Pendente</option>
                <option value="Suspenso">Suspenso</option>
                <option value="Cancelado">Cancelado</option>
                <option value="Encerrado">Encerrado</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-[#1E293B] text-sm">Benefícios Vinculados aos Colaboradores</h3>
              <span className="text-xs text-slate-500">Exibindo {filteredIndividualBenefits.length} registros</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3.5">Colaborador</th>
                    <th className="p-3.5">Benefício</th>
                    <th className="p-3.5">Categoria</th>
                    <th className="p-3.5">Início</th>
                    <th className="p-3.5">Desc. Colaborador</th>
                    <th className="p-3.5">Custo Empresa</th>
                    <th className="p-3.5">Valor Total</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[#1E293B]">
                  {filteredIndividualBenefits.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                        Nenhum benefício individual encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredIndividualBenefits.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold">
                          <div>
                            <span>{b.employeeName}</span>
                            <p className="text-[11px] text-slate-400 font-normal">{b.department || 'DP General'}</p>
                          </div>
                        </td>
                        <td className="p-3.5 font-semibold text-purple-900">{b.benefitName}</td>
                        <td className="p-3.5 text-slate-600">{b.category}</td>
                        <td className="p-3.5 text-slate-500 font-mono">{b.startDate}</td>
                        <td className="p-3.5 font-mono text-blue-700 font-bold">
                          R$ {(b.employeeContribution || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 font-mono text-emerald-700 font-bold">
                          R$ {(b.employerContribution || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-900">
                          R$ {(b.totalValue || 0).toFixed(2)}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            b.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            b.status === 'Suspenso' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            b.status === 'Encerrado' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                            'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {b.status === 'Ativo' && (
                              <button
                                onClick={() => handleStatusChangeIndividual(b.id, 'Suspenso')}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                                title="Suspender"
                              >
                                <Pause className="w-4 h-4" />
                              </button>
                            )}

                            {b.status === 'Suspenso' && (
                              <button
                                onClick={() => handleStatusChangeIndividual(b.id, 'Ativo')}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                                title="Reativar"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}

                            {b.status !== 'Encerrado' && b.status !== 'Cancelado' && (
                              <button
                                onClick={() => handleStatusChangeIndividual(b.id, 'Cancelado')}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                title="Cancelar Benefício"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ATRIBUIÇÃO EM MASSA                               */}
      {/* ======================================================== */}
      {activeTab === 'massa' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-6">
          <div>
            <h3 className="font-bold text-[#1E293B] text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Concessão de Benefícios em Massa</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Atribua um benefício do catálogo simultaneamente para um grupo de colaboradores com cálculo automático de descontos e histórico de auditoria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1">1. Escolha o Benefício do Catálogo *</label>
              <select
                value={selectedCatalogItemMass}
                onChange={e => setSelectedCatalogItemMass(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option value="">-- Selecione o Benefício --</option>
                {beneficios.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.nome} ({b.categoria} - R$ {b.valorBeneficio})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1">2. Filtrar por Departamento</label>
              <select
                value={massFilterDept}
                onChange={e => setMassFilterDept(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              >
                <option value="todos">Todos os Departamentos</option>
                {uniqueDepts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1">3. Filtrar por Cargo</label>
              <select
                value={massFilterCargo}
                onChange={e => setMassFilterCargo(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              >
                <option value="todos">Todos os Cargos</option>
                {uniqueCargos.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary Impact Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-purple-50/60 border border-purple-100 rounded-xl text-xs gap-3">
            <div>
              <span className="font-bold text-purple-900">Colaboradores Elegíveis para Atribuição:</span>
              <span className="ml-2 font-black text-purple-700 text-sm">{selectedEmployeeIdsMass.length} Pessoas</span>
            </div>

            <div className="flex items-center gap-3">
              <label className="font-bold text-slate-700">Data de Início:</label>
              <input
                type="date"
                value={massStartDate}
                onChange={e => setMassStartDate(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-xs"
              />

              <button
                onClick={handleExecuteMassConcession}
                disabled={isExecutingMass || selectedEmployeeIdsMass.length === 0 || !selectedCatalogItemMass}
                className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {isExecutingMass ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Conceder em Massa</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {massFeedback && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold flex items-center justify-between">
              <span>
                Sucesso! {massFeedback.success} colaboradores receberam o benefício. {massFeedback.existing > 0 && `(${massFeedback.existing} já possuíam ativas)`}
              </span>
              <button onClick={() => setMassFeedback(null)} className="text-emerald-700 hover:text-emerald-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Employees Checklist Selection */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-3 bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-between">
              <span>Lista de Colaboradores Selecionados</span>
              <span>{selectedEmployeeIdsMass.length} de {colaboradores.length} selecionados</span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-2">
              {colaboradores
                .filter(c => c.profissionais?.status !== 'Rescindido')
                .map(colab => {
                  const isChecked = selectedEmployeeIdsMass.includes(colab.id);
                  return (
                    <label
                      key={colab.id}
                      className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedEmployeeIdsMass(prev => [...prev, colab.id]);
                            } else {
                              setSelectedEmployeeIdsMass(prev => prev.filter(id => id !== colab.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <div>
                          <p className="font-bold text-xs text-[#1E293B]">{colab.nomeCompleto}</p>
                          <p className="text-[11px] text-slate-400">{colab.profissionais?.cargo} • {colab.profissionais?.departamento}</p>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono text-slate-500">
                        Salário: R$ {(colab.profissionais?.salarioBase || 0).toLocaleString('pt-BR')}
                      </span>
                    </label>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: HISTÓRICO & AUDITORIA                             */}
      {/* ======================================================== */}
      {activeTab === 'historico' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#1E293B] text-sm">Histórico de Alterações e Concessões</h3>
              <p className="text-xs text-slate-500">Trilha de auditoria em tempo real com registros imutáveis de alterações.</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">{auditHistory.length} Eventos Gravados</span>
          </div>

          <div className="divide-y divide-slate-100">
            {auditHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-medium text-xs">
                Nenhuma alteração de benefício registrada no histórico.
              </div>
            ) : (
              auditHistory.map(evt => (
                <div key={evt.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600 mt-0.5 border border-purple-100">
                    <History className="w-4 h-4" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#1E293B]">{evt.employeeName || 'Colaborador'}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{formatFirestoreDate(evt.createdAt)}</span>
                    </div>

                    <p className="text-xs text-purple-900 font-semibold">
                      Ação: {evt.action} • {evt.benefitName}
                    </p>

                    <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg font-mono">
                      <span>Anterior: {evt.previousValue || 'N/A'}</span>
                      <span className="mx-2">➔</span>
                      <span className="text-emerald-700 font-bold">Novo: {evt.newValue}</span>
                    </div>

                    {evt.reason && (
                      <p className="text-[11px] text-slate-500 italic">
                        Motivo: {evt.reason} • Por: {evt.userName}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT CATALOG ITEM                           */}
      {/* ======================================================== */}
      {isCatalogModalOpen && editingCatalog && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-[#1E293B] text-sm">
                {editingCatalog.id ? 'Editar Benefício no Catálogo' : 'Novo Benefício Corporativo'}
              </h3>
              <button onClick={() => setIsCatalogModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCatalog} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome do Benefício *</label>
                <input
                  type="text"
                  required
                  value={editingCatalog.nome || ''}
                  onChange={e => setEditingCatalog(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="ex: Vale Refeição Flash, Plano Unimed Especial"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={editingCatalog.categoria || 'Outros'}
                    onChange={e => setEditingCatalog(prev => ({ ...prev, categoria: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    <option value="Vale Transporte">Vale Transporte</option>
                    <option value="Vale Refeição">Vale Refeição</option>
                    <option value="Vale Alimentação">Vale Alimentação</option>
                    <option value="Plano de Saúde">Plano de Saúde</option>
                    <option value="Plano Odontológico">Plano Odontológico</option>
                    <option value="Seguro de Vida">Seguro de Vida</option>
                    <option value="Auxílio Combustível">Auxílio Combustível</option>
                    <option value="Auxílio Home Office">Auxílio Home Office</option>
                    <option value="Auxílio Creche">Auxílio Creche</option>
                    <option value="Gympass / Academia">Gympass / Academia</option>
                    <option value="Benefício Personalizado">Benefício Personalizado</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Cálculo *</label>
                  <select
                    value={editingCatalog.tipoCalculo || 'Valor Fixo'}
                    onChange={e => setEditingCatalog(prev => ({ ...prev, tipoCalculo: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    <option value="Valor Fixo">Valor Fixo</option>
                    <option value="Percentual do Salário">Percentual do Salário</option>
                    <option value="Valor por Dia Trabalhado">Valor por Dia Trabalhado</option>
                    <option value="Valor por Dependente">Valor por Dependente</option>
                    <option value="Desconto Limitado Teto">Desconto Limitado Teto (VT)</option>
                    <option value="Coparticipação">Coparticipação</option>
                    <option value="Valor Manual">Valor Manual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor Total (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingCatalog.valorBeneficio ?? ''}
                    onChange={e => setEditingCatalog(prev => ({ ...prev, valorBeneficio: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Desconto Func. (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingCatalog.percentualDescontoFuncionario ?? ''}
                    onChange={e => setEditingCatalog(prev => ({ ...prev, percentualDescontoFuncionario: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Custo Empresa (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingCatalog.custoEmpresaEstimado ?? ''}
                    onChange={e => setEditingCatalog(prev => ({ ...prev, custoEmpresaEstimado: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fornecedor / Operadora</label>
                <input
                  type="text"
                  value={editingCatalog.fornecedor || ''}
                  onChange={e => setEditingCatalog(prev => ({ ...prev, fornecedor: e.target.value }))}
                  placeholder="ex: Sodexo, Ticket, Unimed, Bradesco Saúde"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="ativoCatalogCheck"
                  checked={editingCatalog.ativo ?? true}
                  onChange={e => setEditingCatalog(prev => ({ ...prev, ativo: e.target.checked }))}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="ativoCatalogCheck" className="font-bold text-slate-700 cursor-pointer">
                  Benefício Ativo e Disponível no Catálogo
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCatalogModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Salvar no Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT INDIVIDUAL CONCESSION                  */}
      {/* ======================================================== */}
      {isIndividualModalOpen && editingIndividual && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-[#1E293B] text-sm">
                Concessão Individual de Benefício
              </h3>
              <button onClick={() => setIsIndividualModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIndividual} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Colaborador *</label>
                <select
                  required
                  value={editingIndividual.employeeId || ''}
                  onChange={e => setEditingIndividual(prev => ({ ...prev, employeeId: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                >
                  <option value="">-- Selecione o Colaborador --</option>
                  {colaboradores
                    .filter(c => c.profissionais?.status !== 'Rescindido')
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nomeCompleto} ({c.profissionais?.cargo || 'DP'})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Benefício do Catálogo *</label>
                <select
                  required
                  value={editingIndividual.benefitTypeId || ''}
                  onChange={e => {
                    const selectedCat = beneficios.find(b => b.id === e.target.value);
                    setEditingIndividual(prev => ({
                      ...prev,
                      benefitTypeId: e.target.value,
                      totalValue: selectedCat?.valorBeneficio || 0,
                      employerContribution: selectedCat?.custoEmpresaEstimado || 0
                    }));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                >
                  <option value="">-- Selecione o Benefício --</option>
                  {beneficios.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.nome} ({b.categoria})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data de Início *</label>
                  <input
                    type="date"
                    required
                    value={editingIndividual.startDate || ''}
                    onChange={e => setEditingIndividual(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Initial *</label>
                  <select
                    value={editingIndividual.status || 'Ativo'}
                    onChange={e => setEditingIndividual(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Suspenso">Suspenso</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Desconto Colab. (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingIndividual.employeeContribution ?? ''}
                    onChange={e => setEditingIndividual(prev => ({ ...prev, employeeContribution: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Custo Empresa (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingIndividual.employerContribution ?? ''}
                    onChange={e => setEditingIndividual(prev => ({ ...prev, employerContribution: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingIndividual.totalValue ?? ''}
                    onChange={e => setEditingIndividual(prev => ({ ...prev, totalValue: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observações / Detalhes</label>
                <textarea
                  rows={2}
                  value={editingIndividual.observations || ''}
                  onChange={e => setEditingIndividual(prev => ({ ...prev, observations: e.target.value }))}
                  placeholder="Informações adicionais da concessão..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIndividualModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Conceder Benefício
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
