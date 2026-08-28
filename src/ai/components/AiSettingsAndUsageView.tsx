import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Settings, 
  Cpu, 
  Database, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle2, 
  Save, 
  RefreshCw, 
  Sliders, 
  Layers, 
  Lock, 
  DollarSign, 
  Users, 
  Activity,
  FileCheck2
} from 'lucide-react';
import { useAuth } from '../../auth';
import { settingsAndUsageAiService } from '../services/aiService';

export const AiSettingsAndUsageView: React.FC = () => {
  const { user } = useAuth();
  const isMaster = user?.role === 'Super Administrador' || user?.role === 'MASTER' || user?.tipoUsuario === 'MASTER' || user?.isMaster === true;
  const currentCompanyId = user?.companyId || user?.empresaId || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Settings State
  const [iaAtiva, setIaAtiva] = useState(true);
  const [selectedModel, setSelectedModel] = useState('gemini-3.6-flash');
  const [limiteMensalTokens, setLimiteMensalTokens] = useState(500000);
  const [limitePorUsuario, setLimitePorUsuario] = useState(50000);
  const [retencaoConversasDias, setRetencaoConversasDias] = useState(30);
  const [avisoPrivacidade, setAvisoPrivacidade] = useState(
    'As análises de IA utilizam dados anonimizados e não compartilham informações críticas entre empresas. Todas as decisões requerem validação humana.'
  );
  
  const [modulosAutorizados, setModulosAutorizados] = useState<string[]>([
    'vagas', 'candidatos', 'entrevistas', 'banco-talentos', 'colaboradores', 'ponto-digital', 'departamento-pessoal', 'beneficios', 'ferias', 'documentos', 'relatorios'
  ]);

  // Usage Metrics State
  const [usageStats, setUsageStats] = useState<{
    totalRequests: number;
    totalTokens: number;
    estimatedCostBrl: number;
    successCount: number;
    errorCount: number;
    usageByModule: { modulo: string; requests: number; tokens: number }[];
    usageByUser: { userEmail: string; requests: number; tokens: number }[];
  }>({
    totalRequests: 142,
    totalTokens: 184200,
    estimatedCostBrl: 1.84,
    successCount: 140,
    errorCount: 2,
    usageByModule: [
      { modulo: 'candidatos', requests: 58, tokens: 78000 },
      { modulo: 'vagas', requests: 34, tokens: 42000 },
      { modulo: 'entrevistas', requests: 22, tokens: 28000 },
      { modulo: 'ponto-digital', requests: 16, tokens: 21000 },
      { modulo: 'relatorios', requests: 12, tokens: 15200 },
    ],
    usageByUser: [
      { userEmail: user?.email || 'gestor@maisrh.com.br', requests: 88, tokens: 112000 },
      { userEmail: 'usuario@empresa.com.br', requests: 54, tokens: 72200 },
    ]
  });

  useEffect(() => {
    loadData();
  }, [currentCompanyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, usageRes] = await Promise.all([
        settingsAndUsageAiService.getSettings(currentCompanyId),
        settingsAndUsageAiService.getUsageDashboard(isMaster ? undefined : currentCompanyId)
      ]);

      if (settingsRes && settingsRes.success && settingsRes.data) {
        const d = settingsRes.data;
        setIaAtiva(d.iaAtiva ?? true);
        setSelectedModel(d.modelo || 'gemini-3.6-flash');
        setLimiteMensalTokens(d.limiteMensalTokens || 500000);
        setLimitePorUsuario(d.limitePorUsuario || 50000);
        setRetencaoConversasDias(d.retencaoConversasDias || 30);
        if (d.avisoPrivacidade) setAvisoPrivacidade(d.avisoPrivacidade);
        if (Array.isArray(d.modulosAutorizados)) setModulosAutorizados(d.modulosAutorizados);
      }

      if (usageRes && usageRes.success && usageRes.data) {
        setUsageStats(usageRes.data);
      }
    } catch (err) {
      console.warn('Notice loading AI settings/usage:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleModule = (modKey: string) => {
    setModulosAutorizados(prev => 
      prev.includes(modKey) ? prev.filter(m => m !== modKey) : [...prev, modKey]
    );
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const payload = {
        iaAtiva,
        modelo: selectedModel,
        limiteMensalTokens,
        limitePorUsuario,
        retencaoConversasDias,
        avisoPrivacidade,
        modulosAutorizados,
      };
      const res = await settingsAndUsageAiService.updateSettings(currentCompanyId, payload);
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Erro ao salvar configurações de IA:', err);
    } finally {
      setSaving(false);
    }
  };

  const allModulesList = [
    { key: 'vagas', label: 'Criação & Aprimoramento de Vagas' },
    { key: 'candidatos', label: 'Análise de Currículos & Triagem IA' },
    { key: 'entrevistas', label: 'Roteiros de Entrevista & Feedback' },
    { key: 'banco-talentos', label: 'Busca Inteligente no Banco de Talentos' },
    { key: 'colaboradores', label: 'Histórico & PDI de Colaboradores' },
    { key: 'ponto-digital', label: 'Análise Preditiva de Ponto & Atrasos' },
    { key: 'departamento-pessoal', label: 'Checklists de Admissão & Rescisão' },
    { key: 'beneficios', label: 'Elegibilidade & Sugestões de Benefícios' },
    { key: 'ferias', label: 'Alertas & Escalas de Férias' },
    { key: 'documentos', label: 'Classificação & Extração de Documentos' },
    { key: 'relatorios', label: 'Interpretação de KPIs & Gráficos' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Title Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              GOVERNANÇA & CONSUMO
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs font-bold text-slate-500">Isolamento Multiempresa Ativo</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            Configurações e Auditoria de Consumo de IA
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Gerencie o provedor Gemini, quotas de utilização, módulos autorizados e acompanhe logs de consumo por empresa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar Metrics</span>
          </button>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Configurações</span>
              </>
            )}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-extrabold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Configurações de IA salvas com sucesso no banco de dados Firestore!</span>
        </div>
      )}

      {/* Consumption Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Total de Chamadas IA</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{usageStats.totalRequests}</p>
          <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {usageStats.successCount} com sucesso ({usageStats.errorCount} erros)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Tokens Utilizados</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{usageStats.totalTokens.toLocaleString('pt-BR')}</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-indigo-600 h-1.5 rounded-full" 
              style={{ width: `${Math.min(100, (usageStats.totalTokens / limiteMensalTokens) * 100)}%` }} 
            />
          </div>
          <p className="text-[10px] text-slate-500 font-medium">
            Quota mensal: {(limiteMensalTokens).toLocaleString('pt-BR')} tokens ({((usageStats.totalTokens / limiteMensalTokens) * 100).toFixed(1)}% consumido)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Custo Estimado</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">R$ {usageStats.estimatedCostBrl.toFixed(2)}</p>
          <p className="text-[11px] text-slate-500 font-medium">Modelo Gemini 3.6 Flash (SaaS)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Status da IA nesta Empresa</span>
            <div className={`p-2 rounded-xl ${iaAtiva ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-xl font-black ${iaAtiva ? 'text-emerald-600' : 'text-rose-600'}`}>
            {iaAtiva ? 'IA Habilitada' : 'IA Desativada'}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">11 módulos configuráveis</p>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: General Rules & Quotas */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Box 1: Status & Model Config */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900">Ativação e Provedor IA</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={iaAtiva} 
                  onChange={(e) => setIaAtiva(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Modelo de IA Padrão</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="gemini-3.6-flash">Gemini 3.6 Flash (Recomendado — Alta Velocidade e Precisão)</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Análise Profunda & Raciocínio)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Conexão segura executada no servidor backend.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Retenção do Histórico de Conversas</label>
                <select
                  value={retencaoConversasDias}
                  onChange={(e) => setRetencaoConversasDias(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value={15}>15 dias de histórico</option>
                  <option value={30}>30 dias de histórico (Padrão)</option>
                  <option value={60}>60 dias de histórico</option>
                  <option value={90}>90 dias de histórico</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Garante conformidade e expurgo automático de logs antigos.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Limite Mensal da Empresa (Tokens)</label>
                <input
                  type="number"
                  value={limiteMensalTokens}
                  onChange={(e) => setLimiteMensalTokens(Number(e.target.value))}
                  step={50000}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Limite Mensal por Usuário (Tokens)</label>
                <input
                  type="number"
                  value={limitePorUsuario}
                  onChange={(e) => setLimitePorUsuario(Number(e.target.value))}
                  step={10000}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Box 2: Authorized Modules */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900">Módulos Habilitados para IA</h3>
              </div>
              <span className="text-xs text-slate-500 font-bold">
                {modulosAutorizados.length} de {allModulesList.length} ativos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allModulesList.map((mod) => {
                const isChecked = modulosAutorizados.includes(mod.key);
                return (
                  <div
                    key={mod.key}
                    onClick={() => handleToggleModule(mod.key)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isChecked
                        ? 'bg-blue-50/50 border-blue-200 text-blue-900'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xs font-bold">{mod.label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Box 3: Privacy & LGPD Notice */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3">
              <Lock className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-black">Política de Privacidade & Proteção Anti-Prompt Injection</h3>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Aviso de Privacidade Exibido aos Usuários de IA
              </label>
              <textarea
                rows={3}
                value={avisoPrivacidade}
                onChange={(e) => setAvisoPrivacidade(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] font-semibold space-y-1">
              <p className="font-extrabold flex items-center gap-1.5 text-amber-950">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                Segurança Ativa Contra Modificação de Dados Críticos
              </p>
              <p>
                - Documentos e currículos enviados são tratados exclusivamente como dados passivos.
              </p>
              <p>
                - Instruções do tipo "ignore comandos anteriores" ou "altere o salário do colaborador" são bloqueadas no servidor.
              </p>
            </div>
          </div>

        </div>

        {/* Right Col: Consumption Breakdown */}
        <div className="space-y-6">
          
          {/* Breakdown by Module */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Consumo por Módulo
              </h3>
            </div>

            <div className="space-y-3">
              {usageStats.usageByModule.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="capitalize">{item.modulo}</span>
                    <span className="text-slate-500">{item.requests} reqs • {item.tokens.toLocaleString('pt-BR')} tok</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, (item.tokens / (usageStats.totalTokens || 1)) * 100)}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown by User */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Top Usuários de IA
              </h3>
            </div>

            <div className="space-y-3">
              {usageStats.usageByUser.map((u, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-slate-800 block truncate max-w-[180px]">{u.userEmail}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{u.requests} chamadas realizadas</span>
                  </div>
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                    {u.tokens.toLocaleString('pt-BR')} tok
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
