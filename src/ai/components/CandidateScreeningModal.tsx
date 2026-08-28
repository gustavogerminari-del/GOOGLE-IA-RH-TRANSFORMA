import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle, AlertTriangle, UserCheck, Percent, FileText, ArrowRight, Save } from 'lucide-react';
import { IaAnalise } from '../types';
import { saveIaAnalise } from '../aiAnalysesStore';
import { useAuth } from '../../auth';
import { getCompanyId } from '../../auth/profile';
import { AIService } from '../services/centralAiService';

interface CandidateScreeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: {
    id: string;
    name: string;
    role?: string;
    skills?: string[];
    experience?: string;
    summary?: string;
    appliedJobId?: string;
    appliedJobTitle?: string;
  } | null;
  vagaInfo?: {
    id: string;
    title: string;
    requirements?: string[];
    description?: string;
  };
  onAnaliseSaved?: (analise: IaAnalise) => void;
}

export const CandidateScreeningModal: React.FC<CandidateScreeningModalProps> = ({
  isOpen,
  onClose,
  candidate,
  vagaInfo,
  onAnaliseSaved,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analiseResult, setAnaliseResult] = useState<IaAnalise | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [aiError, setAiError] = useState('');

  if (!isOpen || !candidate) return null;

  const currentVagaTitle = vagaInfo?.title || candidate.appliedJobTitle || 'Desenvolvedor Senior Full Stack';
  const currentVagaId = vagaInfo?.id || candidate.appliedJobId || '';

  const handleRunScreening = async () => {
    setLoading(true);
    setAnaliseResult(null);
    setSavedSuccess(false);
    setAiError('');

    try {
      const empresaId = getCompanyId(user);
      if (!empresaId) throw new Error('Usuário sem empresa válida para utilizar a IA.');
      const resumeText = String(candidate.summary || candidate.experience || '').trim();
      if (!resumeText) throw new Error('Não foi possível extrair texto válido do currículo.');
      const response = await AIService.analisarCurriculo<any>(empresaId, {
          vagaTitle: currentVagaTitle,
          vagaRequisitos: vagaInfo?.requirements || [],
          vagaDescricao: vagaInfo?.description || '',
          candidatoNome: candidate.name,
          curriculoTexto: resumeText,
          candidatoInfo: { cargo: candidate.role || '', competencias: candidate.skills || [] },
        });
      const data = response;
      if (data.success && data.data) {
        if (!empresaId) throw new Error('Usuário sem empresa válida para salvar análise de IA.');
        if (!currentVagaId) throw new Error('Vaga sem ID válido para salvar análise de IA.');
        const saved = await saveIaAnalise({
          empresaId,
          vagaId: currentVagaId,
          candidatoId: candidate.id,
          candidatoNome: candidate.name,
          vagaTitulo: currentVagaTitle,
          pontuacao: data.data.pontuacao || 85,
          analise: data.data.analise,
          parecer: data.data.parecer,
          pontosFortes: data.data.pontosFortes || [],
          pontosAtencao: data.data.pontosAtencao || [],
          recomendacao: data.data.recomendacao || 'Recomendado'
        });

        setAnaliseResult(saved);
        setSavedSuccess(true);
        if (onAnaliseSaved) onAnaliseSaved(saved);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Não foi possível concluir a análise por IA no momento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getBadgeColor = (rec: string) => {
    switch (rec) {
      case 'Altamente Recomendado':
        return 'bg-emerald-600 text-white';
      case 'Recomendado':
        return 'bg-teal-600 text-white';
      case 'Em Avaliação':
        return 'bg-amber-500 text-slate-950 font-bold';
      default:
        return 'bg-rose-600 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Triagem Inteligente de Currículo</h2>
              <p className="text-xs text-emerald-100 font-medium">
                Análise com IA: {candidate.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>
        {aiError && <div role="alert" className="mx-5 mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{aiError}</div>}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Summary Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Vaga Alvo</span>
              <p className="text-sm font-bold text-slate-800">{currentVagaTitle}</p>
              <p className="text-xs text-slate-500">{candidate.role || 'Cargo não informado'}</p>
            </div>

            {!analiseResult && !loading && (
              <button
                onClick={handleRunScreening}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Iniciar Análise IA</span>
              </button>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="p-4 bg-emerald-50 rounded-full border border-emerald-100">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
              <p className="text-sm font-bold text-slate-800">Processando Currículo com RH TRANSFORMA IA...</p>
              <p className="text-xs text-slate-500">Extraindo competências, alinhamento técnico e histórico profissional.</p>
            </div>
          )}

          {/* Analysis Result Display */}
          {analiseResult && !loading && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Score & Recommendation Banner */}
              <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center ${getScoreColor(analiseResult.pontuacao)}`}>
                    <span className="text-3xl font-black">{analiseResult.pontuacao}%</span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">Aderência</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Parecer da Triagem
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5">{analiseResult.candidatoNome}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-black mt-2 ${getBadgeColor(analiseResult.recomendacao)}`}>
                      {analiseResult.recomendacao}
                    </span>
                  </div>
                </div>

                {savedSuccess && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-500/30">
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvo em ia_analises</span>
                  </div>
                )}
              </div>

              {/* Resumo & Parecer */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
                <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Resumo da Análise Executiva</span>
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{analiseResult.analise}</p>
                <div className="pt-2 border-t border-emerald-100">
                  <p className="text-xs text-emerald-900 font-bold">Parecer Final:</p>
                  <p className="text-xs text-slate-600 italic">{analiseResult.parecer}</p>
                </div>
              </div>

              {/* Strengths & Attention Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pontos Fortes */}
                <div className="p-4 bg-emerald-50/30 rounded-xl border border-emerald-200/60">
                  <h4 className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Pontos Fortes ({analiseResult.pontosFortes.length})</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {analiseResult.pontosFortes.map((pf, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-black">•</span>
                        <span>{pf}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pontos de Atenção */}
                <div className="p-4 bg-amber-50/30 rounded-xl border border-amber-200/60">
                  <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Pontos de Atenção ({analiseResult.pontosAtencao.length})</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {analiseResult.pontosAtencao.map((pa, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-black">•</span>
                        <span>{pa}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            Registro automático no banco <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono text-[10px]">ia_analises</code>
          </span>
          <div className="flex items-center gap-2">
            {analiseResult && (
              <button
                onClick={handleRunScreening}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-100"
              >
                Reanalisar
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
