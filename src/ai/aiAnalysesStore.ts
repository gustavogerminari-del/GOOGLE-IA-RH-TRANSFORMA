import { collection, doc, getDocs, query, setDoc, where } from '../firebase/firestore';
import { db } from '../lib/firebase';
import { sanitizeFirestoreData } from '../lib/firestoreUtils';
import { IaAnalise } from './types';

const COLLECTION = 'ia_analises';

export async function getIaAnalises(empresaId: string): Promise<IaAnalise[]> {
  if (!empresaId) throw new Error('empresaId obrigatório para carregar análises de IA.');
  const snap = await getDocs(query(collection(db, COLLECTION), where('empresaId', '==', empresaId)));
  return snap.docs.map(d => ({ ...(d.data() as IaAnalise), id: d.id }));
}

export async function saveIaAnalise(analiseData: Omit<IaAnalise, 'id' | 'dataCriacao'>): Promise<IaAnalise> {
  if (!analiseData.empresaId) throw new Error('empresaId obrigatório para salvar análise de IA.');
  if (!analiseData.vagaId || !analiseData.candidatoId) throw new Error('vagaId e candidatoId são obrigatórios.');
  const existing = await getDocs(query(
    collection(db, COLLECTION),
    where('empresaId', '==', analiseData.empresaId),
    where('vagaId', '==', analiseData.vagaId),
    where('candidatoId', '==', analiseData.candidatoId)
  ));
  const id = existing.empty ? `ana-${Date.now()}` : existing.docs[0].id;
  const value: IaAnalise = { ...analiseData, id, dataCriacao: new Date().toISOString() };
  await setDoc(doc(db, COLLECTION, id), sanitizeFirestoreData(value), { merge: true });
  return value;
}

export async function getAnaliseByCandidatoEVaga(empresaId: string, candidatoId: string, vagaId?: string): Promise<IaAnalise | undefined> {
  const list = await getIaAnalises(empresaId);
  return vagaId ? list.find(i => i.candidatoId === candidatoId && i.vagaId === vagaId) : list.find(i => i.candidatoId === candidatoId);
}

export async function getAnalisesByVaga(empresaId: string, vagaId: string): Promise<IaAnalise[]> {
  const list = await getIaAnalises(empresaId);
  return list.filter(i => i.vagaId === vagaId);
}
