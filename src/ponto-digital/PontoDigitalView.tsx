import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, Clock3, CalendarDays, Scale, TimerReset, AlertTriangle,
  FileEdit, FileText, Send, PlugZap, RefreshCw, CheckCircle2, ShieldCheck,
  Users, Building2
} from 'lucide-react';
import { useAuth } from '../auth';
import {
  SubMenuPonto, RegistroPontoDoc, EscalaTrabalhoDoc, AjustePontoDoc, BancoHorasDoc,
  FuncionarioPontoInfo, ConfiguracoesPonto, IntegracaoPontoExterna
} from './types/ponto';
import {
  fetchRegistrosPonto, fetchEscalasPonto, salvarEscalaPonto, fetchAjustesPonto,
  salvarAjustePonto, fetchBancoHoras, fetchFuncionariosPonto, salvarFuncionarioPonto,
  fetchConfiguracoesPonto, salvarConfiguracoesPonto, fetchFechamentosPonto,
  fecharPeriodoPontoService, formatarMinutosEmHoras, fetchPontoApiStatus, syncPontoApiSummary, abrirPontoEletronicoSso
} from './services/pontoService';
import { EscalasPonto } from './components/EscalasPonto';
import { EspelhoPontoView } from './components/EspelhoPontoView';
import { AjustesPontoView } from './components/AjustesPontoView';
import { BancoHorasView } from './components/BancoHorasView';

// RH_PONTO_TERCEIRO_V1
// O RH TRANSFORMA não registra a batida neste fluxo. A marcação vem do fornecedor externo
// e o sistema atua como camada de gestão, conferência, fechamento e integração com a folha.

const DEFAULT_INTEGRACAO: IntegracaoPontoExterna = {
  provider: 'nao_configurado',
  syncMode: 'webhook',
  enabled: false,
  webhookEnabled: false,
  credentialConfigured: false,
  status: 'nao_configurado',
  employeeMappingField: 'cpf',
  punchesReadOnly: true,
};

function sum(registros: RegistroPontoDoc[], key: keyof RegistroPontoDoc) {
  return registros.reduce((acc, r) => acc + Number(r[key] || 0), 0);
}

export const PontoDigitalView: React.FC = () => {
  const { user } = useAuth();
  const empresaId = user?.companyId || user?.empresaId || user?.tenantId || '';
  const companyId = user?.companyId || user?.empresaId || user?.tenantId || '';
  const [activeSubMenu, setActiveSubMenu] = useState<SubMenuPonto>('visao-geral');
  const [loading, setLoading] = useState(true);
  const [savingIntegration, setSavingIntegration] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<any>(null); // RH_PONTO_API_V2
  const [registros, setRegistros] = useState<RegistroPontoDoc[]>([]);
  const [escalas, setEscalas] = useState<EscalaTrabalhoDoc[]>([]);
  const [ajustes, setAjustes] = useState<AjustePontoDoc[]>([]);
  const [bancoHoras, setBancoHoras] = useState<BancoHorasDoc[]>([]);
  const [funcionarios, setFuncionarios] = useState<FuncionarioPontoInfo[]>([]);
  const [config, setConfig] = useState<ConfiguracoesPonto | null>(null);
  const [fechamentos, setFechamentos] = useState<any[]>([]);

  const loadData = async () => {
    if (!empresaId) return;
    setLoading(true);
    try {
      const [regs, escs, ajs, bh, funcs, cfg, fech] = await Promise.all([
        fetchRegistrosPonto(empresaId), fetchEscalasPonto(empresaId), fetchAjustesPonto(empresaId),
        fetchBancoHoras(empresaId), fetchFuncionariosPonto(empresaId), fetchConfiguracoesPonto(empresaId),
        fetchFechamentosPonto(empresaId),
      ]);
      setRegistros(regs); setEscalas(escs); setAjustes(ajs); setBancoHoras(bh);
      setFuncionarios(funcs); setConfig(cfg); setFechamentos(fech);
      try { setApiStatus(await fetchPontoApiStatus(empresaId)); } catch (apiError) {
        setApiStatus({ connected: false, configured: false, message: apiError instanceof Error ? apiError.message : 'API de Ponto indisponível' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [empresaId]);

  const integracao = config?.integracaoExterna || DEFAULT_INTEGRACAO;
  const totalTrabalhado = sum(registros, 'horasTrabalhadasMinutos');
  const totalExtra = sum(registros, 'horasExtrasMinutos');
  const totalAtraso = sum(registros, 'atrasoMinutos');
  const totalFaltas = sum(registros, 'faltasMinutos');
  const totalExtra50 = sum(registros, 'horasExtras50Minutos');
  const totalExtra100 = sum(registros, 'horasExtras100Minutos');
  const totalExtra140 = sum(registros, 'horasExtras140Minutos');
  const pendencias = ajustes.filter(a => a.status === 'Pendente').length;

  const marcacoes = useMemo(() => registros.flatMap(r => {
    if (r.marcacoes?.length) return r.marcacoes.map(m => ({
      id: m.timeEntryId || m.externalPunchId || r.id, funcionario: r.funcionarioNome, data: r.data,
      horario: m.timestamp ? new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-',
      tipo: m.type, origem: m.provider || m.source || r.provider || 'fornecedor', status: m.status, externalId: m.externalPunchId || '-',
    }));
    return [{ id: r.id, funcionario: r.funcionarioNome, data: r.data, horario: r.horaEntrada || '-', tipo: 'registro', origem: r.provider || 'fornecedor', status: r.inconsistente ? 'inconsistente' : 'valido', externalId: r.externalRecordId || '-' }];
  }), [registros]);

  const handleSalvarEscala = async (escala: EscalaTrabalhoDoc) => { await salvarEscalaPonto(escala); await loadData(); };
  const handleSalvarAjuste = async (ajuste: AjustePontoDoc) => { await salvarAjustePonto(ajuste); await loadData(); };
  const handleSalvarFuncionario = async (func: FuncionarioPontoInfo) => { await salvarFuncionarioPonto(func); await loadData(); };

  const handleSalvarIntegracao = async (patch: Partial<IntegracaoPontoExterna>) => {
    if (!config) return;
    setSavingIntegration(true); setFeedback(null);
    try {
      const next: ConfiguracoesPonto = {
        ...config,
        companyId: config.companyId || companyId,
        empresaId,
        integracaoExterna: { ...integracao, ...patch, punchesReadOnly: true },
      };
      await salvarConfiguracoesPonto(next);
      setConfig(next);
      setFeedback('Configuração da integração salva. A credencial da API deve ser cadastrada somente no backend/Firebase após escolher o fornecedor.');
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Não foi possível salvar a integração.');
    } finally {
      setSavingIntegration(false);
    }
  };

  // RH_PRONTO_RH_SSO_V4
  const handleAbrirProntoRh = async () => {
    setFeedback(null);
    try {
      setFeedback('Abrindo Ponto Eletrônico…');
      const result = await abrirPontoEletronicoSso(empresaId);
      if (!result?.redirectUrl) throw new Error('O PRONTO-RH não retornou uma URL de acesso.');
      window.location.assign(result.redirectUrl);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Não foi possível acessar o Ponto Eletrônico.');
    }
  };

  const handleSincronizarApi = async () => {
    const competence = new Date().toISOString().slice(0, 7);
    setFeedback(null);
    try {
      const result = await syncPontoApiSummary(empresaId, competence);
      setApiStatus((prev: any) => ({ ...(prev || {}), connected: true, configured: true, lastSyncAt: new Date().toISOString() }));
      setFeedback('Sincronização concluída com o sistema de Ponto para ' + competence + '.');
      if (result?.summary) await loadData();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Não foi possível sincronizar o Ponto.');
    }
  };

  const handleFecharPeriodo = async () => {
    const now = new Date();
    const mesAno = now.toISOString().slice(0, 7);
    const id = `fechamento-${empresaId}-${mesAno}`;
    const fechamento = {
      id, companyId, empresaId, mesAno, dataInicial: `${mesAno}-01`, dataFinal: now.toISOString().slice(0, 10),
      totalFuncionarios: funcionarios.length, totalHorasTrabalhadasMinutos: totalTrabalhado,
      totalHorasExtrasMinutos: totalExtra, totalFaltasMinutos: totalFaltas, totalAtrasosMinutos: totalAtraso,
      pendenciasAbertas: pendencias, status: 'Fechado', fechadoPor: user?.name || user?.email || 'RH', dataFechamento: new Date().toISOString(),
      origemPonto: integracao.provider, prontoParaFolha: pendencias === 0,
    };
    await fecharPeriodoPontoService(fechamento);
    setFeedback(pendencias === 0 ? 'Período fechado e disponível para conferência da Folha.' : 'Período fechado com pendências. Regularize os ajustes antes do processamento da Folha.');
    await loadData();
  };

  const subMenuItems = [
    { id: 'visao-geral', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'marcacoes', label: 'Marcações', icon: Clock3 },
    { id: 'jornadas-escalas', label: 'Jornadas e Escalas', icon: CalendarDays },
    { id: 'banco-horas', label: 'Banco de Horas', icon: Scale },
    { id: 'horas-extras', label: 'Horas Extras', icon: TimerReset },
    { id: 'atrasos-faltas', label: 'Atrasos e Faltas', icon: AlertTriangle },
    { id: 'ajustes-justificativas', label: 'Ajustes e Justificativas', icon: FileEdit },
    { id: 'espelho', label: 'Espelho de Ponto', icon: FileText },
    { id: 'fechamento-folha', label: 'Fechamento para Folha', icon: Send },
    { id: 'integracao', label: 'Integração', icon: PlugZap },
  ] as const;

  return <div className="space-y-6">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-700"><ShieldCheck className="h-4 w-4" /> Gestão integrada</div>
          <h1 className="mt-1 text-2xl font-black text-slate-900">Ponto e Jornada</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">As marcações oficiais pertencem ao sistema de Ponto independente. O RH-MIL consome os dados por API e concentra conferência, banco de horas, ajustes, fechamento e integração com a folha.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs">
          <div className="font-black text-slate-700">Fonte oficial: <span className="text-emerald-700">Sistema de Ponto via API</span></div>
          <div className="mt-1 text-slate-500">API: {apiStatus?.connected ? 'Conectada' : (apiStatus?.configured === false ? 'Não configurada' : 'Verificando...')}</div>
          <div className="mt-1 text-slate-500">{apiStatus?.lastSyncAt ? `Última sincronização: ${new Date(apiStatus.lastSyncAt).toLocaleString('pt-BR')}` : (apiStatus?.message || 'Sem sincronização registrada')}</div>
          <button onClick={handleSincronizarApi} className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 font-black text-white hover:bg-emerald-700"><RefreshCw className="h-3.5 w-3.5" /> Sincronizar agora</button>
          <button onClick={handleAbrirProntoRh} className="mt-2 ml-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 font-black text-white hover:bg-blue-700">Acessar Ponto Eletrônico</button>
        </div>
      </div>
    </div>

    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <div className="flex min-w-max items-center gap-1">
        {subMenuItems.map(item => { const Icon = item.icon; const active = activeSubMenu === item.id; return <button key={item.id} type="button" onClick={() => setActiveSubMenu(item.id as SubMenuPonto)} className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition ${active ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}><Icon className="h-3.5 w-3.5" />{item.label}</button>; })}
      </div>
    </div>

    {loading && <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">Sincronizando dados de Ponto e Jornada...</div>}
    {feedback && <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700">{feedback}</div>}

    {activeSubMenu === 'visao-geral' && <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[['Colaboradores', funcionarios.length, Users], ['Horas trabalhadas', formatarMinutosEmHoras(totalTrabalhado), Clock3], ['Horas extras', formatarMinutosEmHoras(totalExtra), TimerReset], ['Pendências', pendencias, AlertTriangle]].map(([label, value, Icon]: any) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><span className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</span><Icon className="h-4 w-4 text-emerald-600" /></div><div className="mt-2 text-2xl font-black text-slate-900">{value}</div></div>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-black text-slate-900">Fluxo operacional</h3><p className="mt-2 text-sm text-slate-600">Fornecedor de ponto → RH TRANSFORMA → conferência/ajustes → fechamento → Folha de Pagamento.</p><p className="mt-3 text-xs text-slate-500">O RH TRANSFORMA não altera a marcação original recebida. Ajustes ficam registrados separadamente para auditoria.</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-black text-slate-900">Integração atual</h3><div className="mt-3 space-y-2 text-sm text-slate-600"><div className="flex justify-between"><span>Fornecedor</span><b>{integracao.providerName || integracao.provider}</b></div><div className="flex justify-between"><span>Modo</span><b>{integracao.syncMode}</b></div><div className="flex justify-between"><span>Mapeamento</span><b>{integracao.employeeMappingField}</b></div><div className="flex justify-between"><span>Credencial</span><b>{integracao.credentialConfigured ? 'Configurada no backend' : 'Pendente'}</b></div></div></div>
      </div>
    </div>}

    {activeSubMenu === 'marcacoes' && <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-4"><h2 className="text-lg font-black text-slate-900">Marcações recebidas</h2><p className="text-xs text-slate-500">Consulta das batidas importadas do fornecedor. A marcação original é somente leitura.</p></div><div className="overflow-x-auto"><table className="min-w-full text-left text-xs"><thead className="border-b border-slate-200 text-slate-400"><tr><th className="p-3">Colaborador</th><th className="p-3">Data</th><th className="p-3">Hora</th><th className="p-3">Tipo</th><th className="p-3">Origem</th><th className="p-3">ID externo</th><th className="p-3">Status</th></tr></thead><tbody>{marcacoes.map((m:any) => <tr key={m.id + m.horario} className="border-b border-slate-100"><td className="p-3 font-bold text-slate-800">{m.funcionario}</td><td className="p-3">{m.data}</td><td className="p-3 font-mono">{m.horario}</td><td className="p-3">{m.tipo}</td><td className="p-3">{m.origem}</td><td className="p-3 font-mono text-slate-500">{m.externalId}</td><td className="p-3">{m.status}</td></tr>)}{marcacoes.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-400">Nenhuma marcação sincronizada.</td></tr>}</tbody></table></div></div>}

    {activeSubMenu === 'jornadas-escalas' && <EscalasPonto escalas={escalas} onSalvarEscala={handleSalvarEscala} />}
    {activeSubMenu === 'banco-horas' && <BancoHorasView bancoHoras={bancoHoras} />}

    {activeSubMenu === 'horas-extras' && <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-3">{[['HE 50%', totalExtra50], ['HE 100%', totalExtra100], ['HE 140%', totalExtra140]].map(([label, value]: any) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="text-xs font-black text-slate-400">{label}</div><div className="mt-2 text-2xl font-black text-slate-900">{formatarMinutosEmHoras(value)}</div></div>)}</div><div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">As horas extras exibidas são apuradas a partir das marcações recebidas e das regras de jornada. A destinação para banco ou pagamento deve ser definida no fechamento.</div></div>}

    {activeSubMenu === 'atrasos-faltas' && <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="text-xs font-black text-slate-400">ATRASOS</div><div className="mt-2 text-2xl font-black text-amber-700">{formatarMinutosEmHoras(totalAtraso)}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="text-xs font-black text-slate-400">FALTAS</div><div className="mt-2 text-2xl font-black text-rose-700">{formatarMinutosEmHoras(totalFaltas)}</div></div></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-black text-slate-900">Ocorrências</h3><div className="mt-3 space-y-2">{registros.filter(r => Number(r.atrasoMinutos || 0) > 0 || Number(r.faltasMinutos || 0) > 0).map(r => <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-xs"><b>{r.funcionarioNome}</b><span>{r.data}</span><span>Atraso {formatarMinutosEmHoras(Number(r.atrasoMinutos || 0))}</span><span>Falta {formatarMinutosEmHoras(Number(r.faltasMinutos || 0))}</span></div>)} </div></div></div>}

    {activeSubMenu === 'ajustes-justificativas' && <AjustesPontoView ajustes={ajustes} funcionarios={funcionarios} onSalvarAjuste={handleSalvarAjuste} isManagerOrMaster={user?.role === 'Super Administrador' || user?.role === 'Administrador' || user?.tipoUsuario === 'MASTER' || user?.tipoUsuario === 'EMPRESA'} />}
    {activeSubMenu === 'espelho' && <EspelhoPontoView registros={registros} funcionarios={funcionarios} />}

    {activeSubMenu === 'fechamento-folha' && <div className="space-y-5"><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h2 className="text-lg font-black text-slate-900">Fechamento para Folha</h2><p className="mt-1 text-xs text-slate-500">Consolida dados reais do período. Nenhum holerite é alterado automaticamente nesta etapa.</p></div><button type="button" onClick={handleFecharPeriodo} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-700">Fechar período atual</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl bg-slate-50 p-3"><span className="text-[10px] font-black text-slate-400">TRABALHADAS</span><div className="font-black">{formatarMinutosEmHoras(totalTrabalhado)}</div></div><div className="rounded-xl bg-slate-50 p-3"><span className="text-[10px] font-black text-slate-400">EXTRAS</span><div className="font-black">{formatarMinutosEmHoras(totalExtra)}</div></div><div className="rounded-xl bg-slate-50 p-3"><span className="text-[10px] font-black text-slate-400">ATRASOS/FALTAS</span><div className="font-black">{formatarMinutosEmHoras(totalAtraso + totalFaltas)}</div></div><div className="rounded-xl bg-slate-50 p-3"><span className="text-[10px] font-black text-slate-400">PENDÊNCIAS</span><div className="font-black">{pendencias}</div></div></div></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-black text-slate-900">Histórico de fechamentos</h3><div className="mt-3 space-y-2">{fechamentos.map((f:any) => <div key={f.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-xs"><b>{f.mesAno}</b><span>{f.status}</span><span>{f.pendenciasAbertas || 0} pendências</span><span>{f.prontoParaFolha ? 'Pronto para Folha' : 'Revisão necessária'}</span></div>)}{fechamentos.length === 0 && <div className="text-xs text-slate-400">Nenhum fechamento realizado.</div>}</div></div></div>}

    {activeSubMenu === 'integracao' && <div className="space-y-5"><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start gap-3"><div className="rounded-xl bg-emerald-50 p-2 text-emerald-700"><PlugZap className="h-5 w-5" /></div><div><h2 className="text-lg font-black text-slate-900">Integração com fornecedor de ponto</h2><p className="mt-1 text-xs text-slate-500">Configuração agnóstica a fornecedor. Tokens e chaves de API não são armazenados no navegador nem no Firestore.</p></div></div><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-xs font-bold text-slate-600">Fornecedor<select value={integracao.provider} onChange={e => handleSalvarIntegracao({ provider: e.target.value as any, providerName: e.target.options[e.target.selectedIndex].text, status: 'configurando' })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"><option value="nao_configurado">Selecione</option><option value="solides">Sólides</option><option value="tangerino">Tangerino</option><option value="ahgora">Ahgora</option><option value="pontotel">Pontotel</option><option value="outro">Outro fornecedor</option></select></label><label className="text-xs font-bold text-slate-600">URL base da API<input value={integracao.apiBaseUrl || ''} onChange={e => setConfig(config ? { ...config, integracaoExterna: { ...integracao, apiBaseUrl: e.target.value } } : config)} placeholder="https://api.fornecedor.com" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label><label className="text-xs font-bold text-slate-600">ID da empresa no fornecedor<input value={integracao.externalCompanyId || ''} onChange={e => setConfig(config ? { ...config, integracaoExterna: { ...integracao, externalCompanyId: e.target.value } } : config)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" /></label><label className="text-xs font-bold text-slate-600">Sincronização<select value={integracao.syncMode} onChange={e => setConfig(config ? { ...config, integracaoExterna: { ...integracao, syncMode: e.target.value as any } } : config)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"><option value="webhook">Webhook</option><option value="polling">Consulta periódica</option><option value="manual">Manual</option></select></label><label className="text-xs font-bold text-slate-600">Vínculo do colaborador<select value={integracao.employeeMappingField} onChange={e => setConfig(config ? { ...config, integracaoExterna: { ...integracao, employeeMappingField: e.target.value as any } } : config)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"><option value="cpf">CPF</option><option value="matricula">Matrícula</option><option value="externalEmployeeId">ID externo</option></select></label><div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"><div className="font-black text-slate-700">Credencial da API</div><div className="mt-1 text-slate-500">{integracao.credentialConfigured ? 'Configurada no backend.' : 'Pendente. Será cadastrada como segredo server-side após escolher o fornecedor.'}</div></div></div><button disabled={!config || savingIntegration} onClick={() => handleSalvarIntegracao({ enabled: integracao.provider !== 'nao_configurado', webhookEnabled: integracao.syncMode === 'webhook' })} className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">{savingIntegration ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Salvar configuração</button></div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900"><b>Próxima etapa técnica:</b> depois de escolher o fornecedor, implementamos o adaptador específico da API/webhook no backend. A estrutura de dados do RH TRANSFORMA já fica preparada para <code>externalEmployeeId</code> e <code>externalPunchId</code>.</div></div>}
  </div>;
};
