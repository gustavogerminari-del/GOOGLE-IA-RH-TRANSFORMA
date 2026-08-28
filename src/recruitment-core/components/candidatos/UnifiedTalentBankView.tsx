import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Sparkles, 
  Building2, 
  Briefcase, 
  UserCheck,
  Star,
  Download
} from 'lucide-react';
import { 
  UnifiedCandidate, 
  UnifiedJob, 
  OrigemProcesso 
} from '../../types/recruitment';
import { UnifiedCandidateCard } from './UnifiedCandidateCard';
import { UnifiedCandidateDetailModal } from './UnifiedCandidateDetailModal';
import { UnifiedCandidateFormModal } from './UnifiedCandidateFormModal';

interface UnifiedTalentBankViewProps {
  candidates: UnifiedCandidate[];
  jobs?: UnifiedJob[];
  origemProcesso: OrigemProcesso;
  onUpdateCandidates?: (candidates: UnifiedCandidate[]) => void;
  onOpenAiModal?: (type: string, data?: any) => void;
}

export const UnifiedTalentBankView: React.FC<UnifiedTalentBankViewProps> = ({
  candidates,
  jobs = [],
  origemProcesso,
  onUpdateCandidates,
  onOpenAiModal
}) => {
  const isHeadhunter = origemProcesso === 'headhunter';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<UnifiedCandidate | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [assigningCandidate, setAssigningCandidate] = useState<UnifiedCandidate | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [areaFilter, setAreaFilter] = useState('Todas');
  const [clienteFilter, setClienteFilter] = useState('Todos');

  // Filter candidates list
  const filteredCandidates = candidates.filter(c => {
    const term = searchTerm.toLowerCase().trim();
    const candidateName = c.nome || (c as any).name || '';
    const emailStr = c.email || '';
    const cargoStr = c.cargoAtual || (c as any).cargo || '';
    const cidadeStr = c.cidade || '';

    const matchesSearch = !term || 
      candidateName.toLowerCase().includes(term) ||
      emailStr.toLowerCase().includes(term) ||
      cargoStr.toLowerCase().includes(term) ||
      cidadeStr.toLowerCase().includes(term) ||
      (c.competencias && c.competencias.some(sk => sk.toLowerCase().includes(term)));

    const matchesStatus = statusFilter === 'Todos' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSaveCandidate = (newCand: UnifiedCandidate) => {
    const updated = [newCand, ...candidates.filter(c => c.id !== newCand.id)];
    if (onUpdateCandidates) {
      onUpdateCandidates(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isHeadhunter ? 'Banco de Talentos Executivos & Headhunter' : 'Banco de Talentos Único'}
            </h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200">
              {candidates.length} perfis
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Repositório centralizado de candidatos, histórico profissional, qualificações e mapeamentos.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenAiModal && (
            <button
              onClick={() => onOpenAiModal('analisarCurriculo')}
              className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Triagem com IA</span>
            </button>
          )}

          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cadastrar Candidato</span>
          </button>
        </div>
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
              placeholder="Buscar por nome, e-mail, cargo ou competência..."
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
              <option value="Todos">Todos os Status</option>
              <option value="Ativo">Ativo</option>
              <option value="Em Processo">Em Processo</option>
              <option value="Contratado">Contratado</option>
              <option value="Indisponível">Indisponível</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCandidates.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
            Nenhum candidato encontrado.
          </div>
        ) : (
          filteredCandidates.map(cand => (
            <UnifiedCandidateCard
              key={cand.id}
              candidate={cand}
              origemProcesso={origemProcesso}
              onOpenDetails={c => { setSelectedCandidate(c); setIsDetailOpen(true); }}
              onAssignToJob={c => setAssigningCandidate(c)}
            />
          ))
        )}
      </div>

      {/* Detail Modal */}
      {isDetailOpen && selectedCandidate && (
        <UnifiedCandidateDetailModal
          candidate={selectedCandidate}
          origemProcesso={origemProcesso}
          onClose={() => { setIsDetailOpen(false); setSelectedCandidate(null); }}
          onAssignToJob={c => setAssigningCandidate(c)}
          onOpenAiModal={onOpenAiModal}
        />
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <UnifiedCandidateFormModal
          origemProcesso={origemProcesso}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveCandidate}
        />
      )}
    </div>
  );
};
