import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from '../firebase/firestore';
import { db, auth } from '../lib/firebase';
import { sanitizeFirestoreData } from '../lib/firestoreUtils';
import { Job } from '../types/rh';
import { AuditService } from './AuditService';
import { normalizeJobData } from '../jobs/utils/jobUtils';
import { HEADHUNTER_ORIGIN_FIELDS } from '../recruitment-core/utils/processOrigin';
import { N8nService } from './N8nService';

const PRIMARY_COLLECTION = 'vagas';
const LEGACY_COLLECTION = 'jobs';

const TERMINAL_JOB_STATUSES = new Set([
  'concluída', 'concluida', 'preenchida', 'fechada', 'encerrada', 'arquivada', 'cancelada', 'closed'
]);

const isTerminalJob = (status: unknown, statusVaga?: unknown) =>
  TERMINAL_JOB_STATUSES.has(String(status || '').trim().toLowerCase())
  || TERMINAL_JOB_STATUSES.has(String(statusVaga || '').trim().toLowerCase());

async function moveClosedJobCandidatesToTalentBank(jobId: string, companyId: string, jobStatus: string) {
  const applications = new Map<string, any>();
  const errors: unknown[] = [];

  for (const tenantField of ['empresaId', 'companyId']) {
    for (const jobField of ['jobId', 'vagaId']) {
      try {
        const snap = await getDocs(query(
          collection(db, 'candidaturas'),
          where(tenantField, '==', companyId),
          where(jobField, '==', jobId)
        ));
        snap.forEach(item => applications.set(item.id, item));
      } catch (error) {
        errors.push(error);
        console.warn('[JOB_CLOSE_TALENT_BANK_QUERY_SKIPPED]', { jobId, companyId, tenantField, jobField, error });
      }
    }
  }

  if (applications.size === 0 && errors.length >= 4) throw errors[0];
  const now = new Date().toISOString();

  for (const applicationSnap of applications.values()) {
    const application = applicationSnap.data() || {};
    const currentStatus = String(application.status || application.etapa || '').trim().toLowerCase();
    if (currentStatus === 'contratado' || currentStatus === 'contratada') continue;

    const candidateId = String(application.candidateId || application.candidatoId || ('talent-' + applicationSnap.id)).trim();
    // RH_TALENT_BANK_LGPD_V1
    const talentBankConsent = application.talentBankConsent === true || application.lgpdTalentBankConsent === true;
    await setDoc(applicationSnap.ref, sanitizeFirestoreData({
      companyId,
      empresaId: companyId,
      candidateId,
      candidatoId: candidateId,
      status: 'Encerrado',
      etapa: 'Vaga Encerrada',
      inTalentBank: talentBankConsent,
      manterBancoTalentos: talentBankConsent,
      talentBankOriginJobId: jobId,
      talentBankReason: 'VAGA_ENCERRADA',
      vagaEncerradaStatus: jobStatus,
      encerradoEm: now,
      updatedAt: now,
    }), { merge: true });

    // Sem consentimento específico, o perfil não é promovido ao Banco de Talentos.
    if (!talentBankConsent) continue;

    const candidateRef = doc(db, 'candidatos', candidateId);
    try {
      const candidateSnap = await getDoc(candidateRef);
      const currentProfile = candidateSnap.exists() ? (candidateSnap.data() || {}) : {};
      const candidateTenant = String(currentProfile.empresaId || currentProfile.companyId || '').trim();
      if (candidateTenant && candidateTenant !== companyId) {
        console.error('[JOB_CLOSE_TALENT_BANK_TENANT_BLOCKED]', { jobId, companyId, candidateId, candidateTenant });
        continue;
      }

      const name = String(currentProfile.name || currentProfile.nome || application.name || application.nome || application.candidateName || application.nomeCompleto || '').trim();
      const email = String(currentProfile.email || application.email || application.candidateEmail || application.contato?.email || '').trim().toLowerCase();
      const phone = String(currentProfile.phone || currentProfile.telefone || application.phone || application.telefone || application.contato?.telefone || '').trim();
      const role = String(currentProfile.role || currentProfile.cargo || application.role || application.cargo || application.jobTitle || application.vagaTitulo || '').trim();
      const location = String(currentProfile.location || application.location || application.cidade || '').trim();
      const resumeUrl = String(currentProfile.resumeUrl || currentProfile.curriculoUrl || application.resumeUrl || application.curriculoUrl || '').trim();
      const resumeText = String(currentProfile.resumeText || currentProfile.curriculoTexto || application.resumeText || application.curriculoTexto || '').trim();
      const skills = Array.isArray(currentProfile.skills)
        ? currentProfile.skills
        : (Array.isArray(application.skills) ? application.skills : (Array.isArray(application.competencias) ? application.competencias : []));

      await setDoc(candidateRef, sanitizeFirestoreData({
        ...currentProfile,
        id: candidateId,
        companyId,
        empresaId: companyId,
        name,
        email,
        phone,
        role,
        location,
        skills,
        resumeUrl,
        curriculoUrl: resumeUrl,
        resumeText,
        curriculoTexto: resumeText,
        inTalentBank: true,
        manterBancoTalentos: true,
        status: 'Ativo',
        currentJobId: '',
        currentStageId: 'banco-talentos',
        source: currentProfile.source || application.source || 'Vaga Encerrada',
        talentBankOriginJobId: jobId,
        talentBankReason: 'VAGA_ENCERRADA',
        talentBankSince: currentProfile.talentBankSince || now,
        createdAt: currentProfile.createdAt || application.createdAt || now,
        updatedAt: now,
      }), { merge: true });
    } catch (error) {
      console.error('[JOB_CLOSE_TALENT_BANK_PROFILE_FAILED]', { jobId, companyId, candidateId, error });
      throw error;
    }
  }

  console.info('[JOB_CLOSE_TALENT_BANK_DONE]', { jobId, companyId, processed: applications.size });
}

export class JobService {
  static async syncClosedCandidatesToTalentBank(jobId: string, companyId: string, jobStatus = 'Concluída'): Promise<void> {
    const resolvedJobId = String(jobId || '').trim();
    const resolvedCompanyId = String(companyId || '').trim();
    if (!resolvedJobId || !resolvedCompanyId) return;
    await moveClosedJobCandidatesToTalentBank(resolvedJobId, resolvedCompanyId, String(jobStatus || 'Concluída'));
  }

  static async create(jobData: Record<string, any>): Promise<Job> {
    const id = jobData.id || `vaga-${Date.now()}`;
    const user = auth.currentUser;
    const nowIsoDate = new Date().toISOString().split('T')[0];

    const resolvedCompanyId = String(jobData.companyId || jobData.empresaId || '').trim();
    if (!resolvedCompanyId) throw new Error('Não foi possível criar a vaga: empresaId é obrigatório.');
    const title = String(jobData.title || jobData.titulo || '').trim();
    if (!title) throw new Error('Não foi possível criar a vaga: título é obrigatório.');
    const rawOrigem = (
      jobData.origemProcesso ||
      jobData.origem ||
      jobData.moduloOrigem ||
      jobData.criadaPorModulo ||
      ''
    ).toString().toLowerCase();

    let resolvedOrigem: 'vaga_interna' | 'recrutamento_cliente' | 'headhunter' = 'vaga_interna';
    if (rawOrigem.includes('headhunter') || jobData.isHeadhunter || jobData.projetoHeadhunter) {
      resolvedOrigem = 'headhunter';
    } else if (rawOrigem.includes('cliente') || jobData.clienteNome) {
      resolvedOrigem = 'recrutamento_cliente';
    }

    const isHeadhunter = resolvedOrigem === 'headhunter';
    const isClient = resolvedOrigem === 'recrutamento_cliente';
    const normalizedCreateStatus = String(jobData.status || 'Aberta').trim().toLowerCase();
    const createStatusIsPublic = ['aberta', 'ativa', 'open'].includes(normalizedCreateStatus);

    const jobToSave: Record<string, any> = {
      ...jobData,
      id,
      companyId: resolvedCompanyId,
      empresaId: resolvedCompanyId,
      ...(isHeadhunter ? HEADHUNTER_ORIGIN_FIELDS : {
        origem: resolvedOrigem,
        origemProcesso: resolvedOrigem,
        tipoProcesso: isClient ? 'cliente' : 'interno',
        projetoHeadhunter: false,
        isHeadhunter: false,
        moduloOrigem: 'RH',
      }),
      criadaPorModulo: jobData.criadaPorModulo || (isHeadhunter ? 'headhunter' : 'recrutamento'),

      companyName: jobData.companyName || jobData.nomeEmpresa || '',
      nomeEmpresa: jobData.nomeEmpresa || jobData.companyName || '',
      title,
      titulo: title,
      description: jobData.description || jobData.descricao || '',
      descricao: jobData.descricao || jobData.description || '',
      department: jobData.department || 'Geral',
      location: jobData.location || '',
      locationType: jobData.locationType || jobData.modalidade || 'Híbrido',
      type: jobData.type || jobData.tipoContrato || 'CLT',
      status: jobData.status || 'Aberta',
      publicada: jobData.publicada === true && createStatusIsPublic,
      salaryRange: jobData.salaryRange || jobData.salario || 'A combinar',
      salario: jobData.salario || jobData.salaryRange || 'A combinar',
      openings: Number(jobData.openings || jobData.quantidadeVagas || 1),
      quantidadeVagas: Number(jobData.openings || jobData.quantidadeVagas || 1),
      applicantsCount: Number(jobData.applicantsCount || jobData.candidatosCount || 0),
      createdAt: jobData.createdAt || jobData.dataCriacao || nowIsoDate,
      dataCriacao: jobData.dataCriacao || jobData.createdAt || nowIsoDate,
      deadline: jobData.deadline || jobData.prazoSla || '',
      requirements: jobData.requirements || jobData.requisitos || [],
      requisitos: jobData.requisitos || jobData.requirements || [],
      benefits: jobData.benefits || jobData.beneficios || [],
      recruiterName: jobData.recruiterName || jobData.recrutadorResponsavel || user?.displayName || 'Recrutador RH',
      createdBy: user?.uid || 'system',
      updatedAt: new Date().toISOString()
    };

    try {
      const sanitizedData = sanitizeFirestoreData(jobToSave);
      await setDoc(doc(db, PRIMARY_COLLECTION, id), sanitizedData, { merge: true });

      await AuditService.log({
        action: 'CREATE',
        description: `Vaga "${jobToSave.title}" criada com sucesso.`,
        moduleName: 'Vagas',
        targetEntity: 'Vaga',
        companyId: resolvedCompanyId
      });
      await N8nService.sendSafely('job_created', resolvedCompanyId, {
        entityId: id,
        jobId: id,
        title,
        department: jobToSave.department,
        city: jobData.cidade || String(jobToSave.location || '').split('-')[0]?.trim() || '',
        state: jobData.estado || String(jobToSave.location || '').split('-')[1]?.trim() || '',
        origin: jobToSave.origemProcesso,
        recruiterEmail: jobData.recruiterEmail || user?.email || '',
      });
    } catch (err: any) {
      console.error('Erro ao salvar vaga no Firestore:', err);
      throw err;
    }

    return jobToSave as Job;
  }

  static async update(id: string, data: Record<string, any>): Promise<void> {
    try {
      const existing = await this.getById(id);
      if (!existing) throw new Error('Não foi possível atualizar a vaga: vaga não encontrada.');
      const existingCompanyId = String(existing.companyId || existing.empresaId || '').trim();
      const companyId = String(data.companyId || data.empresaId || existingCompanyId).trim();
      if (!companyId) throw new Error('Não foi possível atualizar a vaga: empresaId é obrigatório.');
      if (!existingCompanyId || existingCompanyId !== companyId) throw new Error('Não foi possível atualizar a vaga: a vaga pertence a outra empresa.');
      const willBePublished = data.publicada === true || (data.publicada === undefined && (existing as any).publicada === true);
      if (willBePublished) {
        const publicTitle = String(data.title || data.titulo || existing.title || existing.titulo || '').trim();
        const publicDescription = String(data.description || data.descricao || existing.description || existing.descricao || '').trim();
        const publicLocation = String(data.location || (existing as any).location || '').trim();
        if (!publicTitle || !publicDescription || !publicLocation) {
          throw new Error('Para publicar a vaga, informe título, descrição e localidade reais.');
        }
      }
      const rawOrigin = String(data.origemProcesso || data.origem || data.moduloOrigem || '').toLowerCase();
      const isHeadhunterUpdate = rawOrigin.includes('headhunter') || data.isHeadhunter === true || data.projetoHeadhunter === true;
      const normalizedStatus = String(data.status || existing?.status || '').trim().toLowerCase();
      const terminalStatus = ['concluída', 'concluida', 'preenchida', 'fechada', 'encerrada', 'arquivada', 'cancelada', 'closed'].includes(normalizedStatus);
      const openStatus = ['aberta', 'ativa', 'open'].includes(normalizedStatus);
      const resolvedPublished = terminalStatus
        ? false
        : data.publicada !== undefined
          ? data.publicada === true && openStatus
          : data.status !== undefined
            ? openStatus
            : existing?.publicada === true;
      const updatePayload = sanitizeFirestoreData({
        ...data,
        ...(isHeadhunterUpdate ? HEADHUNTER_ORIGIN_FIELDS : {}),
        companyId,
        empresaId: companyId,
        publicada: resolvedPublished,
        updatedAt: new Date().toISOString()
      });

      await setDoc(doc(db, PRIMARY_COLLECTION, id), updatePayload, { merge: true });

      const closureStatus = String(data.status || existing?.status || '').trim();
      const closureStatusVaga = String(data.statusVaga || (existing as any)?.statusVaga || '').trim();
      if (isTerminalJob(closureStatus, closureStatusVaga)) {
        await moveClosedJobCandidatesToTalentBank(id, companyId, closureStatus || closureStatusVaga || 'Encerrada');
      }

      await AuditService.log({
        action: 'UPDATE',
        description: `Vaga ${id} atualizada`,
        moduleName: 'Vagas',
        targetEntity: 'Vaga'
      });
      await N8nService.sendSafely(
        ['fechada', 'concluída', 'concluida', 'preenchida', 'closed'].includes(normalizedStatus) ? 'job_closed' : 'job_updated',
        companyId,
        {
          entityId: id,
          jobId: id,
          title: data.title || data.titulo || existing?.title || '',
          department: data.department || existing?.department || '',
          city: data.cidade || '',
          state: data.estado || '',
          origin: data.origemProcesso || data.origem || (existing as any)?.origemProcesso || '',
          recruiterEmail: data.recruiterEmail || auth.currentUser?.email || '',
          status: data.status || existing?.status || '',
        },
      );
    } catch (err: any) {
      console.error('Erro ao atualizar vaga no Firestore:', err);
      throw err;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, PRIMARY_COLLECTION, id));
      await AuditService.log({
        action: 'DELETE',
        description: `Vaga ${id} excluída`,
        moduleName: 'Vagas',
        targetEntity: 'Vaga'
      });
    } catch (err) {
      console.error('Erro ao excluir vaga no Firestore:', err);
      throw err;
    }
  }

  static async getById(id: string): Promise<Job | null> {
    try {
      const snap1 = await getDoc(doc(db, PRIMARY_COLLECTION, id));
      if (snap1.exists()) {
        return normalizeJobData({ ...snap1.data(), id: snap1.id });
      }
      const snap2 = await getDoc(doc(db, LEGACY_COLLECTION, id));
      if (snap2.exists()) {
        return normalizeJobData({ ...snap2.data(), id: snap2.id });
      }
    } catch (err) {
      console.error('Erro em JobService.getById:', err);
      throw err;
    }
    return null;
  }

  static async get(id: string): Promise<Job | null> {
    return this.getById(id);
  }

  static async list(companyId?: string): Promise<Job[]> {
    const listMap = new Map<string, Job>();
    const errors: unknown[] = [];
    let successfulQueries = 0;

    const collect = async (sourceQuery: any, label: string) => {
      try {
        const snap = await getDocs(sourceQuery);
        successfulQueries += 1;
        snap.forEach(d => {
          if (!listMap.has(d.id)) {
            listMap.set(d.id, normalizeJobData({ ...d.data(), id: d.id }));
          }
        });
      } catch (error) {
        errors.push(error);
        console.warn(`[JobService.list] Consulta ignorada sem descartar vagas já carregadas: ${label}`, error);
      }
    };

    if (companyId) {
      // empresaId é o identificador canônico gravado em todas as vagas novas.
      // Consultas legadas são apenas fallback e nunca podem zerar a tela inteira.
      for (const source of [PRIMARY_COLLECTION, LEGACY_COLLECTION]) {
        await collect(
          query(collection(db, source), where('empresaId', '==', companyId)),
          `${source}.empresaId`
        );
        await collect(
          query(collection(db, source), where('companyId', '==', companyId)),
          `${source}.companyId`
        );
        await collect(
          query(collection(db, source), where('tenantId', '==', companyId)),
          `${source}.tenantId`
        );
      }
    } else {
      for (const source of [PRIMARY_COLLECTION, LEGACY_COLLECTION]) {
        await collect(collection(db, source), source);
      }
    }

    if (successfulQueries === 0 && errors.length > 0) {
      throw errors[0];
    }

    return Array.from(listMap.values());
  }

  static async listPublicJobs(): Promise<Job[]> {
    const listMap = new Map<string, Job>();
    for (const status of ['Aberta', 'Ativa', 'ativa']) {
      const snap = await getDocs(query(
        collection(db, PRIMARY_COLLECTION),
        where('publicada', '==', true),
        where('status', '==', status)
      ));
      snap.forEach(d => {
        const job = normalizeJobData({ ...d.data(), id: d.id });
        if (!listMap.has(d.id)) listMap.set(d.id, job);
      });
    }
    return Array.from(listMap.values());
  }

  static async listByCompany(companyId?: string): Promise<Job[]> {
    return this.list(companyId);
  }

  static async search(term: string, companyId?: string): Promise<Job[]> {
    const all = await this.list(companyId);
    const lower = term.toLowerCase();
    return all.filter(j => 
      (j.title || j.titulo || '').toLowerCase().includes(lower) || 
      (j.department || '').toLowerCase().includes(lower) ||
      (j.description || j.descricao || '').toLowerCase().includes(lower)
    );
  }

  static async count(companyId?: string): Promise<number> {
    const all = await this.list(companyId);
    return all.length;
  }
}
