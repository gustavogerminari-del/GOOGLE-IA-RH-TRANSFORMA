import React, { useState } from 'react';
import { 
  FileText, 
  PenTool, 
  Download, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  FilePlus, 
  Sparkles,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Building2,
  Calendar,
  X
} from 'lucide-react';
import { HRDocument, DocumentCategory, SignatureStatus } from '../types';
import { DocumentService } from '../../services/DocumentService';
import { ColaboradorCompleto } from '../../departamento-pessoal/types/dp';

interface CentralDocumentosProps {
  documents: HRDocument[];
  colaboradores: ColaboradorCompleto[];
  onRefresh: () => void;
  onOpenUploadModal: () => void;
  onSelectDocForSigning: (doc: HRDocument) => void;
  onOpenViewModal: (doc: HRDocument) => void;
}

export const CentralDocumentos: React.FC<CentralDocumentosProps> = ({
  documents,
  colaboradores,
  onRefresh,
  onOpenUploadModal,
  onSelectDocForSigning,
  onOpenViewModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Real file download simulator (creates blob and triggers download)
  const handleDownloadFile = (docItem: HRDocument) => {
    const textContent = docItem.content || `DOCUMENTO: ${docItem.title}\nCATEGORIA: ${docItem.category}\nVÍNCULO: ${docItem.linkedEntityName}\nDATA: ${docItem.uploadedAt}\nSTATUS: ${docItem.signatureStatus}\n\nEste é o documento impresso e certificado digitalmente via RH TRANSFORMA.`;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = docItem.fileName || `${docItem.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Real Delete Handler
  const handleDeleteDoc = async (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o documento "${title}"? esta ação é irreversível.`)) {
      await DocumentService.delete(id);
      onRefresh();
    }
  };

  // Filter Logic
  const filteredDocs = documents.filter(d => {
    const matchesSearch = 
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.linkedEntityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCat = selectedCategory === 'Todas' || d.category === selectedCategory;
    const matchesStatus = selectedStatus === 'Todos' || d.signatureStatus === selectedStatus;

    return matchesSearch && matchesCat && matchesStatus;
  });

  // Pagination Logic
  const totalItems = filteredDocs.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedDocs = filteredDocs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Search & Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por título, pessoa ou arquivo..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Categoria:</span>
          {['Todas', 'Contrato de Trabalho', 'Termo de Admissão', 'NDA / Sigilo', 'Declaração de Benefícios', 'Atestado / Laudo', 'Termo de Equipamentos'].map(cat => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-indigo-600 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Pendente de Assinatura">Pendente de Assinatura</option>
            <option value="Assinado Digitalmente">Assinado Digitalmente</option>
            <option value="Recusado">Recusado</option>
            <option value="Em Análise">Em Análise</option>
          </select>
        </div>
      </div>

      {/* Document Grid */}
      {paginatedDocs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-2xs space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Nenhum documento encontrado</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Não foram localizados arquivos com os filtros aplicados. Tente ajustar a busca ou envie um novo documento.
          </p>
          <button
            onClick={onOpenUploadModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer mt-2"
          >
            <FilePlus className="w-4 h-4" />
            <span>Enviar Novo Documento</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedDocs.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 flex flex-col justify-between hover:border-indigo-300 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {doc.category}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    doc.signatureStatus === 'Assinado Digitalmente' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : doc.signatureStatus === 'Recusado'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {doc.signatureStatus === 'Assinado Digitalmente' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {doc.signatureStatus}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{doc.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Vínculo: <strong className="text-slate-800">{doc.linkedEntityName}</strong> ({doc.linkedType})
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Arquivo:</span>
                    <strong className="text-slate-800 truncate max-w-[160px]">{doc.fileName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Tamanho:</span>
                    <span>{doc.fileSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enviado em:</span>
                    <span>{doc.uploadedAt}</span>
                  </div>
                  {doc.expirationDate && (
                    <div className="flex justify-between pt-1 border-t border-slate-200/60 font-semibold">
                      <span>Validade:</span>
                      <span className={
                        doc.validityStatus === 'Vencido' ? 'text-rose-600' :
                        doc.validityStatus === 'A Vencer' ? 'text-amber-600' : 'text-emerald-600'
                      }>
                        {doc.expirationDate} ({doc.validityStatus})
                      </span>
                    </div>
                  )}
                </div>

                {/* Signers Summary */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assinantes ({doc.signers.filter(s => s.hasSigned).length}/{doc.signers.length}):</span>
                    <span className="text-[10px] font-semibold text-slate-500">v{doc.version || 1}</span>
                  </div>
                  {doc.signers.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]">{s.name} <span className="text-[10px] font-normal text-slate-500">({s.role})</span></span>
                      {s.hasSigned ? (
                        <span className="text-emerald-600 text-[10px] font-bold flex items-center gap-1">
                          ✓ Assinado
                        </span>
                      ) : (
                        <span className="text-amber-600 text-[10px] font-bold">Pendente</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-500">
                  <button
                    onClick={() => onOpenViewModal(doc)}
                    className="p-1.5 hover:bg-slate-100 hover:text-indigo-600 rounded-lg transition-all cursor-pointer"
                    title="Visualizar Conteúdo"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadFile(doc)}
                    className="p-1.5 hover:bg-slate-100 hover:text-indigo-600 rounded-lg transition-all cursor-pointer"
                    title="Baixar Documento"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDoc(doc.id, doc.title)}
                    className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                    title="Excluir Documento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {doc.signatureStatus === 'Pendente de Assinatura' ? (
                  <button
                    onClick={() => onSelectDocForSigning(doc)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Assinar Digitalmente</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Validação ICP OK
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
          <span>Mostrando <strong>{((currentPage - 1) * pageSize) + 1}</strong> a <strong>{Math.min(currentPage * pageSize, totalItems)}</strong> de <strong>{totalItems}</strong> documentos</span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold">Página {currentPage} de {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
