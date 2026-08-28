import React, { useState, useMemo } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Building2, 
  Users, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  FileText, 
  ChevronRight, 
  X,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  UserCheck,
  CreditCard,
  History,
  Filter,
  Layers
} from 'lucide-react';
import { useAuth } from '../../auth';
import { 
  UnifiedJob, 
  UnifiedCandidate, 
  UnifiedInterview 
} from '../../recruitment-core/types/recruitment';
import { HeadhunterClient, HeadhunterContract, HeadhunterProposal } from '../types';
import { JobFormModal } from '../../jobs/components/JobFormModal';

interface HeadhunterProjetosProps {
  jobs: UnifiedJob[];
  candidates?: UnifiedCandidate[];
  interviews?: UnifiedInterview[];
  clients?: HeadhunterClient[];
  contracts?: HeadhunterContract[];
  proposals?: HeadhunterProposal[];
  onSaveJob?: (job: UnifiedJob) => void;
  onCreateClient?: (client: HeadhunterClient) => Promise<HeadhunterClient> | HeadhunterClient;
  onOpenAiModal?: (type: string, data?: any) => void;
}

export const HeadhunterProjetos: React.FC<HeadhunterProjetosProps> = ({
  jobs = [],
  candidates = [],
  interviews = [],
  clients = [],
  contracts = [],
  proposals = [],
  onSaveJob,
  onCreateClient,
  onOpenAiModal
}) => {
  const { user } = useAuth();
  const userCompanyId = user?.empresaId || user?.companyId || user?.tenantId;
  const isMaster = user?.role === 'Super Administrador' || user?.role === 'MASTER' || user?.tipoUsuario === 'MASTER' || user?.isMaster === true;

  const [searchTerm, setSearchTerm] = useState('');
  const [origemFilter, setOrigemFilter] = useState('Todas');
  const [statusFilter, setStatusFilter] = useState('Todas');
  const [selectedJob, setSelectedJob] = useState<UnifiedJob | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'resumo' | 'cliente' | 'vaga' | 'financeiro' | 'historico' | 'documentos' | 'apresentacoes'>('resumo');
  
  // Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<UnifiedJob | null>(null);

  // All jobs belonging to the company (Exibição Unificada)
  const companyJobs = useMemo(() => {
    return jobs.filter(j => {
      const cId = j.empresaId || j.companyId || (j as any).tenantId;
      if (!isMaster && userCompanyId && cId && cId !== userCompanyId && cId !== '') return false;
      return true;
    });
  }, [jobs, isMaster, userCompanyId]);

  // Apply Search, Origem, and Status Filters
  const filteredJobs = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return companyJobs.filter(j => {
      // 1. Search term
      const term = searchTerm.toLowerCase().trim();
      const title = (j.titulo || j.title || '').toLowerCase();
      const clientName = (j.clienteNome || '').toLowerCase();
      const dept = (j.department || j.departamento || '').toLowerCase();
      const recruiter = (j.consultorResponsavel || j.recruiterName || j.recrutadorResponsavel || '').toLowerCase();

      const matchesSearch = !term ||
        title.includes(term) ||
        clientName.includes(term) ||
        dept.includes(term) ||
        recruiter.includes(term);

      // 2. Origem Filter
      let matchesOrigem = true;
      const isHead = j.origemProcesso === 'headhunter' || j.isHeadhunter || (j as any).projetoHeadhunter;
      const hasClient = Boolean(j.clienteNome || j.clienteId);

      if (origemFilter === 'Vagas internas') {
        matchesOrigem = !isHead && !hasClient && j.origemProcesso !== 'recrutamento_cliente';
      } else if (origemFilter === 'Recrutamento para clientes') {
        matchesOrigem = j.origemProcesso === 'recrutamento_cliente' || (hasClient && !isHead);
      } else if (origemFilter === 'Headhunter / Busca ativa') {
        matchesOrigem = isHead;
      }

      // 3. Status Filter
      let matchesStatus = true;
      const jStatus = (j.status || 'Aberta').toString();
      const deadline = j.deadline || j.prazoSla || '';

      if (statusFilter === 'Em andamento') {
        matchesStatus = jStatus === 'Em andamento' || jStatus === 'ativa' || jStatus === 'Aberta';
      } else if (statusFilter === 'Próximas do prazo') {
        matchesStatus = Boolean(deadline && deadline <= in7Days);
      } else if (statusFilter === 'Concluídas') {
        matchesStatus = jStatus === 'Concluída' || jStatus === 'Fechada';
      } else if (statusFilter === 'Canceladas') {
        matchesStatus = jStatus === 'Cancelada';
      } else if (statusFilter !== 'Todas') {
        matchesStatus = jStatus === statusFilter;
      }

      return matchesSearch && matchesOrigem && matchesStatus;
    });
  }, [companyJobs, searchTerm, origemFilter, statusFilter]);

  // Calculation helpers for table
  const getCandidateCounts = (jobId: string) => {
    const jobCandidates = candidates.filter(c => c.currentJobId === jobId || (c as any).vagaId === jobId);
    const totalCount = jobCandidates.length;

    const presentedCount = jobCandidates.filter(c => {
      const stage = c.currentStageId || (c as any).etapaHeadhunter || (c as any).etapaPipeline;
      return (
        stage === 'Apresentado ao cliente' ||
        stage === 'Entrevista com cliente' ||
        stage === 'Apresentado' ||
        stage === 'Entrevista' ||
        (c as any).triagemRhStatus === 'Apresentado' ||
        (c as any).apresentadoAoCliente === true
      );
    }).length;

    const interviewCount = interviews.filter(i => i.vagaId === jobId || (i as any).jobId === jobId).length;

    return { totalCount, presentedCount, interviewCount };
  };

  const handleCreateJob = () => {
    setEditingJob(null);
    setIsFormOpen(true);
  };

  const handleEditJob = (job: UnifiedJob) => {
    setEditingJob(job);
    setIsFormOpen(true);
  };

  const handleSaveForm = (savedJob: UnifiedJob) => {
    if (onSaveJob) {
      onSaveJob(savedJob);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Projetos de Executive Search & Vagas
            </h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200">
              {companyJobs.length} registros
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Visão completa unificada de vagas internas, contratações para clientes e projetos de busca ativa.
          </p>
        </div>

        <button
          onClick={handleCreateJob}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Cadastrar Nova Vaga / Projeto</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5 text-xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por cargo, empresa/cliente, departamento ou consultor responsável..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
          {/* Origem Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase text-slate-400 flex items-center gap-1 mr-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" /> Origem:
            </span>
            {[
              'Todas',
              'Vagas internas',
              'Recrutamento para clientes',
              'Headhunter / Busca ativa'
            ].map(orig => (
              <button
                key={orig}
                onClick={() => setOrigemFilter(orig)}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  origemFilter === orig
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {orig}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-indigo-600" /> Status:
            </span>
            {[
              'Todas',
              'Em andamento',
              'Próximas do prazo',
              'Concluídas',
              'Canceladas'
            ].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Projects List / Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Cargo / Projeto</th>
                <th className="p-4">Empresa / Cliente</th>
                <th className="p-4">Origem</th>
                <th className="p-4">Responsável</th>
                <th className="p-4">Prazo SLA</th>
                <th className="p-4 text-center">Candidatos</th>
                <th className="p-4 text-center">Apresentados</th>
                <th className="p-4 text-center">Entrevistas</th>
                <th className="p-4">Status</th>
                <th className="p-4">Honorários / Valor</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500 font-bold">
                    Nenhum projeto ou vaga encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredJobs.map(job => {
                  const counts = getCandidateCounts(job.id);
                  const isHead = job.origemProcesso === 'headhunter' || job.isHeadhunter || (job as any).projetoHeadhunter;
                  const isClient = job.origemProcesso === 'recrutamento_cliente' || Boolean(job.clienteNome);

                  const origBadge = isHead 
                    ? { label: 'Headhunter / Busca ativa', bg: 'bg-purple-100 text-purple-800 border-purple-200' }
                    : isClient
                    ? { label: 'Recrutamento para cliente', bg: 'bg-blue-100 text-blue-800 border-blue-200' }
                    : { label: 'Vaga interna', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };

                  return (
                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-black text-slate-900">
                        <div>{job.titulo || job.title}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{job.department || 'Geral'}</div>
                      </td>

                      <td className="p-4 font-bold text-slate-700">
                        {job.clienteNome || job.nomeEmpresa || 'RH TRANSFORMA (Interno)'}
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${origBadge.bg}`}>
                          {origBadge.label}
                        </span>
                      </td>

                      <td className="p-4 text-slate-600 font-semibold">
                        {job.consultorResponsavel || job.recruiterName || 'Consultor RH'}
                      </td>

                      <td className="p-4 font-bold text-slate-700">
                        {job.deadline || job.prazoSla || 'N/A'}
                      </td>

                      <td className="p-4 text-center font-black text-indigo-600">
                        {counts.totalCount}
                      </td>

                      <td className="p-4 text-center font-black text-purple-600">
                        {counts.presentedCount}
                      </td>

                      <td className="p-4 text-center font-black text-amber-600">
                        {counts.interviewCount}
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-extrabold">
                          {job.status || 'Aberta'}
                        </span>
                      </td>

                      <td className="p-4 font-extrabold text-slate-900">
                        {job.valorNegociado || job.valorCobrado 
                          ? `R$ ${(job.valorNegociado || job.valorCobrado).toLocaleString('pt-BR')}`
                          : 'N/A'}
                      </td>

                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleEditJob(job)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl cursor-pointer transition-colors"
                        >
                          Editar / Detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Form Modal */}
      <JobFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialJob={editingJob}
        clients={clients}
        openedFromModule="headhunter"
        onCreateClient={onCreateClient}
        onSaveJob={(savedData) => {
          handleSaveForm(savedData as UnifiedJob);
        }}
      />
    </div>
  );
};
