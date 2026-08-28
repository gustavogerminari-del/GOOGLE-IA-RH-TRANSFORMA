import React, { useState } from 'react';
import { Sparkles, Loader2, MessageSquare, CheckCircle, AlertCircle, Award, HelpCircle, FileCheck, ThumbsUp, ThumbsDown } from 'lucide-react';
import { InterviewAssistantResult } from '../types';
import { useAuth } from '../../auth';
import { getCompanyId } from '../../auth/profile';
import { AIService } from '../services/centralAiService';

interface InterviewAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: string;
  candidateName?: string;
}

export const InterviewAssistantModal: React.FC<InterviewAssistantModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'Desenvolvedor Full Stack',
  candidateName = 'Candidato Selecionado',
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'perguntas' | 'pos_entrevista'>('perguntas');
  const [cargo, setCargo] = useState(defaultRole);
  const [nome, setNome] = useState(candidateName);
  const [resumoEntrevista, setResumoEntrevista] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InterviewAssistantResult | null>(null);
  const [aiError, setAiError] = useState('');

  if (!isOpen) return null;

  const handleFetchQuestions = async () => {
    setLoading(true);
    setResult(null);
    setAiError('');
    try {
      const companyId = getCompanyId(user);
      if (!companyId) throw new Error('Empresa não identificada para utilizar a IA.');
      const response = await AIService.execute<InterviewAssistantResult>('criar_roteiro_entrevista', companyId, {
          cargo,
          candidatoNome: nome,
          tipo: 'gerar_perguntas',
        });
      setResult(response.data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Não foi possível concluir a análise por IA no momento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateInterview = async () => {
    setLoading(true);
    setResult(null);
    setAiError('');
    try {
      const companyId = getCompanyId(user);
      if (!companyId) throw new Error('Empresa não identificada para utilizar a IA.');
      if (!resumoEntrevista.trim()) throw new Error('Registre as respostas da entrevista antes de solicitar o parecer.');
      const response = await AIService.gerarParecerEntrevista<InterviewAssistantResult>(companyId, {
          cargo,
          candidatoNome: nome,
          tipo: 'avaliar_entrevista',
          resumoEntrevista,
        });
      setResult(response.data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Não foi possível concluir a análise por IA no momento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <MessageSquare className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Assistente Inteligente de Entrevistas</h2>
              <p className="text-xs text-emerald-100 font-medium">
                Roteiros e avaliações pós-entrevista com IA
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
        {aiError && <div role="alert" className="mx-6 mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{aiError}</div>}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-4">
          <button
            onClick={() => {
              setActiveTab('perguntas');
              setResult(null);
            }}
            className={`pb-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'perguntas'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>1. Roteiro de Perguntas por Cargo</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('pos_entrevista');
              setResult(null);
            }}
            className={`pb-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'pos_entrevista'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>2. Avaliação Pós-Entrevista</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cargo / Posição</label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Candidato</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {activeTab === 'perguntas' ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                <p className="text-xs text-emerald-900 font-medium">
                  A IA formulará perguntas comportamentais e técnicas focadas nas exigências do cargo.
                </p>
                <button
                  onClick={handleFetchQuestions}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  )}
                  <span>Gerar Perguntas</span>
                </button>
              </div>

              {/* Questions list */}
              {result?.perguntas && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Perguntas Recomendadas pela IA
                  </h3>
                  {result.perguntas.map((p, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-700">Pergunta {idx + 1}</span>
                        <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                          Foco: {p.foco}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900">"{p.pergunta}"</p>
                      <p className="text-xs text-slate-500 italic">
                        <strong>Dica de avaliação:</strong> {p.dicaAvaliacao}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas / Resumo da Entrevista Conduzida
                </label>
                <textarea
                  rows={4}
                  value={resumoEntrevista}
                  onChange={(e) => setResumoEntrevista(e.target.value)}
                  placeholder="Insira as anotações feitas durante a conversa (ex: 'Demonstrou boa didática, explicou a migração de sistema que realizou na empresa anterior, tem interesse imediato, salário dentro da pretensão...')"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleEvaluateInterview}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processando Parecer...</span>
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4 text-amber-300" />
                      <span>Gerar Avaliação Final</span>
                    </>
                  )}
                </button>
              </div>

              {/* Evaluation result */}
              {result && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 pt-4">
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Pontuação / Nota de Desempenho
                    </span>
                    <p className="text-sm font-bold text-slate-800">{result.avaliacao}</p>
                    <p className="text-xs text-slate-600 mt-1">{result.resumo}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                      <h4 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <ThumbsUp className="w-4 h-4 text-emerald-600" />
                        <span>Pontos Positivos</span>
                      </h4>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {result.pontosPositivos?.map((p, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-xl">
                      <h4 className="text-xs font-extrabold text-rose-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <ThumbsDown className="w-4 h-4 text-rose-600" />
                        <span>Pontos de Atenção</span>
                      </h4>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {result.pontosNegativos?.map((p, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-rose-500 font-bold">•</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-900 text-white rounded-xl">
                    <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider block mb-1">
                      Parecer Final Conclusivo
                    </span>
                    <p className="text-xs font-semibold leading-relaxed">{result.parecerFinal}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
