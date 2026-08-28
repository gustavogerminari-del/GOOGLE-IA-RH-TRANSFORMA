import React, { useState } from 'react';
import { PageVersion } from '../types/builderTypes';
import { visualBuilderStore } from '../store/visualBuilderStore';
import { 
  History, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  User, 
  X, 
  GitCommit, 
  Calendar,
  AlertTriangle,
  ArrowLeftRight
} from 'lucide-react';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  onVersionRestored?: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  pageId,
  onVersionRestored
}) => {
  const [selectedVersionForCompare, setSelectedVersionForCompare] = useState<PageVersion | null>(null);
  const [restoredMsg, setRestoredMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const versions = visualBuilderStore.getVersionsForPage(pageId);
  const currentPage = visualBuilderStore.getPageById(pageId);

  const handleRestore = (ver: PageVersion) => {
    if (confirm(`Deseja realmente restaurar a versão v${ver.versionNumber} para a página "${currentPage?.name}"?`)) {
      visualBuilderStore.rollbackToVersion(ver.versionId, 'MASTER Admin');
      setRestoredMsg(`Versão v${ver.versionNumber} restaurada com sucesso! Uma nova versão de restauração foi gerada.`);
      if (onVersionRestored) onVersionRestored();
      setTimeout(() => setRestoredMsg(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-slate-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" /> Histórico de Versões e Restauração
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Página: <span className="text-amber-400 font-bold">{currentPage?.name || pageId}</span> | Todas as edições geram snapshots históricos auditáveis.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {restoredMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{restoredMsg}</span>
            </div>
          )}

          {versions.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              <GitCommit className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              Nenhuma versão anterior publicada para esta página ainda.
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((ver) => {
                const isCurrent = currentPage?.version === ver.versionNumber;
                return (
                  <div
                    key={ver.versionId}
                    className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isCurrent 
                        ? 'bg-amber-950/20 border-amber-500/50' 
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white">v{ver.versionNumber}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950">
                            Versão Ativa Em Produção
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                          Escopo: {ver.scope}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 font-medium">{ver.changeSummary}</p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" /> {ver.publishedBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {new Date(ver.publishedAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedVersionForCompare(ver)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 hover:text-white transition flex items-center gap-1.5"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        <span>Inspecionar</span>
                      </button>

                      {!isCurrent && (
                        <button
                          onClick={() => handleRestore(ver)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs hover:bg-amber-500 hover:text-slate-950 transition flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restaurar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Inspect / Diff View */}
          {selectedVersionForCompare && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-sm font-bold text-amber-400 flex items-center justify-between">
                <span>Inspecionando Snapshot v{selectedVersionForCompare.versionNumber}</span>
                <button 
                  onClick={() => setSelectedVersionForCompare(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Fechar
                </button>
              </h4>

              <div className="p-3 bg-slate-900 rounded-xl text-xs text-slate-300 font-mono overflow-x-auto max-h-48 border border-slate-800">
                <pre>{JSON.stringify(selectedVersionForCompare.configuration.components, null, 2)}</pre>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
