import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  User, 
  DollarSign, 
  Search, 
  Filter, 
  Check, 
  X,
  Umbrella,
  FileText,
  Printer,
  Download,
  AlertTriangle,
  Settings,
  Layers,
  FileCheck,
  ChevronRight,
  Info,
  CalendarCheck,
  Building2,
  ShieldAlert,
  Edit2
} from 'lucide-react';
import { 
  RegistroFeriasColaborador, 
  ColaboradorCompleto, 
  PeriodoAquisitivoFerias, 
  RegraFeriasEmpresa,
  StatusSolicitacaoFerias 
} from '../types/dp';
import { 
  getPeriodosAquisitivosFirestore, 
  savePeriodoAquisitivoFirestore, 
  getRegraFeriasEmpresaFirestore, 
  saveRegraFeriasEmpresaFirestore,
  saveDocumentoFirestore
} from '../services/dpFirestoreService';

interface GestaoFeriasProps {
  feriasList: RegistroFeriasColaborador[];
  colaboradores: ColaboradorCompleto[];
  onSalvarFerias: (ferias: RegistroFeriasColaborador) => void;
  companyId: string;
}

export const GestaoFerias: React.FC<GestaoFeriasProps> = ({
  feriasList,
  colaboradores,
  onSalvarFerias,
  companyId
}) => {
  const [activeTab, setActiveTab] = useState<'visao-geral' | 'periodos' | 'programacao' | 'documentos' | 'mapa' | 'regras'>('visao-geral');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');
  const [selectedDept, setSelectedDept] = useState<string>('Todos');

  // Async Firestore States
  const [periodosAquisitivos, setPeriodosAquisitivos] = useState<PeriodoAquisitivoFerias[]>([]);
  const [regraEmpresa, setRegraEmpresa] = useState<RegraFeriasEmpresa | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFerias, setEditingFerias] = useState<Partial<RegistroFeriasColaborador> | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docType, setDocType] = useState<'aviso' | 'recibo'>('aviso');
  const [selectedFeriasForDoc, setSelectedFeriasForDoc] = useState<RegistroFeriasColaborador | null>(null);
  
  // Modal Período Aquisitivo
  const [isPaModalOpen, setIsPaModalOpen] = useState(false);
  const [editingPa, setEditingPa] = useState<Partial<PeriodoAquisitivoFerias> | null>(null);

  // Validation Warnings
  const [cltWarnings, setCltWarnings] = useState<string[]>([]);

  // Load Firestore data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [pas, rule] = await Promise.all([
          getPeriodosAquisitivosFirestore(companyId),
          getRegraFeriasEmpresaFirestore(companyId)
        ]);
        setPeriodosAquisitivos(pas);
        setRegraEmpresa(rule);
      } catch (err) {
        console.error('Erro ao carregar dados de férias do Firestore:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [companyId]);

  // Departamentos únicos
  const departamentos = Array.from(new Set(colaboradores.map(c => c.profissionais.departamento || 'Geral')));

  // Filtered Ferias
  const filteredFerias = feriasList.filter(f => {
    const matchesSearch = f.colaboradorNome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.cargo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'Todos' || f.status === selectedStatus;
    const matchesDept = selectedDept === 'Todos' || f.departamento === selectedDept;
    return matchesSearch && matchesStatus && matchesDept;
  });

  // KPI Calculations
  const totalEmGozo = feriasList.filter(f => f.status === 'Em Gozo').length;
  const totalSolicitados = feriasList.filter(f => f.status === 'Solicitado' || f.status === 'Em análise').length;
  const totalAprovados = feriasList.filter(f => f.status === 'Aprovado' || f.status === 'Programado').length;
  const totalVencidos = periodosAquisitivos.filter(p => p.status === 'Vencido').length;

  // Calculadora e Validadora CLT de Férias
  const handleOpenSolicitacao = (colab?: ColaboradorCompleto) => {
    const target = colab || colaboradores[0];
    const salario = target?.profissionais.salarioBase || 3500;
    const umTerco = salario / 3;

    const dataAdmissao = target?.profissionais.dataAdmissao || '2024-01-15';
    const admYear = new Date(dataAdmissao).getFullYear();
    const currentYear = new Date().getFullYear();

    const aquisitivoInicio = `${currentYear - 1}-${dataAdmissao.slice(5)}`;
    const aquisitivoFim = `${currentYear}-${dataAdmissao.slice(5)}`;
    const limiteConcessivo = `${currentYear + 1}-${dataAdmissao.slice(5)}`;

    const hoje = new Date();
    const dataInicioPadrão = new Date(hoje.setDate(hoje.getDate() + 30)).toISOString().split('T')[0];
    const dataFimPadrão = new Date(hoje.setDate(hoje.getDate() + 29)).toISOString().split('T')[0];

    setEditingFerias({
      companyId,
      colaboradorId: target?.id || 'colab-001',
      colaboradorNome: target?.nomeCompleto || 'Colaborador',
      cargo: target?.profissionais.cargo || 'Cargo',
      departamento: target?.profissionais.departamento || 'Geral',
      periodoAquisitivoInicio: aquisitivoInicio,
      periodoAquisitivoFim: aquisitivoFim,
      limiteConcessivo: limiteConcessivo,
      diasAdquiridos: 30,
      diasGozados: 0,
      diasSaldo: 30,
      dataInicioGozo: dataInicioPadrão,
      dataFimGozo: dataFimPadrão,
      diasGozoAbono: 30,
      diasVendidosAbono: 0,
      fracionamentoOrdem: 1,
      adiantamento13Salario: false,
      status: 'Solicitado',
      valorSalarioBaseGozo: salario,
      valorUmTercoConstitucional: umTerco,
      valorAbonoPecuniario: 0,
      valorUmTercoAbono: 0,
      valorTotalLiquidoFerias: salario + umTerco
    });
    setCltWarnings([]);
    setIsModalOpen(true);
  };

  // Recalcular Dias e Valores no formulário
  const handleRecalculate = (updated: Partial<RegistroFeriasColaborador>) => {
    const warnings: string[] = [];
    const diasGozo = updated.diasGozoAbono || 30;
    const diasAbono = updated.diasVendidosAbono || 0;
    const salarioBase = updated.valorSalarioBaseGozo || 3000;

    // Regra CLT Art. 134: Primeiro período >= 14 dias; demais >= 5 dias
    if (updated.fracionamentoOrdem === 1 && diasGozo < (regraEmpresa?.minDiasPrimeiroPeriodo || 14)) {
      warnings.push(`O 1º período de fracionamento deve ter no mínimo ${regraEmpresa?.minDiasPrimeiroPeriodo || 14} dias corridos (Art. 134 CLT).`);
    } else if ((updated.fracionamentoOrdem || 1) > 1 && diasGozo < (regraEmpresa?.minDiasOutrosPeriodos || 5)) {
      warnings.push(`Nenhum período de férias pode ser menor que ${regraEmpresa?.minDiasOutrosPeriodos || 5} dias corridos.`);
    }

    // Regra CLT Art. 143: Abono pecuniário no máximo 1/3 dos dias adquiridos (10 dias)
    if (diasAbono > (regraEmpresa?.maxDiasAbono || 10)) {
      warnings.push(`O abono pecuniário (venda) não pode exceder ${regraEmpresa?.maxDiasAbono || 10} dias.`);
    }

    // Validação de Antecedência de Aviso de Férias (Art. 135 CLT: 30 dias)
    if (updated.dataInicioGozo) {
      const start = new Date(updated.dataInicioGozo);
      const today = new Date();
      const diffTime = start.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < (regraEmpresa?.prazoMinimoSolicitacaoDias || 30)) {
        warnings.push(`Aviso Prévio de Férias: A CLT exige aviso com antecedência mínima de ${regraEmpresa?.prazoMinimoSolicitacaoDias || 30} dias (Atual: ${diffDays < 0 ? 0 : diffDays} dias).`);
      }
    }

    // Cálculo Financeiro
    const valorDiario = salarioBase / 30;
    const valorGozo = valorDiario * diasGozo;
    const umTercoGozo = valorGozo / 3;
    const valorAbono = valorDiario * diasAbono;
    const umTercoAbono = valorAbono / 3;
    const totalLiquido = valorGozo + umTercoGozo + valorAbono + umTercoAbono;

    setCltWarnings(warnings);
    setEditingFerias({
      ...updated,
      valorUmTercoConstitucional: umTercoGozo,
      valorAbonoPecuniario: valorAbono,
      valorUmTercoAbono: umTercoAbono,
      valorTotalLiquidoFerias: totalLiquido
    });
  };

  const handleSaveFerias = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFerias) return;

    const saved: RegistroFeriasColaborador = {
      id: editingFerias.id || `fer-${Date.now()}`,
      companyId: editingFerias.companyId || companyId,
      colaboradorId: editingFerias.colaboradorId || 'colab-001',
      colaboradorNome: editingFerias.colaboradorNome || 'Colaborador',
      cargo: editingFerias.cargo || 'Cargo',
      departamento: editingFerias.departamento || 'Geral',
      periodoAquisitivoInicio: editingFerias.periodoAquisitivoInicio || '2025-01-01',
      periodoAquisitivoFim: editingFerias.periodoAquisitivoFim || '2025-12-31',
      limiteConcessivo: editingFerias.limiteConcessivo || '2026-12-31',
      diasAdquiridos: 30,
      diasGozados: editingFerias.diasGozoAbono || 30,
      diasSaldo: 30 - (editingFerias.diasGozoAbono || 30) - (editingFerias.diasVendidosAbono || 0),
      dataInicioGozo: editingFerias.dataInicioGozo,
      dataFimGozo: editingFerias.dataFimGozo,
      diasGozoAbono: editingFerias.diasGozoAbono,
      diasVendidosAbono: editingFerias.diasVendidosAbono,
      fracionamentoOrdem: editingFerias.fracionamentoOrdem,
      adiantamento13Salario: editingFerias.adiantamento13Salario,
      status: (editingFerias.status as StatusSolicitacaoFerias) || 'Solicitado',
      valorSalarioBaseGozo: editingFerias.valorSalarioBaseGozo,
      valorUmTercoConstitucional: editingFerias.valorUmTercoConstitucional,
      valorAbonoPecuniario: editingFerias.valorAbonoPecuniario,
      valorUmTercoAbono: editingFerias.valorUmTercoAbono,
      valorTotalLiquidoFerias: editingFerias.valorTotalLiquidoFerias,
      createdAt: editingFerias.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSalvarFerias(saved);
    setIsModalOpen(false);
  };

  const handleAprovar = (f: RegistroFeriasColaborador) => {
    const updated: RegistroFeriasColaborador = {
      ...f,
      status: 'Aprovado',
      dataAvisoFeriasEmissao: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString()
    };
    onSalvarFerias(updated);
  };

  const handleSavePa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPa) return;
    const savedPa: PeriodoAquisitivoFerias = {
      id: editingPa.id || `pa-${Date.now()}`,
      companyId: editingPa.companyId || companyId,
      colaboradorId: editingPa.colaboradorId || 'colab-001',
      colaboradorNome: editingPa.colaboradorNome || 'Colaborador',
      dataInicioPeriodo: editingPa.dataInicioPeriodo || '2025-01-01',
      dataFimPeriodo: editingPa.dataFimPeriodo || '2025-12-31',
      limiteConcessivo: editingPa.limiteConcessivo || '2026-12-31',
      diasDireito: editingPa.diasDireito || 30,
      diasFaltasInjustificadas: editingPa.diasFaltasInjustificadas || 0,
      diasGozados: editingPa.diasGozados || 0,
      diasVendidos: editingPa.diasVendidos || 0,
      diasSaldo: editingPa.diasSaldo ?? 30,
      status: editingPa.status || 'Adquirido',
      observacoes: editingPa.observacoes,
      createdAt: editingPa.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await savePeriodoAquisitivoFirestore(savedPa);
    setPeriodosAquisitivos(prev => {
      const idx = prev.findIndex(p => p.id === savedPa.id);
      if (idx >= 0) {
        const c = [...prev];
        c[idx] = savedPa;
        return c;
      }
      return [savedPa, ...prev];
    });
    setIsPaModalOpen(false);
  };

  const handleSaveCompanyRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regraEmpresa) return;
    await saveRegraFeriasEmpresaFirestore(regraEmpresa);
    alert('Regras de Férias da Empresa atualizadas com sucesso no Firestore!');
  };

  const handleGenerateDocument = async (ferias: RegistroFeriasColaborador, type: 'aviso' | 'recibo') => {
    setSelectedFeriasForDoc(ferias);
    setDocType(type);
    setIsDocModalOpen(true);

    // Auto-save to Documentos Colaboradores in Firestore
    const docName = type === 'aviso' ? `Aviso_de_Ferias_${ferias.colaboradorNome}.pdf` : `Recibo_de_Ferias_${ferias.colaboradorNome}.pdf`;
    await saveDocumentoFirestore({
      id: `doc-fer-${Date.now()}`,
      empresaId: companyId,
      colaboradorId: ferias.colaboradorId,
      colaboradorNome: ferias.colaboradorNome,
      categoria: 'Férias',
      tipoDocumento: type === 'aviso' ? 'Aviso de Férias (Art. 135 CLT)' : 'Recibo de Férias e Quitação',
      nomeArquivo: docName,
      status: 'Válido',
      criadoEm: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
              <Umbrella className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#1E293B]">Gestão e Programação de Férias (CLT 100%)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Controle de períodos aquisitivos, fracionamento em até 3x, abono pecuniário, cálculo do 1/3 constitucional, aviso prévio e recibo.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => handleOpenSolicitacao()}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Programar Férias</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('visao-geral')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'visao-geral'
              ? 'border-[#2563EB] text-[#2563EB] bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sun className="w-4 h-4" />
          <span>Visão Geral e Alertas</span>
        </button>

        <button
          onClick={() => setActiveTab('periodos')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'periodos'
              ? 'border-[#2563EB] text-[#2563EB] bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Períodos Aquisitivos ({periodosAquisitivos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('programacao')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'programacao'
              ? 'border-[#2563EB] text-[#2563EB] bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Solicitações e Gozo ({feriasList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('documentos')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'documentos'
              ? 'border-[#2563EB] text-[#2563EB] bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Aviso e Recibos</span>
        </button>

        <button
          onClick={() => setActiveTab('mapa')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'mapa'
              ? 'border-[#2563EB] text-[#2563EB] bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Mapa da Equipe</span>
        </button>

        <button
          onClick={() => setActiveTab('regras')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'regras'
              ? 'border-[#2563EB] text-[#2563EB] bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Regras da Empresa</span>
        </button>
      </div>

      {/* Filter Bar for List Views */}
      {(activeTab === 'periodos' || activeTab === 'programacao' || activeTab === 'documentos') && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar colaborador ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#1E293B] focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros:</span>
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-[#1E293B] focus:outline-hidden"
            >
              <option value="Todos">Todos os Setores</option>
              {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-[#1E293B] focus:outline-hidden"
            >
              <option value="Todos">Todos os Status</option>
              <option value="Solicitado">Solicitado</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Programado">Programado</option>
              <option value="Em Gozo">Em Gozo</option>
              <option value="Vencido">Vencido</option>
            </select>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* TAB 1: VISÃO GERAL & ALERTAS */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === 'visao-geral' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Em Gozo de Férias</p>
                <p className="text-2xl font-bold text-[#1E293B] mt-1">{totalEmGozo}</p>
                <p className="text-[10px] text-emerald-600 mt-1 font-medium">Atualmente ausentes</p>
              </div>
              <span className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Sun className="w-6 h-6" />
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Solicitações Pendentes</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{totalSolicitados}</p>
                <p className="text-[10px] text-amber-600 mt-1 font-medium">Aguardando aprovação</p>
              </div>
              <span className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <Clock className="w-6 h-6" />
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Programadas / Aprovadas</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{totalAprovados}</p>
                <p className="text-[10px] text-emerald-600 mt-1 font-medium">Aviso e recibo prontos</p>
              </div>
              <span className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <CheckCircle2 className="w-6 h-6" />
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Períodos Vencidos</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">{totalVencidos}</p>
                <p className="text-[10px] text-rose-600 mt-1 font-medium">Risco de pagamento em dobro (Art. 137 CLT)</p>
              </div>
              <span className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </span>
            </div>
          </div>

          {/* Alertas Críticos da Legislação Trabalhista */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-[#1E293B] text-sm">Alertas e Prazos Concessivos do RH</h3>
              </div>
              <span className="text-xs text-slate-400">Verificação automática CLT Art. 134/137</span>
            </div>

            <div className="space-y-3 text-xs">
              {totalVencidos > 0 && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Atenção Crítica: Existem períodos de férias vencidos!</p>
                    <p className="mt-0.5 text-rose-700">
                      Segundo o Art. 137 da CLT, férias concedidas após o prazo concessivo devem ser pagas em dobro ao colaborador.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Aviso Prévio Obrigatório com 30 dias de Antecedência (Art. 135 CLT)</p>
                  <p className="mt-0.5 text-amber-800">
                    A concessão das férias será participada, por escrito, ao empregado, com antecedência de, no mínimo, 30 dias, mediante recibo.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-blue-900">
                <CalendarCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Prazo de Pagamento: Até 2 dias antes do início do gozo (Art. 145 CLT)</p>
                  <p className="mt-0.5 text-blue-800">
                    O pagamento da remuneração das férias e do 1/3 constitucional deve ser efetuado até 2 dias antes do início do respectivo período.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* TAB 2: PERÍODOS AQUISITIVOS */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === 'periodos' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#1E293B] text-sm">Controle de Períodos Aquisitivos e Concessivos</h3>
              <p className="text-xs text-slate-500">Histórico de 12 meses trabalhados para aquisição de direito a férias.</p>
            </div>

            <button
              onClick={() => {
                const target = colaboradores[0];
                setEditingPa({
                  companyId,
                  colaboradorId: target?.id || 'colab-001',
                  colaboradorNome: target?.nomeCompleto || 'Colaborador',
                  dataInicioPeriodo: '2025-01-15',
                  dataFimPeriodo: '2026-01-14',
                  limiteConcessivo: '2027-01-14',
                  diasDireito: 30,
                  diasFaltasInjustificadas: 0,
                  diasGozados: 0,
                  diasVendidos: 0,
                  diasSaldo: 30,
                  status: 'Adquirido'
                });
                setIsPaModalOpen(true);
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#1E293B] font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Período</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                  <th className="py-3 px-4">Colaborador</th>
                  <th className="py-3 px-4">Período Aquisitivo</th>
                  <th className="py-3 px-4">Limite Concessivo</th>
                  <th className="py-3 px-4 text-center">Faltas Inj.</th>
                  <th className="py-3 px-4 text-center">Direito</th>
                  <th className="py-3 px-4 text-center">Gozados</th>
                  <th className="py-3 px-4 text-center">Saldo</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periodosAquisitivos.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Nenhum período aquisitivo cadastrado no Firestore.
                    </td>
                  </tr>
                ) : (
                  periodosAquisitivos.map(pa => (
                    <tr key={pa.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-[#1E293B]">
                        {pa.colaboradorNome}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {pa.dataInicioPeriodo} a {pa.dataFimPeriodo}
                      </td>
                      <td className="py-3 px-4 text-rose-700 font-medium">
                        {pa.limiteConcessivo}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500">
                        {pa.diasFaltasInjustificadas || 0}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {pa.diasDireito}d
                      </td>
                      <td className="py-3 px-4 text-center text-blue-600 font-medium">
                        {pa.diasGozados}d
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-600">
                        {pa.diasSaldo}d
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pa.status === 'Adquirido' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          pa.status === 'Vencido' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {pa.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setEditingPa(pa);
                            setIsPaModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* TAB 3: SOLICITAÇÕES E PROGRAMAÇÃO DE GOZO */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === 'programacao' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFerias.map(f => (
            <div key={f.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-[#1E293B] text-sm">{f.colaboradorNome}</h3>
                    <p className="text-xs text-slate-500">{f.cargo} • {f.departamento}</p>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    f.status === 'Aprovado' || f.status === 'Programado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    f.status === 'Em Gozo' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    f.status === 'Solicitado' || f.status === 'Em análise' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {f.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between">
                    <span>Aquisitivo:</span>
                    <span className="font-medium text-[#1E293B]">{f.periodoAquisitivoInicio} a {f.periodoAquisitivoFim}</span>
                  </div>

                  {f.dataInicioGozo && (
                    <div className="flex justify-between border-t border-slate-200/60 pt-1.5">
                      <span>Período de Gozo:</span>
                      <span className="font-bold text-[#2563EB]">{f.dataInicioGozo} até {f.dataFimGozo}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Dias de Gozo / Venda:</span>
                    <span className="font-bold text-slate-800">{f.diasGozoAbono || 30}d de gozo {f.diasVendidosAbono ? `+ ${f.diasVendidosAbono}d venda` : ''}</span>
                  </div>

                  {f.valorTotalLiquidoFerias && (
                    <div className="flex justify-between border-t border-slate-200/60 pt-1.5">
                      <span>Total Líquido Férias:</span>
                      <span className="font-bold text-emerald-700 font-mono">
                        {f.valorTotalLiquidoFerias.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                { (f.status === 'Solicitado' || f.status === 'Em análise') && (
                  <button
                    onClick={() => handleAprovar(f)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Aprovar Férias (Art. 134)</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGenerateDocument(f, 'aviso')}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Aviso (30d)</span>
                  </button>

                  <button
                    onClick={() => handleGenerateDocument(f, 'recibo')}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Recibo 1/3</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* TAB 4: AVISO E RECIBOS */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === 'documentos' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="font-bold text-[#1E293B] text-sm">Gerador e Emissor de Documentos Trabalhistas de Férias</h3>
            <p className="text-xs text-slate-500">Documentos oficiais em conformidade com os Artigos 135 e 145 da CLT.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                <FileText className="w-4 h-4" />
                <span>Aviso Prévio de Férias (Art. 135 CLT)</span>
              </div>
              <p className="text-xs text-slate-600">
                Notificação escrita emitida pelo empregador ao empregado com antecedência mínima de 30 dias do início das férias.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                <DollarSign className="w-4 h-4" />
                <span>Recibo e Quitação de Férias (Art. 145 CLT)</span>
              </div>
              <p className="text-xs text-slate-600">
                Comprovante do pagamento da remuneração das férias + 1/3 constitucional efetuado até 2 dias antes do início do gozo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* TAB 5: MAPA DE FÉRIAS */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === 'mapa' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#1E293B] text-sm">Mapa Anual e Cronograma de Férias da Equipe</h3>
              <p className="text-xs text-slate-500">Visualização de concorrência e ausências por setor.</p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-1 text-center text-xs font-bold bg-slate-100 p-2 rounded-xl text-slate-600">
            {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map(m => (
              <div key={m}>{m}</div>
            ))}
          </div>

          <div className="space-y-3">
            {colaboradores.map(c => {
              const feriasColab = feriasList.find(f => f.colaboradorId === c.id);
              return (
                <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="w-48 font-bold text-[#1E293B]">
                    {c.nomeCompleto}
                    <p className="text-[10px] text-slate-400 font-normal">{c.profissionais.departamento}</p>
                  </div>

                  <div className="flex-1 px-4">
                    {feriasColab && feriasColab.dataInicioGozo ? (
                      <div className="p-2 bg-blue-100 text-blue-800 rounded-lg text-center font-medium">
                        Férias: {feriasColab.dataInicioGozo} a {feriasColab.dataFimGozo} ({feriasColab.status})
                      </div>
                    ) : (
                      <div className="text-slate-400 italic text-center">Nenhuma férias programada no mapa</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* TAB 6: REGRAS DA EMPRESA */}
      {/* -------------------------------------------------------------------------------- */}
      {activeTab === 'regras' && regraEmpresa && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-6 max-w-2xl">
          <div>
            <h3 className="font-bold text-[#1E293B] text-sm">Configuração da Política de Férias da Empresa</h3>
            <p className="text-xs text-slate-500">Parâmetros normativos aplicados às solicitações de férias.</p>
          </div>

          <form onSubmit={handleSaveCompanyRule} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nome da Política</label>
              <input
                type="text"
                value={regraEmpresa.nome}
                onChange={(e) => setRegraEmpresa({ ...regraEmpresa, nome: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Prazo Min. Solicitação (Dias)</label>
                <input
                  type="number"
                  value={regraEmpresa.prazoMinimoSolicitacaoDias}
                  onChange={(e) => setRegraEmpresa({ ...regraEmpresa, prazoMinimoSolicitacaoDias: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mínimo Dias 1º Período</label>
                <input
                  type="number"
                  value={regraEmpresa.minDiasPrimeiroPeriodo}
                  onChange={(e) => setRegraEmpresa({ ...regraEmpresa, minDiasPrimeiroPeriodo: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={regraEmpresa.permitirFracionamento}
                  onChange={(e) => setRegraEmpresa({ ...regraEmpresa, permitirFracionamento: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span>Permitir Fracionamento de Férias (Até 3 vezes - Art. 134 CLT)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={regraEmpresa.permitirAbonoPecuniario}
                  onChange={(e) => setRegraEmpresa({ ...regraEmpresa, permitirAbonoPecuniario: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span>Permitir Abono Pecuniário (Venda de até 10 dias - Art. 143 CLT)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={regraEmpresa.permitirAdiantamento13}
                  onChange={(e) => setRegraEmpresa({ ...regraEmpresa, permitirAdiantamento13: e.target.checked })}
                  className="rounded text-blue-600"
                />
                <span>Permitir Solicitação da 1ª Parcela do 13º Salário com as Férias</span>
              </label>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
            >
              Salvar Configurações no Firestore
            </button>
          </form>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL PROGRAMAR FÉRIAS */}
      {/* -------------------------------------------------------------------------------- */}
      {isModalOpen && editingFerias && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-[#1E293B] text-sm">Programação de Férias e Cálculo CLT</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            {cltWarnings.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs text-amber-800">
                <p className="font-bold flex items-center gap-1 text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Avisos de Conformidade Trabalhista:</span>
                </p>
                {cltWarnings.map((w, idx) => <p key={idx}>• {w}</p>)}
              </div>
            )}

            <form onSubmit={handleSaveFerias} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Colaborador</label>
                <select
                  value={editingFerias.colaboradorId}
                  onChange={(e) => {
                    const found = colaboradores.find(c => c.id === e.target.value);
                    if (found) {
                      const salario = found.profissionais.salarioBase || 3500;
                      handleRecalculate({
                        ...editingFerias,
                        colaboradorId: found.id,
                        colaboradorNome: found.nomeCompleto,
                        cargo: found.profissionais.cargo,
                        departamento: found.profissionais.departamento,
                        valorSalarioBaseGozo: salario
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-medium"
                >
                  {colaboradores.map(c => (
                    <option key={c.id} value={c.id}>{c.nomeCompleto} ({c.profissionais.cargo})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data Início Gozo</label>
                  <input
                    type="date"
                    value={editingFerias.dataInicioGozo || ''}
                    onChange={(e) => handleRecalculate({ ...editingFerias, dataInicioGozo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data Fim Gozo</label>
                  <input
                    type="date"
                    value={editingFerias.dataFimGozo || ''}
                    onChange={(e) => handleRecalculate({ ...editingFerias, dataFimGozo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dias de Gozo</label>
                  <input
                    type="number"
                    value={editingFerias.diasGozoAbono || 30}
                    onChange={(e) => handleRecalculate({ ...editingFerias, diasGozoAbono: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dias Vendidos (Abono Max 10d)</label>
                  <input
                    type="number"
                    value={editingFerias.diasVendidosAbono || 0}
                    onChange={(e) => handleRecalculate({ ...editingFerias, diasVendidosAbono: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Memory of Calculations */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span>Salário Base:</span>
                  <span>R$ {(editingFerias.valorSalarioBaseGozo || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>1/3 Constitucional (Gozo):</span>
                  <span>+ R$ {(editingFerias.valorUmTercoConstitucional || 0).toFixed(2)}</span>
                </div>
                { (editingFerias.diasVendidosAbono || 0) > 0 && (
                  <div className="flex justify-between text-blue-700">
                    <span>Abono Pecuniário ({editingFerias.diasVendidosAbono}d):</span>
                    <span>+ R$ {((editingFerias.valorAbonoPecuniario || 0) + (editingFerias.valorUmTercoAbono || 0)).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-slate-200 pt-1 text-[#1E293B]">
                  <span>Total Bruto Férias:</span>
                  <span>R$ {(editingFerias.valorTotalLiquidoFerias || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Salvar Programação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------------- */}
      {/* MODAL IMPRESSÃO DE AVISO / RECIBO DE FÉRIAS */}
      {/* -------------------------------------------------------------------------------- */}
      {isDocModalOpen && selectedFeriasForDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-[#1E293B] text-sm">
                {docType === 'aviso' ? 'Aviso Prévio de Férias (Art. 135 CLT)' : 'Recibo de Quitação de Férias'}
              </h3>
              <button onClick={() => setIsDocModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <div id="printable-doc" className="p-6 border border-slate-300 rounded-xl bg-white text-slate-800 space-y-4 text-xs font-serif leading-relaxed">
              <div className="text-center border-b border-slate-200 pb-3 space-y-1">
                <h2 className="font-bold text-sm uppercase tracking-wider text-slate-900">
                  {docType === 'aviso' ? 'AVISO PRÉVIO DE FÉRIAS' : 'RECIBO DE PAGAMENTO DE FÉRIAS'}
                </h2>
                <p className="text-[10px] text-slate-500 font-sans">EMPRESA RH TRANSFORMA LTDA — CNPJ: 00.000.000/0001-00</p>
              </div>

              <div className="space-y-2">
                <p><strong>Empregado:</strong> {selectedFeriasForDoc.colaboradorNome}</p>
                <p><strong>Cargo:</strong> {selectedFeriasForDoc.cargo} | <strong>Setor:</strong> {selectedFeriasForDoc.departamento}</p>
                <p><strong>Período Aquisitivo:</strong> {selectedFeriasForDoc.periodoAquisitivoInicio} a {selectedFeriasForDoc.periodoAquisitivoFim}</p>
              </div>

              {docType === 'aviso' ? (
                <p>
                  Comunicamos-lhe que, nos termos do Artigo 135 da Consolidação das Leis do Trabalho (CLT), ser-lhe-ão concedidas férias relativas ao período aquisitivo acima discriminado, a serem gozadas no período de <strong>{selectedFeriasForDoc.dataInicioGozo}</strong> a <strong>{selectedFeriasForDoc.dataFimGozo}</strong>, devendo retornar às suas atividades normais no primeiro dia útil subsequente.
                </p>
              ) : (
                <div className="space-y-3 font-sans">
                  <p className="font-serif">
                    Recebi da empresa a quantia líquida discriminada abaixo, referente ao pagamento de minhas férias e respectivo adicional de 1/3 constitucional, do qual dou plena e geral quitação:
                  </p>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Remuneração das Férias ({selectedFeriasForDoc.diasGozoAbono || 30} dias):</span>
                      <span>R$ {((selectedFeriasForDoc.valorSalarioBaseGozo || 3000)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>Adicional 1/3 Constitucional:</span>
                      <span>R$ {(selectedFeriasForDoc.valorUmTercoConstitucional || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-slate-200 pt-1">
                      <span>Total Pago:</span>
                      <span>R$ {(selectedFeriasForDoc.valorTotalLiquidoFerias || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-8 grid grid-cols-2 gap-8 text-center font-sans text-[11px]">
                <div className="border-t border-slate-400 pt-1">
                  Assinatura do Empregador / RH
                </div>
                <div className="border-t border-slate-400 pt-1">
                  Assinatura do Empregado
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Documento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIÇÃO PERÍODO AQUISITIVO */}
      {isPaModalOpen && editingPa && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-[#1E293B] text-sm">Editar Período Aquisitivo</h3>
              <button onClick={() => setIsPaModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSavePa} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Colaborador</label>
                <select
                  value={editingPa.colaboradorId}
                  onChange={(e) => {
                    const found = colaboradores.find(c => c.id === e.target.value);
                    if (found) {
                      setEditingPa({ ...editingPa, colaboradorId: found.id, colaboradorNome: found.nomeCompleto });
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                >
                  {colaboradores.map(c => (
                    <option key={c.id} value={c.id}>{c.nomeCompleto}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Início Aquisitivo</label>
                  <input
                    type="date"
                    value={editingPa.dataInicioPeriodo || ''}
                    onChange={(e) => setEditingPa({ ...editingPa, dataInicioPeriodo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fim Aquisitivo</label>
                  <input
                    type="date"
                    value={editingPa.dataFimPeriodo || ''}
                    onChange={(e) => setEditingPa({ ...editingPa, dataFimPeriodo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Limite Concessivo</label>
                <input
                  type="date"
                  value={editingPa.limiteConcessivo || ''}
                  onChange={(e) => setEditingPa({ ...editingPa, limiteConcessivo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-rose-700 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Faltas Injustificadas</label>
                  <input
                    type="number"
                    value={editingPa.diasFaltasInjustificadas || 0}
                    onChange={(e) => {
                      const faltas = Number(e.target.value);
                      let direito = 30;
                      if (faltas >= 6 && faltas <= 14) direito = 24;
                      else if (faltas >= 15 && faltas <= 23) direito = 18;
                      else if (faltas >= 24 && faltas <= 32) direito = 12;
                      else if (faltas > 32) direito = 0;

                      setEditingPa({
                        ...editingPa,
                        diasFaltasInjustificadas: faltas,
                        diasDireito: direito,
                        diasSaldo: direito - (editingPa.diasGozados || 0)
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dias de Direito</label>
                  <input
                    type="number"
                    value={editingPa.diasDireito || 30}
                    onChange={(e) => setEditingPa({ ...editingPa, diasDireito: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Salvar Período
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
