import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Plus,
  Trash2,
  FileText,
  Upload,
  ShieldAlert,
  Award,
  DollarSign,
} from 'lucide-react';
import {
  Candidate,
  CandidateClassification,
  CandidateStatus,
  AvailabilityType,
  WorkExperience,
  EducationInfo,
} from '../types/candidate';
import {
  CANDIDATE_CLASSIFICATION_OPTIONS,
  CANDIDATE_STATUS_OPTIONS,
  AVAILABILITY_OPTIONS,
  DEPARTMENT_AREAS,
  COMMON_SKILLS,
} from '../constants/candidateOptions';
import { useAuth } from '../../auth';
import { Button, Input, Select } from '../../shared';

export interface CandidateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCandidate: (
    candidateData: Omit<Candidate, 'id' | 'createdAt'> & { resumeFile?: File },
    existingId?: string
  ) => Promise<void> | void;
  initialCandidate?: Candidate | null;
}

export const CandidateFormModal: React.FC<CandidateFormModalProps> = ({
  isOpen,
  onClose,
  onSaveCandidate,
  initialCandidate,
}) => {
  const { user, hasActionAccess } = useAuth();

  const isEditing = !!initialCandidate;

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [departmentArea, setDepartmentArea] = useState('');
  const [location, setLocation] = useState('');
  const [avatar, setAvatar] = useState('');
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [salaryExpectation, setSalaryExpectation] = useState('');
  const [availability, setAvailability] = useState<AvailabilityType>('A combinar');
  const [status, setStatus] = useState<CandidateStatus>('Ativo');
  const [classification, setClassification] = useState<CandidateClassification>('Pendente');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillText, setNewSkillText] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('Banco de Talentos');
  const [fileNameAttached, setFileNameAttached] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Experience state
  const [companyName, setCompanyName] = useState('');
  const [expRole, setExpRole] = useState('');
  const [expPeriod, setExpPeriod] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [workHistory, setWorkHistory] = useState<WorkExperience[]>([]);

  const [error, setError] = useState('');

  useEffect(() => {
    if (initialCandidate) {
      setName(initialCandidate.name);
      setEmail(initialCandidate.email);
      setPhone(initialCandidate.phone);
      setRole(initialCandidate.role);
      setDepartmentArea(initialCandidate.departmentArea || DEPARTMENT_AREAS[0]);
      setLocation(initialCandidate.location);
      setAvatar(initialCandidate.avatar || '');
      setExperienceYears(initialCandidate.experienceYears);
      setSalaryExpectation(initialCandidate.salaryExpectation || '');
      setAvailability(initialCandidate.availability || 'Imediata');
      setStatus(initialCandidate.status);
      setClassification(initialCandidate.classification || 'Recomendado');
      setSkills(initialCandidate.skills || []);
      setNotes(initialCandidate.notes || '');
      setSource(initialCandidate.source || 'Banco de Talentos');
      setWorkHistory(initialCandidate.workHistory || []);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setRole('');
      setDepartmentArea('');
      setLocation('');
      setAvatar('');
      setExperienceYears(0);
      setSalaryExpectation('');
      setAvailability('A combinar');
      setStatus('Ativo');
      setClassification('Pendente');
      setSkills([]);
      setNotes('');
      setSource('Banco de Talentos');
      setWorkHistory([]);
      setFileNameAttached('');
      setResumeFile(null);
    }
    setError('');
  }, [initialCandidate, isOpen]);

  if (!isOpen) return null;

  const handleAddSkill = (skillToAdd: string) => {
    const clean = skillToAdd.trim();
    if (!clean || skills.includes(clean)) return;
    setSkills((prev) => [...prev, clean]);
    setNewSkillText('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleAddWorkExperience = () => {
    if (!companyName.trim() || !expRole.trim()) return;
    setWorkHistory((prev) => [
      ...prev,
      {
        company: companyName.trim(),
        role: expRole.trim(),
        period: expPeriod.trim(),
        description: expDesc.trim(),
      },
    ]);
    setCompanyName('');
    setExpRole('');
    setExpPeriod('');
    setExpDesc('');
  };

  const handleRemoveWorkExperience = (index: number) => {
    setWorkHistory((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileNameAttached(e.target.files[0].name);
      setResumeFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || (!email.trim() && !phone.trim()) || !role.trim()) {
      setError('Preencha Nome, Cargo Pretendido e pelo menos um contato: E-mail ou Telefone.');
      return;
    }

    if (skills.length === 0) {
      setError('Cadastre ao menos uma competência técnica para o perfil.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSaveCandidate({
        name,
        email,
        phone,
        role,
        departmentArea,
        location,
        avatar: avatar || '',
        experienceYears: Math.max(0, Number(experienceYears) || 0),
        salaryExpectation,
        availability,
        status,
        classification,
        skills,
        workHistory,
        documents: initialCandidate?.documents || [],
        resumeFile: resumeFile || undefined,
        notes,
        source,
        currentJobId: initialCandidate?.currentJobId,
      }, initialCandidate?.id);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Não foi possível salvar o talento.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-extrabold text-slate-900">
            {isEditing ? 'Editar Talento Mapeado' : 'Cadastrar Novo Candidato no Banco'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nome Completo *"
              placeholder="Ex: Mariana Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="E-mail Corporativo/Pessoal"
              type="email"
              placeholder="mariana@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Telefone / WhatsApp (obrigatório se não informar e-mail)"
              placeholder="(11) 98888-7777"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <Input
              label="Cargo / Posição Pretendida *"
              placeholder="Ex: Dev React Senior"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            />

            <Select
              label="Área Profissional"
              value={departmentArea}
              onChange={(e) => setDepartmentArea(e.target.value)}
              options={[{ value: '', label: 'Selecione a área...' }, ...DEPARTMENT_AREAS.map((a) => ({ value: a, label: a }))]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Localização"
              placeholder="Ex: São Paulo - SP"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <Input
              type="number"
              label="Anos de Experiência"
              value={experienceYears}
              onChange={(e) => setExperienceYears(Number(e.target.value))}
              min={0}
            />

            <Input
              label="Pretensão Salarial"
              placeholder="Ex: R$ 10.000 / mês"
              value={salaryExpectation}
              onChange={(e) => setSalaryExpectation(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Disponibilidade"
              value={availability}
              onChange={(e) => setAvailability(e.target.value as AvailabilityType)}
              options={AVAILABILITY_OPTIONS.map((a) => ({ value: a, label: a }))}
            />

            <Select
              label="Status do Candidato"
              value={status}
              onChange={(e) => setStatus(e.target.value as CandidateStatus)}
              options={CANDIDATE_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
            />

            <Select
              label="Classificação / Tag"
              value={classification}
              onChange={(e) => setClassification(e.target.value as CandidateClassification)}
              options={CANDIDATE_CLASSIFICATION_OPTIONS.map((c) => ({ value: c, label: c }))}
            />
          </div>

          {/* Skills Picker */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 block">
              Competências & Habilidades Tabela
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: React, Node, SQL..."
                value={newSkillText}
                onChange={(e) => setNewSkillText(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddSkill(newSkillText)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Adicionar
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {skills.map((sk) => (
                <span
                  key={sk}
                  className="bg-indigo-50 text-indigo-800 text-xs font-bold px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center gap-1"
                >
                  {sk}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(sk)}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Work History Builder */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 block">
              Histórico Profissional (Opcional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <Input
                placeholder="Empresa"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <Input
                placeholder="Cargo de Atuação"
                value={expRole}
                onChange={(e) => setExpRole(e.target.value)}
              />
              <div className="flex gap-1">
                <Input
                  placeholder="Período ex: 2022-2025"
                  value={expPeriod}
                  onChange={(e) => setExpPeriod(e.target.value)}
                />
                <Button type="button" variant="primary" size="sm" onClick={handleAddWorkExperience}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {workHistory.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {workHistory.map((wh, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800"
                  >
                    <span>
                      <strong>{wh.role}</strong> na {wh.company} ({wh.period})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveWorkExperience(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resume Upload Simulation */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 block">Anexo de Currículo (PDF/Word)</label>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <Upload className="w-5 h-5 text-indigo-600 shrink-0" />
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
              {fileNameAttached && (
                <span className="text-emerald-700 font-extrabold truncate">Anexado: {fileNameAttached}</span>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700">
              Parecer do Recrutador & Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-3 outline-none focus:border-indigo-500 font-medium"
              placeholder="Escreva impressões sobre o perfil, pretensão ou habilidades socioemocionais..."
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Cadastrar no Banco'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
