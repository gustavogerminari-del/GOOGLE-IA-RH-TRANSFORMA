import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  Filter, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Sparkles, 
  Award,
  Calendar
} from 'lucide-react';
import { HeadhunterCommission, CommissionType, CommissionStatus } from '../types';

interface HeadhunterComissoesProps {
  commissions: HeadhunterCommission[];
  onAddCommission: (commission: HeadhunterCommission) => void;
  onOpenAiModal: (type: string, data?: any) => void;
}

export const HeadhunterComissoes: React.FC<HeadhunterComissoesProps> = ({
  commissions,
  onAddCommission,
  onOpenAiModal
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('Todas');

  const filteredCommissions = commissions.filter(c => 
    selectedStatusFilter === 'Todas' || c.situacao === selectedStatusFilter
  );

  const totalComissoesPrevistas = commissions.filter(c => c.situacao === 'Prevista' || c.situacao === 'Liberada').reduce((acc, c) => acc + c.valorComissao, 0);
  const totalComissoesRecebidas = commissions.filter(c => c.situacao === 'Recebida').reduce((acc, c) => acc + c.valorComissao, 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Módulo de Controle de Comissões de Headhunter</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão de comissões fixas, percentuais, compartilhadas e pagamentos liberados por vaga fechada.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Comissões Previstas / Liberadas</span>
            <p className="text-2xl font-black text-indigo-600 mt-1">R$ {totalComissoesPrevistas.toLocaleString('pt-BR')}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Comissões Pagas / Recebidas</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">R$ {totalComissoesRecebidas.toLocaleString('pt-BR')}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* COMMISSIONS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-800">Demonstrativo de Comissões</span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            {['Todas', 'Prevista', 'Liberada', 'Recebida', 'Cancelada'].map(st => (
              <button
                key={st}
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedStatusFilter === st ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="p-3">Consultor / Headhunter</th>
                <th className="p-3">Cliente & Vaga</th>
                <th className="p-3">Tipo Comissão</th>
                <th className="p-3 text-right">Valor Vaga</th>
                <th className="p-3 text-right">% Com.</th>
                <th className="p-3 text-right">Valor Comissão</th>
                <th className="p-3 text-center">Data Prev.</th>
                <th className="p-3 text-center">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCommissions.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{c.consultorNome}</td>
                  <td className="p-3">
                    <strong className="text-slate-800 block">{c.vagaTitulo}</strong>
                    <span className="text-slate-500 text-[11px]">{c.clienteNome}</span>
                  </td>
                  <td className="p-3 font-medium text-slate-600">{c.tipoComissao}</td>
                  <td className="p-3 text-right font-medium text-slate-700">R$ {c.valorRecebidoVaga.toLocaleString('pt-BR')}</td>
                  <td className="p-3 text-right font-bold text-indigo-600">{c.percentual}%</td>
                  <td className="p-3 text-right font-black text-emerald-600">R$ {c.valorComissao.toLocaleString('pt-BR')}</td>
                  <td className="p-3 text-center font-medium text-slate-600">{c.dataPrevista}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full ${
                      c.situacao === 'Recebida' ? 'bg-emerald-100 text-emerald-800' :
                      c.situacao === 'Liberada' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {c.situacao}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
