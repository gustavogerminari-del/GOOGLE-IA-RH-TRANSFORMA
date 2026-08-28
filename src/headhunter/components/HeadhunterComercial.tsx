import React, { useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { 
  TrendingUp, 
  Plus, 
  FileText, 
  FileSignature, 
  Building2, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  User,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { 
  HeadhunterLead, 
  LeadStage, 
  HeadhunterClient, 
  HeadhunterProposal, 
  HeadhunterContract,
  ProposalStatus,
  ContractStatus
} from '../types';
import { HeadhunterPropostas } from './HeadhunterPropostas';
import { HeadhunterContratos } from './HeadhunterContratos';

interface HeadhunterComercialProps {
  leads: HeadhunterLead[];
  clients: HeadhunterClient[];
  proposals: HeadhunterProposal[];
  contracts: HeadhunterContract[];
  onAddLead: (lead: HeadhunterLead) => void;
  onUpdateLeadStage: (id: string, stage: LeadStage) => void;
  onAddProposal: (proposal: HeadhunterProposal) => void;
  onUpdateProposalStatus: (id: string, status: ProposalStatus) => void;
  onAddContract: (contract: HeadhunterContract) => void;
  onUpdateContractStatus: (id: string, status: ContractStatus) => void;
  onCreateJobFromContract: (contract: HeadhunterContract) => void;
  onOpenAiModal?: (type: string, data?: any) => void;
}

const OPPORTUNITY_STAGES: LeadStage[] = [
  'Novo lead',
  'Contato realizado',
  'Diagnóstico',
  'Proposta enviada',
  'Negociação',
  'Aguardando assinatura',
  'Ganho',
  'Perdido'
];

export const HeadhunterComercial: React.FC<HeadhunterComercialProps> = ({
  leads,
  clients,
  proposals,
  contracts,
  onAddLead,
  onUpdateLeadStage,
  onAddProposal,
  onUpdateProposalStatus,
  onAddContract,
  onUpdateContractStatus,
  onCreateJobFromContract,
}) => {
  const { user } = useAuth();
  const activeCompanyId = user?.companyId || user?.empresaId || user?.tenantId;
  const [activeSubTab, setActiveSubTab] = useState<'oportunidades' | 'propostas' | 'contratos'>('oportunidades');
  
  // New Opportunity Modal State
  const [showModal, setShowModal] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [contato, setContato] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [servico, setServico] = useState('Executive Search');
  const [cargoOuQtdVagas, setCargoOuQtdVagas] = useState('Diretor / VP (1 vaga)');
  const [qtdVagas, setQtdVagas] = useState(1);
  const [origem, setOrigem] = useState('Outbound / LinkedIn');
  const [consultor, setConsultor] = useState('Carlos Headhunter');
  const [valorPrevisto, setValorPrevisto] = useState(30000);
  const [probabilidade, setProbabilidade] = useState(60);
  const [proximoContato, setProximoContato] = useState(() => new Date().toISOString().split('T')[0]);
  const [observacoes, setObservacoes] = useState('');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // Calculate Weighted Pipeline
  const totalWeightedPipeline = leads
    .filter(l => l.etapa !== 'Perdido')
    .reduce((acc, l) => acc + (l.valorPrevisto * (l.probabilidadePercent / 100)), 0);

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompanyId) {
      alert("Não foi possível identificar a empresa do usuário.");
      return;
    }

    const selectedClient = clients.find(c => c.id === clienteId);
    const newLead: HeadhunterLead = {
      id: `lead-${Date.now()}`,
      companyId: activeCompanyId,
      empresaId: activeCompanyId,
      criadoPor: user?.name || consultor,
      criadoEm: new Date().toISOString().split('T')[0],
      status: 'Em Andamento',
      clienteId,
      empresa: selectedClient ? selectedClient.nomeFantasia || selectedClient.razaoSocial : empresa,
      contato,
      email,
      telefone,
      origem,
      consultor,
      servico,
      cargoOuQtdVagas,
      qtdVagas: Number(qtdVagas),
      etapa: 'Novo lead',
      valorPrevisto: Number(valorPrevisto),
      probabilidadePercent: Number(probabilidade),
      proximoContato,
      historico: [{ data: new Date().toISOString().split('T')[0], anotacao: 'Oportunidade criada no módulo Comercial.', autor: consultor }],
      observacoes
    };

    onAddLead(newLead);
    setShowModal(false);
  };

  const handleMarkAsWon = (lead: HeadhunterLead) => {
    // Check if there is an approved proposal for this opportunity or client
    const approvedProp = proposals.find(p => p.oportunidadeId === lead.id && p.status === 'Aprovada') ||
                         proposals.find(p => p.clienteId === lead.clienteId && p.status === 'Aprovada');
    
    if (!approvedProp) {
      setAlertMsg(`A oportunidade "${lead.empresa}" não pode ser marcada como Ganha sem uma proposta comercial aprovada. Crie e aprove uma proposta primeiro.`);
      return;
    }

    onUpdateLeadStage(lead.id, 'Ganho');
    setAlertMsg(null);
  };

  const handleConvertToContract = (proposal: HeadhunterProposal) => {
    if (!activeCompanyId) {
      alert("Não foi possível identificar a empresa do usuário.");
      return;
    }

    const newContract: HeadhunterContract = {
      id: `ctr-${Date.now()}`,
      companyId: activeCompanyId,
      empresaId: activeCompanyId,
      criadoPor: user?.name || 'Carlos Headhunter',
      criadoEm: new Date().toISOString().split('T')[0],
      status: 'Aguardando assinatura',
      clienteId: proposal.clienteId,
      clienteNome: proposal.clienteNome,
      propostaId: proposal.id,
      oportunidadeId: proposal.oportunidadeId,
      tituloContrato: `Contrato ${proposal.titulo}`,
      tipo: 'Contrato Mãe',
      escopo: proposal.escopo,
      honorarios: `R$ ${proposal.valor?.toLocaleString('pt-BR')} (${proposal.modeloCobranca})`,
      valorContrato: proposal.valor,
      formaPagamento: proposal.formaPagamento,
      prazoSlaDias: proposal.prazoEntregaDias,
      prazoGarantiaDias: proposal.prazoGarantiaDias,
      dataInicio: new Date().toISOString().split('T')[0],
      dataVencimento: proposal.validadeData,
      assinado: false
    };

    onAddContract(newContract);
    setActiveSubTab('contratos');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Subtabs */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Módulo Comercial Headhunter</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pipeline de Oportunidades, Elaboração de Propostas e Formalização Contratual.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-900">
              Pipeline Ponderado: <span className="text-indigo-600 font-black">R$ {totalWeightedPipeline.toLocaleString('pt-BR')}</span>
            </div>

            {activeSubTab === 'oportunidades' && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Oportunidade</span>
              </button>
            )}
          </div>
        </div>

        {/* Subtabs Selector */}
        <div className="flex items-center gap-2 border-b border-slate-100 pt-2">
          <button
            onClick={() => setActiveSubTab('oportunidades')}
            className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'oportunidades' 
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Oportunidades ({leads.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('propostas')}
            className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'propostas' 
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Propostas ({proposals.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('contratos')}
            className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'contratos' 
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSignature className="w-4 h-4" />
            <span>Contratos ({contracts.length})</span>
          </button>
        </div>
      </div>

      {alertMsg && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{alertMsg}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="text-amber-700 hover:text-amber-900 font-extrabold cursor-pointer">✕</button>
        </div>
      )}

      {/* SUBTAB CONTENT */}
      {activeSubTab === 'oportunidades' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {OPPORTUNITY_STAGES.map(stage => {
            const stageLeads = leads.filter(l => l.etapa === stage || (stage === 'Novo lead' && (!l.etapa || l.etapa === 'Lead')));
            return (
              <div key={stage} className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-extrabold text-slate-800 tracking-tight">{stage}</span>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-slate-200/70 text-slate-700 rounded-full">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] scrollbar-thin pr-1">
                  {stageLeads.map(lead => (
                    <div key={lead.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <strong className="text-xs font-extrabold text-slate-900 leading-tight block">
                          {lead.empresa}
                        </strong>
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md shrink-0">
                          {lead.probabilidadePercent}%
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-1 font-medium">
                        <div className="flex items-center gap-1 text-slate-700">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{lead.contato}</span>
                        </div>
                        {lead.cargoOuQtdVagas && (
                          <div className="text-slate-600 font-semibold">{lead.cargoOuQtdVagas}</div>
                        )}
                        <div className="flex items-center gap-1 font-bold text-slate-900 pt-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          <span>R$ {lead.valorPrevisto?.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>

                      {/* Stage transition controls */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                        {lead.etapa !== 'Ganho' && lead.etapa !== 'Perdido' && (
                          <button
                            onClick={() => handleMarkAsWon(lead)}
                            className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Ganho</span>
                          </button>
                        )}

                        {lead.etapa !== 'Perdido' && (
                          <button
                            onClick={() => onUpdateLeadStage(lead.id, 'Perdido')}
                            className="px-2 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                          >
                            Perdido
                          </button>
                        )}

                        {/* Move forward in stage */}
                        {lead.etapa !== 'Ganho' && lead.etapa !== 'Perdido' && (
                          <select
                            value={lead.etapa}
                            onChange={e => onUpdateLeadStage(lead.id, e.target.value as LeadStage)}
                            className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg px-1.5 py-0.5 outline-none cursor-pointer ml-auto"
                          >
                            {OPPORTUNITY_STAGES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeSubTab === 'propostas' && (
        <HeadhunterPropostas
          proposals={proposals}
          clients={clients}
          opportunities={leads}
          onAddProposal={onAddProposal}
          onUpdateProposalStatus={onUpdateProposalStatus}
          onConvertToContract={handleConvertToContract}
        />
      )}

      {activeSubTab === 'contratos' && (
        <HeadhunterContratos
          contracts={contracts}
          clients={clients}
          proposals={proposals}
          onAddContract={onAddContract}
          onUpdateContractStatus={onUpdateContractStatus}
          onCreateJobFromContract={onCreateJobFromContract}
        />
      )}

      {/* MODAL: NOVA OPORTUNIDADE */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Cadastrar Nova Oportunidade Comercial</h3>
                <p className="text-xs text-slate-500">Registre o prospect, potencial faturamento e probabilidade de fechamento.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Selecionar Cliente ou Digitar Prospect *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={clienteId}
                    onChange={e => {
                      setClienteId(e.target.value);
                      const c = clients.find(cl => cl.id === e.target.value);
                      if (c) {
                        setEmpresa(c.nomeFantasia || c.razaoSocial);
                        setContato(c.responsavel || '');
                        setEmail(c.email || '');
                        setTelefone(c.telefone || '');
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">-- Cliente Existente --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.nomeFantasia || c.razaoSocial}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Ou Nome da Empresa Prospect"
                    value={empresa}
                    onChange={e => setEmpresa(e.target.value)}
                    required={!clienteId}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Contato Principal *</label>
                  <input
                    type="text"
                    value={contato}
                    onChange={e => setContato(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">E-mail *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cargo / Posição Desejada *</label>
                  <input
                    type="text"
                    value={cargoOuQtdVagas}
                    onChange={e => setCargoOuQtdVagas(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Valor Estimado (R$) *</label>
                  <input
                    type="number"
                    value={valorPrevisto}
                    onChange={e => setValorPrevisto(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Probabilidade (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={probabilidade}
                    onChange={e => setProbabilidade(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Próxima Atividade</label>
                  <input
                    type="date"
                    value={proximoContato}
                    onChange={e => setProximoContato(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Observações Comercial</label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
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
                  Salvar Oportunidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
