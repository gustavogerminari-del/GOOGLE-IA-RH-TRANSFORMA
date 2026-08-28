import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Eye, 
  Send, 
  Download, 
  RefreshCw, 
  MapPin, 
  FileText,
  SlidersHorizontal,
  Briefcase
} from 'lucide-react';
import { JobCandidateApplication, JobCandidateService, ApplicationStatus } from '../../services/JobCandidateService';
import { JobService } from '../../services/JobService';
import { Job } from '../../types/rh';
import { useAuth } from '../../auth';
import { SmartCandidateDrawer } from './SmartCandidateDrawer';
import { formatFirestoreDate } from '../../lib/firestoreUtils';

export const CandidateAnalysisView: React.FC = () => {
  const { user } = useAuth();
  const companyId = user?.companyId || '';

  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<JobCandidateApplication[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Selected candidate for drawer
  const [selectedCandidate, setSelectedCandidate] = useState<JobCandidateApplication | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCompatibility, setSelectedCompatibility] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [candList, jobList] = await Promise.all([
        JobCandidateService.listAll(companyId),
        JobService.listByCompany(companyId)
      ]);
      setCandidates(candList);
      setJobs(jobList);
    } catch (err) {
      console.error('Erro ao carregar candidatos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCandidate = (candidate: JobCandidateApplication) => {
    setSelectedCandidate(candidate);
    setIsDrawerOpen(true);
  };

  const handleStatusChange = async (candidateId: string, newStatus: ApplicationStatus) => {
    await JobCandidateService.updateStatus(candidateId, newStatus);
    await loadData();
  };

  // Filter logic
  const filteredCandidates = candidates.filter(cand => {
    // Search term
    const matchesSearch = 
      cand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cand.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cand.role.toLowerCase().includes(searchTerm.toLowerCase());

    // Job filter
    const matchesJob = selectedJobId === 'all' || cand.jobId === selectedJobId;

    // Status filter
    const matchesStatus = selectedStatus === 'all' || cand.status === selectedStatus;

    // Compatibility filter
    let matchesComp = true;
    if (selectedCompatibility === 'muito_alta') matchesComp = cand.compatibilityScore >= 85;
    else if (selectedCompatibility === 'alta') matchesComp = cand.compatibilityScore >= 70 && cand.compatibilityScore < 85;
    else if (selectedCompatibility === 'media') matchesComp = cand.compatibilityScore >= 50 && cand.compatibilityScore < 70;
    else if (selectedCompatibility === 'baixa') matchesComp = cand.compatibilityScore < 50;

    return matchesSearch && matchesJob && matchesStatus && matchesComp;
  });

  const getJobTitle = (jobId: string) => {
    const found = jobs.find(j => j.id === jobId);
    return found ? found.title : 'Vaga Geral';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-black text-slate-900">Análise de Candidatos Central</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Visualização consolidada de todos os perfis submetidos à triagem preditiva e avaliação de IA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider">
          <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
          Filtros Avançados de Análise
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Job Filter */}
          <div>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todas as Vagas ({jobs.length})</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todos os Status</option>
              <option value="Novos">Novos</option>
              <option value="Triagem IA">Triagem IA</option>
              <option value="Em Análise RH">Em Análise RH</option>
              <option value="Entrevista Agendada">Entrevista Agendada</option>
              <option value="Entrevista Realizada">Entrevista Realizada</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Reprovado">Reprovado</option>
            </select>
          </div>

          {/* Compatibility Filter */}
          <div>
            <select
              value={selectedCompatibility}
              onChange={(e) => setSelectedCompatibility(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todas as Faixas % IA</option>
              <option value="muito_alta">Muito Alta (≥ 85%)</option>
              <option value="alta">Alta (70% - 84%)</option>
              <option value="media">Média (50% - 69%)</option>
              <option value="baixa">Baixa (&lt; 50%)</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedJobId('all');
                setSelectedStatus('all');
                setSelectedCompatibility('all');
              }}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Limpar Filtros
            </button>
          </div>

        </div>
      </div>

      {/* Candidate Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-500">
            Exibindo {filteredCandidates.length} candidatos analisados
          </span>
        </div>

        {filteredCandidates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Candidato</th>
                  <th className="py-3.5 px-4">Vaga Relacionada</th>
                  <th className="py-3.5 px-4">Compatibilidade IA (%)</th>
                  <th className="py-3.5 px-4">Status da Análise</th>
                  <th className="py-3.5 px-4">Data da Candidatura</th>
                  <th className="py-3.5 px-4 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredCandidates.map((cand) => (
                  <tr key={cand.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Candidate Name & Info */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {(cand.photo || cand.avatar) ? (
                          <img
                            src={cand.photo || cand.avatar}
                            alt={cand.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs border border-slate-200 shrink-0">
                            {cand.name ? cand.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'C'}
                          </div>
                        )}
                        <div>
                          <span 
                            onClick={() => handleOpenCandidate(cand)}
                            className="font-bold text-slate-900 hover:text-emerald-600 hover:underline cursor-pointer block"
                          >
                            {cand.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {cand.role} • {cand.city}, {cand.state}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Job Related */}
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {getJobTitle(cand.jobId)}
                      </span>
                    </td>

                    {/* Compatibility Score % */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-black px-2.5 py-1 rounded-lg border text-xs ${
                          cand.compatibilityScore >= 85 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : cand.compatibilityScore >= 70 
                              ? 'bg-teal-50 text-teal-800 border-teal-200' 
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          <Sparkles className="w-3 h-3 text-amber-500 inline mr-1" />
                          {cand.compatibilityScore}%
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                          {cand.compatibilityLevel}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span className="font-extrabold text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                        {cand.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-slate-400 font-medium">
                      {formatFirestoreDate(cand.appliedDate)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenCandidate(cand)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Perfil Inteligente
                        </button>

                        <button
                          onClick={() => handleStatusChange(cand.id, 'Entrevista Agendada')}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-extrabold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
                          title="Enviar para Entrevista"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Entrevista
                        </button>

                        <button
                          onClick={() => handleStatusChange(cand.id, 'Reprovado')}
                          className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                          title="Reprovar Candidato"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Nenhum candidato encontrado com os filtros atuais</h3>
            <p className="text-xs text-slate-400">Tente ajustar a busca ou limpar os filtros para ver mais resultados.</p>
          </div>
        )}
      </div>

      {/* Smart Candidate Drawer */}
      <SmartCandidateDrawer
        candidate={selectedCandidate}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onRefresh={loadData}
        jobTitle={selectedCandidate ? getJobTitle(selectedCandidate.jobId) : ''}
      />

    </div>
  );
};
