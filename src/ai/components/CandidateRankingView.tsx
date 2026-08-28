import React, { useState } from 'react';
import { Trophy, Sparkles, Loader2, Award, ArrowUpDown, Filter, UserCheck, ChevronRight } from 'lucide-react';
import { CandidateRanked } from '../types';
import { useAuth } from '../../auth';
import { getCompanyId } from '../../auth/profile';
import { AIService } from '../services/centralAiService';

interface CandidateRankingViewProps {
  candidates?: Array<{
    id: string;
    name: string;
    role?: string;
    skills?: string[];
    experience?: string;
  }>;
  vagaTitle?: string;
}

export const CandidateRankingView: React.FC<CandidateRankingViewProps> = ({
  candidates = [],
  vagaTitle = 'Desenvolvedor Senior Full Stack',
}) => {
  const { user } = useAuth();
  const [selectedVaga, setSelectedVaga] = useState(vagaTitle);
  const [loading, setLoading] = useState(false);
  const [rankingList, setRankingList] = useState<CandidateRanked[]>([]);
  const [aiError, setAiError] = useState('');

  const handleRank = async () => {
    setLoading(true);
    setAiError('');
    try {
      const companyId = getCompanyId(user);
      if (!companyId) throw new Error('Empresa não identificada para utilizar a IA.');
      if (!candidates.length) throw new Error('Não há candidatos reais disponíveis para comparar.');
      const response = await AIService.compararCandidatos<{ ranking: CandidateRanked[] }>(companyId, {
          vagaTitle: selectedVaga,
          vagaRequisitos: [],
          candidatos: candidates
        });
      if (response.data?.ranking) {
        setRankingList(response.data.ranking);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Não foi possível concluir a análise por IA no momento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (position: number) => {
    if (position === 0) return 'bg-amber-400 text-slate-950 font-black shadow-md';
    if (position === 1) return 'bg-slate-300 text-slate-900 font-extrabold';
    if (position === 2) return 'bg-amber-700/20 text-amber-900 font-bold';
    return 'bg-slate-100 text-slate-700 font-bold';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
      {aiError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{aiError}</div>}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h2 className="text-lg font-black text-slate-900">Ranking IA de Candidatos</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Classificação inteligente ordenada automaticamente por afinidade e aderência técnica aos requisitos da vaga.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedVaga}
            onChange={(e) => setSelectedVaga(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
          >
            <option value="Desenvolvedor Senior Full Stack">Desenvolvedor Senior Full Stack</option>
            <option value="Gerente de Produto (Product Manager)">Gerente de Produto (PM)</option>
            <option value="Designer UX/UI Pleno">Designer UX/UI Pleno</option>
            <option value="Analista de RH e Recrutamento">Analista de RH e Recrutamento</option>
          </select>

          <button
            onClick={handleRank}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Calculando Ranking...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Calcular Ranking IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-bold text-slate-800">Processando compatibilidade dos candidatos...</p>
        </div>
      )}

      {/* Ranking Results */}
      {!loading && rankingList.length > 0 ? (
        <div className="space-y-3">
          {rankingList.map((item, index) => (
            <div
              key={item.candidatoId || index}
              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                index === 0
                  ? 'bg-gradient-to-r from-amber-500/10 via-emerald-500/5 to-white border-amber-300 shadow-sm'
                  : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm ${getRankBadge(
                    index
                  )}`}
                >
                  #{index + 1}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900">{item.nome}</h3>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                      {item.recomendacao}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.parecer}</p>

                  {/* Highlights */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.pontosFortes?.slice(0, 3).map((pf, i) => (
                      <span key={i} className="text-[10px] font-semibold bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded-md">
                        ✓ {pf}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t md:border-t-0 border-slate-200 pt-3 md:pt-0 justify-between md:justify-end">
                <div className="text-right">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Aderência
                  </span>
                  <span className="text-xl font-black text-emerald-600">{item.pontuacao}%</span>
                </div>

                <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${item.pontuacao}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !loading ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
          <Award className="w-10 h-10 text-emerald-600 mx-auto opacity-60" />
          <h3 className="text-sm font-bold text-slate-800">Nenhum ranking calculado para esta vaga ainda</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Clique no botão acima "Calcular Ranking IA" para analisar a lista de candidatos cadastrados e obter a classificação por compatibilidade.
          </p>
        </div>
      ) : null}
    </div>
  );
};
