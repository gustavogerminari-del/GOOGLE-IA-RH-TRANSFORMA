import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Link2, RefreshCw, ShieldCheck, Unplug, Video, XCircle } from 'lucide-react';
import { useAuth } from '../auth';
import { getCompanyId, isMasterProfile } from '../auth/profile';
import { GoogleWorkspaceIntegrationStatus, GoogleWorkspaceService } from '../services/GoogleWorkspaceService';

export const GoogleWorkspaceIntegrationCard: React.FC = () => {
  const { user, hasActionAccess } = useAuth();
  const companyId = getCompanyId(user) || '';
  const [integration, setIntegration] = useState<GoogleWorkspaceIntegrationStatus>({ status: 'disconnected' });
  const [configuration, setConfiguration] = useState({ oauthConfigured: false, secureStoreConfigured: false });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const canManage = Boolean(user && (isMasterProfile(user) || hasActionAccess('edit_settings') || user.role === 'Administrador'));

  const loadStatus = async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    try {
      const result = await GoogleWorkspaceService.getStatus(companyId);
      setIntegration(result.integration);
      setConfiguration(result.configuration);
    } catch (error: any) {
      setFeedback({ type: 'error', message: error?.message || 'Não foi possível consultar a integração Google.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadStatus(); }, [companyId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('googleIntegration');
    if (status === 'connected') {
      setFeedback({ type: 'success', message: 'Conta Google Workspace conectada com sucesso.' });
      void loadStatus();
    } else if (status === 'error') {
      setFeedback({ type: 'error', message: params.get('googleMessage') || 'Não foi possível conectar a conta Google.' });
    }
  }, []);

  const connected = integration.status === 'connected';
  const backendReady = configuration.oauthConfigured && configuration.secureStoreConfigured;
  const statusLabel = useMemo(() => {
    if (loading) return 'Verificando...';
    if (!backendReady) return 'Configuração técnica pendente';
    if (integration.status === 'reauthorization_required') return 'Reconexão necessária';
    return connected ? 'Conectado' : 'Desconectado';
  }, [loading, backendReady, connected, integration.status]);

  const execute = async (action: 'connect' | 'reconnect' | 'test' | 'disconnect') => {
    if (!companyId || actionLoading) return;
    setActionLoading(action);
    setFeedback(null);
    try {
      if (action === 'connect' || action === 'reconnect') {
        await GoogleWorkspaceService.connect(companyId, action === 'reconnect');
        return;
      }
      if (action === 'test') {
        const result = await GoogleWorkspaceService.test(companyId);
        setIntegration(result.integration);
        setFeedback({ type: 'success', message: result.message });
      } else {
        const result = await GoogleWorkspaceService.disconnect(companyId);
        setIntegration({ status: 'disconnected' });
        setFeedback({ type: 'success', message: result.message });
      }
    } catch (error: any) {
      setFeedback({ type: 'error', message: error?.message || 'Falha na integração Google.' });
    } finally {
      setActionLoading('');
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5" aria-labelledby="google-workspace-title">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Integrações</p>
            <h3 id="google-workspace-title" className="text-sm font-extrabold text-slate-900">Google Workspace</h3>
            <p className="text-xs text-slate-500">Google Calendar, Google Meet, gravações e transcrições da própria empresa.</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black ${
          connected ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          {connected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          {statusLabel}
        </span>
      </div>

      {feedback && (
        <div role="status" className={`rounded-xl border p-3 text-xs font-semibold ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-blue-600" />
          <div><span className="block text-[10px] uppercase text-slate-400 font-bold">Google Calendar</span><strong>{connected ? 'Disponível' : 'Aguardando conexão'}</strong></div>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center gap-2">
          <Video className="w-4 h-4 text-emerald-600" />
          <div><span className="block text-[10px] uppercase text-slate-400 font-bold">Google Meet</span><strong>{connected ? 'Disponível conforme permissões' : 'Aguardando conexão'}</strong></div>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
          <span className="block text-[10px] uppercase text-slate-400 font-bold">Conta conectada</span>
          <strong className="break-all">{integration.connectedEmail || 'Nenhuma conta conectada'}</strong>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
          <span className="block text-[10px] uppercase text-slate-400 font-bold">Última sincronização</span>
          <strong>{integration.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString('pt-BR') : 'Ainda não realizada'}</strong>
        </div>
      </div>

      {!backendReady && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
          <span>A interface está pronta, mas as credenciais OAuth e o cofre seguro de tokens precisam ser configurados no backend antes da primeira conexão.</span>
        </div>
      )}

      <div role="note" className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
        <span><strong>Google não é login do RH TRANSFORMA.</strong> Esta autorização serve somente para Calendar e Meet e não cria usuário, empresa, assinatura, plano ou permissão.</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {!connected ? (
          <button type="button" disabled={!canManage || !backendReady || Boolean(actionLoading)} onClick={() => execute('connect')} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5" /> Conectar Google
          </button>
        ) : (
          <>
            <button type="button" disabled={!canManage || Boolean(actionLoading)} onClick={() => execute('test')} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Testar integração
            </button>
            <button type="button" disabled={!canManage || Boolean(actionLoading)} onClick={() => execute('reconnect')} className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold disabled:opacity-50 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Reconectar
            </button>
            <button type="button" disabled={!canManage || Boolean(actionLoading)} onClick={() => execute('disconnect')} className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 text-xs font-bold disabled:opacity-50 flex items-center gap-1.5">
              <Unplug className="w-3.5 h-3.5" /> Desconectar
            </button>
          </>
        )}
      </div>
    </section>
  );
};
