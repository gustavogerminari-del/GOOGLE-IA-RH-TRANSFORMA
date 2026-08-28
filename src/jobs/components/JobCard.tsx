import React from 'react';
import {
  MapPin,
  Users,
  Calendar,
  Building2,
  DollarSign,
  ChevronRight,
  Edit3,
  Archive,
  RotateCcw,
  UserCheck,
  Briefcase,
} from 'lucide-react';
import { Job } from '../types/job';
import { JobStatusBadge } from './JobStatusBadge';
import { Card, Button } from '../../shared';
import { formatDateBR } from '../../core';

export interface JobCardProps {
  job: Job;
  onViewDetails: (job: Job) => void;
  onManageCandidates?: (job: Job) => void;
  onEditJob?: (job: Job) => void;
  onArchiveJob?: (jobId: string) => void;
  onRestoreJob?: (jobId: string) => void;
  canEdit?: boolean;
  canArchive?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onViewDetails,
  onManageCandidates,
  onEditJob,
  onArchiveJob,
  onRestoreJob,
  canEdit = true,
  canArchive = true,
}) => {
  const isArchived = job.status === 'Arquivada' || (job as any).archived === true || (job as any).isArchived === true;

  return (
    <Card className="p-5 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all group">
      <div className="space-y-3">
        {/* Top Header: Dept & Status */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1.5">
            <Building2 className="w-3 h-3 text-indigo-500" />
            {job.department}
          </span>
          <JobStatusBadge status={job.status} />
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
            {job.title}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {job.description}
          </p>
        </div>

        {/* Key Characteristics */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 font-medium">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{job.location} ({job.locationType})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <span>Contrato: <strong>{job.type}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span><strong>{job.openings}</strong> vaga(s) • <strong>{job.applicantsCount}</strong> cands</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Prazo: {formatDateBR(job.deadline)}</span>
          </div>
        </div>
      </div>

      {/* Footer: Budget & Action Buttons */}
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Faixa Salarial / Orçamento</span>
            <span className="font-extrabold text-slate-900">{job.salaryRange}</span>
          </div>

          {job.budget && (
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              CC: {job.budget.centerCostCode}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-slate-400" />
            <span>Resp: <strong className="text-slate-800">{job.recruiterName}</strong></span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {canEdit && onEditJob && (
              <button
                type="button"
                onClick={() => onEditJob(job)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Editar Vaga"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            {isArchived ? (
              canArchive && onRestoreJob && (
                <button
                  type="button"
                  onClick={() => onRestoreJob(job.id)}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                  title="Restaurar Vaga"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )
            ) : (
              canArchive && onArchiveJob && (
                <button
                  type="button"
                  onClick={() => onArchiveJob(job.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Arquivar Vaga"
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>
              )
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(job)}
            >
              Detalhes
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => onManageCandidates ? onManageCandidates(job) : onViewDetails(job)}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Candidatos ({job.applicantsCount})
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

