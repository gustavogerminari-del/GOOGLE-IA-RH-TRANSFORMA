import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Plus, 
  Calendar, 
  User, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { HeadhunterLead, LeadStage } from '../types';

interface HeadhunterCRMProps {
  leads: HeadhunterLead[];
  onAddLead: (lead: HeadhunterLead) => void;
  onUpdateLeadStage: (id: string, stage: LeadStage) => void;
  onOpenAiModal: (type: string, data?: any) => void;
}

const STAGES: LeadStage[] = ['Novo lead', 'Contato realizado', 'Diagnóstico', 'Proposta enviada', 'Negociação', 'Aguardando assinatura', 'Ganho', 'Perdido'];

export const HeadhunterCRM: React.FC<HeadhunterCRMProps> = ({
  leads,
  onAddLead,
  onUpdateLeadStage,
  onOpenAiModal
}) => {
  const [showModal, setShowModal] = useState(false);
  const [empresa, setEmpresa] = useState('');
  const [contato, setContato] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [origem, setOrigem] = useState('Outbound / LinkedIn');
  const [consultor, setConsultor] = useState('Carlos Headhunter');
  const [valorPrevisto, setValorPrevisto] = useState(25000);
  const [probabilidade, setProbabilidade] = useState(50);
  const [proximoContato, setProximoContato] = useState('2026-03-30');
  const [observacoes, setObservacoes] = useState('');

  const totalPipelineValue = leads
    .filter(l => l.etapa !== 'Perdido')
    .reduce((acc, l) => acc + (l.valorPrevisto * (l.probabilidadePercent / 100)), 0);

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    const newLead: HeadhunterLead = {
      id: `lead-${Date.now()}`,
      empresaId: '',
      criadoPor: consultor,
      criadoEm: new Date().toISOString().split('T')[0],
      status: 'Em Andamento',
      empresa,
      contato,
      email,
      telefone,
      origem,
      consultor,
      etapa: 'Novo lead',
      valorPrevisto,
      probabilidadePercent: probabilidade,
      proximoContato,
      historico: [{ data: new Date().toISOString().split('T')[0], anotacao: 'Oportunidade cadastrada no CRM.', autor: consultor }],
      observacoes
    };

    onAddLead(newLead);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">CRM Comercial de Executive Search</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Funil de prospeção de novos clientes corporativos, cálculo de pipeline ponderado e envio de propostas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-900">
            Pipeline Ponderado: <span className="text-indigo-600 font-black">R$ {totalPipelineValue.toLocaleString('pt-BR')}</span>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Oportunidade</span>
          </button>
        </div>
      </div>

      {/* CRM Funnel View (Columns per Stage) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.etapa === stage);
          const stageSum = stageLeads.reduce((acc, l) => acc + l.valorPrevisto, 0);

          return (
            <div key={stage} className="bg-slate-50 rounded-2xl border border-slate-200 p-3 flex flex-col justify-between min-w-[200px]">
              <div>
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-3">
                  <span className="text-xs font-black text-slate-800">{stage}</span>
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-extrabold text-[10px] flex items-center justify-center">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {stageLeads.map(lead => (
                    <div key={lead.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{lead.empresa}</h4>
                        <p className="text-[11px] text-slate-500 font-medium">{lead.contato}</p>
                      </div>

                      <div className="text-xs font-extrabold text-indigo-600">
                        R$ {lead.valorPrevisto.toLocaleString('pt-BR')}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">({lead.probabilidadePercent}%)</span>
                      </div>

                      <div className="text-[10px] text-slate-500 font-medium border-t border-slate-100 pt-1.5 flex items-center justify-between">
                        <span>Próx: {lead.proximoContato}</span>
                        <span>{lead.consultor.split(' ')[0]}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                        <button
                          onClick={() => onOpenAiModal('propostaComercial', { company: lead.empresa, contact: lead.contato, value: lead.valorPrevisto })}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[10px] rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Proposta IA</span>
                        </button>

                        <select
                          value={lead.etapa}
                          onChange={e => onUpdateLeadStage(lead.id, e.target.value as LeadStage)}
                          className="text-[10px] font-bold bg-slate-100 border border-slate-200 rounded-lg p-1 text-slate-700 cursor-pointer"
                        >
                          {STAGES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-200/80 text-center">
                <span className="text-[10px] font-bold text-slate-500">Total: R$ {(stageSum / 1000).toFixed(0)}k</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Nova Oportunidade Comercial</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome da Empresa</label>
                <input required type="text" value={empresa} onChange={e => setEmpresa(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pessoa de Contato</label>
                  <input required type="text" value={contato} onChange={e => setContato(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                  <input required type="text" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valor Previsto (R$)</label>
                  <input required type="number" value={valorPrevisto} onChange={e => setValorPrevisto(Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Probabilidade (%)</label>
                  <input required type="number" value={probabilidade} onChange={e => setProbabilidade(Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer hover:bg-indigo-700">Adicionar Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
