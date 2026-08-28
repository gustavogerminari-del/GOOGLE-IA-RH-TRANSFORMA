import React, { useState } from 'react';
import { 
  Stethoscope, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  FileText, 
  Building2, 
  User, 
  Search, 
  Lock,
  Eye,
  EyeOff,
  Filter,
  Check,
  X
} from 'lucide-react';

import { 
  AgendamentoExame, 
  ResultadoExameASO, 
  ClinicaSST, 
  TipoExameOcupacional, 
  StatusAptidaoAso,
  RestricaoMedica
} from '../types/sstTypes';

interface SstMedicinaExamesProps {
  agendamentos: AgendamentoExame[];
  asos: ResultadoExameASO[];
  onSaveAgendamento: (agendamento: AgendamentoExame) => Promise<void>;
  onSaveAso: (aso: ResultadoExameASO) => Promise<void>;
  userRole?: string;
}

export const SstMedicinaExames: React.FC<SstMedicinaExamesProps> = ({
  agendamentos,
  asos,
  onSaveAgendamento,
  onSaveAso,
  userRole
}) => {
  const [activeTab, setActiveTab] = useState<'asos' | 'agendamentos' | 'restricoes' | 'clinicas'>('asos');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipoExame, setFilterTipoExame] = useState<string>('TODOS');

  // Control modal states
  const [isNewAgendamentoModalOpen, setIsNewAgendamentoModalOpen] = useState(false);
  const [isEmitirAsoModalOpen, setIsEmitirAsoModalOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentoExame | null>(null);

  // Form State - Agendamento
  const [newAgendamento, setNewAgendamento] = useState<Partial<AgendamentoExame>>({
    colaboradorNome: '',
    cpf: '',
    cargo: '',
    departamento: '',
    tipoExame: 'Periódico',
    clinicaNome: 'Clinimed Ocupacional Centenário',
    dataAgendamento: new Date().toISOString().split('T')[0],
    horario: '08:00',
    status: 'Agendado',
    observacoesInstrucoes: 'Apresentar documento de identidade com foto.'
  });

  // Form State - ASO Emission
  const [newAso, setNewAso] = useState<Partial<ResultadoExameASO>>({
    statusAptidao: 'Apto',
    tipoExame: 'Periódico',
    dataExame: new Date().toISOString().split('T')[0],
    dataEmissaoAso: new Date().toISOString().split('T')[0],
    dataProximoExame: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    medicoExaminador: 'Dr. Fernando Mello',
    crmExaminador: '112233',
    crmUf: 'SP',
    clinicaNome: 'Clinimed Ocupacional Centenário',
    resumoRestricaoGestor: '',
    observacoesMedicasRestritas: ''
  });

  const isDoctorOrHr = userRole !== 'Gestor' && userRole !== 'Líder';

  const handleCreateAgendamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgendamento.colaboradorNome || !newAgendamento.dataAgendamento) return;

    const agend: AgendamentoExame = {
      id: `agend-${Date.now()}`,
      companyId: '',
      colaboradorId: `colab-${Date.now()}`,
      colaboradorNome: newAgendamento.colaboradorNome || '',
      cpf: newAgendamento.cpf || '',
      cargo: newAgendamento.cargo || 'Operador',
      departamento: newAgendamento.departamento || 'Geral',
      tipoExame: (newAgendamento.tipoExame as TipoExameOcupacional) || 'Periódico',
      clinicaNome: newAgendamento.clinicaNome || 'Clínica Conveniada',
      dataAgendamento: newAgendamento.dataAgendamento || '',
      horario: newAgendamento.horario || '08:00',
      status: 'Agendado',
      observacoesInstrucoes: newAgendamento.observacoesInstrucoes
    };

    await onSaveAgendamento(agend);
    setIsNewAgendamentoModalOpen(false);
  };

  const handleEmitirAsoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgendamento && !newAso.colaboradorNome) return;

    const asoRecord: ResultadoExameASO = {
      id: `aso-${Date.now()}`,
      companyId: '',
      agendamentoId: selectedAgendamento?.id,
      colaboradorId: selectedAgendamento?.colaboradorId || `colab-${Date.now()}`,
      colaboradorNome: selectedAgendamento?.colaboradorNome || newAso.colaboradorNome || '',
      cpf: selectedAgendamento?.cpf || newAso.cpf,
      cargo: selectedAgendamento?.cargo || newAso.cargo || '',
      departamento: selectedAgendamento?.departamento || newAso.departamento || '',
      tipoExame: selectedAgendamento?.tipoExame || (newAso.tipoExame as TipoExameOcupacional) || 'Periódico',
      dataExame: newAso.dataExame || new Date().toISOString().split('T')[0],
      dataEmissaoAso: newAso.dataEmissaoAso || new Date().toISOString().split('T')[0],
      resultadoStatus: 'Concluído',
      statusAptidao: (newAso.statusAptidao as StatusAptidaoAso) || 'Apto',
      resumoRestricaoGestor: newAso.resumoRestricaoGestor,
      observacoesMedicasRestritas: newAso.observacoesMedicasRestritas,
      dataProximoExame: newAso.dataProximoExame || '',
      medicoExaminador: newAso.medicoExaminador || 'Dr. Médico Lançador',
      crmExaminador: newAso.crmExaminador || '00000',
      crmUf: newAso.crmUf || 'SP',
      clinicaNome: selectedAgendamento?.clinicaNome || newAso.clinicaNome || '',
      versao: 1,
      status: 'Vigente'
    };

    await onSaveAso(asoRecord);

    // If originated from agendamento, update agendamento status to Concluído
    if (selectedAgendamento) {
      await onSaveAgendamento({ ...selectedAgendamento, status: 'Concluído' });
    }

    setIsEmitirAsoModalOpen(false);
    setSelectedAgendamento(null);
  };

  const filteredAsos = asos.filter(a => {
    const matchesSearch = a.colaboradorNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.cargo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipoExame === 'TODOS' || a.tipoExame === filterTipoExame;
    return matchesSearch && matchesTipo;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        {/* Navigation Sub-Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('asos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'asos'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ASOs e Histórico ({asos.length})
          </button>
          <button
            onClick={() => setActiveTab('agendamentos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'agendamentos'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Agendamentos ({agendamentos.length})
          </button>
          <button
            onClick={() => setActiveTab('restricoes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'restricoes'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Restrições Médicas ({asos.filter(a => a.statusAptidao === 'Apto com Restrições').length})
          </button>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewAgendamentoModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* Notice on Medical Confidentiality (LGPD) */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Proteção de Sigilo Médico e LGPD (NR-07):</span>
          <p className="text-amber-800/90 mt-0.5">
            Informações diagnósticas e CIDs são estritamente restritas à equipe médica de SST. Gestores e líderes têm acesso exclusivamente ao status operacional de aptidão (<span className="font-semibold">Apto, Apto com Restrições ou Inapto</span>) e ao resumo adaptativo de funções.
          </p>
        </div>
      </div>

      {/* Main Content Areas */}
      {activeTab === 'asos' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input 
                type="text" 
                placeholder="Buscar por colaborador ou cargo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={filterTipoExame}
              onChange={e => setFilterTipoExame(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="TODOS">Todos os Tipos de Exame</option>
              <option value="Admissional">Admissional</option>
              <option value="Periódico">Periódico</option>
              <option value="Mudança de Risco">Mudança de Risco</option>
              <option value="Retorno ao Trabalho">Retorno ao Trabalho</option>
              <option value="Demissional">Demissional</option>
            </select>
          </div>

          {/* Table of ASOs */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold">
                    <th className="p-3.5">Colaborador</th>
                    <th className="p-3.5">Tipo de Exame</th>
                    <th className="p-3.5">Data Emissão</th>
                    <th className="p-3.5">Status Aptidão</th>
                    <th className="p-3.5">Próximo Exame</th>
                    <th className="p-3.5">Médico / CRM</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAsos.length > 0 ? (
                    filteredAsos.map(aso => (
                      <tr key={aso.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5">
                          <p className="font-bold text-slate-900">{aso.colaboradorNome}</p>
                          <p className="text-[11px] text-slate-500">{aso.cargo} • {aso.departamento}</p>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700">
                          {aso.tipoExame}
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {aso.dataEmissaoAso}
                        </td>
                        <td className="p-3.5">
                          {aso.statusAptidao === 'Apto' && (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[11px] flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Apto
                            </span>
                          )}
                          {aso.statusAptidao === 'Apto com Restrições' && (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-bold text-[11px] flex items-center gap-1 w-fit">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              Apto c/ Restrições
                            </span>
                          )}
                          {aso.statusAptidao === 'Inapto' && (
                            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] flex items-center gap-1 w-fit">
                              <X className="w-3.5 h-3.5 text-rose-600" />
                              Inapto
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-600 font-semibold">
                          {aso.dataProximoExame}
                        </td>
                        <td className="p-3.5 text-slate-600">
                          <p className="font-medium text-slate-800">{aso.medicoExaminador}</p>
                          <p className="text-[11px] text-slate-400">CRM/{aso.crmUf} {aso.crmExaminador}</p>
                        </td>
                        <td className="p-3.5 text-right">
                          <button 
                            onClick={() => alert(`Visualizando ASO em PDF de ${aso.colaboradorNome}`)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            PDF ASO
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                        Nenhum ASO encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Agendamentos */}
      {activeTab === 'agendamentos' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Exames Agendados na Rede Credenciada</h3>
            <span className="text-xs text-slate-500">{agendamentos.length} agendamentos registrados</span>
          </div>

          <div className="divide-y divide-slate-100">
            {agendamentos.map(ag => (
              <div key={ag.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{ag.colaboradorNome}</span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold">
                      {ag.tipoExame}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {ag.cargo} • {ag.departamento} • Clínica: <span className="font-semibold text-slate-700">{ag.clinicaNome}</span>
                  </p>
                  <p className="text-xs text-slate-600 flex items-center gap-1.5 pt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{ag.dataAgendamento} às {ag.horario}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {ag.status !== 'Concluído' ? (
                    <button
                      onClick={() => {
                        setSelectedAgendamento(ag);
                        setNewAso(prev => ({
                          ...prev,
                          colaboradorNome: ag.colaboradorNome,
                          cargo: ag.cargo,
                          departamento: ag.departamento,
                          tipoExame: ag.tipoExame,
                          clinicaNome: ag.clinicaNome
                        }));
                        setIsEmitirAsoModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Lançar ASO</span>
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Concluído
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Restrições Médicas Adaptativas */}
      {activeTab === 'restricoes' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Quadro de Restrições Médicas Operacionais (Visão Gestão)</h3>
            <p className="text-xs text-slate-500">
              Resumo adaptativo sem diagnóstico nem CID, garantindo sigilo médico enquanto orienta a liderança sobre adequação das tarefas.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {asos.filter(a => a.statusAptidao === 'Apto com Restrições').map(aso => (
                <div key={aso.id} className="p-4 bg-amber-50/40 border border-amber-200/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{aso.colaboradorNome}</span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">
                      Ativa até {aso.dataProximoExame}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{aso.cargo} • {aso.departamento}</p>
                  <div className="p-3 bg-white rounded-lg border border-amber-100 text-xs font-medium text-amber-950">
                    <p className="font-bold text-amber-900 mb-1">Orientações para o Posto de Trabalho:</p>
                    {aso.resumoRestricaoGestor || 'Apto com restrições operacionais sob recomendação médica. Consultar departamento de SST.'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Novo Agendamento */}
      {isNewAgendamentoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Agendar Exame Ocupacional</h3>
              <button 
                onClick={() => setIsNewAgendamentoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAgendamento} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Colaborador *</label>
                <input 
                  type="text" 
                  required
                  value={newAgendamento.colaboradorNome}
                  onChange={e => setNewAgendamento({ ...newAgendamento, colaboradorNome: e.target.value })}
                  placeholder="Ex: João Silva"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cargo</label>
                  <input 
                    type="text" 
                    value={newAgendamento.cargo}
                    onChange={e => setNewAgendamento({ ...newAgendamento, cargo: e.target.value })}
                    placeholder="Ex: Operador"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Exame *</label>
                  <select 
                    value={newAgendamento.tipoExame}
                    onChange={e => setNewAgendamento({ ...newAgendamento, tipoExame: e.target.value as TipoExameOcupacional })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="Admissional">Admissional</option>
                    <option value="Periódico">Periódico</option>
                    <option value="Mudança de Risco">Mudança de Risco</option>
                    <option value="Retorno ao Trabalho">Retorno ao Trabalho</option>
                    <option value="Demissional">Demissional</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data *</label>
                  <input 
                    type="date" 
                    required
                    value={newAgendamento.dataAgendamento}
                    onChange={e => setNewAgendamento({ ...newAgendamento, dataAgendamento: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Horário</label>
                  <input 
                    type="time" 
                    value={newAgendamento.horario}
                    onChange={e => setNewAgendamento({ ...newAgendamento, horario: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clínica Conveniada</label>
                <input 
                  type="text" 
                  value={newAgendamento.clinicaNome}
                  onChange={e => setNewAgendamento({ ...newAgendamento, clinicaNome: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewAgendamentoModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lançamento de ASO */}
      {isEmitirAsoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Emitir e Registrar ASO</h3>
              <button 
                onClick={() => setIsEmitirAsoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEmitirAsoSubmit} className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl text-xs">
                <p className="font-bold text-slate-900">{selectedAgendamento?.colaboradorNome || newAso.colaboradorNome}</p>
                <p className="text-slate-500">{selectedAgendamento?.cargo} • Exame {selectedAgendamento?.tipoExame || newAso.tipoExame}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status de Aptidão (NR-07) *</label>
                <select 
                  value={newAso.statusAptidao}
                  onChange={e => setNewAso({ ...newAso, statusAptidao: e.target.value as StatusAptidaoAso })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                >
                  <option value="Apto">APTO</option>
                  <option value="Apto com Restrições">APTO COM RESTRIÇÕES</option>
                  <option value="Inapto">INAPTO</option>
                </select>
              </div>

              {newAso.statusAptidao === 'Apto com Restrições' && (
                <div>
                  <label className="block text-xs font-bold text-amber-800 mb-1">Resumo da Restrição para a Gestão (Sem CID/Sem Diagnóstico) *</label>
                  <textarea 
                    rows={2}
                    value={newAso.resumoRestricaoGestor}
                    onChange={e => setNewAso({ ...newAso, resumoRestricaoGestor: e.target.value })}
                    placeholder="Ex: Restrição temporária de levantar peso acima de 10kg por 30 dias."
                    className="w-full px-3 py-2 border border-amber-200 rounded-xl text-xs text-amber-950 bg-amber-50/30"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data Realização *</label>
                  <input 
                    type="date"
                    required
                    value={newAso.dataExame}
                    onChange={e => setNewAso({ ...newAso, dataExame: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data Próximo Exame *</label>
                  <input 
                    type="date"
                    required
                    value={newAso.dataProximoExame}
                    onChange={e => setNewAso({ ...newAso, dataProximoExame: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Médico Examinador</label>
                  <input 
                    type="text"
                    value={newAso.medicoExaminador}
                    onChange={e => setNewAso({ ...newAso, medicoExaminador: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CRM / UF</label>
                  <input 
                    type="text"
                    value={newAso.crmExaminador}
                    onChange={e => setNewAso({ ...newAso, crmExaminador: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEmitirAsoModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Concluir e Emitir ASO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
