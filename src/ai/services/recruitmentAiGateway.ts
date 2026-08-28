import { TalentMatchResult } from '../../recruitment-core/services/talentMatchService';
import { AIService } from './centralAiService';

export interface AiProviderMetadata {
  provider: 'gemini';
  model: string;
  processedAt: string;
}

interface GatewayResponse<T> {
  success: boolean;
  data?: T;
  provider?: 'gemini';
  model?: string;
  processedAt?: string;
  error?: string;
}

async function executeRecruitmentAi<T>(action: string, companyId: string, data: unknown): Promise<GatewayResponse<T>> {
  return AIService.execute<T>(action, companyId, data);
}

export async function calcularMatchVaga(params: {
  companyId: string;
  job: Record<string, any>;
  matches: TalentMatchResult[];
}) {
  return executeRecruitmentAi<{ matches: Array<{
    candidateId: string;
    complementaryScore: number;
    strengths: string[];
    attentionPoints: string[];
    summary: string;
  }> }>('calcular_match_vaga', params.companyId, {
    job: params.job,
    candidates: params.matches.map(match => ({
      candidateId: match.candidateId,
      candidate: match.candidate,
      objectiveScore: match.objectiveScore,
      objectiveStrengths: match.strengths,
      objectiveAttentionPoints: match.attentionPoints,
    })),
  });
}

export const analisarCurriculo = (companyId: string, data: unknown) => executeRecruitmentAi('analisar_curriculo', companyId, data);
export const analisarCandidato = (companyId: string, data: unknown) => executeRecruitmentAi('analisar_candidato', companyId, data);
export const compararCandidatos = (companyId: string, data: unknown) => executeRecruitmentAi('comparar_candidatos', companyId, data);
export const gerarParecerEntrevista = (companyId: string, data: unknown) => executeRecruitmentAi('gerar_parecer_entrevista', companyId, data);
export const resumirCandidato = (companyId: string, data: unknown) => executeRecruitmentAi('resumir_candidato', companyId, data);
export const identificarPontosFortes = (companyId: string, data: unknown) => executeRecruitmentAi('identificar_pontos_fortes', companyId, data);
export const identificarPontosAtencao = (companyId: string, data: unknown) => executeRecruitmentAi('identificar_pontos_atencao', companyId, data);
