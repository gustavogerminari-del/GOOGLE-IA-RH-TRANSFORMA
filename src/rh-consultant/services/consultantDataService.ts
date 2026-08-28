import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc 
} from '../../firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  sanitizeFirestoreData, 
  safeFirestoreRead, 
  safeFirestoreWrite, 
  OperationType 
} from '../../lib/firestoreUtils';
import { 
  ConsultantClient, 
  ConsultantJob, 
  ConsultantCandidateScreening 
} from '../types';

const COLLECTIONS = {
  CLIENTS: 'consultant_clients',
  JOBS: 'consultant_jobs',
  SCREENINGS: 'consultant_screenings'
};

let clientsCache: ConsultantClient[] = [];
let jobsCache: ConsultantJob[] = [];
let screeningsCache: ConsultantCandidateScreening[] = [];

export async function syncConsultantDataWithFirestore(): Promise<void> {
  const readClients = await safeFirestoreRead(
    async () => {
      const snap = await getDocs(collection(db, COLLECTIONS.CLIENTS));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ConsultantClient));
    },
    OperationType.LIST,
    COLLECTIONS.CLIENTS,
    []
  );
  if (readClients.data.length > 0) {
    clientsCache = readClients.data;
  }

  const readJobs = await safeFirestoreRead(
    async () => {
      const snap = await getDocs(collection(db, COLLECTIONS.JOBS));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ConsultantJob));
    },
    OperationType.LIST,
    COLLECTIONS.JOBS,
    []
  );
  if (readJobs.data.length > 0) {
    jobsCache = readJobs.data;
  }

  const readScreenings = await safeFirestoreRead(
    async () => {
      const snap = await getDocs(collection(db, COLLECTIONS.SCREENINGS));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ConsultantCandidateScreening));
    },
    OperationType.LIST,
    COLLECTIONS.SCREENINGS,
    []
  );
  if (readScreenings.data.length > 0) {
    screeningsCache = readScreenings.data;
  }
}

// Initial Sync
syncConsultantDataWithFirestore();

export class ConsultantDataService {
  static getClients(): ConsultantClient[] {
    return clientsCache;
  }

  static async saveClient(client: ConsultantClient): Promise<ConsultantClient> {
    const id = client.id || `ccli-${Date.now()}`;
    const clientToSave: ConsultantClient = {
      ...client,
      id
    };

    clientsCache = [clientToSave, ...clientsCache.filter(c => c.id !== id)];

    const res = await safeFirestoreWrite(
      async () => {
        await setDoc(doc(db, COLLECTIONS.CLIENTS, id), sanitizeFirestoreData(clientToSave), { merge: true });
        return clientToSave;
      },
      OperationType.WRITE,
      `${COLLECTIONS.CLIENTS}/${id}`
    );

    if (!res.success) {
      console.warn('[ConsultantDataService] Erro ao salvar cliente no Firestore:', res.error);
    }

    return clientToSave;
  }

  static getJobs(): ConsultantJob[] {
    return jobsCache;
  }

  static async saveJob(job: ConsultantJob): Promise<ConsultantJob> {
    const id = job.id || `cjob-${Date.now()}`;
    const jobToSave: ConsultantJob = {
      ...job,
      id
    };

    jobsCache = [jobToSave, ...jobsCache.filter(j => j.id !== id)];

    const res = await safeFirestoreWrite(
      async () => {
        await setDoc(doc(db, COLLECTIONS.JOBS, id), sanitizeFirestoreData(jobToSave), { merge: true });
        return jobToSave;
      },
      OperationType.WRITE,
      `${COLLECTIONS.JOBS}/${id}`
    );

    if (!res.success) {
      console.warn('[ConsultantDataService] Erro ao salvar vaga de consultoria no Firestore:', res.error);
    }

    return jobToSave;
  }

  static getScreenings(jobId?: string): ConsultantCandidateScreening[] {
    if (jobId) {
      return screeningsCache.filter(s => s.jobId === jobId);
    }
    return screeningsCache;
  }

  static async saveScreening(screening: ConsultantCandidateScreening): Promise<ConsultantCandidateScreening> {
    const id = screening.id || `scr-${Date.now()}`;
    const screeningToSave: ConsultantCandidateScreening = {
      ...screening,
      id
    };

    screeningsCache = [screeningToSave, ...screeningsCache.filter(s => s.id !== id)];

    const res = await safeFirestoreWrite(
      async () => {
        await setDoc(doc(db, COLLECTIONS.SCREENINGS, id), sanitizeFirestoreData(screeningToSave), { merge: true });
        return screeningToSave;
      },
      OperationType.WRITE,
      `${COLLECTIONS.SCREENINGS}/${id}`
    );

    if (!res.success) {
      console.warn('[ConsultantDataService] Erro ao salvar triagem no Firestore:', res.error);
    }

    return screeningToSave;
  }
}
