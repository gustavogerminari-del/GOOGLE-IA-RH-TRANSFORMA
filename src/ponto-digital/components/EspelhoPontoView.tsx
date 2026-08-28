import React, { useState } from 'react';
import { FileText, Download, Filter, Printer, CheckCircle2, Clock, Calendar, Sparkles } from 'lucide-react';
import { RegistroPontoDoc, FuncionarioPontoInfo } from '../types/ponto';
import { ContextualAiModal } from '../../ai/components/ContextualAiModal';
import { timeTrackingAiService } from '../../ai/services/aiService';

interface EspelhoPontoViewProps {
  registros: RegistroPontoDoc[];
  funcionarios: FuncionarioPontoInfo[];
}

export const EspelhoPontoView: React.FC<EspelhoPontoViewProps> = ({
  registros,
  funcionarios,
}) => {
  const [selectedFuncId, setSelectedFuncId] = useState<string>(funcionarios[0]?.id || 'func-01');
  const [mesAno, setMesAno] = useState<string>('2026-07');
  const [showAiModal, setShowAiModal] = useState(false);

  const selectedFunc = funcionarios.find(f => f.id === selectedFuncId) || funcionarios[0];
  const userRegistros = registros.filter(r => r.funcionarioId === selectedFuncId || !r.funcionarioId);

  // Generate 30 days simulation table for monthly mirror
  const generateDays = () => {
    const days = [];
    for (let i = 1; i <= 20; i++) {
      const dayStr = `2026-07-${String(i).padStart(2, '0')}`;
      const found = userRegistros.find(r => r.data === dayStr);

      days.push({
        data: dayStr,
        diaSemana: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][i % 7],
        entrada: found?.horaEntrada || '08:00',
        inicioInt: found?.inicioIntervalo || '12:00',
        retornoInt: found?.retornoIntervalo || '13:00',
        saida: found?.horaSaida || '17:00',
        trabalhado: '08:00h',
        extra: i % 4 === 0 ? '+01:30h' : '00:00h',
        atraso: i === 7 ? '00:15h' : '00:00h',
        status: 'OK'
      });
    }
    return days;
  };

  const daysList = generateDays();

  const handleExportPDF = () => {
    alert(`Gerando espelho de ponto oficial em PDF para ${selectedFunc?.nome}... Arquivo pronto para impressão e assinatura eletrônica!`);
  };

  const handleExportExcel = () => {
    alert(`Exportando planilha de ponto oficial em CSV/Excel para ${selectedFunc?.nome}...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Espelho de Ponto Mensal</h2>
          <p className="text-xs text-slate-500">Relatório consolidado de horários, faltas, horas extras e adicionais trabalhistas</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Ver Inconsistências com IA</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Selectors Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center gap-4">
        <div className="w-full sm:w-auto">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Colaborador</label>
          <select
            value={selectedFuncId}
            onChange={e => setSelectedFuncId(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {funcionarios.map(f => (
              <option key={f.id} value={f.id}>{f.nome} ({f.cargo})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mês de Referência</label>
          <input
            type="month"
            value={mesAno}
            onChange={e => setMesAno(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Timesheet Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
          <div>
            <p className="font-black text-slate-900">{selectedFunc?.nome}</p>
            <p className="text-slate-500 text-[11px]">{selectedFunc?.cargo} • CPF: {selectedFunc?.cpf}</p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[11px]">
            Escala: {selectedFunc?.escalaNome || 'Comercial'}
          </span>
        </div>

        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-100/70 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-3">Data / Dia</th>
              <th className="p-3">Entrada</th>
              <th className="p-3">Início Pausa</th>
              <th className="p-3">Fim Pausa</th>
              <th className="p-3">Saída</th>
              <th className="p-3">Total Trabalhado</th>
              <th className="p-3">Horas Extras</th>
              <th className="p-3">Atrasos</th>
              <th className="p-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {daysList.map(d => (
              <tr key={d.data} className="hover:bg-slate-50/50">
                <td className="p-3 font-sans font-bold text-slate-800">
                  {d.data.split('-').reverse().join('/')} ({d.diaSemana})
                </td>
                <td className="p-3 font-bold text-slate-900">{d.entrada}</td>
                <td className="p-3 text-slate-600">{d.inicioInt}</td>
                <td className="p-3 text-slate-600">{d.retornoInt}</td>
                <td className="p-3 font-bold text-slate-900">{d.saida}</td>
                <td className="p-3 font-bold text-slate-800">{d.trabalhado}</td>
                <td className="p-3 font-bold text-emerald-700">{d.extra}</td>
                <td className="p-3 font-bold text-rose-600">{d.atraso}</td>
                <td className="p-3 text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-emerald-700 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Conforme
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ContextualAiModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        title={`Análise de Inconsistências de Ponto — ${selectedFunc?.nome || 'Colaborador'}`}
        subtitle={`Verificação automatizada de atrasos, horas extras e inconformidades no mês de ${mesAno}`}
        onExecute={() => timeTrackingAiService.detectInconsistencies({ records: userRegistros })}
        confirmText="Anotar Inconsistências"
      />
    </div>
  );
};
