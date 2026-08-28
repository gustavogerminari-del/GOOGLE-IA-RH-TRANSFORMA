import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  FileText, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  PlusCircle, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  Eye, 
  AlertTriangle,
  FileCheck,
  Zap,
  Sliders,
  RefreshCw,
  FileCode,
  Percent,
  Shield
} from 'lucide-react';
import { useAuth } from '../auth';
import { 
  PayrollPeriod, 
  Paystub, 
  PayrollType, 
  RubricDefinition, 
  TaxTableVersion, 
  PayrollAuditLog,
  PayrollValidationResult 
} from './types/payroll';
import { 
  getPayrollPeriodsFirestore, 
  savePayrollPeriodFirestore, 
  closePayrollPeriodFirestore, 
  reopenPayrollPeriodFirestore, 
  getPaystubsFirestore, 
  savePaystubFirestore, 
  getRubricCatalogFirestore, 
  saveRubricFirestore, 
  getTaxTablesFirestore, 
  saveTaxTableFirestore, 
  getPayrollAuditLogsFirestore, 
  processBatchPayrollFirestore, 
  validatePayrollPeriodFirestore,
  DEFAULT_TAX_TABLE_2026,
  DEFAULT_RUBRICS 
} from './services/payrollFirestoreService';
import { PaystubModal } from './components/PaystubModal';
import { PayrollSimulatorModal } from './components/PayrollSimulatorModal';
import { ReopenPeriodModal } from './components/ReopenPeriodModal';
import { RubricsAndTaxesModule } from './components/RubricsAndTaxesModule';
import { PayrollAuditTab } from './components/PayrollAuditTab';
import { CompanyPayrollSettingsTab } from './components/CompanyPayrollSettingsTab';
import { PayrollPaymentsModule } from './components/PayrollPaymentsModule';
import { PayrollAccountingAndProvisions } from './components/PayrollAccountingAndProvisions';
import { PayrollVariablePayAndLaunches } from './components/PayrollVariablePayAndLaunches';
import { PayrollReportsAndDashboard } from './components/PayrollReportsAndDashboard';

export const PayrollView: React.FC = () => {
  const { user } = useAuth();
  const companyId = user?.companyId || user?.empresaId || user?.tenantId || '';

  const [loading, setLoading] = useState(true);
  const [processingBatch, setProcessingBatch] = useState(false);

  // Firestore State
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [paystubs, setPaystubs] = useState<Paystub[]>([]);
  const [rubrics, setRubrics] = useState<RubricDefinition[]>([]);
  const [taxTable, setTaxTable] = useState<TaxTableVersion>(DEFAULT_TAX_TABLE_2026);
  const [auditLogs, setAuditLogs] = useState<PayrollAuditLog[]>([]);

  const [activePeriodId, setActivePeriodId] = useState<string>('per-2026-07');
  const [activeTab, setActiveTab] = useState<
    'gestao' | 'rubricas' | 'esocial' | 'auditoria' | 'portal' | 'configuracao' | 'pagamentos' | 'contabil' | 'lancamentos' | 'relatorios'
  >('gestao');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('Todos');
  const [signatureFilter, setSignatureFilter] = useState<'Todos' | 'Pendente' | 'Assinado Digitalmente'>('Todos');

  const [selectedPaystub, setSelectedPaystub] = useState<Paystub | null>(null);
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationResult, setValidationResult] = useState<PayrollValidationResult | null>(null);

  const [showNewPeriodModal, setShowNewPeriodModal] = useState(false);
  const [newPeriodMonth, setNewPeriodMonth] = useState('2026-08');
  const [newPeriodType, setNewPeriodType] = useState<PayrollType>('Mensal');

  const isMasterOrAdmin = user?.role === 'Super Administrador' || user?.role === 'Administrador' || user?.tipoUsuario === 'MASTER' || user?.department === 'Gente & Gestão';
  const isEmployee = user?.tipoUsuario === 'FUNCIONARIO' || (!isMasterOrAdmin && user?.role === 'Colaborador');

  // Load all Payroll Data from Firestore on mount
  useEffect(() => {
    let isMounted = true;
    async function loadPayrollData() {
      setLoading(true);
      try {
        const [
          periodsData,
          paystubsData,
          rubricsData,
          taxTablesData,
          auditData
        ] = await Promise.all([
          getPayrollPeriodsFirestore(companyId),
          getPaystubsFirestore(companyId),
          getRubricCatalogFirestore(companyId),
          getTaxTablesFirestore(companyId),
          getPayrollAuditLogsFirestore(companyId)
        ]);

        if (isMounted) {
          setPeriods(periodsData);
          setPaystubs(paystubsData);
          setRubrics(rubricsData);
          if (taxTablesData.length > 0) setTaxTable(taxTablesData[0]);
          setAuditLogs(auditData);

          if (periodsData.length > 0 && !activePeriodId) {
            setActivePeriodId(periodsData[0].id);
          }
        }
      } catch (err) {
        console.error('[Payroll] Erro ao carregar dados do Firebase:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPayrollData();
  }, [companyId]);

  const currentPeriod = periods.find(p => p.id === activePeriodId) || periods[0];
  const isClosedPeriod = currentPeriod?.status === 'Fechado';

  // Filter paystubs for active period
  const periodPaystubs = paystubs.filter(s => s.periodId === activePeriodId);

  // Filter for display
  const filteredPaystubs = periodPaystubs.filter(stub => {
    const matchesSearch = stub.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || stub.cpf.includes(searchTerm);
    const matchesDept = departmentFilter === 'Todos' || stub.departamento === departmentFilter;
    const matchesSig = signatureFilter === 'Todos' || stub.statusAssinatura === signatureFilter;
    return matchesSearch && matchesDept && matchesSig;
  });

  // Employee restricted paystubs (only own paystubs). Nunca usa CPF de exemplo.
  const userEmployeeId = String((user as any)?.employeeId || (user as any)?.colaboradorId || '').trim();
  const userCpf = String((user as any)?.cpf || (user as any)?.pessoais?.cpf || '').replace(/\D/g, '');
  const userNameForPayroll = String((user as any)?.name || (user as any)?.displayName || '').trim().toLowerCase();
  const myPaystubs = paystubs.filter(s => {
    if (!isEmployee) return true;
    const stubCpf = String(s.cpf || '').replace(/\D/g, '');
    if (userEmployeeId && s.employeeId === userEmployeeId) return true;
    if (userCpf && stubCpf && userCpf === stubCpf) return true;
    if (userNameForPayroll && String(s.employeeName || '').trim().toLowerCase() === userNameForPayroll) return true;
    return false;
  });

  const handleRefreshData = async () => {
    const freshStubs = await getPaystubsFirestore(companyId);
    setPaystubs(freshStubs);
    const freshPeriods = await getPayrollPeriodsFirestore(companyId);
    setPeriods(freshPeriods);
    const freshLogs = await getPayrollAuditLogsFirestore(companyId);
    setAuditLogs(freshLogs);
  };

  const handleReprocessPayroll = async () => {
    if (!currentPeriod || isClosedPeriod) return;
    setProcessingBatch(true);
    try {
      const { period, paystubs: updatedStubs } = await processBatchPayrollFirestore(
        companyId,
        currentPeriod.referenceMonth,
        currentPeriod.type,
        user?.name || 'Administrador DP',
        user?.email || 'dp@maisrh.com.br'
      );

      await handleRefreshData();
    } catch (err) {
      console.error('[Payroll] Erro ao reprocessar folha:', err);
    } finally {
      setProcessingBatch(false);
    }
  };

  const handleClosePeriod = async () => {
    if (!currentPeriod) return;

    // Run pre-closure validation
    const val = await validatePayrollPeriodFirestore(companyId, currentPeriod.id);
    setValidationResult(val);

    if (!val.valid) {
      setShowValidationModal(true);
      return;
    }

    await closePayrollPeriodFirestore(
      companyId,
      currentPeriod.id,
      user?.name || 'Administrador DP',
      user?.email || 'dp@maisrh.com.br'
    );
    await handleRefreshData();
  };

  const handleReopenPeriod = async (reason: string) => {
    if (!currentPeriod) return;
    await reopenPayrollPeriodFirestore(
      companyId,
      currentPeriod.id,
      user?.name || 'Administrador DP',
      user?.email || 'dp@maisrh.com.br',
      reason
    );
    await handleRefreshData();
    setShowReopenModal(false);
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingBatch(true);
    try {
      const { period } = await processBatchPayrollFirestore(
        companyId,
        newPeriodMonth,
        newPeriodType,
        user?.name || 'Administrador DP',
        user?.email || 'dp@maisrh.com.br'
      );
      
      await handleRefreshData();
      setActivePeriodId(period.id);
      setShowNewPeriodModal(false);
    } catch (err) {
      console.error('[Payroll] Erro ao criar nova competência:', err);
    } finally {
      setProcessingBatch(false);
    }
  };

  const handleSaveRubric = async (rubric: RubricDefinition) => {
    await saveRubricFirestore(companyId, rubric);
    const updated = await getRubricCatalogFirestore(companyId);
    setRubrics(updated);
  };

  const handleSaveTaxTable = async (table: TaxTableVersion) => {
    await saveTaxTableFirestore(companyId, table);
    const updated = await getTaxTablesFirestore(companyId);
    if (updated.length > 0) setTaxTable(updated[0]);
  };

  // Employee Portal View
  if (isEmployee) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-400/30">
              Portal do Colaborador • Meus Holerites
            </span>
            <h1 className="text-2xl font-black mt-1 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-400" />
              Meus Recibos de Pagamento (Holerites Digitais)
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Consulte seus proventos, descontos de INSS/IRRF, assine digitalmente e faça download dos recibos mensais.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden p-6 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm">Histórico de Holerites Disponíveis</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myPaystubs.map(stub => (
              <div key={stub.id} className="border border-slate-200 rounded-2xl p-4 space-y-3 hover:border-indigo-500 transition-all shadow-xs bg-slate-50/50">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                      {stub.periodName}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-sm mt-1">{stub.employeeName}</h4>
                    <p className="text-xs text-slate-500">{stub.cargo}</p>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    stub.statusAssinatura === 'Assinado Digitalmente'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {stub.statusAssinatura}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Valor Líquido</span>
                    <span className="font-black text-indigo-600 text-base">
                      R$ {stub.valorLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedPaystub(stub)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visualizar / Assinar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedPaystub && (
          <PaystubModal
            paystub={selectedPaystub}
            isClosedPeriod={false}
            canEdit={false}
            onClose={() => setSelectedPaystub(null)}
            onUpdate={handleRefreshData}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Control Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-400/30">
              Folha de Pagamento — Motor 2026 em Validação
            </span>
            <span className="text-xs text-slate-400">• eSocial em preparação • Firebase Multiempresa</span>
          </div>
          <h1 className="text-2xl font-black mt-1 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-emerald-400" />
            Folha de Pagamento & Encargos Sociais
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Cálculo automatizado de salários, horas extras, insalubridade, INSS, IRRF, FGTS e eSocial com trava de segurança.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-300">Competência:</span>
            <select
              value={activePeriodId}
              onChange={e => setActivePeriodId(e.target.value)}
              className="bg-slate-900 text-white font-extrabold rounded-lg px-2 py-1 border border-slate-700 focus:ring-1 focus:ring-indigo-400"
            >
              {periods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.referenceMonth} ({p.type}) {p.status === 'Fechado' ? '🔒 FECHADO' : '🟢 ABERTO'}
                </option>
              ))}
            </select>
          </div>

          {/* Reprocess Batch Payroll Button */}
          {!isClosedPeriod && (
            <button
              onClick={handleReprocessPayroll}
              disabled={processingBatch}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition-all cursor-pointer border border-indigo-400/30 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              title="Recalcular toda a folha do mês com dados atualizados"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-200 ${processingBatch ? 'animate-spin' : ''}`} />
              <span>{processingBatch ? 'Calculando...' : 'Recalcular Folha'}</span>
            </button>
          )}

          {/* Simulator Modal Trigger */}
          <button
            onClick={() => setShowSimulatorModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs rounded-xl transition-all cursor-pointer border border-slate-700 flex items-center gap-1.5 shadow-sm"
          >
            <Sliders className="w-4 h-4 text-indigo-300" />
            <span>Simulador CLT</span>
          </button>

          {/* New Period */}
          <button
            onClick={() => setShowNewPeriodModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all cursor-pointer border border-emerald-400/30 flex items-center gap-1.5 shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nova Folha / Mês</span>
          </button>

          {/* Security Closure Lock Button */}
          {isClosedPeriod ? (
            <button
              onClick={() => setShowReopenModal(true)}
              className="px-3.5 py-2 bg-amber-600/90 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer border border-amber-400/40 flex items-center gap-1.5 shadow-md"
              title="Reabrir Folha Fechada (Permissão Especial)"
            >
              <Lock className="w-4 h-4 text-amber-200" />
              <span>Folha Fechada (Reabrir)</span>
            </button>
          ) : (
            <button
              onClick={handleClosePeriod}
              className="px-3.5 py-2 bg-rose-700 hover:bg-rose-600 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer border border-rose-400/40 flex items-center gap-1.5 shadow-md"
              title="Travar e Fechar Folha de Pagamento"
            >
              <Unlock className="w-4 h-4 text-rose-200" />
              <span>Fechar Folha (Travar)</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('gestao')}
          className={`px-3.5 py-2.5 font-extrabold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'gestao'
              ? 'bg-white text-indigo-600 border-t-2 border-x border-slate-200 border-t-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Folha Mensal ({periodPaystubs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('lancamentos')}
          className={`px-3.5 py-2.5 font-extrabold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'lancamentos'
              ? 'bg-white text-indigo-600 border-t-2 border-x border-slate-200 border-t-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <DollarSign className="w-4 h-4 text-blue-600" />
          <span>Lançamentos Variáveis & Consignados</span>
        </button>

        <button
          onClick={() => setActiveTab('pagamentos')}
          className={`px-3.5 py-2.5 font-extrabold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'pagamentos'
              ? 'bg-white text-indigo-600 border-t-2 border-x border-slate-200 border-t-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Zap className="w-4 h-4 text-emerald-600" />
          <span>Pagamentos & CNAB 240</span>
        </button>

        <button
          onClick={() => setActiveTab('contabil')}
          className={`px-3.5 py-2.5 font-extrabold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'contabil'
              ? 'bg-white text-indigo-600 border-t-2 border-x border-slate-200 border-t-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Percent className="w-4 h-4 text-violet-600" />
          <span>Provisões & Contabilidade</span>
        </button>

        <button
          onClick={() => setActiveTab('relatorios')}
          className={`px-3.5 py-2.5 font-extrabold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'relatorios'
              ? 'bg-white text-indigo-600 border-t-2 border-x border-slate-200 border-t-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4 text-slate-700" />
          <span>Relatórios Executivos</span>
        </button>

        <button
          onClick={() => setActiveTab('rubricas')}
          className={`px-3.5 py-2.5 font-extrabold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'rubricas'
              ? 'bg-white text-indigo-600 border-t-2 border-x border-slate-200 border-t-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <FileCode className="w-4 h-4 text-amber-600" />
          <span>Rúbricas & Tabelas</span>
        </button>

        <button
          onClick={() => setActiveTab('esocial')}
          className={`px-3.5 py-2.5 font-extrabold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'esocial'
              ? 'bg-white text-indigo-600 border-t-2 border-x border-slate-200 border-t-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <FileCheck className="w-4 h-4 text-emerald-600" />
          <span>eSocial (Preparação)</span>
        </button>

        <button
          onClick={() => setActiveTab('configuracao')}
          className={`px-3.5 py-2.5 font-extrabold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'configuracao'
              ? 'bg-white text-indigo-600 border-t-2 border-x border-slate-200 border-t-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4 text-slate-600" />
          <span>Empresa & Parâmetros</span>
        </button>

        <button
          onClick={() => setActiveTab('auditoria')}
          className={`px-3.5 py-2.5 font-extrabold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'auditoria'
              ? 'bg-white text-indigo-600 border-t-2 border-x border-slate-200 border-t-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Shield className="w-4 h-4 text-indigo-600" />
          <span>Trilha de Auditoria</span>
        </button>

        <button
          onClick={() => setActiveTab('portal')}
          className={`px-3.5 py-2.5 font-extrabold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'portal'
              ? 'bg-white text-indigo-600 border-t-2 border-x border-slate-200 border-t-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Visão do Funcionário</span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'gestao' && (
        <div className="space-y-6">
          
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 flex items-center justify-between">
                Total Proventos (Bruto)
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </span>
              <p className="text-2xl font-black text-slate-900">
                R$ {(currentPeriod?.totalGross || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                Base calculada para {currentPeriod?.totalEmployees || 0} colaboradores
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 flex items-center justify-between">
                Total Descontos (INSS/IRRF)
                <TrendingUp className="w-4 h-4 text-rose-600" />
              </span>
              <p className="text-2xl font-black text-rose-600">
                R$ {(currentPeriod?.totalDiscounts || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md inline-block">
                Retenções fiscais na fonte
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 flex items-center justify-between">
                Total Líquido a Pagar
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              </span>
              <p className="text-2xl font-black text-indigo-600">
                R$ {(currentPeriod?.totalNet || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
                Depósito bancário em conta
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-500 flex items-center justify-between">
                Custo Encargos Empresa
                <Building2 className="w-4 h-4 text-amber-600" />
              </span>
              <p className="text-2xl font-black text-amber-700">
                R$ {(currentPeriod?.totalPatronal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                INSS Patronal (20%) + RAT/Terceiros
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por colaborador ou CPF..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div>
                <label className="font-bold text-slate-600 mr-2">Departamento:</label>
                <select
                  value={departmentFilter}
                  onChange={e => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                >
                  <option value="Todos">Todos os Departamentos</option>
                  <option value="Gente & Gestão">Gente & Gestão</option>
                  <option value="Operações e Logística">Operações e Logística</option>
                  <option value="Comercial">Comercial</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-600 mr-2">Assinatura:</label>
                <select
                  value={signatureFilter}
                  onChange={e => setSignatureFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
                >
                  <option value="Todos">Todos</option>
                  <option value="Pendente">Aguardando Assinatura</option>
                  <option value="Assinado Digitalmente">Assinado Digitalmente</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Paystubs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                    <th className="p-3">Colaborador(a)</th>
                    <th className="p-3">Cargo & Depto</th>
                    <th className="p-3">Salário Base</th>
                    <th className="p-3">Proventos (+)</th>
                    <th className="p-3">Descontos (-)</th>
                    <th className="p-3">Líquido (=)</th>
                    <th className="p-3">Assinatura E-CLT</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {filteredPaystubs.map(stub => (
                    <tr key={stub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{stub.employeeName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">CPF: {stub.cpf}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{stub.cargo}</div>
                        <div className="text-[10px] text-slate-500">{stub.departamento}</div>
                      </td>

                      <td className="p-3 font-semibold text-slate-700">
                        R$ {stub.salarioBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-3 font-extrabold text-emerald-700">
                        R$ {stub.totalProventos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-3 font-extrabold text-rose-700">
                        R$ {stub.totalDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-3 font-black text-indigo-600 text-sm">
                        R$ {stub.valorLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 ${
                          stub.statusAssinatura === 'Assinado Digitalmente'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {stub.statusAssinatura === 'Assinado Digitalmente' && <ShieldCheck className="w-3 h-3 text-emerald-600" />}
                          <span>{stub.statusAssinatura}</span>
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedPaystub(stub)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 border border-indigo-200"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Abrir Holerite</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Lançamentos Variáveis & Consignados Tab */}
      {activeTab === 'lancamentos' && (
        <PayrollVariablePayAndLaunches
          companyId={companyId}
          referenceMonth={currentPeriod?.referenceMonth || '2026-08'}
        />
      )}

      {/* Pagamentos & CNAB 240 Tab */}
      {activeTab === 'pagamentos' && (
        <PayrollPaymentsModule
          companyId={companyId}
          selectedPeriodId={activePeriodId}
        />
      )}

      {/* Provisões & Contabilidade Tab */}
      {activeTab === 'contabil' && (
        <PayrollAccountingAndProvisions
          period={currentPeriod}
          paystubs={periodPaystubs}
        />
      )}

      {/* Relatórios Executivos Tab */}
      {activeTab === 'relatorios' && (
        <PayrollReportsAndDashboard
          period={currentPeriod}
          paystubs={periodPaystubs}
        />
      )}

      {/* Configuração de Parâmetros da Empresa Tab */}
      {activeTab === 'configuracao' && (
        <CompanyPayrollSettingsTab
          companyId={companyId}
        />
      )}

      {/* Rúbricas e Tabelas Tab */}
      {activeTab === 'rubricas' && (
        <RubricsAndTaxesModule
          rubrics={rubrics}
          taxTable={taxTable}
          onSaveRubric={handleSaveRubric}
          onSaveTaxTable={handleSaveTaxTable}
          isClosedPeriod={isClosedPeriod}
        />
      )}

      {/* RH_ESOCIAL_PREPARATION_ONLY_V1 */}
      {/* Não exibir transmissão simulada como se fosse integração oficial. */}
      {activeTab === 'esocial' && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-xs p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-black text-slate-900 text-base">eSocial — Preparação e Validação</h3>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                O RH-MIL organiza os dados necessários para os eventos trabalhistas, mas esta versão ainda não realiza transmissão oficial ao ambiente do eSocial.
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 leading-relaxed">
            <strong>Importante:</strong> nenhum registro desta tela deve ser tratado como evento transmitido, protocolo, recibo ou retorno oficial do Governo. A integração será liberada somente após existir envio real, consulta de retorno, tratamento de erros, recibos e histórico por empresa.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-200 p-4">
              <strong className="text-slate-900">Disponível agora</strong>
              <p className="text-slate-600 mt-1">Cadastro e validação dos dados de folha/DP que servirão de base para os eventos.</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <strong className="text-slate-900">Pendente para integração oficial</strong>
              <p className="text-slate-600 mt-1">Envio ao eSocial, retorno, erros, protocolo/recibo e consulta de histórico oficial.</p>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'auditoria' && <PayrollAuditTab logs={auditLogs} />}

      {/* Employee Portal Tab */}
      {activeTab === 'portal' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-black text-slate-900 text-base">Simulação da Experiência do Colaborador</h3>
              <p className="text-xs text-slate-500">
                Esta tela reflete exatamente a visão que o funcionário comum possui ao acessar o portal RH TRANSFORMA.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-300">
              Modo Visão Restrita
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myPaystubs.map(stub => (
              <div key={stub.id} className="border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs bg-slate-50">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                      {stub.periodName}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-sm mt-1">{stub.employeeName}</h4>
                    <p className="text-xs text-slate-500">{stub.cargo}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Valor Líquido</span>
                    <span className="font-black text-indigo-600 text-base">
                      R$ {stub.valorLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedPaystub(stub)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visualizar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paystub Detail Modal */}
      {selectedPaystub && (
        <PaystubModal
          paystub={selectedPaystub}
          isClosedPeriod={isClosedPeriod}
          canEdit={isMasterOrAdmin}
          onClose={() => setSelectedPaystub(null)}
          onUpdate={handleRefreshData}
        />
      )}

      {/* Payroll Simulator Modal */}
      {showSimulatorModal && (
        <PayrollSimulatorModal onClose={() => setShowSimulatorModal(false)} />
      )}

      {/* Reopen Period Security Modal */}
      {showReopenModal && currentPeriod && (
        <ReopenPeriodModal
          periodName={`${currentPeriod.referenceMonth} (${currentPeriod.type})`}
          onConfirm={handleReopenPeriod}
          onClose={() => setShowReopenModal(false)}
        />
      )}

      {/* Validation Failure Modal */}
      {showValidationModal && validationResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-black text-slate-900">Inconsistências Pré-Fechamento</h3>
            </div>

            <p className="text-xs text-slate-600">
              Corrija os erros listados abaixo antes de travar a folha de pagamento:
            </p>

            <ul className="space-y-1 text-xs text-rose-700 font-bold bg-rose-50 border border-rose-200 p-3 rounded-xl">
              {validationResult.errors.map((err, i) => (
                <li key={i}>• {err}</li>
              ))}
            </ul>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Folha / Mês */}
      {showNewPeriodModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Iniciar Nova Competência de Folha</h3>

            <form onSubmit={handleCreatePeriod} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mês de Referência (YYYY-MM) *</label>
                <input
                  type="month"
                  required
                  value={newPeriodMonth}
                  onChange={e => setNewPeriodMonth(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo da Folha *</label>
                <select
                  value={newPeriodType}
                  onChange={e => setNewPeriodType(e.target.value as PayrollType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800"
                >
                  <option value="Mensal">Mensal Tradicional</option>
                  <option value="Complementar">Complementar</option>
                  <option value="13º Salário (1ª Parcela)">13º Salário (1ª Parcela)</option>
                  <option value="13º Salário (2ª Parcela)">13º Salário (2ª Parcela)</option>
                  <option value="Férias">Férias</option>
                  <option value="Adiantamento Salarial">Adiantamento Salarial</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewPeriodModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processingBatch}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-extrabold text-white cursor-pointer shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  {processingBatch && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{processingBatch ? 'Processando...' : 'Criar e Processar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
