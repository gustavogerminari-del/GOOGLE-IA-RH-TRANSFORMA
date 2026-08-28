import React, { useState, useMemo } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  Building2, 
  Users, 
  DollarSign, 
  Clock, 
  Sparkles,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { useAuth } from '../../../auth';
import { 
  UnifiedJob, 
  UnifiedCandidate, 
  UnifiedInterview, 
  OrigemProcesso 
} from '../../types/recruitment';
import { UnifiedJobCard } from './UnifiedJobCard';
import { UnifiedJobDetailModal } from './UnifiedJobDetailModal';
import { UnifiedJobFormModal } from './UnifiedJobFormModal';
import { UnifiedPipelineView } from '../pipeline/UnifiedPipelineView';

interface UnifiedJobsViewProps {
  origemProcesso: OrigemProcesso;
  title?: string;
  description?: string;
  jobs: UnifiedJob[];
  candidates?: UnifiedCandidate[];
  interviews?: UnifiedInterview[];
  clients?: Array<{ id: string; nomeFantasia: string; razaoSocial?: string }>;
  onUpdateJobs?: (jobs: UnifiedJob[]) => void;
  onScheduleInterview?: (candidate: UnifiedCandidate, job: UnifiedJob) => void;
  onOpenAiModal?: (type: string, data?: any) => void;
}

export const UnifiedJobsView: React.FC<UnifiedJobsViewProps> = ({
  origemProcesso,
  title,
  description,
  jobs,
  candidates = [],
  interviews = [],
  clients = [],
  onUpdateJobs,
  onScheduleInterview,
  onOpenAiModal
}) => {
  const isHeadhunter = origemProcesso === 'headhunter';

  const defaultTitle = isHeadhunter ? 'Gestão de Vagas Corporativas & Headhunting' : 'Gestão de Vagas & Recrutamento Interno';
  const defaultDesc = isHeadhunter 
    ? 'Painel unificado de posições corporativas, honorários comerciais, comissões e gestão de SLAs.' 
    : 'Painel unificado de vagas abertas, requisições por departamento e triagem de candidatos.';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todas');
  const [deptoFilter, setDeptoFilter] = useState('Todos');

  const [selectedJobForDetail, setSelectedJobForDetail] = useState<UnifiedJob | null>(null);
  const [selectedJobForPipeline, setSelectedJobForPipeline] = useState<UnifiedJob | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<UnifiedJob | null>(null);

  const { user } = useAuth();
  const userCompanyId = user?.empresaId || user?.companyId || user?.tenantId;
  const isMaster = user?.role === 'Super Administrador' || user?.role === 'MASTER' || user?.tipoUsuario === 'MASTER' || user?.isMaster === true;

  // Filter jobs by authenticated company
  const companyJobs = useMemo(() => {
    if (isMaster || !userCompanyId) return jobs;
    return jobs.filter(j => {
      const cId = j.empresaId || j.companyId || (j as any).tenantId;
      return !cId || cId === userCompanyId;
    });
  }, [jobs, isMaster, userCompanyId]);

  // Filter jobs
  const filteredJobs = companyJobs.filter(j => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
      (j.titulo || j.title || '').toLowerCase().includes(term) ||
      (j.clienteNome || '').toLowerCase().includes(term) ||
      (j.department || '').toLowerCase().includes(term) ||
      (j.requisitos || j.requirements || []).some(r => r.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'Todas' || j.status === statusFilter || (statusFilter === 'Aberta' && j.status === 'ativa');

    return matchesSearch && matchesStatus;
  });

  // Calculate Metrics
  const openJobsCount = companyJobs.filter(j => j.status === 'Aberta' || j.status === 'ativa' || j.status === 'Busca ativa').length;
  const totalReceitaPrevista = companyJobs.reduce((acc, j) => acc + (j.valorNegociado || j.valorCobrado || j.valorVaga || 0), 0);
  const totalComissaoPrevista = companyJobs.reduce((acc, j) => acc + (j.comissaoCalculada || 0), 0);

  const handleSaveJob = (savedJob: UnifiedJob) => {
    const updated = [savedJob, ...jobs.filter(j => j.id !== savedJob.id)];
    if (onUpdateJobs) {
      onUpdateJobs(updated);
    }
  };

  if (selectedJobForPipeline) {
    return (
      <UnifiedPipelineView
        job={selectedJobForPipeline}
        candidates={candidates}
        origemProcesso={origemProcesso}
        onBack={() => setSelectedJobForPipeline(null)}
        onScheduleInterview={onScheduleInterview}
        onOpenAiModal={onOpenAiModal}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {title || defaultTitle}
            </h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200">
              {jobs.length} posições
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {description || defaultDesc}
          </p>
        </div>

        <button
          onClick={() => { setEditingJob(null); setIsFormOpen(true); }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Criar Nova Vaga</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className={`grid grid-cols-1 ${isHeadhunter ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Vagas em Aberto</span>
          <p className="text-2xl font-black text-slate-900">{openJobsCount}</p>
          <span className="text-[10px] text-slate-400 font-medium">Posições ativas</span>
        </div>

        {isHeadhunter ? (
          <>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Honorários Contratados</span>
              <p className="text-2xl font-black text-indigo-600">R$ {(totalReceitaPrevista / 1000).toFixed(0)}k</p>
              <span className="text-[10px] text-indigo-600 font-bold">Fee bruto negociado</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Comissões Projetadas</span>
              <p className="text-2xl font-black text-emerald-600">R$ {(totalComissaoPrevista / 1000).toFixed(0)}k</p>
              <span className="text-[10px] text-emerald-600 font-bold">A distribuir aos consultores</span>
            </div>
          </>
        ) : (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Total de Inscritos</span>
            <p className="text-2xl font-black text-indigo-600">{candidates.length}</p>
            <span className="text-[10px] text-indigo-600 font-bold">Candidatos no pipeline</span>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por cargo, cliente, departamento ou palavra-chave..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value="Todas">Todas as vagas</option>
              <option value="Aberta">Abertas</option>
              <option value="Pausada">Pausadas</option>
              <option value="Fechada">Fechadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobs.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
            Nenhuma vaga encontrada.
          </div>
        ) : (
          filteredJobs.map(j => (
            <UnifiedJobCard
              key={j.id}
              job={j}
              onOpenDetails={job => setSelectedJobForDetail(job)}
              onManageCandidates={job => setSelectedJobForPipeline(job)}
              onEdit={job => { setEditingJob(job); setIsFormOpen(true); }}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {selectedJobForDetail && (
        <UnifiedJobDetailModal
          job={selectedJobForDetail}
          onClose={() => setSelectedJobForDetail(null)}
          onManageCandidates={job => { setSelectedJobForDetail(null); setSelectedJobForPipeline(job); }}
          onOpenAiModal={onOpenAiModal}
        />
      )}

      {isFormOpen && (
        <UnifiedJobFormModal
          origemProcesso={origemProcesso}
          existingJob={editingJob}
          clients={clients}
          onClose={() => { setIsFormOpen(false); setEditingJob(null); }}
          onSave={handleSaveJob}
        />
      )}
    </div>
  );
};
