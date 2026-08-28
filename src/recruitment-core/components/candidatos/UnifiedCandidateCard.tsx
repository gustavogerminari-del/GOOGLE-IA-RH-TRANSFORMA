import React from 'react';
import { 
  User, 
  MapPin, 
  Briefcase, 
  Phone, 
  Mail, 
  Star, 
  FileText, 
  Award, 
  Sparkles,
  Building2,
  DollarSign
} from 'lucide-react';
import { UnifiedCandidate, OrigemProcesso } from '../../types/recruitment';

interface UnifiedCandidateCardProps {
  candidate: UnifiedCandidate;
  origemProcesso?: OrigemProcesso;
  onOpenDetails: (candidate: UnifiedCandidate) => void;
  onAssignToJob?: (candidate: UnifiedCandidate) => void;
}

export const UnifiedCandidateCard: React.FC<UnifiedCandidateCardProps> = ({
  candidate,
  origemProcesso = 'recrutamento_interno',
  onOpenDetails,
  onAssignToJob
}) => {
  const isHeadhunter = origemProcesso === 'headhunter';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
      {/* Top Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-sm overflow-hidden shrink-0">
              {candidate.fotoUrl || candidate.avatar ? (
                <img src={candidate.fotoUrl || candidate.avatar} alt={candidate.nome || (candidate as any).name || 'Candidato'} className="w-full h-full object-cover" />
              ) : (
                <span>{(candidate.nome || (candidate as any).name || 'C').substring(0, 2).toUpperCase()}</span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 
                  onClick={() => onOpenDetails(candidate)} 
                  className="text-base font-black text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  {candidate.nome || (candidate as any).name || 'Candidato Sem Nome'}
                </h3>
                {candidate.rating && (
                  <span className="flex items-center text-amber-500 text-xs font-bold gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{candidate.rating}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-bold">{candidate.cargoAtual || candidate.role || 'Candidato'}</p>
            </div>
          </div>

          <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full ${
            candidate.status === 'Ativo' ? 'bg-emerald-100 text-emerald-800' :
            candidate.status === 'Em Processo' ? 'bg-indigo-100 text-indigo-800' :
            candidate.status === 'Contratado' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {candidate.status}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 text-slate-600">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{candidate.cidade || candidate.location || 'Brasil'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{candidate.experienciaAnos || candidate.experienceYears || 0} anos exp.</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{candidate.telefone || candidate.phone || 'N/A'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-bold text-slate-800 truncate">
              {candidate.pretensaoSalarial ? `R$ ${candidate.pretensaoSalarial.toLocaleString('pt-BR')}` : candidate.salaryExpectation || 'A combinar'}
            </span>
          </div>
        </div>

        {/* Skills Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {(candidate.competencias || candidate.skills || []).slice(0, 3).map((sk, idx) => (
            <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
              {sk}
            </span>
          ))}
          {(candidate.competencias || candidate.skills || []).length > 3 && (
            <span className="text-[10px] text-slate-400 font-bold self-center">
              +{(candidate.competencias || candidate.skills || []).length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Headhunter Context Banner */}
      {isHeadhunter && (candidate.classificacao || candidate.potencialComercial) && (
        <div className="bg-indigo-50 border border-indigo-100 p-2.5 rounded-xl text-xs flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-indigo-700 uppercase">Classificação</span>
          <strong className="text-indigo-900 font-black">{candidate.classificacao || 'Recomendado'}</strong>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={() => onOpenDetails(candidate)}
          className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer text-center"
        >
          Perfil Completo
        </button>
        {onAssignToJob && (
          <button
            onClick={() => onAssignToJob(candidate)}
            className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all cursor-pointer text-center"
          >
            Vincular Vaga
          </button>
        )}
      </div>
    </div>
  );
};
