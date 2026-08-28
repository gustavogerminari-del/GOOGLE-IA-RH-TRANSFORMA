import React, { useState } from 'react';
import { 
  Filter, 
  X, 
  Calendar, 
  Building2, 
  Layers, 
  Briefcase, 
  UserCheck, 
  Bookmark, 
  RotateCcw, 
  ChevronDown, 
  Save 
} from 'lucide-react';
import { DPGlobalFilterState, DPPeriodType } from '../types/dp';

interface DpGlobalFiltersBarProps {
  filters: DPGlobalFilterState;
  onChangeFilters: (newFilters: DPGlobalFilterState) => void;
  departments: string[];
  units: string[];
  costCenters: string[];
  roles: string[];
  managers: string[];
  isMasterUser?: boolean;
  companies?: { id: string; name: string }[];
}

export const DpGlobalFiltersBar: React.FC<DpGlobalFiltersBarProps> = ({
  filters,
  onChangeFilters,
  departments,
  units,
  costCenters,
  roles,
  managers,
  isMasterUser = false,
  companies = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [presetSavedName, setPresetSavedName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  const activeFiltersCount = [
    filters.period !== 'mes_atual' ? 'Período' : null,
    filters.department ? 'Depto' : null,
    filters.unit ? 'Unidade' : null,
    filters.costCenter ? 'Centro Custo' : null,
    filters.role ? 'Cargo' : null,
    filters.manager ? 'Gestor' : null,
    filters.contractType ? 'Contrato' : null,
    filters.employeeStatus !== 'Ativo' ? 'Status' : null
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    onChangeFilters({
      period: 'mes_atual',
      startDate: '',
      endDate: '',
      companyId: filters.companyId,
      department: '',
      costCenter: '',
      unit: '',
      role: '',
      manager: '',
      contractType: '',
      employeeStatus: 'Ativo',
      competence: '',
      ageRange: '',
      tenure: ''
    });
  };

  const handleSavePreset = () => {
    if (!presetSavedName.trim()) return;
    try {
      const existingPresets = JSON.parse(localStorage.getItem('maisrh_filter_presets') || '[]');
      existingPresets.push({
        id: `preset-${Date.now()}`,
        name: presetSavedName.trim(),
        filters
      });
      localStorage.setItem('maisrh_filter_presets', JSON.stringify(existingPresets));
      setPresetSavedName('');
      setShowSaveModal(false);
      alert('Visualização personalizada salva com sucesso!');
    } catch (e) {
      console.error('Erro ao salvar preset:', e);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 space-y-3">
      {/* Primary Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 flex items-center gap-1.5 text-xs font-bold">
            <Filter className="w-4 h-4" />
            <span>Filtros Globais DP</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black">
                {activeFiltersCount}
              </span>
            )}
          </span>

          {/* Quick Period Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => onChangeFilters({ ...filters, period: 'mes_atual' })}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filters.period === 'mes_atual' ? 'bg-white text-indigo-600 shadow-2xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              Mês Atual
            </button>
            <button
              onClick={() => onChangeFilters({ ...filters, period: 'mes_anterior' })}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filters.period === 'mes_anterior' ? 'bg-white text-indigo-600 shadow-2xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              Mês Anterior
            </button>
            <button
              onClick={() => onChangeFilters({ ...filters, period: 'trimestre' })}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filters.period === 'trimestre' ? 'bg-white text-indigo-600 shadow-2xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              Trimestre
            </button>
            <button
              onClick={() => onChangeFilters({ ...filters, period: 'ano' })}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                filters.period === 'ano' ? 'bg-white text-indigo-600 shadow-2xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              Ano
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {activeFiltersCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}

          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Salvar Visão</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <span>{isExpanded ? 'Recolher Filtros' : 'Mais Filtros'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded Filters Drawer */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* MASTER Company Filter */}
          {isMasterUser && companies.length > 0 && (
            <div className="space-y-1">
              <label className="font-bold text-slate-600">Empresa (Multitenant Master)</label>
              <select
                value={filters.companyId}
                onChange={e => onChangeFilters({ ...filters, companyId: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Department */}
          <div className="space-y-1">
            <label className="font-bold text-slate-600">Departamento</label>
            <select
              value={filters.department}
              onChange={e => onChangeFilters({ ...filters, department: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos os Departamentos</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Unit / Filial */}
          <div className="space-y-1">
            <label className="font-bold text-slate-600">Unidade / Filial</label>
            <select
              value={filters.unit}
              onChange={e => onChangeFilters({ ...filters, unit: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todas as Unidades</option>
              {units.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* Cost Center */}
          <div className="space-y-1">
            <label className="font-bold text-slate-600">Centro de Custo</label>
            <select
              value={filters.costCenter}
              onChange={e => onChangeFilters({ ...filters, costCenter: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos os Centros de Custo</option>
              {costCenters.map(cc => (
                <option key={cc} value={cc}>{cc}</option>
              ))}
            </select>
          </div>

          {/* Role */}
          <div className="space-y-1">
            <label className="font-bold text-slate-600">Cargo</label>
            <select
              value={filters.role}
              onChange={e => onChangeFilters({ ...filters, role: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos os Cargos</option>
              {roles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Manager */}
          <div className="space-y-1">
            <label className="font-bold text-slate-600">Gestor Direto</label>
            <select
              value={filters.manager}
              onChange={e => onChangeFilters({ ...filters, manager: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos os Gestores</option>
              {managers.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Contract Type */}
          <div className="space-y-1">
            <label className="font-bold text-slate-600">Tipo de Contrato</label>
            <select
              value={filters.contractType}
              onChange={e => onChangeFilters({ ...filters, contractType: e.target.value })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos os Tipos</option>
              <option value="CLT">CLT (Efetivo)</option>
              <option value="PJ">PJ / Prestador</option>
              <option value="Estágio">Estágio</option>
              <option value="Aprendiz">Jovem Aprendiz</option>
              <option value="Temporário">Temporário</option>
            </select>
          </div>

          {/* Employee Status */}
          <div className="space-y-1">
            <label className="font-bold text-slate-600">Status do Colaborador</label>
            <select
              value={filters.employeeStatus}
              onChange={e => onChangeFilters({ ...filters, employeeStatus: e.target.value as any })}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Ativo">Apenas Ativos</option>
              <option value="Afastado">Afastados</option>
              <option value="Ferias">Em Férias</option>
              <option value="Rescindido">Rescindidos / Inativos</option>
              <option value="Todos">Todos os Status</option>
            </select>
          </div>
        </div>
      )}

      {/* Save Preset Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-lg">Salvar Visão Personalizada</h3>
              <button 
                onClick={() => setShowSaveModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Crie um atalho para este conjunto de filtros e acesse rapidamente a qualquer momento.
            </p>
            <input
              type="text"
              placeholder="Ex: Minha Equipe Comercial - Turno Manhã"
              value={presetSavedName}
              onChange={e => setPresetSavedName(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePreset}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Visão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
