import React from 'react';
import {
  MapPin,
  Award,
  DollarSign,
  Briefcase,
  ChevronRight,
  Edit3,
  Trash2,
  FileText,
  Clock,
} from 'lucide-react';
import { Candidate } from '../types/candidate';
import { Job } from '../../jobs';
import { CandidateClassificationBadge, CandidateStatusBadge } from './CandidateClassificationBadge';
import { Card, Button } from '../../shared';

export interface CandidateCardProps {
  candidate: Candidate;
  linkedJob?: Job;
  onViewDetails: (candidate: Candidate) => void;
  onEditCandidate?: (candidate: Candidate) => void;
  onDeleteCandidate?: (candidateId: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  linkedJob,
  onViewDetails,
  onEditCandidate,
  onDeleteCandidate,
  canEdit = true,
  canDelete = true,
}) => {
  return (
    <Card className="p-5 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all group">
      <div className="space-y-3">
        {/* Header: Photo, Name, Classification & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={candidate.avatar}
              alt={candidate.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 shadow-2xs shrink-0"
            />
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug truncate">
                {candidate.name}
              </h3>
              <p className="text-xs font-bold text-indigo-700 mt-0.5 truncate">
                {candidate.role}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <CandidateClassificationBadge classification={candidate.classification} />
            <CandidateStatusBadge status={candidate.status} />
          </div>
        </div>

        {/* Basic Meta Details */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 font-medium">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{candidate.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{candidate.experienceYears} anos exp.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{candidate.salaryExpectation || 'Não informada'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Disp: {candidate.availability}</span>
          </div>
        </div>

        {/* Skills Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {candidate.skills.slice(0, 4).map((sk) => (
            <span
              key={sk}
              className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200"
            >
              {sk}
            </span>
          ))}
          {candidate.skills.length > 4 && (
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border border-indigo-100">
              +{candidate.skills.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Footer: Linked Job & Actions */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        {linkedJob ? (
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Vaga Vinculada:</span>
            <span className="font-extrabold text-slate-900 truncate block">{linkedJob.title}</span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 font-medium italic">
            Nenhuma vaga vinculada atualmente
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {canEdit && onEditCandidate && (
              <button
                type="button"
                onClick={() => onEditCandidate(candidate)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Editar Candidato"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {canDelete && onDeleteCandidate && (
              <button
                type="button"
                onClick={() => onDeleteCandidate(candidate.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Excluir Perfil"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(candidate)}
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          >
            Perfil Completo
          </Button>
        </div>
      </div>
    </Card>
  );
};
