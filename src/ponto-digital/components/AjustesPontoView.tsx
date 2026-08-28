import React, { useState } from 'react';
import { FileEdit, CheckCircle, XCircle, Clock, Plus, AlertCircle } from 'lucide-react';
import { AjustePontoDoc, FuncionarioPontoInfo } from '../types/ponto';

interface AjustesPontoViewProps {
  ajustes: AjustePontoDoc[];
  funcionarios: FuncionarioPontoInfo[];
  onSalvarAjuste: (ajuste: AjustePontoDoc) => void;
  isManagerOrMaster: boolean;
}

export const AjustesPontoView: React.FC<AjustesPontoViewProps> = ({
  ajustes,
  funcionarios,
  onSalvarAjuste,
  isManagerOrMaster,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [novoAjuste, setNovoAjuste] = useState<Partial<AjustePontoDoc>>({
    data: new Date().toISOString().split('T')[0],
    horarioEntradaProp: '08:00',
    horarioSaidaProp: '17:00',
    motivo: 'Esquecimento de registro',
    observacao: ''
  });

  const handleAprovar = (ajuste: AjustePontoDoc) => {
    onSalvarAjuste({
      ...ajuste,
      status: 'Aprovado',
      aprovadoPor: 'Gestor Responsável',
      dataAprovacao: new Date().toISOString()
    });
  };

  const handleRejeitar = (ajuste: AjustePontoDoc) => {
    onSalvarAjuste({
      ...ajuste,
      status: 'Rejeitado',
      aprovadoPor: 'Gestor Responsável',
      dataAprovacao: new Date().toISOString()
    });
  };

  const handleCriarSolicitacao = () => {
    if (!novoAjuste.data) return;
    const aj: AjustePontoDoc = {
      id: `aj-${Date.now()}`,
      funcionarioId: 'func-01',
      funcionarioNome: 'Carlos Eduardo Silva',
      empresaId: '',
      data: novoAjuste.data,
      horarioEntradaProp: novoAjuste.horarioEntradaProp || '08:00',
      horarioSaidaProp: novoAjuste.horarioSaidaProp || '17:00',
      motivo: novoAjuste.motivo || 'Esquecimento',
      observacao: novoAjuste.observacao || '',
      status: 'Pendente'
    };
    onSalvarAjuste(aj);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Solicitações & Ajustes de Ponto</h2>
          <p className="text-xs text-slate-500">Fluxo de aprovação de horários esquecidos ou correções de batida</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Solicitar Ajuste</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-4">Colaborador</th>
              <th className="p-4">Data Solicitada</th>
              <th className="p-4">Horários Propostos</th>
              <th className="p-4">Motivo / Observação</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ação / Resposta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ajustes.map(aj => (
              <tr key={aj.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-bold text-slate-900">{aj.funcionarioNome}</td>
                <td className="p-4 font-mono font-bold text-slate-800">{aj.data.split('-').reverse().join('/')}</td>
                <td className="p-4 font-mono text-slate-700">{aj.horarioEntradaProp} às {aj.horarioSaidaProp}</td>
                <td className="p-4">
                  <p className="font-bold text-slate-800">{aj.motivo}</p>
                  <p className="text-[11px] text-slate-500">{aj.observacao || 'Sem observação extra'}</p>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    aj.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-800' :
                    aj.status === 'Rejeitado' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {aj.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {aj.status === 'Pendente' && isManagerOrMaster ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleAprovar(aj)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px]"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                      </button>
                      <button
                        onClick={() => handleRejeitar(aj)}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px]"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Rejeitar
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">
                      {aj.aprovadoPor ? `${aj.aprovadoPor}` : 'Aguardando avaliação'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Solicitação */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="font-black text-slate-900 text-lg">Nova Solicitação de Ajuste</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Data do Ajuste</label>
                <input
                  type="date"
                  value={novoAjuste.data}
                  onChange={e => setNovoAjuste({ ...novoAjuste, data: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Entrada Real</label>
                  <input
                    type="time"
                    value={novoAjuste.horarioEntradaProp}
                    onChange={e => setNovoAjuste({ ...novoAjuste, horarioEntradaProp: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Saída Real</label>
                  <input
                    type="time"
                    value={novoAjuste.horarioSaidaProp}
                    onChange={e => setNovoAjuste({ ...novoAjuste, horarioSaidaProp: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Motivo</label>
                <select
                  value={novoAjuste.motivo}
                  onChange={e => setNovoAjuste({ ...novoAjuste, motivo: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Esquecimento de registro">Esquecimento de registro</option>
                  <option value="Problema técnico no dispositivo">Problema técnico no dispositivo</option>
                  <option value="Serviço externo / Reunião fora">Serviço externo / Reunião fora</option>
                  <option value="Consulta médica">Consulta médica</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Observações Adicionais</label>
                <textarea
                  rows={2}
                  value={novoAjuste.observacao}
                  onChange={e => setNovoAjuste({ ...novoAjuste, observacao: e.target.value })}
                  placeholder="Justifique o motivo do ajuste para o gestor..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCriarSolicitacao}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Enviar para Aprovação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
