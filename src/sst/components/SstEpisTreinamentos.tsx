import React, { useState } from 'react';
import { 
  HardHat, 
  GraduationCap, 
  Plus, 
  CheckCircle2, 
  Clock, 
  FileCheck, 
  ShieldCheck, 
  Search, 
  Calendar, 
  UserCheck, 
  Package, 
  AlertTriangle,
  X
} from 'lucide-react';

import { 
  EpiCatalogo, 
  EntregaEpi, 
  TreinamentoCatalogo, 
  CategoriaEPI 
} from '../types/sstTypes';

interface SstEpisTreinamentosProps {
  epis: EpiCatalogo[];
  entregas: EntregaEpi[];
  treinamentos: TreinamentoCatalogo[];
  onSaveEpi: (epi: EpiCatalogo) => Promise<void>;
  onSaveEntrega: (entrega: EntregaEpi) => Promise<void>;
  onSaveTreinamento: (treinamento: TreinamentoCatalogo) => Promise<void>;
}

export const SstEpisTreinamentos: React.FC<SstEpisTreinamentosProps> = ({
  epis,
  entregas,
  treinamentos,
  onSaveEpi,
  onSaveEntrega,
  onSaveTreinamento
}) => {
  const [activeTab, setActiveTab] = useState<'entregas' | 'catalogo-epi' | 'treinamentos'>('entregas');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isNewEntregaModalOpen, setIsNewEntregaModalOpen] = useState(false);
  const [isNewEpiModalOpen, setIsNewEpiModalOpen] = useState(false);

  // Form State - Entrega EPI
  const [newEntrega, setNewEntrega] = useState<Partial<EntregaEpi>>({
    colaboradorNome: '',
    cargo: '',
    departamento: '',
    nomeEpi: epis[0]?.nomeEpi || 'Protetor Auricular Abafador',
    numeroCa: epis[0]?.numeroCa || '31234',
    quantidade: 1,
    tamanho: 'Único',
    motivoEntrega: 'Admissão',
    estadoEpi: 'Novo',
    dataEntrega: new Date().toISOString().split('T')[0],
    dataPrevisaoTroca: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]
  });

  const handleCreateEntrega = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntrega.colaboradorNome || !newEntrega.nomeEpi) return;

    const entrega: EntregaEpi = {
      id: `ent-${Date.now()}`,
      companyId: '',
      colaboradorId: `colab-${Date.now()}`,
      colaboradorNome: newEntrega.colaboradorNome || '',
      cargo: newEntrega.cargo || 'Operador',
      departamento: newEntrega.departamento || 'Produção',
      epiId: `epi-${Date.now()}`,
      nomeEpi: newEntrega.nomeEpi || '',
      numeroCa: newEntrega.numeroCa || '00000',
      quantidade: newEntrega.quantidade || 1,
      tamanho: newEntrega.tamanho || 'M',
      dataEntrega: newEntrega.dataEntrega || new Date().toISOString().split('T')[0],
      dataPrevisaoTroca: newEntrega.dataPrevisaoTroca || '',
      motivoEntrega: newEntrega.motivoEntrega || 'Admissão',
      estadoEpi: newEntrega.estadoEpi || 'Novo',
      statusAssinatura: 'Assinado Digitalmente',
      assinaturaHash: `hash_${Math.random().toString(36).substring(2, 10)}`,
      dataAssinatura: new Date().toISOString().replace('T', ' ').substring(0, 16),
      devolvido: false
    };

    await onSaveEntrega(entrega);
    setIsNewEntregaModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('entregas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'entregas'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Ficha Digital de Entregas ({entregas.length})
          </button>
          <button
            onClick={() => setActiveTab('catalogo-epi')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'catalogo-epi'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Catálogo & Estoque de EPIs ({epis.length})
          </button>
          <button
            onClick={() => setActiveTab('treinamentos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'treinamentos'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Treinamentos NRs ({treinamentos.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewEntregaModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Entrega de EPI</span>
          </button>
        </div>
      </div>

      {/* Tab Ficha Digital de Entregas */}
      {activeTab === 'entregas' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Fichas de EPI Comprovadas com Assinatura Eletrônica</h3>
            <span className="text-xs text-slate-500">NR-06 e-Social S-2240 Compliant</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold">
                  <th className="p-3.5">Colaborador</th>
                  <th className="p-3.5">Equipamento (EPI)</th>
                  <th className="p-3.5">CA</th>
                  <th className="p-3.5">Data Entrega</th>
                  <th className="p-3.5">Próxima Troca</th>
                  <th className="p-3.5">Assinatura Digital</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entregas.map(ent => (
                  <tr key={ent.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900">{ent.colaboradorNome}</p>
                      <p className="text-[11px] text-slate-500">{ent.cargo} • {ent.departamento}</p>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-800">{ent.nomeEpi}</p>
                      <p className="text-[11px] text-slate-400">Tam: {ent.tamanho} • Qtd: {ent.quantidade}</p>
                    </td>
                    <td className="p-3.5 font-bold text-slate-700">
                      CA {ent.numeroCa}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {ent.dataEntrega}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">
                      {ent.dataPrevisaoTroca}
                    </td>
                    <td className="p-3.5">
                      {ent.statusAssinatura === 'Assinado Digitalmente' ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[11px] flex items-center gap-1 w-fit">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Assinado ({ent.dataAssinatura?.substring(0, 10)})
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-bold text-[11px] flex items-center gap-1 w-fit">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button 
                        onClick={() => alert(`Exibindo Termo de Entrega de EPI assinado por ${ent.colaboradorNome}`)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Ver Ficha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Catálogo de EPIs */}
      {activeTab === 'catalogo-epi' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {epis.map(epi => (
            <div key={epi.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-600" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{epi.nomeEpi}</h4>
                    <p className="text-xs text-slate-500">CA {epi.numeroCa} • Validade CA: {epi.validadeCa}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-bold text-xs rounded-lg border border-amber-200">
                  {epi.estoqueAtual} {epi.unidadeMedida}s
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl">
                <p><span className="font-bold text-slate-700">Fabricante / Modelo:</span> {epi.fabricante} ({epi.modelo})</p>
                <p><span className="font-bold text-slate-700">Troca Periódica:</span> a cada {epi.periodoTrocaDias} dias</p>
                <p><span className="font-bold text-slate-700">Tamanhos:</span> {epi.tamanhosDisponiveis.join(', ')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Treinamentos NRs */}
      {activeTab === 'treinamentos' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {treinamentos.map(tr => (
              <div key={tr.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{tr.nomeTreinamento}</h4>
                      <p className="text-xs text-slate-500">Carga Horária: {tr.duracaoHoras}h • Validade: {tr.validadeMeses} meses</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200">
                    NR Obrigatória
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">
                  {tr.conteudoProgramatico}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Nova Entrega */}
      {isNewEntregaModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Registrar Entrega de EPI</h3>
              <button onClick={() => setIsNewEntregaModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEntrega} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Colaborador *</label>
                <input 
                  type="text"
                  required
                  value={newEntrega.colaboradorNome}
                  onChange={e => setNewEntrega({ ...newEntrega, colaboradorNome: e.target.value })}
                  placeholder="Ex: João Pedro da Silva"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">EPI a Entregar</label>
                  <select
                    value={newEntrega.nomeEpi}
                    onChange={e => {
                      const sel = epis.find(ep => ep.nomeEpi === e.target.value);
                      setNewEntrega({
                        ...newEntrega,
                        nomeEpi: e.target.value,
                        numeroCa: sel?.numeroCa || '31234'
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    {epis.map(ep => (
                      <option key={ep.id} value={ep.nomeEpi}>{ep.nomeEpi} (CA {ep.numeroCa})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Motivo da Entrega</label>
                  <select
                    value={newEntrega.motivoEntrega}
                    onChange={e => setNewEntrega({ ...newEntrega, motivoEntrega: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  >
                    <option value="Admissão">Admissão</option>
                    <option value="Substituição / Desgaste">Substituição / Desgaste</option>
                    <option value="Perda">Perda</option>
                    <option value="Danificado">Danificado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data da Entrega</label>
                  <input 
                    type="date"
                    required
                    value={newEntrega.dataEntrega}
                    onChange={e => setNewEntrega({ ...newEntrega, dataEntrega: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Previsão Próxima Troca</label>
                  <input 
                    type="date"
                    required
                    value={newEntrega.dataPrevisaoTroca}
                    onChange={e => setNewEntrega({ ...newEntrega, dataPrevisaoTroca: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-medium">
                Ao salvar, será gerado o termo de entrega digital com hash de validação para assinatura no Portal do Colaborador.
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewEntregaModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Confirmar Entrega
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
