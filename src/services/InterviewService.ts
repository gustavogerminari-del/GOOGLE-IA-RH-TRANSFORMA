import {
  addDoc,
  collection,
  doc,
  getDocs,
  getDoc,
  orderBy,
  query,
  updateDoc,
  setDoc,
  where,
} from '../firebase/firestore';
import { db } from '../lib/firebase';
import { sanitizeFirestoreData } from '../lib/firestoreUtils';
import { Interview, InterviewScheduleInput } from '../types/rh';
import { N8nService } from './N8nService';

const COLLECTION_NAME = 'entrevistas';

type StoredInterview = Interview & {
  companyId: string;
  empresaId: string;
  createdAt?: string;
  updatedAt?: string;
};

export class InterviewService {
  static async list(companyId?: string): Promise<Interview[]> {
    const base = collection(db, COLLECTION_NAME);
    if (!companyId) return [];
    const results = await Promise.allSettled([
      getDocs(query(base, where('companyId', '==', companyId))),
      getDocs(query(base, where('empresaId', '==', companyId))),
    ]);
    const records = new Map<string, Interview>();
    results.forEach(result => {
      if (result.status !== 'fulfilled') return;
      result.value.docs.forEach(item => records.set(item.id, { id: item.id, ...(item.data() as Omit<StoredInterview, 'id'>) }));
    });
    if (results.every(result => result.status === 'rejected')) throw (results[0] as PromiseRejectedResult).reason;
    return Array.from(records.values()).sort((left, right) => String((right as any).createdAt || '').localeCompare(String((left as any).createdAt || '')));
  }

  static async create(companyId: string, data: Omit<Interview, 'id' | 'status'>): Promise<Interview> {
    if (!companyId) throw new Error('Empresa obrigatória para agendar a entrevista.');
    if (!data.candidateId || !data.jobId || !data.date || !data.time || !data.interviewerName.trim()) {
      throw new Error('Candidato, vaga, data, horário e entrevistador são obrigatórios.');
    }
    const now = new Date().toISOString();
    const payload = sanitizeFirestoreData({
      ...data,
      companyId,
      empresaId: companyId,
      status: 'Agendada',
      createdAt: now,
      updatedAt: now,
    });
    const applicationKey = String((data as any).applicationId || data.candidateId || '').trim();
    const slotKey = [companyId, applicationKey, data.jobId, data.date, data.time]
      .map(value => String(value).replace(/[^a-zA-Z0-9_-]/g, '_'))
      .join('__');
    const interviewId = `int__${slotKey}`;
    const interviewRef = doc(db, COLLECTION_NAME, interviewId);
    const existing = await getDoc(interviewRef);
    if (!existing.exists()) {
      await setDoc(interviewRef, payload);
    }
    await N8nService.sendSafely(existing.exists() ? 'interview_updated' : 'interview_scheduled', companyId, {
      entityId: interviewId,
      interviewId,
      applicationId: (data as any).applicationId || '',
      candidateId: data.candidateId,
      candidateName: (data as any).candidateName || '',
      candidateEmail: (data as any).candidateEmail || '',
      jobId: data.jobId,
      jobTitle: (data as any).jobTitle || '',
      recruiterEmail: (data as any).recruiterEmail || '',
      interviewerName: data.interviewerName,
      interviewerEmail: (data as any).interviewerEmail || '',
      startAt: `${data.date}T${data.time}`,
      endAt: `${data.date}T${(data as any).endTime || data.time}`,
      timezone: (data as any).timezone || 'America/Sao_Paulo',
      type: String((data as any).type || (data as any).modality || '').toLowerCase().includes('meet') ? 'ONLINE' : (data as any).type,
      location: (data as any).location || '',
    });
    return { ...data, id: interviewId, status: existing.exists() ? ((existing.data() as any).status || 'Agendada') : 'Agendada' };
  }

  static async updateSchedule(companyId: string, data: InterviewScheduleInput): Promise<Interview> {
    if (!companyId || !data.id) throw new Error('Empresa e entrevista são obrigatórias para atualizar o agendamento.');
    const currentRef = doc(db, COLLECTION_NAME, data.id);
    const current = await getDoc(currentRef);
    if (!current.exists()) throw new Error('Entrevista não encontrada.');
    const currentCompanyId = String((current.data() as any).companyId || (current.data() as any).empresaId || '').trim();
    if (!currentCompanyId || currentCompanyId !== companyId) throw new Error('Entrevista não pertence à empresa informada.');
    const updated: Interview = {
      ...(data as Interview),
      id: data.id,
      status: 'Reagendada',
    };
    await setDoc(currentRef, sanitizeFirestoreData({
      ...updated,
      companyId,
      empresaId: companyId,
      updatedAt: new Date().toISOString(),
    }), { merge: true });
    await N8nService.sendSafely('interview_updated', companyId, {
      entityId: data.id,
      interviewId: data.id,
      applicationId: (data as any).applicationId || '',
      candidateId: data.candidateId,
      jobId: data.jobId,
      startAt: `${data.date}T${data.time}`,
      endAt: `${data.date}T${(data as any).endTime || data.time}`,
      timezone: (data as any).timezone || 'America/Sao_Paulo',
    });
    return updated;
  }

  static async cancel(companyId: string, id: string): Promise<void> {
    if (!companyId || !id) throw new Error('Empresa e entrevista são obrigatórias para cancelar o agendamento.');
    const currentRef = doc(db, COLLECTION_NAME, id);
    const current = await getDoc(currentRef);
    if (!current.exists()) throw new Error('Entrevista não encontrada.');
    const currentCompanyId = String((current.data() as any).companyId || (current.data() as any).empresaId || '').trim();
    if (!currentCompanyId || currentCompanyId !== companyId) throw new Error('Entrevista não pertence à empresa informada.');
    await setDoc(currentRef, sanitizeFirestoreData({
      companyId,
      empresaId: companyId,
      status: 'Cancelada',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }), { merge: true });
    await N8nService.sendSafely('interview_cancelled', companyId, { entityId: id, interviewId: id });
  }

  static async updateFeedback(
    id: string,
    feedback: NonNullable<Interview['feedback']>,
  ): Promise<void> {
    await updateDoc(doc(db, COLLECTION_NAME, id), sanitizeFirestoreData({
      feedback,
      status: 'Concluída',
      updatedAt: new Date().toISOString(),
    }));
  }
}
