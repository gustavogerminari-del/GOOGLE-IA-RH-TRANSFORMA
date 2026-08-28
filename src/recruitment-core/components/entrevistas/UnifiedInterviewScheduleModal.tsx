import React, { useState } from 'react';
import { X, Calendar, Clock, Video, User, Briefcase, Building2 } from 'lucide-react';
import { 
  UnifiedInterview, 
  UnifiedCandidate, 
  UnifiedJob, 
  OrigemProcesso, 
  InterviewType 
} from '../../types/recruitment';

interface UnifiedInterviewScheduleModalProps {
  candidate?: UnifiedCandidate | null;
  job?: UnifiedJob | null;
  origemProcesso?: OrigemProcesso;
  onClose: () => void;
  onSchedule: (interview: UnifiedInterview) => void;
}

export const UnifiedInterviewScheduleModal: React.FC<UnifiedInterviewScheduleModalProps> = ({
  candidate,
  job,
  origemProcesso = 'recrutamento_interno',
  onClose,
  onSchedule
}) => {
  const isHeadhunter = origemProcesso === 'headhunter';

  const [candidatoNome, setCandidatoNome] = useState(candidate?.nome || candidate?.name || 'Candidato Exemplo');
  const [vagaTitulo, setVagaTitulo] = useState(job?.titulo || job?.title || 'Vaga Exemplo');
  const [clienteNome, setClienteNome] = useState(job?.clienteNome || 'Cliente Corporativo');
  const [entrevistadorNome, setEntrevistadorNome] = useState('Carlos Headhunter');
  const [dataHora, setDataHora] = useState('2026-03-30T10:00');
  const [tipo, setTipo] = useState<InterviewType>(isHeadhunter ? 'Entrevista Headhunter' : 'Entrevista RH');
  const [modalidade, setModalidade] = useState<'Presencial' | 'Online (Meet)' | 'Online (Teams)' | 'Telefone'>('Online (Meet)');
  const [salaVirtualUrl, setSalaVirtualUrl] = useState('https://meet.google.com/abc-defg-hij');
  const [pauta, setPauta] = useState('Alinhamento de perfil, avaliação de competências técnicas e culturais.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newInterview: UnifiedInterview = {
      id: `int-${Date.now()}`,
      empresaId: job?.empresaId || candidate?.empresaId || '',
      origemProcesso: origemProcesso as OrigemProcesso,
      candidatoId: candidate?.id || `cand-${Date.now()}`,
      candidatoNome,
      candidateRole: candidate?.cargoAtual || candidate?.role || 'Profissional',
      vagaId: job?.id || `vaga-${Date.now()}`,
      vagaTitulo,
      clienteId: job?.clienteId,
      clienteNome: isHeadhunter ? clienteNome : undefined,
      entrevistadorNome,
      interviewerName: entrevistadorNome,
      dataHora,
      date: dataHora.split('T')[0],
      time: dataHora.split('T')[1] || '10:00',
      tipo,
      modalidade,
      salaVirtualUrl,
      status: 'Agendada',
      pauta
    };

    onSchedule(newInterview);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black text-slate-900">Agendar Entrevista</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Candidato</label>
            <input
              required
              type="text"
              value={candidatoNome}
              onChange={e => setCandidatoNome(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Vaga do Processo</label>
            <input
              required
              type="text"
              value={vagaTitulo}
              onChange={e => setVagaTitulo(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            />
          </div>

          {isHeadhunter && (
            <div>
              <label className="block font-bold text-indigo-900 mb-1">Cliente Contratante</label>
              <input
                type="text"
                value={clienteNome}
                onChange={e => setClienteNome(e.target.value)}
                className="w-full p-2 bg-indigo-50/50 border border-indigo-100 rounded-xl font-bold text-indigo-950"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tipo de Entrevista</label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value as InterviewType)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              >
                <option value="Triagem">Triagem</option>
                <option value="Entrevista RH">Entrevista RH</option>
                <option value="Teste Técnico">Teste Técnico</option>
                <option value="Entrevista com Gestor">Entrevista com Gestor</option>
                <option value="Fit Cultural">Fit Cultural</option>
                <option value="Entrevista Headhunter">Entrevista Headhunter</option>
                <option value="Entrevista Cliente">Entrevista Cliente</option>
                <option value="Entrevista Executiva">Entrevista Executiva</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Data e Horário</label>
              <input
                required
                type="datetime-local"
                value={dataHora}
                onChange={e => setDataHora(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Modalidade</label>
              <select
                value={modalidade}
                onChange={e => setModalidade(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="Online (Meet)">Online (Google Meet)</option>
                <option value="Online (Teams)">Online (MS Teams)</option>
                <option value="Presencial">Presencial</option>
                <option value="Telefone">Telefone / Chamada</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Entrevistador / Responsável</label>
              <input
                type="text"
                value={entrevistadorNome}
                onChange={e => setEntrevistadorNome(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Link da Sala Virtual / Local</label>
            <input
              type="text"
              value={salaVirtualUrl}
              onChange={e => setSalaVirtualUrl(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Pauta / Tópicos a Abordar</label>
            <input
              type="text"
              value={pauta}
              onChange={e => setPauta(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              Confirmar Agendamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
