import React, { useState } from 'react';
import { 
  X, 
  User, 
  FileText, 
  Sparkles, 
  Calendar, 
  Award, 
  History, 
  Phone, 
  Mail, 
  MessageCircle, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Share2, 
  ThumbsUp, 
  ThumbsDown, 
  Folder, 
  StickyNote, 
  FileCheck, 
  Send,
  Video,
  ChevronRight,
  Printer
} from 'lucide-react';
import { 
  JobCandidateApplication, 
  ApplicationStatus, 
  JobCandidateService 
} from '../../services/JobCandidateService';
import { Button } from '../../shared';
import { ScheduleInterviewModal } from '../../jobs/components/ScheduleInterviewModal';

interface SmartCandidateDrawerProps {
  candidate: JobCandidateApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  jobTitle?: string;
}

export const SmartCandidateDrawer: React.FC<SmartCandidateDrawerProps> = ({
  candidate,
  isOpen,
  onClose,
  onRefresh,
  jobTitle,
}) => {
  const [activeTab, setActiveTab] = useState<
    'resumo' | 'curriculo' | 'analise_ia' | 'avaliacao_rh' | 'entrevistas' | 'documentos' | 'anotacoes' | 'historico' | 'parecer'
  >('resumo');

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // New evaluation form state
  const [techScore, setTechScore] = useState(4);
  const [commScore, setCommScore] = useState(4);
  const [postureScore, setPostureScore] = useState(4);
  const [knowScore, setKnowScore] = useState(4);
  const [evalNotes, setEvalNotes] = useState('');
  const [finalOpinion, setFinalOpinion] = useState<'Aprovado' | 'Reprovado' | 'Em Dúvida'>('Aprovado');
  const [savingEval, setSavingEval] = useState(false);

  // Hooks must run in the same order while the drawer opens and closes.
  if (!isOpen || !candidate) return null;

  const cleanPhone = String(candidate.phone || '').replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(`Olá ${candidate.name}, vi seu perfil no RH TRANSFORMA para a vaga de ${jobTitle || candidate.role}.`)}`;
  const emailUrl = `mailto:${candidate.email}?subject=${encodeURIComponent(`Oportunidade - ${jobTitle || candidate.role} (RH TRANSFORMA)`)}`;

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (newStatus === 'Contratado') {
      try {
        await JobCandidateService.hireCandidate(candidate, jobTitle || candidate.role);
        alert(`🎉 Candidato(a) ${candidate.name} contratado(a) com sucesso! O destino foi definido pela origem da vaga.`);
      } catch (err) {
        console.error('Erro ao concluir contratação:', err);
        throw err;
      }
    } else {
      await JobCandidateService.updateStatus(candidate.id, newStatus);
    }
    if (newStatus === 'Reprovado') {
      alert(`Candidato(a) ${candidate.name} marcado(a) como Reprovado.`);
    }
    await onRefresh();
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEval(true);
    try {
      await JobCandidateService.addEvaluation(candidate.id, {
        technicalScore: techScore,
        communicationScore: commScore,
        postureScore: postureScore,
        knowledgeScore: knowScore,
        notes: evalNotes,
        finalOpinion
      });
      setEvalNotes('');
      await onRefresh();
    } catch (err) {
      console.error('Erro ao salvar avaliação:', err);
    } finally {
      setSavingEval(false);
    }
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    setAddingNote(true);
    try {
      await JobCandidateService.addNote(candidate.id, newNoteText.trim());
      setNewNoteText('');
      await onRefresh();
    } catch (err) {
      console.error('Erro ao adicionar nota:', err);
    } finally {
      setAddingNote(false);
    }
  };

  const getStatusBadgeColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'Novos': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Triagem IA': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Em Análise RH': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Entrevista Agendada': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Entrevista Realizada': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Aprovado': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Contratado': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Reprovado': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-2xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pr-10">
            <div className="flex items-center gap-4">
              {(candidate.photo || candidate.avatar) ? (
                <img
                  src={candidate.photo || candidate.avatar}
                  alt={candidate.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-slate-800 text-emerald-400 font-extrabold flex items-center justify-center text-lg border-2 border-emerald-500 shadow-md shrink-0">
                  {candidate.name ? candidate.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'C'}
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-white">{candidate.name}</h2>
                  <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${getStatusBadgeColor(candidate.status)}`}>
                    {candidate.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <span>{candidate.role}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                    {candidate.city}, {candidate.state}
                  </span>
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-300 pt-0.5">
                  <span className="font-medium text-slate-400">Match IA:</span>
                  <span className="font-extrabold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    {candidate.compatibilityScore}% {candidate.compatibilityLevel}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>

              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                Entrevista
              </button>

              <button
                onClick={() => handleStatusChange('Aprovado')}
                className="px-3 py-1.5 rounded-xl bg-teal-600 text-white hover:bg-teal-500 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Aprovar
              </button>

              <button
                onClick={() => handleStatusChange('Reprovado')}
                className="px-3 py-1.5 rounded-xl bg-rose-900/60 text-rose-200 hover:bg-rose-900 border border-rose-700/60 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                Reprovar
              </button>
            </div>
          </div>

          {/* 9 Drawer Navigation Tabs */}
          <div className="flex items-center gap-1 mt-6 border-b border-slate-800 -mb-6 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('resumo')}
              className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'resumo' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Resumo
            </button>

            <button
              onClick={() => setActiveTab('curriculo')}
              className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'curriculo' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Currículo
            </button>

            <button
              onClick={() => setActiveTab('analise_ia')}
              className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'analise_ia' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Análise IA
            </button>

            <button
              onClick={() => setActiveTab('avaliacao_rh')}
              className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'avaliacao_rh' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Avaliação RH
            </button>

            <button
              onClick={() => setActiveTab('entrevistas')}
              className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'entrevistas' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Entrevistas
            </button>

            <button
              onClick={() => setActiveTab('documentos')}
              className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'documentos' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Folder className="w-3.5 h-3.5" />
              Documentos
            </button>

            <button
              onClick={() => setActiveTab('anotacoes')}
              className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'anotacoes' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <StickyNote className="w-3.5 h-3.5" />
              Anotações
            </button>

            <button
              onClick={() => setActiveTab('historico')}
              className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'historico' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Histórico
            </button>

            <button
              onClick={() => setActiveTab('parecer')}
              className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'parecer' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              Parecer Final
            </button>
          </div>
        </div>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          
          {/* TAB 1: RESUMO */}
          {activeTab === 'resumo' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Ficha do Candidato
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">E-mail</span>
                    <span className="font-bold text-slate-800">{candidate.email}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Telefone</span>
                    <span className="font-bold text-slate-800">{candidate.phone}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Cidade/UF</span>
                    <span className="font-bold text-slate-800">{candidate.city}, {candidate.state}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">CPF</span>
                    <span className="font-bold text-slate-800">{candidate.cpf || '123.456.789-00'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Pretensão Salarial</span>
                    <span className="font-bold text-slate-800">{candidate.salaryExpectation}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Disponibilidade</span>
                    <span className="font-bold text-slate-800">{candidate.availability}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Escolaridade</span>
                    <span className="font-bold text-slate-800">{candidate.education} ({candidate.course || 'Geral'})</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Experiência Profissional</span>
                    <span className="font-bold text-slate-800">{candidate.experienceYears} anos</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">PCD</span>
                    <span className="font-bold text-slate-800">{candidate.isPCD ? 'Sim' : 'Não'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Objetivo Profissional
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {candidate.objective || 'Busco oportunidade para atuar no desenvolvimento estratégico de projetos na área de atuação.'}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Principais Competências Mapeadas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(candidate.resumeKeywords || ['React', 'TypeScript', 'Node.js', 'Clean Code']).map((kw, idx) => (
                    <span key={idx} className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold px-3 py-1 rounded-xl">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CURRÍCULO */}
          {activeTab === 'curriculo' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Documento de Currículo</h3>
                  <p className="text-xs text-slate-500 font-medium">Visualização e download do arquivo anexado</p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={candidate.resumeUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar PDF
                  </a>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-2xl font-black text-slate-900">{candidate.name}</h2>
                  <p className="text-xs font-bold text-emerald-600 mt-1">{candidate.role}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {candidate.city}, {candidate.state} • {candidate.phone} • {candidate.email}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Resumo do Currículo</h4>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {candidate.objective} Profissional com {candidate.experienceYears} anos de vivência prática e entregas em projetos com altos padrões de qualidade.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Histórico de Experiências</h4>
                  {(candidate.experiences || []).map((exp, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-900">
                        <span>{exp.role} — <span className="text-slate-600">{exp.company}</span></span>
                        <span className="text-slate-400 font-normal">{exp.period}</span>
                      </div>
                      <p className="text-xs text-slate-600">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ANÁLISE IA */}
          {activeTab === 'analise_ia' && candidate.aiAnalysis && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Diagnóstico Preditivo RH TRANSFORMA IA
                    </div>
                    <h3 className="text-xl font-black">{candidate.aiAnalysis.recommendation}</h3>
                    <p className="text-xs text-slate-300 max-w-md font-medium">
                      Compatibilidade calculada com cruzamento de requisitos da vaga e histórico do candidato.
                    </p>
                  </div>

                  <div className="text-center bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 shrink-0">
                    <span className="text-3xl font-black tracking-tight text-emerald-400">{candidate.aiAnalysis.score}%</span>
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-300">
                      Pontuação IA
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Resumo Executivo</h4>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {candidate.aiAnalysis.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-200 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Pontos Fortes
                  </h4>
                  <ul className="space-y-2">
                    {candidate.aiAnalysis.strengths.map((st, idx) => (
                      <li key={idx} className="text-xs text-emerald-950 font-medium flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                        {st}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50/60 rounded-2xl p-5 border border-amber-200 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Pontos de Atenção
                  </h4>
                  <ul className="space-y-2">
                    {candidate.aiAnalysis.pointsOfAttention.map((pa, idx) => (
                      <li key={idx} className="text-xs text-amber-950 font-medium flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                        {pa}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Análise Comportamental & Sugestão para Entrevista</h4>
                <p className="text-xs text-slate-700 font-medium">{candidate.aiAnalysis.behavioralAnalysis}</p>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">Perguntas Recomendadas:</span>
                  <ul className="space-y-1">
                    {candidate.aiAnalysis.interviewSuggestions.map((sug, i) => (
                      <li key={i} className="text-xs text-slate-700 flex items-center gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                        {sug}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AVALIAÇÃO RH */}
          {activeTab === 'avaliacao_rh' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Avaliações Registradas do Time de RH
                </h3>

                {(candidate.evaluations && candidate.evaluations.length > 0) ? (
                  candidate.evaluations.map((ev) => (
                    <div key={ev.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                        <span className="font-black text-slate-900">{ev.evaluatedBy}</span>
                        <span className="text-slate-400 text-[10px]">{ev.evaluatedAt}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2 bg-slate-50 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 block font-bold">Técnica</span>
                          <span className="font-black text-emerald-600">{ev.technicalScore}/5</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 block font-bold">Comunicação</span>
                          <span className="font-black text-emerald-600">{ev.communicationScore}/5</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 block font-bold">Postura</span>
                          <span className="font-black text-emerald-600">{ev.postureScore}/5</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl text-center">
                          <span className="text-[10px] text-slate-400 block font-bold">Conhecimento</span>
                          <span className="font-black text-emerald-600">{ev.knowledgeScore}/5</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl">{ev.notes}</p>
                      
                      <div className="flex justify-end">
                        <span className={`text-xs font-black px-3 py-1 rounded-full ${
                          ev.finalOpinion === 'Aprovado' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          Parecer: {ev.finalOpinion}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Nenhuma avaliação humana cadastrada ainda.</p>
                )}
              </div>

              {/* Form Nova Avaliação */}
              <form onSubmit={handleSaveEvaluation} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Registrar Nova Avaliação do Recrutador
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nota Técnica (1-5)</label>
                    <select
                      value={techScore}
                      onChange={(e) => setTechScore(Number(e.target.value))}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200"
                    >
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Estrela(s)</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Comunicação (1-5)</label>
                    <select
                      value={commScore}
                      onChange={(e) => setCommScore(Number(e.target.value))}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200"
                    >
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Estrela(s)</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Postura (1-5)</label>
                    <select
                      value={postureScore}
                      onChange={(e) => setPostureScore(Number(e.target.value))}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200"
                    >
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Estrela(s)</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Conhecimento (1-5)</label>
                    <select
                      value={knowScore}
                      onChange={(e) => setKnowScore(Number(e.target.value))}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200"
                    >
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Estrela(s)</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Parecer e Impressões Gerais</label>
                  <textarea
                    value={evalNotes}
                    onChange={(e) => setEvalNotes(e.target.value)}
                    rows={3}
                    placeholder="Ecreva as observações coletadas durante a entrevista..."
                    className="w-full text-xs font-medium p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Parecer Final:</span>
                    <select
                      value={finalOpinion}
                      onChange={(e) => setFinalOpinion(e.target.value as any)}
                      className="text-xs font-bold p-2 rounded-xl border border-slate-200"
                    >
                      <option value="Aprovado">Aprovado</option>
                      <option value="Reprovado">Reprovado</option>
                      <option value="Em Dúvida">Em Dúvida</option>
                    </select>
                  </div>

                  <Button type="submit" variant="primary" size="sm" disabled={savingEval}>
                    {savingEval ? 'Salvando...' : 'Salvar Avaliação RH'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: ENTREVISTAS */}
          {activeTab === 'entrevistas' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {candidate.interview ? (
                <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                      <h3 className="text-sm font-black text-slate-900">Entrevista Agendada</h3>
                    </div>
                    <span className="text-xs font-extrabold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                      {candidate.interview.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Data</span>
                      <span className="font-extrabold text-slate-800">{candidate.interview.date}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Horário</span>
                      <span className="font-extrabold text-slate-800">{candidate.interview.time}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Entrevistador</span>
                      <span className="font-extrabold text-slate-800">{candidate.interview.interviewer}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                      <span className="font-extrabold text-emerald-600">{candidate.interview.status || 'Agendada'}</span>
                    </div>
                  </div>

                  {candidate.interview.meetingLink && (
                    <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 font-bold text-emerald-950">
                        <Video className="w-4 h-4 text-emerald-600" />
                        <span>Link Reunião:</span>
                        <a href={candidate.interview.meetingLink} target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-700 truncate max-w-xs">
                          {candidate.interview.meetingLink}
                        </a>
                      </div>
                      <a href={candidate.interview.meetingLink} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 text-[11px] shrink-0">
                        Acessar Reunião
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setIsScheduleModalOpen(true)}>
                      Reagendar
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => handleStatusChange('Entrevista Realizada')}>
                      Concluir Entrevista
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-extrabold text-slate-800">Nenhuma entrevista pendente</h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Agende uma conversa presencial ou online com o candidato.
                  </p>
                  <Button variant="primary" size="sm" onClick={() => setIsScheduleModalOpen(true)}>
                    Agendar Entrevista
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: DOCUMENTOS */}
          {activeTab === 'documentos' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4 animate-in fade-in duration-150">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Documentos Anexados do Candidato
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-xs">PDF</div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Currículo Oficial.pdf</span>
                      <span className="text-[10px] text-slate-400">Documento Principal</span>
                    </div>
                  </div>
                  <a href={candidate.resumeUrl || '#'} target="_blank" rel="noopener noreferrer" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                    <Download className="w-4 h-4" />
                  </a>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 text-blue-800 rounded-lg font-bold text-xs">DOC</div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Comprovante de Escolaridade</span>
                      <span className="text-[10px] text-slate-400">Diploma / Certificado</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">Verificado</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: ANOTAÇÕES */}
          {activeTab === 'anotacoes' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Anotações Internas do Processo Seletivo
                </h3>

                <div className="space-y-2">
                  {(candidate.notes || []).length > 0 ? (
                    candidate.notes?.map((n, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-medium text-slate-700">
                        {n}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">Nenhuma anotação cadastrada.</p>
                  )}
                </div>

                <form onSubmit={handleAddNoteSubmit} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Adicionar nota interna sobre o candidato..."
                    className="flex-1 text-xs font-medium p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Button type="submit" variant="primary" size="sm" disabled={addingNote}>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 8: HISTÓRICO */}
          {activeTab === 'historico' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6 animate-in fade-in duration-150">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Histórico Preditivo da Candidatura
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {(candidate.timeline || []).map((evt) => (
                  <div key={evt.id} className="relative">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white ring-2 ring-emerald-100" />
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-900">{evt.title}</span>
                        <span className="text-[10px] font-bold text-slate-400">{evt.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">{evt.description}</p>
                      {evt.by && <p className="text-[10px] text-slate-400 font-bold">Por: {evt.by}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: PARECER FINAL */}
          {activeTab === 'parecer' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Parecer Conclusivo RH TRANSFORMA IA</h3>
                    <p className="text-xs text-slate-500 font-medium">Relatório unificado da inteligência artificial e time humano</p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimir / Exportar
                  </button>
                </div>

                <div className="p-5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-950 uppercase">Resultado Consolidado</span>
                    <span className="text-xs font-extrabold bg-emerald-600 text-white px-3 py-1 rounded-full">
                      {candidate.aiAnalysis?.recommendation || 'Recomendado'}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                    Com base no pareamento automatizado de {candidate.compatibilityScore}% de aderência técnica e nas avaliações comportamentais realizadas pelo RH, o candidato {candidate.name} está qualificado para avançar para a fase contratual.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Recomendação Final do Recrutador</h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-800">
                    Candidato demonstrou excelente sinergia com o perfil desejado para o cargo de {candidate.role}. Pontual, articulado e altamente recomendado.
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        candidateName={candidate.name}
        onSave={async (data) => {
          await JobCandidateService.scheduleInterview(candidate.id, data);
          await onRefresh();
          alert(`🗓️ Entrevista para ${candidate.name} agendada com sucesso para ${data.date} às ${data.time}!`);
        }}
        initialData={candidate.interview}
      />
    </div>
  );
};
