import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare, Clock } from 'lucide-react';

export const ContactSection: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('Suporte ao Candidato');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    }, 3000);
  };

  return (
    <section className="py-16 bg-slate-50 text-slate-900 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-indigo-600 font-black text-xs uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            Atendimento & Suporte
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Fale com a Equipe RH TRANSFORMA
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm font-medium">
            Estamos prontos para atender candidatos, empresas parceiras e dúvidas sobre a plataforma.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Contact Cards Info */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                Canais Comerciais e Atendimento
              </h3>

              <div className="space-y-3 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Central Telefônica / WhatsApp</span>
                    <span className="text-slate-900 font-extrabold">(11) 4003-8890 / (11) 99887-1000</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">E-mail Comercial & Vagas</span>
                    <span className="text-slate-900 font-extrabold">contato@maisrhbrasil.com.br</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Sede Corporativa</span>
                    <span className="text-slate-900 font-extrabold">Av. Paulista, 1100 - Bela Vista, São Paulo - SP</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Horário de Atendimento</span>
                    <span className="text-slate-900 font-extrabold">Segunda a Sexta, das 08h às 18h</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-base font-black text-slate-900">Envie uma Mensagem</h3>

              {submitted ? (
                <div className="py-10 text-center space-y-3 animate-fade-in bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="text-lg font-black text-emerald-950">Mensagem Enviada!</h4>
                  <p className="text-xs text-emerald-800 font-medium">
                    Agradecemos o contato. Nossa equipe responderá no e-mail informado em até 24 horas úteis.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Seu Nome *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Ana Maria"
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">E-mail para Resposta *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ana@email.com"
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 99999-0000"
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Assunto Principal</label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Suporte ao Candidato">Suporte ao Candidato</option>
                        <option value="Proposta para Empresa">Proposta Comercial Empresa</option>
                        <option value="Dúvidas sobre Vagas">Dúvidas sobre Vagas</option>
                        <option value="Parcerias">Parcerias & Imprensa</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sua Mensagem *</label>
                    <textarea
                      rows={4}
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Escreva aqui como podemos ajudar..."
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-amber-400" />
                    <span>Enviar Mensagem</span>
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
