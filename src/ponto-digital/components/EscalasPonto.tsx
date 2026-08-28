import React, { useState } from 'react';
import { Calendar, Clock, Plus, CheckCircle2, ShieldCheck, Edit, Trash2 } from 'lucide-react';
import { EscalaTrabalhoDoc, TipoEscala } from '../types/ponto';

interface EscalasPontoProps {
  escalas: EscalaTrabalhoDoc[];
  onSalvarEscala: (escala: EscalaTrabalhoDoc) => void;
}

export const EscalasPonto: React.FC<EscalasPontoProps> = ({
  escalas,
  onSalvarEscala,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [novaEscala, setNovaEscala] = useState<Partial<EscalaTrabalhoDoc>>({
    nome: '',
    tipo: 'Administrativo',
    horarioEntrada: '08:00',
    horarioSaida: '17:00',
    intervalo: '01:00',
    diasTrabalho: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
    toleranciaMinutos: 10
  });

  const handleSalvar = () => {
    if (!novaEscala.nome) return;
    const esc: EscalaTrabalhoDoc = {
      id: novaEscala.id || `esc-${Date.now()}`,
      empresaId: novaEscala.empresaId || '',
      nome: novaEscala.nome,
      tipo: (novaEscala.tipo as TipoEscala) || 'Administrativo',
      horarioEntrada: novaEscala.horarioEntrada || '08:00',
      horarioSaida: novaEscala.horarioSaida || '17:00',
      intervalo: novaEscala.intervalo || '01:00',
      diasTrabalho: novaEscala.diasTrabalho || ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
      toleranciaMinutos: novaEscala.toleranciaMinutos || 10
    };
    onSalvarEscala(esc);
    setShowModal(false);
    setNovaEscala({
      nome: '',
      tipo: 'Administrativo',
      horarioEntrada: '08:00',
      horarioSaida: '17:00',
      intervalo: '01:00',
      diasTrabalho: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
      toleranciaMinutos: 10
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Escalas & Regimes de Trabalho</h2>
          <p className="text-xs text-slate-500">Configuração de jornadas CLT, 12x36, 6x1, plantões operacionais e tolerâncias</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Escala de Trabalho</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {escalas.map(esc => (
          <div key={esc.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 hover:border-emerald-200 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase tracking-wider mb-2 border border-emerald-200/60">
                  {esc.tipo}
                </span>
                <h3 className="font-bold text-slate-900 text-base">{esc.nome}</h3>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span className="font-medium text-slate-400">Horário Expediente:</span>
                <span className="font-black text-slate-800">{esc.horarioEntrada} às {esc.horarioSaida}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-medium text-slate-400">Intervalo de Almoço:</span>
                <span className="font-black text-slate-800">{esc.intervalo}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-medium text-slate-400">Tolerância para Atraso:</span>
                <span className="font-black text-emerald-700">{esc.toleranciaMinutos} minutos</span>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dias de Atuação</p>
              <div className="flex flex-wrap gap-1">
                {esc.diasTrabalho.map(dia => (
                  <span key={dia} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold">
                    {dia}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Criar Escala */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="font-black text-slate-900 text-lg">Cadastrar Nova Escala de Trabalho</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome da Escala</label>
                <input
                  type="text"
                  placeholder="Ex: Comercial Flexível SP"
                  value={novaEscala.nome || ''}
                  onChange={e => setNovaEscala({ ...novaEscala, nome: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipo de Regime</label>
                  <select
                    value={novaEscala.tipo}
                    onChange={e => setNovaEscala({ ...novaEscala, tipo: e.target.value as TipoEscala })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Administrativo">Administrativo</option>
                    <option value="12x36">12x36</option>
                    <option value="6x1">6x1</option>
                    <option value="Plantão">Plantão</option>
                    <option value="Personalizada">Personalizada</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tolerância (minutos)</label>
                  <input
                    type="number"
                    value={novaEscala.toleranciaMinutos || 10}
                    onChange={e => setNovaEscala({ ...novaEscala, toleranciaMinutos: parseInt(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Entrada</label>
                  <input
                    type="time"
                    value={novaEscala.horarioEntrada || '08:00'}
                    onChange={e => setNovaEscala({ ...novaEscala, horarioEntrada: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Saída</label>
                  <input
                    type="time"
                    value={novaEscala.horarioSaida || '17:00'}
                    onChange={e => setNovaEscala({ ...novaEscala, horarioSaida: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Intervalo</label>
                  <input
                    type="time"
                    value={novaEscala.intervalo || '01:00'}
                    onChange={e => setNovaEscala({ ...novaEscala, intervalo: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvar}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Criar Escala
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
