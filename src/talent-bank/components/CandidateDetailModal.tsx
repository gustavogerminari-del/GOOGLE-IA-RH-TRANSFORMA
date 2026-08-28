import React, { useState } from 'react';
import {
  X,
  MapPin,
  Mail,
  Phone,
  DollarSign,
  Award,
  Briefcase,
  GraduationCap,
  FileText,
  Download,
  Building2,
  Edit3,
  Clock,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { Candidate } from '../types/candidate';
import { Job } from '../../jobs';
import { CandidateClassificationBadge, CandidateStatusBadge } from './CandidateClassificationBadge';
import { Button } from '../../shared';
import { CandidateScreeningModal } from '../../ai/components/CandidateScreeningModal';

export interface CandidateDetailModalProps {
  candidate: Candidate | null;
  jobs: Job[];
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (candidate: Candidate) => void;
  onAssignToJob?: (candidateId: string, jobId: string) => void;
  canEdit?: boolean;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  jobs,
  isOpen,
  onClose,
  onEdit,
  onAssignToJob,
  canEdit = true,
}) => {
  const [showScreening, setShowScreening] = useState(false);

  if (!isOpen || !candidate) return null;

  const currentJob = jobs.find((j) => j.id === candidate.currentJobId);

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

        {/* Profile Header */}
        <div className="flex items-center gap-4 flex-wrap pr-8">
          <img
            src={candidate.avatar}
            alt={candidate.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 shadow-sm shrink-0"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">{candidate.name}</h3>
              <CandidateClassificationBadge classification={candidate.classification} size="md" />
              <CandidateStatusBadge status={candidate.status} />
            </div>
            <p className="text-sm font-bold text-indigo-700">{candidate.role}</p>
            <p className="text-xs text-slate-500">
              Área: <strong className="text-slate-800">{candidate.departmentArea}</strong> • Origem:{' '}
              {candidate.source}
            </p>
          </div>
        </div>

        {/* Basic Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">E-mail</span>
              <span className="font-semibold text-slate-800">{candidate.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Telefone</span>
              <span className="font-semibold text-slate-800">{candidate.phone}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Localização</span>
              <span className="font-semibold text-slate-800">{candidate.location}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Pretensão Salarial</span>
              <span className="font-semibold text-slate-800">{candidate.salaryExpectation || 'Não informada'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Anos de Experiência</span>
              <span className="font-semibold text-slate-800">{candidate.experienceYears} Anos</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Disponibilidade</span>
              <span className="font-semibold text-slate-800">{candidate.availability}</span>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Competências Técnicas
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {candidate.skills.map((sk) => (
              <span
                key={sk}
                className="bg-indigo-50 text-indigo-800 text-xs font-bold px-3 py-1 rounded-lg border border-indigo-100"
              >
                {sk}
              </span>
            ))}
          </div>
        </div>

        {/* Work Experience History */}
        {candidate.workHistory && candidate.workHistory.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-indigo-600" /> Histórico Profissional
            </h4>
            <div className="space-y-2">
              {candidate.workHistory.map((exp, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-extrabold text-slate-900">
                    <span>{exp.role} — <strong className="text-indigo-700">{exp.company}</strong></span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">{exp.period}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education History */}
        {candidate.educationHistory && candidate.educationHistory.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-600" /> Formação Acadêmica
            </h4>
            <div className="space-y-2">
              {candidate.educationHistory.map((edu, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-slate-900">{edu.degree} em {edu.fieldOfStudy}</span>
                    <span className="text-slate-500 block">{edu.institution}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">{edu.completionYear}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents / Curriculum Attached */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-600" /> Anexos & Currículos
          </h4>
          {candidate.documents && candidate.documents.length > 0 ? (
            <div className="space-y-2">
              {candidate.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="font-extrabold text-slate-900 block">{doc.fileName}</span>
                      <span className="text-[10px] text-slate-400">
                        {doc.fileSize} • Upload em {doc.uploadedAt}
                      </span>
                    </div>
                  </div>

                  <a
                    href={doc.downloadUrl}
                    onClick={(e) => {
                      e.preventDefault();
                      alert(`Iniciando download simulado de: ${doc.fileName}`);
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 italic">
              Nenhum documento anexado ainda.
            </div>
          )}
        </div>

        {/* Parecer / Internal Notes */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Parecer de Recrutamento & Observações
          </h4>
          <p className="text-xs text-slate-700 bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl leading-relaxed">
            {candidate.notes || 'Nenhuma observação cadastrada.'}
          </p>
        </div>

        {/* Assign to Job */}
        {onAssignToJob && (
          <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200 space-y-2">
            <h4 className="text-xs font-extrabold text-indigo-900 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-600" /> Vinculação de Vaga
            </h4>
            {currentJob && (
              <p className="text-xs text-slate-600">
                Atualmente vinculado a: <strong className="text-slate-900">{currentJob.title}</strong>
              </p>
            )}
            <div className="flex gap-2">
              <select
                defaultValue={candidate.currentJobId || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    onAssignToJob(candidate.id, e.target.value);
                  }
                }}
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 font-bold outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="">Selecione uma vaga para alocar o candidato...</option>
                {jobs
                  .filter((j) => j.status === 'Aberta')
                  .map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.department})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={() => setShowScreening(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Triagem IA & Score</span>
          </button>

          <div className="flex items-center gap-2">
            {canEdit && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(candidate);
                }}
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Editar Perfil
              </Button>
            )}

            <Button variant="primary" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>

        <CandidateScreeningModal
          isOpen={showScreening}
          onClose={() => setShowScreening(false)}
          candidate={{
            id: candidate.id,
            name: candidate.name,
            role: candidate.role,
            skills: candidate.skills,
            experience: candidate.experienceSummary,
            summary: candidate.experienceSummary,
            appliedJobId: candidate.currentJobId,
            appliedJobTitle: currentJob?.title
          }}
        />
      </div>
    </div>
  );
};
