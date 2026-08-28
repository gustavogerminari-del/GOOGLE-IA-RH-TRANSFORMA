import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Users, 
  DollarSign, 
  TrendingUp, 
  PlusCircle, 
  Filter, 
  Search, 
  Calendar, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  PieChart, 
  Building2, 
  Star, 
  FileText, 
  AlertCircle,
  Plus,
  ArrowUpRight,
  ShieldAlert
} from 'lucide-react';
import { ConsultantClient, ConsultantJob, ConsultantCandidateScreening, JobExpense } from './types';
import { formatFirestoreDate } from '../lib/firestoreUtils';
import { ConsultantDataService, syncConsultantDataWithFirestore } from './services/consultantDataService';

export const RHConsultantView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vagas' | 'clientes' | 'financeiro'>('dashboard');
  const [clients, setClients] = useState<ConsultantClient[]>([]);
  const [jobs, setJobs] = useState<ConsultantJob[]>([]);
  const [screenings, setScreenings] = useState<ConsultantCandidateScreening[]>([]);
  const [selectedClientFilter, setSelectedClientFilter] = useState('Todos');

  useEffect(() => {
    async function loadConsultantData() {
      await syncConsultantDataWithFirestore();
      setClients(ConsultantDataService.getClients());
      setJobs(ConsultantDataService.getJobs());
      setScreenings(ConsultantDataService.getScreenings());
    }
    loadConsultantData();
  }, []);

  // New Job Modal State
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobClientId, setNewJobClientId] = useState(clients[0]?.id || '');
  const [newJobFeeValue, setNewJobFeeValue] = useState(8000);
  const [newJobCommissionPercent, setNewJobCommissionPercent] = useState(15);
  const [newJobPaymentMethod, setNewJobPaymentMethod] = useState<'Pix' | 'Boleto' | 'Transferência' | 'Cartão' | 'Faturamento 30 Dias'>('Pix');

  // New Expense Modal State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedJobForExpense, setSelectedJobForExpense] = useState<string>('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<'Anúncio de Vaga' | 'Análise de Perfil/Assessment' | 'Viagem/Deslocamento' | 'Softwares/Testes' | 'Outros'>('Anúncio de Vaga');
  const [expenseAmount, setExpenseAmount] = useState(250);

  // Financial Calculations
  const totalRevenueReceived = jobs.reduce((acc, j) => acc + j.financial.amountReceived, 0);
  const totalCommissions = jobs.reduce((acc, j) => acc + j.financial.commissionValue, 0);
  const totalExpenses = jobs.reduce((acc, j) => {
    const jobExpSum = j.expenses.reduce((eAcc, e) => eAcc + e.amount, 0);
    return acc + jobExpSum;
  }, 0);
  const netProfit = totalRevenueReceived - totalCommissions - totalExpenses;

  // Handler for adding new job
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === newJobClientId);
    if (!client) return;

    const commissionVal = (newJobFeeValue * newJobCommissionPercent) / 100;

    const newJob: ConsultantJob = {
      id: `cjob-${Date.now()}`,
      code: `CON-0${jobs.length + 1}`,
      title: newJobTitle,
      clientId: client.id,
      clientName: client.name,
      status: 'Em Triagem',
      candidatesCount: 0,
      financial: {
        feeValue: newJobFeeValue,
        paymentMethod: newJobPaymentMethod,
        commissionRatePercent: newJobCommissionPercent,
        commissionValue: commissionVal,
        amountReceived: 0,
        isPaid: false
      },
      expenses: [],
      createdAt: new Date().toISOString().split('T')[0]
    };

    const saved = await ConsultantDataService.saveJob(newJob);
    setJobs([saved, ...jobs.filter(j => j.id !== saved.id)]);
    setShowNewJobModal(false);
    setNewJobTitle('');
  };

  // Handler for adding new expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForExpense) return;

    const newExpense: JobExpense = {
      id: `exp-${Date.now()}`,
      jobId: selectedJobForExpense,
      clientId: jobs.find(j => j.id === selectedJobForExpense)?.clientId || '',
      description: expenseDescription,
      category: expenseCategory,
      amount: expenseAmount,
      date: new Date().toISOString().split('T')[0]
    };

    const targetJob = jobs.find(j => j.id === selectedJobForExpense);
    if (targetJob) {
      const updatedJob: ConsultantJob = {
        ...targetJob,
        expenses: [...(targetJob.expenses || []), newExpense]
      };
      await ConsultantDataService.saveJob(updatedJob);
      setJobs(jobs.map(j => j.id === selectedJobForExpense ? updatedJob : j));
    }

    setShowExpenseModal(false);
    setExpenseDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            Módulo Consultoria de RH Exclusiva
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Portal do Consultor de RH</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão restrita de carteira de clientes, vagas vinculadas, triagem de candidatos e demonstrativo financeiro/DRE por vaga.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExpenseModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
          >
            <Receipt className="w-4 h-4 text-slate-600" />
            Lançar Despesa
          </button>

          <button
            onClick={() => setShowNewJobModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Nova Vaga do Cliente
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'dashboard'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Painel Consolidado
        </button>
        <button
          onClick={() => setActiveTab('vagas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'vagas'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Vagas & Triagem ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('clientes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'clientes'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Clientes Vinculados ({clients.length})
        </button>
        <button
          onClick={() => setActiveTab('financeiro')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'financeiro'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          DRE & Lucro por Vaga
        </button>
      </div>

      {/* TAB 1: DASHBOARD CONSOLIDADO */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Valor Cobrado Total</span>
                <DollarSign className="w-5 h-5 text-indigo-600 bg-indigo-50 p-1 rounded-lg" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">
                R$ {jobs.reduce((a, b) => a + b.financial.feeValue, 0).toLocaleString('pt-BR')}
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3" />
                {jobs.length} Vagas sob contrato
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Valor Efetivamente Recebido</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 bg-emerald-50 p-1 rounded-lg" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">
                R$ {totalRevenueReceived.toLocaleString('pt-BR')}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Entradas confirmadas
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Despesas Totais do Consultor</span>
                <Receipt className="w-5 h-5 text-rose-600 bg-rose-50 p-1 rounded-lg" />
              </div>
              <p className="text-2xl font-extrabold text-rose-600 mt-2">
                - R$ {totalExpenses.toLocaleString('pt-BR')}
              </p>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Anúncios, DISC, Testes
              </span>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-indigo-200">Lucro Líquido Realizado</span>
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-white mt-2">
                R$ {netProfit.toLocaleString('pt-BR')}
              </p>
              <span className="text-[11px] text-indigo-200 mt-1 block">
                (Recebido - Comissões - Gastos)
              </span>
            </div>
          </div>

          {/* Jobs Financial Summary Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-600" />
              Resumo Operacional & Financeiro de Vagas do Consultor
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-4">Vaga / Código</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Valor Cobrado</th>
                    <th className="py-3 px-4 text-right">Comissão (R$)</th>
                    <th className="py-3 px-4 text-right">Gastos (R$)</th>
                    <th className="py-3 px-4 text-right">Lucro Estimado/Real</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {jobs.map((job) => {
                    const jobExp = job.expenses.reduce((acc, e) => acc + e.amount, 0);
                    const jobProfit = job.financial.amountReceived - job.financial.commissionValue - jobExp;

                    return (
                      <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {job.title}
                          <span className="block text-[10px] text-indigo-600 font-semibold">{job.code}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{job.clientName}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            job.status === 'Aprovado / Fechada'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : job.status === 'Entrevistas'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-800">
                          R$ {job.financial.feeValue.toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-600">
                          R$ {job.financial.commissionValue.toLocaleString('pt-BR')} ({job.financial.commissionRatePercent}%)
                        </td>
                        <td className="py-3 px-4 text-right text-rose-600 font-semibold">
                          - R$ {jobExp.toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-700">
                          R$ {jobProfit.toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VAGAS & TRIAGEM */}
      {activeTab === 'vagas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Vagas List */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Suas Vagas de Consultoria</h3>
                <span className="text-xs text-slate-500">Acesso Restrito ao Consultor</span>
              </div>

              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {job.clientName}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-1">{job.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Código: {job.code} • Criada em {formatFirestoreDate(job.createdAt)}</p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      job.status === 'Aprovado / Fechada' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {job.status}
                    </span>
                  </div>

                  {/* Financial Mini Details */}
                  <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Valor Cobrado</span>
                      <span className="font-bold text-slate-800">R$ {job.financial.feeValue.toLocaleString('pt-BR')}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Pagamento</span>
                      <span className="font-semibold text-slate-700">{job.financial.paymentMethod}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Despesas da Vaga</span>
                      <span className="font-bold text-rose-600">
                        - R$ {job.expenses.reduce((a, b) => a + b.amount, 0).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      {job.candidatesCount} candidatos em triagem
                    </span>
                    <button className="text-indigo-600 font-semibold hover:underline flex items-center gap-1">
                      Ver Triagem & Feedbacks →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Candidate Screening Panel */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Triagem & Feedbacks Recentes
              </h3>

              <div className="space-y-3">
                {screenings.map((sc) => (
                  <div key={sc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-slate-900 text-xs">{sc.candidateName}</h5>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                        {sc.tag}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400 text-xs">
                      {[...Array(sc.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>

                    <p className="text-xs text-slate-600 italic">
                      "{sc.notes}"
                    </p>

                    {sc.interviewScheduledDate && (
                      <div className="bg-emerald-50 text-emerald-800 p-2 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        Entrevista: {sc.interviewScheduledDate}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: CLIENTES VINCULADOS */}
      {activeTab === 'clientes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clients.map((cli) => (
            <div key={cli.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{cli.name}</h4>
                    <p className="text-xs text-slate-500">CNPJ: {cli.cnpj}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <p><strong>Contato do Cliente:</strong> {cli.contactName}</p>
                <p><strong>E-mail:</strong> {cli.email}</p>
                <p><strong>Telefone:</strong> {cli.phone}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  {cli.activeJobsCount} Vagas Contratadas
                </span>
                <span className="font-extrabold text-slate-800">
                  Total de Contratos: R$ {cli.totalFeeValue.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: FINANCEIRO & DRE */}
      {activeTab === 'financeiro' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Demonstrativo de Resultado (DRE) da Consultoria</h3>
              <p className="text-xs text-slate-500 mt-0.5">Apuração automática de receitas, comissões e despesas operacionais por projeto.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Receita Bruta Cobrada</span>
              <p className="text-2xl font-extrabold text-emerald-900 mt-1">
                R$ {jobs.reduce((a, b) => a + b.financial.feeValue, 0).toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Comissões + Gastos Totais</span>
              <p className="text-2xl font-extrabold text-rose-900 mt-1">
                R$ {(totalCommissions + totalExpenses).toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Lucro Operacional Líquido</span>
              <p className="text-2xl font-extrabold text-indigo-900 mt-1">
                R$ {netProfit.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVA VAGA DO CLIENTE */}
      {showNewJobModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Nova Vaga para Cliente Vinculado</h3>

            <form onSubmit={handleCreateJob} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cliente *</label>
                <select
                  value={newJobClientId}
                  onChange={(e) => setNewJobClientId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título do Cargo / Vaga *</label>
                <input
                  type="text"
                  required
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  placeholder="Ex: Gerente Comercial"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valor Cobrado (R$) *</label>
                  <input
                    type="number"
                    required
                    value={newJobFeeValue}
                    onChange={(e) => setNewJobFeeValue(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Comissão (%) *</label>
                  <input
                    type="number"
                    required
                    value={newJobCommissionPercent}
                    onChange={(e) => setNewJobCommissionPercent(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Forma de Pagamento *</label>
                <select
                  value={newJobPaymentMethod}
                  onChange={(e) => setNewJobPaymentMethod(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="Pix">Pix</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Transferência">Transferência</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Faturamento 30 Dias">Faturamento 30 Dias</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewJobModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  Criar Vaga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LANÇAR DESPESA */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Lançar Despesa da Vaga / Consultoria</h3>

            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vaga / Projeto Vinculado *</label>
                <select
                  value={selectedJobForExpense}
                  onChange={(e) => setSelectedJobForExpense(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="">Selecione uma vaga...</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.title} ({j.clientName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição do Gasto *</label>
                <input
                  type="text"
                  required
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="Ex: Anúncio impulsionado LinkedIn"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  >
                    <option value="Anúncio de Vaga">Anúncio de Vaga</option>
                    <option value="Análise de Perfil/Assessment">Assessment / DISC</option>
                    <option value="Viagem/Deslocamento">Viagem/Deslocamento</option>
                    <option value="Softwares/Testes">Softwares/Testes</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valor do Gasto (R$) *</label>
                  <input
                    type="number"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
                >
                  Registrar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
