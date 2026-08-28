import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  Briefcase, 
  RefreshCw, 
  Copy, 
  Check, 
  Lightbulb, 
  MessageSquare, 
  FileText, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { JobCandidateApplication, JobCandidateService } from '../../services/JobCandidateService';
import { JobService } from '../../services/JobService';
import { Job } from '../../types/rh';
import { useAuth } from '../../auth';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AiAssistantChatView: React.FC = () => {
  const { user } = useAuth();
  const companyId = user?.companyId || '';

  const [candidates, setCandidates] = useState<JobCandidateApplication[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  
  // Selected context
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  // Chat messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: `👋 **Olá! Sou a RH TRANSFORMA IA**, seu assistente de Inteligência Artificial para Recrutamento e Seleção.

Como posso te ajudar hoje?
- Selecione um **Candidato** e/ou uma **Vaga** no painel superior para contextualizar nossa análise.
- Escolha uma das sugestões rápidas abaixo ou digite qualquer pergunta livremente.`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadContextData();
  }, [companyId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadContextData = async () => {
    try {
      const [candList, jobList] = await Promise.all([
        JobCandidateService.listAll(companyId),
        JobService.listByCompany(companyId)
      ]);
      setCandidates(candList);
      setJobs(jobList);
      if (candList.length > 0) setSelectedCandidateId(candList[0].id);
      if (jobList.length > 0) setSelectedJobId(jobList[0].id);
    } catch (err) {
      console.error('Erro ao carregar contexto para o Chat IA:', err);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputText;
    if (!textToSend.trim() || loading) return;

    // Build context prefix
    const activeCand = candidates.find(c => c.id === selectedCandidateId);
    const activeJob = jobs.find(j => j.id === selectedJobId);

    let contextPrefix = '';
    if (activeCand) {
      contextPrefix += `[CONTEXTO CANDIDATO: ${activeCand.name}, Cargo: ${activeCand.role}, Match: ${activeCand.compatibilityScore}%, Experiência: ${activeCand.experienceYears} anos, Pretensão: ${activeCand.salaryExpectation}]\n`;
    }
    if (activeJob) {
      contextPrefix += `[CONTEXTO VAGA: ${activeJob.title}, Departamento: ${activeJob.department}, Faixa: ${activeJob.salaryRange}]\n`;
    }

    const fullPrompt = contextPrefix ? `${contextPrefix}\n${textToSend}` : textToSend;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInputText('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt })
      });

      const data = await res.json();
      const aiResponseText = data.text || 'Não consegui obter uma resposta da IA no momento.';

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Erro ao chamar Chat IA:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ai',
          text: '⚠️ Ocorreu um erro ao comunicar com o servidor de IA. Por favor, tente novamente.',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick Action Prompts
  const quickChips = [
    { label: '🔍 Analise este candidato', prompt: 'Faça uma análise profunda do candidato selecionado destacando pontos fortes e fracos.' },
    { label: '❓ Crie perguntas para entrevista', prompt: 'Gere um roteiro com 5 perguntas estratégicas baseadas no perfil do candidato e requisitos da vaga.' },
    { label: '⚖️ Compare dois candidatos', prompt: 'Compare o candidato selecionado com outros perfis e indique quem possui maior fit cultural e técnico.' },
    { label: '📋 Gere parecer final', prompt: 'Elabore um parecer executivo estruturado com a sugestão de decisão de contratação.' },
    { label: '✉️ Escrever e-mail de convite', prompt: 'Escreva um e-mail profissional e amigável convidando o candidato para a entrevista online.' }
  ];

  return (
    <div className="h-[750px] bg-white rounded-3xl border border-slate-200 shadow-xl flex flex-col overflow-hidden animate-in fade-in duration-200">
      
      {/* Header with Context Selector */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white border-b border-emerald-800/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                Assistente Virtual RH TRANSFORMA IA
              </h2>
              <p className="text-xs text-slate-300 font-medium">Copiloto inteligente para tomada de decisão no recrutamento</p>
            </div>
          </div>

          <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-amber-300" />
            Gemini 3.6 Flash
          </span>
        </div>

        {/* Context Selector Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <User className="w-3 h-3 text-emerald-400" /> Contexto Candidato
            </label>
            <select
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl p-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Nenhum candidato selecionado</option>
              {candidates.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.role} — Match {c.compatibilityScore}%)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-emerald-400" /> Contexto Vaga
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl p-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Nenhuma vaga selecionada</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.department})
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {msg.sender === 'user' ? 'Você (Recrutador)' : 'RH TRANSFORMA IA'}
              </span>
              <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
            </div>

            <div
              className={`max-w-2xl rounded-2xl p-4 shadow-2xs leading-relaxed text-xs space-y-2 ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white font-medium rounded-tr-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none font-medium'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {msg.sender === 'ai' && (
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="text-[10px] font-bold text-slate-400 hover:text-emerald-600 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    {copiedId === msg.id ? 'Copiado!' : 'Copiar Resposta'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 font-bold bg-white p-3 rounded-2xl border border-slate-200 w-fit animate-pulse">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
            <span>A RH TRANSFORMA IA está digitando...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Chips Bar */}
      <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Prompts Rápido:
        </span>
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip.prompt)}
            disabled={loading}
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-bold whitespace-nowrap transition-colors border border-slate-200 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-4 bg-white border-t border-slate-200 flex items-center gap-3"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Pergunte algo à IA (ex: 'Compare o candidato selecionado com os requisitos da vaga')..."
          className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition-colors cursor-pointer"
        >
          <span>Enviar</span>
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
