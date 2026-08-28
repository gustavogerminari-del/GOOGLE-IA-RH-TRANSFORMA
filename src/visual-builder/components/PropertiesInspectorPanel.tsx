import React, { useState } from 'react';
import { 
  ComponentInstance, 
  ProtectionLevel, 
  ComponentStyles, 
  ResponsiveConfig,
  BuilderScope
} from '../types/builderTypes';
import { 
  Type, 
  Palette, 
  Layout, 
  Smartphone, 
  Eye, 
  ShieldCheck, 
  Database, 
  Lock, 
  Sparkles, 
  AlertTriangle,
  Info,
  Layers,
  ChevronRight,
  Check,
  Copy,
  Trash2,
  Move
} from 'lucide-react';

interface PropertiesInspectorPanelProps {
  component: ComponentInstance | null;
  onUpdateComponent: (updated: ComponentInstance) => void;
  onDeleteComponent?: (id: string) => void;
  onDuplicateComponent?: (comp: ComponentInstance) => void;
}

export const PropertiesInspectorPanel: React.FC<PropertiesInspectorPanelProps> = ({
  component,
  onUpdateComponent,
  onDeleteComponent,
  onDuplicateComponent
}) => {
  const [activeTab, setActiveTab] = useState<'conteudo' | 'aparencia' | 'layout' | 'responsivo' | 'permissoes' | 'dados'>('conteudo');

  if (!component) {
    return (
      <div className="w-80 border-l border-slate-800 bg-slate-900 p-6 flex flex-col items-center justify-center text-center text-slate-400 min-h-[600px]">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
          <Layers className="w-8 h-8" />
        </div>
        <h3 className="text-sm font-bold text-white mb-1">Nenhum Componente Selecionado</h3>
        <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
          Clique em qualquer elemento na página real central para inspecionar e alterar suas propriedades em tempo real.
        </p>
      </div>
    );
  }

  const isCritical = component.protectionLevel === 'systemCritical';
  const isProtected = component.protectionLevel === 'protected';

  const handleContentChange = (field: string, value: any) => {
    onUpdateComponent({
      ...component,
      content: {
        ...component.content,
        [field]: value
      },
      updatedAt: new Date().toISOString()
    });
  };

  const handleStyleChange = (field: keyof ComponentStyles, value: any) => {
    onUpdateComponent({
      ...component,
      styles: {
        ...component.styles,
        [field]: value
      },
      updatedAt: new Date().toISOString()
    });
  };

  const handleResponsiveChange = (field: keyof ResponsiveConfig, value: any) => {
    onUpdateComponent({
      ...component,
      responsive: {
        ...component.responsive,
        [field]: value
      },
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="w-80 border-l border-slate-800 bg-slate-900 flex flex-col h-full text-slate-200 select-none shadow-2xl">
      
      {/* Header Panel */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">{component.componentType}</span>
            {isCritical && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Crítico
              </span>
            )}
            {isProtected && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Protegido
              </span>
            )}
          </div>
          <h3 className="text-sm font-extrabold text-white truncate max-w-[200px] mt-0.5">{component.name}</h3>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1">
          {onDuplicateComponent && !isCritical && (
            <button
              onClick={() => onDuplicateComponent(component)}
              title="Duplicar Componente"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
          {onDeleteComponent && !isCritical && (
            <button
              onClick={() => onDeleteComponent(component.id)}
              title="Excluir Componente"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center border-b border-slate-800 bg-slate-950/50 p-1 overflow-x-auto text-xs no-scrollbar">
        {[
          { id: 'conteudo', label: 'Conteúdo', icon: Type },
          { id: 'aparencia', label: 'Estilos', icon: Palette },
          { id: 'layout', label: 'Espaço', icon: Layout },
          { id: 'responsivo', label: 'Mobile', icon: Smartphone },
          { id: 'permissoes', label: 'Regras', icon: ShieldCheck },
          { id: 'dados', label: 'Dados', icon: Database },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition whitespace-nowrap ${
                isActive 
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">

        {/* 1. TAB CONTEÚDO */}
        {activeTab === 'conteudo' && (
          <div className="space-y-4">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Nome de Identificação Interna:</label>
              <input
                type="text"
                value={component.name}
                onChange={(e) => onUpdateComponent({ ...component, name: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium outline-none focus:border-amber-500"
              />
            </div>

            {component.content.text !== undefined && (
              <div>
                <label className="text-slate-400 font-bold block mb-1">Texto Principal Exibido:</label>
                <textarea
                  rows={3}
                  value={component.content.text || ''}
                  onChange={(e) => handleContentChange('text', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium outline-none focus:border-amber-500"
                />
              </div>
            )}

            {component.content.label !== undefined && (
              <div>
                <label className="text-slate-400 font-bold block mb-1">Rótulo / Label:</label>
                <input
                  type="text"
                  value={component.content.label || ''}
                  onChange={(e) => handleContentChange('label', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium outline-none focus:border-amber-500"
                />
              </div>
            )}

            {component.content.placeholder !== undefined && (
              <div>
                <label className="text-slate-400 font-bold block mb-1">Texto de Dica (Placeholder):</label>
                <input
                  type="text"
                  value={component.content.placeholder || ''}
                  onChange={(e) => handleContentChange('placeholder', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500"
                />
              </div>
            )}

            {component.content.helpText !== undefined && (
              <div>
                <label className="text-slate-400 font-bold block mb-1">Texto de Ajuda / Subtítulo:</label>
                <input
                  type="text"
                  value={component.content.helpText || ''}
                  onChange={(e) => handleContentChange('helpText', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500"
                />
              </div>
            )}

            {component.content.iconName !== undefined && (
              <div>
                <label className="text-slate-400 font-bold block mb-1">Ícone (Lucide Icon):</label>
                <select
                  value={component.content.iconName || ''}
                  onChange={(e) => handleContentChange('iconName', e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-amber-500"
                >
                  <option value="">(Sem ícone)</option>
                  <option value="Plus">Plus (Adicionar)</option>
                  <option value="PlusCircle">PlusCircle (Circulado)</option>
                  <option value="Briefcase">Briefcase (Vagas)</option>
                  <option value="Users">Users (Candidatos)</option>
                  <option value="Calendar">Calendar (Entrevistas)</option>
                  <option value="Clock">Clock (Ponto)</option>
                  <option value="DollarSign">DollarSign (Folha)</option>
                  <option value="Sparkles">Sparkles (IA)</option>
                  <option value="CheckCircle">CheckCircle (Sucesso)</option>
                  <option value="FileText">FileText (Documentos)</option>
                  <option value="LogOut">LogOut (Sair)</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* 2. TAB APARÊNCIA & ESTILOS */}
        {activeTab === 'aparencia' && (
          <div className="space-y-4">
            {/* Background Color */}
            <div>
              <label className="text-slate-400 font-bold block mb-1">Cor de Fundo:</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={component.styles.backgroundColor || '#ffffff'}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={component.styles.backgroundColor || ''}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase text-xs"
                />
              </div>
            </div>

            {/* Text Color */}
            <div>
              <label className="text-slate-400 font-bold block mb-1">Cor do Texto:</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={component.styles.textColor || '#000000'}
                  onChange={(e) => handleStyleChange('textColor', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={component.styles.textColor || ''}
                  onChange={(e) => handleStyleChange('textColor', e.target.value)}
                  placeholder="#0f172a"
                  className="flex-1 p-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase text-xs"
                />
              </div>
            </div>

            {/* Font Size & Weight */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Tamanho Fonte:</label>
                <select
                  value={component.styles.fontSize || '16px'}
                  onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  <option value="12px">12px (Pequeno)</option>
                  <option value="14px">14px (Padrão Body)</option>
                  <option value="16px">16px (Médio)</option>
                  <option value="18px">18px (Destaque)</option>
                  <option value="20px">20px (Título Sub)</option>
                  <option value="24px">24px (Título H2)</option>
                  <option value="30px">30px (Título H1)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Peso da Fonte:</label>
                <select
                  value={component.styles.fontWeight || '400'}
                  onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  <option value="400">400 (Regular)</option>
                  <option value="500">500 (Médio)</option>
                  <option value="600">600 (Semibold)</option>
                  <option value="700">700 (Bold)</option>
                  <option value="800">800 (Extrabold)</option>
                </select>
              </div>
            </div>

            {/* Border Radius */}
            <div>
              <label className="text-slate-400 font-bold block mb-1">Arredondamento de Bordas:</label>
              <select
                value={component.styles.borderRadius || '8px'}
                onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                <option value="0px">0px (Reto)</option>
                <option value="4px">4px (Suave)</option>
                <option value="8px">8px (Padrão Moderno)</option>
                <option value="12px">12px (Arredondado)</option>
                <option value="16px">16px (Card Grande)</option>
                <option value="9999px">Pill / Botão Arredondado</option>
              </select>
            </div>

            {/* Text Align */}
            <div>
              <label className="text-slate-400 font-bold block mb-1">Alinhamento do Texto:</label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                {(['left', 'center', 'right', 'justify'] as const).map(align => (
                  <button
                    key={align}
                    onClick={() => handleStyleChange('textAlign', align)}
                    className={`py-1.5 rounded-lg capitalize font-bold text-[11px] transition ${
                      component.styles.textAlign === align ? 'bg-amber-500 text-slate-950 font-extrabold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. TAB ESPAÇAMENTO & LAYOUT */}
        {activeTab === 'layout' && (
          <div className="space-y-4">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Preenchimento Interno (Padding):</label>
              <select
                value={component.styles.paddingTop || '12px'}
                onChange={(e) => {
                  handleStyleChange('paddingTop', e.target.value);
                  handleStyleChange('paddingBottom', e.target.value);
                  handleStyleChange('paddingLeft', e.target.value);
                  handleStyleChange('paddingRight', e.target.value);
                }}
                className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                <option value="4px">Compacto (4px)</option>
                <option value="8px">Pequeno (8px)</option>
                <option value="12px">Médio (12px)</option>
                <option value="16px">Confortável (16px)</option>
                <option value="24px">Amplo (24px)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Margem Inferior (Spacing):</label>
              <select
                value={component.styles.marginBottom || '16px'}
                onChange={(e) => handleStyleChange('marginBottom', e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                <option value="0px">Nenhuma (0px)</option>
                <option value="8px">8px</option>
                <option value="16px">16px (Padrão)</option>
                <option value="24px">24px</option>
                <option value="32px">32px (Seção)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Largura do Container:</label>
              <select
                value={component.styles.width || '100%'}
                onChange={(e) => handleStyleChange('width', e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                <option value="100%">100% (Largura Total)</option>
                <option value="auto">Automático (Ajustar ao Conteúdo)</option>
                <option value="50%">50% (Metade da Tela)</option>
                <option value="300px">Fixa (300px)</option>
              </select>
            </div>
          </div>
        )}

        {/* 4. TAB RESPONSIVIDADE */}
        {activeTab === 'responsivo' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-amber-400" /> Ocultar Por Dispositivo
              </h4>
              
              <label className="flex items-center justify-between text-slate-300">
                <span>Ocultar em Celulares (&lt;768px):</span>
                <input
                  type="checkbox"
                  checked={component.responsive.hideOnMobile || false}
                  onChange={(e) => handleResponsiveChange('hideOnMobile', e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between text-slate-300">
                <span>Ocultar em Tablets (768px-1024px):</span>
                <input
                  type="checkbox"
                  checked={component.responsive.hideOnTablet || false}
                  onChange={(e) => handleResponsiveChange('hideOnTablet', e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
              </label>

              <label className="flex items-center justify-between text-slate-300">
                <span>Ocultar em Desktop (&gt;1024px):</span>
                <input
                  type="checkbox"
                  checked={component.responsive.hideOnDesktop || false}
                  onChange={(e) => handleResponsiveChange('hideOnDesktop', e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
              </label>
            </div>
          </div>
        )}

        {/* 5. TAB PERMISSÕES & PROTEÇÃO */}
        {activeTab === 'permissoes' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="font-bold text-amber-400 block">Nível de Proteção do Sistema:</span>
              <p className="text-slate-300 capitalize font-bold">{component.protectionLevel}</p>
              {isCritical && (
                <div className="p-2 rounded bg-red-950/60 border border-red-800 text-red-300 text-[11px] leading-snug flex items-start gap-1.5 mt-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>Este componente é essencial para a operação do sistema. Não pode ser removido nem ocultado.</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-slate-400 font-bold block mb-1">Visibilidade Geral:</label>
              <select
                value={component.visibilityRules.hidden ? 'hidden' : 'visible'}
                disabled={isCritical}
                onChange={(e) => onUpdateComponent({
                  ...component,
                  visibilityRules: {
                    ...component.visibilityRules,
                    hidden: e.target.value === 'hidden'
                  }
                })}
                className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white disabled:opacity-50"
              >
                <option value="visible">Visível para Perfis Autorizados</option>
                <option value="hidden">Oculto (Rascunho / Desativado)</option>
              </select>
            </div>
          </div>
        )}

        {/* 6. TAB DADOS & BINDINGS */}
        {activeTab === 'dados' && (
          <div className="space-y-4">
            <div>
              <label className="text-slate-400 font-bold block mb-1">Fonte de Dados Conectada (Firestore):</label>
              <select
                value={component.dataBinding?.dataSource || ''}
                onChange={(e) => onUpdateComponent({
                  ...component,
                  dataBinding: {
                    ...component.dataBinding,
                    dataSource: e.target.value,
                    filterByCompany: true
                  }
                })}
                className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
              >
                <option value="">(Sem vínculo de coleção)</option>
                <option value="vagas">Coleção de Vagas (jobs)</option>
                <option value="candidatos">Coleção de Candidatos (candidates)</option>
                <option value="colaboradores">Coleção de Colaboradores (employees)</option>
                <option value="entrevistas">Coleção de Entrevistas (interviews)</option>
                <option value="ponto">Coleção de Registros de Ponto (timeclock)</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <span className="font-bold text-amber-300 block mb-1">Isolamento Multiempresa Automático:</span>
              Todas as consultas vinculadas a este componente injetam o filtro de segurança <code className="text-amber-400">companyId</code> obrigatoriamente antes da execução.
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
