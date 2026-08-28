import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  serverTimestamp
} from '../../firebase/firestore';
import { db } from '../../lib/firebase';
import { sanitizeFirestoreData, safeFirestoreWrite, safeFirestoreRead, OperationType } from '../../lib/firestoreUtils';
import { UnifiedCandidate, ProcessStage, UnifiedInterview } from '../types/recruitment';

export interface CandidaturaDoc {
  id: string; // `${vagaId}_${candidateId}` or auto ID
  empresaId: string;
  companyId?: string;
  vagaId: string;
  candidateId: string;
  status: 'Inscrito' | 'Em Análise' | 'Entrevista' | 'Aprovado' | 'Contratado' | 'Reprovado' | 'Desistiu';
  etapa: ProcessStage;
  matchIa?: number;
  triagemIaParecer?: string;
  origem?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateWithProcess extends UnifiedCandidate {
  candidaturaId?: string;
  etapaAtual?: ProcessStage;
  dataCandidatura?: string;
  dataAtualizacao?: string;
  origemCandidatura?: string;
  matchIaPercent?: number;
  cpf?: string;
  curso?: string;
  escolaridade?: string;
  empresaAnterior?: string;
  palavrasChaveCurriculo?: string[];
  pcd?: boolean;
  documentos?: Array<{ id: string; nome: string; tipo: string; url: string; dataUpload: string; status: 'Pendente' | 'Verificado' | 'Rejeitado' }>;
  anotacoes?: Array<{ id: string; autor: string; data: string; texto: string }>;
  avaliacoesRh?: Array<{ id: string; avaliador: string; data: string; notaGeral: number; notaTecnica: number; notaComportamental: number; parecer: string }>;
}

// Sample fallback candidates bound to a job ID for rich demo/first render
export function getSampleJobCandidates(_vagaId: string, _empresaId: string = ''): CandidateWithProcess[] {
  // Produção não fabrica candidatos. Estado vazio deve continuar vazio.
  return [];
}

export class VagaCandidatosService {
  /**
   * Realtime Listener for candidates subscribed to a specific job (`vagaId`).
   * Queries Firestore `candidaturas` where `vagaId == vagaId`.
   */
  static subscribeToVagaCandidates(
    vagaId: string, 
    empresaId: string, 
    callback: (candidates: CandidateWithProcess[]) => void
  ): () => void {
    if (!vagaId || !empresaId) {
      callback([]);
      return () => undefined;
    }
    const q = query(
      collection(db, 'candidaturas'),
      where('vagaId', '==', vagaId),
      where('empresaId', '==', empresaId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        callback([]);
        return;
      }

      const list: CandidateWithProcess[] = [];
      for (const docSnap of snapshot.docs) {
        const candData = docSnap.data() as CandidaturaDoc;
        const candidateId = candData.candidateId;

        // Fetch corresponding Candidate detail profile doc
        let candidateProfile: UnifiedCandidate | null = null;
        try {
          if (candidateId) {
            const profileRef = doc(db, 'candidatos', candidateId);
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
              candidateProfile = profileSnap.data() as UnifiedCandidate;
            }
          }
        } catch (e) {
          console.warn('Erro ao carregar perfil do candidato:', e);
        }

        const rawStage = ['novo', 'novos'].includes(String(candData.etapa || candData.status || '').toLowerCase())
          ? 'Inscrito'
          : String(candData.etapa || candData.status || 'Inscrito');
        const etapaAtual = rawStage as ProcessStage;

        const combined: CandidateWithProcess = {
          id: candidateId || docSnap.id,
          candidaturaId: docSnap.id,
          empresaId,
          companyId: empresaId,
          nome: candidateProfile?.nome || candidateProfile?.name || 'Candidato Sem Nome',
          email: candidateProfile?.email || '',
          telefone: candidateProfile?.telefone || candidateProfile?.phone || '',
          fotoUrl: candidateProfile?.fotoUrl || candidateProfile?.avatar,
          cidade: candidateProfile?.cidade || candidateProfile?.location || 'Não informada',
          cargoAtual: candidateProfile?.cargoAtual || candidateProfile?.role || '',
          cargoPretendido: candidateProfile?.cargoPretendido || '',
          escolaridade: candidateProfile?.escolaridade || '',
          experienciaAnos: Number(candidateProfile?.experienciaAnos || 0),
          pretensaoSalarial: candidateProfile?.pretensaoSalarial,
          competencias: candidateProfile?.competencias || [],
          status: candData.status === 'Contratado' ? 'Contratado' : candData.status === 'Reprovado' ? 'Indisponível' : 'Em Processo',
          etapaAtual,
          dataCandidatura: candData.createdAt || new Date().toISOString(),
          matchIaPercent: Number(candData.matchIa ?? candidateProfile?.matchIaPercent ?? 0),
          triagemIaScore: Number(candData.matchIa ?? candidateProfile?.triagemIaScore ?? 0),
          triagemIaParecer: candData.triagemIaParecer || candidateProfile?.triagemIaParecer || '',
          source: candData.origem || candidateProfile?.source || '',
          curriculoUrl: candidateProfile?.curriculoUrl || candidateProfile?.resumeUrl,
          curriculoTexto: candidateProfile?.curriculoTexto,
          linhaDoTempo: candidateProfile?.linhaDoTempo || [
            { data: candData.createdAt || new Date().toISOString(), titulo: 'Candidatou-se', detalhe: 'Inscrição efetuada na vaga' }
          ],
          anotacoes: candidateProfile?.anotacoes || [],
          documentos: candidateProfile?.documentos || []
        };

        list.push(combined);
      }

      callback(list);
    }, (err) => {
      console.error('Firestore Snapshot error for vaga candidatos:', err);
      callback([]);
    });

    return unsubscribe;
  }

  /**
   * Save or Update Candidacy (Deduplication requirement: 1 candidacy per vagaId + candidateId)
   */
  static async saveOrUpdateCandidatura(data: {
    empresaId: string;
    vagaId: string;
    candidateId: string;
    etapa?: ProcessStage;
    status?: 'Inscrito' | 'Em Análise' | 'Entrevista' | 'Aprovado' | 'Contratado' | 'Reprovado' | 'Desistiu';
    matchIa?: number;
    triagemIaParecer?: string;
    origem?: string;
  }): Promise<string> {
    const docId = `${data.vagaId}_${data.candidateId}`;
    const docRef = doc(db, 'candidaturas', docId);

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const candidaturaObj: CandidaturaDoc = {
      id: docId,
      empresaId: data.empresaId,
      companyId: data.empresaId,
      vagaId: data.vagaId,
      candidateId: data.candidateId,
      status: data.status || 'Inscrito',
      etapa: data.etapa || 'Inscrito',
      matchIa: Number(data.matchIa ?? 0),
      triagemIaParecer: data.triagemIaParecer || '',
      origem: data.origem || '',
      createdAt: now,
      updatedAt: now
    };

    await safeFirestoreWrite(
      async () => {
        await setDoc(docRef, sanitizeFirestoreData(candidaturaObj), { merge: true });
      },
      OperationType.WRITE,
      `candidaturas/${docId}`
    );

    return docId;
  }

  /**
   * Move stage of a candidate
   */
  static async moveStage(candidaturaId: string, candidateId: string, newStage: ProcessStage, empresaId: string): Promise<void> {
    if (!candidaturaId || candidaturaId.startsWith('candproc-')) throw new Error('Candidatura real não identificada.');
    if (!candidateId || !empresaId) throw new Error('Candidato e empresa são obrigatórios para mover a etapa.');
    const docRef = doc(db, 'candidaturas', candidaturaId);
    const current = await getDoc(docRef);
    if (!current.exists()) throw new Error('Candidatura não encontrada.');
    const data = current.data() as CandidaturaDoc;
    const tenant = String(data.empresaId || data.companyId || '').trim();
    if (!tenant || tenant !== empresaId) throw new Error('Candidatura não pertence à empresa informada.');
    if (String(data.candidateId || '') !== String(candidateId)) throw new Error('Candidato não corresponde à candidatura informada.');
    await safeFirestoreWrite(
      async () => {
        await updateDoc(docRef, {
          etapa: newStage,
          status: newStage === 'Contratado' ? 'Contratado' : newStage === 'Reprovado' ? 'Reprovado' : 'Em Análise',
          updatedAt: new Date().toISOString()
        });
      },
      OperationType.UPDATE,
      `candidaturas/${candidaturaId}`
    );
  }

  /**
   * Add team annotation/note to a candidate profile
   */
  static async addAnnotation(candidateId: string, autor: string, texto: string): Promise<void> {
    if (!candidateId.startsWith('cand-')) {
      const candRef = doc(db, 'candidatos', candidateId);
      const candRead = await safeFirestoreRead(
        async () => getDoc(candRef),
        OperationType.GET,
        `candidatos/${candidateId}`,
        null
      );
      if (candRead.data && candRead.data.exists()) {
        const existingNotes = candRead.data.data().anotacoes || [];
        const newNote = {
          id: `note-${Date.now()}`,
          autor,
          data: new Date().toISOString().replace('T', ' ').substring(0, 16),
          texto
        };
        await safeFirestoreWrite(
          async () => {
            await updateDoc(candRef, {
              anotacoes: [newNote, ...existingNotes]
            });
          },
          OperationType.UPDATE,
          `candidatos/${candidateId}`
        );
      }
    }
  }
}
