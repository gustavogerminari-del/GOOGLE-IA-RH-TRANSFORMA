import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Check, 
  Sparkles, 
  Briefcase, 
  Crown, 
  Search, 
  Globe, 
  Building2, 
  Users, 
  UserPlus, 
  Gift, 
  Clock, 
  Calculator, 
  Calendar, 
  UserX, 
  FileText, 
  ShieldCheck, 
  UserCheck, 
  Target, 
  CreditCard, 
  BarChart3, 
  Settings, 
  LayoutDashboard, 
  ShieldAlert,
  Loader2,
  DollarSign,
  Tag,
  Key,
  Layers,
  Lock,
  UserSearch
} from 'lucide-react';
import { SystemModule, saveModuloFirestore } from '../../services/ModuleCatalogService';

interface MasterModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (module: SystemModule) => void;
  initialModule?: SystemModule | null;
  existingModules?: SystemModule[];
}

const CATEGORY_OPTIONS = [
  'Recrutamento e Seleção',
  'Gestão de Pessoas',
  'Departamento Pessoal',
  'Segurança e Governança',
  'Análise e BI',
  'Integrações e Ferramentas'
];

const ICON_PRESETS = [
  { name: 'UserSearch', icon: UserSearch, label: 'Headhunter' },
  { name: 'Briefcase', icon: Briefcase, label: 'Vagas' },
  { name: 'Users', icon: Users, label: 'Talentos/Pessoas' },
  { name: 'Sparkles', icon: Sparkles, label: 'IA Gemini' },
  { name: 'Globe', icon: Globe, label: 'Portal Vagas' },
  { name: 'Building2', icon: Building2, label: 'Empresa/DP' },
  { name: 'ShieldCheck', icon: ShieldCheck, label: 'Segurança' },
  { name: 'Calendar', icon: Calendar, label: 'Agenda/Entrevistas' },
  { name: 'BarChart3', icon: BarChart3, label: 'Relatórios/BI' },
  { name: 'FileText', icon: FileText, label: 'Documentos' },
  { name: 'Clock', icon: Clock, label: 'Ponto/Horas' },
  { name: 'CreditCard', icon: CreditCard, label: 'Financeiro' },
  { name: 'Lock', icon: Lock, label: 'Auditoria/Logs' }
];

const PLAN_KEYS: Array<{ key: string; label: string }> = [];

export const MasterModuleModal: React.FC<MasterModuleModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialModule,
  existingModules = []
}) => {
  const [nome, setNome] = useState('');
  const [key, setKey] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState(CATEGORY_OPTIONS[0]);
  const [icone, setIcone] = useState('Briefcase');
  const [rota, setRota] = useState('/vagas');
  const [ordem, setOrdem] = useState(10);
  const [ativo, setAtivo] = useState(true);
  const [precoAdicional, setPrecoAdicional] = useState(0);
  const [gratuito, setGratuito] = useState(false);
  const [comercializavel, setComercializavel] = useState(true);
  const [enterprise, setEnterprise] = useState(false);
  const [planosDisponiveis, setPlanosDisponiveis] = useState<string[]>([
    'essencial', 'recrutamento', 'profissional', 'completo', 'enterprise'
  ]);
  const [permissionsStr, setPermissionsStr] = useState('');
  const [dependencias, setDependencias] = useState<string[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialModule) {
      setNome(initialModule.nome || '');
      setKey(initialModule.key || initialModule.id || '');
      setDescricao(initialModule.descricao || '');
      setCategoria(initialModule.categoria || CATEGORY_OPTIONS[0]);
      setIcone(initialModule.icone || 'Briefcase');
      setRota(initialModule.rota || `/${initialModule.key || 'vagas'}`);
      setOrdem(initialModule.ordem || 10);
      setAtivo(initialModule.ativo !== false);
      setPrecoAdicional(initialModule.precoAdicional || 0);
      setGratuito(!!initialModule.gratuito);
      setComercializavel(initialModule.comercializavel !== false);
      setEnterprise(!!initialModule.enterprise);
      setPlanosDisponiveis(initialModule.planosDisponiveis || []);
      setPermissionsStr((initialModule.permissions || []).join(', '));
      setDependencias(initialModule.dependencias || []);
    } else {
      setNome('');
      setKey('');
      setDescricao('');
      setCategoria(CATEGORY_OPTIONS[0]);
      setIcone('Briefcase');
      setRota('/novo-modulo');
      setOrdem(existingModules.length + 1);
      setAtivo(true);
      setPrecoAdicional(0);
      setGratuito(false);
      setComercializavel(true);
      setEnterprise(false);
      setPlanosDisponiveis([]);
      setPermissionsStr('');
      setDependencias([]);
    }
    setError('');
  }, [initialModule, isOpen]);

  if (!isOpen) return null;

  const handleNomeChange = (val: string) => {
    setNome(val);
    if (!initialModule) {
      const generated = val
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase()
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
      
      setKey(generated || 'modulo_novo');
      setRota(`/${generated.replace(/_/g, '-') || 'modulo-novo'}`);
    }
  };

  const togglePlan = (pKey: string) => {
    setPlanosDisponiveis(prev => 
      prev.includes(pKey) ? prev.filter(k => k !== pKey) : [...prev, pKey]
    );
  };

  const toggleDependencia = (modKey: string) => {
    setDependencias(prev =>
      prev.includes(modKey) ? prev.filter(k => k !== modKey) : [...prev, modKey]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('Por favor, informe o Nome do módulo.');
      return;
    }
    if (!key.trim()) {
      setError('Por favor, informe o Identificador interno (key).');
      return;
    }

    const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

    const permissions = permissionsStr
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    setIsSaving(true);
    setError('');

    try {
      const saved = await saveModuloFirestore({
        id: cleanKey,
        key: cleanKey,
        nome: nome.trim(),
        descricao: descricao.trim(),
        categoria,
        icone,
        rota: rota.trim().startsWith('/') ? rota.trim() : `/${rota.trim()}`,
        ordem: Number(ordem) || 1,
        ativo,
        precoAdicional: Number(precoAdicional) || 0,
        gratuito,
        comercializavel,
        enterprise,
        planosDisponiveis,
        permissions,
        dependencias
      });

      onSaved(saved);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar módulo no Firestore:', err);
      setError(`Falha ao salvar módulo no Firestore: ${err?.message || String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialModule ? 'Editar Módulo do Catálogo' : 'Criar Novo Módulo no Catálogo'}
              </h2>
              <p className="text-xs text-slate-400">
                Módulos salvos na coleção <code className="text-amber-300 font-mono">modulos</code> e disponibilizados nos planos
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Dados Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nome do Módulo *
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => handleNomeChange(e.target.value)}
                placeholder="Ex: Headhunter, Ponto Eletrônico"
                className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span>Identificador Interno (Key) *</span>
                <span className="text-[10px] text-amber-400 font-normal">slug no Firestore</span>
              </label>
              <input
                type="text"
                required
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="ex: headhunter"
                className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-amber-300 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Descrição do Módulo *
            </label>
            <textarea
              rows={2}
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva a finalidade técnica e operacional deste módulo..."
              className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:border-amber-500 outline-none resize-none"
            />
          </div>

          {/* Categoria, Rota e Ordem */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Categoria *
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Rota Principal (URL)
              </label>
              <input
                type="text"
                value={rota}
                onChange={(e) => setRota(e.target.value)}
                placeholder="/headhunter"
                className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Ordem de Exibição
              </label>
              <input
                type="number"
                min={1}
                value={ordem}
                onChange={(e) => setOrdem(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Ícone Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Ícone do Módulo
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {ICON_PRESETS.map((preset) => {
                const IconComp = preset.icon;
                const isSelected = icone === preset.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setIcone(preset.name)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                    <span className="text-[9px] truncate max-w-full">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preço e Regras Comerciais */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" /> Regras Comerciais e Precificação
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Preço Adicional Mensal (R$/mês)
                </label>
                <input
                  type="number"
                  min={0}
                  value={precoAdicional}
                  onChange={(e) => setPrecoAdicional(Number(e.target.value))}
                  disabled={gratuito}
                  placeholder="Ex: 149"
                  className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 font-bold focus:border-amber-500 outline-none disabled:opacity-50"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={gratuito}
                    onChange={(e) => {
                      setGratuito(e.target.checked);
                      if (e.target.checked) setPrecoAdicional(0);
                    }}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span>Módulo Gratuito (Sem custo adicional)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={comercializavel}
                    onChange={(e) => setComercializavel(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span>Comercializável (Disponível para venda/add-on)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={enterprise}
                    onChange={(e) => setEnterprise(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span className="text-amber-300">Exclusivo para Plano Enterprise</span>
                </label>
              </div>
            </div>
          </div>

          {/* A vinculação de planos é gerenciada na Matriz de Planos e Módulos. */}

          {/* Permissões e Dependências */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Permissões Técnicas (separadas por vírgula)
              </label>
              <input
                type="text"
                value={permissionsStr}
                onChange={(e) => setPermissionsStr(e.target.value)}
                placeholder="headhunter_access, headhunter_export"
                className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Status Inicial
              </label>
              <select
                value={ativo ? 'ativo' : 'inativo'}
                onChange={(e) => setAtivo(e.target.value === 'ativo')}
                className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-amber-500 outline-none"
              >
                <option value="ativo">Ativo (Habilitado no Catálogo)</option>
                <option value="inativo">Desativado / Inativo</option>
              </select>
            </div>
          </div>

          {/* Dependências de Outros Módulos */}
          {existingModules.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Dependências de Outros Módulos
              </label>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-xl">
                {existingModules
                  .filter(m => m.key !== key)
                  .map(m => {
                    const isDep = dependencias.includes(m.key);
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => toggleDependencia(m.key)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                          isDep
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}
                      >
                        {m.nome} ({m.key})
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition-colors cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando no Firestore...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{initialModule ? 'Salvar Alterações' : 'Criar Módulo no Catálogo'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
