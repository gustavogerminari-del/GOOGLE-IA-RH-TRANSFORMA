import React, { useState } from 'react';
import { 
  Building, 
  ShieldAlert, 
  AlertOctagon, 
  Plus, 
  FileCheck, 
  Activity, 
  CheckCircle2, 
  Info,
  Calendar,
  Layers,
  Search,
  X
} from 'lucide-react';

import { 
  AmbienteTrabalho, 
  RiscoOcupacional, 
  ProgramaSST, 
  GrupoRisco, 
  NivelRisco 
} from '../types/sstTypes';

interface SstRiscosAmbientesProps {
  ambientes: AmbienteTrabalho[];
  riscos: RiscoOcupacional[];
  programas: ProgramaSST[];
  onSaveAmbiente: (ambiente: AmbienteTrabalho) => Promise<void>;
  onSaveRisco: (risco: RiscoOcupacional) => Promise<void>;
  onSavePrograma: (programa: ProgramaSST) => Promise<void>;
}

export const SstRiscosAmbientes: React.FC<SstRiscosAmbientesProps> = ({
  ambientes,
  riscos,
  programas,
  onSaveAmbiente,
  onSaveRisco,
  onSavePrograma
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'riscos' | 'ambientes' | 'programas' | 'matriz'>('riscos');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isNewRiscoModalOpen, setIsNewRiscoModalOpen] = useState(false);
  const [isNewAmbienteModalOpen, setIsNewAmbienteModalOpen] = useState(false);

  // Form State - Risco
  const [newRisco, setNewRisco] = useState<Partial<RiscoOcupacional>>({
    grupoRisco: 'Físico',
    nomeRisco: '',
    descricao: '',
    fonteGeradora: '',
    tipoExposicao: 'Habitual',
    severidade: 3,
    probabilidade: 3,
    nivelRisco: 'Médio',
    medidasControleText: '',
    exigeInsalubridade: false,
    percentualInsalubridade: 20,
    exigePericulosidade: false,
    status: 'Ativo'
  });

  // Form State - Ambiente
  const [newAmbiente, setNewAmbiente] = useState<Partial<AmbienteTrabalho>>({
    nome: '',
    descricao: '',
    descricaoAtividades: '',
    status: 'Ativo',
    vigenciaInicio: new Date().toISOString().split('T')[0]
  });

  const handleCreateRisco = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRisco.nomeRisco) return;

    // Calculate Risco Level
    const sev = newRisco.severidade || 3;
    const prob = newRisco.probabilidade || 3;
    const score = sev * prob;
    let nivel: NivelRisco = 'Baixo';
    if (score >= 16) nivel = 'Crítico';
    else if (score >= 10) nivel = 'Alto';
    else if (score >= 5) nivel = 'Médio';

    const item: RiscoOcupacional = {
      id: `risco-${Date.now()}`,
      companyId: '',
      grupoRisco: (newRisco.grupoRisco as GrupoRisco) || 'Físico',
      nomeRisco: newRisco.nomeRisco || '',
      descricao: newRisco.descricao || '',
      fonteGeradora: newRisco.fonteGeradora || '',
      tipoExposicao: newRisco.tipoExposicao || 'Habitual',
      severidade: sev,
      probabilidade: prob,
      nivelRisco: nivel,
      medidasControleText: newRisco.medidasControleText || 'Uso de EPI e treinamento específico.',
      episObrigatoriosIds: [],
      treinamentosObrigatoriosIds: [],
      examesObrigatoriosIds: [],
      exigeInsalubridade: !!newRisco.exigeInsalubridade,
      percentualInsalubridade: newRisco.percentualInsalubridade,
      exigePericulosidade: !!newRisco.exigePericulosidade,
      vigenciaInicio: new Date().toISOString().split('T')[0],
      status: 'Ativo'
    };

    await onSaveRisco(item);
    setIsNewRiscoModalOpen(false);
  };

  const handleCreateAmbiente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmbiente.nome) return;

    const item: AmbienteTrabalho = {
      id: `amb-${Date.now()}`,
      companyId: '',
      nome: newAmbiente.nome || '',
      descricao: newAmbiente.descricao || '',
      descricaoAtividades: newAmbiente.descricaoAtividades || '',
      ativo: true,
      status: 'Ativo',
      vigenciaInicio: newAmbiente.vigenciaInicio || new Date().toISOString().split('T')[0]
    };

    await onSaveAmbiente(item);
    setIsNewAmbienteModalOpen(false);
  };

  const getGrupoColor = (grupo: GrupoRisco) => {
    switch (grupo) {
      case 'Físico': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Químico': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Biológico': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Ergonômico': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Mecânico / Acidentes': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getNivelColor = (nivel: NivelRisco) => {
    switch (nivel) {
      case 'Crítico': return 'bg-rose-600 text-white font-black';
      case 'Alto': return 'bg-rose-500 text-white font-bold';
      case 'Médio': return 'bg-amber-500 text-white font-bold';
      default: return 'bg-emerald-500 text-white font-bold';
    }
  };

  const filteredRiscos = riscos.filter(r => 
    r.nomeRisco.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.grupoRisco.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('riscos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'riscos'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Riscos Ocupacionais ({riscos.length})
          </button>
          <button
            onClick={() => setActiveSubTab('ambientes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'ambientes'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Ambientes e Setores ({ambientes.length})
          </button>
          <button
            onClick={() => setActiveSubTab('programas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'programas'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Programas (PGR / PCMSO) ({programas.length})
          </button>
          <button
            onClick={() => setActiveSubTab('matriz')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'matriz'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Matriz de Riscos 5x5
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'ambientes' ? (
            <button
              onClick={() => setIsNewAmbienteModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Ambiente</span>
            </button>
          ) : (
            <button
              onClick={() => setIsNewRiscoModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Mapear Novo Risco</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Riscos Ocupacionais */}
      {activeSubTab === 'riscos' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              type="text" 
              placeholder="Buscar risco ou grupo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRiscos.map(risco => (
              <div key={risco.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border ${getGrupoColor(risco.grupoRisco)}`}>
                    {risco.grupoRisco}
                  </span>
                  <span className={`px-2.5 py-0.5 text-[10px] uppercase rounded-md ${getNivelColor(risco.nivelRisco)}`}>
                    Nível {risco.nivelRisco}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{risco.nomeRisco}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{risco.descricao}</p>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p><span className="font-bold text-slate-700">Fonte Geradora:</span> {risco.fonteGeradora}</p>
                  <p><span className="font-bold text-slate-700">Tipo Exposição:</span> {risco.tipoExposicao} ({risco.frequenciaExposicao || '8h/dia'})</p>
                  {risco.valorMedido && (
                    <p><span className="font-bold text-slate-700">Medição:</span> {risco.valorMedido} {risco.unidadeMedida} (Limite: {risco.limiteTolerancia})</p>
                  )}
                </div>

                {(risco.exigeInsalubridade || risco.exigePericulosidade) && (
                  <div className="flex items-center gap-2 pt-1 text-[11px] font-bold">
                    {risco.exigeInsalubridade && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded">Insalubridade ({risco.percentualInsalubridade}%)</span>
                    )}
                    {risco.exigePericulosidade && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded">Periculosidade (30%)</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Ambientes e Setores */}
      {activeSubTab === 'ambientes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ambientes.map(amb => (
            <div key={amb.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-slate-900 text-sm">{amb.nome}</h4>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                  {amb.status}
                </span>
              </div>
              <p className="text-xs text-slate-600">{amb.descricao}</p>
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                <span className="font-bold text-slate-700 block mb-1">Atividades Desempenhadas:</span>
                {amb.descricaoAtividades}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Programas (PGR/PCMSO) */}
      {activeSubTab === 'programas' && (
        <div className="space-y-4">
          {programas.map(prog => (
            <div key={prog.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{prog.titulo}</h4>
                    <p className="text-xs text-slate-500">Versão {prog.versao} • Responsável: {prog.responsavelTecnico} ({prog.registroProfissional})</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs">
                  {prog.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block font-semibold">Elaborado em</span>
                  <span className="font-bold text-slate-800">{prog.dataElaboracao}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Vigência</span>
                  <span className="font-bold text-slate-800">{prog.dataVigenciaInicio} até {prog.dataVigenciaFim}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Próxima Revisão</span>
                  <span className="font-bold text-amber-700">{prog.dataProximaRevisao}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo Risco */}
      {isNewRiscoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Mapear Novo Risco Ocupacional</h3>
              <button onClick={() => setIsNewRiscoModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRisco} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Agente de Risco *</label>
                <input 
                  type="text"
                  required
                  value={newRisco.nomeRisco}
                  onChange={e => setNewRisco({ ...newRisco, nomeRisco: e.target.value })}
                  placeholder="Ex: Vibração de Mãos e Braços"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Grupo do Risco</label>
                  <select 
                    value={newRisco.grupoRisco}
                    onChange={e => setNewRisco({ ...newRisco, grupoRisco: e.target.value as GrupoRisco })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="Físico">Físico</option>
                    <option value="Químico">Químico</option>
                    <option value="Biológico">Biológico</option>
                    <option value="Ergonômico">Ergonômico</option>
                    <option value="Mecânico / Acidentes">Mecânico / Acidentes</option>
                    <option value="Psicossocial">Psicossocial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fonte Geradora</label>
                  <input 
                    type="text"
                    value={newRisco.fonteGeradora}
                    onChange={e => setNewRisco({ ...newRisco, fonteGeradora: e.target.value })}
                    placeholder="Ex: Furadeira pneumática"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Severidade (1 a 5)</label>
                  <input 
                    type="number"
                    min={1}
                    max={5}
                    value={newRisco.severidade}
                    onChange={e => setNewRisco({ ...newRisco, severidade: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Probabilidade (1 a 5)</label>
                  <input 
                    type="number"
                    min={1}
                    max={5}
                    value={newRisco.probabilidade}
                    onChange={e => setNewRisco({ ...newRisco, probabilidade: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewRiscoModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Salvar Risco
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Ambiente */}
      {isNewAmbienteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Cadastrar Novo Ambiente</h3>
              <button onClick={() => setIsNewAmbienteModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAmbiente} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Ambiente *</label>
                <input 
                  type="text"
                  required
                  value={newAmbiente.nome}
                  onChange={e => setNewAmbiente({ ...newAmbiente, nome: e.target.value })}
                  placeholder="Ex: Laboratório de Pesquisa"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição do Local</label>
                <input 
                  type="text"
                  value={newAmbiente.descricao}
                  onChange={e => setNewAmbiente({ ...newAmbiente, descricao: e.target.value })}
                  placeholder="Ex: Sala fechada com exaustão no Bloco B"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição das Atividades</label>
                <textarea 
                  rows={2}
                  value={newAmbiente.descricaoAtividades}
                  onChange={e => setNewAmbiente({ ...newAmbiente, descricaoAtividades: e.target.value })}
                  placeholder="Ex: Análise de amostragem de tintas e reagentes químicos."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewAmbienteModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Salvar Ambiente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
