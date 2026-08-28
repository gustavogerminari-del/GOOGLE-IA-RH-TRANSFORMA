import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Candidate, Job } from '../types/rh';

interface NewCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (candidate: Omit<Candidate, 'id' | 'appliedDate'>) => void;
  jobs: Job[];
}

export const NewCandidateModal: React.FC<NewCandidateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  jobs,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('São Paulo, SP');
  const [experienceYears, setExperienceYears] = useState(4);
  const [skillsText, setSkillsText] = useState('React, TypeScript, Node.js');
  const [salaryExpectation, setSalaryExpectation] = useState('R$ 10.000');
  const [source, setSource] = useState<'LinkedIn' | 'Indicação' | 'Site Institucional' | 'Gupy' | 'Outro'>('LinkedIn');
  const [currentJobId, setCurrentJobId] = useState<string>('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const skills = skillsText.split(',').map(s => s.trim()).filter(s => s.length > 0);

    onSubmit({
      name,
      email,
      phone,
      role,
      location,
      experienceYears,
      skills,
      status: currentJobId ? 'Em Processo' : 'Ativo',
      currentJobId: currentJobId || undefined,
      currentStageId: currentJobId ? 'triagem' : undefined,
      rating: 4,
      notes: notes || 'Cadastrado no Banco de Talentos RH TRANSFORMA.',
      avatar: '',
      source,
      salaryExpectation,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-indigo-600" />
          <h3 className="text-xl font-extrabold text-slate-900">Cadastrar Novo Talento / Candidato</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Nome Completo *</label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Gabriel Santoro"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-xl font-medium outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Cargo / Função *</label>
            <input
              required
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Ex: Desenvolvedor Front-end Senior"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-xl font-medium outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">E-mail *</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="gabriel@email.com"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-xl font-medium outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Telefone / WhatsApp</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 98765-4321"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-xl font-medium outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Anos de Experiência</label>
            <input
              type="number"
              min={0}
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-xl font-medium outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Pretensão Salarial</label>
            <input
              type="text"
              value={salaryExpectation}
              onChange={(e) => setSalaryExpectation(e.target.value)}
              placeholder="Ex: R$ 10.000"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-xl font-medium outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Canal de Origem</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-xl font-medium outline-none focus:border-indigo-500"
            >
              <option value="LinkedIn">LinkedIn</option>
              <option value="Indicação">Indicação Interna</option>
              <option value="Site Institucional">Site Carreiras</option>
              <option value="Gupy">Gupy / Plataforma Externa</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Vincular a Vaga Aberta (Opcional)</label>
            <select
              value={currentJobId}
              onChange={(e) => setCurrentJobId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-xl font-medium outline-none focus:border-indigo-500"
            >
              <option value="">Apenas guardar no Banco de Talentos</option>
              {jobs.filter(j => j.status === 'Aberta').map(j => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="font-bold text-slate-700">Habilidades Técnicas (separadas por vírgula)</label>
            <input
              type="text"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="React, TypeScript, Node.js, GraphQL"
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-xl font-medium outline-none focus:border-indigo-500"
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="font-bold text-slate-700">Notas / Resumo Inicial</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações preliminares do recrutador..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 p-2.5 rounded-xl font-medium outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
          >
            Salvar Candidato
          </button>
        </div>
      </form>
    </div>
  );
};
