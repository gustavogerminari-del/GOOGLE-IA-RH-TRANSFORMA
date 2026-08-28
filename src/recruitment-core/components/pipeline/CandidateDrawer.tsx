import React, { useState } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  DollarSign, 
  Sparkles, 
  Award, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  Plus, 
  Star, 
  Send, 
  Download, 
  Paperclip, 
  Upload, 
  Share2, 
  Layers, 
  Building2, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { CandidateWithProcess, VagaCandidatosService } from '../../services/vagaCandidatosService';
import { ProcessStage, UnifiedJob } from '../../types/recruitment';
import { enviarCandidatoParaAdmissaoDP } from '../../../departamento-pessoal/services/dpFirestoreService';
import { JobCandidateService } from '../../../services/JobCandidateService';
import { JobService } from '../../../services/JobService';

interface CandidateDrawerProps {
  candidate: CandidateWithProcess;
  job: UnifiedJob;
  onClose: () => void;
  onMoveStage: (candidateId: string, newStage: ProcessStage) => void;
  onScheduleInterview: (candidate: CandidateWithProcess) => void;
  onUpdateCandidate?: (updated: CandidateWithProcess) => void;
}

export const CandidateDrawer: React.FC<CandidateDrawerProps> = ({
  candidate,
  job,
  onClose,
  onMoveStage,
  onScheduleInterview,
  onUpdateCandidate
}) => {
  const [activeTab, setActiveTab] = useState<
    'resumo' | 'curriculo' | 'match_ia' | 'avaliacao' | 'entrevistas' | 'documentos' | 'anotacoes' | 'linha_tempo'
  >('resumo');

  // New Note state
  const [newNoteText, setNewNoteText] = useState('');
  
  // Rating & Evaluation state
  const [notaTecnica, setNotaTecnica] = useState(5);
  const [notaComportamental, setNotaComportamental] = useState(5);
  const [parecerText, setParecerText] = useState('');

  // Email Modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState(`Processo Seletivo RH TRANSFORMA - Vaga ${job.titulo}`);
  const [emailBody, setEmailBody] = useState(`Olá ${candidate.nome},\n\nGostaríamos de atualizar você sobre o seu processo seletivo para a vaga de ${job.titulo}.\n\nAtenciosamente,\nEquipe de RH`);

  // Stage Modal state
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [targetStage, setTargetStage] = useState<ProcessStage>(candidate.etapaAtual);

  const stagesList: ProcessStage[] = [
    'Inscrito',
    'Triagem',
    'Entrevista RH',
    'Teste Técnico',
    'Entrevista Gestor',
    'Entrevista Headhunter',
    'Apresentado ao cliente',
    'Entrevista com cliente',
    'Proposta',
    'Contratado',
    'Reprovado',
    'Desistiu'
  ];

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    await VagaCandidatosService.addAnnotation(candidate.id, 'Recrutador RH', newNoteText);
    const updatedNotes = [
      { id: `note-${Date.now()}`, autor: 'Recrutador RH', data: new Date().toISOString().replace('T', ' ').substring(0, 16), texto: newNoteText },
      ...(candidate.anotacoes || [])
    ];
    if (onUpdateCandidate) {
      onUpdateCandidate({ ...candidate, anotacoes: updatedNotes });
    }
    setNewNoteText('');
  };

  const handleContratar = async () => {
    if (!window.confirm(`Confirmar a CONTRATAÇÃO de ${candidate.nome} para a vaga ${job.titulo}?`)) return;

    const candApp: any = {
      id: candidate.id,
      candidateId: candidate.candidatoId || candidate.id,
      companyId: job.empresaId || candidate.empresaId || '',
      jobId: job.id,
      name: candidate.nome,
      role: job.titulo,
      email: candidate.email || '',
      phone: candidate.telefone || '',
      cpf: candidate.cpf || '',
      status: 'Em Processo'
    };

    try {
      const res = await JobCandidateService.hireCandidate(candApp, job.titulo);
      if (res.success) {
        onMoveStage(candidate.id, 'Contratado');
        alert(`Parabéns! ${candidate.nome} foi contratado(a) com sucesso! Registrado na Central Única de Contratações.`);
      }
    } catch (err: any) {
      if (err?.message?.includes('origem definida')) {
        const choice = window.confirm(
          "Esta vaga ainda não possui uma origem definida.\n\n" +
          "Clique OK para defini-la como Vaga de Cliente (HEADHUNTER - Financeiro).\n" +
          "Clique CANCELAR para defini-la como Vaga Interna (RH - Departamento Pessoal)."
        );
        const chosenOrigin = choice ? 'HEADHUNTER' : 'RH_INTERNO';

        try {
          await JobService.update(job.id, {
            origemProcesso: chosenOrigin,
            moduloOrigem: chosenOrigin === 'HEADHUNTER' ? 'headhunter' : 'RH',
            origem: chosenOrigin,
            isHeadhunter: chosenOrigin === 'HEADHUNTER',
            destinoContratacao: chosenOrigin === 'HEADHUNTER' ? 'FINANCEIRO_HEADHUNTER' : 'DP'
          });

          const resRetry = await JobCandidateService.hireCandidate(candApp, job.titulo);
          if (resRetry.success) {
            onMoveStage(candidate.id, 'Contratado');
            alert(`Parabéns! ${candidate.nome} foi contratado(a) com sucesso!`);
          }
        } catch (retryErr: any) {
          alert(`Erro ao contratar candidato: ${retryErr?.message || 'Erro desconhecido'}`);
        }
      } else {
        alert(`Erro ao contratar candidato: ${err?.message || 'Erro desconhecido'}`);
      }
    }
  };

  const handleReprovar = () => {
    if (window.confirm(`Mover ${candidate.nome} para REPROVADO?`)) {
      onMoveStage(candidate.id, 'Reprovado');
    }
  };

  const whatsappPhone = (candidate.telefone || '').replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/55${whatsappPhone}?text=${encodeURIComponent(`Olá ${candidate.nome}, sou do RH da empresa referente à vaga de ${job.titulo}.`)}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end">
      {/* Slide-over Panel */}
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-300">
        
        {/* HEADER FIXO */}
        <div className="p-6 bg-[#082747] text-white border-b border-[#0f3761] space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center font-black text-amber-300 text-base shrink-0 overflow-hidden">
                {candidate.fotoUrl ? (
                  <img src={candidate.fotoUrl} alt={candidate.nome} className="w-full h-full object-cover" />
                ) : (
                  <span>{candidate.nome.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">{candidate.nome}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                    Match {candidate.matchIaPercent || candidate.triagemIaScore || 85}%
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">{candidate.cargoAtual || 'Profissional'}</p>
              </div>
            </div>

            <button 
              onClick={onClose} 
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* BARRA DE AÇÕES RÁPIDAS (Quick Actions) */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 text-xs font-bold">
            <button
              onClick={() => setIsStageModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 transition"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Etapa: {candidate.etapaAtual}</span>
            </button>

            <button
              onClick={() => onScheduleInterview(candidate)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Agendar Entrevista</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>E-mail</span>
            </button>

            <button
              onClick={handleContratar}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5 transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Contratar</span>
            </button>

            <button
              onClick={handleReprovar}
              className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 flex items-center gap-1.5 transition"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Reprovar</span>
            </button>
          </div>

          {/* MENU INTERNO DE NAVEGAÇÃO DO PAINEL LATERAL */}
          <div className="flex gap-1 overflow-x-auto pt-2 border-t border-white/10 text-xs font-extrabold scrollbar-none">
            {[
              { id: 'resumo', label: 'Resumo' },
              { id: 'curriculo', label: 'Currículo' },
              { id: 'match_ia', label: 'Match IA' },
              { id: 'avaliacao', label: 'Avaliação RH' },
              { id: 'entrevistas', label: 'Entrevistas' },
              { id: 'documentos', label: 'Documentos' },
              { id: 'anotacoes', label: `Anotações (${(candidate.anotacoes || []).length})` },
              { id: 'linha_tempo', label: 'Linha do Tempo' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL DAS ABAS */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-900 bg-slate-50/50">

          {/* ==================================== */}
          {/* TAB 1: RESUMO */}
          {/* ==================================== */}
          {activeTab === 'resumo' && (
            <div className="space-y-6">
              {/* Contatos Grid */}
              <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs shadow-2xs">
                <div>
                  <span className="text-slate-400 font-bold block">E-mail</span>
                  <strong className="text-slate-900 truncate block">{candidate.email}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Telefone</span>
                  <strong className="text-slate-900">{candidate.telefone || '(00) 00000-0000'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Cidade</span>
                  <strong className="text-slate-900">{candidate.cidade || 'Não informada'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Pretensão Salarial</span>
                  <strong className="text-emerald-700 font-black">
                    {candidate.pretensaoSalarial ? `R$ ${candidate.pretensaoSalarial.toLocaleString('pt-BR')}` : 'A combinar'}
                  </strong>
                </div>
              </div>

              {/* Formação e Experiência */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  Formação & Experiência Profissional
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block">Escolaridade:</span>
                    <strong className="text-slate-800">{candidate.escolaridade || 'Superior Completo'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Tempo de Experiência:</span>
                    <strong className="text-slate-800">{candidate.experienciaAnos || 3} anos</strong>
                  </div>
                  {candidate.curso && (
                    <div className="col-span-2">
                      <span className="text-slate-400 font-bold block">Curso / Instituição:</span>
                      <strong className="text-slate-800">{candidate.curso}</strong>
                    </div>
                  )}
                  {candidate.empresaAnterior && (
                    <div className="col-span-2">
                      <span className="text-slate-400 font-bold block">Última Empresa:</span>
                      <strong className="text-slate-800">{candidate.empresaAnterior}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Competências / Skills */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-600" />
                  Competências Mapeadas
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(candidate.competencias && candidate.competencias.length > 0 ? candidate.competencias : ['React', 'TypeScript', 'Node.js', 'Tailwind', 'Comunicação']).map((skill, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Parecer IA Resumido */}
              {candidate.triagemIaParecer && (
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-2 text-xs">
                  <span className="font-black text-indigo-900 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-amber-500" /> Resumo do Fit IA
                  </span>
                  <p className="text-indigo-950 leading-relaxed font-medium">{candidate.triagemIaParecer}</p>
                </div>
              )}
            </div>
          )}

          {/* ==================================== */}
          {/* TAB 2: CURRÍCULO */}
          {/* ==================================== */}
          {activeTab === 'curriculo' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
                <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" /> Documento do Currículo
                </span>
                {candidate.resumeUrl || candidate.curriculoUrl ? (
                  <a
                    href={candidate.resumeUrl || candidate.curriculoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir currículo
                  </a>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Currículo indisponível
                  </span>
                )}
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 font-sans text-xs text-slate-700 leading-relaxed">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-black text-slate-900">{candidate.nome}</h2>
                  <p className="text-slate-500 font-bold">{candidate.email} • {candidate.telefone} • {candidate.cidade}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider text-indigo-700">Resumo Profissional</h3>
                  <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                    {candidate.curriculoTexto || `${candidate.nome} possui ${candidate.experienciaAnos || 4} anos de atuação como ${candidate.cargoAtual || 'profissional'}, com domínio em ferramentas modernas e forte foco em entregas de alto impacto.`}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider text-indigo-700">Histórico de Experiências</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{candidate.cargoAtual || 'Desenvolvedor / Especialista'}</span>
                        <span className="text-slate-400">2023 - Presente</span>
                      </div>
                      <p className="text-slate-500 font-medium">{candidate.empresaAnterior || 'Tech Company'} • {candidate.cidade}</p>
                      <p className="mt-1 text-slate-600">Desenvolvimento de soluções escaláveis, manutenção de código e colaboração com times ágeis.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================== */}
          {/* TAB 3: MATCH IA */}
          {/* ==================================== */}
          {activeTab === 'match_ia' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-[#123657] to-[#082747] text-white p-6 rounded-3xl space-y-3 shadow-lg">
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Análise Preditiva de Fit IA
                  </span>
                  <span className="text-2xl font-black text-amber-400">{candidate.matchIaPercent || 85}%</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Calculado pela Inteligência Artificial do RH TRANSFORMA comparando o currículo com as exigências técnicas da vaga {job.titulo}.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2">
                  <h4 className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Pontos Fortes em Destaque
                  </h4>
                  <ul className="text-xs text-emerald-800 space-y-1 list-disc list-inside font-medium">
                    <li>Excelente adequação de experiência prática ({candidate.experienciaAnos || 4} anos)</li>
                    <li>Nível de escolaridade compatível com o requisito</li>
                    <li>Habilidades essenciais atendidas</li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2">
                  <h4 className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" /> Pontos a Investigar na Entrevista
                  </h4>
                  <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside font-medium">
                    <li>Verificar pretensão salarial x orçamento estipulado</li>
                    <li>Validar disponibilidade para início imediato</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ==================================== */}
          {/* TAB 4: AVALIAÇÃO RH */}
          {/* ==================================== */}
          {activeTab === 'avaliacao' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Scorecard e Avaliação do Recrutador
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nota Técnica (1 a 5):</label>
                    <select
                      value={notaTecnica}
                      onChange={(e) => setNotaTecnica(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Estrelas</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nota Comportamental (1 a 5):</label>
                    <select
                      value={notaComportamental}
                      onChange={(e) => setNotaComportamental(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                    >
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Estrelas</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Parecer Técnico / Resumo:</label>
                  <textarea
                    rows={3}
                    value={parecerText}
                    onChange={(e) => setParecerText(e.target.value)}
                    placeholder="Escreva seu parecer sobre a entrevista ou perfil do candidato..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                  ></textarea>
                </div>

                <button
                  onClick={() => { alert('Avaliação salva com sucesso!'); setParecerText(''); }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Salvar Avaliação
                </button>
              </div>
            </div>
          )}

          {/* ==================================== */}
          {/* TAB 5: ENTREVISTAS */}
          {/* ==================================== */}
          {activeTab === 'entrevistas' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Histórico de Entrevistas</h3>
                <button
                  onClick={() => onScheduleInterview(candidate)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Nova Entrevista
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-indigo-700">Entrevista de Triagem RH</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">Concluída</span>
                </div>
                <p className="text-xs text-slate-600">Entrevista realizada via Google Meet. Candidato apresentou excelente comunicação interpessoal.</p>
              </div>
            </div>
          )}

          {/* ==================================== */}
          {/* TAB 6: DOCUMENTOS */}
          {/* ==================================== */}
          {activeTab === 'documentos' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
                <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-indigo-600" /> Documentos Anexados
                </span>
                <button
                  onClick={() => alert('Link de solicitação de documentos enviado via WhatsApp e E-mail.')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  Solicitar Documentos
                </button>
              </div>

              <div className="space-y-2">
                {(candidate.documentos || [
                  { id: '1', nome: 'RG_CPF_Digital.pdf', tipo: 'Identificação', url: '#', dataUpload: '2026-08-01', status: 'Verificado' as const }
                ]).map(doc => (
                  <div key={doc.id} className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{doc.nome}</span>
                      <span className="text-slate-400 font-medium">{doc.tipo} • {doc.dataUpload}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-[10px]">{doc.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================================== */}
          {/* TAB 7: ANOTAÇÕES */}
          {/* ==================================== */}
          {activeTab === 'anotacoes' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-black text-slate-900 block">Adicionar Anotação da Equipe:</label>
                <textarea
                  rows={2}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Ex: Candidato possui disponibilidade imediata para início..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                ></textarea>
                <div className="flex justify-end">
                  <button
                    onClick={handleAddNote}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition"
                  >
                    Salvar Anotação
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {(candidate.anotacoes || []).map(note => (
                  <div key={note.id} className="p-4 bg-white rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                      <span className="text-indigo-700 font-black">{note.autor}</span>
                      <span>{note.data}</span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium">{note.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================================== */}
          {/* TAB 8: LINHA DO TEMPO */}
          {/* ==================================== */}
          {activeTab === 'linha_tempo' && (
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Histórico Cronológico do Candidato</h3>
              <div className="relative pl-6 border-l-2 border-indigo-200 space-y-6">
                {(candidate.linhaDoTempo || [
                  { data: candidate.dataCandidatura || '2026-08-01 14:30', titulo: 'Candidatou-se', detalhe: 'Inscrição efetuada na vaga' },
                  { data: candidate.dataCandidatura || '2026-08-01 14:31', titulo: 'Currículo Enviado', detalhe: 'Currículo anexado com sucesso' },
                  { data: candidate.dataCandidatura || '2026-08-01 14:35', titulo: 'Triagem IA', detalhe: `Score de compatibilidade: ${candidate.matchIaPercent || 85}%` }
                ]).map((event, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white shadow-xs"></div>
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-xs text-slate-900">{event.titulo}</span>
                        <span className="text-[10px] font-bold text-slate-400">{event.data}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{event.detalhe}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* MODAL MUDAR ETAPA */}
      {isStageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-sm font-black text-slate-900">Mover Candidato de Etapa</h3>
            <select
              value={targetStage}
              onChange={(e) => setTargetStage(e.target.value as ProcessStage)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
            >
              {stagesList.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsStageModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                Cancelar
              </button>
              <button 
                onClick={() => {
                  onMoveStage(candidate.id, targetStage);
                  setIsStageModalOpen(false);
                }} 
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-black text-xs"
              >
                Mover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ENVIAR EMAIL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">Enviar E-mail para {candidate.nome}</h3>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Assunto:</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Mensagem:</label>
                <textarea
                  rows={5}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setIsEmailModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                Cancelar
              </button>
              <button 
                onClick={() => {
                  alert(`E-mail enviado com sucesso para ${candidate.email}!`);
                  setIsEmailModalOpen(false);
                }} 
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-black text-xs"
              >
                Enviar E-mail
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
