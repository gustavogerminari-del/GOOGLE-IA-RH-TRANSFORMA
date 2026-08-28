import React, { useMemo, useState } from 'react';
import { Briefcase, Calendar, CheckCircle2, EyeOff, MessageSquare, ShieldCheck, Users } from 'lucide-react';
import { HeadhunterClient, HeadhunterCandidate, HeadhunterInterview } from '../types';

// RH_HEADHUNTER_COMPETITIVE_V1
interface Props {
  clients: HeadhunterClient[];
  jobs: any[];
  candidates: HeadhunterCandidate[];
  interviews: HeadhunterInterview[];
  onUpdateCandidate: (updated: HeadhunterCandidate) => Promise<void> | void;
  onOpenAiModal?: (type: string, data?: any) => void;
}

type Decision = NonNullable<HeadhunterCandidate['decisaoCliente']>;
const decisions: Decision[] = ['Aprovado para Entrevista', 'Finalista', 'Aprovado para Contratação', 'Solicitar mais informações', 'Solicitar novo candidato', 'Reprovado'];
const isPresented = (c: HeadhunterCandidate) => c.apresentadoAoCliente === true || c.etapaProcesso === 'Apresentado ao cliente' || c.etapaPipeline === 'Entrevista Cliente';

export const HeadhunterPortalCliente: React.FC<Props> = ({ clients = [], jobs = [], candidates = [], interviews = [], onUpdateCandidate }) => {
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [jobId, setJobId] = useState('TODAS');
  const [selected, setSelected] = useState<HeadhunterCandidate | null>(null);
  const [decision, setDecision] = useState<Decision>('Aprovado para Entrevista');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const client = clients.find(c => c.id === clientId);
  const clientJobs = jobs.filter(j => j.clienteId === clientId || (!!client?.nomeFantasia && j.clienteNome === client.nomeFantasia));
  const clientCandidates = candidates.filter(c => isPresented(c) && (jobId === 'TODAS' ? clientJobs.some(j => j.id === c.vagaId) : c.vagaId === jobId));
  const clientInterviews = interviews.filter(i => clientJobs.some(j => j.id === i.vagaId));
  const pending = clientCandidates.filter(c => c.decisaoClientePendente).length;

  const selectedJob = useMemo(() => clientJobs.find(j => j.id === jobId), [clientJobs, jobId]);

  const sendFeedback = async () => {
    if (!selected) return;
    if (!comment.trim()) { setMessage('Informe um comentário para registrar a decisão.'); return; }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const next: HeadhunterCandidate = {
        ...selected,
        decisaoCliente: decision,
        decisaoClienteComentario: comment.trim(),
        decisaoClienteEm: now,
        decisaoClientePendente: true,
        feedbackClienteHistorico: [{ decisao: decision, comentario: comment.trim(), data: now, clienteNome: client?.nomeFantasia || client?.razaoSocial }, ...(selected.feedbackClienteHistorico || [])],
        historico: [{ data: now.slice(0, 10), evento: `Feedback do cliente: ${decision}. Aguardando tratamento da consultoria.` }, ...(selected.historico || [])],
        updatedAt: now,
      };
      await onUpdateCandidate(next);
      setSelected(next);
      setComment('');
      setMessage('Feedback registrado. A consultoria recebeu a decisão para tratamento.');
    } finally {
      setSaving(false);
    }
  };

  if (!clients.length) return <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Nenhum cliente cadastrado.</div>;

  return <div className="space-y-6">
    <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-300"><ShieldCheck className="h-4 w-4" /> Portal do Cliente</div>
          <h2 className="mt-1 text-2xl font-black">{client?.nomeFantasia || client?.razaoSocial || 'Cliente'}</h2>
          <p className="mt-1 text-xs text-slate-300">Somente candidatos formalmente apresentados ficam visíveis. Dados de contato permanecem protegidos até liberação da consultoria.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
          <span className="pl-2 text-xs font-bold text-slate-300">Prévia administrativa:</span>
          <select value={clientId} onChange={e => { setClientId(e.target.value); setJobId('TODAS'); setSelected(null); }} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white">
            {clients.map(c => <option key={c.id} value={c.id}>{c.nomeFantasia || c.razaoSocial}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
        <div><span className="text-[10px] font-black uppercase text-slate-400">Vagas</span><div className="font-black">{clientJobs.length}</div></div>
        <div><span className="text-[10px] font-black uppercase text-slate-400">Apresentados</span><div className="font-black text-emerald-300">{clientCandidates.length}</div></div>
        <div><span className="text-[10px] font-black uppercase text-slate-400">Retornos pendentes</span><div className="font-black text-amber-300">{pending}</div></div>
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <Briefcase className="h-4 w-4 text-slate-400" />
      <select value={jobId} onChange={e => { setJobId(e.target.value); setSelected(null); }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold">
        <option value="TODAS">Todas as vagas</option>
        {clientJobs.map(j => <option key={j.id} value={j.id}>{j.titulo || j.cargo || 'Vaga'}</option>)}
      </select>
      {selectedJob && <span className="text-xs text-slate-500">{selectedJob.status || ''}</span>}
    </div>

    {message && <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs font-bold text-indigo-800">{message}</div>}

    <div className="grid gap-4 lg:grid-cols-3">
      {clientCandidates.length === 0 ? <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-10 text-center text-xs text-slate-500">Nenhum candidato foi formalmente apresentado para esta seleção.</div> : clientCandidates.map(c => <button key={c.id} onClick={() => setSelected(c)} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div><div className="text-sm font-black text-slate-900">{c.nome}</div><div className="text-xs text-slate-500">{c.cargoAtual || c.cargoPretendido || 'Cargo não informado'}</div></div>
          {Number(c.compatibilidadePercent || 0) > 0 && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">{c.compatibilidadePercent}% Match</span>}
        </div>
        <div className="mt-4 space-y-1 text-xs text-slate-600">
          <div><strong>Local:</strong> {c.cidade || 'Não informado'}</div>
          <div><strong>Pretensão:</strong> {Number(c.pretensaoSalarial || 0) > 0 ? `R$ ${Number(c.pretensaoSalarial).toLocaleString('pt-BR')}` : 'Não informada'}</div>
          <div className="flex items-center gap-1"><EyeOff className="h-3.5 w-3.5" /><strong>Contato:</strong> {c.contatoLiberadoCliente ? [c.email, c.telefone].filter(Boolean).join(' • ') || 'Não informado' : 'Protegido pela consultoria'}</div>
        </div>
        {c.decisaoCliente && <div className="mt-4 rounded-lg bg-slate-50 p-2 text-[11px] font-bold text-slate-700">Último retorno: {c.decisaoCliente}</div>}
      </button>)}
    </div>

    {selected && <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-indigo-600" /><h3 className="text-sm font-black text-slate-900">{selected.nome}</h3></div>
          <div className="mt-4 space-y-3 text-xs text-slate-700">
            <div><strong>Parecer técnico</strong><p className="mt-1 whitespace-pre-wrap text-slate-600">{selected.parecerTecnico || 'Parecer ainda não registrado.'}</p></div>
            <div><strong>Análise IA</strong><p className="mt-1 whitespace-pre-wrap text-slate-600">{selected.triagemIaParecer || 'Análise ainda não registrada.'}</p></div>
            <div><strong>Contato</strong><p className="mt-1 text-slate-600">{selected.contatoLiberadoCliente ? [selected.email, selected.telefone].filter(Boolean).join(' • ') || 'Não informado' : 'Protegido pela consultoria'}</p></div>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-indigo-600" /><h4 className="text-sm font-black text-slate-900">Registrar decisão</h4></div>
          <select value={decision} onChange={e => setDecision(e.target.value as Decision)} className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold">{decisions.map(value => <option key={value}>{value}</option>)}</select>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4} placeholder="Comentário obrigatório para manter o histórico da decisão" className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none" />
          <button disabled={saving} onClick={sendFeedback} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-4 py-2 text-xs font-black text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />{saving ? 'Salvando...' : 'Enviar feedback'}</button>
        </div>
      </div>
    </div>}

    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-indigo-600" /><h3 className="text-sm font-black text-slate-900">Entrevistas desta conta</h3></div>
      <div className="mt-3 text-xs text-slate-600">{clientInterviews.length ? `${clientInterviews.length} entrevista(s) vinculada(s) às vagas do cliente.` : 'Nenhuma entrevista agendada para as vagas selecionadas.'}</div>
    </div>
  </div>;
};
