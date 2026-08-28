import React, { useState } from 'react';
import { 
  AlertTriangle, 
  FileText, 
  Plus, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  ShieldAlert, 
  Send, 
  Search, 
  User, 
  Calendar,
  X
} from 'lucide-react';

import { 
  AcidenteTrabalho, 
  ComunicadoCat, 
  TipoAcidente, 
  TipoCAT, 
  StatusCAT 
} from '../types/sstTypes';

interface SstAcidentesCatProps {
  acidentes: AcidenteTrabalho[];
  cats: ComunicadoCat[];
  onSaveAcidente: (acidente: AcidenteTrabalho) => Promise<void>;
  onSaveCat: (cat: ComunicadoCat) => Promise<void>;
}

export const SstAcidentesCat: React.FC<SstAcidentesCatProps> = ({
  acidentes,
  cats,
  onSaveAcidente,
  onSaveCat
}) => {
  const [activeTab, setActiveTab] = useState<'acidentes' | 'cats'>('acidentes');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isNewAcidenteModalOpen, setIsNewAcidenteModalOpen] = useState(false);
  const [isNewCatModalOpen, setIsNewCatModalOpen] = useState(false);
  const [selectedAcidenteForCat, setSelectedAcidenteForCat] = useState<AcidenteTrabalho | null>(null);

  // Form State - Acidente
  const [newAcidente, setNewAcidente] = useState<Partial<AcidenteTrabalho>>({
    colaboradorNome: '',
    cargo: '',
    departamento: '',
    tipoAcidente: 'Típico',
    dataHoraOcorrencia: new Date().toISOString().replace('T', ' ').substring(0, 16),
    localExato: '',
    atividadeNoMomento: '',
    descricaoResumida: '',
    acaoImediata: '',
    teveAfastamento: false,
    diasAfastamentoProvaveis: 0,
    teveObito: false,
    statusInvestigacao: 'Registrado'
  });

  // Form State - CAT
  const [newCat, setNewCat] = useState<Partial<ComunicadoCat>>({
    tipoCat: 'Inicial',
    dataEmissao: new Date().toISOString().split('T')[0],
    statusCat: 'Enviada / Protocolada'
  });

  const handleCreateAcidente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAcidente.colaboradorNome || !newAcidente.descricaoResumida) return;

    const item: AcidenteTrabalho = {
      id: `acid-${Date.now()}`,
      companyId: '',
      colaboradorId: `colab-${Date.now()}`,
      colaboradorNome: newAcidente.colaboradorNome || '',
      cargo: newAcidente.cargo || 'Operador',
      departamento: newAcidente.departamento || 'Produção',
      tipoAcidente: (newAcidente.tipoAcidente as TipoAcidente) || 'Típico',
      dataHoraOcorrencia: newAcidente.dataHoraOcorrencia || '',
      localExato: newAcidente.localExato || 'Setor Operacional',
      atividadeNoMomento: newAcidente.atividadeNoMomento || '',
      descricaoResumida: newAcidente.descricaoResumida || '',
      acaoImediata: newAcidente.acaoImediata || 'Atendimento de primeiros socorros prestado.',
      teveAfastamento: !!newAcidente.teveAfastamento,
      diasAfastamentoProvaveis: newAcidente.diasAfastamentoProvaveis || 0,
      teveObito: false,
      statusInvestigacao: 'Aguardando CAT'
    };

    await onSaveAcidente(item);
    setIsNewAcidenteModalOpen(false);
  };

  const handleCreateCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAcidenteForCat) return;

    const catItem: ComunicadoCat = {
      id: `cat-${Date.now()}`,
      companyId: '',
      acidenteId: selectedAcidenteForCat.id,
      colaboradorId: selectedAcidenteForCat.colaboradorId,
      colaboradorNome: selectedAcidenteForCat.colaboradorNome,
      cpf: '000.000.000-00',
      tipoCat: (newCat.tipoCat as TipoCAT) || 'Inicial',
      dataEmissao: newCat.dataEmissao || new Date().toISOString().split('T')[0],
      numeroProtocoloeSocial: `2025-${Math.floor(100000 + Math.random() * 900000)}`,
      statusCat: 'Enviada / Protocolada',
      versao: 1
    };

    await onSaveCat(catItem);

    // Update acidente status to Concluído
    await onSaveAcidente({
      ...selectedAcidenteForCat,
      statusInvestigacao: 'Concluído'
    });

    setIsNewCatModalOpen(false);
    setSelectedAcidenteForCat(null);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('acidentes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'acidentes'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Ocorrências & Investigações ({acidentes.length})
          </button>
          <button
            onClick={() => setActiveTab('cats')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'cats'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Comunicações CAT e-Social S-2210 ({cats.length})
          </button>
        </div>

        <button
          onClick={() => setIsNewAcidenteModalOpen(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Acidente</span>
        </button>
      </div>

      {/* Tab Acidentes & Ocorrências */}
      {activeTab === 'acidentes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {acidentes.map(acid => (
              <div key={acid.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{acid.colaboradorNome}</h4>
                      <p className="text-xs text-slate-500">{acid.cargo} • {acid.departamento}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold text-[11px] rounded-lg border border-rose-200">
                    {acid.tipoAcidente}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 space-y-1">
                  <p><span className="font-bold text-slate-800">Ocorrência:</span> {acid.dataHoraOcorrencia} em {acid.localExato}</p>
                  <p><span className="font-bold text-slate-800">Atividade:</span> {acid.atividadeNoMomento}</p>
                  <p><span className="font-bold text-slate-800">Descrição:</span> {acid.descricaoResumida}</p>
                </div>

                {acid.causaRaizCincoPorques && (
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-950">
                    <span className="font-bold text-indigo-900 block mb-0.5">Análise de Causa Raiz (5 Porquês):</span>
                    {acid.causaRaizCincoPorques}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">
                    Afastamento: <strong className="text-slate-800">{acid.teveAfastamento ? `${acid.diasAfastamentoProvaveis} dias` : 'Sem afastamento'}</strong>
                  </span>
                  
                  {acid.statusInvestigacao === 'Aguardando CAT' && (
                    <button
                      onClick={() => {
                        setSelectedAcidenteForCat(acid);
                        setIsNewCatModalOpen(true);
                      }}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                    >
                      <Send className="w-3 h-3" />
                      <span>Emitir CAT S-2210</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab CAT e-Social S-2210 */}
      {activeTab === 'cats' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Histórico de CATs Enviadas ao e-Social</h3>
            <span className="text-xs text-slate-500">Evento S-2210 Integrado</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold">
                  <th className="p-3.5">Colaborador</th>
                  <th className="p-3.5">Tipo CAT</th>
                  <th className="p-3.5">Data Emissão</th>
                  <th className="p-3.5">Protocolo e-Social</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cats.map(cat => (
                  <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">
                      {cat.colaboradorNome}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">
                      {cat.tipoCat}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {cat.dataEmissao}
                    </td>
                    <td className="p-3.5 font-mono text-slate-800 font-bold">
                      {cat.numeroProtocoloeSocial || 'Processando...'}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[11px] flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {cat.statusCat}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button 
                        onClick={() => alert(`Imprimindo Comprovante de Envio da CAT para ${cat.colaboradorNome}`)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Comprovante
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Registrar Acidente */}
      {isNewAcidenteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Registrar Acidente de Trabalho</h3>
              <button onClick={() => setIsNewAcidenteModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAcidente} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Colaborador Acidentado *</label>
                <input 
                  type="text"
                  required
                  value={newAcidente.colaboradorNome}
                  onChange={e => setNewAcidente({ ...newAcidente, colaboradorNome: e.target.value })}
                  placeholder="Ex: Antônio Ferreira"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Acidente</label>
                  <select
                    value={newAcidente.tipoAcidente}
                    onChange={e => setNewAcidente({ ...newAcidente, tipoAcidente: e.target.value as TipoAcidente })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="Típico">Típico</option>
                    <option value="Trajeto">Trajeto</option>
                    <option value="Doença Ocupacional">Doença Ocupacional</option>
                    <option value="Incidente / Quase Acidente">Incidente / Quase Acidente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data e Hora *</label>
                  <input 
                    type="text"
                    required
                    value={newAcidente.dataHoraOcorrencia}
                    onChange={e => setNewAcidente({ ...newAcidente, dataHoraOcorrencia: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Local Exato da Ocorrência</label>
                <input 
                  type="text"
                  value={newAcidente.localExato}
                  onChange={e => setNewAcidente({ ...newAcidente, localExato: e.target.value })}
                  placeholder="Ex: Setor de Estampagem - Prensa 03"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição do Ocorrido *</label>
                <textarea 
                  rows={2}
                  required
                  value={newAcidente.descricaoResumida}
                  onChange={e => setNewAcidente({ ...newAcidente, descricaoResumida: e.target.value })}
                  placeholder="Descreva o acidente com clareza..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={newAcidente.teveAfastamento}
                    onChange={e => setNewAcidente({ ...newAcidente, teveAfastamento: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span>Houve Afastamento?</span>
                </label>

                {newAcidente.teveAfastamento && (
                  <input 
                    type="number"
                    placeholder="Dias previstos"
                    value={newAcidente.diasAfastamentoProvaveis}
                    onChange={e => setNewAcidente({ ...newAcidente, diasAfastamentoProvaveis: parseInt(e.target.value) })}
                    className="w-32 px-3 py-1.5 border border-slate-200 rounded-xl text-xs"
                  />
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewAcidenteModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  Registrar Acidente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Emitir CAT */}
      {isNewCatModalOpen && selectedAcidenteForCat && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Emitir CAT e-Social S-2210</h3>
              <button onClick={() => setIsNewCatModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCat} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <p className="font-bold text-slate-900">{selectedAcidenteForCat.colaboradorNome}</p>
                <p className="text-slate-500">{selectedAcidenteForCat.descricaoResumida}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de CAT</label>
                <select
                  value={newCat.tipoCat}
                  onChange={e => setNewCat({ ...newCat, tipoCat: e.target.value as TipoCAT })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-slate-800"
                >
                  <option value="Inicial">Inicial</option>
                  <option value="Reabertura">Reabertura</option>
                  <option value="Comunicação de Óbito">Comunicação de Óbito</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl">
                Esta transmissão vai gerar automaticamente o número de recibo no ambiente e-Social e vincular ao cadastro de afastamentos do DP.
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewCatModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Transmitir CAT ao e-Social
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
