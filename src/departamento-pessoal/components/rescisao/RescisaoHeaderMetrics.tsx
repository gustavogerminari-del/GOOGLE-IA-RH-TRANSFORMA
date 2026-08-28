import React from 'react';
import { 
  LogOut, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Users, 
  FileText, 
  ShieldAlert, 
  Plus, 
  Sparkles 
} from 'lucide-react';
import { ProcessoRescisaoCompleto } from '../../types/terminationTypes';

interface RescisaoHeaderMetricsProps {
  processes: ProcessoRescisaoCompleto[];
  onOpenNewModal: () => void;
  onOpenAiModal: () => void;
}

export const RescisaoHeaderMetrics: React.FC<RescisaoHeaderMetricsProps> = ({
  processes,
  onOpenNewModal,
  onOpenAiModal
}) => {
  const total = processes.length;
  const inProgress = processes.filter(p => p.status !== 'Concluída' && p.status !== 'Cancelada').length;
  const readyToComplete = processes.filter(p => p.status === 'Pronta para conclusão' || p.status === 'Aprovada').length;
  const completed = processes.filter(p => p.status === 'Concluída').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold mb-1 border border-rose-100">
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Módulo Oficial de Rescisão, Desligamento & Homologação</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Gestão Integrada de Desligamentos (TRCT & eSocial)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Solicitação, fluxo de aprovações, memória de cálculo, aviso-prévio, checklist, devolução de bens, encerramento de benefícios, ASO, entrevista e bloqueio de acessos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAiModal}
            className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Verificar Pendências com IA</span>
          </button>
          <button
            onClick={onOpenNewModal}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Iniciar Solicitação de Desligamento</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total de Solicitados</span>
          <div className="text-lg font-black text-slate-900 mt-0.5">{total}</div>
        </div>

        <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-100">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Em Processamento</span>
          <div className="text-lg font-black text-amber-950 mt-0.5">{inProgress}</div>
        </div>

        <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Prontos p/ Conclusão</span>
          <div className="text-lg font-black text-indigo-950 mt-0.5">{readyToComplete}</div>
        </div>

        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Desligamentos Concluídos</span>
          <div className="text-lg font-black text-emerald-950 mt-0.5">{completed}</div>
        </div>
      </div>
    </div>
  );
};
