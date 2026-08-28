import React, { useState, useEffect } from 'react';
import { HeadhunterDashboard } from './components/HeadhunterDashboard';
import { HeadhunterClientes } from './components/HeadhunterClientes';
import { HeadhunterComercial } from './components/HeadhunterComercial';
import { HeadhunterFinanceiro } from './components/HeadhunterFinanceiro';
import { HeadhunterCandidatos } from './components/HeadhunterCandidatos';
import { HeadhunterPortalCliente } from './components/HeadhunterPortalCliente';
import { HeadhunterApresentacoes } from './components/HeadhunterApresentacoes'; // RH_HEADHUNTER_COMPETITIVE_V1
import { HeadhunterProjetos } from './components/HeadhunterProjetos';
import { HeadhunterCandidate } from './types';

// Unified Recruitment Core Modules
import { 
  UnifiedJobsView,
  UnifiedTalentBankView,
  UnifiedPipelineView,
  UnifiedInterviewsView,
  UnifiedAgendaView,
  UnifiedContratacoesView,
  UnifiedContextualAiModal,
  recruitmentService,
  syncRecruitmentWithFirestore,
  UnifiedJob,
  UnifiedCandidate,
  UnifiedInterview,
  UnifiedHiring,
  UnifiedAgendaEvent
} from '../recruitment-core';

import { 
  HeadhunterClient, 
  HeadhunterLead, 
  HeadhunterCommission, 
  HeadhunterFinanceItem, 
  HeadhunterExpense, 
  HeadhunterContract,
  HeadhunterProposal,
  LeadStage,
  ProposalStatus,
  ContractStatus
} from './types';
import { HeadhunterDataService, syncHeadhunterDataWithFirestore } from './services/headhunterDataService';
import { HeadhunterFinanceService, syncHeadhunterFinanceWithFirestore } from './services/headhunterFinanceService';
import { useAuth } from '../auth/context/AuthContext';
import { getCompanyId } from '../auth/profile';
import { HEADHUNTER_ORIGIN_FIELDS } from '../recruitment-core/utils/processOrigin';

export type HeadhunterSubTab = 
  | 'dashboard'
  | 'clientes'
  | 'comercial'
  | 'financeiro'
  // Backward compatibility alias for former loose tabs:
  | 'crm'
  | 'vagas'
  | 'candidatos'
  | 'pipeline'
  | 'entrevistas'
  | 'contratacoes'
  | 'agenda'
  | 'comissoes'
  | 'despesas'
  | 'contratos'
  | 'relatorios'
  | 'portal_cliente'
  | 'apresentacoes';

interface HeadhunterViewProps {
  initialSubTab?: HeadhunterSubTab;
  selectedFinancialId?: string | null;
}

const STORAGE_KEY = 'mais_rh_headhunter_data_v2';

export const HeadhunterView: React.FC<HeadhunterViewProps> = ({ initialSubTab = 'dashboard', selectedFinancialId }) => {
  const { user } = useAuth();
  const companyId = getCompanyId(user) || '';
  const [activeTab, setActiveTab] = useState<HeadhunterSubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      // Map routes to main sections
      if (initialSubTab === 'crm' || initialSubTab === 'contratos') {
        setActiveTab('comercial');
      } else if (initialSubTab === 'comissoes' || initialSubTab === 'despesas' || initialSubTab === 'relatorios') {
        setActiveTab('financeiro');
      } else if (initialSubTab === 'projetos' || (initialSubTab as any) === 'headhunter-projetos') {
        setActiveTab('vagas');
      } else if ((initialSubTab as any) === 'portal-cliente' || (initialSubTab as any) === 'headhunter-portal-cliente') {
        setActiveTab('portal_cliente');
      } else {
        setActiveTab(initialSubTab);
      }
    }
  }, [initialSubTab]);

  // Unified shared data via recruitmentService
  const [jobs, setJobs] = useState<UnifiedJob[]>([]);
  const [candidates, setCandidates] = useState<UnifiedCandidate[]>([]);
  const [interviews, setInterviews] = useState<UnifiedInterview[]>([]);
  const [hirings, setHirings] = useState<UnifiedHiring[]>([]);
  const [agendaEvents, setAgendaEvents] = useState<UnifiedAgendaEvent[]>([]);

  // Headhunter state from Firestore service
  const [clients, setClients] = useState<HeadhunterClient[]>([]);
  const [leads, setLeads] = useState<HeadhunterLead[]>([]);
  const [proposals, setProposals] = useState<HeadhunterProposal[]>([]);
  const [contracts, setContracts] = useState<HeadhunterContract[]>([]);
  const [commissions, setCommissions] = useState<HeadhunterCommission[]>([]);
  const [financial, setFinancial] = useState<HeadhunterFinanceItem[]>([]);
  const [expenses, setExpenses] = useState<HeadhunterExpense[]>([]);

  // Background refresh when Firestore loads
  useEffect(() => {
    async function loadData() {
      if (!companyId) return;
      await Promise.all([
        syncHeadhunterDataWithFirestore(companyId),
        syncHeadhunterFinanceWithFirestore(companyId),
        syncRecruitmentWithFirestore(companyId),
      ]);
      setClients(HeadhunterDataService.getClients(companyId));
      setLeads(HeadhunterDataService.getLeads(companyId));
      setProposals(HeadhunterDataService.getProposals(companyId));
      setContracts(HeadhunterDataService.getContracts(companyId));
      setCommissions(HeadhunterFinanceService.getComissoes(companyId));
      setExpenses(HeadhunterFinanceService.getDespesas(companyId));
      setJobs(recruitmentService.getJobs(companyId));
      setCandidates(recruitmentService.getCandidates(companyId));
      setInterviews(recruitmentService.getInterviews(companyId));
      setHirings(recruitmentService.getHirings(companyId));
      setAgendaEvents(recruitmentService.getAgendaEvents(companyId));
    }
    void loadData();
  }, [companyId]);

  // AI Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiActionType, setAiActionType] = useState('resumoExecutivo');
  const [aiInitialData, setAiInitialData] = useState<any>(null);

  const handleOpenAiModal = (type: string, data?: any) => {
    setAiActionType(type);
    setAiInitialData(data);
    setAiModalOpen(true);
  };

  // State Handlers with Firestore persistence
  const handleAddClient = async (cli: HeadhunterClient) => {
    const saved = await HeadhunterDataService.saveClient({ ...cli, empresaId: companyId, companyId });
    setClients([saved, ...clients.filter(item => item.id !== saved.id)]);
    return saved;
  };

  const handleAddLead = async (ld: HeadhunterLead) => {
    const saved = await HeadhunterDataService.saveLead({ ...ld, empresaId: companyId, companyId });
    setLeads([saved, ...leads.filter(item => item.id !== saved.id)]);
  };

  const handleUpdateLeadStage = async (id: string, stage: LeadStage) => {
    const updated = leads.map(l => l.id === id ? { ...l, etapa: stage } : l);
    const target = updated.find(l => l.id === id);
    if (target) await HeadhunterDataService.saveLead({ ...target, empresaId: companyId, companyId });
    setLeads(updated);
  };

  const handleAddProposal = async (prop: HeadhunterProposal) => {
    const saved = await HeadhunterDataService.saveProposal({ ...prop, empresaId: companyId, companyId });
    setProposals([saved, ...proposals.filter(item => item.id !== saved.id)]);
  };

  const handleUpdateProposalStatus = async (id: string, status: ProposalStatus) => {
    const updated = proposals.map(p => p.id === id ? { ...p, status } : p);
    const target = updated.find(p => p.id === id);
    if (target) await HeadhunterDataService.saveProposal({ ...target, empresaId: companyId, companyId });
    setProposals(updated);
  };

  const handleAddContract = async (ctr: HeadhunterContract) => {
    const saved = await HeadhunterDataService.saveContract({ ...ctr, empresaId: companyId, companyId });
    setContracts([saved, ...contracts.filter(item => item.id !== saved.id)]);
  };

  const handleUpdateContractStatus = async (id: string, status: ContractStatus) => {
    const updated = contracts.map(c => c.id === id ? { ...c, status } : c);
    const target = updated.find(c => c.id === id);
    if (target) await HeadhunterDataService.saveContract({ ...target, empresaId: companyId, companyId });
    setContracts(updated);
  };

  const handleCreateJobFromContract = async (ctr: HeadhunterContract) => {
    // Creates a new job in the Recruitment core operational layer linked to this contract
    const newJob: UnifiedJob = {
      id: `vaga-${Date.now()}`,
      empresaId: companyId,
      companyId,
      titulo: ctr.tituloContrato.replace('Contrato ', '') || 'Vaga Executive Search',
      cargo: ctr.tituloContrato || 'Executivo',
      descricao: ctr.escopo || 'Busca executiva para posição sênior.',
      requisitos: [],
      salario: 'A combinar',
      tipoContrato: 'CLT',
      location: '',
      department: '',
      clienteId: ctr.clienteId,
      clienteNome: ctr.clienteNome,
      contratoId: ctr.id,
      tipoVaga: 'headhunter',
      ...HEADHUNTER_ORIGIN_FIELDS,
      status: 'Aberta',
      dataCriacao: new Date().toISOString().split('T')[0],
      dataAbertura: new Date().toISOString().split('T')[0],
      valorVaga: Number(ctr.valorContrato || 0),
      consultorResponsavel: ctr.responsavelComercial || (user as any)?.name || user?.email || '',
      quantidadeVagas: 1,
      candidatosIds: []
    };

    const saved = await recruitmentService.saveJob(newJob);
    setJobs([saved, ...jobs.filter(item => item.id !== saved.id)]);
    alert(`Vaga "${saved.titulo}" criada com sucesso no módulo de Recrutamento para o cliente ${ctr.clienteNome}!`);
  };

  return (
    <div className="w-full space-y-6">
      {/* Subtab Navigation Header */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Visão Geral
        </button>

        <button
          onClick={() => setActiveTab('vagas')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'vagas' || activeTab === 'projetos' || activeTab === ('headhunter-projetos' as any)
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Projetos
        </button>

        <button
          onClick={() => setActiveTab('apresentacoes')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'apresentacoes' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Apresentações & SLA
        </button>
        <button
          onClick={() => setActiveTab('clientes')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'clientes'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Clientes
        </button>

        <button
          onClick={() => setActiveTab('financeiro')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'financeiro' || activeTab === 'comissoes' || activeTab === 'despesas' || activeTab === 'relatorios'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Financeiro
        </button>

        <button
          onClick={() => setActiveTab('portal_cliente')}
          className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'portal_cliente'
              ? 'bg-indigo-900 text-white shadow-xs'
              : 'text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100'
          }`}
        >
          <span>Portal do Cliente</span>
        </button>
      </div>

      <main className="w-full space-y-6">
        {(activeTab === 'dashboard') && (
          <HeadhunterDashboard
            clients={clients}
            jobs={jobs as any}
            commissions={commissions}
            expenses={expenses}
            interviews={interviews as any}
            events={agendaEvents as any}
            leads={leads}
            candidates={candidates as any}
            financial={financial}
            onNavigateTab={tab => {
              if (tab === 'crm' || tab === 'contratos') setActiveTab('comercial');
              else if (tab === 'comissoes' || tab === 'despesas' || tab === 'relatorios') setActiveTab('financeiro');
              else if (tab === 'candidatos') setActiveTab('prospeccao' as any);
              else setActiveTab(tab);
            }}
            onOpenAiModal={handleOpenAiModal}
          />
        )}

        {(activeTab === ('prospeccao' as any) || activeTab === 'candidatos') && (
          <HeadhunterCandidatos
            candidates={candidates as any}
            jobs={jobs as any}
            onAddCandidate={async (newCand) => {
              const saved = await recruitmentService.saveCandidate({ ...newCand, empresaId: companyId, companyId } as any);
              setCandidates([saved, ...candidates.filter(item => item.id !== saved.id)]);
            }}
            onUpdateCandidate={async (updatedCand) => {
              const saved = await recruitmentService.saveCandidate({ ...updatedCand, empresaId: companyId, companyId } as any);
              setCandidates(candidates.map(c => c.id === saved.id ? saved : c));
            }}
            onDeleteCandidate={(id) => {
              setCandidates(candidates.filter(c => c.id !== id));
            }}
            onOpenAiModal={handleOpenAiModal}
          />
        )}

        {activeTab === 'apresentacoes' && (
          <HeadhunterApresentacoes
            clients={clients}
            jobs={jobs as any}
            candidates={candidates as any}
            onUpdateCandidate={async (updatedCand) => {
              const saved = await recruitmentService.saveCandidate({ ...updatedCand, empresaId: companyId, companyId } as any);
              setCandidates(current => current.map(c => c.id === saved.id ? saved : c));
            }}
          />
        )}
        {activeTab === 'clientes' && (
          <HeadhunterClientes
            clients={clients}
            onAddClient={handleAddClient}
            onOpenAiModal={handleOpenAiModal}
          />
        )}

        {(activeTab === 'comercial' || activeTab === 'crm' || activeTab === 'contratos') && (
          <HeadhunterComercial
            leads={leads}
            clients={clients}
            proposals={proposals}
            contracts={contracts}
            onAddLead={handleAddLead}
            onUpdateLeadStage={handleUpdateLeadStage}
            onAddProposal={handleAddProposal}
            onUpdateProposalStatus={handleUpdateProposalStatus}
            onAddContract={handleAddContract}
            onUpdateContractStatus={handleUpdateContractStatus}
            onCreateJobFromContract={handleCreateJobFromContract}
            onOpenAiModal={handleOpenAiModal}
          />
        )}

        {(activeTab === 'financeiro' || activeTab === 'comissoes' || activeTab === 'despesas' || activeTab === 'relatorios') && (
          <HeadhunterFinanceiro
            companyId={companyId}
            financial={financial}
            expenses={expenses}
            clients={clients}
            jobs={jobs}
            candidates={candidates}
            hirings={hirings}
            contracts={contracts}
            proposals={proposals}
            selectedFinancialId={selectedFinancialId}
            onAddFinanceItem={item => setFinancial([item, ...financial])}
            onOpenAiModal={handleOpenAiModal}
          />
        )}

        {/* Operational views routed when accessed directly from recruitment links */}
        {(activeTab === 'vagas' || activeTab === 'projetos' || activeTab === ('headhunter-projetos' as any)) && (
          <HeadhunterProjetos
            jobs={jobs}
            candidates={candidates}
            interviews={interviews}
            clients={clients}
            contracts={contracts}
            proposals={proposals}
            onCreateClient={handleAddClient}
            onSaveJob={async savedJob => {
              const persisted = await recruitmentService.saveJob({ ...savedJob, empresaId: companyId, companyId });
              setJobs([persisted, ...jobs.filter(j => j.id !== persisted.id)]);
            }}
            onOpenAiModal={handleOpenAiModal}
          />
        )}

        {activeTab === 'candidatos' && (
          <UnifiedTalentBankView
            origemProcesso="headhunter"
            candidates={candidates}
            jobs={jobs}
            onUpdateCandidates={updated => setCandidates(updated)}
            onOpenAiModal={handleOpenAiModal}
          />
        )}

        {activeTab === 'pipeline' && (
          <UnifiedPipelineView
            origemProcesso="headhunter"
            job={jobs[0] || { id: 'vaga-0', titulo: 'Vaga Selecionada', origemProcesso: 'headhunter' }}
            candidates={candidates}
            onBack={() => setActiveTab('vagas')}
            onOpenAiModal={handleOpenAiModal}
          />
        )}

        {activeTab === 'entrevistas' && (
          <UnifiedInterviewsView
            origemProcesso="headhunter"
            interviews={interviews}
            onScheduleInterview={newInt => setInterviews([newInt, ...interviews])}
            onOpenAiModal={handleOpenAiModal}
          />
        )}

        {activeTab === 'contratacoes' && (
          <UnifiedContratacoesView
            origemProcesso="headhunter"
            hirings={hirings}
            onOpenAiModal={handleOpenAiModal}
          />
        )}

        {activeTab === 'agenda' && (
          <UnifiedAgendaView
            origemProcesso="headhunter"
            events={agendaEvents}
            onAddEvent={async evt => {
              const saved = await recruitmentService.createAgendaEvent({ ...evt, empresaId: companyId, companyId });
              setAgendaEvents([saved, ...agendaEvents.filter(item => item.id !== saved.id)]);
            }}
          />
        )}
        {activeTab === 'portal_cliente' && (
          <HeadhunterPortalCliente
            clients={clients}
            jobs={jobs as any}
            candidates={candidates as any}
            interviews={interviews as any}
            onUpdateCandidate={async updatedCand => {
              const saved = await recruitmentService.saveCandidate({ ...updatedCand, empresaId: companyId, companyId } as any);
              setCandidates(candidates.map(c => c.id === saved.id ? saved : c));
            }}
            onOpenAiModal={handleOpenAiModal}
          />
        )}
      </main>

      {/* Centralized Contextual AI Modal */}
      {aiModalOpen && (
        <UnifiedContextualAiModal
          origemProcesso="headhunter"
          initialActionType={aiActionType}
          initialData={aiInitialData}
          onClose={() => setAiModalOpen(false)}
        />
      )}
    </div>
  );
};
