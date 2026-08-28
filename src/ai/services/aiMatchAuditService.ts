import { doc, setDoc } from '../../firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { sanitizeFirestoreData } from '../../lib/firestoreUtils';
import { TalentMatchResult } from '../../recruitment-core/services/talentMatchService';

export class AiMatchAuditService {
  static async logMatches(params: {
    companyId: string;
    jobId: string;
    provider: string;
    model: string;
    processedAt: string;
    matches: TalentMatchResult[];
  }) {
    if (!params.companyId || !params.jobId) throw new Error('Empresa e vaga são obrigatórias para auditoria da IA.');
    await Promise.all(params.matches.map(match => {
      const id = `match_${params.jobId}_${match.candidateId}_${Date.now()}`;
      return setDoc(doc(db, 'ai_match_auditoria', id), sanitizeFirestoreData({
        id,
        companyId: params.companyId,
        empresaId: params.companyId,
        vagaId: params.jobId,
        jobId: params.jobId,
        candidatoId: match.candidateId,
        candidateId: match.candidateId,
        provider: params.provider,
        model: params.model,
        score: match.score,
        objectiveScore: match.objectiveScore,
        strengths: match.strengths,
        attentionPoints: match.attentionPoints,
        result: 'match_calculado',
        createdBy: auth.currentUser?.uid || '',
        createdAt: params.processedAt,
      }));
    }));
  }
}

