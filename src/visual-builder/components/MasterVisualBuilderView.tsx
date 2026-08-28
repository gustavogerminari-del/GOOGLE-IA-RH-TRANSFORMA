import React, { useState, useEffect } from 'react';
import { 
  PageConfig, 
  ComponentInstance, 
  BuilderScope, 
  BuilderMode, 
  EditableDevice,
  ComponentType
} from '../types/builderTypes';
import { visualBuilderStore } from '../store/visualBuilderStore';
import { getTenants } from '../../master-admin/masterTenantsStore';
import { PropertiesInspectorPanel } from './PropertiesInspectorPanel';
import { VisualCanvasFrame } from './VisualCanvasFrame';
import { MenuNavigationEditor } from './MenuNavigationEditor';
import { CustomFieldsEditorModal } from './CustomFieldsEditorModal';
import { VersionHistoryModal } from './VersionHistoryModal';
import { TemplateManagerModal } from './TemplateManagerModal';
import { ThemeBrandingModal } from './ThemeBrandingModal';
import { AiDesignAssistantModal } from './AiDesignAssistantModal';

import { 
  Crown, 
  ArrowLeft, 
  Save, 
  Send, 
  Undo2, 
  Redo2, 
  Eye, 
  Edit3, 
  Navigation, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Layers, 
  Plus, 
  History, 
  Database, 
  Menu, 
  Palette, 
  Building2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Sliders,
  X,
  FileText,
  Search,
  Lock,
  ChevronRight
} from 'lucide-react';

export const MasterVisualBuilderView: React.FC<{ onBackToMaster?: () => void }> = ({ onBackToMaster }) => {
  // Store Data State
  const [pages, setPages] = useState<PageConfig[]>(() => visualBuilderStore.getPages());

  useEffect(() => {
    let active = true;
    visualBuilderStore.hydrateFromFirestore().then(() => {
      if (active) setPages([...visualBuilderStore.getPages()]);
    }).catch(error => console.error('[VisualBuilder] Erro ao hidratar configurações:', error));
    return () => { active = false; };
  }, []);
  const tenants = getTenants();

  // Builder State
  const [activePageId, setActivePageId] = useState<string>('page-dashboard');
  const [builderMode, setBuilderMode] = useState<BuilderMode>('edit');
  const [selectedDevice, setSelectedDevice] = useState<EditableDevice>('desktop');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedComponentId, setSelectedComponentId] = useState<string | undefined>(undefined);
  const [activeScope, setActiveScope] = useState<BuilderScope>('global');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('GLOBAL');

  // Left Panel Subtab
  const [leftSubTab, setLeftSubTab] = useState<'paginas' | 'camadas' | 'componentes' | 'menus'>('paginas');
  const [pageSearch, setPageSearch] = useState('');

  // Modals
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isFieldsModalOpen, setIsFieldsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Status Alerts
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [publishSummary, setPublishSummary] = useState('');
  const [isPublishingModalOpen, setIsPublishingModalOpen] = useState(false);

  // Get active page
  const activePage = pages.find(p => p.id === activePageId) || pages[0];
  const selectedComponent = activePage?.components.find(c => c.id === selectedComponentId) || null;

  // Sync pages when modified
  const handleUpdateActivePageComponents = (updatedComponents: ComponentInstance[]) => {
    if (!activePage) return;
    const updatedPageConfig: PageConfig = {
      ...activePage,
      components: updatedComponents,
      status: 'draft',
      updatedAt: new Date().toISOString()
    };

    visualBuilderStore.updatePageConfig(updatedPageConfig, 'MASTER Admin');
    setPages(visualBuilderStore.getPages());
  };

  const handleUpdateComponent = (updatedComp: ComponentInstance) => {
    if (!activePage) return;
    const updatedComponents = activePage.components.map(c => c.id === updatedComp.id ? updatedComp : c);
    handleUpdateActivePageComponents(updatedComponents);
  };

  const handleAddComponent = (type: ComponentType, name: string) => {
    if (!activePage) return;
    const newComp: ComponentInstance = {
      id: `comp-${Date.now()}`,
      pageId: activePage.id,
      componentType: type,
      componentKey: `custom_${type}_${Date.now()}`,
      name: name,
      order: activePage.components.length + 1,
      protectionLevel: 'editable',
      content: { text: `Novo ${name}`, label: name },
      styles: {
        backgroundColor: '#ffffff',
        textColor: '#0f172a',
        borderRadius: '8px',
        paddingTop: '12px',
        paddingBottom: '12px',
        marginBottom: '16px'
      },
      responsive: {},
      visibilityRules: { hidden: false },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    handleUpdateActivePageComponents([...activePage.components, newComp]);
    setSelectedComponentId(newComp.id);
  };

  const handleUndo = () => {
    if (!activePage) return;
    const previous = visualBuilderStore.undo(activePage.id);
    if (previous) {
      setPages(visualBuilderStore.getPages());
      setSaveStatus('Alteração desfeita');
      setTimeout(() => setSaveStatus(null), 2000);
    }
  };

  const handleRedo = () => {
    if (!activePage) return;
    const next = visualBuilderStore.redo(activePage.id);
    if (next) {
      setPages(visualBuilderStore.getPages());
      setSaveStatus('Alteração refeita');
      setTimeout(() => setSaveStatus(null), 2000);
    }
  };

  const handlePublish = () => {
    if (!activePage) return;
    try {
      visualBuilderStore.publishDraft(
        activePage.id,
        publishSummary || 'Publicação de atualizações visuais no Construtor Visual',
        'MASTER Admin',
        activeScope,
        selectedCompanyId !== 'GLOBAL' ? selectedCompanyId : undefined
      );

      setPages(visualBuilderStore.getPages());
      setIsPublishingModalOpen(false);
      setPublishSummary('');
      setSaveStatus('Página publicada com sucesso!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Erro ao publicar.');
    }
  };

  const filteredPages = pages.filter(p => 
    p.name.toLowerCase().includes(pageSearch.toLowerCase()) || 
    p.slug.toLowerCase().includes(pageSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 font-sans select-none overflow-hidden fixed inset-0 z-40">
      
      {/* 1. TOP BAR DE AÇÕES GLOBAL */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 gap-3 z-20 shadow-xl">
        
        {/* Left: Voltar & Título do Módulo */}
        <div className="flex items-center gap-3">
          {onBackToMaster && (
            <button
              onClick={onBackToMaster}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Voltar ao Painel MASTER"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black shadow-inner">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-400 uppercase tracking-widest">RH TRANSFORMA</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500 text-slate-950 uppercase">MASTER BUILDER</span>
              </div>
              <h1 className="text-sm font-extrabold text-white leading-tight">Construtor Visual Global</h1>
            </div>
          </div>
        </div>

        {/* Center: Seletor de Página & Empresa */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-400 pl-2">Página:</span>
          <select
            value={activePageId}
            onChange={(e) => {
              setActivePageId(e.target.value);
              setSelectedComponentId(undefined);
            }}
            className="bg-slate-900 text-white font-bold text-xs rounded-xl px-3 py-1.5 border border-slate-800 outline-none focus:border-amber-500"
          >
            {pages.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.slug})
              </option>
            ))}
          </select>

          <span className="text-slate-700 font-bold">|</span>

          <span className="text-xs font-bold text-slate-400">Escopo Empresa:</span>
          <select
            value={selectedCompanyId}
            onChange={(e) => {
              setSelectedCompanyId(e.target.value);
              setActiveScope(e.target.value === 'GLOBAL' ? 'global' : 'company');
            }}
            className="bg-slate-900 text-amber-400 font-extrabold text-xs rounded-xl px-3 py-1.5 border border-slate-800 outline-none focus:border-amber-500"
          >
            <option value="GLOBAL">🌐 Todas as Empresas (Global)</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>
                🏢 {t.companyName}
              </option>
            ))}
          </select>
        </div>

        {/* Device Switcher & Modos */}
        <div className="flex items-center gap-2">
          {/* Devices */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedDevice('desktop')}
              className={`p-1.5 rounded-lg transition ${selectedDevice === 'desktop' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
              title="Desktop (100%)"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDevice('tablet')}
              className={`p-1.5 rounded-lg transition ${selectedDevice === 'tablet' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
              title="Tablet (768px)"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDevice('mobile')}
              className={`p-1.5 rounded-lg transition ${selectedDevice === 'mobile' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
              title="Smartphone (390px)"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          {/* Builder Mode Switcher */}
          <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setBuilderMode('edit')}
              className={`px-3 py-1.5 rounded-lg transition ${builderMode === 'edit' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Editar
            </button>
            <button
              onClick={() => setBuilderMode('navigate')}
              className={`px-3 py-1.5 rounded-lg transition ${builderMode === 'navigate' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Navegar
            </button>
            <button
              onClick={() => setBuilderMode('preview')}
              className={`px-3 py-1.5 rounded-lg transition ${builderMode === 'preview' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Visualizar
            </button>
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <button
              disabled={!visualBuilderStore.canUndo(activePage.id)}
              onClick={handleUndo}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition"
              title="Desfazer"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              disabled={!visualBuilderStore.canRedo(activePage.id)}
              onClick={handleRedo}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 transition"
              title="Refazer"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Action Modals Triggers */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition flex items-center gap-1.5 text-xs font-black shadow-inner"
            title="Assistente de IA para Design"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="hidden xl:inline">IA Designer</span>
          </button>

          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="p-2 rounded-xl bg-slate-800 text-amber-400 hover:bg-slate-700 transition flex items-center gap-1 text-xs font-bold"
            title="Personalizar Tema & Marca Branca"
          >
            <Palette className="w-4 h-4" />
            <span className="hidden xl:inline">Tema & Marca</span>
          </button>

          <button
            onClick={() => setIsFieldsModalOpen(true)}
            className="p-2 rounded-xl bg-slate-800 text-amber-400 hover:bg-slate-700 transition flex items-center gap-1 text-xs font-bold"
            title="Campos Personalizados"
          >
            <Database className="w-4 h-4" />
            <span className="hidden xl:inline">Campos</span>
          </button>

          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="p-2 rounded-xl bg-slate-800 text-amber-400 hover:bg-slate-700 transition flex items-center gap-1 text-xs font-bold"
            title="Modelos"
          >
            <Building2 className="w-4 h-4" />
            <span className="hidden xl:inline">Modelos</span>
          </button>

          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs font-bold"
            title="Histórico de Versões"
          >
            <History className="w-4 h-4" />
            <span className="hidden xl:inline">Versões</span>
          </button>

          {/* Publish Trigger */}
          <button
            onClick={() => setIsPublishingModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publicar</span>
          </button>
        </div>

      </header>

      {/* Save Status Alert */}
      {saveStatus && (
        <div className="absolute top-18 right-8 z-50 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* MAIN BUILDER WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* 2. PAINEL ESQUERDO (Navegação de Páginas / Camadas / Componentes) */}
        <aside className="w-72 border-r border-slate-800 bg-slate-900 flex flex-col shrink-0">
          
          {/* Subtabs Left */}
          <div className="flex items-center border-b border-slate-800 bg-slate-950 p-1 text-xs font-bold">
            <button
              onClick={() => setLeftSubTab('paginas')}
              className={`flex-1 py-2 rounded-lg text-center transition ${leftSubTab === 'paginas' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
            >
              Páginas
            </button>
            <button
              onClick={() => setLeftSubTab('camadas')}
              className={`flex-1 py-2 rounded-lg text-center transition ${leftSubTab === 'camadas' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
            >
              Camadas
            </button>
            <button
              onClick={() => setLeftSubTab('componentes')}
              className={`flex-1 py-2 rounded-lg text-center transition ${leftSubTab === 'componentes' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
            >
              Adicionar
            </button>
            <button
              onClick={() => setLeftSubTab('menus')}
              className={`flex-1 py-2 rounded-lg text-center transition ${leftSubTab === 'menus' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
            >
              Menus
            </button>
          </div>

          {/* Subtab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* PÁGINAS TAB */}
            {leftSubTab === 'paginas' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar páginas..."
                    value={pageSearch}
                    onChange={(e) => setPageSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  {filteredPages.map(p => {
                    const isActive = p.id === activePageId;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setActivePageId(p.id);
                          setSelectedComponentId(undefined);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                          isActive 
                            ? 'bg-amber-950/20 border-amber-500/80 font-bold text-white shadow-md' 
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {p.status === 'published' && (
                              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Publicado em produção" />
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">/{p.slug}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-600'}`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CAMADAS TAB */}
            {leftSubTab === 'camadas' && (
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-2">
                  Estrutura da Página ({activePage.components.length})
                </span>
                {activePage.components.map((c) => {
                  const isSelected = c.id === selectedComponentId;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedComponentId(c.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected 
                          ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow' 
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="text-[10px] font-mono opacity-80 uppercase">{c.componentType}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* COMPONENTES ADICIONÁVEIS TAB */}
            {leftSubTab === 'componentes' && (
              <div className="space-y-3 text-xs">
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-2">
                  Biblioteca de Componentes
                </span>

                {[
                  { type: 'title', label: 'Título / Cabeçalho' },
                  { type: 'paragraph', label: 'Parágrafo / Texto' },
                  { type: 'button', label: 'Botão de Ação' },
                  { type: 'stat_card', label: 'Card de Indicador (Stat)' },
                  { type: 'banner', label: 'Banner Promocional' },
                  { type: 'card', label: 'Card de Conteúdo' },
                  { type: 'divider', label: 'Divisor de Seção' },
                ].map(item => (
                  <button
                    key={item.type}
                    onClick={() => handleAddComponent(item.type as any, item.label)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 hover:border-amber-500 hover:text-white font-bold flex items-center justify-between transition group"
                  >
                    <span>{item.label}</span>
                    <Plus className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                  </button>
                ))}
              </div>
            )}

            {/* MENUS TAB */}
            {leftSubTab === 'menus' && (
              <MenuNavigationEditor />
            )}

          </div>

        </aside>

        {/* 3. ÁREA CENTRAL (CANVAS DO SISTEMA REAL) */}
        <VisualCanvasFrame
          pageConfig={activePage}
          builderMode={builderMode}
          selectedDevice={selectedDevice}
          zoomLevel={zoomLevel}
          selectedComponentId={selectedComponentId}
          onSelectComponent={setSelectedComponentId}
          onUpdatePageComponents={handleUpdateActivePageComponents}
        />

        {/* 4. PAINEL DIREITO (INSPETOR DE PROPRIEDADES) */}
        <PropertiesInspectorPanel
          component={selectedComponent}
          onUpdateComponent={handleUpdateComponent}
          onDeleteComponent={(id) => {
            handleUpdateActivePageComponents(activePage.components.filter(c => c.id !== id));
            setSelectedComponentId(undefined);
          }}
          onDuplicateComponent={(comp) => {
            const dup = { ...comp, id: `comp-dup-${Date.now()}`, name: `${comp.name} (Cópia)` };
            handleUpdateActivePageComponents([...activePage.components, dup]);
          }}
        />

      </div>

      {/* MODAL DE PUBLICAÇÃO */}
      {isPublishingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-slate-200">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-400" /> Publicar Alterações na Página
            </h3>

            <div>
              <label className="text-xs text-slate-400 font-bold block mb-1">
                Resumo das Alterações (para Histórico e Auditoria):
              </label>
              <textarea
                rows={3}
                value={publishSummary}
                onChange={(e) => setPublishSummary(e.target.value)}
                placeholder="Ex: Ajuste nas cores do cabeçalho e inclusão do botão de nova vaga."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsPublishingModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handlePublish}
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400"
              >
                Confirmar Publicação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE HISTÓRICO */}
      <VersionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        pageId={activePage.id}
        onVersionRestored={() => setPages(visualBuilderStore.getPages())}
      />

      {/* MODAL DE CAMPOS PERSONALIZADOS */}
      <CustomFieldsEditorModal
        isOpen={isFieldsModalOpen}
        onClose={() => setIsFieldsModalOpen(false)}
      />

      {/* MODAL DE MODELOS */}
      <TemplateManagerModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
      />

      {/* MODAL DE TEMA E MARCA BRANCA */}
      <ThemeBrandingModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        selectedCompanyId={selectedCompanyId}
        onSaved={() => setPages(visualBuilderStore.getPages())}
      />

      {/* MODAL DE IA DESIGNER */}
      <AiDesignAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        activePageId={activePage.id}
        onProposalApplied={() => setPages(visualBuilderStore.getPages())}
      />

    </div>
  );
};
