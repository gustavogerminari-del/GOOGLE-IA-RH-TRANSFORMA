import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle2, 
  Phone, 
  Users, 
  MapPin, 
  FileText, 
  Filter, 
  Search,
  X,
  Building2,
  Briefcase
} from 'lucide-react';
import { 
  UnifiedAgendaEvent, 
  OrigemProcesso 
} from '../../types/recruitment';

interface UnifiedAgendaViewProps {
  events: UnifiedAgendaEvent[];
  origemProcesso: OrigemProcesso;
  onAddEvent: (event: UnifiedAgendaEvent) => void;
}

export const UnifiedAgendaView: React.FC<UnifiedAgendaViewProps> = ({
  events,
  origemProcesso,
  onAddEvent
}) => {
  const isHeadhunter = origemProcesso === 'headhunter';

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('Todos');

  // Form states
  const [titulo, setTitulo] = useState('');
  const [tipoEvento, setTipoEvento] = useState<UnifiedAgendaEvent['tipoEvento']>('Reunião');
  const [clienteNome, setClienteNome] = useState('');
  const [candidatoNome, setCandidatoNome] = useState('');
  const [dataHora, setDataHora] = useState('2026-03-31T10:00');
  const [responsavelNome, setResponsavelNome] = useState('Carlos Headhunter');
  const [descricao, setDescricao] = useState('');

  const filteredEvents = events.filter(e => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || 
      e.titulo.toLowerCase().includes(term) ||
      (e.clienteNome && e.clienteNome.toLowerCase().includes(term)) ||
      (e.candidatoNome && e.candidatoNome.toLowerCase().includes(term)) ||
      e.responsavelNome.toLowerCase().includes(term);

    const matchesTipo = tipoFilter === 'Todos' || e.tipoEvento === tipoFilter;

    return matchesSearch && matchesTipo;
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();

    const newEvent: UnifiedAgendaEvent = {
      id: `evt-${Date.now()}`,
      empresaId: '',
      origemProcesso,
      tipoEvento,
      titulo,
      clienteNome: isHeadhunter ? clienteNome : undefined,
      candidatoNome,
      responsavelNome,
      dataHora,
      descricao,
      concluido: false
    };

    onAddEvent(newEvent);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isHeadhunter ? 'Agenda Executive Search & SLA Clientes' : 'Agenda Corporativa & Compromissos'}
            </h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200">
              {events.length} compromissos
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Controle unificado de reuniões, entrevistas, retornos, SLAs, garantias e acompanhamentos.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Novo Compromisso</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, cliente, candidato ou responsável..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Tipo:</span>
            <select
              value={tipoFilter}
              onChange={e => setTipoFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value="Todos">Todos os tipos</option>
              <option value="Reunião">Reunião</option>
              <option value="Entrevista">Entrevista</option>
              <option value="Visita">Visita</option>
              <option value="Follow-up">Follow-up</option>
              <option value="SLA / Prazo">SLA / Prazo</option>
              <option value="Garantia">Garantia</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
            Nenhum compromisso agendado.
          </div>
        ) : (
          filteredEvents.map(evt => (
            <div
              key={evt.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-100">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {evt.tipoEvento}
                    </span>
                    <h4 className="text-sm font-black text-slate-900">{evt.titulo}</h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    {evt.clienteNome && <span>Cliente: <strong className="text-slate-800">{evt.clienteNome}</strong> • </span>}
                    Responsável: {evt.responsavelNome}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 inline-block mb-1">
                  {new Date(evt.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">{evt.descricao}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">Novo Compromisso na Agenda</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título do Compromisso</label>
                <input required type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Alinhamento de perfil com Diretoria" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Evento</label>
                  <select value={tipoEvento} onChange={e => setTipoEvento(e.target.value as any)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold">
                    <option value="Reunião">Reunião</option>
                    <option value="Entrevista">Entrevista</option>
                    <option value="Visita">Visita</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Pendência">Pendência</option>
                    <option value="Retorno">Retorno</option>
                    <option value="Ligação">Ligação</option>
                    <option value="SLA / Prazo">SLA / Prazo</option>
                    <option value="Garantia">Garantia</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Data e Hora</label>
                  <input required type="datetime-local" value={dataHora} onChange={e => setDataHora(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                </div>
              </div>

              {isHeadhunter && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Empresa / Cliente</label>
                  <input type="text" value={clienteNome} onChange={e => setClienteNome(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição</label>
                <input required type="text" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Objetivo do compromisso..." className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-2xs cursor-pointer hover:bg-indigo-700">Agendar Compromisso</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
