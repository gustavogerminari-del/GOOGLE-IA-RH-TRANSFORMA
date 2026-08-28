import { auth } from '../lib/firebase';

export type N8nEventType =
  | 'company_registered'
  | 'job_created'
  | 'job_updated'
  | 'job_closed'
  | 'application_created'
  | 'application_stage_changed'
  | 'interview_scheduled'
  | 'interview_updated'
  | 'interview_cancelled'
  | 'candidate_hired'
  | 'headhunter_hired'
  | 'admission_created'
  | 'admission_completed'
  | 'employee_created'
  | 'subscription_created'
  | 'subscription_updated'
  | 'payment_confirmed';

export interface N8nEventEnvelope {
  eventId: string;
  eventType: N8nEventType;
  companyId: string;
  timestamp: string;
  source: 'RH_TRANSFORMA';
  data: Record<string, unknown>;
}

const createEventId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `evt-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

export class N8nService {
  static async send(
    eventType: N8nEventType,
    companyId: string,
    data: Record<string, unknown>,
    idempotencyKey?: string,
  ): Promise<{ sent: boolean; eventId: string; duplicate?: boolean }> {
    const tenantId = String(companyId || '').trim();
    if (!tenantId) throw new Error('companyId é obrigatório para enviar eventos ao n8n.');
    const user = auth.currentUser;
    if (!user) throw new Error('Sessão autenticada obrigatória para enviar eventos ao n8n.');

    const event: N8nEventEnvelope = {
      eventId: idempotencyKey || createEventId(),
      eventType,
      companyId: tenantId,
      timestamp: new Date().toISOString(),
      source: 'RH_TRANSFORMA',
      data,
    };
    const response = await fetch('/api/n8n/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success !== true) {
      throw new Error(payload?.error || payload?.message || `Falha ao enviar evento ${eventType} ao n8n.`);
    }
    return { sent: payload.sent !== false, eventId: event.eventId, duplicate: payload.duplicate === true };
  }

  static async sendSafely(
    eventType: N8nEventType,
    companyId: string,
    data: Record<string, unknown>,
    idempotencyKey?: string,
  ): Promise<void> {
    try {
      const result = await this.send(eventType, companyId, data, idempotencyKey);
      console.info('[N8N EVENT SENT]', { eventId: result.eventId, eventType, companyId, entityId: data.entityId || data.jobId || data.applicationId || data.interviewId || null });
    } catch (error) {
      console.error('[N8N EVENT ERROR]', {
        eventType,
        companyId,
        entityId: data.entityId || data.jobId || data.applicationId || data.interviewId || null,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  static async notifyPublicApplication(data: {
    companyId: string;
    applicationId: string;
    candidateId: string;
    jobId: string;
  }): Promise<void> {
    const response = await fetch('/api/n8n/events/public-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success !== true) {
      throw new Error(payload?.error || payload?.message || 'Automação n8n da candidatura pública indisponível.');
    }
  }
}
