import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Check, X, Copy, RefreshCw, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

interface ContextualAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  onExecute?: () => Promise<any>;
  getAnalysis?: () => Promise<any>;
  contextType?: string;
  onApply?: (data: any) => void;
  confirmText?: string;
}

export const ContextualAiModal: React.FC<ContextualAiModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle = 'Análise inteligente gerada com base nos dados selecionados',
  onExecute,
  getAnalysis,
  onApply,
  confirmText = 'Aplicar no Sistema',
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editableText, setEditableText] = useState('');

  useEffect(() => {
    if (isOpen) {
      handleRun();
    } else {
      setResult(null);
      setError(null);
      setEditableText('');
    }
  }, [isOpen]);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const executor = onExecute || getAnalysis;
      if (!executor) throw new Error('Nenhuma função de análise foi informada.');
      const res = await executor();
      setResult(res);

      if (typeof res === 'string') {
        setEditableText(res);
      } else if (res?.result) {
        setEditableText(res.result);
      } else if (res?.text) {
        setEditableText(res.text);
      } else if (res?.data?.summary) {
        setEditableText(res.data.summary);
      } else if (res?.data?.parecer) {
        setEditableText(res.data.parecer);
      } else {
        setEditableText(JSON.stringify(res?.structuredData || res?.data || res, null, 2));
      }
    } catch (err: any) {
      console.error('Erro ao executar IA:', err);
      setError('Ocorreu uma falha ao processar a requisição de IA. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = () => {
    if (onApply) {
      onApply(result?.structuredData || result?.data || editableText);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 rounded-xl border border-blue-400/30">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
              <p className="text-xs text-slate-300">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4 bg-slate-50">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <div className="relative">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <Sparkles className="w-4 h-4 text-amber-400 absolute top-0 right-0 animate-pulse" />
              </div>
              <p className="text-sm font-semibold text-slate-800">Processando informações com Inteligência Artificial...</p>
              <p className="text-xs text-slate-500 max-w-md">Analisando dados contextuais e gerando recomendações personalizadas.</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">{error}</p>
                <button
                  onClick={handleRun}
                  className="mt-2 text-xs text-rose-700 underline font-semibold cursor-pointer"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Structured view if available */}
              {result?.structuredData?.requirements && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Requisitos Sugeridos</h4>
                  <ul className="space-y-1">
                    {result.structuredData.requirements.map((req: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result?.structuredData?.questions && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Roteiro de Perguntas</h4>
                  <div className="space-y-2">
                    {result.structuredData.questions.map((q: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                        <p className="text-xs font-bold text-slate-900">{idx + 1}. {q.pergunta}</p>
                        {q.foco && <p className="text-[11px] text-blue-700 font-semibold mt-1">Foco: {q.foco}</p>}
                        {q.dica && <p className="text-[11px] text-slate-500 mt-0.5">Dica: {q.dica}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result?.structuredData?.pontosFortes && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200">
                    <h5 className="text-xs font-bold text-emerald-900 mb-1.5">Pontos Fortes</h5>
                    <ul className="space-y-1">
                      {result.structuredData.pontosFortes.map((pf: string, i: number) => (
                        <li key={i} className="text-xs text-emerald-800">• {pf}</li>
                      ))}
                    </ul>
                  </div>

                  {result.structuredData.pontosAtencao && (
                    <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200">
                      <h5 className="text-xs font-bold text-amber-900 mb-1.5">Pontos de Atenção</h5>
                      <ul className="space-y-1">
                        {result.structuredData.pontosAtencao.map((pa: string, i: number) => (
                          <li key={i} className="text-xs text-amber-800">• {pa}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Textarea for review and edits */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Revisar Resultado Gerado</span>
                  </span>
                  <button
                    onClick={handleCopy}
                    className="text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
                  </button>
                </div>
                <textarea
                  value={editableText}
                  onChange={(e) => setEditableText(e.target.value)}
                  rows={8}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 font-mono leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={handleRun}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Regerar com IA</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            {onApply && (
              <button
                onClick={handleConfirm}
                disabled={loading || !editableText.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{confirmText}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
