import React from 'react';
import { 
  Briefcase, 
  Building2, 
  MapPin, 
  Users, 
  Clock, 
  DollarSign, 
  ChevronRight, 
  Sparkles, 
  Calendar, 
  Award,
  CheckCircle2,
  Lock,
  Edit2
} from 'lucide-react';
import { UnifiedJob } from '../../types/recruitment';
import { formatFirestoreDate } from '../../../lib/firestoreUtils';

interface UnifiedJobCardProps {
  job: UnifiedJob;
  onOpenDetails: (job: UnifiedJob) => void;
  onManageCandidates: (job: UnifiedJob) => void;
  onEdit?: (job: UnifiedJob) => void;
}

export const UnifiedJobCard: React.FC<UnifiedJobCardProps> = ({
  job,
  onOpenDetails,
  onManageCandidates,
  onEdit
}) => {
  const isHeadhunter = job.origemProcesso === 'headhunter';

  const getStatusBadge = () => {
    switch (job.status) {
      case 'Aberta':
      case 'ativa':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">Aberta</span>;
      case 'Busca ativa':
      case 'Triagem':
        return <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">{job.status}</span>;
      case 'Aguardando cliente':
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">Aguardando Cliente</span>;
      case 'Pausada':
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">Pausada</span>;
      case 'Fechada':
        return <span className="bg-slate-800 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">Fechada</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">{job.status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
      {/* Top Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            {isHeadhunter && job.clienteNome && (
              <div className="flex items-center gap-1 text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider mb-0.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>{job.clienteNome}</span>
              </div>
            )}
            {!isHeadhunter && job.department && (
              <div className="flex items-center gap-1 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-0.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Depto: {job.department}</span>
              </div>
            )}
            <h3 className="text-base font-black text-slate-900 line-clamp-1 hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => onOpenDetails(job)}>
              {job.titulo || job.title}
            </h3>
          </div>
          <div className="shrink-0 flex items-center gap-1.5">
            {getStatusBadge()}
            {onEdit && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(job); }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Editar Vaga"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-500 line-clamp-2 font-medium">
          {job.descricao || job.description || 'Sem descrição cadastrada.'}
        </p>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{job.location || `${job.cidade || ''} ${job.estado || ''}`}</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-600">
          <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-bold text-slate-800 truncate">{job.salario || job.salaryRange}</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-600">
          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span><strong className="text-slate-900">{job.applicantsCount || job.candidatosCount || 0}</strong> candidatos</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Abertura: {formatFirestoreDate(job.dataCriacao || job.createdAt || job.dataAbertura) || 'Recentemente'}</span>
        </div>
      </div>

      {/* Contextual Banner: Headhunter (Honorários & Comissão) vs Recrutamento (Gestor & Requisitos) */}
      {isHeadhunter ? (
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-2.5 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] font-extrabold text-indigo-600 uppercase block">Fee Cobrado</span>
            <span className="font-black text-indigo-900">
              R$ {(job.valorNegociado || job.valorCobrado || job.valorVaga || 0).toLocaleString('pt-BR')}
            </span>
          </div>
          {job.comissaoCalculada ? (
            <div className="text-right">
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase block">Comissão Est.</span>
              <span className="font-black text-emerald-800">
                R$ {job.comissaoCalculada.toLocaleString('pt-BR')}
              </span>
            </div>
          ) : (
            <div className="text-right text-[10px] text-indigo-600 font-bold">
              {job.percentualComissao ? `${job.percentualComissao}% de comissão` : 'A definir'}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Requisitante / Recrutador</span>
            <span className="font-bold text-slate-700 truncate block max-w-[150px]">
              {job.gestorRequisitante || job.recruiterName || job.consultorResponsavel || 'Equipe RH'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Vagas Abertas</span>
            <span className="font-black text-slate-900">
              {job.quantidadeVagas || job.openings || 1} posições
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onOpenDetails(job)}
          className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer text-center"
        >
          Detalhes
        </button>
        <button
          onClick={() => onManageCandidates(job)}
          className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1"
        >
          <span>Candidatos</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
