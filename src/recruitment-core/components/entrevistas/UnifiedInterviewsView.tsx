import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Video, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Search, 
  Filter,
  Sparkles,
  Award
} from 'lucide-react';
import { 
  UnifiedInterview, 
  OrigemProcesso 
} from '../../types/recruitment';
import { UnifiedInterviewScheduleModal } from './UnifiedInterviewScheduleModal';

interface UnifiedInterviewsViewProps {
  interviews: UnifiedInterview[];
  origemProcesso: OrigemProcesso;
  onScheduleInterview: (interview: UnifiedInterview) => void;
  onUpdateFeedback?: (interviewId: string, feedback: any) => void;
  onOpenAiModal?: (type: string, data?: any) => void;
}

export const UnifiedInterviewsView: React.FC<UnifiedInterviewsViewProps> = ({
  interviews,
  origemProcesso,
  onScheduleInterview,
  onUpdateFeedback,
  onOpenAiModal
}) => {
  const isHeadhunter = origemProcesso === 'headhunter';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Filter interviews
  const filteredInterviews = interviews.filter(i => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
      i.candidatoNome.toLowerCase().includes(term) ||
      i.vagaTitulo.toLowerCase().includes(term) ||
      (i.clienteNome && i.clienteNome.toLowerCase().includes(term)) ||
      i.entrevistadorNome.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'Todos' || i.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isHeadhunter ? 'Gestão de Entrevistas Headhunter & Clientes' : 'Gestão de Entrevistas & Avaliações'}
            </h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200">
              {interviews.length} entrevistas
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Agendamento unificado, links para salas virtuais, pautas, avaliações técnicas e pareceres.
          </p>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Agendar Entrevista</span>
        </button>
      </div>

      {/* Toolbar Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por candidato, vaga, cliente ou entrevistador..."
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
              <option value="Todos">Todos</option>
              <option value="Agendada">Agendada</option>
              <option value="Concluída">Concluída</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interviews List */}
      <div className="space-y-3">
        {filteredInterviews.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
            Nenhuma entrevista agendada.
          </div>
        ) : (
          filteredInterviews.map(i => (
            <div
              key={i.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-700 text-xs shrink-0">
                  <Calendar className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md">
                      {i.tipo}
                    </span>
                    <h3 className="text-base font-black text-slate-900">{i.candidatoNome}</h3>
                  </div>

                  <p className="text-xs text-slate-500 font-medium">
                    Vaga: <strong className="text-slate-800">{i.vagaTitulo}</strong>
                    {i.clienteNome && <span> • Cliente: <strong className="text-indigo-900">{i.clienteNome}</strong></span>}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-bold pt-1">
                    <span>Entrevistador: {i.entrevistadorNome || i.interviewerName}</span>
                    {i.modalidade && <span>• {i.modalidade}</span>}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-right shrink-0">
                <div className="text-left sm:text-right">
                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100 inline-block mb-1">
                    {new Date(i.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-bold">{i.status}</span>
                </div>

                {i.salaVirtualUrl && (
                  <a
                    href={i.salaVirtualUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-xl border border-emerald-200 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Video className="w-4 h-4 text-emerald-600" />
                    <span>Abrir Sala</span>
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <UnifiedInterviewScheduleModal
          origemProcesso={origemProcesso}
          onClose={() => setShowScheduleModal(false)}
          onSchedule={onScheduleInterview}
        />
      )}
    </div>
  );
};
