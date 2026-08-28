import React, { useState } from 'react';
import { Users, Search, Plus, UserCheck, Shield, Edit, Calendar } from 'lucide-react';
import { FuncionarioPontoInfo, EscalaTrabalhoDoc } from '../types/ponto';

interface FuncionariosPontoProps {
  funcionarios: FuncionarioPontoInfo[];
  escalas: EscalaTrabalhoDoc[];
  onSalvarFuncionario: (func: FuncionarioPontoInfo) => void;
}

export const FuncionariosPonto: React.FC<FuncionariosPontoProps> = ({
  funcionarios,
  escalas,
  onSalvarFuncionario,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingFunc, setEditingFunc] = useState<FuncionarioPontoInfo | null>(null);

  const filtered = funcionarios.filter(f => 
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.setor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Funcionários & Escalas de Jornada</h2>
          <p className="text-xs text-slate-500">Atribuição de horários de trabalho e gestores diretos para cada colaborador</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar colaborador..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs w-64 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-4">Colaborador</th>
              <th className="p-4">Cargo / Setor</th>
              <th className="p-4">Escala de Trabalho</th>
              <th className="p-4">Gestor Direto</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(func => (
              <tr key={func.id} className="hover:bg-slate-50/50 transition-all">
                <td className="p-4 font-bold text-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs">
                      {(func.nome || (func as any).nomeCompleto || 'C').split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{func.nome || (func as any).nomeCompleto || 'Colaborador'}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{func.cpf}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <p className="font-semibold text-slate-800">{func.cargo}</p>
                  <p className="text-[11px] text-slate-500">{func.setor}</p>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60">
                    <Calendar className="w-3.5 h-3.5" />
                    {func.escalaNome || 'Escala Padrão'}
                  </span>
                </td>
                <td className="p-4 font-medium text-slate-700">
                  {func.gestorNome || 'Nenhum gestor'}
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {func.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => setEditingFunc(func)}
                    className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Scale Modal */}
      {editingFunc && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="font-black text-slate-900 text-lg mb-1">Editar Escala de Jornada</h3>
            <p className="text-xs text-slate-500 mb-4">{editingFunc.nome} - {editingFunc.cargo}</p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Selecione a Escala de Trabalho</label>
                <select
                  value={editingFunc.escalaId}
                  onChange={e => {
                    const found = escalas.find(esc => esc.id === e.target.value);
                    setEditingFunc({
                      ...editingFunc,
                      escalaId: e.target.value,
                      escalaNome: found ? found.nome : editingFunc.escalaNome
                    });
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {escalas.map(e => (
                    <option key={e.id} value={e.id}>{e.nome} ({e.horarioEntrada} às {e.horarioSaida})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Gestor Direto Responsável</label>
                <input
                  type="text"
                  value={editingFunc.gestorNome || ''}
                  onChange={e => setEditingFunc({ ...editingFunc, gestorNome: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Nome do gestor..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setEditingFunc(null)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onSalvarFuncionario(editingFunc);
                    setEditingFunc(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
