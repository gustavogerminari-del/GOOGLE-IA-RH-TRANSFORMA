import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, Loader2, MessageSquare, Plus, Zap, Copy, Check } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface MaisRhIaChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MaisRhIaChatModal: React.FC<MaisRhIaChatModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'Olá! Sou a **RH TRANSFORMA IA**, sua assistente especialista em recrutamento, seleção e gestão de talentos.\n\nComo posso ajudar seu time hoje? Você pode me pedir para **criar uma vaga**, **analisar candidatos** ou **sugerir perguntas de entrevista**.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToSend }),
      });

      const data = await response.json();
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.text || 'Desculpe, tive uma oscilação momentânea na conexão com o servidor de IA.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Erro no chat IA:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: 'Ocorreu um erro ao conectar com o serviço da IA. Por favor, tente novamente em instantes.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Crie uma vaga de vendedor B2B',
    'Analise estes candidatos para Dev Senior',
    'Quais perguntas devo fazer para gerente de produto?',
    'Como calcular o turnover e absenteísmo da equipe?'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Bot className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">Chat RH TRANSFORMA IA</h2>
                <span className="bg-emerald-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase">
                  Ativo
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                Assistente Virtual do Sistema RH TRANSFORMA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Quick Prompts Bar */}
        <div className="bg-slate-50 border-b border-slate-200/80 p-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <Zap className="w-4 h-4 text-amber-500 shrink-0 ml-1" />
          <span className="text-[11px] font-bold text-slate-500 shrink-0">Sugestões rápidas:</span>
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp)}
              disabled={loading}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-xs font-semibold rounded-lg shrink-0 transition-colors shadow-2xs cursor-pointer"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Messages List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 bg-slate-100/40">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-slate-800 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-4 shadow-2xs text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-slate-800 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <span
                  className={`text-[10px] block mt-2 text-right ${
                    msg.sender === 'user' ? 'text-slate-400' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-2xs flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>Digitando resposta...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua dúvida ou solicitação (ex: 'Crie uma vaga de vendedor')..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-hidden"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
