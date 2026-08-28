import React from 'react';
import { 
  X, 
  Briefcase, 
  Building2, 
  MapPin, 
  DollarSign, 
  Clock, 
  Users, 
  FileText, 
  CheckCircle2, 
  Award, 
  Sparkles,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { UnifiedJob } from '../../types/recruitment';

interface UnifiedJobDetailModalProps {
  job: UnifiedJob;
  onClose: () => void;
  onManageCandidates: (job: UnifiedJob) => void;
  onOpenAiModal?: (type: string, data?: any) => void;
}

export const UnifiedJobDetailModal: React.FC<UnifiedJobDetailModalProps> = ({
  job,
  onClose,
  onManageCandidates,
  onOpenAiModal
}) => {
  const isHeadhunter = job.origemProcesso === 'headhunter';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isHeadhunter ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-800'
              }`}>
                {isHeadhunter ? 'Headhunter Corporativo' : 'Recrutamento Interno'}
              </span>
              {job.clienteNome && (
                <span className="text-xs font-bold text-slate-500">
                  • Cliente: <strong className="text-slate-800">{job.clienteNome}</strong>
                </span>
              )}
              {job.department && (
                <span className="text-xs font-bold text-slate-500">
                  • Depto: <strong className="text-slate-800">{job.department}</strong>
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-slate-900">{job.titulo || job.title}</h2>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 font-bold block">Localização</span>
            <strong className="text-slate-800">{job.location || job.cidade || 'Presencial'}</strong>
          </div>
          <div>
            <span className="text-slate-400 font-bold block">Contrato</span>
            <strong className="text-slate-800">{job.tipoContrato || job.type}</strong>
          </div>
          <div>
            <span className="text-slate-400 font-bold block">Faixa Salarial</span>
            <strong className="text-emerald-700 font-black">{job.salario || job.salaryRange}</strong>
          </div>
          <div>
            <span className="text-slate-400 font-bold block">Vagas</span>
            <strong className="text-slate-900">{job.quantidadeVagas || job.openings || 1} posições</strong>
          </div>
        </div>

        {/* Headhunter Specific Commercial & Financial Block */}
        {isHeadhunter && (
          <div className="space-y-3">
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-indigo-900 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-indigo-600" />
                  <span>Condições Comerciais do Fee</span>
                </span>
                <span className="bg-indigo-200 text-indigo-900 font-extrabold px-2 py-0.5 rounded-md text-[10px]">
                  {job.regraCobranca || 'Honorário por Placement'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-indigo-100">
                <div>
                  <span className="text-indigo-600 font-medium block">Valor Negociado</span>
                  <strong className="text-indigo-950 font-black text-sm">
                    R$ {(job.valorNegociado || job.valorCobrado || job.valorVaga || 0).toLocaleString('pt-BR')}
                  </strong>
                </div>
                <div>
                  <span className="text-indigo-600 font-medium block">Comissão Est.</span>
                  <strong className="text-emerald-700 font-black text-sm">
                    R$ {(job.comissaoCalculada || 0).toLocaleString('pt-BR')} ({job.percentualComissao || 0}%)
                  </strong>
                </div>
                <div>
                  <span className="text-indigo-600 font-medium block">SLA Atendimento</span>
                  <strong className="text-indigo-900 font-bold">{job.slaDias || 15} dias úteis</strong>
                </div>
              </div>
            </div>

            {/* Financial Summary card for Job */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Resumo Financeiro da Vaga</span>
                </span>
                <span className="text-[11px] text-slate-500 font-bold">Lançamentos em Tempo Real</span>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-200 text-center">
                <div className="p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-[10px] block font-bold">Faturamento</span>
                  <strong className="text-emerald-600 font-black">
                    R$ {(job.valorNegociado || job.valorCobrado || job.valorVaga || 0).toLocaleString('pt-BR')}
                  </strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-[10px] block font-bold">Despesas Vaga</span>
                  <strong className="text-rose-600 font-black">R$ 145,80</strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-[10px] block font-bold">Comissão</span>
                  <strong className="text-amber-600 font-black">
                    R$ {(job.comissaoCalculada || 0).toLocaleString('pt-BR')}
                  </strong>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-slate-400 text-[10px] block font-bold">Lucro Est.</span>
                  <strong className="text-indigo-700 font-black">
                    R$ {((job.valorNegociado || job.valorVaga || 0) - 145.80 - (job.comissaoCalculada || 0)).toLocaleString('pt-BR')}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Descrição da Oportunidade</h4>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
            {job.descricao || job.description || 'Nenhuma descrição detalhada.'}
          </p>
        </div>

        {/* Requirements */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Requisitos Exigidos</h4>
          <div className="flex flex-wrap gap-2">
            {(job.requisitos || job.requirements || []).length > 0 ? (
              (job.requisitos || job.requirements || []).map((req, idx) => (
                <span key={idx} className="bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200">
                  {req}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">Nenhum requisito especificado.</span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {onOpenAiModal ? (
            <button
              onClick={() => { onClose(); onOpenAiModal('descricaoVaga', { jobTitle: job.titulo || job.title, jobDescription: job.descricao }); }}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Otimizar Vaga com IA</span>
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer">
              Fechar
            </button>
            <button
              onClick={() => { onClose(); onManageCandidates(job); }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              Gerenciar Candidatos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
