import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Sparkles, 
  BarChart3, 
  Users, 
  Briefcase, 
  FileCheck, 
  Search, 
  Filter, 
  RefreshCw,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { JobCandidateApplication, JobCandidateService } from '../../services/JobCandidateService';
import { JobService } from '../../services/JobService';
import { Job } from '../../types/rh';
import { useAuth } from '../../auth';

export const AiReportsView: React.FC = () => {
  const { user } = useAuth();
  const companyId = user?.companyId || '';

  const [activeReportTab, setActiveReportTab] = useState<'analise' | 'comparacao' | 'historico' | 'parecer'>('analise');
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<JobCandidateApplication[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Selected filters for reports
  const [selectedJobId, setSelectedJobId] = useState<string>('all');

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
      console.error('Erro ao carregar relatórios IA:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = selectedJobId === 'all' 
    ? candidates 
    : candidates.filter(c => c.jobId === selectedJobId);

  const getJobTitle = (jobId: string) => {
    const j = jobs.find(item => item.id === jobId);
    return j ? j.title : 'Vaga Geral';
  };

  const handleExportCSV = () => {
    const csvRows = [
      ['Nome Candidato', 'Vaga', 'Compatibilidade IA (%)', 'Status', 'Data Aplicação', 'Recomendação IA']
    ];

    filteredCandidates.forEach(c => {
      csvRows.push([
        c.name,
        getJobTitle(c.jobId),
        `${c.compatibilityScore}%`,
        c.status,
        c.appliedDate,
        c.aiAnalysis?.recommendation || 'Recomendado'
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_mais_rh_ia_${activeReportTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header & Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-black text-slate-900">Relatórios Inteligentes IA</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Gere e exporte relatórios consolidados de triagem, pareceres finais e métricas dos processos seletivos.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir Relatório
          </button>
        </div>
      </div>

      {/* 4 Report Type Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveReportTab('analise')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeReportTab === 'analise'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>1. Relatório de Análise de Candidatos</span>
        </button>

        <button
          onClick={() => setActiveReportTab('comparacao')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeReportTab === 'comparacao'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>2. Relatório de Comparação</span>
        </button>

        <button
          onClick={() => setActiveReportTab('historico')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeReportTab === 'historico'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>3. Histórico de Processos Seletivos</span>
        </button>

        <button
          onClick={() => setActiveReportTab('parecer')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeReportTab === 'parecer'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>4. Pareceres Conclusivos</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700">Filtrar por Vaga:</span>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
          >
            <option value="all">Todas as Vagas ({jobs.length})</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>

        <span className="text-xs font-extrabold text-slate-500">
          Total de registros no relatório: {filteredCandidates.length}
        </span>
      </div>

      {/* REPORT CONTENT: 1. Análise de Candidatos */}
      {activeReportTab === 'analise' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">Relatório Geral de Análise Preditiva de Candidatos</h3>
            <p className="text-xs text-slate-500">Compilado oficial de pontuações de aderência e triagem automatizada da IA.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Candidato</th>
                  <th className="py-3 px-4">Vaga</th>
                  <th className="py-3 px-4">Match IA (%)</th>
                  <th className="py-3 px-4">Resumo Executivo</th>
                  <th className="py-3 px-4">Recomendação Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredCandidates.map(cand => (
                  <tr key={cand.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{cand.name}</td>
                    <td className="py-3 px-4 text-slate-600">{getJobTitle(cand.jobId)}</td>
                    <td className="py-3 px-4">
                      <span className="font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {cand.compatibilityScore}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-md">
                      {cand.aiAnalysis?.summary || cand.objective}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {cand.aiAnalysis?.recommendation || 'Recomendado'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: 2. Comparação de Candidatos */}
      {activeReportTab === 'comparacao' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">Relatório Comparativo de Candidatos</h3>
            <p className="text-xs text-slate-500">Matriz lado a lado dos melhores perfis pré-selecionados para a vaga.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredCandidates.slice(0, 3).map((cand, idx) => (
              <div key={cand.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    Top #{idx + 1}
                  </span>
                  <span className="text-sm font-black text-emerald-600">{cand.compatibilityScore}% Match</span>
                </div>

                <h4 className="text-sm font-black text-slate-900">{cand.name}</h4>
                <p className="text-xs text-slate-500 font-bold">{cand.role} • {cand.experienceYears} anos exp.</p>

                <div className="space-y-1 text-xs pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-700 block">Pontos Fortes:</span>
                  <ul className="list-disc pl-4 text-slate-600 space-y-1">
                    {(cand.aiAnalysis?.strengths || ['Alta capacidade técnica']).map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REPORT CONTENT: 3. Histórico de Processos */}
      {activeReportTab === 'historico' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">Histórico de Processos Seletivos Ativos</h3>
            <p className="text-xs text-slate-500">Estatísticas de triagem, entrevistas e contratações por departamento.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Vagas Mapeadas</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{jobs.length}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Candidaturas</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{candidates.length}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Taxa de Aprovação IA</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {candidates.length > 0 ? Math.round((candidates.filter(c => c.compatibilityScore >= 75).length / candidates.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: 4. Pareceres Conclusivos */}
      {activeReportTab === 'parecer' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">Pareceres Conclusivos do Recrutador & IA</h3>
            <p className="text-xs text-slate-500">Relatório consolidado para auditoria e tomada de decisão da diretoria.</p>
          </div>

          <div className="space-y-4">
            {filteredCandidates.map(cand => (
              <div key={cand.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900">{cand.name} — <span className="text-slate-500 font-bold">{getJobTitle(cand.jobId)}</span></h4>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    {cand.aiAnalysis?.recommendation || 'Recomendado'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {cand.aiAnalysis?.behavioralAnalysis || 'Perfil avaliado positivamente na triagem inicial.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
