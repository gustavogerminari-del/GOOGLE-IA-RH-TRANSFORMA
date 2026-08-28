import React, { useState } from 'react';
import { 
  UserPlus, 
  Search, 
  Filter, 
  UserCheck, 
  Building2, 
  Briefcase, 
  Clock, 
  PhoneCall, 
  Mail, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ArrowRight, 
  MessageSquare, 
  Share2, 
  MoreVertical, 
  UserX, 
  Calendar, 
  Tag, 
  ExternalLink,
  ShieldCheck,
  Award
} from 'lucide-react';
import { HeadhunterCandidate, HeadhunterJob, HeadhunterStage } from '../types';
import { useAuth } from '../../auth';

export const HEADHUNTER_OFFICIAL_STAGES: HeadhunterStage[] = [
  'Identificado',
  'Em análise',
  'Contato pendente',
  'Contatado',
  'Interessado',
  'Vinculado à vaga',
  'Entrevista',
  'Recusado',
  'Sem retorno',
  'Contratado'
];

// RH_HEADHUNTER_PROSPECTING_V2 — Contratação só pode nascer na Central de Contratações.
const HEADHUNTER_MANUAL_STAGES = HEADHUNTER_OFFICIAL_STAGES.filter(stage => stage !== 'Contratado');

interface HeadhunterCandidatosProps {
  candidates: HeadhunterCandidate[];
  jobs: HeadhunterJob[];
  onAddCandidate: (candidate: HeadhunterCandidate) => void;
  onUpdateCandidate: (candidate: HeadhunterCandidate) => void;
  onDeleteCandidate?: (id: string) => void;
  onOpenAiModal?: (type: string, data?: any) => void;
}

export const HeadhunterCandidatos: React.FC<HeadhunterCandidatosProps> = ({
  candidates = [],
  jobs = [],
  onAddCandidate,
  onUpdateCandidate,
  onDeleteCandidate,
  onOpenAiModal
}) => {
  const { user } = useAuth();
  const empresaId = user?.empresaId || user?.companyId || user?.tenantId || '';

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('TODAS');
  const [jobFilter, setJobFilter] = useState<string>('TODAS');

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<HeadhunterCandidate | null>(null);
  const [contactLogModalCandidate, setContactLogModalCandidate] = useState<HeadhunterCandidate | null>(null);

  // New Candidate Form State
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefone, setFormTelefone] = useState('');
  const [formCpf, setFormCpf] = useState('');
  const [formCargo, setFormCargo] = useState('');
  const [formCidade, setFormCidade] = useState('');
  const [formPretensao, setFormPretensao] = useState('');
  const [formVagaId, setFormVagaId] = useState('');
  const [formEtapa, setFormEtapa] = useState<HeadhunterStage>('Identificado');
  const [formResponsavel, setFormResponsavel] = useState(user?.name || user?.email || '');
  const [formObservacoes, setFormObservacoes] = useState('');
  const [formPalavrasChave, setFormPalavrasChave] = useState('');
  const [formError, setFormError] = useState('');

  // Contact Log Form
  const [newLogDesc, setNewLogDesc] = useState('');
  const [newLogCanal, setNewLogCanal] = useState('LinkedIn');
  const [newLogProximaAcao, setNewLogProximaAcao] = useState('');

  // Metric Calculations
  const totalProspectados = candidates.length;
  const contatados = candidates.filter(c => ['Contatado', 'Interessado', 'Vinculado à vaga', 'Entrevista', 'Contratado'].includes(c.etapaHeadhunter || c.etapaPipeline)).length;
  const interessados = candidates.filter(c => ['Interessado', 'Vinculado à vaga', 'Entrevista', 'Contratado'].includes(c.etapaHeadhunter || c.etapaPipeline)).length;
  const semRetorno = candidates.filter(c => (c.etapaHeadhunter || c.etapaPipeline) === 'Sem retorno').length;
  const recusados = candidates.filter(c => (c.etapaHeadhunter || c.etapaPipeline) === 'Recusado').length;
  const contratados = candidates.filter(c => (c.etapaHeadhunter || c.etapaPipeline) === 'Contratado').length;

  // Filtered List
  const filteredCandidates = candidates.filter(cand => {
    const term = searchTerm.toLowerCase();
    const matchSearch = 
      !searchTerm ||
      cand.nome.toLowerCase().includes(term) ||
      cand.cargoAtual?.toLowerCase().includes(term) ||
      cand.cidade?.toLowerCase().includes(term) ||
      cand.email.toLowerCase().includes(term) ||
      cand.palavrasChave?.some(p => p.toLowerCase().includes(term)) ||
      cand.competencias?.some(c => c.toLowerCase().includes(term));

    const currentStage = cand.etapaHeadhunter || cand.etapaPipeline;
    const matchStage = stageFilter === 'TODAS' || currentStage === stageFilter;
    const matchJob = jobFilter === 'TODAS' || cand.vagaId === jobFilter;

    return matchSearch && matchStage && matchJob;
  });

  // Handle Add Candidate submit
  const handleCreateCandidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formNome.trim() || (!formEmail.trim() && !formTelefone.trim())) {
      setFormError('Nome e pelo menos E-mail ou Telefone são obrigatórios.');
      return;
    }

    // Deduplicação real por e-mail, telefone ou CPF; campo vazio nunca vira chave de duplicidade.
    const normalizedEmail = formEmail.toLowerCase().trim();
    const normalizedPhone = formTelefone.replace(/\D/g, '');
    const normalizedCpf = formCpf.replace(/\D/g, '');

    const duplicate = candidates.find(c =>
      (normalizedEmail && c.email && c.email.toLowerCase().trim() === normalizedEmail) ||
      (normalizedPhone && c.telefone && c.telefone.replace(/\D/g, '') === normalizedPhone) ||
      (normalizedCpf && c.cpf && c.cpf.replace(/\D/g, '') === normalizedCpf)
    );

    if (duplicate) {
      setFormError(`Já existe um candidato cadastrado com este E-mail ou CPF (${duplicate.nome}).`);
      return;
    }

    const linkedJob = jobs.find(j => j.id === formVagaId);
    const now = new Date().toISOString();
    const nowFormatted = now.split('T')[0];

    const newCandidate: HeadhunterCandidate = {
      id: `hh-cand-${Date.now()}`,
      empresaId: empresaId,
      criadoPor: user?.id || user?.email || '',
      criadoEm: nowFormatted,
      status: 'Ativo',
      nome: formNome.trim(),
      email: normalizedEmail,
      cpf: formCpf.trim(),
      telefone: formTelefone.trim(),
      cargoAtual: formCargo.trim(),
      cidade: formCidade.trim(),
      salarioAtual: 0,
      pretensaoSalarial: Number(formPretensao) || 0,
      vagaId: formVagaId || undefined,
      vagaTitulo: linkedJob?.titulo,
      clienteNome: linkedJob?.clienteNome,
      curriculoTexto: formObservacoes,
      compatibilidadePercent: 0,
      triagemIaScore: 0,
      triagemIaParecer: '',
      triagemRhStatus: 'Pendente',
      parecerTecnico: formObservacoes,
      etapaPipeline: formEtapa,
      etapaHeadhunter: formEtapa,
      responsavelNome: formResponsavel,
      responsavelId: user?.id || user?.email || '',
      origem: 'headhunter',
      observacoes: formObservacoes,
      dataUltimoContato: '',
      proximaAcao: '',
      palavrasChave: formPalavrasChave ? formPalavrasChave.split(',').map(s => s.trim()) : [],
      convertidoCandidatoOficial: false,
      incluidoBancoTalentos: false,
      consentimentoBancoTalentos: false,
      conviteEnviado: false,
      historicoContatos: [
        {
          data: nowFormatted,
          descricao: `Prospecção iniciada por ${formResponsavel}.`,
          autor: formResponsavel,
          canal: 'Cadastro Inicial'
        }
      ],
      historico: [{ data: nowFormatted, evento: `Candidato prospectado na etapa ${formEtapa}` }],
      linhaDoTempo: [{ data: nowFormatted, titulo: 'Candidato Prospectado', detalhe: `Registrado por ${formResponsavel}` }],
      createdAt: now,
      updatedAt: now,
      createdBy: user?.name || user?.email || ''
    };

    onAddCandidate(newCandidate);
    setIsAddModalOpen(false);

    // Reset Form
    setFormNome('');
    setFormEmail('');
    setFormTelefone('');
    setFormCpf('');
    setFormCargo('');
    setFormCidade('');
    setFormPretensao('');
    setFormVagaId('');
    setFormEtapa('Identificado');
    setFormObservacoes('');
    setFormPalavrasChave('');
  };

  // Change candidate stage
  const handleStageChange = (cand: HeadhunterCandidate, newStage: HeadhunterStage) => {
    if (newStage === 'Contratado') {
      alert('A contratação deve ser concluída pela Central de Contratações para preservar financeiro, admissão e histórico do colaborador.');
      return;
    }
    const updated: HeadhunterCandidate = {
      ...cand,
      etapaHeadhunter: newStage,
      etapaPipeline: newStage,
      dataUltimoContato: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
      historico: [
        { data: new Date().toISOString().split('T')[0], evento: `Etapa alterada para ${newStage}` },
        ...cand.historico
      ]
    };
    onUpdateCandidate(updated);
  };

  // Add Contact Log
  const handleAddContactLog = (cand: HeadhunterCandidate) => {
    if (!newLogDesc.trim()) return;

    const today = new Date().toISOString().split('T')[0];
    const newLog = {
      data: today,
      descricao: newLogDesc.trim(),
      autor: user?.name || 'Headhunter',
      canal: newLogCanal
    };

    const updated: HeadhunterCandidate = {
      ...cand,
      dataUltimoContato: today,
      proximaAcao: newLogProximaAcao.trim() || cand.proximaAcao,
      historicoContatos: [newLog, ...(cand.historicoContatos || [])],
      updatedAt: new Date().toISOString()
    };

    onUpdateCandidate(updated);
    setContactLogModalCandidate(updated);
    if (selectedCandidate?.id === cand.id) setSelectedCandidate(updated);

    setNewLogDesc('');
    setNewLogProximaAcao('');
  };

  // Actions: Convert to Official Candidate, Include in Talent Bank, Send Invite
  const handleToggleTalentBank = (cand: HeadhunterCandidate) => {
    const now = new Date().toISOString();
    if (!cand.incluidoBancoTalentos) {
      const confirmed = window.confirm('Confirme que o candidato autorizou a retenção do perfil no Banco de Talentos. Esta confirmação ficará registrada no histórico.');
      if (!confirmed) return;
      const updated = {
        ...cand,
        incluidoBancoTalentos: true,
        consentimentoBancoTalentos: true,
        consentimentoBancoTalentosEm: now,
        consentimentoBancoTalentosOrigem: 'registrado_pelo_recrutador' as const,
        historico: [{ data: now.slice(0, 10), evento: 'Consentimento para Banco de Talentos registrado pelo recrutador.' }, ...(cand.historico || [])],
        updatedAt: now
      };
      onUpdateCandidate(updated);
      if (selectedCandidate?.id === cand.id) setSelectedCandidate(updated);
      return;
    }
    const updated = {
      ...cand,
      incluidoBancoTalentos: false,
      consentimentoBancoTalentos: false,
      consentimentoBancoTalentosRevogadoEm: now,
      historico: [{ data: now.slice(0, 10), evento: 'Retenção no Banco de Talentos desativada.' }, ...(cand.historico || [])],
      updatedAt: now
    };
    onUpdateCandidate(updated);
    if (selectedCandidate?.id === cand.id) setSelectedCandidate(updated);
  };

  const handleConvertToOfficial = (cand: HeadhunterCandidate) => {
    const updated = { 
      ...cand, 
      convertidoCandidatoOficial: true, 
      etapaPipeline: 'Triagem', 
      etapaHeadhunter: 'Vinculado à vaga' as HeadhunterStage,
      updatedAt: new Date().toISOString() 
    };
    onUpdateCandidate(updated);
    if (selectedCandidate?.id === cand.id) setSelectedCandidate(updated);
    alert(`Candidato ${cand.nome} foi convertido em Candidato Oficial com sucesso!`);
  };

  const handlePrepareInvite = (cand: HeadhunterCandidate) => {
    if (!cand.email) {
      alert('Este candidato não possui e-mail cadastrado.');
      return;
    }
    const now = new Date().toISOString();
    const subject = encodeURIComponent('Contato sobre oportunidade profissional');
    const body = encodeURIComponent('Olá ' + cand.nome + ',\n\nGostaria de conversar com você sobre uma oportunidade profissional.');
    window.location.href = 'mailto:' + cand.email + '?subject=' + subject + '&body=' + body;
    const updated = { ...cand, convitePreparadoEm: now, conviteEnviado: false, updatedAt: now };
    onUpdateCandidate(updated);
    if (selectedCandidate?.id === cand.id) setSelectedCandidate(updated);
  };

  const handleOpenWhatsApp = (cand: HeadhunterCandidate) => {
    const digits = String(cand.telefone || '').replace(/\D/g, '');
    if (!digits) {
      alert('Este candidato não possui telefone cadastrado.');
      return;
    }
    const phone = digits.startsWith('55') ? digits : '55' + digits;
    const text = encodeURIComponent('Olá ' + cand.nome + ', gostaria de conversar com você sobre uma oportunidade profissional.');
    window.open('https://wa.me/' + phone + '?text=' + text, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Prospecção Ativa & Candidatos Headhunter
            </h2>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
              {totalProspectados} prospectados
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Mapeamento direto de executivos, abordagem ativas, registro de interações e pipeline de recrutamento exclusivo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAiModal && (
            <button
              onClick={() => onOpenAiModal('buscaSemantica', { modulo: 'headhunter' })}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              IA Talent Hunter
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Adicionar Candidato Prospectado
          </button>
        </div>
      </div>

      {/* 6 Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Prospectados</span>
          <p className="text-2xl font-black text-slate-900">{totalProspectados}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">Contatados</span>
          <p className="text-2xl font-black text-blue-600">{contatados}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600">Interessados</span>
          <p className="text-2xl font-black text-emerald-600">{interessados}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">Sem Retorno</span>
          <p className="text-2xl font-black text-amber-600">{semRetorno}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600">Recusados</span>
          <p className="text-2xl font-black text-rose-600">{recusados}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600">Contratados</span>
          <p className="text-2xl font-black text-purple-600">{contratados}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, cargo, cidade, palavras-chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="TODAS">Todas as Etapas</option>
              {HEADHUNTER_OFFICIAL_STAGES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option value="TODAS">Todas as Vagas</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.titulo}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Candidate List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Candidato Prospectado</th>
                <th className="p-4">Cargo / Cidade</th>
                <th className="p-4">Vaga / Cliente</th>
                <th className="p-4">Etapa Atual</th>
                <th className="p-4">Último Contato</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Nenhum candidato prospectado encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map(cand => {
                  const currentStage = (cand.etapaHeadhunter || cand.etapaPipeline) as HeadhunterStage;

                  return (
                    <tr key={cand.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Contact */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-extrabold flex items-center justify-center text-xs shrink-0">
                            {cand.nome.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span 
                              onClick={() => setSelectedCandidate(cand)}
                              className="font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer block"
                            >
                              {cand.nome}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span>{cand.email}</span>
                              <span>•</span>
                              <span>{cand.telefone}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Location */}
                      <td className="p-4">
                        <p className="font-semibold text-slate-800">{cand.cargoAtual}</p>
                        <span className="text-[11px] text-slate-400">{cand.cidade || 'Não informada'}</span>
                      </td>

                      {/* Linked Job */}
                      <td className="p-4">
                        {cand.vagaTitulo ? (
                          <div>
                            <p className="font-semibold text-slate-800">{cand.vagaTitulo}</p>
                            <span className="text-[11px] text-slate-400">{cand.clienteNome || 'Cliente Confidencial'}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Sem vaga vinculada</span>
                        )}
                      </td>

                      {/* Stage Dropdown */}
                      <td className="p-4">
                        <select
                          value={currentStage}
                          onChange={(e) => handleStageChange(cand, e.target.value as HeadhunterStage)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${
                            currentStage === 'Contratado' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            currentStage === 'Interessado' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            currentStage === 'Recusado' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                            currentStage === 'Sem retorno' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {HEADHUNTER_MANUAL_STAGES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>

                      {/* Last Contact */}
                      <td className="p-4">
                        <p className="text-slate-800 font-medium">{cand.dataUltimoContato || cand.criadoEm}</p>
                        <span className="text-[10px] text-slate-400 truncate max-w-[140px] block" title={cand.proximaAcao}>
                          {cand.proximaAcao || 'Sem ação agendada'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setContactLogModalCandidate(cand)}
                            title="Histórico de Contatos & Interações"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setSelectedCandidate(cand)}
                            title="Ver Perfil Completo"
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            Detalhes
                          </button>
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

      {/* Modal: Adicionar Candidato Prospectado */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Novo Candidato Prospectado</h3>
                <p className="text-xs text-slate-500">Cadastre o perfil para inicio da abordagem Headhunter.</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">✕</button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCandidateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Roberto Almeida"
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">E-mail *</label>
                  <input
                    type="email"
                    required
                    placeholder="roberto@email.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(11) 98888-7777"
                    value={formTelefone}
                    onChange={(e) => setFormTelefone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">CPF (Prevenção de Duplicidade)</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={formCpf}
                    onChange={(e) => setFormCpf(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Cargo Atual</label>
                  <input
                    type="text"
                    placeholder="Ex: Diretor de Operações"
                    value={formCargo}
                    onChange={(e) => setFormCargo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Cidade / Estado</label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo, SP"
                    value={formCidade}
                    onChange={(e) => setFormCidade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Pretensão Salarial (R$)</label>
                  <input
                    type="number"
                    placeholder="18000"
                    value={formPretensao}
                    onChange={(e) => setFormPretensao(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Vincular à Vaga</label>
                  <select
                    value={formVagaId}
                    onChange={(e) => setFormVagaId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    <option value="">Nenhuma (Banco de Talentos Headhunter)</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.titulo} - {j.clienteNome || 'Cliente'}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Etapa Inicial</label>
                  <select
                    value={formEtapa}
                    onChange={(e) => setFormEtapa(e.target.value as HeadhunterStage)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    {HEADHUNTER_MANUAL_STAGES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Responsável pela Prospecção</label>
                  <input
                    type="text"
                    value={formResponsavel}
                    onChange={(e) => setFormResponsavel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Palavras-chave (separadas por vírgula)</label>
                <input
                  type="text"
                  placeholder="Ex: Supply Chain, SAP, Liderança, Inglês Fluente"
                  value={formPalavrasChave}
                  onChange={(e) => setFormPalavrasChave(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Observações / Notas da Prospecção</label>
                <textarea
                  rows={3}
                  placeholder="Anotações confidenciais sobre a abordagem, perfil do LinkedIn ou histórico..."
                  value={formObservacoes}
                  onChange={(e) => setFormObservacoes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                >
                  Salvar Prospecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Histórico de Contatos & Interações */}
      {contactLogModalCandidate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Histórico de Contatos</h3>
                <p className="text-xs text-slate-500">{contactLogModalCandidate.nome} ({contactLogModalCandidate.cargoAtual})</p>
              </div>
              <button onClick={() => setContactLogModalCandidate(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">✕</button>
            </div>

            {/* Form to log new contact */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-extrabold text-slate-800 block">Registrar Novo Contato</span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newLogCanal}
                  onChange={(e) => setNewLogCanal(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl text-xs border border-slate-200 bg-white font-medium focus:outline-none"
                >
                  <option value="LinkedIn">LinkedIn InMail</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="E-mail">E-mail Corporativo</option>
                  <option value="Telefone">Ligação Telefônica</option>
                  <option value="Reunião">Reunião Presencial/Online</option>
                </select>
                <input
                  type="text"
                  placeholder="Próxima ação recomendada"
                  value={newLogProximaAcao}
                  onChange={(e) => setNewLogProximaAcao(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl text-xs border border-slate-200 bg-white focus:outline-none"
                />
              </div>
              <textarea
                rows={2}
                placeholder="Detalhes da conversa, interesse demonstrado, pretensão atual..."
                value={newLogDesc}
                onChange={(e) => setNewLogDesc(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl text-xs border border-slate-200 bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddContactLog(contactLogModalCandidate)}
                className="w-full py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
              >
                Adicionar Registro
              </button>
            </div>

            {/* List of contact logs */}
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Linha do Tempo de Abordagens</span>
              {(!contactLogModalCandidate.historicoContatos || contactLogModalCandidate.historicoContatos.length === 0) ? (
                <p className="text-xs text-slate-400 italic">Nenhum registro de contato registrado ainda.</p>
              ) : (
                contactLogModalCandidate.historicoContatos.map((log, i) => (
                  <div key={i} className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">{log.canal || 'Contato'} • {log.autor}</span>
                      <span className="text-slate-400 font-mono">{log.data}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{log.descricao}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Perfil Detalhado & Ações de Integração com Banco de Talentos */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                  {selectedCandidate.nome.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{selectedCandidate.nome}</h3>
                  <p className="text-xs text-slate-500">{selectedCandidate.cargoAtual} • {selectedCandidate.cidade}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">✕</button>
            </div>

            {/* Actions Panel (Integration with Talent Bank, Official Candidate & Client Presentation) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-extrabold text-slate-800 block">Integração & Ações Globais</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={() => handleToggleTalentBank(selectedCandidate)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedCandidate.incluidoBancoTalentos 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  {selectedCandidate.incluidoBancoTalentos ? 'No Banco' : 'Incluir no Banco'}
                </button>

                <button
                  onClick={() => handleConvertToOfficial(selectedCandidate)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  Converter em Oficial
                </button>

                <button
                  onClick={() => handleOpenWhatsApp(selectedCandidate)}
                  disabled={!selectedCandidate.telefone}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  Abrir WhatsApp
                </button>

                <button
                  onClick={() => handlePrepareInvite(selectedCandidate)}
                  disabled={!selectedCandidate.email}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-4 h-4" />
                  Preparar e-mail
                </button>

                <button
                  onClick={() => {
                    const updated: HeadhunterCandidate = {
                      ...selectedCandidate,
                      etapaHeadhunter: 'Vinculado à vaga',
                      etapaPipeline: 'Apresentado ao cliente',
                      conviteEnviado: true,
                      historico: [
                        { data: new Date().toISOString().split('T')[0], evento: `Candidato apresentado oficialmente ao cliente ${selectedCandidate.clienteNome || 'Corporativo'}` },
                        ...selectedCandidate.historico
                      ]
                    };
                    onUpdateCandidate(updated);
                    setSelectedCandidate(updated);
                    alert(`Candidato "${selectedCandidate.nome}" apresentado ao cliente com sucesso! O perfil estará disponível no Portal do Cliente.`);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  Apresentar ao Cliente
                </button>
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-slate-400 font-bold block text-[10px]">E-MAIL</span>
                <span className="font-semibold text-slate-800">{selectedCandidate.email}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-slate-400 font-bold block text-[10px]">TELEFONE</span>
                <span className="font-semibold text-slate-800">{selectedCandidate.telefone}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-slate-400 font-bold block text-[10px]">ORIGEM</span>
                <span className="font-semibold text-indigo-600 uppercase font-mono">{selectedCandidate.origem}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                <span className="text-slate-400 font-bold block text-[10px]">RESPONSÁVEL</span>
                <span className="font-semibold text-slate-800">{selectedCandidate.responsavelNome || 'Headhunter'}</span>
              </div>
            </div>

            {/* Notes / Observations */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-700">Observações & Anotações de Prospecção</span>
              <p className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed border border-slate-100">
                {selectedCandidate.observacoes || selectedCandidate.curriculoTexto || 'Sem observações registradas.'}
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
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
