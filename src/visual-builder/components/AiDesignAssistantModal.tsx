import React, { useState } from 'react';
import { AiDesignProposal } from '../types/builderTypes';
import { visualBuilderStore } from '../store/visualBuilderStore';
import { 
  Sparkles, 
  Send, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  Wand2, 
  ArrowRight,
  RefreshCw,
  Eye
} from 'lucide-react';

interface AiDesignAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePageId: string;
  onProposalApplied: () => void;
}

export const AiDesignAssistantModal: React.FC<AiDesignAssistantModalProps> = ({
  isOpen,
  onClose,
  activePageId,
  onProposalApplied
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposal, setProposal] = useState<AiDesignProposal | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setStatusMsg(null);

    setTimeout(() => {
      const generated = visualBuilderStore.generateAiDesignProposal(prompt, activePageId);
      setProposal(generated);
      setIsGenerating(false);
    }, 600);
  };

  const handleAcceptProposal = () => {
    if (!proposal) return;
    visualBuilderStore.applyAiProposal(proposal, 'MASTER Admin');
    setStatusMsg('Proposta aplicada como RASCUNHO com sucesso! Revise e publique quando desejar.');
    onProposalApplied();
    setTimeout(() => {
      setProposal(null);
      setPrompt('');
      onClose();
    }, 2000);
  };

  const handleRejectProposal = () => {
    setProposal(null);
    setStatusMsg('Proposta descartada.');
    setTimeout(() => setStatusMsg(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col text-slate-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> Assistente de Inteligência Artificial do Designer
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Digite comandos em linguagem natural para alterar temas, renomear módulos ou refazer layouts.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          {statusMsg && (
            <div className="p-3.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-bold block">
              Comando de Alteração Visual / Layout:
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='Ex: "Deixe esta página mais limpa com cores azuis", "Renomeie Gestão de Vagas para Recrutamento & Seleção", "Aplique tema escuro com destaque verde"'
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-amber-500 pr-12"
              />
              <button
                disabled={isGenerating || !prompt.trim()}
                onClick={handleGenerate}
                className="absolute right-3 bottom-3 p-2 rounded-xl bg-amber-500 text-slate-950 font-black hover:bg-amber-400 disabled:opacity-40 transition"
              >
                {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Suggested Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Sugestões Rápidas:
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                'Deixe o tema com paleta azul corporativo',
                'Renomeie Gestão de Vagas para Recrutamento & Seleção',
                'Aplique cores verdes modernas e de alto contraste',
                'Ajuste para tema limpo corporativo'
              ].map(sug => (
                <button
                  key={sug}
                  onClick={() => setPrompt(sug)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/50 transition font-medium text-[11px]"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* AI Proposal Card */}
          {proposal && (
            <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                  Proposta da IA Pronta para Revisão
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Status: Apenas Rascunho</span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                {proposal.suggestedChangesSummary}
              </p>

              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Aplicações afetadas:</span>
                  <span className="text-white font-bold">{proposal.affectedPageIds.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Aprovação Humana Requerida:</span>
                  <span className="text-amber-400 font-bold">Sim (A IA nunca publica sozinha)</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleRejectProposal}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
                >
                  Rejeitar Proposta
                </button>
                <button
                  onClick={handleAcceptProposal}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                >
                  <span>Aceitar e Aplicar Rascunho</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
