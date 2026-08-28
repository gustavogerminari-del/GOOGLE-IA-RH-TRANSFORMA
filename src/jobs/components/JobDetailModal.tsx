import React from 'react';
import {
  X,
  Briefcase,
  Building2,
  MapPin,
  Users,
  Calendar,
  DollarSign,
  UserCheck,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Edit3,
  Archive,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { Job, JobStatus } from '../types/job';
import { JobStatusBadge } from './JobStatusBadge';
import { Button, Card } from '../../shared';
import { formatDateBR } from '../../core';
import { useAuth } from '../../auth';
import { checkHeadhunterVisibility } from '../utils/headhunterAccess';

export interface JobDetailModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (job: Job) => void;
  onStatusChange?: (jobId: string, newStatus: JobStatus) => void;
  onManageCandidates?: (job: Job) => void;
  canEdit?: boolean;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  isOpen,
  onClose,
  onEdit,
  onStatusChange,
  onManageCandidates,
  canEdit = true,
}) => {
  const { user, activeModules, userPermissions } = useAuth();
  const { mostrarFiltroHeadhunter } = checkHeadhunterVisibility(user, activeModules, userPermissions);

  if (!isOpen || !job) return null;

  const isArchived = job.status === 'Arquivada' || (job as any).archived === true || (job as any).isArchived === true;
  const archivedAtStr = (job as any).archivedAt ? formatDateBR((job as any).archivedAt) : null;
  const showHeadhunterDetails = mostrarFiltroHeadhunter && (
    (job as any).clienteNome || 
    (job as any).valorNegociado || 
    (job as any).feePercentual || 
    job.origemProcesso === 'headhunter' ||
    (job as any).isHeadhunter
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Archived Banner */}
        {isArchived && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-rose-900 font-medium">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-extrabold text-rose-950">Vaga Arquivada (Modo de Consulta)</p>
                <p className="text-[11px] text-rose-700">
                  {archivedAtStr ? `Arquivada em ${archivedAtStr}. ` : ''}Os candidatos e dados permanecem vinculados e acessíveis.
                </p>
              </div>
            </div>
            {onStatusChange && canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(job.id, 'Aberta')}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                className="bg-white border-rose-300 text-rose-800 hover:bg-rose-100 shrink-0"
              >
                Restaurar Vaga
              </Button>
            )}
          </div>
        )}

        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap pr-8">
            <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {job.department}
            </span>
            <JobStatusBadge status={job.status} size="md" />
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              Contrato: {job.type}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
            {job.title}
          </h2>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Vagas Abertas</span>
            <span className="text-base font-extrabold text-slate-900">{job.openings} posição(ões)</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Candidatos</span>
            <span className="text-base font-extrabold text-slate-900">{job.applicantsCount} inscritos</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Localização</span>
            <span className="text-xs font-extrabold text-slate-900">{job.location} ({job.locationType})</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Prazo Final</span>
            <span className="text-xs font-extrabold text-slate-900">{formatDateBR(job.deadline)}</span>
          </div>
        </div>

        {/* Description & Requirements */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" /> Descrição da Vaga
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
              {job.description}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Requisitos & Competências
            </h4>
            <div className="space-y-1.5">
              {job.requirements.map((req, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 font-medium flex items-start gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                  <span>{req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Commercial & Headhunter Details Section */}
        {showHeadhunterDetails && (
          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-amber-950">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-600" /> Dados Comerciais (Headhunter / Cliente)
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-extrabold border border-amber-200">
                {(job as any).situacaoPagamento || 'Aguardando Contratação'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {(job as any).clienteNome && (
                <div>
                  <p className="text-[11px] text-amber-800 font-semibold">Cliente Contratante:</p>
                  <p className="font-extrabold text-slate-900">{(job as any).clienteNome}</p>
                </div>
              )}
              {(job as any).responsavelComercial && (
                <div>
                  <p className="text-[11px] text-amber-800 font-semibold">Consultor Comercial:</p>
                  <p className="font-extrabold text-slate-900">{(job as any).responsavelComercial}</p>
                </div>
              )}
              {(job as any).valorNegociado !== undefined && (job as any).valorNegociado !== null && (
                <div>
                  <p className="text-[11px] text-amber-800 font-semibold">Honorários Negociados:</p>
                  <p className="font-extrabold text-slate-900">
                    R$ {Number((job as any).valorNegociado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
              {(job as any).feePercentual && (
                <div>
                  <p className="text-[11px] text-amber-800 font-semibold">Percentual de Comissão:</p>
                  <p className="font-extrabold text-slate-900">{(job as any).feePercentual}%</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Budget & Responsibles Section */}
        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-200 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" /> Orçamento & Responsáveis Vinculados
            </span>
            {job.budget?.isApproved && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold border border-emerald-200">
                Aprovado
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[11px] text-slate-500 font-semibold">Faixa Salarial Aprovada:</p>
              <p className="font-extrabold text-slate-900">{job.salaryRange}</p>
            </div>
            {job.budget && (
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">Centro de Custo:</p>
                <p className="font-extrabold text-slate-900">{job.budget.centerCostCode}</p>
              </div>
            )}
            <div>
              <p className="text-[11px] text-slate-500 font-semibold">Recrutador Responsável:</p>
              <p className="font-extrabold text-slate-900">{job.recruiterName}</p>
            </div>
            {job.managerName && (
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">Gestor Solicitante:</p>
                <p className="font-extrabold text-slate-900">{job.managerName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Quick status toggle */}
          {onStatusChange && canEdit && (
            <div className="flex items-center gap-1 text-xs">
              <span className="font-bold text-slate-500 mr-1">Status:</span>
              {(['Aberta', 'Pausada', 'Fechada', 'Arquivada'] as JobStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onStatusChange(job.id, st)}
                  className={`px-2 py-1 rounded-md text-[11px] font-extrabold cursor-pointer transition-all ${
                    job.status === st
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {onManageCandidates && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onManageCandidates(job);
                }}
                leftIcon={<Users className="w-3.5 h-3.5" />}
              >
                Gerenciar Candidatos
              </Button>
            )}

            {canEdit && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(job);
                }}
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              >
                Editar Vaga
              </Button>
            )}

            <Button variant="primary" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
