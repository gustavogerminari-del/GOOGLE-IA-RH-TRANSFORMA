import React, { useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { 
  FileSignature, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Briefcase, 
  Building2, 
  Calendar,
  Send,
  Download,
  Clock,
  ArrowRight,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import { HeadhunterContract, ContractStatus, HeadhunterClient, HeadhunterProposal } from '../types';

interface HeadhunterContratosProps {
  contracts: HeadhunterContract[];
  clients: HeadhunterClient[];
  proposals?: HeadhunterProposal[];
  onAddContract: (contract: HeadhunterContract) => void;
  onUpdateContractStatus?: (id: string, status: ContractStatus) => void;
  onCreateJobFromContract?: (contract: HeadhunterContract) => void;
  onOpenAiModal?: (type: string, data?: any) => void;
}

export const HeadhunterContratos: React.FC<HeadhunterContratosProps> = ({
  contracts,
  clients,
  proposals = [],
  onAddContract,
  onUpdateContractStatus,
  onCreateJobFromContract,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [viewContract, setViewContract] = useState<HeadhunterContract | null>(null);

  // Modal Form State
  const [clienteId, setClienteId] = useState(clients[0]?.id || '');
  const [propostaId, setPropostaId] = useState('');
  const [tituloContrato, setTituloContrato] = useState('Contrato de Prestação de Serviços de Headhunter');
  const [tipo, setTipo] = useState<HeadhunterContract['tipo']>('Contrato Mãe');
  const [escopo, setEscopo] = useState('Serviços continuados de recrutamento executivo e busca de talentos.');
  const [honorarios, setHonorarios] = useState('20% da remuneração anual bruta por vaga fechada');
  const [valorContrato, setValorContrato] = useState(30000);
  const [formaPagamento, setFormaPagamento] = useState('30 dias após emissão da Nota Fiscal');
  const [prazoSlaDias, setPrazoSlaDias] = useState(30);
  const [prazoGarantiaDias, setPrazoGarantiaDias] = useState(90);
  const [dataInicio, setDataInicio] = useState(() => new Date().toISOString().split('T')[0]);
  const [dataVencimento, setDataVencimento] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [vigencia, setVigencia] = useState('12 Meses (Renovação Automática)');
  const [responsavelComercial, setResponsavelComercial] = useState('Carlos Headhunter');
  const [observacoes, setObservacoes] = useState('');

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    const clientObj = clients.find(c => c.id === clienteId);
    const newContract: HeadhunterContract = {
      id: `ctr-${Date.now()}`,
      empresaId: '',
      criadoPor: responsavelComercial,
      criadoEm: new Date().toISOString().split('T')[0],
      status: 'Aguardando assinatura',
      clienteId: clienteId || 'cli-101',
      clienteNome: clientObj?.nomeFantasia || clientObj?.razaoSocial || 'Cliente Exemplo',
      propostaId,
      tituloContrato,
      tipo,
      escopo,
      honorarios,
      valorContrato: Number(valorContrato),
      formaPagamento,
      prazoSlaDias: Number(prazoSlaDias),
      prazoGarantiaDias: Number(prazoGarantiaDias),
      dataInicio,
      dataVencimento,
      vigencia,
      responsavelComercial,
      valorOuPercentual: honorarios,
      assinado: false,
      observacoes
    };

    onAddContract(newContract);
    setShowModal(false);
  };

  const getStatusColor = (st?: ContractStatus | string) => {
    switch (st) {
      case 'Assinado':
      case 'Vigente': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Aguardando assinatura': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Em revisão': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Rascunho': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Encerrado': return 'bg-slate-200 text-slate-600 border-slate-300';
      case 'Cancelado': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Gestão Contratual & Documentos Jurídicos</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerenciamento de contratos mãe, aditivos comerciais, garantias contratadas e liberação direta de vagas no recrutamento.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Contrato / Aditivo</span>
        </button>
      </div>

      {/* CONTRACTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-800">Contratos Corporativos Registrados</span>
          <span className="text-xs font-medium text-slate-500">{contracts.length} documentos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="p-3.5">Título & Tipo</th>
                <th className="p-3.5">Cliente Corporativo</th>
                <th className="p-3.5">Honorários / Condições</th>
                <th className="p-3.5 text-center">Garantia / Vigência</th>
                <th className="p-3.5 text-center">Status / Assinatura</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Nenhum contrato cadastrado. Clique em "Novo Contrato / Aditivo" para adicionar.
                  </td>
                </tr>
              ) : (
                contracts.map(ctr => {
                  const isSigned = ctr.assinado || ctr.status === 'Assinado' || ctr.status === 'Vigente';
                  return (
                    <tr key={ctr.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-900">{ctr.tituloContrato}</div>
                        <div className="text-[11px] text-indigo-600 font-semibold">{ctr.tipo}</div>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{ctr.clienteNome}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-medium text-slate-700">
                        <div>{ctr.honorarios || ctr.valorOuPercentual || 'Condições comerciais acordadas'}</div>
                        {ctr.valorContrato && (
                          <div className="text-[11px] text-slate-400 font-bold">Base: R$ {ctr.valorContrato.toLocaleString('pt-BR')}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="font-semibold text-slate-800">{ctr.dataInicio} até {ctr.dataVencimento}</div>
                        <div className="text-[11px] text-slate-500">{ctr.prazoGarantiaDias || 90} dias de garantia</div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border ${getStatusColor(ctr.status || (ctr.assinado ? 'Vigente' : 'Aguardando assinatura'))}`}>
                          {ctr.status || (ctr.assinado ? 'Assinado / Vigente' : 'Aguardando Assinatura')}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewContract(ctr)}
                            title="Visualizar Detalhes"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isSigned && onCreateJobFromContract && (
                            <button
                              onClick={() => onCreateJobFromContract(ctr)}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Briefcase className="w-3.5 h-3.5" />
                              <span>Criar vaga no Recrutamento</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NOVO CONTRATO */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Novo Contrato ou Aditivo Comercial</h3>
                <p className="text-xs text-slate-500">Cadastre os termos jurídicos e honorários acordados com o cliente.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateContract} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cliente Corporativo *</label>
                  <select
                    value={clienteId}
                    onChange={e => setClienteId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Selecione o cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.nomeFantasia || c.razaoSocial}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tipo de Documento *</label>
                  <select
                    value={tipo}
                    onChange={e => setTipo(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Contrato Mãe">Contrato Mãe</option>
                    <option value="Aditivo">Aditivo Comercial</option>
                    <option value="Tabela Comercial">Tabela Comercial Especial</option>
                    <option value="NDA">NDA (Termo de Confidencialidade)</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Título do Documento *</label>
                <input
                  type="text"
                  value={tituloContrato}
                  onChange={e => setTituloContrato(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Honorários Acordados *</label>
                  <input
                    type="text"
                    value={honorarios}
                    onChange={e => setHonorarios(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Valor Estimado do Contrato (R$)</label>
                  <input
                    type="number"
                    value={valorContrato}
                    onChange={e => setValorContrato(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Prazo SLA (Dias)</label>
                  <input
                    type="number"
                    value={prazoSlaDias}
                    onChange={e => setPrazoSlaDias(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Garantia (Dias)</label>
                  <input
                    type="number"
                    value={prazoGarantiaDias}
                    onChange={e => setPrazoGarantiaDias(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Início da Vigência</label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={e => setDataInicio(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Vencimento da Vigência</label>
                  <input
                    type="date"
                    value={dataVencimento}
                    onChange={e => setDataVencimento(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Responsável Comercial</label>
                  <input
                    type="text"
                    value={responsavelComercial}
                    onChange={e => setResponsavelComercial(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Escopo Resumido do Contrato</label>
                <textarea
                  rows={2}
                  value={escopo}
                  onChange={e => setEscopo(e.target.value)}
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
                  Cadastrar Contrato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZAR CONTRATO */}
      {viewContract && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase">{viewContract.tipo}</span>
                <h3 className="text-lg font-extrabold text-slate-900">{viewContract.tituloContrato}</h3>
                <p className="text-xs text-slate-500 font-medium">Cliente: {viewContract.clienteNome}</p>
              </div>
              <button onClick={() => setViewContract(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-3 text-xs border border-slate-200">
              <div>
                <span className="text-slate-400 block font-bold text-[10px] uppercase">Honorários</span>
                <p className="text-slate-900 font-extrabold text-sm">{viewContract.honorarios || viewContract.valorOuPercentual}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">Prazo de Garantia</span>
                  <p className="text-slate-800 font-bold">{viewContract.prazoGarantiaDias || 90} dias</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold text-[10px] uppercase">SLA Esperado</span>
                  <p className="text-slate-800 font-bold">{viewContract.prazoSlaDias || 30} dias</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-bold text-[10px] uppercase">Escopo</span>
                <p className="text-slate-700 leading-relaxed font-medium">{viewContract.escopo || 'Busca executiva e recrutamento especializado.'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {(viewContract.assinado || viewContract.status === 'Assinado' || viewContract.status === 'Vigente') && onCreateJobFromContract && (
                <button
                  onClick={() => {
                    const ctr = viewContract;
                    setViewContract(null);
                    onCreateJobFromContract(ctr);
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Criar vaga no Recrutamento com este contrato</span>
                </button>
              )}

              <button
                onClick={() => setViewContract(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer ml-auto"
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
