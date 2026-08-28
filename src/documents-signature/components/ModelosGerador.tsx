import React, { useState, useEffect } from 'react';
import { 
  FileCode, 
  Sparkles, 
  Plus, 
  Check, 
  Eye, 
  User, 
  Copy, 
  Save, 
  Building2, 
  FileText, 
  ArrowRight,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { DocumentTemplate, DocumentCategory } from '../types';
import { DocumentService } from '../../services/DocumentService';
import { ColaboradorCompleto } from '../../departamento-pessoal/types/dp';

interface ModelosGeradorProps {
  companyId: string;
  colaboradores: ColaboradorCompleto[];
  onDocumentGenerated: () => void;
}

export const ModelosGerador: React.FC<ModelosGeradorProps> = ({
  companyId,
  colaboradores,
  onDocumentGenerated
}) => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Template Generator state
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [selectedColaboradorId, setSelectedColaboradorId] = useState<string>('');
  const [renderedContent, setRenderedContent] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSuccess, setGeneratedSuccess] = useState(false);

  // New Template Modal State
  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);
  const [newTmplTitle, setNewTmplTitle] = useState('');
  const [newTmplCategory, setNewTmplCategory] = useState<DocumentCategory>('Contrato de Trabalho');
  const [newTmplDesc, setNewTmplDesc] = useState('');
  const [newTmplText, setNewTmplText] = useState('');

  // Load Templates
  const loadTemplates = async () => {
    setLoading(true);
    const tmpls = await DocumentService.listTemplates(companyId);
    setTemplates(tmpls);
    if (tmpls.length > 0 && !selectedTemplate) {
      setSelectedTemplate(tmpls[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, [companyId]);

  // Handle variable preview update
  useEffect(() => {
    if (!selectedTemplate) return;

    const targetColab = colaboradores.find(c => c.id === selectedColaboradorId);

    const rendered = DocumentService.renderTemplate(selectedTemplate.templateText, {
      nomeColaborador: targetColab?.nomeCompleto || '[Nome do Colaborador]',
      cpf: targetColab?.cpf || '[CPF]',
      rg: targetColab?.rg || '[RG]',
      cargo: targetColab?.cargo || '[Cargo]',
      departamento: targetColab?.departamento || '[Departamento]',
      salario: targetColab?.salarioBase || '[Salário]',
      dataAdmissao: targetColab?.dataAdmissao || '[Data Admissão]',
      empresaNome: 'RH TRANSFORMA Tecnologias Ltda',
      cnpj: '12.345.678/0001-90',
      cidadeEmpresa: 'São Paulo - SP',
      dataAtual: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    });

    setRenderedContent(rendered);

    if (targetColab) {
      setCustomTitle(`${selectedTemplate.title} - ${targetColab.nomeCompleto}`);
    } else {
      setCustomTitle(selectedTemplate.title);
    }
  }, [selectedTemplate, selectedColaboradorId, colaboradores]);

  // Save new template
  const handleSaveNewTemplate = async () => {
    if (!newTmplTitle || !newTmplText) {
      alert('Por favor, preencha o título e o texto do modelo.');
      return;
    }

    await DocumentService.saveTemplate({
      companyId,
      title: newTmplTitle,
      category: newTmplCategory,
      description: newTmplDesc,
      templateText: newTmplText,
      requiredSignerRoles: ['Colaborador', 'Representante Legal RH']
    });

    setIsNewTemplateModalOpen(false);
    setNewTmplTitle('');
    setNewTmplText('');
    setNewTmplDesc('');
    await loadTemplates();
  };

  // Generate Document from Template and Save to Firestore
  const handleGenerateAndSaveDocument = async () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);

    const targetColab = colaboradores.find(c => c.id === selectedColaboradorId);

    const newDoc = await DocumentService.create({
      companyId,
      colaboradorId: targetColab?.id,
      title: customTitle || selectedTemplate.title,
      fileName: `${selectedTemplate.category.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.pdf`,
      fileSize: '1.2 MB',
      category: selectedTemplate.category,
      linkedEntityName: targetColab?.nomeCompleto || 'Geral',
      linkedType: 'Colaborador',
      uploadedAt: new Date().toISOString().split('T')[0],
      signatureStatus: 'Pendente de Assinatura',
      content: renderedContent,
      signers: [
        {
          name: targetColab?.nomeCompleto || 'Colaborador',
          email: targetColab?.email || 'colaborador@email.com',
          role: 'Colaborador',
          hasSigned: false
        },
        {
          name: 'Representante Legal RH',
          email: 'rh@maisrh.com.br',
          role: 'Representante Legal RH',
          hasSigned: true,
          signedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
        }
      ]
    });

    setIsGenerating(false);
    setGeneratedSuccess(true);
    setTimeout(() => setGeneratedSuccess(false), 4000);

    onDocumentGenerated();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>Modelos de Documentos & Geração Automática com Variáveis</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Crie minutas personalizadas com tags dinâmicas (`&#123;&#123;nomeColaborador&#125;&#125;`, `&#123;&#123;cpf&#125;&#125;`, `&#123;&#123;salario&#125;&#125;`) e gere contratos instantâneos para assinatura.
          </p>
        </div>

        <button
          onClick={() => setIsNewTemplateModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Modelo de Documento</span>
        </button>
      </div>

      {/* Main Generator Interface Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Template Catalog & Colaborador Selection (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">1. Selecione o Modelo</h4>

            {loading ? (
              <div className="text-xs text-slate-400 text-center py-4">Carregando modelos...</div>
            ) : (
              <div className="space-y-2">
                {templates.map(tmpl => (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                      selectedTemplate?.id === tmpl.id
                        ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-950 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{tmpl.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">{tmpl.category}</span>
                    </div>
                    <p className="text-[11px] font-normal text-slate-500 mt-1 line-clamp-2">{tmpl.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Colaborador Target Selector */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" />
              <span>2. Selecione o Colaborador Alvo</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Selecione o colaborador para preencher automaticamente o nome, CPF, salário, cargo e data de admissão.
            </p>

            <select
              value={selectedColaboradorId}
              onChange={(e) => setSelectedColaboradorId(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Selecionar Colaborador --</option>
              {colaboradores.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nomeCompleto} - {c.cargo} ({c.cpf})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Rendered Document Preview & Actions (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Pré-visualização em Tempo Real</span>
                <h4 className="text-sm font-bold text-slate-900">{selectedTemplate?.title || 'Selecione um modelo'}</h4>
              </div>

              {generatedSuccess && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Documento gerado e enviado para assinatura com sucesso!</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Título do Documento Final:</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Rendered Document Box */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-[420px] overflow-y-auto shadow-inner">
              {renderedContent || 'O texto do documento pré-visualizado aparecerá aqui com as variáveis substituídas.'}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Assinantes Requeridos: <strong>{selectedTemplate?.requiredSignerRoles?.join(', ') || 'Colaborador, RH'}</strong>
            </span>

            <button
              onClick={handleGenerateAndSaveDocument}
              disabled={isGenerating || !selectedTemplate}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gerando Documento...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Gerar Documento & Enviar para Assinatura</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* New Template Modal */}
      {isNewTemplateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <span>Novo Modelo de Documento com Variáveis</span>
              </h3>
              <button onClick={() => setIsNewTemplateModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Título do Modelo:</label>
                  <input
                    type="text"
                    placeholder="Ex: Contrato de Estágio Padrão 2026"
                    value={newTmplTitle}
                    onChange={(e) => setNewTmplTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Categoria:</label>
                  <select
                    value={newTmplCategory}
                    onChange={(e) => setNewTmplCategory(e.target.value as DocumentCategory)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Contrato de Trabalho">Contrato de Trabalho</option>
                    <option value="NDA / Sigilo">NDA / Sigilo</option>
                    <option value="Termo de Admissão">Termo de Admissão</option>
                    <option value="Termo de Equipamentos">Termo de Equipamentos</option>
                    <option value="Declaração de Benefícios">Declaração de Benefícios</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Descrição Breve:</label>
                <input
                  type="text"
                  placeholder="Instruções para uso deste modelo..."
                  value={newTmplDesc}
                  onChange={(e) => setNewTmplDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Minuta / Texto com Tags:</label>
                  <span className="text-[10px] font-semibold text-indigo-600">Tags: &#123;&#123;nomeColaborador&#125;&#125;, &#123;&#123;cpf&#125;&#125;, &#123;&#123;cargo&#125;&#125;, &#123;&#123;salario&#125;&#125;, &#123;&#123;dataAdmissao&#125;&#125;, &#123;&#123;dataAtual&#125;&#125;</span>
                </div>
                <textarea
                  rows={8}
                  placeholder={`CONTRATO DE TRABALHO\n\nEMPREGADOR: {{empresaNome}}\nEMPREGADO: {{nomeColaborador}}, CPF nº {{cpf}}...`}
                  value={newTmplText}
                  onChange={(e) => setNewTmplText(e.target.value)}
                  className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button onClick={() => setIsNewTemplateModalOpen(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">
                Cancelar
              </button>
              <button onClick={handleSaveNewTemplate} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer">
                Salvar Modelo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
