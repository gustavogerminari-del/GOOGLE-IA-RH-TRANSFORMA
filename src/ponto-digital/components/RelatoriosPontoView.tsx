import React, { useState } from 'react';
import { BarChart2, Download, Printer, FileText, Calendar, Filter } from 'lucide-react';

export const RelatoriosPontoView: React.FC = () => {
  const [tipoRelatorio, setTipoRelatorio] = useState('espelho');

  const handleExport = (formato: string) => {
    alert(`Gerando relatório de "${tipoRelatorio.toUpperCase()}" em formato ${formato}... Download iniciado!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Relatórios Gerenciais de Ponto Digital</h2>
          <p className="text-xs text-slate-500">Auditoria, relatórios trabalhistas oficiais Portaria 671 e estatísticas de absenteísmo</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('PDF')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Exportar PDF
          </button>
          <button
            onClick={() => handleExport('EXCEL')}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Exportar Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 cursor-pointer hover:border-emerald-500 transition-all" onClick={() => setTipoRelatorio('espelho')}>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Espelho de Ponto Individual</h3>
          <p className="text-xs text-slate-500">Relatório mensal detalhado com batidas diárias, assinaturas e cálculos para holerite.</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 cursor-pointer hover:border-emerald-500 transition-all" onClick={() => setTipoRelatorio('horas-extras')}>
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
            <BarChart2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Relatório de Horas Extras (+50% / +100%)</h3>
          <p className="text-xs text-slate-500">Consolidado de sobrejornadas para envio imediato à Folha de Pagamento.</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 cursor-pointer hover:border-emerald-500 transition-all" onClick={() => setTipoRelatorio('atrasos-faltas')}>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Absenteísmo, Faltas e Atrasos</h3>
          <p className="text-xs text-slate-500">Levantamento de inconsistências, saídas antecipadas e descontos salariais.</p>
        </div>
      </div>
    </div>
  );
};
