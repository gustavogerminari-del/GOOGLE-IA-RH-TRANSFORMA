import { isSupabaseConfigured, supabase, supabaseFunctionsUrl } from '../lib/supabase';
import { Interview, InterviewScheduleInput } from '../types/rh';

export interface GoogleWorkspaceIntegrationStatus {
  companyId?: string;
  empresaId?: string;
  connectedEmail?: string;
  calendarId?: string;
  status: 'connected' | 'disconnected' | 'reauthorization_required' | string;
  connectedAt?: string | null;
  lastSyncAt?: string | null;
  lastTestAt?: string | null;
  grantedScopes?: string[];
  calendarAvailable?: boolean;
  meetAvailable?: boolean;
}

const sessionError = () => {
  const error: any = new Error('Sua sessão no RH TRANSFORMA expirou. Entre novamente para continuar.');
  error.code = 'RH_SESSION_REQUIRED';
  return error;
};

const authenticatedRequest = async (url: string, init: RequestInit = {}) => {
  if (!isSupabaseConfigured || !supabase) throw sessionError();
  const { data, error: authError } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (authError || !token) throw sessionError();

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const raw = await response.text();
  let payload: any = {};
  try { payload = raw ? JSON.parse(raw) : {}; } catch { payload = { error: raw }; }
  if (!response.ok || payload.success === false) {
    const error: any = new Error(payload.error || payload.message || `Requisição recusada (${response.status}).`);
    error.status = response.status;
    error.code = payload.code;
    error.details = payload.details;
    throw error;
  }
  return payload;
};

const workspaceUrl = () => `${supabaseFunctionsUrl}/google-workspace`;

export class GoogleWorkspaceService {
  static async getStatus(companyId: string) {
    if (!isSupabaseConfigured || !supabaseFunctionsUrl) {
      return {
        success: true as const,
        integration: { companyId, empresaId: companyId, status: 'disconnected' } as GoogleWorkspaceIntegrationStatus,
        configuration: { oauthConfigured: false, secureStoreConfigured: false },
      };
    }
    return authenticatedRequest(`${workspaceUrl()}?companyId=${encodeURIComponent(companyId)}`) as Promise<{
      success: true;
      integration: GoogleWorkspaceIntegrationStatus;
      configuration: { oauthConfigured: boolean; secureStoreConfigured: boolean };
    }>;
  }

  static async connect(companyId: string, reconnect = false) {
    const result = await authenticatedRequest(workspaceUrl(), {
      method: 'POST',
      body: JSON.stringify({
        companyId,
        empresaId: companyId,
        action: reconnect ? 'reconnect' : 'connect',
        returnUrl: `${window.location.origin}${window.location.pathname}`,
      }),
    });
    if (!result.authorizationUrl) throw new Error('Google não retornou a página de autorização.');
    window.location.assign(result.authorizationUrl);
  }

  static async test(companyId: string) {
    return authenticatedRequest(workspaceUrl(), {
      method: 'POST',
      body: JSON.stringify({ companyId, empresaId: companyId, action: 'test' }),
    });
  }

  static async disconnect(companyId: string) {
    return authenticatedRequest(workspaceUrl(), {
      method: 'DELETE',
      body: JSON.stringify({ companyId, empresaId: companyId, action: 'disconnect' }),
    });
  }

  // Os fluxos abaixo continuam apontando para as APIs funcionais específicas de entrevistas,
  // mas agora usam a sessão Supabase do RH TRANSFORMA em vez de token Firebase.
  static async createInterview(companyId: string, input: InterviewScheduleInput): Promise<{ interview: Interview; warnings: string[]; message: string }> {
    return authenticatedRequest('/api/google/interviews', {
      method: 'POST',
      body: JSON.stringify({ ...input, companyId, empresaId: companyId }),
    });
  }

  static async updateInterview(companyId: string, input: InterviewScheduleInput): Promise<{ interview: Interview; message: string }> {
    return authenticatedRequest('/api/google/interviews', {
      method: 'PATCH',
      body: JSON.stringify({ ...input, companyId, empresaId: companyId }),
    });
  }

  static async cancelInterview(companyId: string, interviewId: string): Promise<{ interview: Interview; message: string }> {
    return authenticatedRequest(`/api/google/interviews?companyId=${encodeURIComponent(companyId)}&interviewId=${encodeURIComponent(interviewId)}`, {
      method: 'DELETE',
    });
  }

  static async getArtifacts(companyId: string, interviewId: string) {
    return authenticatedRequest(`/api/google/interviews/artifacts?companyId=${encodeURIComponent(companyId)}&interviewId=${encodeURIComponent(interviewId)}`);
  }

  static async syncArtifacts(companyId: string, interviewId: string) {
    return authenticatedRequest('/api/google/interviews/artifacts', {
      method: 'POST',
      body: JSON.stringify({ companyId, interviewId }),
    });
  }

  static async getDiagnostic(companyId: string, interviewId: string) {
    return authenticatedRequest(`/api/google/interviews/diagnosis?companyId=${encodeURIComponent(companyId)}&interviewId=${encodeURIComponent(interviewId)}`);
  }

  static async generateDiagnostic(companyId: string, interviewId: string, force = false) {
    return authenticatedRequest('/api/google/interviews/diagnosis', {
      method: 'POST',
      body: JSON.stringify({ companyId, interviewId, force }),
    });
  }

  static async reviewDiagnostic(companyId: string, interviewId: string, review: {
    agreement: 'Concordo com a IA' | 'Concordo parcialmente' | 'Discordo';
    comment: string;
    validationPoints?: any[];
  }) {
    return authenticatedRequest('/api/google/interviews/diagnosis', {
      method: 'PATCH',
      body: JSON.stringify({ companyId, interviewId, ...review }),
    });
  }
}
