import React from 'react';
import { Filter, RotateCcw, Calendar, Video, Search } from 'lucide-react';
import { InterviewFilterParams } from '../types/interview';
import {
  INTERVIEW_STATUS_OPTIONS,
  INTERVIEW_TYPE_OPTIONS,
} from '../constants/interviewOptions';
import { Job } from '../../jobs';
import { SearchBar } from '../../shared';

export interface InterviewFiltersBarProps {
  filters: InterviewFilterParams;
  jobs: Job[];
  onFilterChange: (newFilters: Partial<InterviewFilterParams>) => void;
  onResetFilters: () => void;
  totalResultsCount: number;
}

export const InterviewFiltersBar: React.FC<InterviewFiltersBarProps> = ({
  filters,
  jobs,
  onFilterChange,
  onResetFilters,
  totalResultsCount,
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="flex-1">
          <SearchBar
            value={filters.searchTerm || ''}
            onChange={(val) => onFilterChange({ searchTerm: val })}
            placeholder="Buscar por nome do candidato, entrevistador ou cargo..."
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Job Filter */}
          <select
            value={filters.jobId || 'Todas'}
            onChange={(e) => onFilterChange({ jobId: e.target.value })}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="Todas">Todas as Vagas</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>

          {/* Type/Modal Filter */}
          <select
            value={filters.type || 'Todas'}
            onChange={(e) => onFilterChange({ type: e.target.value })}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="Todas">Todas Modalidades</option>
            {INTERVIEW_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Date Range */}
          <select
            value={filters.dateRange || 'Todos'}
            onChange={(e) =>
              onFilterChange({ dateRange: e.target.value as any })
            }
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="Todos">Todas as Datas</option>
            <option value="Hoje">Agendadas para Hoje</option>
            <option value="Esta Semana">Esta Semana</option>
            <option value="Próximos Dias">Próximos Dias</option>
          </select>
        </div>
      </div>

      {/* Status Tabs & Count */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-extrabold uppercase text-slate-400 mr-1">
            Status:
          </span>

          {['Todas', ...INTERVIEW_STATUS_OPTIONS].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onFilterChange({ status: st })}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filters.status === st || (!filters.status && st === 'Todas')
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="font-bold text-slate-700">
            {totalResultsCount} agendamento(s)
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
