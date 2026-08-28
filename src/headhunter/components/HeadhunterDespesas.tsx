import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  DollarSign, 
  Filter, 
  FileText, 
  Search, 
  Briefcase, 
  Building2, 
  Users,
  CheckCircle2
} from 'lucide-react';
import { HeadhunterExpense, ExpenseCategory, HeadhunterClient, HeadhunterJob } from '../types';

interface HeadhunterDespesasProps {
  expenses: HeadhunterExpense[];
  clients: HeadhunterClient[];
  jobs: HeadhunterJob[];
  onAddExpense: (expense: HeadhunterExpense) => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Combustível', 'Pedágio', 'Alimentação', 'Uber', 'Hotel', 'Passagens', 'Material', 'Internet', 'Telefone', 'Marketing', 'Outros'
];

export const HeadhunterDespesas: React.FC<HeadhunterDespesasProps> = ({
  expenses,
  clients,
  jobs,
  onAddExpense
}) => {
  const [showModal, setShowModal] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [vagaId, setVagaId] = useState('');
  const [consultorNome, setConsultorNome] = useState('Carlos Headhunter');
  const [categoria, setCategoria] = useState<ExpenseCategory>('Uber');
  const [centroCusto, setCentroCusto] = useState('Viagens e Deslocamento');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [valor, setValor] = useState(150);
  const [observacao, setObservacao] = useState('');

  // Totais
  const totalDespesas = expenses.reduce((acc, e) => acc + e.valor, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const cli = clients.find(c => c.id === clienteId);
    const jb = jobs.find(j => j.id === vagaId);

    const newExpense: HeadhunterExpense = {
      id: `exp-${Date.now()}`,
      empresaId: '',
      criadoPor: consultorNome,
      criadoEm: new Date().toISOString().split('T')[0],
      status: 'Aprovado',
      clienteId,
      clienteNome: cli?.nomeFantasia,
      vagaId,
      vagaTitulo: jb?.cargo,
      consultorNome,
      centroCusto,
      categoria,
      data,
      valor,
      observacao
    };

    onAddExpense(newExpense);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Gestão de Despesas Operacionais de Headhunting</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lançamento de reembolsos, viagens, Uber, combustível, testes e anúncios vinculados a clientes e vagas.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Lançar Nova Despesa</span>
        </button>
      </div>

      {/* EXPENSE SUMMARY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Geral Despesas</span>
          <p className="text-2xl font-black text-rose-600 mt-1">R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* EXPENSES TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-800">Relatório de Despesas Lançadas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="p-3">Categoria & Centro de Custo</th>
                <th className="p-3">Cliente / Vaga Vinculada</th>
                <th className="p-3">Consultor</th>
                <th className="p-3 text-right">Valor (R$)</th>
                <th className="p-3 text-center">Data</th>
                <th className="p-3">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <strong className="text-slate-900 block">{exp.categoria}</strong>
                    <span className="text-slate-400 text-[11px]">{exp.centroCusto}</span>
                  </td>
                  <td className="p-3">
                    <strong className="text-slate-800 block">{exp.clienteNome || 'Geral'}</strong>
                    <span className="text-slate-500 text-[11px]">{exp.vagaTitulo || 'Não vinculada'}</span>
                  </td>
                  <td className="p-3 font-medium text-slate-700">{exp.consultorNome}</td>
                  <td className="p-3 text-right font-black text-rose-600">R$ {exp.valor.toFixed(2)}</td>
                  <td className="p-3 text-center font-medium text-slate-600">{exp.data}</td>
                  <td className="p-3 text-slate-600 max-w-xs truncate">{exp.observacao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Lançar Nova Despesa Operacional</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria de Despesa</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value as any)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor (R$)</label>
                  <input required type="number" step="0.01" value={valor} onChange={e => setValor(Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cliente Vinculado</label>
                  <select value={clienteId} onChange={e => setClienteId(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">Nenhum / Despesa Geral</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.nomeFantasia}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vaga Vinculada</label>
                  <select value={vagaId} onChange={e => setVagaId(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <option value="">Nenhuma / Despesa Geral</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.cargo}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observação / Justificativa</label>
                <input required type="text" value={observacao} onChange={e => setObservacao(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer hover:bg-indigo-700">Lançar Despesa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
