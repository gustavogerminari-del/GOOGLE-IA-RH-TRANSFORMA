import { doc, getDoc, writeBatch } from '../firebase/firestore';
import { db } from '../lib/firebase';
import { sanitizeFirestoreData } from '../lib/firestoreUtils';
import { CandidateApplicationPayload } from './types';
import { N8nService } from '../services/N8nService';

const PUBLIC_JOB_STATUSES = new Set(['Aberta', 'Ativa', 'ativa']);
const CLOUDFLARE_TIMEOUT_MS = 15_000;

type SubmissionStage = 'vaga' | 'upload' | 'url' | 'candidato' | 'candidatura';

class PublicApplicationError extends Error {
  constructor(message: string, public readonly stage: SubmissionStage, public readonly cause?: unknown) {
    super(message);
    this.name = 'PublicApplicationError';
  }
}

const withTimeout = async <T>(operation: Promise<T>, stage: SubmissionStage, timeoutMs = CLOUDFLARE_TIMEOUT_MS): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new PublicApplicationError(
          'Sua conexão demorou mais que o esperado. Tente novamente.',
          stage,
        )), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

interface ResumeUploadResult {
  documentId: string;
  fileName: string;
  url: string;
}

const uploadResume = async (file: File, jobId: string, companyId: string, candidateId: string): Promise<ResumeUploadResult> => {
  const formData = new FormData();
  formData.set('file', file, file.name);
  formData.set('jobId', jobId);
  formData.set('companyId', companyId);
  formData.set('candidateId', candidateId);
  const response = await withTimeout(fetch('/api/public-resumes', {
    method: 'POST',
    body: formData,
  }), 'upload', 30_000);
  const raw = await response.text();
  let result: any = null;
  try { result = raw ? JSON.parse(raw) : null; } catch { /* handled below */ }
  if (!response.ok || !result?.success) {
    throw new PublicApplicationError(
      String(result?.error || 'Não foi possível enviar seu currículo. Tente novamente.'),
      'upload',
    );
  }
  if (!result.documentId || !/^https:\/\//i.test(String(result.url || ''))) {
    throw new PublicApplicationError('Não foi possível validar o currículo enviado. Tente novamente.', 'url');
  }
  return { documentId: String(result.documentId), fileName: String(result.fileName || file.name), url: String(result.url) };
};

const deleteUploadedResume = async (documentId: string, resumeUrl: string) => {
  const url = new URL(resumeUrl);
  if (url.origin !== window.location.origin || url.pathname !== '/api/public-resumes') return;
  url.searchParams.set('id', documentId);
  await fetch(url.toString(), { method: 'DELETE' }).catch(() => undefined);
};

const stableId = async (prefix: string, value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return `${prefix}-${hash.slice(0, 40)}`;
};

const normalizePublicPhone = (value: unknown): string => {
  let digits = String(value || '').replace(/\D/g, '').replace(/^0+/, '');
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) digits = '55' + digits;
  return digits;
};

const createId = (prefix: string) => {
  const random = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  return `${prefix}-${random}`;
};

const validateResume = (file: File) => {
  const allowed = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);
  const extension = file.name.split('.').pop()?.toLowerCase();
  const hasAllowedExtension = extension === 'pdf' || extension === 'doc' || extension === 'docx';
  const hasAllowedMime = allowed.has(file.type);
  // Some Windows/browser combinations report DOCX files with an empty or
  // generic MIME type. The extension is therefore validated as a safe fallback.
  if (!hasAllowedMime && !hasAllowedExtension) {
    throw new Error('O currículo deve estar em PDF, DOC ou DOCX.');
  }
  if (file.size > 10 * 1024 * 1024) throw new Error('O currículo deve ter no máximo 10 MB.');
  if (file.size === 0) throw new Error('O arquivo do currículo está vazio. Selecione outro arquivo.');
};

export interface PublicApplicationResult {
  candidateId: string;
  applicationId: string;
  companyId: string;
  resumeUrl: string;
}

export class PublicApplicationService {
  static async submit(payload: CandidateApplicationPayload): Promise<PublicApplicationResult> {
    const jobId = payload.jobId?.trim();
    const name = payload.fullName?.trim();
    const email = payload.email?.trim().toLowerCase();
    const phone = payload.phone?.trim() || '';
    const telefoneNormalizado = normalizePublicPhone(phone);
    if (!jobId) throw new Error('Selecione uma vaga válida antes de enviar a candidatura.');
    if (!name || !email) throw new Error('Nome e e-mail são obrigatórios.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Informe um e-mail válido, incluindo o final .com ou equivalente.');
    if (!payload.resumeFile && !payload.resumeUrl?.trim()) throw new Error('Anexe seu currículo em PDF, DOC ou DOCX.');
    if (payload.lgpdConsent !== true) throw new Error('Confirme o consentimento da LGPD para continuar.');
    // RH_TALENT_BANK_LGPD_V1
    // Consentimento para participar da vaga não é usado como consentimento automático
    // para retenção futura no Banco de Talentos.
    const talentBankConsent = (payload as any).talentBankConsent === true || (payload as any).lgpdTalentBankConsent === true;

    const jobSnap = await withTimeout(getDoc(doc(db, 'vagas', jobId)), 'vaga');
    if (!jobSnap.exists()) throw new Error('A vaga selecionada não está mais disponível.');
    const job = jobSnap.data() as Record<string, unknown>;
    if (job.publicada !== true || !PUBLIC_JOB_STATUSES.has(String(job.status || ''))) {
      throw new Error('A vaga selecionada não está aberta para candidaturas.');
    }
    const companyId = String(job.companyId || job.empresaId || '').trim();
    if (!companyId) throw new Error('A vaga selecionada não possui empresa proprietária válida.');

    // IDs determinísticos tornam o envio idempotente sem expor uma consulta
    // pública por e-mail. O mesmo e-mail na mesma empresa reutiliza o candidato;
    // a mesma vaga + candidato jamais cria uma segunda candidatura.
    const candidateId = await stableId('cand', `${companyId}:${email}`);
    const applicationId = await stableId('app', `${companyId}:${jobId}:${candidateId}`);
    const now = new Date().toISOString();
    let resumeUrl = payload.resumeUrl?.trim() || '';
    let uploadedDocumentId = '';
    let storedResumeFileName = payload.resumeFile?.name || payload.resumeFileName || '';

    try {
      if (payload.resumeFile) {
        validateResume(payload.resumeFile);
        const uploaded = await uploadResume(payload.resumeFile, jobId, companyId, candidateId);
        uploadedDocumentId = uploaded.documentId;
        storedResumeFileName = uploaded.fileName;
        resumeUrl = uploaded.url;
      }

      const candidate = sanitizeFirestoreData({
        id: candidateId,
        companyId,
        empresaId: companyId,
        name,
        email,
        emailNormalizado: email,
        phone,
        telefoneNormalizado,
        role: payload.interestArea || String(job.title || job.titulo || 'Candidato'),
        location: payload.cityState?.trim() || '',
        experienceYears: Number(payload.experienceYears) || 0,
        skills: payload.interestArea ? [payload.interestArea] : [],
        status: 'Em Processo',
        currentJobId: jobId,
        currentStageId: 'inscritos',
        rating: 0,
        notes: payload.coverNote?.trim() || '',
        source: 'Portal Público',
        sourceCode: 'PORTAL_RH_TRANSFORMA',
        origens: ['PORTAL_RH_TRANSFORMA'],
        inTalentBank: false,
        resumeUrl,
        resumeFileName: storedResumeFileName,
        resumeDocumentId: uploadedDocumentId,
        resumeHistory: resumeUrl ? [{ url: resumeUrl, fileName: storedResumeFileName, documentId: uploadedDocumentId, receivedAt: now, source: 'PORTAL_RH_TRANSFORMA' }] : [],
        linkedinUrl: payload.linkedinUrl?.trim() || '',
        isPCD: payload.pne === true,
        appliedDate: now.slice(0, 10),
        createdBy: 'public_portal',
        createdAt: now,
        updatedAt: now,
        lgpdConsent: true,
        lgpdConsentAt: now,
        talentBankConsent,
        lgpdTalentBankConsent: talentBankConsent,
        talentBankConsentAt: talentBankConsent ? now : null,
      });

      const application = sanitizeFirestoreData({
        id: applicationId,
        companyId,
        empresaId: companyId,
        jobId,
        vagaId: jobId,
        candidateId,
        name,
        email,
        emailNormalizado: email,
        phone,
        telefoneNormalizado,
        sourceCode: 'PORTAL_RH_TRANSFORMA',
        role: payload.interestArea || String(job.title || job.titulo || 'Candidato'),
        city: payload.cityState?.split(/[,/-]/)[0]?.trim() || '',
        state: payload.cityState?.split(/[,/-]/)[1]?.trim() || '',
        appliedDate: now.slice(0, 10),
        status: 'Novos',
        etapa: 'Inscrito',
        origem: 'portal_publico',
        education: payload.educationLevel || '',
        course: payload.courses || '',
        experienceYears: Number(payload.experienceYears) || 0,
        isPCD: payload.pne === true,
        resumeUrl,
        resumeFileName: storedResumeFileName,
        resumeDocumentId: uploadedDocumentId,
        compatibilityScore: 0,
        compatibilityLevel: 'Não analisado',
        notes: payload.coverNote ? [payload.coverNote] : [],
        timeline: [{
          id: createId('evt'),
          title: 'Candidatura Recebida',
          description: 'Candidatura registrada pelo portal público.',
          date: now,
        }],
        createdBy: 'public_portal',
        createdAt: now,
        updatedAt: now,
        lgpdConsent: true,
        lgpdConsentAt: now,
      });

      const batch = writeBatch(db);
      batch.set(doc(db, 'candidatos', candidateId), candidate);
      batch.set(doc(db, 'candidaturas', applicationId), application);
      try {
        await withTimeout(batch.commit(), 'candidatura');
      } catch (firstError: any) {
        // Se o candidato determinístico já existe, a regra pública create-only
        // rejeita sua atualização. Nesse caso tentamos criar somente a nova
        // candidatura. Se ela também existir, o segundo create é bloqueado e a
        // mensagem de duplicidade é devolvida.
        if (String(firstError?.code || '').includes('permission-denied')) {
          const applicationOnly = writeBatch(db);
          applicationOnly.set(doc(db, 'candidaturas', applicationId), application);
          try {
            await withTimeout(applicationOnly.commit(), 'candidatura');
          } catch (applicationError: any) {
            if (String(applicationError?.code || '').includes('permission-denied')) {
              throw new PublicApplicationError('Você já possui candidatura para esta vaga.', 'candidatura', applicationError);
            }
            throw applicationError;
          }
        } else {
          throw firstError;
        }
      }
      try {
        await N8nService.notifyPublicApplication({ companyId, applicationId, candidateId, jobId });
      } catch (automationError) {
        console.warn('[PUBLIC_APPLICATION_AUTOMATION_UNAVAILABLE]', {
          applicationId,
          companyId,
          message: automationError instanceof Error ? automationError.message : String(automationError),
        });
      }
      return { candidateId, applicationId, companyId, resumeUrl };
    } catch (error) {
      if (uploadedDocumentId && resumeUrl) await deleteUploadedResume(uploadedDocumentId, resumeUrl);
      if (error instanceof PublicApplicationError) throw error;
      const code = String((error as any)?.code || '');
      if (code.includes('permission-denied') || code.includes('unavailable')) {
        throw new PublicApplicationError('Não foi possível registrar sua candidatura. Tente novamente.', 'candidatura', error);
      }
      throw new PublicApplicationError('Não foi possível registrar sua candidatura. Tente novamente.', 'candidatura', error);
    }
  }
}
