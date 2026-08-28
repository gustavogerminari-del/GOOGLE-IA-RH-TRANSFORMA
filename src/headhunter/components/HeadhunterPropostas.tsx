import React, { useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { 
  FileText, 
  Plus, 
  Eye, 
  Edit3, 
  Copy, 
  Download, 
  Send, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { HeadhunterProposal, ProposalStatus, HeadhunterClient, HeadhunterLead, HeadhunterContract } from '../types';

interface HeadhunterPropostasProps {
  proposals: HeadhunterProposal[];
  clients: HeadhunterClient[];
  opportunities: HeadhunterLead[];
  onAddProposal: (proposal: HeadhunterProposal) => void;
  onUpdateProposalStatus: (id: string, status: ProposalStatus) => void;
  onConvertToContract: (proposal: HeadhunterProposal) => void;
  onOpenAiModal?: (type: string, data?: any) => void;
}

export const HeadhunterPropostas: React.FC<HeadhunterPropostasProps> = ({
  proposals,
  clients,
  opportunities,
  onAddProposal,
  onUpdateProposalStatus,
  onConvertToContract,
}) => {
  const { user } = useAuth();
  const activeCompanyId = user?.companyId || user?.empresaId || user?.tenantId;
  const [showModal, setShowModal] = useState(false);
  const [viewProposal, setViewProposal] = useState<HeadhunterProposal | null>(null);

  // Modal Form State
  const [clienteId, setClienteId] = useState(clients[0]?.id || '');
  const [oportunidadeId, setOportunidadeId] = useState('');
  const [titulo, setTitulo] = useState('Proposta Comercial Executive Search');
  const [servico, setServico] = useState('Executive Search & Hunting');
  const [qtdVagas, setQtdVagas] = useState(1);
  const [escopo, setEscopo] = useState('Mapeamento de mercado, abordagem discreta de executivos, triagem técnica e apresentação de shortlist.');
  const [valor, setValor] = useState(25000);
  const [modeloCobranca, setModeloCobranca] = useState<HeadhunterProposal['modeloCobranca']>('Success Fee');
  const [formaPagamento, setFormaPagamento] = useState('50% no alinhamento / 50% no fechamento da contratação');
  const [prazoEntregaDias, setPrazoEntregaDias] = useState(30);
  const [prazoGarantiaDias, setPrazoGarantiaDias] = useState(90);
  const [validadeData, setValidadeData] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [observacoes, setObservacoes] = useState('');

  const handleCreateProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompanyId) {
      alert("Não foi possível identificar a empresa do usuário.");
      return;
    }

    const clientObj = clients.find(c => c.id === clienteId);
    const newProposal: HeadhunterProposal = {
      id: `prop-${Date.now()}`,
      companyId: activeCompanyId,
      empresaId: activeCompanyId,
      criadoPor: user?.name || 'Carlos Headhunter',
      criadoEm: new Date().toISOString().split('T')[0],
      status: 'Rascunho',
      clienteId: clienteId || 'cli-101',
      clienteNome: clientObj?.nomeFantasia || clientObj?.razaoSocial || 'Cliente Exemplo',
      oportunidadeId,
      titulo,
      servico,
      qtdVagas: Number(qtdVagas),
      escopo,
      valor: Number(valor),
      modeloCobranca,
      formaPagamento,
      prazoEntregaDias: Number(prazoEntregaDias),
      prazoGarantiaDias: Number(prazoGarantiaDias),
      validadeData,
      observacoes,
      versao: 1
    };

    onAddProposal(newProposal);
    setShowModal(false);
  };

  const handleDuplicate = (prop: HeadhunterProposal) => {
    const duplicated: HeadhunterProposal = {
      ...prop,
      id: `prop-${Date.now()}`,
      titulo: `${prop.titulo} (Cópia)`,
      status: 'Rascunho',
      criadoEm: new Date().toISOString().split('T')[0],
      versao: (prop.versao || 1) + 1
    };
    onAddProposal(duplicated);
  };

  const getStatusColor = (st: ProposalStatus) => {
    switch (st) {
      case 'Aprovada': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Enviada': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Visualizada': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Rascunho': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Recusada': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Vencida': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Cancelada': return 'bg-slate-200 text-slate-600 border-slate-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Propostas Comerciais do Headhunter</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Criação, envio, acompanhamento de aceite e conversão direta de propostas em contratos vigentes.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Proposta Comercial</span>
        </button>
      </div>

      {/* PROPOSALS LIST TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-800">Histórico de Propostas Enviadas e Rascunhos</span>
          <span className="text-xs font-medium text-slate-500">{proposals.length} propostas cadastradas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="p-3.5">Título & Serviço</th>
                <th className="p-3.5">Cliente Corporativo</th>
                <th className="p-3.5">Modelo & Honorário</th>
                <th className="p-3.5 text-center">Garantia / SLA</th>
                <th className="p-3.5 text-center">Validade</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {proposals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Nenhuma proposta comercial cadastrada ainda. Clique em "Nova Proposta Comercial" para começar.
                  </td>
                </tr>
              ) : (
                proposals.map(prop => (
                  <tr key={prop.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="font-extrabold text-slate-900">{prop.titulo}</div>
                      <div className="text-[11px] text-slate-500">{prop.servico} ({prop.qtdVagas} {prop.qtdVagas === 1 ? 'vaga' : 'vagas'})</div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{prop.clienteNome}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-extrabold text-slate-900">R$ {prop.valor?.toLocaleString('pt-BR')}</div>
                      <div className="text-[11px] text-indigo-600 font-semibold">{prop.modeloCobranca}</div>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="text-slate-800 font-medium">{prop.prazoGarantiaDias} dias de garantia</div>
                      <div className="text-[11px] text-slate-400">SLA: {prop.prazoEntregaDias} dias</div>
                    </td>
                    <td className="p-3.5 text-center font-medium text-slate-600">
                      {prop.validadeData ? new Date(prop.validadeData).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${getStatusColor(prop.status)}`}>
                        {prop.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewProposal(prop)}
                          title="Visualizar Detalhes / PDF"
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDuplicate(prop)}
                          title="Duplicar Proposta"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {prop.status !== 'Aprovada' && prop.status !== 'Cancelada' && (
                          <button
                            onClick={() => onUpdateProposalStatus(prop.id, 'Aprovada')}
                            title="Aprovar Proposta"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer font-bold text-[11px]"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        {prop.status === 'Aprovada' && !prop.contratoGeradoId && (
                          <button
                            onClick={() => onConvertToContract(prop)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <span>Converter em Contrato</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NOVA PROPOSTA */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Elaborar Nova Proposta Comercial</h3>
                <p className="text-xs text-slate-500">Defina os honorários, modelo de cobrança, escopo e prazos de garantia.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cliente Corporativo *</label>
                  <select
                    value={clienteId}
                    onChange={e => setClienteId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.nomeFantasia || c.razaoSocial}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Oportunidade Vinculada</label>
                  <select
                    value={oportunidadeId}
                    onChange={e => setOportunidadeId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Nenhuma (Proposta Avulsa)</option>
                    {opportunities.map(o => (
                      <option key={o.id} value={o.id}>{o.empresa} - {o.servico || o.cargoOuQtdVagas || 'Oportunidade'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Título da Proposta *</label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tipo de Serviço *</label>
                  <input
                    type="text"
                    value={servico}
                    onChange={e => setServico(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Qtd de Vagas *</label>
                  <input
                    type="number"
                    min="1"
                    value={qtdVagas}
                    onChange={e => setQtdVagas(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Valor do Honorário (R$) *</label>
                  <input
                    type="number"
                    value={valor}
                    onChange={e => setValor(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Modelo de Cobrança *</label>
                  <select
                    value={modeloCobranca}
                    onChange={e => setModeloCobranca(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Success Fee">Success Fee (Taxa de Sucesso)</option>
                    <option value="Honorário Fixo">Honorário Fixo</option>
                    <option value="Percentual do Salário">Percentual do Salário Bruto</option>
                    <option value="Percentual do Anual">Percentual do Pacote Anual</option>
                    <option value="Retainer + Success">Retainer + Success Fee</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Prazo SLA (Dias)</label>
                  <input
                    type="number"
                    value={prazoEntregaDias}
                    onChange={e => setPrazoEntregaDias(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Prazo Garantia (Dias)</label>
                  <input
                    type="number"
                    value={prazoGarantiaDias}
                    onChange={e => setPrazoGarantiaDias(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Validade da Proposta *</label>
                  <input
                    type="date"
                    value={validadeData}
                    onChange={e => setValidadeData(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Forma e Condições de Pagamento</label>
                <input
                  type="text"
                  value={formaPagamento}
                  onChange={e => setFormaPagamento(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Escopo Resumido da Proposta</label>
                <textarea
                  rows={2}
                  value={escopo}
                  onChange={e => setEscopo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Observações / Termos Adicionais</label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  placeholder="Instruções para aprovação ou cláusulas especiais..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Salvar Rascunho de Proposta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZAR PROPOSTA / PREVIEW DE IMPRESSÃO */}
      {viewProposal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md">
                  RH
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">{viewProposal.titulo}</h3>
                  <p className="text-xs text-indigo-600 font-bold">Cliente: {viewProposal.clienteNome}</p>
                </div>
              </div>
              <button onClick={() => setViewProposal(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Valor Total</span>
                  <strong className="text-slate-900 text-sm">R$ {viewProposal.valor?.toLocaleString('pt-BR')}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Modelo</span>
                  <strong className="text-indigo-700">{viewProposal.modeloCobranca}</strong>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Garantia</span>
                  <strong className="text-slate-800">{viewProposal.prazoGarantiaDias} dias</strong>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold ${getStatusColor(viewProposal.status)}`}>
                    {viewProposal.status}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase mb-1">Escopo dos Serviços</span>
                <p className="text-slate-800 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-200">{viewProposal.escopo}</p>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold text-[10px] uppercase mb-1">Condições de Pagamento</span>
                <p className="text-slate-800 font-medium bg-white p-3 rounded-xl border border-slate-200">{viewProposal.formaPagamento}</p>
              </div>

              {viewProposal.observacoes && (
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase mb-1">Observações</span>
                  <p className="text-slate-600 italic bg-white p-3 rounded-xl border border-slate-200">{viewProposal.observacoes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateProposalStatus(viewProposal.id, 'Aprovada')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Marcar como Aprovada</span>
                </button>

                <button
                  onClick={() => onUpdateProposalStatus(viewProposal.id, 'Recusada')}
                  className="px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Marcar como Recusada
                </button>
              </div>

              <button
                onClick={() => setViewProposal(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
