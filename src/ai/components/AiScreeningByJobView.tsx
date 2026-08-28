import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Briefcase, 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Send, 
  RefreshCw, 
  Building2, 
  MapPin, 
  Award,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { JobCandidateApplication, JobCandidateService, ApplicationStatus } from '../../services/JobCandidateService';
import { JobService } from '../../services/JobService';
import { Job } from '../../types/rh';
import { useAuth } from '../../auth';
import { SmartCandidateDrawer } from './SmartCandidateDrawer';
import { formatFirestoreDate } from '../../lib/firestoreUtils';

export const AiScreeningByJobView: React.FC = () => {
  const { user } = useAuth();
  const companyId = user?.companyId || '';

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<JobCandidateApplication[]>([]);

  // Selected candidate drawer state
  const [selectedCandidate, setSelectedCandidate] = useState<JobCandidateApplication | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [pcdOnly, setPcdOnly] = useState(false);
  const [minScore, setMinScore] = useState<number>(0);

  useEffect(() => {
    loadJobs();
  }, [companyId]);

  useEffect(() => {
    if (selectedJob) {
      loadJobCandidates(selectedJob.id);
    }
  }, [selectedJob]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const jobList = await JobService.listByCompany(companyId);
      setJobs(jobList);
      if (jobList.length > 0) {
        setSelectedJob(jobList[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar vagas:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadJobCandidates = async (jobId: string) => {
    setLoading(true);
    try {
      const list = await JobCandidateService.listByJob(jobId, companyId);
      setCandidates(list);
    } catch (err) {
      console.error('Erro ao carregar candidatos da vaga:', err);
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
    if (selectedJob) {
      await loadJobCandidates(selectedJob.id);
    }
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPcd = !pcdOnly || c.isPCD;
    const matchesScore = c.compatibilityScore >= minScore;
    return matchesSearch && matchesPcd && matchesScore;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Job Selector & Top Information Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-xl font-black text-slate-900">Triagem IA Por Vaga</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Selecione a vaga desejada para gerenciar a triagem e ranking preditivo dos candidatos em formato lista.
            </p>
          </div>

          <div className="w-full md:w-80">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
              Selecione a Vaga
            </label>
            <select
              value={selectedJob?.id || ''}
              onChange={(e) => {
                const found = jobs.find(j => j.id === e.target.value);
                if (found) setSelectedJob(found);
              }}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Job Meta Information Card */}
        {selectedJob && (
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black text-[10px] uppercase">
                  Vaga Ativa
                </span>
                <span className="text-xs text-slate-400 font-bold">{selectedJob.department}</span>
              </div>
              <h3 className="text-lg font-black text-white">{selectedJob.title}</h3>
              <p className="text-xs text-slate-300 flex items-center gap-3 font-medium">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {selectedJob.location}</span>
                <span>•</span>
                <span>{selectedJob.type}</span>
                <span>•</span>
                <span>Faixa: {selectedJob.salaryRange}</span>
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700/60 shrink-0">
              <div className="text-center">
                <span className="text-xl font-black text-emerald-400">{candidates.length}</span>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Total Candidatos</span>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div className="text-center">
                <span className="text-xl font-black text-amber-400">
                  {candidates.filter(c => c.compatibilityScore >= 80).length}
                </span>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Match Alto IA</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar candidato nesta vaga..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={pcdOnly}
              onChange={(e) => setPcdOnly(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Somente PCD
          </label>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span>Match Mínimo IA:</span>
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
            >
              <option value={0}>Todos (0%)</option>
              <option value={60}>≥ 60%</option>
              <option value={75}>≥ 75%</option>
              <option value={85}>≥ 85%</option>
            </select>
          </div>
        </div>
      </div>

      {/* LIST MODEL (STRICTLY NO KANBAN) */}
      <div className="space-y-3">
        {filteredCandidates.length > 0 ? (
          filteredCandidates.map((cand) => (
            <div 
              key={cand.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-emerald-300 transition-all space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Candidate Photo & Basic Info */}
                <div className="flex items-center gap-4">
                  {(cand.photo || cand.avatar) ? (
                    <img
                      src={cand.photo || cand.avatar}
                      alt={cand.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 shadow-2xs shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm border-2 border-slate-100 shadow-2xs shrink-0">
                      {cand.name ? cand.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'C'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 
                        onClick={() => handleOpenCandidate(cand)}
                        className="text-base font-black text-slate-900 hover:text-emerald-600 hover:underline cursor-pointer"
                      >
                        {cand.name}
                      </h4>
                      {cand.isPCD && (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                          PCD
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {cand.role} • {cand.city}, {cand.state} • {cand.experienceYears} anos exp.
                    </p>
                    <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                      Aplicou em: {formatFirestoreDate(cand.appliedDate)}
                    </span>
                  </div>
                </div>

                {/* IA Compatibility Badge & Progress Bar */}
                <div className="w-full md:w-64 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 shrink-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-600 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Compatibilidade IA
                    </span>
                    <span className="font-black text-emerald-600">{cand.compatibilityScore}%</span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${cand.compatibilityScore}%` }}
                    />
                  </div>

                  <span className="text-[10px] text-slate-400 block text-right font-semibold">
                    {cand.compatibilityLevel}
                  </span>
                </div>

                {/* Actions Buttons */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={() => handleOpenCandidate(cand)}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Ver Candidato
                  </button>

                  <button
                    onClick={() => handleStatusChange(cand.id, 'Entrevista Agendada')}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Enviar para Entrevista
                  </button>

                  <button
                    onClick={() => handleStatusChange(cand.id, 'Reprovado')}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 font-extrabold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reprovar
                  </button>
                </div>

              </div>

              {/* Automatic IA Summary Box */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-700 font-medium leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-slate-900 block">Resumo Automático da IA:</span>
                  {cand.aiAnalysis?.summary || cand.objective || 'Perfil sem resumo gerado ainda.'}
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Nenhum candidato nesta vaga</h3>
            <p className="text-xs text-slate-400">Ajuste os filtros ou selecione outra vaga para visualizar a triagem.</p>
          </div>
        )}
      </div>

      {/* Smart Candidate Drawer */}
      <SmartCandidateDrawer
        candidate={selectedCandidate}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onRefresh={() => loadJobCandidates(selectedJob?.id || 'vaga-001')}
        jobTitle={selectedJob?.title}
      />

    </div>
  );
};
