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
import { Candidate } from '../types/rh';
import { AuditService } from './AuditService';
import { requireTenantId } from '../lib/tenant';

const COLLECTION_NAME = 'candidatos';
const LEGACY_COLLECTION_NAME = 'candidates';
const APPLICATIONS_COLLECTION = 'candidaturas';

type CandidateRecord = Candidate & Record<string, any>;

const normalizeCandidateEmail = (value: unknown): string =>
  String(value || '').trim().toLowerCase();

const normalizeCandidatePhone = (value: unknown): string => {
  let digits = String(value || '').replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return '';
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) digits = '55' + digits;
  return digits;
};

const candidateTenant = (data: Record<string, any>): string =>
  String(data.empresaId || data.companyId || '').trim();

const candidateTime = (data: Record<string, any>): number => {
  for (const key of ['updatedAt', 'receivedAt', 'createdAt', 'appliedDate']) {
    const raw = data?.[key];
    if (!raw) continue;
    const parsed = new Date(String(raw)).getTime();
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const isMeaningfulCandidateValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

const identityMatches = (a: Record<string, any>, b: Record<string, any>): boolean => {
  const tenantA = candidateTenant(a);
  const tenantB = candidateTenant(b);
  if (!tenantA || !tenantB || tenantA !== tenantB) return false;
  const emailA = normalizeCandidateEmail(a.emailNormalizado || a.email);
  const emailB = normalizeCandidateEmail(b.emailNormalizado || b.email);
  const phoneA = normalizeCandidatePhone(a.telefoneNormalizado || a.phone || a.telefone);
  const phoneB = normalizeCandidatePhone(b.telefoneNormalizado || b.phone || b.telefone);
  return Boolean((emailA && emailB && emailA === emailB) || (phoneA && phoneB && phoneA === phoneB));
};

const resumeEntry = (data: Record<string, any>) => {
  const url = String(data.resumeUrl || data.curriculoUrl || '').trim();
  if (!url) return null;
  return {
    url,
    fileName: String(data.resumeFileName || data.curriculoNome || ''),
    documentId: String(data.resumeDocumentId || ''),
    receivedAt: String(data.updatedAt || data.createdAt || data.appliedDate || new Date().toISOString()),
    source: String(data.sourceCode || data.origem || data.source || ''),
  };
};

const collectResumeHistory = (...records: Record<string, any>[]) => {
  const byKey = new Map<string, any>();
  for (const record of records) {
    const existing = Array.isArray(record?.resumeHistory) ? record.resumeHistory : [];
    for (const item of existing) {
      if (!item) continue;
      const key = String(item.documentId || item.url || '').trim();
      if (key) byKey.set(key, item);
    }
    const current = resumeEntry(record || {});
    if (current) byKey.set(String(current.documentId || current.url), current);
  }
  return [...byKey.values()].sort((a, b) => candidateTime(b) - candidateTime(a));
};

const collectOriginHistory = (...records: Record<string, any>[]) => {
  const values = new Set<string>();
  for (const record of records) {
    const existing = Array.isArray(record?.origens) ? record.origens : [];
    existing.forEach((value: unknown) => { const clean = String(value || '').trim(); if (clean) values.add(clean); });
    for (const value of [record?.sourceCode, record?.origem, record?.source]) {
      const clean = String(value || '').trim();
      if (clean) values.add(clean);
    }
  }
  return [...values];
};

const mergeNewestOverExisting = (existing: CandidateRecord, incoming: Record<string, any>, keepId: string): CandidateRecord => {
  const merged: Record<string, any> = { ...existing };
  for (const [key, value] of Object.entries(incoming || {})) {
    if (isMeaningfulCandidateValue(value)) merged[key] = value;
  }
  merged.id = keepId;
  merged.resumeHistory = collectResumeHistory(existing, incoming, merged);
  merged.origens = collectOriginHistory(existing, incoming, merged);
  return merged as CandidateRecord;
};

const fillCandidateBlanks = (newest: CandidateRecord, older: CandidateRecord): CandidateRecord => {
  const merged: Record<string, any> = { ...newest };
  for (const [key, value] of Object.entries(older || {})) {
    if (!isMeaningfulCandidateValue(merged[key]) && isMeaningfulCandidateValue(value)) merged[key] = value;
  }
  merged.id = newest.id;
  merged.resumeHistory = collectResumeHistory(newest, older);
  merged.origens = collectOriginHistory(newest, older);
  merged.deduplicatedIds = [...new Set([
    ...(Array.isArray(newest.deduplicatedIds) ? newest.deduplicatedIds : []),
    ...(Array.isArray(older.deduplicatedIds) ? older.deduplicatedIds : []),
    newest.id, older.id,
  ].filter(Boolean))];
  return merged as CandidateRecord;
};

const deduplicateCandidateRecords = (records: CandidateRecord[]): CandidateRecord[] => {
  const sorted = [...records].sort((a, b) => candidateTime(b) - candidateTime(a));
  const result: CandidateRecord[] = [];
  for (const raw of sorted) {
    const candidate = {
      ...raw,
      emailNormalizado: normalizeCandidateEmail(raw.emailNormalizado || raw.email),
      telefoneNormalizado: normalizeCandidatePhone(raw.telefoneNormalizado || raw.phone || raw.telefone),
    } as CandidateRecord;
    const duplicateIndex = result.findIndex(existing => identityMatches(existing, candidate));
    if (duplicateIndex < 0) result.push(candidate);
    else result[duplicateIndex] = fillCandidateBlanks(result[duplicateIndex], candidate);
  }
  return result;
};

export interface ApplicationDoc {
  id: string;
  companyId: string;
  jobId: string;
  vagaId: string;
  candidateId: string;
  stage: string;
  rating?: number;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  status: string;
}

export class CandidateService {
  static async uploadTalentResume(companyId: string, candidateId: string, file: File): Promise<{ url: string; fileName: string }> {
    const tenant = requireTenantId(companyId, 'anexar currículo ao talento');
    if (!candidateId || !file) throw new Error('Candidato e arquivo são obrigatórios para o upload.');
    if (file.size <= 0 || file.size > 10 * 1024 * 1024) throw new Error('O currículo deve possuir até 10 MB.');
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['pdf', 'doc', 'docx'].includes(extension)) throw new Error('Envie o currículo em PDF, DOC ou DOCX.');
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Sua sessão expirou. Entre novamente para enviar o currículo.');

    const formData = new FormData();
    formData.set('file', file, file.name);
    formData.set('submissionMode', 'talent_bank');
    formData.set('companyId', tenant);
    formData.set('candidateId', candidateId);

    const response = await fetch('/api/public-resumes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const raw = await response.text();
    let result: any = null;
    try { result = raw ? JSON.parse(raw) : null; } catch { /* handled below */ }
    if (!response.ok || !result?.success || !result?.url) {
      throw new Error(String(result?.error || 'Não foi possível enviar o currículo ao Banco de Talentos.'));
    }
    return { url: String(result.url), fileName: String(result.fileName || file.name) };
  }

  static async create(candidateData: Partial<Candidate> & { companyId?: string }): Promise<Candidate> {
    const user = auth.currentUser;
    const nowIso = new Date().toISOString();
    const today = nowIso.slice(0, 10);
    const companyId = requireTenantId(candidateData.companyId, 'cadastrar o candidato');
    const emailNormalizado = normalizeCandidateEmail(candidateData.email);
    const telefoneNormalizado = normalizeCandidatePhone((candidateData as any).phone || (candidateData as any).telefone);
    if (!candidateData.name?.trim() || (!emailNormalizado && !telefoneNormalizado)) {
      throw new Error('Nome e pelo menos um contato (e-mail ou telefone) são obrigatórios.');
    }

    const existingCandidates = await this.list(companyId);
    const identityProbe = {
      companyId, empresaId: companyId,
      email: emailNormalizado, emailNormalizado,
      phone: (candidateData as any).phone || '', telefoneNormalizado,
    };
    const existing = existingCandidates.find(item => identityMatches(item as CandidateRecord, identityProbe)) as CandidateRecord | undefined;
    const id = existing?.id || candidateData.id || `cand-${Date.now()}`;
    const source = String((candidateData as any).source || existing?.source || 'Outro').trim();
    const sourceCode = String((candidateData as any).sourceCode || (
      /google/i.test(source) ? 'GOOGLE_SOURCING' :
      /portal/i.test(source) ? 'PORTAL_RH_TRANSFORMA' :
      /import/i.test(source) ? 'IMPORTACAO' : 'CADASTRO_MANUAL'
    ));

    const incoming: Record<string, any> = {
      ...(candidateData as any),
      id,
      name: candidateData.name.trim(),
      email: emailNormalizado || existing?.email || '',
      emailNormalizado: emailNormalizado || existing?.emailNormalizado || '',
      phone: String((candidateData as any).phone || existing?.phone || '').trim(),
      telefoneNormalizado: telefoneNormalizado || existing?.telefoneNormalizado || '',
      role: candidateData.role || existing?.role || '',
      location: candidateData.location || existing?.location || '',
      experienceYears: Number(candidateData.experienceYears ?? existing?.experienceYears ?? 0),
      skills: Array.isArray(candidateData.skills) && candidateData.skills.length ? candidateData.skills : (existing?.skills || []),
      status: candidateData.status || existing?.status || 'Em Processo',
      currentJobId: candidateData.currentJobId || existing?.currentJobId || '',
      currentStageId: candidateData.currentStageId || existing?.currentStageId || 'triagem',
      rating: Number(candidateData.rating ?? existing?.rating ?? 0),
      notes: candidateData.notes || existing?.notes || '',
      avatar: candidateData.avatar || existing?.avatar || '',
      appliedDate: candidateData.appliedDate || existing?.appliedDate || today,
      source,
      sourceCode,
      salaryExpectation: candidateData.salaryExpectation || existing?.salaryExpectation || 'A combinar',
      resumeUrl: candidateData.resumeUrl || existing?.resumeUrl || '',
      companyId,
      empresaId: companyId,
      createdBy: existing?.createdBy || user?.uid || 'system',
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
      deduplicatedAt: existing ? nowIso : undefined,
    };
    const candidate = mergeNewestOverExisting(existing || ({} as CandidateRecord), incoming, id);

    try {
      await setDoc(doc(db, COLLECTION_NAME, id), sanitizeFirestoreData(candidate), { merge: true });
      await AuditService.log({
        action: existing ? 'UPDATE' : 'CREATE',
        description: existing
          ? `Candidato ${candidate.name} atualizado sem duplicidade por e-mail/telefone`
          : `Candidato ${candidate.name} cadastrado no Banco de Talentos`,
        moduleName: 'Banco de Talentos',
        targetEntity: 'Candidato',
        companyId
      });
    } catch (err) {
      console.error('Erro ao salvar candidato no Firestore:', err);
      throw err;
    }

    return candidate as Candidate;
  }

  static async update(id: string, data: Partial<Candidate> & { companyId?: string }): Promise<void> {
    try {
      const current = await this.getById(id) as CandidateRecord | null;
      if (!current) throw new Error('Candidato não encontrado.');
      const companyId = requireTenantId(data.companyId || current.companyId || current.empresaId, 'atualizar o candidato');
      const incoming: Record<string, any> = { ...data };
      if ('email' in incoming) incoming.email = normalizeCandidateEmail(incoming.email);
      const displayPhone = String(incoming.phone ?? incoming.telefone ?? '').trim();
      if (displayPhone) incoming.phone = displayPhone;
      const merged = mergeNewestOverExisting(current, incoming, id);
      merged.companyId = companyId;
      merged.empresaId = companyId;
      merged.emailNormalizado = normalizeCandidateEmail(merged.email);
      merged.telefoneNormalizado = normalizeCandidatePhone(merged.phone || merged.telefone);
      if (!merged.emailNormalizado && !merged.telefoneNormalizado) {
        throw new Error('O candidato precisa manter pelo menos um contato: e-mail ou telefone.');
      }
      merged.updatedAt = new Date().toISOString();
      merged.resumeHistory = collectResumeHistory(current, incoming, merged);
      merged.origens = collectOriginHistory(current, incoming, merged);

      await setDoc(doc(db, COLLECTION_NAME, id), sanitizeFirestoreData(merged), { merge: true });

      await AuditService.log({
        action: 'UPDATE',
        description: `Candidato ${id} atualizado`,
        moduleName: 'Banco de Talentos',
        targetEntity: 'Candidato',
        companyId
      });
    } catch (err) {
      console.error('Erro ao atualizar candidato no Firestore:', err);
      throw err;
    }
  }

  static async delete(id: string, requestedCompanyId?: string): Promise<void> {
    try {
      const current = await this.getById(id) as (Candidate & { companyId?: string; empresaId?: string }) | null;
      if (!current) throw new Error('Candidato não encontrado.');
      const companyId = requireTenantId(requestedCompanyId || current.companyId || current.empresaId, 'excluir o candidato');
      if ((current.companyId || current.empresaId) !== companyId) {
        throw new Error('Exclusão bloqueada: o candidato pertence a outra empresa.');
      }
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      await AuditService.log({
        action: 'DELETE',
        description: `Candidato ${id} excluído do Banco de Talentos`,
        moduleName: 'Banco de Talentos',
        targetEntity: 'Candidato',
        companyId,
      });
    } catch (err) {
      console.error('Erro ao excluir candidato no Firestore:', err);
      throw err;
    }
  }

  static async getById(id: string): Promise<Candidate | null> {
    try {
      for (const collectionName of [COLLECTION_NAME, LEGACY_COLLECTION_NAME]) {
        const snap = await getDoc(doc(db, collectionName, id));
        if (snap.exists()) return { ...(snap.data() as Candidate), id: snap.id };
      }
    } catch (err) {
      console.error('Erro em CandidateService.getById:', err);
      throw err;
    }
    return null;
  }

  static async get(id: string): Promise<Candidate | null> {
    return this.getById(id);
  }

  static async list(companyId?: string): Promise<Candidate[]> {
    try {
      const candidatesById = new Map<string, CandidateRecord>();
      const applicationsById = new Map<string, Record<string, any>>();

      const addCandidateDocs = (docs: any[], forcedTenant?: string) => {
        for (const item of docs) {
          const data = item.data() as CandidateRecord;
          const tenant = candidateTenant(data) || forcedTenant || '';
          if (companyId && tenant && tenant !== companyId) continue;
          const normalized = {
            ...data, id: item.id,
            companyId: data.companyId || tenant,
            empresaId: data.empresaId || tenant,
          } as CandidateRecord;
          const prior = candidatesById.get(item.id);
          if (!prior || candidateTime(normalized) >= candidateTime(prior)) candidatesById.set(item.id, normalized);
        }
      };

      const addApplicationDocs = (docs: any[]) => {
        for (const item of docs) {
          const data = { ...item.data(), id: item.id } as Record<string, any>;
          const candidateId = String(data.candidateId || data.candidatoId || '').trim();
          if (!candidateId) continue;
          const prior = applicationsById.get(candidateId);
          if (!prior || candidateTime(data) >= candidateTime(prior)) applicationsById.set(candidateId, data);
        }
      };

      const safeGet = async (operation: Promise<any>, onDocs: (docs: any[]) => void) => {
        try { const snap = await operation; onDocs(snap.docs || []); }
        catch (error) { console.warn('[CANDIDATE_DEDUPE_QUERY_SKIPPED]', error); }
      };

      if (!companyId) {
        await safeGet(getDocs(collection(db, COLLECTION_NAME)), docs => addCandidateDocs(docs));
        await safeGet(getDocs(collection(db, LEGACY_COLLECTION_NAME)), docs => addCandidateDocs(docs));
        await safeGet(getDocs(collection(db, APPLICATIONS_COLLECTION)), docs => addApplicationDocs(docs));
      } else {
        for (const collectionName of [COLLECTION_NAME, LEGACY_COLLECTION_NAME]) {
          await safeGet(getDocs(query(collection(db, collectionName), where('empresaId', '==', companyId))), docs => addCandidateDocs(docs, companyId));
          await safeGet(getDocs(query(collection(db, collectionName), where('companyId', '==', companyId))), docs => addCandidateDocs(docs, companyId));
        }
        await safeGet(getDocs(query(collection(db, APPLICATIONS_COLLECTION), where('empresaId', '==', companyId))), docs => addApplicationDocs(docs));
        await safeGet(getDocs(query(collection(db, APPLICATIONS_COLLECTION), where('companyId', '==', companyId))), docs => addApplicationDocs(docs));
      }

      const enriched = [...candidatesById.values()].map(candidate => {
        const latestApplication = applicationsById.get(candidate.id);
        if (!latestApplication || candidateTime(latestApplication) < candidateTime(candidate)) {
          return {
            ...candidate,
            emailNormalizado: normalizeCandidateEmail(candidate.emailNormalizado || candidate.email),
            telefoneNormalizado: normalizeCandidatePhone(candidate.telefoneNormalizado || candidate.phone || candidate.telefone),
            resumeHistory: collectResumeHistory(candidate),
            origens: collectOriginHistory(candidate),
          } as CandidateRecord;
        }
        const appLocation = [latestApplication.city, latestApplication.state].filter(Boolean).join(' - ');
        const overlay: Record<string, any> = {
          name: latestApplication.name,
          email: latestApplication.email,
          phone: latestApplication.phone,
          role: latestApplication.role,
          location: appLocation,
          resumeUrl: latestApplication.resumeUrl,
          resumeFileName: latestApplication.resumeFileName,
          resumeDocumentId: latestApplication.resumeDocumentId,
          updatedAt: latestApplication.updatedAt || latestApplication.createdAt,
          sourceCode: latestApplication.sourceCode || 'PORTAL_RH_TRANSFORMA',
          source: candidate.source || 'Portal Público',
        };
        const merged = mergeNewestOverExisting(candidate, overlay, candidate.id);
        merged.emailNormalizado = normalizeCandidateEmail(merged.email);
        merged.telefoneNormalizado = normalizeCandidatePhone(merged.phone || merged.telefone);
        return merged;
      });

      return deduplicateCandidateRecords(enriched) as Candidate[];
    } catch (err) {
      console.error('Erro em CandidateService.list:', err);
      throw err;
    }
  }

  static async reconcileClosedJobsToTalentBank(companyId: string): Promise<number> {
    const tenant = requireTenantId(companyId, 'reconciliar o Banco de Talentos');
    const terminalStatuses = new Set([
      'concluída', 'concluida', 'preenchida', 'fechada', 'encerrada', 'arquivada',
      'cancelada', 'finalizada', 'finalizado', 'closed', 'filled'
    ]);
    const hiredStatuses = new Set([
      'contratado', 'contratada', 'admitido', 'admitida', 'admissão', 'admissao', 'hired'
    ]);

    const jobs = new Map<string, Record<string, any>>();
    const applications = new Map<string, { id: string; ref: any; data: Record<string, any> }>();

    const safeDocs = async (operation: Promise<any>, onDoc: (item: any) => void) => {
      try {
        const snap = await operation;
        (snap.docs || []).forEach(onDoc);
      } catch (error) {
        console.warn('[TALENT_BANK_RECONCILIATION_QUERY_SKIPPED]', error);
      }
    };

    for (const tenantField of ['empresaId', 'companyId']) {
      await safeDocs(
        getDocs(query(collection(db, 'vagas'), where(tenantField, '==', tenant))),
        item => jobs.set(item.id, { ...item.data(), id: item.id })
      );
      await safeDocs(
        getDocs(query(collection(db, APPLICATIONS_COLLECTION), where(tenantField, '==', tenant))),
        item => applications.set(item.id, { id: item.id, ref: item.ref, data: { ...item.data(), id: item.id } })
      );
    }

    const closedJobIds = new Set<string>();
    for (const [jobId, job] of jobs) {
      const status = String(job.status || job.statusVaga || '').trim().toLowerCase();
      if (
        terminalStatuses.has(status)
        || Boolean(job.concluidaEm || job.preenchidaEm || job.encerradaEm || job.finalizadaEm)
      ) closedJobIds.add(jobId);
    }

    if (closedJobIds.size === 0 && applications.size === 0) return 0;

    const existingCandidates = await this.list(tenant) as CandidateRecord[];
    let changed = 0;

    for (const applicationEntry of applications.values()) {
      const application = applicationEntry.data;
      const jobId = String(application.jobId || application.vagaId || '').trim();
      const appStatus = String(application.status || '').trim().toLowerCase();
      const appStage = String(application.etapa || application.stage || '').trim().toLowerCase();
      const explicitlyTalent = application.inTalentBank === true || application.manterBancoTalentos === true;
      const belongsToClosedJob = Boolean(jobId && closedJobIds.has(jobId));
      if (!explicitlyTalent && !belongsToClosedJob) continue;

      const isHired = application.contratado === true
        || application.isHired === true
        || hiredStatuses.has(appStatus)
        || hiredStatuses.has(appStage)
        || appStatus.includes('contratad')
        || appStage.includes('contratad')
        || appStatus.includes('admitid')
        || appStage.includes('admitid');
      if (isHired) continue;

      const appEmail = normalizeCandidateEmail(application.email || application.candidateEmail || application.contato?.email);
      const appPhone = normalizeCandidatePhone(application.phone || application.telefone || application.candidatePhone || application.contato?.telefone);
      const applicationCandidateId = String(application.candidateId || application.candidatoId || '').trim();
      const identityProbe = {
        companyId: tenant,
        empresaId: tenant,
        email: appEmail,
        emailNormalizado: appEmail,
        phone: application.phone || application.telefone || '',
        telefoneNormalizado: appPhone,
      };

      const existing = existingCandidates.find(item =>
        (applicationCandidateId && item.id === applicationCandidateId)
        || identityMatches(item as CandidateRecord, identityProbe)
      ) as CandidateRecord | undefined;

      const existingStatus = String(existing?.status || '').trim().toLowerCase();
      if (existingStatus.includes('contratad') || existingStatus.includes('admitid')) continue;

      const candidateId = existing?.id || applicationCandidateId || ('talent-' + applicationEntry.id);
      const now = new Date().toISOString();
      const incoming: Record<string, any> = {
        id: candidateId,
        companyId: tenant,
        empresaId: tenant,
        name: String(application.name || application.nome || application.candidateName || application.nomeCompleto || existing?.name || '').trim(),
        email: appEmail || existing?.email || '',
        emailNormalizado: appEmail || existing?.emailNormalizado || '',
        phone: String(application.phone || application.telefone || application.candidatePhone || existing?.phone || '').trim(),
        telefoneNormalizado: appPhone || existing?.telefoneNormalizado || '',
        role: String(application.role || application.cargo || application.jobTitle || application.vagaTitulo || existing?.role || '').trim(),
        location: String(application.location || application.cidade || application.cityState || existing?.location || '').trim(),
        experienceYears: Number(application.experienceYears ?? existing?.experienceYears ?? 0),
        skills: Array.isArray(application.skills) && application.skills.length
          ? application.skills
          : (Array.isArray(application.competencias) && application.competencias.length ? application.competencias : (existing?.skills || [])),
        resumeUrl: String(application.resumeUrl || application.curriculoUrl || existing?.resumeUrl || '').trim(),
        resumeFileName: String(application.resumeFileName || existing?.resumeFileName || '').trim(),
        resumeDocumentId: String(application.resumeDocumentId || existing?.resumeDocumentId || '').trim(),
        notes: application.notes || existing?.notes || '',
        source: existing?.source || application.source || application.origem || 'Vaga Encerrada',
        sourceCode: existing?.sourceCode || 'VAGA_ENCERRADA',
        inTalentBank: true,
        manterBancoTalentos: true,
        status: 'Ativo',
        currentJobId: '',
        currentStageId: 'banco-talentos',
        talentBankOriginJobId: jobId,
        talentBankReason: 'VAGA_ENCERRADA',
        talentBankSince: existing?.talentBankSince || now,
        createdAt: existing?.createdAt || application.createdAt || now,
        updatedAt: now,
      };

      const merged = mergeNewestOverExisting(existing || ({} as CandidateRecord), incoming, candidateId);
      merged.companyId = tenant;
      merged.empresaId = tenant;
      merged.inTalentBank = true;
      merged.manterBancoTalentos = true;
      merged.status = 'Ativo';
      merged.currentJobId = '';
      merged.currentStageId = 'banco-talentos';
      merged.talentBankReason = 'VAGA_ENCERRADA';
      merged.talentBankOriginJobId = jobId;
      merged.updatedAt = now;

      try {
        await setDoc(doc(db, COLLECTION_NAME, candidateId), sanitizeFirestoreData(merged), { merge: true });
        changed += 1;
        const index = existingCandidates.findIndex(item => item.id === candidateId);
        if (index >= 0) existingCandidates[index] = merged;
        else existingCandidates.push(merged);

        try {
          await setDoc(applicationEntry.ref, sanitizeFirestoreData({
            companyId: tenant,
            empresaId: tenant,
            candidateId,
            candidatoId: candidateId,
            inTalentBank: true,
            manterBancoTalentos: true,
            talentBankReason: 'VAGA_ENCERRADA',
            talentBankOriginJobId: jobId,
            updatedAt: now,
          }), { merge: true });
        } catch (applicationUpdateError) {
          console.warn('[TALENT_BANK_RECONCILIATION_APPLICATION_MARK_FAILED]', {
            applicationId: applicationEntry.id,
            candidateId,
            error: applicationUpdateError,
          });
        }
      } catch (error) {
        console.error('[TALENT_BANK_RECONCILIATION_PROFILE_FAILED]', {
          applicationId: applicationEntry.id,
          candidateId,
          companyId: tenant,
          error,
        });
      }
    }

    if (changed > 0) {
      console.info('[TALENT_BANK_RECONCILIATION_DONE]', { companyId: tenant, changed });
    }
    return changed;
  }

  // RH_TALENT_BANK_Firestore_VIEW_V1
  static async listTalentBank(companyId?: string): Promise<Candidate[]> {
    const tenant = requireTenantId(companyId, 'listar o Banco de Talentos');
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Sua sessão expirou. Entre novamente para acessar o Banco de Talentos.');
    const response = await fetch('/api/talent-bank/candidates?companyId=' + encodeURIComponent(tenant), {
      method: 'GET',
      headers: { accept: 'application/json', authorization: 'Bearer ' + token },
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(String(payload?.message || 'Não foi possível carregar o Banco de Talentos.'));
    return Array.isArray(payload?.candidates) ? payload.candidates : [];
  }

  static async search(term: string, companyId?: string): Promise<Candidate[]> {
    const all = await this.list(companyId);
    const lower = term.toLowerCase();
    return all.filter(c => 
      c.name.toLowerCase().includes(lower) || 
      c.email.toLowerCase().includes(lower) ||
      (c.role && c.role.toLowerCase().includes(lower)) ||
      c.skills.some(s => s.toLowerCase().includes(lower))
    );
  }

  static async count(companyId?: string): Promise<number> {
    const all = await this.list(companyId);
    return all.length;
  }

  static async paginate(page: number, pageSize: number, companyId?: string): Promise<{ items: Candidate[]; total: number }> {
    const all = await this.list(companyId);
    const start = (page - 1) * pageSize;
    return {
      items: all.slice(start, start + pageSize),
      total: all.length
    };
  }

  // CANDIDATURAS
  static async createApplication(app: Partial<ApplicationDoc>): Promise<ApplicationDoc> {
    const id = app.id || `app-${Date.now()}`;
    const user = auth.currentUser;
    const now = new Date().toISOString();

    const companyId = app.companyId?.trim();
    const jobId = app.jobId?.trim();
    const candidateId = app.candidateId?.trim();
    if (!companyId || !jobId || !candidateId) {
      throw new Error('Candidatura inválida: empresaId, vagaId e candidatoId são obrigatórios.');
    }

    const applicationDoc: ApplicationDoc = {
      id,
      companyId,
      jobId,
      vagaId: jobId,
      candidateId,
      stage: app.stage || 'triagem',
      rating: app.rating || 3,
      notes: app.notes || '',
      createdBy: user?.uid || 'candidate',
      createdAt: now,
      updatedAt: now,
      status: 'Em Análise'
    };

    try {
      await setDoc(doc(db, APPLICATIONS_COLLECTION, id), sanitizeFirestoreData(applicationDoc), { merge: true });
    } catch (err) {
      console.error('Erro ao salvar candidatura no Firestore:', err);
      throw err;
    }

    return applicationDoc;
  }

  static async getApplicationsForJob(jobId: string): Promise<ApplicationDoc[]> {
    try {
      const q = query(collection(db, APPLICATIONS_COLLECTION), where('jobId', '==', jobId));
      const snap = await getDocs(q);
      const list: ApplicationDoc[] = [];
      snap.forEach(d => list.push(d.data() as ApplicationDoc));
      return list;
    } catch (err) {
      console.error('Erro ao buscar candidaturas no Firestore:', err);
      throw err;
    }
  }
}
