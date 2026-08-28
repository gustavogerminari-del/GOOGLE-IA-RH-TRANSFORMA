import React from 'react';
import { Filter, RotateCcw, Building2, Tag } from 'lucide-react';
import { CandidateFilterParams } from '../types/candidate';
import {
  CANDIDATE_CLASSIFICATION_OPTIONS,
  CANDIDATE_STATUS_OPTIONS,
  DEPARTMENT_AREAS,
  COMMON_SKILLS,
} from '../constants/candidateOptions';
import { SearchBar } from '../../shared';

export interface CandidateFiltersBarProps {
  filters: CandidateFilterParams;
  onFilterChange: (newFilters: Partial<CandidateFilterParams>) => void;
  onResetFilters: () => void;
  totalResultsCount: number;
}

export const CandidateFiltersBar: React.FC<CandidateFiltersBarProps> = ({
  filters,
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
            value={filters.searchTerm}
            onChange={(val) => onFilterChange({ searchTerm: val })}
            placeholder="Buscar por nome, cargo pretensioso, habilidade ou localidade..."
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Area */}
          <select
            value={filters.departmentArea}
            onChange={(e) => onFilterChange({ departmentArea: e.target.value })}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="Todas">Todas as Áreas</option>
            {DEPARTMENT_AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {/* Skill Filter */}
          <select
            value={filters.skill}
            onChange={(e) => onFilterChange({ skill: e.target.value })}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="Todas">Todas as Habilidades</option>
            {COMMON_SKILLS.map((sk) => (
              <option key={sk} value={sk}>
                {sk}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="Todos">Todos os Status</option>
            {CANDIDATE_STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Classifications Tabs & Result Counter */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-extrabold uppercase text-slate-400 flex items-center gap-1 mr-1">
            <Tag className="w-3.5 h-3.5 text-indigo-600" /> Classificação:
          </span>

          {['Todas', ...CANDIDATE_CLASSIFICATION_OPTIONS].map((cl) => (
            <button
              key={cl}
              type="button"
              onClick={() => onFilterChange({ classification: cl })}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filters.classification === cl
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cl}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="font-bold text-slate-700">
            {totalResultsCount} talento(s) encontrado(s)
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
