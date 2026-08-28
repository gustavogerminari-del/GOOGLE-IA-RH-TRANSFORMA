import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  Loader2, 
  Minus, 
  X, 
  Maximize2, 
  Minimize2, 
  Trash2, 
  Zap, 
  Copy, 
  Check, 
  Compass, 
  ShieldCheck,
  FileText,
  UserCheck,
  Briefcase,
  BarChart3,
  HelpCircle,
  ArrowRight,
  Paperclip
} from 'lucide-react';
import { useAuth } from '../auth';
import { auth } from '../lib/firebase';
import { getCompanyId } from '../auth/profile';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  contextPage?: string;
}

interface FloatingAiAssistantProps {
  activeTab?: string;
  onNavigateToTab?: (tab: string) => void;
}

export const FloatingAiAssistant: React.FC<FloatingAiAssistantProps> = ({
  activeTab = 'dashboard',
  onNavigateToTab,
}) => {
  const { user } = useAuth();
  const companyId = getCompanyId(user) || '';
  
  // States: 'closed' | 'open' | 'minimized'
  const [viewState, setViewState] = useState<'closed' | 'open' | 'minimized'>('closed');
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState<{ fileName: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial greeting
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: `Olá, ${user?.name ? user.name.split(' ')[0] : 'gestor'}! Sou o **RH TRANSFORMA IA**, seu assistente e consultor sênior de Inteligência Artificial para Recursos Humanos.

Estou pronto para te ajudar com:
- 📝 **Criar e Aprimorar Vagas** completas
- 🔍 **Triagem e Análise de Currículos**
- 🎯 **Roteiros de Entrevistas** por competências
- 📈 **Relatórios e Indicadores** de R&S
- ⚖️ **Dúvidas de CLT, Benefícios e Ponto**

Como posso auxiliar seu time hoje?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewState === 'open') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, viewState]);

  // Page title mapping
  const getPageTitle = (tab: string): string => {
    switch (tab) {
      case 'vagas':
        return 'Portal de Vagas e Processos Seletivos';
      case 'banco-talentos':
        return 'Banco de Talentos & Candidatos';
      case 'entrevistas':
        return 'Agendamento e Avaliação de Entrevistas';
      case 'relatorios':
        return 'Relatórios e Indicadores de RH';
      case 'empresa':
        return 'Dados da Empresa & Departamentos';
      case 'equipe-interna':
        return 'Gestão da Equipe de RH';
      case 'consultor-rh':
        return 'Consultor Estratégico de RH';
      case 'ferias-beneficios':
        return 'Férias & Benefícios Corporativos';
      case 'documentos':
        return 'Gestão e Assinatura de Documentos';
      case 'folha-pagamento':
        return 'Folha de Pagamento';
      case 'ponto-digital':
        return 'Ponto Digital e Frequência';
      case 'acesso-master':
        return 'Painel Master Administrador';
      case 'mais-rh-ia':
        return 'Módulo Oficial RH TRANSFORMA IA';
      default:
        return 'Dashboard de Gestão de RH';
    }
  };

  // Dynamic quick prompts based on context
  const getContextPrompts = (tab: string): string[] => {
    switch (tab) {
      case 'vagas':
        return [
          'Crie uma vaga de Auxiliar Administrativo',
          'Quais requisitos exigir para Desenvolvedor Senior?',
          'Como elaborar um texto atrativo para o LinkedIn?'
        ];
      case 'banco-talentos':
        return [
          'Analise o perfil ideal para vaga em aberto',
          'Como estruturar critérios de triagem com IA?',
          'Dicas para dar feedback de não aprovação'
        ];
      case 'entrevistas':
        return [
          'Crie 5 perguntas de entrevista por competências (STAR)',
          'Como avaliar maturidade comportamental em candidatos?',
          'Gerar ficha de avaliação de entrevista técnica'
        ];
      case 'relatorios':
        return [
          'Mostre os principais indicadores de recrutamento (KPIs)',
          'Como reduzir o tempo médio de contratação (Time-to-Hire)?',
          'Resumir métricas de turnover e absenteísmo'
        ];
      case 'ponto-digital':
      case 'folha-pagamento':
        return [
          'Quais são as regras de horas extras e DSR na CLT?',
          'Como calcular adicionais e folha de pagamento?',
          'Dicas para gestão de jornada e escala flexível'
        ];
      default:
        return [
          'Crie uma vaga de vendedor B2B',
          'Analise a compatibilidade do candidato com a vaga',
          'Gerar roteiro de entrevista com 5 perguntas',
          'Mostre o desempenho geral do recrutamento'
        ];
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setAttachment({
        fileName: file.name,
        content: content || ''
      });
    };
    reader.readAsText(file);
  };

  const handleSend = async (customPrompt?: string) => {
    let textToSend = customPrompt || input;
    if (attachment) {
      textToSend += '\n\n[ANEXO ENVIADO: ' + attachment.fileName + ']\n' + attachment.content.slice(0, 3000);
    }

    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: (customPrompt || input) + (attachment ? ' (Anexo: ' + attachment.fileName + ')' : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      contextPage: getPageTitle(activeTab),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setAttachment(null);
    setLoading(true);

    try {
      if (!companyId) throw new Error('Não foi possível identificar a empresa desta sessão. Entre novamente no sistema.');
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Sua sessão expirou. Entre novamente para utilizar a IA.');

      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          companyId,
          empresaId: companyId,
          action: 'assistente_rh',
          prompt: textToSend,
          pageContext: { activeTab, pageName: getPageTitle(activeTab) },
          userRole: user?.role || user?.tipoUsuario || 'Usuário RH',
          companyName: user?.companyName || user?.tenantName || '',
          history: messages.slice(-8),
        }),
      });

      const raw = await response.text();
      let data: any = {};
      try { data = raw ? JSON.parse(raw) : {}; } catch { data = { error: raw }; }
      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || data?.message || ('A IA recusou a solicitação (HTTP ' + response.status + ').'));
      }

      const structured = data?.data ?? data?.result ?? data?.analysis ?? data;
      const aiText = String(
        data?.text || data?.response || data?.answer ||
        structured?.text || structured?.response || structured?.answer || structured?.summary || structured?.description || ''
      ).trim();
      if (!aiText) throw new Error('A IA retornou uma resposta vazia.');

      const aiMsg: Message = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('[FLOATING_AI_FAILED]', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'ai-err-' + Date.now(),
          sender: 'ai',
          text: err?.message || 'Não foi possível consultar a IA neste momento.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        text: 'Histórico da conversa reiniciado. Como posso te ajudar agora?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const currentPrompts = getContextPrompts(activeTab);

  // Formatting helper for Markdown-like response
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1.5" />;

          // Headers
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-sm font-black text-slate-900 mt-2 mb-1 flex items-center gap-1.5">
                {line.replace('### ', '')}
              </h3>
            );
          }
          if (line.startsWith('#### ')) {
            return (
              <h4 key={idx} className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-2 mb-1">
                {line.replace('#### ', '')}
              </h4>
            );
          }

          // Bullet points
          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            const content = line.trim().substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 pl-1">
                <span className="text-blue-600 font-bold shrink-0">•</span>
                <span>{formatBold(content)}</span>
              </div>
            );
          }

          return (
            <p key={idx} className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {formatBold(line)}
            </p>
          );
        })}
      </div>
    );
  };

  const formatBold = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-black text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* 1. BOTÃO FLUTUANTE INFERIOR DIREITO */}
      {viewState === 'closed' && (
        <div className="fixed bottom-6 right-6 z-50 animate-in zoom-in-95 duration-200">
          {/* Botão Circular Principal */}
          <button
            onClick={() => setViewState('open')}
            className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[#1E293B] via-[#2563EB] to-[#1E40AF] text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-amber-400/90 ring-4 ring-blue-500/20"
            aria-label="Abrir assistente"
          >
            {/* Ícone de IA com Animação Pulse */}
            <div className="relative">
              <Bot className="w-7 h-7 text-white" />
              <Sparkles className="w-3.5 h-3.5 text-amber-300 absolute -top-1 -right-1.5 animate-bounce" />
            </div>

            {/* Badge de Ativo */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            </span>
          </button>
        </div>
      )}

      {/* 2. MINIMIZADO — BARRA FLUTUANTE RECOLHIDA */}
      {viewState === 'minimized' && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200">
          <div className="p-1.5 bg-blue-600 rounded-xl">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-xs font-black tracking-tight block">RH TRANSFORMA IA</span>
            <span className="text-[10px] text-amber-300 font-semibold block">Minimizado • Clique para reabrir</span>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => setViewState('open')}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Expandir Chat"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewState('closed')}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. JANELA LATERAL DO ASSISTENTE IA (ABERTO OU EXPANDIDO) */}
      {viewState === 'open' && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden ${
            isExpanded
              ? 'inset-4 sm:inset-10 max-w-5xl mx-auto my-auto h-[90vh]'
              : 'bottom-6 right-4 sm:right-6 w-full sm:w-[440px] max-w-[calc(100vw-32px)] h-[620px] max-h-[85vh]'
          }`}
        >
          {/* Cabeçalho do Assistente */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-[#1E293B] to-[#2563EB] text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                <Bot className="w-6 h-6 text-amber-300" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1.5">
                    🤖 RH TRANSFORMA IA
                  </h2>
                  <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase">
                    CONSULTOR IA
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium">
                  Seu assistente inteligente de Recursos Humanos
                </p>
              </div>
            </div>

            {/* Ações do Cabeçalho */}
            <div className="flex items-center gap-1 text-slate-300">
              <button
                onClick={handleClearHistory}
                className="p-1.5 hover:bg-white/10 rounded-lg hover:text-amber-300 transition-colors cursor-pointer"
                title="Limpar conversa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:bg-white/10 rounded-lg hover:text-white transition-colors cursor-pointer hidden sm:block"
                title={isExpanded ? 'Restaurar tamanho' : 'Expandir tela'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setViewState('minimized')}
                className="p-1.5 hover:bg-white/10 rounded-lg hover:text-white transition-colors cursor-pointer"
                title="Minimizar"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewState('closed')}
                className="p-1.5 hover:bg-white/10 rounded-lg hover:text-rose-300 transition-colors cursor-pointer ml-1"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-Header de Contexto da Página & Permissão */}
          <div className="bg-slate-100 border-b border-slate-200 px-3.5 py-2 flex items-center justify-between text-xs text-slate-600 font-semibold shrink-0">
            <div className="flex items-center gap-1.5 truncate">
              <Compass className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-[11px] text-slate-500 font-bold shrink-0">Contexto:</span>
              <span className="text-[11px] text-blue-700 font-black truncate">{getPageTitle(activeTab)}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] bg-slate-200/80 px-2 py-0.5 rounded-md font-bold text-slate-700 shrink-0">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>{user?.role || 'Acesso Liberado'}</span>
            </div>
          </div>

          {/* Barra de Sugestões Rápidas (Quick Prompts) */}
          <div className="bg-slate-50 border-b border-slate-200/80 p-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-1" />
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider shrink-0">Prompts:</span>
            {currentPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(qp)}
                disabled={loading}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-800 text-[11px] font-semibold rounded-lg shrink-0 transition-all shadow-2xs cursor-pointer flex items-center gap-1"
              >
                <span>{qp}</span>
              </button>
            ))}
          </div>

          {/* Lista de Mensagens */}
          <div className="p-4 flex-1 overflow-y-auto space-y-4 bg-slate-50/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-slate-800 text-white'
                      : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-amber-300" />}
                </div>

                {/* Balão da Mensagem */}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-2xs relative group ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                  }`}
                >
                  {/* Conteúdo formatado */}
                  {msg.sender === 'user' ? (
                    <p className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    renderFormattedText(msg.text)
                  )}

                  {/* Rodapé da mensagem: Hora + Botão de Copiar */}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/60 text-[10px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'ai' && (
                      <button
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        className="text-slate-400 hover:text-blue-600 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                        title="Copiar resposta"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-2xs flex items-center gap-2 text-xs text-slate-600 font-semibold">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  <span>RH TRANSFORMA IA está analisando e elaborando resposta...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Campo de Envio no Rodapé */}
          <div className="p-3.5 bg-white border-t border-slate-200 shrink-0 space-y-2">
            
            {attachment && (
              <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-bold">
                <span className="truncate flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                  Anexo: {attachment.fileName}
                </span>
                <button
                  onClick={() => setAttachment(null)}
                  className="text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.pdf,.doc,.docx,.csv"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer shrink-0"
                title="Anexar documento ou texto (currículo, edital, vaga)"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Digite sua pergunta ou instrução para a IA..."
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-hidden transition-all"
              />
              <button
                onClick={() => handleSend()}
                disabled={(!input.trim() && !attachment) || loading}
                className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md transition-all disabled:opacity-40 cursor-pointer shrink-0"
                title="Enviar mensagem"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mt-1 px-1">
              <span>RH TRANSFORMA IA v2.5 • Modelo Corporativo Gemini</span>
              <span className="text-emerald-600 font-bold">● Online</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
