import {
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from '../../firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  sanitizeFirestoreData, 
  safeFirestoreRead, 
  safeFirestoreWrite, 
  OperationType 
} from '../../lib/firestoreUtils';
import { 
  UnifiedJob, 
  UnifiedCandidate, 
  UnifiedCandidateProcess, 
  UnifiedInterview, 
  UnifiedAgendaEvent, 
  UnifiedHiring, 
  OrigemProcesso,
  ProcessStage 
} from '../types/recruitment';
import { HEADHUNTER_ORIGIN_FIELDS } from '../utils/processOrigin';

const COLLECTIONS = {
  JOBS_PRIMARY: 'vagas',
  JOBS_SECONDARY: 'jobs',
  CANDIDATES: 'candidatos',
  PROCESSES: 'candidaturas',
  INTERVIEWS: 'entrevistas',
  AGENDA: 'agenda',
  HIRINGS: 'contratacoes'
};

// In-memory cache for immediate synchronous initial renders
let jobsCache: UnifiedJob[] = [];
let candidatesCache: UnifiedCandidate[] = [];
let interviewsCache: UnifiedInterview[] = [];
let agendaCache: UnifiedAgendaEvent[] = [];
let hiringsCache: UnifiedHiring[] = [];
let processesCache: UnifiedCandidateProcess[] = [];

// Async background loader to sync with Firestore
export async function syncRecruitmentWithFirestore(companyId: string): Promise<void> {
  if (!companyId) throw new Error('Não foi possível identificar a empresa do usuário.');
  const tenantQuery = (collectionName: string) =>
    query(collection(db, collectionName), where('empresaId', '==', companyId));
  try {
    const jobMap = new Map<string, UnifiedJob>();

    // Load from 'vagas'
    const vagasRead = await safeFirestoreRead(
      async () => {
        const snap = await getDocs(tenantQuery(COLLECTIONS.JOBS_PRIMARY));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as UnifiedJob));
      },
      OperationType.LIST,
      COLLECTIONS.JOBS_PRIMARY,
      []
    );
    vagasRead.data.forEach(j => jobMap.set(j.id, j));

    // Load from 'jobs'
    const jobsRead = await safeFirestoreRead(
      async () => {
        const snap = await getDocs(tenantQuery(COLLECTIONS.JOBS_SECONDARY));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as UnifiedJob));
      },
      OperationType.LIST,
      COLLECTIONS.JOBS_SECONDARY,
      []
    );
    jobsRead.data.forEach(j => {
      if (!jobMap.has(j.id)) jobMap.set(j.id, j);
    });

    jobsCache = [...jobsCache.filter(item => item.empresaId !== companyId && item.companyId !== companyId), ...jobMap.values()];

    const candsRead = await safeFirestoreRead(
      async () => {
        const snap = await getDocs(tenantQuery(COLLECTIONS.CANDIDATES));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as UnifiedCandidate));
      },
      OperationType.LIST,
      COLLECTIONS.CANDIDATES,
      []
    );
    if (!candsRead.success) throw new Error(candsRead.error?.error || 'Falha ao consultar candidatos.');
    candidatesCache = [...candidatesCache.filter(item => item.empresaId !== companyId), ...candsRead.data];

    const intsRead = await safeFirestoreRead(
      async () => {
        const snap = await getDocs(tenantQuery(COLLECTIONS.INTERVIEWS));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as UnifiedInterview));
      },
      OperationType.LIST,
      COLLECTIONS.INTERVIEWS,
      []
    );
    if (!intsRead.success) throw new Error(intsRead.error?.error || 'Falha ao consultar entrevistas.');
    interviewsCache = [...interviewsCache.filter(item => item.empresaId !== companyId), ...intsRead.data];

    const ageRead = await safeFirestoreRead(
      async () => {
        const snap = await getDocs(tenantQuery(COLLECTIONS.AGENDA));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as UnifiedAgendaEvent));
      },
      OperationType.LIST,
      COLLECTIONS.AGENDA,
      []
    );
    if (!ageRead.success) throw new Error(ageRead.error?.error || 'Falha ao consultar agenda.');
    agendaCache = [...agendaCache.filter(item => item.empresaId !== companyId), ...ageRead.data];

    const hirRead = await safeFirestoreRead(
      async () => {
        const snap = await getDocs(tenantQuery(COLLECTIONS.HIRINGS));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as UnifiedHiring));
      },
      OperationType.LIST,
      COLLECTIONS.HIRINGS,
      []
    );
    if (!hirRead.success) throw new Error(hirRead.error?.error || 'Falha ao consultar contratações.');
    hiringsCache = [...hiringsCache.filter(item => item.empresaId !== companyId), ...hirRead.data];

    const procRead = await safeFirestoreRead(
      async () => {
        const snap = await getDocs(tenantQuery(COLLECTIONS.PROCESSES));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as UnifiedCandidateProcess));
      },
      OperationType.LIST,
      COLLECTIONS.PROCESSES,
      []
    );
    if (!procRead.success) throw new Error(procRead.error?.error || 'Falha ao consultar candidaturas.');
    processesCache = [...processesCache.filter(item => item.empresaId !== companyId), ...procRead.data];
  } catch (err) {
    console.error('Falha ao sincronizar recrutamento no Firestore:', err);
    throw err;
  }
}

export class RecruitmentService {
  // JOBS
  static getJobs(companyId?: string, origem?: OrigemProcesso): UnifiedJob[] {
    return jobsCache.filter(j => {
      const cId = j.empresaId || j.companyId || (j as any).tenantId;
      const matchesCompany = !companyId || cId === companyId;
      const matchesOrigem = !origem || j.origemProcesso === origem;
      return matchesCompany && matchesOrigem;
    });
  }

  static async createJob(job: UnifiedJob): Promise<UnifiedJob> {
    const id = job.id || `vaga-${Date.now()}`;
    const rawOrigem = (
      job.origemProcesso ||
      job.origem ||
      job.moduloOrigem ||
      job.criadaPorModulo ||
      ''
    ).toString().toLowerCase();

    let resolvedOrigem: 'vaga_interna' | 'recrutamento_cliente' | 'headhunter' = 'vaga_interna';
    if (rawOrigem.includes('headhunter') || job.isHeadhunter || job.projetoHeadhunter) {
      resolvedOrigem = 'headhunter';
    } else if (rawOrigem.includes('cliente') || job.clienteNome) {
      resolvedOrigem = 'recrutamento_cliente';
    }

    const isHeadhunter = resolvedOrigem === 'headhunter';
    const isClient = resolvedOrigem === 'recrutamento_cliente';

    const newJob: UnifiedJob = {
      ...job,
      id,
      empresaId: job.empresaId || job.companyId || '',
      companyId: job.companyId || job.empresaId || '',
      ...(isHeadhunter ? HEADHUNTER_ORIGIN_FIELDS : {
        origem: resolvedOrigem,
        origemProcesso: resolvedOrigem as any,
        tipoProcesso: isClient ? 'cliente' : 'interno',
        projetoHeadhunter: false,
        isHeadhunter: false,
        moduloOrigem: 'RH',
      }),
      dataCriacao: job.dataCriacao || job.createdAt || new Date().toISOString().split('T')[0],
      status: job.status || 'Aberta'
    };

    if (!newJob.empresaId) throw new Error('Não foi possível salvar a vaga: empresaId é obrigatório.');

    // Update Cache
    jobsCache = [newJob, ...jobsCache.filter(j => j.id !== id)];

    // A coleção oficial de vagas é `vagas`; `jobs` permanece somente para leitura legada.
    const sanitized = sanitizeFirestoreData(newJob);
    await safeFirestoreWrite(
      async () => {
        await setDoc(doc(db, COLLECTIONS.JOBS_PRIMARY, id), sanitized, { merge: true });
      },
      OperationType.WRITE,
      `${COLLECTIONS.JOBS_PRIMARY}/${id}`
    );

    return newJob;
  }

  static async updateJob(job: UnifiedJob): Promise<UnifiedJob> {
    return this.createJob(job);
  }

  static async saveJob(job: UnifiedJob): Promise<UnifiedJob> {
    return this.createJob(job);
  }

  static async deleteJob(jobId: string): Promise<void> {
    jobsCache = jobsCache.filter(j => j.id !== jobId);
    await safeFirestoreWrite(
      async () => {
        await deleteDoc(doc(db, COLLECTIONS.JOBS_PRIMARY, jobId));
      },
      OperationType.DELETE,
      `${COLLECTIONS.JOBS_PRIMARY}/${jobId}`
    );
  }

  // CANDIDATES
  static getCandidates(companyId: string = '', origem?: OrigemProcesso): UnifiedCandidate[] {
    return candidatesCache.filter(c => !companyId || c.empresaId === companyId || c.companyId === companyId);
  }

  static async createCandidate(candidate: UnifiedCandidate): Promise<UnifiedCandidate> {
    const id = candidate.id || `cand-${Date.now()}`;
    const newCandidate: UnifiedCandidate = {
      ...candidate,
      id,
      empresaId: candidate.empresaId || candidate.companyId || '',
      companyId: candidate.companyId || candidate.empresaId || '',
      status: candidate.status || 'Ativo'
    };

    if (!newCandidate.empresaId) throw new Error('Não foi possível salvar o candidato: empresaId é obrigatório.');
    candidatesCache = [newCandidate, ...candidatesCache.filter(c => c.id !== id)];

    await safeFirestoreWrite(
      async () => {
        await setDoc(doc(db, COLLECTIONS.CANDIDATES, id), sanitizeFirestoreData(newCandidate), { merge: true });
      },
      OperationType.WRITE,
      `${COLLECTIONS.CANDIDATES}/${id}`
    );

    return newCandidate;
  }

  static async updateCandidate(candidate: UnifiedCandidate): Promise<UnifiedCandidate> {
    return this.createCandidate(candidate);
  }

  static async saveCandidate(candidate: UnifiedCandidate): Promise<UnifiedCandidate> {
    return this.createCandidate(candidate);
  }

  static async deleteCandidate(candidateId: string): Promise<void> {
    candidatesCache = candidatesCache.filter(c => c.id !== candidateId);
    await safeFirestoreWrite(
      async () => {
        await deleteDoc(doc(db, COLLECTIONS.CANDIDATES, candidateId));
      },
      OperationType.DELETE,
      `${COLLECTIONS.CANDIDATES}/${candidateId}`
    );
  }

  static async linkCandidateToJob(candidateId: string, jobId: string, origem: OrigemProcesso = 'recrutamento_interno'): Promise<void> {
    const cand = candidatesCache.find(c => c.id === candidateId);
    if (cand) {
      cand.currentJobId = jobId;
      cand.currentStageId = 'Triagem';
      await this.updateCandidate(cand);
    }

    const job = jobsCache.find(j => j.id === jobId);
    if (job) {
      const existing = job.candidatosIds || [];
      if (!existing.includes(candidateId)) {
        job.candidatosIds = [...existing, candidateId];
        await this.updateJob(job);
      }
    }
  }

  static async moveCandidateStage(candidateId: string, newStage: ProcessStage): Promise<void> {
    const cand = candidatesCache.find(c => c.id === candidateId);
    if (cand) {
      cand.currentStageId = newStage;
      cand.status = newStage === 'Contratado' ? 'Contratado' : 'Em Processo';
      await this.updateCandidate(cand);
    }
  }

  // INTERVIEWS
  static getInterviews(companyId: string = '', origem?: OrigemProcesso): UnifiedInterview[] {
    return interviewsCache.filter(i => {
      const matchesCompany = !companyId || i.empresaId === companyId || i.companyId === companyId;
      const matchesOrigem = !origem || i.origemProcesso === origem;
      return matchesCompany && matchesOrigem;
    });
  }

  static async createInterview(interview: UnifiedInterview): Promise<UnifiedInterview> {
    const id = interview.id || `int-${Date.now()}`;
    const newInterview: UnifiedInterview = {
      ...interview,
      id,
      empresaId: interview.empresaId || interview.companyId || '',
      companyId: interview.companyId || interview.empresaId || ''
    };

    if (!newInterview.empresaId) throw new Error('Não foi possível salvar a entrevista: empresaId é obrigatório.');
    await setDoc(doc(db, COLLECTIONS.INTERVIEWS, id), sanitizeFirestoreData(newInterview), { merge: true });
    interviewsCache = [newInterview, ...interviewsCache.filter(i => i.id !== id)];

    return newInterview;
  }

  // HIRINGS
  static getHirings(companyId: string = '', origem?: OrigemProcesso): UnifiedHiring[] {
    return hiringsCache.filter(h => !companyId || h.empresaId === companyId || h.companyId === companyId);
  }

  static async createHiring(hiring: UnifiedHiring): Promise<UnifiedHiring> {
    const id = hiring.id || `hir-${Date.now()}`;
    const newHiring: UnifiedHiring = {
      ...hiring,
      id,
      empresaId: hiring.empresaId || hiring.companyId || '',
      companyId: hiring.companyId || hiring.empresaId || ''
    };

    if (!newHiring.empresaId) throw new Error('Não foi possível salvar a contratação: empresaId é obrigatório.');
    await setDoc(doc(db, COLLECTIONS.HIRINGS, id), sanitizeFirestoreData(newHiring), { merge: true });
    hiringsCache = [newHiring, ...hiringsCache.filter(h => h.id !== id)];

    return newHiring;
  }

  // AGENDA
  static getAgendaEvents(companyId: string = '', origem?: OrigemProcesso): UnifiedAgendaEvent[] {
    return agendaCache.filter(a => !companyId || a.empresaId === companyId || a.companyId === companyId);
  }

  static async createAgendaEvent(event: UnifiedAgendaEvent): Promise<UnifiedAgendaEvent> {
    const id = event.id || `evt-${Date.now()}`;
    const newEvent: UnifiedAgendaEvent = {
      ...event,
      id,
      empresaId: event.empresaId || event.companyId || '',
      companyId: event.companyId || event.empresaId || ''
    };

    if (!newEvent.empresaId) throw new Error('Não foi possível salvar o evento: empresaId é obrigatório.');
    await setDoc(doc(db, COLLECTIONS.AGENDA, id), sanitizeFirestoreData(newEvent), { merge: true });
    agendaCache = [newEvent, ...agendaCache.filter(a => a.id !== id)];

    return newEvent;
  }
}

export const recruitmentService = RecruitmentService;
