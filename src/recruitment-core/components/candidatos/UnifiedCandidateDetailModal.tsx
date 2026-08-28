import React from 'react';
import { 
  X, 
  User, 
  MapPin, 
  Briefcase, 
  Phone, 
  Mail, 
  DollarSign, 
  Star, 
  FileText, 
  Award, 
  Sparkles,
  Building2,
  Calendar,
  Clock,
  UserPlus
} from 'lucide-react';
import { UnifiedCandidate, OrigemProcesso } from '../../types/recruitment';
import { enviarCandidatoParaAdmissaoDP } from '../../../departamento-pessoal/services/dpFirestoreService';
import { canSendToAdmission } from '../../utils/processOrigin';
import { useAuth } from '../../../auth/context/AuthContext';

interface UnifiedCandidateDetailModalProps {
  candidate: UnifiedCandidate;
  origemProcesso?: OrigemProcesso;
  onClose: () => void;
  onAssignToJob?: (candidate: UnifiedCandidate) => void;
  onOpenAiModal?: (type: string, data?: any) => void;
}

export const UnifiedCandidateDetailModal: React.FC<UnifiedCandidateDetailModalProps> = ({
  candidate,
  origemProcesso,
  onClose,
  onAssignToJob,
  onOpenAiModal
}) => {
  const { isModuleActive } = useAuth();
  const hasCompanyHeadhunter = isModuleActive('headhunter');
  const hasCompanyDp = isModuleActive('departamentoPessoal');
  const exclusiveHeadhunterAccess = hasCompanyHeadhunter && !hasCompanyDp;
  const exclusiveDpAccess = hasCompanyDp && !hasCompanyHeadhunter;
  const isHeadhunter = exclusiveHeadhunterAccess
    ? true
    : exclusiveDpAccess
      ? false
      : origemProcesso === 'headhunter';
  const admissionAllowed = hasCompanyDp && !isHeadhunter && canSendToAdmission({
    ...candidate,
    origemProcesso: exclusiveDpAccess ? 'RH_INTERNO' : (candidate.origemProcesso || origemProcesso),
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-700 text-lg shrink-0 overflow-hidden">
              {candidate.fotoUrl || candidate.avatar ? (
                <img src={candidate.fotoUrl || candidate.avatar} alt={candidate.nome || (candidate as any).name || 'Candidato'} className="w-full h-full object-cover" />
              ) : (
                <span>{(candidate.nome || (candidate as any).name || 'C').substring(0, 2).toUpperCase()}</span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">{candidate.nome || (candidate as any).name || 'Candidato Sem Nome'}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  candidate.status === 'Ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                }`}>
                  {candidate.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-extrabold mt-0.5">{candidate.cargoAtual || candidate.role || 'Profissional'}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 font-bold block">E-mail</span>
            <strong className="text-slate-800 truncate block">{candidate.email}</strong>
          </div>
          <div>
            <span className="text-slate-400 font-bold block">Telefone</span>
            <strong className="text-slate-800">{candidate.telefone || candidate.phone || 'N/A'}</strong>
          </div>
          <div>
            <span className="text-slate-400 font-bold block">Localização</span>
            <strong className="text-slate-800">{candidate.cidade || candidate.location || 'Brasil'}</strong>
          </div>
          <div>
            <span className="text-slate-400 font-bold block">Pretensão Salarial</span>
            <strong className="text-emerald-700 font-black">
              {candidate.pretensaoSalarial ? `R$ ${candidate.pretensaoSalarial.toLocaleString('pt-BR')}` : candidate.salaryExpectation || 'A combinar'}
            </strong>
          </div>
        </div>

        {/* Headhunter Evaluation & IA Parecer */}
        {candidate.triagemIaParecer && (
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-indigo-900 font-black">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Parecer e Análise de Compatibilidade IA</span>
            </div>
            <p className="text-indigo-950 font-medium leading-relaxed">{candidate.triagemIaParecer}</p>
          </div>
        )}

        {/* Competencias */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Competências e Habilidades</h4>
          <div className="flex flex-wrap gap-1.5">
            {(candidate.competencias || candidate.skills || []).map((sk, idx) => (
              <span key={idx} className="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1 rounded-lg border border-slate-200">
                {sk}
              </span>
            ))}
          </div>
        </div>

        {/* Resume / Curriculo */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Resumo de Experiências</h4>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100 whitespace-pre-line">
            {candidate.curriculoTexto || candidate.notes || 'Sem resumo de currículo fornecido.'}
          </p>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {onOpenAiModal ? (
            <button
              onClick={() => { onClose(); onOpenAiModal('analisarCurriculo', { candidateName: candidate.nome, resumeText: candidate.curriculoTexto }); }}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Analisar Currículo com IA</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            {admissionAllowed && <button
              onClick={async () => {
                try {
                  await enviarCandidatoParaAdmissaoDP({
                    id: candidate.id,
                    candidateId: candidate.id,
                    jobId: candidate.jobId,
                    companyId: candidate.companyId,
                    name: candidate.nome || (candidate as any).name,
                    email: candidate.email,
                    phone: candidate.telefone || (candidate as any).phone,
                    role: candidate.cargoAtual || (candidate as any).role,
                    salaryExpectation: candidate.pretensaoSalarial || (candidate as any).salaryExpectation,
                    city: candidate.cidade,
                    state: candidate.estado
                  });
                  alert(`🎉 Candidato(a) ${candidate.nome || 'selecionado(a)'} enviado(a) para a Fila de Admissão DP!`);
                  onClose();
                } catch (err) {
                  console.error('Erro ao enviar para admissão:', err);
                }
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enviar para Admissão DP</span>
            </button>}
            <button onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer">
              Fechar
            </button>
            {onAssignToJob && (
              <button
                onClick={() => { onClose(); onAssignToJob(candidate); }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                Vincular a Vaga
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
