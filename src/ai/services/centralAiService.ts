import { auth } from '../../lib/firebase';

export type AiOperation =
  | 'analisar_curriculo'
  | 'calcular_match_vaga'
  | 'analisar_candidato'
  | 'comparar_candidatos'
  | 'gerar_parecer_entrevista'
  | 'resumir_candidato'
  | 'identificar_pontos_fortes'
  | 'identificar_pontos_atencao'
  | string;

export interface CentralAiResponse<T = unknown> {
  success: true;
  data: T;
  provider: 'gemini';
  model: string;
  processedAt: string;
  fallbackUsed: boolean;
}

const REQUEST_TIMEOUT_MS = 48_000;

const parseResponse = async (response: Response) => {
  const text = await response.text();
  let payload: any = {};
  if (text.trim()) {
    try {
      payload = JSON.parse(text);
    } catch {
      if (!response.ok) throw new Error(`Serviço de IA indisponível (${response.status}).`);
      throw new Error('O serviço de IA retornou uma resposta inválida.');
    }
  }
  if (!response.ok || payload?.success !== true) {
    throw new Error(payload?.error || 'Não foi possível concluir a análise por IA no momento. Tente novamente.');
  }
  return payload;
};

async function execute<T>(operation: AiOperation, companyId: string, data: unknown): Promise<CentralAiResponse<T>> {
  if (!companyId) throw new Error('Empresa não identificada para utilizar a IA.');
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Sessão expirada. Entre novamente para utilizar a IA.');
  const idToken = await currentUser.getIdToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch('/api/ai/recruitment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ action: operation, companyId, data }),
      signal: controller.signal,
    });
    return await parseResponse(response) as CentralAiResponse<T>;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new Error('A análise demorou mais que o esperado. Tente novamente.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const AIService = {
  execute,
  analisarCurriculo: <T = unknown>(companyId: string, data: unknown) => execute<T>('analisar_curriculo', companyId, data),
  calcularMatchVaga: <T = unknown>(companyId: string, data: unknown) => execute<T>('calcular_match_vaga', companyId, data),
  analisarCandidato: <T = unknown>(companyId: string, data: unknown) => execute<T>('analisar_candidato', companyId, data),
  compararCandidatos: <T = unknown>(companyId: string, data: unknown) => execute<T>('comparar_candidatos', companyId, data),
  gerarParecerEntrevista: <T = unknown>(companyId: string, data: unknown) => execute<T>('gerar_parecer_entrevista', companyId, data),
  resumirCandidato: <T = unknown>(companyId: string, data: unknown) => execute<T>('resumir_candidato', companyId, data),
  identificarPontosFortes: <T = unknown>(companyId: string, data: unknown) => execute<T>('identificar_pontos_fortes', companyId, data),
  identificarPontosAtencao: <T = unknown>(companyId: string, data: unknown) => execute<T>('identificar_pontos_atencao', companyId, data),
};
