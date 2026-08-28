import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  FileText, 
  UserCheck, 
  DollarSign, 
  Send, 
  Copy, 
  Check, 
  TrendingUp, 
  Building2, 
  Briefcase 
} from 'lucide-react';
import { OrigemProcesso } from '../../types/recruitment';
import { useAuth } from '../../../auth';
import { auth } from '../../../lib/firebase';

interface UnifiedContextualAiModalProps {
  origemProcesso: OrigemProcesso;
  initialActionType?: string;
  initialData?: any;
  onClose: () => void;
}

export const UnifiedContextualAiModal: React.FC<UnifiedContextualAiModalProps> = ({
  origemProcesso,
  initialActionType = 'descricaoVaga',
  initialData,
  onClose
}) => {
  const isHeadhunter = origemProcesso === 'headhunter';
  const { user } = useAuth();

  const [activeAction, setActiveAction] = useState<string>(initialActionType);
  const [promptInput, setPromptInput] = useState<string>(initialData?.jobTitle || initialData?.candidateName || '');
  const [loading, setLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [aiError, setAiError] = useState('');

  const handleGenerate = async () => {
    const companyId = String(user?.empresaId || user?.companyId || user?.tenantId || '').trim();
    if (!companyId) {
      setAiError('Não foi possível identificar a empresa para utilizar a IA.');
      return;
    }
    if (!promptInput.trim() && !initialData) {
      setAiError('Informe o contexto que deseja analisar com a IA.');
      return;
    }

    const actionMap: Record<string, { endpoint: string; action: string }> = {
      descricaoVaga: { endpoint: '/api/ai/generate-job-description', action: 'gerar_descricao_vaga' },
      analisarCurriculo: { endpoint: '/api/ai/parse-resume', action: 'analisar_curriculo' },
      roteiroEntrevista: { endpoint: '/api/ai/chat', action: 'roteiro_entrevista' },
      abordagemExecutiva: { endpoint: '/api/ai/chat', action: 'abordagem_executiva' },
      apresentacaoCliente: { endpoint: '/api/ai/chat', action: 'apresentacao_cliente' },
      analisarRentabilidade: { endpoint: '/api/ai/chat', action: 'analisar_rentabilidade' },
    };
    const selected = actionMap[activeAction] || { endpoint: '/api/ai/chat', action: 'assistente_rh' };

    setLoading(true);
    setAiError('');
    setGeneratedText('');
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(selected.endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: 'Bearer ' + token } : {}),
        },
        body: JSON.stringify({
          companyId,
          action: selected.action,
          data: {
            prompt: promptInput.trim(),
            origemProcesso,
            context: initialData || null,
          },
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || 'A IA não conseguiu concluir esta solicitação.');
      }

      const structured = payload?.data ?? payload?.result ?? payload?.analysis ?? payload;
      const directText = String(
        payload?.response || payload?.answer || payload?.text ||
        structured?.response || structured?.answer || structured?.text || structured?.description || structured?.summary || ''
      ).trim();
      const resultText = directText || JSON.stringify(structured, null, 2);
      if (!resultText || resultText === '{}') throw new Error('A IA retornou uma resposta vazia.');
      setGeneratedText(resultText);
    } catch (error: any) {
      console.error('[CONTEXTUAL_AI_FAILED]', error);
      setAiError(error?.message || 'A IA está indisponível no momento.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Assistente de IA Recrutamento & Headhunter
              </h3>
              <span className="text-[10px] text-slate-400 font-bold">
                {isHeadhunter ? 'Ações Corporativas & Comerciais' : 'Ações de Recrutamento Interno'}
              </span>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons Switcher */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveAction('descricaoVaga')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeAction === 'descricaoVaga' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Descrição de Vaga
          </button>

          <button
            onClick={() => setActiveAction('analisarCurriculo')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeAction === 'analisarCurriculo' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Analisar Currículo
          </button>

          <button
            onClick={() => setActiveAction('roteiroEntrevista')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeAction === 'roteiroEntrevista' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Roteiro de Entrevista
          </button>

          {isHeadhunter && (
            <>
              <button
                onClick={() => setActiveAction('abordagemExecutiva')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeAction === 'abordagemExecutiva' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Abordagem Headhunter
              </button>

              <button
                onClick={() => setActiveAction('apresentacaoCliente')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeAction === 'apresentacaoCliente' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Apresentação ao Cliente
              </button>

              <button
                onClick={() => setActiveAction('analisarRentabilidade')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeAction === 'analisarRentabilidade' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rentabilidade & Fee
              </button>
            </>
          )}
        </div>

        {/* Input & Action Trigger */}
        <div className="space-y-2 text-xs">
          <label className="block font-bold text-slate-700">Parâmetro de Pesquisa / Nome / Cargo</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={promptInput}
              onChange={e => setPromptInput(e.target.value)}
              placeholder="Digite o título da vaga, nome do candidato ou empresa..."
              className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{loading ? 'Gerando...' : 'Gerar com IA'}</span>
            </button>
          </div>
        </div>

        {/* Output Text Area */}
        {aiError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
            {aiError}
          </div>
        )}
        {generatedText && (
          <div className="space-y-2 text-xs pt-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Resultado IA Gerado</span>
              <button
                onClick={handleCopy}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {generatedText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
