import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  UserCheck, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle,
  FileText,
  UserX,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { ProcessoRescisaoCompleto, StatusRescisao, TipoDesligamento } from '../../types/terminationTypes';

interface ProcessoRescisaoListaProps {
  processes: ProcessoRescisaoCompleto[];
  selectedProcessId: string | null;
  onSelectProcess: (id: string) => void;
  onOpenNewModal: () => void;
}

export const ProcessoRescisaoLista: React.FC<ProcessoRescisaoListaProps> = ({
  processes,
  selectedProcessId,
  onSelectProcess,
  onOpenNewModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [typeFilter, setTypeFilter] = useState<string>('TODOS');
  const [onlyExEmployees, setOnlyExEmployees] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filtering
  const filtered = processes.filter(p => {
    const matchesSearch = 
      p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.employeeCpf && p.employeeCpf.includes(searchTerm)) ||
      (p.employeeDepartment && p.employeeDepartment.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'TODOS' || p.status === statusFilter;
    const matchesType = typeFilter === 'TODOS' || p.terminationType === typeFilter;
    const matchesEx = !onlyExEmployees || p.status === 'Concluída';

    return matchesSearch && matchesStatus && matchesType && matchesEx;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const pageIndex = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((pageIndex - 1) * itemsPerPage, pageIndex * itemsPerPage);

  const getStatusBadge = (status: StatusRescisao) => {
    switch (status) {
      case 'Concluída':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Concluída</span>;
      case 'Pronta para conclusão':
      case 'Aprovada':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">{status}</span>;
      case 'Cancelada':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Cancelada</span>;
      case 'Reaberta':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Reaberta</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Buscar por colaborador, CPF ou departamento..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="Solicitada">Solicitada</option>
            <option value="Aprovada">Aprovada</option>
            <option value="Em processamento">Em processamento</option>
            <option value="Pronta para conclusão">Pronta para conclusão</option>
            <option value="Concluída">Concluída</option>
            <option value="Cancelada">Cancelada</option>
          </select>

          <button
            onClick={() => { setOnlyExEmployees(!onlyExEmployees); setCurrentPage(1); }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              onlyExEmployees 
                ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold' 
                : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Apenas Ex-Colaboradores</span>
          </button>
        </div>
      </div>

      {/* Process Table */}
      <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold">
              <th className="py-3 px-4">Colaborador</th>
              <th className="py-3 px-4">Cargo / Depto</th>
              <th className="py-3 px-4">Tipo de Desligamento</th>
              <th className="py-3 px-4">Data Solicitação</th>
              <th className="py-3 px-4">Data Desligamento</th>
              <th className="py-3 px-4 text-right">Líquido TRCT</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  Nenhum processo de rescisão encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              paginated.map(p => {
                const isSelected = p.id === selectedProcessId;
                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectProcess(p.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected ? 'bg-rose-50/50 hover:bg-rose-50/70 font-medium' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{p.employeeName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">CPF: {p.employeeCpf || 'N/A'}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-800">{p.employeeRole || 'Cargo N/A'}</div>
                      <div className="text-[10px] text-slate-500">{p.employeeDepartment || 'Geral'}</div>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-700">
                      {p.terminationType}
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {p.requestDate}
                    </td>

                    <td className="py-3 px-4 text-slate-800 font-mono font-bold">
                      {p.plannedTerminationDate}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {p.totalNet.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(p.status)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectProcess(p.id); }}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <span>Gerenciar</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <span>
          Mostrando {paginated.length} de {filtered.length} processos
        </span>

        <div className="flex items-center gap-1">
          <button
            disabled={pageIndex <= 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 border border-slate-200/80 rounded-lg cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 font-semibold text-slate-700">
            Página {pageIndex} de {totalPages}
          </span>
          <button
            disabled={pageIndex >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 border border-slate-200/80 rounded-lg cursor-pointer"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
