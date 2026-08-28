import React, { useState } from 'react';
import { 
  Scale, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  ShieldCheck, 
  Plus, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  X,
  Edit3
} from 'lucide-react';
import { BancoHorasDoc } from '../types/ponto';
import { formatarMinutosEmHoras } from '../services/pontoService';

interface BancoHorasViewProps {
  bancoHoras: BancoHorasDoc[];
  onAjustarBanco?: (funcId: string, minutos: number, motivo: string, tipo: 'CREDITO' | 'DEBITO') => void;
}

export const BancoHorasView: React.FC<BancoHorasViewProps> = ({ 
  bancoHoras: initialBanco,
  onAjustarBanco 
}) => {
  const [bancoList, setBancoList] = useState<BancoHorasDoc[]>(initialBanco);
  const [activeTab, setActiveTab] = useState<'banco' | 'horas_extras'>('banco');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFuncId, setSelectedFuncId] = useState<string>('');
  const [ajusteTipo, setAjusteTipo] = useState<'CREDITO' | 'DEBITO'>('CREDITO');
  const [ajusteMinutos, setAjusteMinutos] = useState<number>(120); // default 2h
  const [ajusteMotivo, setAjusteMotivo] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleOpenAjuste = (funcId?: string) => {
    if (funcId) setSelectedFuncId(funcId);
    else if (bancoList.length > 0) setSelectedFuncId(bancoList[0].funcionarioId);
    setAjusteMotivo('');
    setAjusteMinutos(120);
    setAjusteTipo('CREDITO');
    setIsModalOpen(true);
  };

  const handleSalvarAjuste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFuncId || !ajusteMotivo.trim()) return;

    const delta = ajusteTipo === 'CREDITO' ? Math.abs(ajusteMinutos) : -Math.abs(ajusteMinutos);

    setBancoList(prev => prev.map(bh => {
      if (bh.funcionarioId === selectedFuncId || bh.id === selectedFuncId) {
        const newSaldo = bh.saldoMinutos + delta;
        const newCredito = ajusteTipo === 'CREDITO' ? bh.creditoMinutos + Math.abs(ajusteMinutos) : bh.creditoMinutos;
        const newDebito = ajusteTipo === 'DEBITO' ? bh.debitoMinutos + Math.abs(ajusteMinutos) : bh.debitoMinutos;
        return {
          ...bh,
          saldoMinutos: newSaldo,
          creditoMinutos: newCredito,
          debitoMinutos: newDebito,
          ultimaAtualizacao: new Date().toLocaleDateString('pt-BR')
        };
      }
      return bh;
    }));

    if (onAjustarBanco) {
      onAjustarBanco(selectedFuncId, delta, ajusteMotivo, ajusteTipo);
    }

    setIsModalOpen(false);
    setSuccessMsg(`Ajuste de ${formatarMinutosEmHoras(Math.abs(ajusteMinutos))} (${ajusteTipo}) registrado com sucesso!`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Mock calculations for Overtime impact
  const horaExtraResumo = bancoList.map(bh => {
    const isPositivo = bh.saldoMinutos > 0;
    const horasFloat = Math.abs(bh.saldoMinutos) / 60;
    const salarioEstimado = 4500; // Média estimada
    const valorHoraBase = salarioEstimado / 220;
    const valorHE50 = valorHoraBase * 1.5;
    const valorHE100 = valorHoraBase * 2.0;
    const valorEstimadoPagar = isPositivo ? (horasFloat * 0.7 * valorHE50) + (horasFloat * 0.3 * valorHE100) : 0;

    return {
      ...bh,
      horasExtras50: (horasFloat * 0.7).toFixed(1),
      horasExtras100: (horasFloat * 0.3).toFixed(1),
      valorEstimadoR$: valorEstimadoPagar.toFixed(2),
      statusFolha: 'Pronto para Folha'
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-[#2563EB] rounded-xl">
              <Scale className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900">Gestão de Banco de Horas & Horas Extras</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhe saldos acumulados, prazos de compensação, regras da empresa e simule valores de horas extras para folha de pagamento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAjuste()}
            className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar Ajuste / Compensação</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('banco')}
          className={`px-4 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'banco'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Painel de Saldos do Banco de Horas</span>
        </button>

        <button
          onClick={() => setActiveTab('horas_extras')}
          className={`px-4 py-2 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'horas_extras'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Apuração & Valores de Horas Extras (R$)</span>
        </button>
      </div>

      {/* TAB 1: BANCO DE HORAS */}
      {activeTab === 'banco' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {bancoList.map(bh => {
            const isPositivo = bh.saldoMinutos >= 0;
            return (
              <div key={bh.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{bh.funcionarioNome}</h3>
                    <p className="text-[11px] text-slate-400">Prazo Compensação: 6 Meses (Acordo)</p>
                    <p className="text-[10px] text-slate-400">Atualizado em: {bh.ultimaAtualizacao}</p>
                  </div>
                  <button
                    onClick={() => handleOpenAjuste(bh.funcionarioId || bh.id)}
                    title="Ajustar saldo"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <div className={`p-4 rounded-xl text-center space-y-1 ${
                  isPositivo ? 'bg-slate-900 text-white' : 'bg-rose-950 text-white'
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Saldo Acumulado</span>
                  <p className={`text-2xl font-black font-mono ${isPositivo ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatarMinutosEmHoras(bh.saldoMinutos)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100/80">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-0.5">Crédito (+HE)</span>
                    <span className="font-bold text-emerald-900 font-mono">{formatarMinutosEmHoras(bh.creditoMinutos)}</span>
                  </div>
                  <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100/80">
                    <span className="text-[10px] font-bold text-rose-800 uppercase block mb-0.5">Débito (-Atrasos)</span>
                    <span className="font-bold text-rose-900 font-mono">{formatarMinutosEmHoras(bh.debitoMinutos)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Limite Empresa: +20h / -05h</span>
                  <span className={`font-bold ${isPositivo ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isPositivo ? 'Dentro do Limite' : 'Saldo Negativo'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: HORAS EXTRAS & SIMULAÇÃO R$ */}
      {activeTab === 'horas_extras' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Apuração de Proventos de Horas Extras para Folha</h3>
              <p className="text-xs text-slate-500">Cálculo estimado dos adicionais de 50% e 100% com base nos acordos cadastrados</p>
            </div>
            <span className="px-3 py-1 bg-blue-50 text-[#2563EB] rounded-lg font-bold text-xs border border-blue-200">
              Período Corrente (Julho/2026)
            </span>
          </div>

          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-y border-slate-200">
              <tr>
                <th className="p-3">Colaborador</th>
                <th className="p-3">Saldo Banco</th>
                <th className="p-3">HE 50% (Horas)</th>
                <th className="p-3">HE 100% (Horas)</th>
                <th className="p-3">Valor Estimado (R$)</th>
                <th className="p-3">Status Integração</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {horaExtraResumo.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-3 font-sans font-bold text-slate-900">{item.funcionarioNome}</td>
                  <td className="p-3 font-bold text-slate-700">{formatarMinutosEmHoras(item.saldoMinutos)}</td>
                  <td className="p-3 text-emerald-700 font-bold">+{item.horasExtras50} hrs</td>
                  <td className="p-3 text-emerald-800 font-bold">+{item.horasExtras100} hrs</td>
                  <td className="p-3 font-bold text-slate-900 font-sans">
                    R$ {item.valorEstimadoR$}
                  </td>
                  <td className="p-3 font-sans">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                      {item.statusFolha}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL AJUSTE MANUAL DE BANCO DE HORAS */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#2563EB]" />
                Lançamento / Ajuste Manual de Banco
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarAjuste} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Colaborador *</label>
                <select
                  value={selectedFuncId}
                  onChange={(e) => setSelectedFuncId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                >
                  {bancoList.map(b => (
                    <option key={b.id} value={b.funcionarioId || b.id}>
                      {b.funcionarioNome} (Saldo: {formatarMinutosEmHoras(b.saldoMinutos)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Lançamento</label>
                  <select
                    value={ajusteTipo}
                    onChange={(e) => setAjusteTipo(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                  >
                    <option value="CREDITO">Crédito (+ Horas Extras)</option>
                    <option value="DEBITO">Débito (- Folga/Compensação)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantidade (Minutos)</label>
                  <input
                    type="number"
                    step="15"
                    value={ajusteMinutos}
                    onChange={(e) => setAjusteMinutos(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {formatarMinutosEmHoras(ajusteMinutos)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motivo / Justificativa Legal *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex: Compensação de folga autorizada pelo gestor direto no dia 15/07"
                  value={ajusteMotivo}
                  onChange={(e) => setAjusteMotivo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2563EB] text-white rounded-xl font-bold cursor-pointer hover:bg-blue-700 shadow-md"
                >
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
