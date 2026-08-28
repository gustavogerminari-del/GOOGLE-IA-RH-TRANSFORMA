import React, { useMemo, useState } from 'react';
import { Briefcase, Building2, CheckCircle2, Eye, EyeOff, FileDown, ShieldCheck, TimerReset, AlertTriangle } from 'lucide-react';
import { HeadhunterClient } from '../types';

// RH_HEADHUNTER_COMPETITIVE_V1
interface Props {
  clients: HeadhunterClient[];
  jobs: any[];
  candidates: any[];
  onUpdateCandidate: (candidate: any) => Promise<void> | void;
}

const daysBetween = (start?: string, end = new Date()) => {
  if (!start) return 0;
  const value = new Date(start);
  if (Number.isNaN(value.getTime())) return 0;
  return Math.max(0, Math.floor((end.getTime() - value.getTime()) / 86400000));
};

const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const presented = (candidate: any) => candidate?.apresentadoAoCliente === true
  || candidate?.etapaProcesso === 'Apresentado ao cliente'
  || candidate?.etapaPipeline === 'Entrevista Cliente';

export const HeadhunterApresentacoes: React.FC<Props> = ({ clients = [], jobs = [], candidates = [], onUpdateCandidate }) => {
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [jobId, setJobId] = useState('TODAS');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const client = clients.find(item => item.id === clientId);
  const clientJobs = jobs.filter(job => job.clienteId === clientId || (!!client?.nomeFantasia && job.clienteNome === client.nomeFantasia));
  const visibleCandidates = candidates.filter(candidate => {
    const linked = jobId === 'TODAS'
      ? clientJobs.some(job => job.id === candidate.vagaId)
      : candidate.vagaId === jobId;
    return linked && candidate.etapaPipeline !== 'Reprovado' && candidate.etapaProcesso !== 'Reprovado';
  });
  const presentedCandidates = visibleCandidates.filter(presented);

  const slaRows = useMemo(() => clientJobs.map(job => {
    const age = daysBetween(job.dataAbertura || job.dataCriacao);
    const limit = Number(job.slaDias || 0);
    const jobPresented = candidates.filter(c => c.vagaId === job.id && presented(c));
    const firstDate = jobPresented.map(c => c.dataApresentacaoCliente).filter(Boolean).sort()[0];
    const firstShortlistDays = firstDate ? daysBetween(job.dataAbertura || job.dataCriacao, new Date(firstDate)) : null;
    const closed = ['Fechada', 'Cancelada', 'Arquivada'].includes(String(job.status || ''));
    const status = closed ? 'Concluída' : !limit ? 'Sem SLA' : age > limit ? 'SLA vencido' : age >= Math.max(1, limit - 2) ? 'Atenção' : 'No prazo';
    return { job, age, limit, firstShortlistDays, status, presented: jobPresented.length };
  }), [clientJobs, candidates]);

  const pendingDecisions = presentedCandidates.filter(c => c.decisaoClientePendente === true).length;
  const lateJobs = slaRows.filter(row => row.status === 'SLA vencido').length;

  const update = async (candidate: any, patch: Record<string, unknown>, event: string) => {
    const now = new Date().toISOString();
    const next = {
      ...candidate,
      ...patch,
      historico: [{ data: now.slice(0, 10), evento: event }, ...(candidate.historico || [])],
      updatedAt: now,
    };
    await onUpdateCandidate(next);
    setMessage(event);
    window.setTimeout(() => setMessage(null), 3500);
  };

  const handlePresent = (candidate: any) => update(candidate, {
    apresentadoAoCliente: true,
    dataApresentacaoCliente: candidate.dataApresentacaoCliente || new Date().toISOString(),
    contatoLiberadoCliente: candidate.contatoLiberadoCliente === true,
    etapaProcesso: 'Apresentado ao cliente',
  }, `Candidato ${candidate.nome} apresentado formalmente ao cliente ${client?.nomeFantasia || client?.razaoSocial || ''}.`);

  const toggleContact = (candidate: any) => update(candidate, {
    contatoLiberadoCliente: candidate.contatoLiberadoCliente !== true,
  }, candidate.contatoLiberadoCliente === true
    ? `Contato de ${candidate.nome} voltou a ficar protegido no Portal do Cliente.`
    : `Contato de ${candidate.nome} liberado para o cliente.`);

  const applyClientDecision = async (candidate: any) => {
    const decision = String(candidate.decisaoCliente || '');
    const patch: Record<string, unknown> = { decisaoClientePendente: false };
    if (decision === 'Aprovado para Entrevista' || decision === 'Finalista') {
      patch.etapaProcesso = 'Entrevista com cliente';
      patch.etapaPipeline = 'Entrevista Cliente';
    } else if (decision === 'Reprovado') {
      patch.etapaProcesso = 'Reprovado';
      patch.etapaPipeline = 'Reprovado';
    } else if (decision === 'Aprovado para Contratação') {
      patch.etapaProcesso = 'Proposta';
      patch.etapaPipeline = 'Proposta';
    }
    await update(candidate, patch, `Decisão do cliente tratada pela consultoria: ${decision || 'sem decisão'}.`);
  };

  const toggleSelected = (id: string) => setSelectedIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);

  const generateShortlist = () => {
    const chosen = presentedCandidates.filter(c => selectedIds.includes(c.id));
    if (!chosen.length) {
      setMessage('Selecione ao menos um candidato já apresentado para gerar a shortlist.');
      return;
    }
    const popup = window.open('', '_blank', 'noopener,noreferrer');
    if (!popup) {
      setMessage('O navegador bloqueou a janela da shortlist. Libere pop-ups para gerar o PDF.');
      return;
    }
    const clientName = client?.nomeFantasia || client?.razaoSocial || 'Cliente';
    const selectedJob = clientJobs.find(j => j.id === jobId);
    const rows = chosen.map(c => {
      const contact = c.contatoLiberadoCliente === true
        ? `<div><strong>Contato:</strong> ${escapeHtml(c.email || '')}${c.email && c.telefone ? ' • ' : ''}${escapeHtml(c.telefone || '')}</div>`
        : '<div><strong>Contato:</strong> protegido pela consultoria</div>';
      return `<section class="candidate"><h2>${escapeHtml(c.nome)}</h2><p>${escapeHtml(c.cargoAtual || c.cargoPretendido || '')}</p><div><strong>Localização:</strong> ${escapeHtml(c.cidade || 'Não informada')}</div><div><strong>Pretensão:</strong> ${Number(c.pretensaoSalarial || 0) > 0 ? 'R$ ' + Number(c.pretensaoSalarial).toLocaleString('pt-BR') : 'Não informada'}</div><div><strong>Match:</strong> ${Number(c.compatibilidadePercent || 0) > 0 ? escapeHtml(c.compatibilidadePercent) + '%' : 'Não calculado'}</div>${contact}<div class="summary"><strong>Parecer:</strong> ${escapeHtml(c.parecerTecnico || c.triagemIaParecer || 'Parecer ainda não registrado.')}</div></section>`;
    }).join('');
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Shortlist - ${escapeHtml(clientName)}</title><style>body{font-family:Arial,sans-serif;color:#172033;margin:36px}header{border-bottom:2px solid #253b80;padding-bottom:18px;margin-bottom:24px}h1{margin:0;font-size:24px}.muted{color:#667085}.candidate{border:1px solid #d9dfeb;border-radius:12px;padding:18px;margin:14px 0;break-inside:avoid}.candidate h2{margin:0 0 4px;font-size:18px}.candidate p{margin:0 0 14px;color:#475467}.candidate div{margin:6px 0}.summary{margin-top:12px!important;padding-top:10px;border-top:1px solid #eaecf0}@media print{button{display:none}}</style></head><body><header><h1>Shortlist de Candidatos</h1><div class="muted">${escapeHtml(clientName)}${selectedJob ? ' • ' + escapeHtml(selectedJob.titulo || selectedJob.cargo || '') : ''}</div><div class="muted">Gerado em ${new Date().toLocaleString('pt-BR')}</div></header>${rows}<button onclick="window.print()">Imprimir / Salvar PDF</button></body></html>`);
    popup.document.close();
  };

  if (!clients.length) return <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Cadastre um cliente para iniciar as apresentações.</div>;

  return <div className="space-y-6">
    <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
      <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-indigo-700" /><div><h2 className="font-black text-slate-900">Apresentações & SLA</h2><p className="mt-1 text-xs text-slate-600">Shortlist, privacidade do candidato, retorno do cliente e prazos em um único fluxo. Contato fica protegido por padrão.</p></div></div>
    </div>

    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-xs font-bold text-slate-500">Apresentados</div><div className="mt-1 text-2xl font-black text-slate-900">{presentedCandidates.length}</div></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-xs font-bold text-slate-500">Retornos aguardando ação</div><div className="mt-1 text-2xl font-black text-amber-700">{pendingDecisions}</div></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-xs font-bold text-slate-500">Vagas com SLA vencido</div><div className="mt-1 text-2xl font-black text-rose-700">{lateJobs}</div></div>
    </div>

    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <Building2 className="h-4 w-4 text-slate-400" />
      <select value={clientId} onChange={e => { setClientId(e.target.value); setJobId('TODAS'); setSelectedIds([]); }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold">
        {clients.map(item => <option key={item.id} value={item.id}>{item.nomeFantasia || item.razaoSocial}</option>)}
      </select>
      <Briefcase className="h-4 w-4 text-slate-400" />
      <select value={jobId} onChange={e => { setJobId(e.target.value); setSelectedIds([]); }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold">
        <option value="TODAS">Todas as vagas</option>
        {clientJobs.map(job => <option key={job.id} value={job.id}>{job.titulo || job.cargo || 'Vaga sem título'}</option>)}
      </select>
      <button onClick={generateShortlist} className="ml-auto inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-4 py-2 text-xs font-black text-white hover:bg-indigo-800"><FileDown className="h-4 w-4" /> Gerar shortlist / PDF</button>
    </div>

    {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">{message}</div>}

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4"><h3 className="text-sm font-black text-slate-900">Candidatos da seleção</h3></div>
      <div className="divide-y divide-slate-100">
        {visibleCandidates.length === 0 ? <div className="p-8 text-center text-xs text-slate-500">Nenhum candidato vinculado às vagas selecionadas.</div> : visibleCandidates.map(candidate => {
          const isPresented = presented(candidate);
          return <div key={candidate.id} className="grid gap-3 p-4 lg:grid-cols-[32px_1.5fr_1fr_1fr_auto] lg:items-center">
            <input type="checkbox" disabled={!isPresented} checked={selectedIds.includes(candidate.id)} onChange={() => toggleSelected(candidate.id)} aria-label="Selecionar para shortlist" />
            <div><div className="text-sm font-black text-slate-900">{candidate.nome}</div><div className="text-xs text-slate-500">{candidate.cargoAtual || candidate.cargoPretendido || 'Cargo não informado'}</div></div>
            <div className="text-xs"><span className="font-bold text-slate-500">Apresentação:</span><div className={isPresented ? 'font-bold text-emerald-700' : 'font-bold text-slate-500'}>{isPresented ? (candidate.dataApresentacaoCliente ? new Date(candidate.dataApresentacaoCliente).toLocaleDateString('pt-BR') : 'Apresentado') : 'Não apresentado'}</div></div>
            <div className="text-xs"><span className="font-bold text-slate-500">Cliente:</span><div className="font-bold text-slate-800">{candidate.decisaoCliente || 'Aguardando retorno'}</div>{candidate.decisaoClientePendente && <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">Ação da consultoria</span>}</div>
            <div className="flex flex-wrap justify-end gap-2">
              {!isPresented && <button onClick={() => handlePresent(candidate)} className="rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-black text-white">Apresentar</button>}
              {isPresented && <button onClick={() => toggleContact(candidate)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-black text-slate-700">{candidate.contatoLiberadoCliente ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{candidate.contatoLiberadoCliente ? 'Proteger contato' : 'Liberar contato'}</button>}
              {candidate.decisaoClientePendente && <button onClick={() => applyClientDecision(candidate)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-black text-white"><CheckCircle2 className="h-3.5 w-3.5" /> Tratar retorno</button>}
            </div>
          </div>;
        })}
      </div>
    </div>

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4"><TimerReset className="h-4 w-4 text-indigo-600" /><h3 className="text-sm font-black text-slate-900">SLA por vaga</h3></div>
      <div className="overflow-x-auto"><table className="min-w-full text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-4 py-3">Vaga</th><th className="px-4 py-3">Dias aberta</th><th className="px-4 py-3">SLA</th><th className="px-4 py-3">1ª shortlist</th><th className="px-4 py-3">Apresentados</th><th className="px-4 py-3">Situação</th></tr></thead><tbody className="divide-y divide-slate-100">{slaRows.map(row => <tr key={row.job.id}><td className="px-4 py-3 font-bold text-slate-900">{row.job.titulo || row.job.cargo || 'Vaga'}</td><td className="px-4 py-3">{row.age}</td><td className="px-4 py-3">{row.limit ? row.limit + ' dias' : 'Não definido'}</td><td className="px-4 py-3">{row.firstShortlistDays === null ? 'Ainda não enviada' : row.firstShortlistDays + ' dias'}</td><td className="px-4 py-3">{row.presented}</td><td className="px-4 py-3"><span className={row.status === 'SLA vencido' ? 'font-black text-rose-700' : row.status === 'Atenção' ? 'font-black text-amber-700' : 'font-black text-emerald-700'}>{row.status === 'SLA vencido' && <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />}{row.status}</span></td></tr>)}</tbody></table></div>
    </div>
  </div>;
};
