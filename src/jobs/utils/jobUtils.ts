import { Job, JobStatus } from '../types/job';

/**
 * Normalizes any variation of job status to standard JobStatus
 */
export function normalizeJobStatus(status?: string): JobStatus {
  const value = String(status || "").trim().toLowerCase();

  const statusMap: Record<string, JobStatus> = {
    aberta: "Aberta",
    open: "Aberta",
    ativa: "Aberta",
    pausada: "Pausada",
    paused: "Pausada",
    fechada: "Fechada",
    closed: "Fechada",
    arquivada: "Arquivada",
    archived: "Arquivada",
    arquivo: "Arquivada",
    rascunho: "Rascunho",
    draft: "Rascunho",
  };

  return statusMap[value] || (value ? (value.charAt(0).toUpperCase() + value.slice(1)) as JobStatus : "Aberta");
}

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n|;/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [];
}

/**
 * Normalizes an entire Job object for legacy compatibility and consistency
 */
export function normalizeJobData(job: any): Job {
  if (!job) return job;
  const rawStatus = job.status || (job.archived || job.isArchived ? 'arquivada' : 'aberta');
  const normalizedStatus = normalizeJobStatus(rawStatus);
  const isArchived = normalizedStatus === 'Arquivada' || job.archived === true || job.isArchived === true;

  const resolvedCompanyId = job.companyId || job.empresaId || null;

  return {
    ...job,
    title: job.title || job.titulo || 'Vaga Sem Título',
    description: job.description || job.descricao || '',
    department: job.department || 'Geral',
    location: job.location || (job.cidade ? `${job.cidade} - ${job.estado || ''}` : 'São Paulo - SP'),
    locationType: job.locationType || job.modalidade || 'Híbrido',
    type: job.type || job.tipoContrato || 'CLT',
    salaryRange: job.salaryRange || job.salario || 'A combinar',
    openings: job.openings || job.quantidadeVagas || 1,
    applicantsCount: (job.applicantsCount !== undefined && job.applicantsCount > 0) 
      ? job.applicantsCount 
      : (job.candidatosCount || 0),
    requirements: normalizeStringList(job.requirements ?? job.requisitos),
    benefits: normalizeStringList(job.benefits ?? job.beneficios),
    recruiterName: job.recruiterName || 'Recrutador RH',
    deadline: job.deadline || '2026-12-31',
    createdAt: job.createdAt || job.dataCriacao || new Date().toISOString().split('T')[0],
    companyId: resolvedCompanyId,
    empresaId: resolvedCompanyId,
    status: isArchived ? 'Arquivada' : normalizedStatus,
    isArchived: isArchived,
    archived: isArchived,
  };
}
