import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  PenTool, 
  ShieldCheck, 
  Briefcase, 
  Sparkles, 
  PlusCircle, 
  Clock, 
  AlertTriangle, 
  History, 
  FileCode, 
  Eye, 
  Download, 
  Trash2, 
  CheckCircle2, 
  RefreshCw,
  FilePlus,
  X
} from 'lucide-react';
import { HRDocument, DocumentCategory } from './types';
import { DocumentService } from '../services/DocumentService';
import { getColaboradoresFirestore } from '../departamento-pessoal/services/dpFirestoreService';
import { ColaboradorCompleto } from '../departamento-pessoal/types/dp';
import { useAuth } from '../auth';
import { storage } from '../lib/firebase';
import { getDownloadURL, ref, uploadBytes } from '../firebase/storage';
import { requireTenantId } from '../lib/tenant';

// Subcomponents
import { CentralDocumentos } from './components/CentralDocumentos';
import { GestaoContratos } from './components/GestaoContratos';
import { ModelosGerador } from './components/ModelosGerador';
import { AssinaturaDigitalHub } from './components/AssinaturaDigitalHub';
import { ValidadesAlertas } from './components/ValidadesAlertas';
import { HistoricoAuditoria } from './components/HistoricoAuditoria';

import { ContextualAiModal } from '../ai/components/ContextualAiModal';
import { documentsAiService } from '../ai/services/aiService';

export type DocSubTab = 
  | 'central' 
  | 'contratos' 
  | 'modelos' 
  | 'assinatura' 
  | 'validades' 
  | 'auditoria';

export const DocumentsSignatureView: React.FC = () => {
  const { user } = useAuth();
  const companyId = user?.companyId || user?.empresaId || user?.tenantId || '';

  const [activeSubTab, setActiveSubTab] = useState<DocSubTab>('central');
  const [documents, setDocuments] = useState<HRDocument[]>([]);
  const [colaboradores, setColaboradores] = useState<ColaboradorCompleto[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAiModal, setShowAiModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocForSigningId, setSelectedDocForSigningId] = useState<string | undefined>(undefined);

  // View Document Content Modal State
  const [viewingDoc, setViewingDoc] = useState<HRDocument | null>(null);

  // Upload Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<DocumentCategory>('Contrato de Trabalho');
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityType, setNewEntityType] = useState<'Colaborador' | 'Candidato' | 'Vaga' | 'Empresa'>('Colaborador');
  const [newExpirationDate, setNewExpirationDate] = useState('');
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Load Firestore Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [docsData, colabsData] = await Promise.all([
        DocumentService.list(companyId),
        getColaboradoresFirestore(companyId)
      ]);
      setDocuments(docsData);
      setColaboradores(colabsData);
    } catch (err) {
      console.warn('[Documentos] Erro ao carregar dados do Firestore:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  // Upload Submit Handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    if (!newTitle || !newEntityName || !fileObj) {
      setUploadError('Informe título, vínculo e selecione um arquivo real.');
      return;
    }

    setIsUploading(true);
    try {
      const tenantId = requireTenantId(companyId, 'anexar o documento');
      const documentId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const safeName = fileObj.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storageRef = ref(storage, `companies/${tenantId}/documents/${documentId}/${safeName}`);
      await uploadBytes(storageRef, fileObj, {
        contentType: fileObj.type || 'application/octet-stream',
        customMetadata: { companyId: tenantId, documentId },
      });
      const fileUrl = await getDownloadURL(storageRef);

    const newDocData: Partial<HRDocument> = {
      id: documentId,
      companyId: tenantId,
      title: newTitle,
      fileName: fileObj.name,
      fileSize: `${(fileObj.size / (1024 * 1024)).toFixed(1)} MB`,
      fileUrl,
      category: newCategory,
      linkedEntityName: newEntityName,
      linkedType: newEntityType,
      expirationDate: newExpirationDate || undefined,
      validityStatus: newExpirationDate ? 'Válido' : 'Sem Validade',
      signatureStatus: 'Pendente de Assinatura',
      signers: [
        { name: newEntityName, email: 'colaborador@email.com', role: 'Colaborador', hasSigned: false },
        { name: 'Representante Legal RH', email: 'rh@maisrh.com.br', role: 'Representante Legal RH', hasSigned: false }
      ],
      accessPermissions: { canView: true, canSign: true, canDownload: true, canDelete: true },
      content: `DOCUMENTO: ${newTitle}\nCATEGORIA: ${newCategory}\nVÍNCULO: ${newEntityName}\nDATA: ${new Date().toLocaleDateString('pt-BR')}\n\nEste documento foi enviado para o repositório oficial da empresa e aguarda a coleta de assinaturas digitais dos signatários.`
    };

    await DocumentService.create(newDocData);

    setShowUploadModal(false);
    setNewTitle('');
    setNewEntityName('');
    setNewExpirationDate('');
    setFileObj(null);
    await loadData();
    } catch (error: any) {
      setUploadError(error?.message || 'Não foi possível enviar o documento.');
    } finally {
      setIsUploading(false);
    }
  };

  // KPIs
  const totalDocs = documents.length;
  const signedCount = documents.filter(d => d.signatureStatus === 'Assinado Digitalmente').length;
  const pendingCount = documents.filter(d => d.signatureStatus === 'Pendente de Assinatura').length;
  const expiredOrExpiringCount = documents.filter(d => d.validityStatus === 'Vencido' || d.validityStatus === 'A Vencer').length;

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Gestão Eletrônica de Documentos & Validação ICP-Brasil
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Central de Documentos, Contratos & Assinatura Digital
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Repositório unificado, minutas automáticas, renovação contratual, controle de validades e auditoria completa.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAiModal(true)}
              className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Analisar Vencimentos com IA</span>
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <FilePlus className="w-4 h-4" />
              <span>Novo Documento / Contrato</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total de Documentos</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{totalDocs}</div>
          </div>

          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-700 uppercase">Assinados Digitalmente</span>
            <div className="text-xl font-black text-emerald-950 mt-0.5">{signedCount}</div>
          </div>

          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-100">
            <span className="text-[11px] font-bold text-amber-700 uppercase">Pendentes de Assinatura</span>
            <div className="text-xl font-black text-amber-950 mt-0.5">{pendingCount}</div>
          </div>

          <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-100">
            <span className="text-[11px] font-bold text-rose-700 uppercase">A Vencer / Vencidos</span>
            <div className="text-xl font-black text-rose-950 mt-0.5">{expiredOrExpiringCount}</div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {[
            { id: 'central', label: 'Central de Documentos', icon: FileText },
            { id: 'contratos', label: 'Gestão de Contratos', icon: Briefcase },
            { id: 'modelos', label: 'Modelos & Geração Automática', icon: FileCode },
            { id: 'assinatura', label: 'Assinatura Digital', icon: PenTool },
            { id: 'validades', label: 'Validades & Alertas', icon: Clock },
            { id: 'auditoria', label: 'Histórico & Auditoria', icon: History },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as DocSubTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Syncing Indicator */}
      {loading && (
        <div className="flex items-center justify-center p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-xs text-indigo-900 font-bold gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Sincronizando Repositório de Documentos com Firebase...</span>
        </div>
      )}

      {/* View Router */}
      <div>
        {activeSubTab === 'central' && (
          <CentralDocumentos
            documents={documents}
            colaboradores={colaboradores}
            onRefresh={loadData}
            onOpenUploadModal={() => setShowUploadModal(true)}
            onSelectDocForSigning={(doc) => {
              setSelectedDocForSigningId(doc.id);
              setActiveSubTab('assinatura');
            }}
            onOpenViewModal={(doc) => setViewingDoc(doc)}
          />
        )}

        {activeSubTab === 'contratos' && (
          <GestaoContratos
            documents={documents}
            colaboradores={colaboradores}
            onRefresh={loadData}
            onOpenCreateContractModal={() => {
              setNewCategory('Contrato de Trabalho');
              setShowUploadModal(true);
            }}
          />
        )}

        {activeSubTab === 'modelos' && (
          <ModelosGerador
            companyId={companyId}
            colaboradores={colaboradores}
            onDocumentGenerated={() => {
              loadData();
              setActiveSubTab('central');
            }}
          />
        )}

        {activeSubTab === 'assinatura' && (
          <AssinaturaDigitalHub
            documents={documents}
            onRefresh={loadData}
            selectedDocIdForSigning={selectedDocForSigningId}
          />
        )}

        {activeSubTab === 'validades' && (
          <ValidadesAlertas
            documents={documents}
            onOpenDocument={(doc) => setViewingDoc(doc)}
          />
        )}

        {activeSubTab === 'auditoria' && (
          <HistoricoAuditoria
            documents={documents}
          />
        )}
      </div>

      {/* Modal: View Full Document Content */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                  {viewingDoc.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{viewingDoc.title}</h3>
                <p className="text-xs text-slate-500">Vínculo: {viewingDoc.linkedEntityName} ({viewingDoc.linkedType})</p>
              </div>
              <button onClick={() => setViewingDoc(null)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap shadow-inner">
              {viewingDoc.content || `DOCUMENTO OFICIAL: ${viewingDoc.title}\n\nO conteúdo do arquivo ${viewingDoc.fileName} foi importado e validado.`}
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-800">Signatários & Validação ICP:</h4>
              <div className="space-y-1">
                {viewingDoc.signers.map((s, idx) => (
                  <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span>{s.name} ({s.role})</span>
                    {s.hasSigned ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        ✓ Assinado em {s.signedAt}
                      </span>
                    ) : (
                      <span className="text-amber-600 font-bold">Pendente</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setViewingDoc(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Upload New Document */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Novo Documento / Contrato</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título do Documento *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Contrato Individual CLT - Mariana Siqueira"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Categoria *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as DocumentCategory)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                >
                  <option value="Contrato de Trabalho">Contrato de Trabalho</option>
                  <option value="Termo de Admissão">Termo de Admissão</option>
                  <option value="NDA / Sigilo">NDA / Sigilo</option>
                  <option value="Declaração de Benefícios">Declaração de Benefícios</option>
                  <option value="Atestado / Laudo">Atestado / Laudo</option>
                  <option value="Termo de Equipamentos">Termo de Equipamentos</option>
                  <option value="Aditivo Contratual">Aditivo Contratual</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vínculo com *</label>
                  <select
                    value={newEntityType}
                    onChange={(e) => setNewEntityType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                  >
                    <option value="Colaborador">Colaborador</option>
                    <option value="Candidato">Candidato</option>
                    <option value="Vaga">Vaga</option>
                    <option value="Empresa">Empresa</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pessoa / Entidade *</label>
                  <input
                    type="text"
                    required
                    value={newEntityName}
                    onChange={(e) => setNewEntityName(e.target.value)}
                    placeholder="Ex: Mariana Costa Siqueira"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Data de Validade (Opcional):</label>
                <input
                  type="date"
                  value={newExpirationDate}
                  onChange={(e) => setNewExpirationDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Anexar Arquivo (PDF / Texto) *</label>
                <input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={(e) => setFileObj(e.target.files?.[0] || null)}
                  className="w-full p-2 text-slate-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                {uploadError && <p className="mr-auto text-xs font-semibold text-rose-600">{uploadError}</p>}
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
                >
                  {isUploading ? 'Enviando arquivo...' : 'Salvar e Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Assistant Modal */}
      <ContextualAiModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        title="Análise de Vencimentos & Conformidade de Documentos"
        subtitle="Verificação automatizada de prazos de validade, NDAs e contratos do repositório"
        onExecute={() => documentsAiService.identifyExpiration({ documents })}
        confirmText="Anotar Prazos"
      />
    </div>
  );
};
