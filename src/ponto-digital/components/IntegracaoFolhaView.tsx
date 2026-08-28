import React, { useState } from 'react';
import { Send, CheckCircle2, ShieldCheck, FileSpreadsheet, ArrowRight, RefreshCw } from 'lucide-react';

export const IntegracaoFolhaView: React.FC = () => {
  const [sincronizando, setSincronizando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const handleTransmitir = () => {
    setSincronizando(true);
    setTimeout(() => {
      setSincronizando(false);
      setSucesso(true);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-black text-slate-900">Integração Direta: Ponto Digital → Folha de Pagamento</h2>
        <p className="text-xs text-slate-500">Transmissão automática de proventos de horas extras, adicional noturno, descontos por faltas e atrasos para o fechamento da folha</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6">
        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-emerald-950 text-sm">Status da Conexão Ponto-Folha</p>
              <p className="text-xs text-emerald-800">Pronto para transmissão do período corrente (Julho/2026)</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-200 text-emerald-900 text-xs font-black rounded-full">
            ATIVO & VALIDADO
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <p className="font-bold text-slate-800">Resumo de Dados a Transmitir para o Módulo de Folha de Pagamento:</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Total de Horas Extras 50%</span>
              <span className="font-bold text-slate-900 font-mono text-base">+38,5 horas</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Total de Horas Extras 100%</span>
              <span className="font-bold text-slate-900 font-mono text-base">+12,0 horas</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Adicional Noturno (CLT Art. 73)</span>
              <span className="font-bold text-slate-900 font-mono text-base">24,0 horas</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Descontos de Faltas e Atrasos</span>
              <span className="font-bold text-rose-700 font-mono text-base">-02,5 horas</span>
            </div>
          </div>
        </div>

        {sucesso && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Métricas de ponto enviadas com sucesso ao Módulo Folha de Pagamento! O holerite foi atualizado.</span>
          </div>
        )}

        <button
          onClick={handleTransmitir}
          disabled={sincronizando}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {sincronizando ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Sincronizando com Folha de Pagamento...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Transmitir Dados de Ponto para a Folha</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
