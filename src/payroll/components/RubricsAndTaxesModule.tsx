import React, { useState } from 'react';
import { 
  FileCode, 
  PlusCircle, 
  Check, 
  AlertCircle, 
  Layers, 
  DollarSign, 
  Percent, 
  Settings, 
  Edit3, 
  Save, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';
import { RubricDefinition, TaxTableVersion } from '../types/payroll';
import { DEFAULT_RUBRICS, DEFAULT_TAX_TABLE_2026 } from '../services/payrollFirestoreService';

interface RubricsAndTaxesModuleProps {
  rubrics: RubricDefinition[];
  taxTable: TaxTableVersion;
  onSaveRubric: (rubric: RubricDefinition) => void;
  onSaveTaxTable: (table: TaxTableVersion) => void;
  isClosedPeriod?: boolean;
}

export const RubricsAndTaxesModule: React.FC<RubricsAndTaxesModuleProps> = ({
  rubrics: initialRubrics,
  taxTable: initialTaxTable,
  onSaveRubric,
  onSaveTaxTable
}) => {
  const [activeTab, setActiveTab] = useState<'rubricas' | 'tabelas'>('rubricas');

  // Rubrics State
  const [rubricsList, setRubricsList] = useState<RubricDefinition[]>(initialRubrics.length ? initialRubrics : DEFAULT_RUBRICS);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'Todos' | 'Provento' | 'Desconto' | 'Informativa'>('Todos');
  const [editingRubric, setEditingRubric] = useState<RubricDefinition | null>(null);

  // New Rubric Form State
  const [showNewRubricModal, setShowNewRubricModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'Provento' | 'Desconto' | 'Informativa'>('Provento');
  const [newDesc, setNewDesc] = useState('');
  const [newIncINSS, setNewIncINSS] = useState(true);
  const [newIncIRRF, setNewIncIRRF] = useState(true);
  const [newIncFGTS, setNewIncFGTS] = useState(true);
  const [newIncDSR, setNewIncDSR] = useState(false);

  // Tax Table State
  const [taxTable, setTaxTable] = useState<TaxTableVersion>(initialTaxTable || DEFAULT_TAX_TABLE_2026);
  const [isEditingTaxTable, setIsEditingTaxTable] = useState(false);

  const filteredRubrics = rubricsList.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.code.includes(searchTerm);
    const matchesType = typeFilter === 'Todos' || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreateRubric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;

    const rubric: RubricDefinition = {
      code: newCode,
      name: newName,
      type: newType,
      description: newDesc || newName,
      incidesINSS: newIncINSS,
      incidesIRRF: newIncIRRF,
      incidesFGTS: newIncFGTS,
      incidesDSR: newIncDSR,
      isSystemDefault: false
    };

    setRubricsList(prev => [...prev, rubric]);
    onSaveRubric(rubric);
    setShowNewRubricModal(false);
    setNewCode('');
    setNewName('');
    setNewDesc('');
  };

  const handleSaveTaxTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTaxTable(taxTable);
    setIsEditingTaxTable(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Sub-Header Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('rubricas')}
          className={`px-4 py-2.5 font-extrabold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'rubricas'
              ? 'bg-white text-indigo-600 border-t-2 border-x border-slate-200 border-t-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Catálogo de Eventos & Rúbricas eSocial ({rubricsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tabelas')}
          className={`px-4 py-2.5 font-extrabold text-xs rounded-t-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'tabelas'
              ? 'bg-white text-indigo-600 border-t-2 border-x border-slate-200 border-t-indigo-600 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Percent className="w-4 h-4 text-emerald-600" />
          <span>Tabelas Tributárias & Encargos (2026)</span>
        </button>
      </div>

      {/* Rúbricas Tab */}
      {activeTab === 'rubricas' && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Buscar por nome da rúbrica ou código..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 font-medium w-full sm:w-72 focus:ring-2 focus:ring-indigo-500"
              />

              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white"
              >
                <option value="Todos">Todos os Tipos</option>
                <option value="Provento">Proventos (+)</option>
                <option value="Desconto">Descontos (-)</option>
                <option value="Informativa">Informativas</option>
              </select>
            </div>

            <button
              onClick={() => setShowNewRubricModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Rúbrica Personalizada</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                    <th className="p-3 w-20">Cód.</th>
                    <th className="p-3">Nome da Rúbrica</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3 text-center">Incidência INSS</th>
                    <th className="p-3 text-center">Incidência IRRF</th>
                    <th className="p-3 text-center">Incidência FGTS</th>
                    <th className="p-3 text-center">Gera DSR</th>
                    <th className="p-3">Origem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredRubrics.map((rubric, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-extrabold text-indigo-700">{rubric.code}</td>
                      <td className="p-3 font-bold text-slate-900">
                        {rubric.name}
                        <p className="text-[10px] text-slate-400 font-normal">{rubric.description}</p>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          rubric.type === 'Provento' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : rubric.type === 'Desconto'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {rubric.type}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        {rubric.incidesINSS ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md border border-emerald-200 text-[10px]">Sim</span>
                        ) : (
                          <span className="text-slate-300 font-bold">-</span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {rubric.incidesIRRF ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md border border-emerald-200 text-[10px]">Sim</span>
                        ) : (
                          <span className="text-slate-300 font-bold">-</span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {rubric.incidesFGTS ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md border border-emerald-200 text-[10px]">Sim</span>
                        ) : (
                          <span className="text-slate-300 font-bold">-</span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {rubric.incidesDSR ? (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md border border-indigo-200 text-[10px]">Sim</span>
                        ) : (
                          <span className="text-slate-300 font-bold">-</span>
                        )}
                      </td>

                      <td className="p-3">
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {rubric.isSystemDefault ? 'Padrão CLT' : 'Personalizada'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Tabelas Tributárias Tab */}
      {activeTab === 'tabelas' && (
        <form onSubmit={handleSaveTaxTableSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  Vigência Atual: {taxTable.vigenciaInicio}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">{taxTable.description}</h3>
                <p className="text-xs text-slate-500">
                  Parâmetros de alíquotas do INSS progressivo, IRRF com dedução simplificada, Salário Mínimo e Encargos Patronais.
                </p>
              </div>

              {isEditingTaxTable ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingTaxTable(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-xs rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 font-black text-white text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingTaxTable(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Editar Tabela</span>
                </button>
              )}
            </div>

            {/* General Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <label className="font-bold text-slate-600 block mb-1">Salário Mínimo Nacional (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  disabled={!isEditingTaxTable}
                  value={taxTable.minimumWage}
                  onChange={e => setTaxTable({ ...taxTable, minimumWage: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-black text-indigo-700 bg-white"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <label className="font-bold text-slate-600 block mb-1">Teto Máximo INSS (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  disabled={!isEditingTaxTable}
                  value={taxTable.inssCeiling}
                  onChange={e => setTaxTable({ ...taxTable, inssCeiling: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-black text-indigo-700 bg-white"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <label className="font-bold text-slate-600 block mb-1">Dedução por Dependente IRRF (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  disabled={!isEditingTaxTable}
                  value={taxTable.irrfDependentDeduction}
                  onChange={e => setTaxTable({ ...taxTable, irrfDependentDeduction: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-black text-indigo-700 bg-white"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <label className="font-bold text-slate-600 block mb-1">Desconto Simplificado IRRF (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  disabled={!isEditingTaxTable}
                  value={taxTable.irrfSimplifiedDeduction}
                  onChange={e => setTaxTable({ ...taxTable, irrfSimplifiedDeduction: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-black text-indigo-700 bg-white"
                />
              </div>
            </div>

            {/* INSS Brackets Table */}
            <div className="space-y-2">
              <h4 className="font-black text-slate-900 text-sm">Faixas de Alíquota Progressiva INSS (2026)</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                      <th className="p-2.5">Faixa</th>
                      <th className="p-2.5">De (R$)</th>
                      <th className="p-2.5">Até (R$)</th>
                      <th className="p-2.5 text-right">Alíquota (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {taxTable.inssBrackets.map((b, i) => (
                      <tr key={i}>
                        <td className="p-2.5 font-bold text-slate-800">Faixa {i + 1}</td>
                        <td className="p-2.5">R$ {b.min.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-2.5">R$ {b.max.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-2.5 text-right font-black text-indigo-600">{b.rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* IRRF Brackets Table */}
            <div className="space-y-2">
              <h4 className="font-black text-slate-900 text-sm">Faixas do Imposto de Renda Retido na Fonte (IRRF)</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px]">
                      <th className="p-2.5">Base Tributável (R$)</th>
                      <th className="p-2.5">Alíquota (%)</th>
                      <th className="p-2.5 text-right">Parcela a Deduzir (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {taxTable.irrfBrackets.map((b, i) => (
                      <tr key={i}>
                        <td className="p-2.5">
                          Até R$ {b.max.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 font-black text-indigo-600">{b.rate}%</td>
                        <td className="p-2.5 text-right font-extrabold text-rose-600">
                          R$ {(b.deduction || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </form>
      )}

      {/* Modal Nova Rúbrica */}
      {showNewRubricModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900">Adicionar Nova Rúbrica de Folha</h3>

            <form onSubmit={handleCreateRubric} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código Rúbrica *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 2001"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo *</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="Provento">Provento (+)</option>
                    <option value="Desconto">Desconto (-)</option>
                    <option value="Informativa">Informativa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome da Rúbrica *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Gratificação por Desempenho"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição detalhada</label>
                <textarea
                  rows={2}
                  placeholder="Descrição da regra trabalhista..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50">
                <span className="font-bold text-slate-800 block">Incidências Fiscais Trabalhistas:</span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newIncINSS}
                      onChange={e => setNewIncINSS(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Incide INSS</span>
                  </label>

                  <label className="flex items-center gap-2 font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newIncIRRF}
                      onChange={e => setNewIncIRRF(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Incide IRRF</span>
                  </label>

                  <label className="flex items-center gap-2 font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newIncFGTS}
                      onChange={e => setNewIncFGTS(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Incide FGTS</span>
                  </label>

                  <label className="flex items-center gap-2 font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newIncDSR}
                      onChange={e => setNewIncDSR(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Gera Reflexo DSR</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewRubricModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-extrabold text-white shadow-md"
                >
                  Salvar Rúbrica
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
