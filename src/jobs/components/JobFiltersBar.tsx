import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { JobFilterParams } from '../types/job';
import {
  JOB_TYPE_OPTIONS,
  CORPORATE_DEPARTMENTS,
} from '../constants/jobOptions';
import { SearchBar } from '../../shared';

export interface JobFiltersBarProps {
  filters: JobFilterParams;
  onFilterChange: (newFilters: Partial<JobFilterParams>) => void;
  onResetFilters: () => void;
  totalResultsCount: number;
}

export const JobFiltersBar: React.FC<JobFiltersBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalResultsCount,
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="flex-1">
          <SearchBar
            value={filters.searchTerm}
            onChange={(val) => onFilterChange({ searchTerm: val })}
            placeholder="Buscar por cargo, cliente, departamento ou recrutador..."
          />
        </div>

        {/* Department & Type Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filters.department}
            onChange={(e) => onFilterChange({ department: e.target.value })}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="Todos">Todos os Departamentos</option>
            {CORPORATE_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={filters.type}
            onChange={(e) => onFilterChange({ type: e.target.value })}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="Todos">Todos os Contratos</option>
            {JOB_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Status Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2.5 border-t border-slate-100">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-extrabold uppercase text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-indigo-600" /> Status:
          </span>

          {['Abertas', 'Todas', 'Em andamento', 'Concluídas'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onFilterChange({ status: st })}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                filters.status === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Results Counter & Reset */}
        <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0">
          <span className="font-bold text-slate-700">
            {totalResultsCount} vaga(s)
          </span>

          <button
            type="button"
            onClick={onResetFilters}
            className="text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Limpar
          </button>
        </div>
      </div>
    </div>
  );
};
