import React, { useState } from 'react';
import { X, User, Briefcase, Mail, Phone, MapPin, DollarSign } from 'lucide-react';
import { UnifiedCandidate, OrigemProcesso } from '../../types/recruitment';

interface UnifiedCandidateFormModalProps {
  origemProcesso?: OrigemProcesso;
  existingCandidate?: UnifiedCandidate | null;
  onClose: () => void;
  onSave: (candidateData: UnifiedCandidate) => void;
}

export const UnifiedCandidateFormModal: React.FC<UnifiedCandidateFormModalProps> = ({
  origemProcesso = 'recrutamento_interno',
  existingCandidate,
  onClose,
  onSave
}) => {
  const [nome, setNome] = useState(existingCandidate?.nome || existingCandidate?.name || '');
  const [email, setEmail] = useState(existingCandidate?.email || '');
  const [telefone, setTelefone] = useState(existingCandidate?.telefone || existingCandidate?.phone || '');
  const [cargoAtual, setCargoAtual] = useState(existingCandidate?.cargoAtual || existingCandidate?.role || '');
  const [cidade, setCidade] = useState(existingCandidate?.cidade || existingCandidate?.location || 'São Paulo - SP');
  const [pretensaoSalarial, setPretensaoSalarial] = useState(existingCandidate?.pretensaoSalarial || 8000);
  const [experienciaAnos, setExperienciaAnos] = useState(existingCandidate?.experienciaAnos || existingCandidate?.experienceYears || 3);
  const [competenciasInput, setCompetenciasInput] = useState((existingCandidate?.competencias || existingCandidate?.skills || []).join(', '));
  const [curriculoTexto, setCurriculoTexto] = useState(existingCandidate?.curriculoTexto || existingCandidate?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const skillsArr = competenciasInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const newCandidate: UnifiedCandidate = {
      id: existingCandidate?.id || `cand-${Date.now()}`,
      empresaId: existingCandidate?.empresaId || '',
      nome,
      name: nome,
      email,
      telefone,
      phone: telefone,
      cargoAtual,
      role: cargoAtual,
      cidade,
      location: cidade,
      pretensaoSalarial: Number(pretensaoSalarial),
      experienciaAnos: Number(experienciaAnos),
      experienceYears: Number(experienciaAnos),
      competencias: skillsArr,
      skills: skillsArr,
      status: existingCandidate?.status || 'Ativo',
      curriculoTexto,
      notes: curriculoTexto,
      appliedDate: existingCandidate?.appliedDate || new Date().toISOString().split('T')[0],
      source: existingCandidate?.source || 'Site Institucional'
    };

    onSave(newCandidate);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black text-slate-900">
              {existingCandidate ? 'Editar Cadastro de Candidato' : 'Novo Candidato no Banco de Talentos'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
              <input
                required
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Carlos Oliveira"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">E-mail *</label>
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
              <input
                type="text"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Cargo Atual / Especialidade</label>
              <input
                type="text"
                value={cargoAtual}
                onChange={e => setCargoAtual(e.target.value)}
                placeholder="Ex: Desenvolvedor Senior"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Cidade / Estado</label>
              <input
                type="text"
                value={cidade}
                onChange={e => setCidade(e.target.value)}
                placeholder="São Paulo - SP"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pretensão Salarial (R$)</label>
              <input
                type="number"
                value={pretensaoSalarial}
                onChange={e => setPretensaoSalarial(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Anos de Experiência</label>
              <input
                type="number"
                value={experienciaAnos}
                onChange={e => setExperienciaAnos(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Competências e Habilidades (Separadas por vírgula)</label>
            <input
              type="text"
              value={competenciasInput}
              onChange={e => setCompetenciasInput(e.target.value)}
              placeholder="React, TypeScript, Node.js, Gestão de Equipes"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Resumo de Experiências / Anotações</label>
            <textarea
              rows={3}
              value={curriculoTexto}
              onChange={e => setCurriculoTexto(e.target.value)}
              placeholder="Breve resumo sobre histórico profissional..."
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
              Salvar Candidato
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
