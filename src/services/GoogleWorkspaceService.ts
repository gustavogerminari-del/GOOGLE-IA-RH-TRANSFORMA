import { auth } from '../lib/firebase';
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

const authenticatedRequest = async (url: string, init: RequestInit = {}) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Sessão Firebase obrigatória.');
  const token = await currentUser.getIdToken();
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

export class GoogleWorkspaceService {
  static async getStatus(companyId: string) {
    return authenticatedRequest(`/api/google/workspace?companyId=${encodeURIComponent(companyId)}`) as Promise<{
      success: true;
      integration: GoogleWorkspaceIntegrationStatus;
      configuration: { oauthConfigured: boolean; secureStoreConfigured: boolean };
    }>;
  }

  static async connect(companyId: string, reconnect = false) {
    const result = await authenticatedRequest('/api/google/workspace', {
      method: 'POST',
      body: JSON.stringify({ companyId, action: reconnect ? 'reconnect' : 'connect' }),
    });
    if (!result.authorizationUrl) throw new Error('Google não retornou a página de autorização.');
    window.location.assign(result.authorizationUrl);
  }

  static async test(companyId: string) {
    return authenticatedRequest('/api/google/workspace', {
      method: 'POST',
      body: JSON.stringify({ companyId, action: 'test' }),
    });
  }

  static async disconnect(companyId: string) {
    return authenticatedRequest('/api/google/workspace', {
      method: 'DELETE',
      body: JSON.stringify({ companyId }),
    });
  }

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

