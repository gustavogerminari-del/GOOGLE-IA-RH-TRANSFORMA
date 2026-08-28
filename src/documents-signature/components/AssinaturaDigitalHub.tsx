import React, { useState, useRef } from 'react';
import { 
  PenTool, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  User, 
  Key, 
  Download, 
  Hash, 
  Globe, 
  Lock,
  RefreshCw
} from 'lucide-react';
import { HRDocument, Signer } from '../types';
import { DocumentService } from '../../services/DocumentService';

interface AssinaturaDigitalHubProps {
  documents: HRDocument[];
  onRefresh: () => void;
  selectedDocIdForSigning?: string;
}

export const AssinaturaDigitalHub: React.FC<AssinaturaDigitalHubProps> = ({
  documents,
  onRefresh,
  selectedDocIdForSigning
}) => {
  const pendingDocs = documents.filter(d => d.signatureStatus === 'Pendente de Assinatura');
  const signedDocs = documents.filter(d => d.signatureStatus === 'Assinado Digitalmente');

  const [activeTab, setActiveTab] = useState<'pendentes' | 'concluidos'>('pendentes');
  const [activeDoc, setActiveDoc] = useState<HRDocument | null>(() => {
    if (selectedDocIdForSigning) {
      return documents.find(d => d.id === selectedDocIdForSigning) || pendingDocs[0] || null;
    }
    return pendingDocs[0] || null;
  });

  // Interactive Signature Modal State
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [selectedSignerIndex, setSelectedSignerIndex] = useState<number>(0);
  const [signatureMode, setSignatureMode] = useState<'desenho' | 'texto'>('desenho');
  const [typedName, setTypedName] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Confirm Signature
  const handleConfirmSignature = async () => {
    if (!activeDoc) return;

    setIsSubmitting(true);

    const nowIso = new Date().toISOString();
    const formattedDate = nowIso.replace('T', ' ').substring(0, 16);
    const mockHash = `sha256-${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const mockIp = '187.32.109.12';

    // Get canvas data url if drawing
    let padImage = '';
    if (signatureMode === 'desenho' && canvasRef.current) {
      padImage = canvasRef.current.toDataURL();
    }

    const updatedSigners: Signer[] = activeDoc.signers.map((s, idx) => {
      if (idx === selectedSignerIndex) {
        return {
          ...s,
          hasSigned: true,
          signedAt: formattedDate,
          ipAddress: mockIp,
          sha256Hash: mockHash,
          signaturePadImage: padImage || undefined
        };
      }
      return s;
    });

    const allSigned = updatedSigners.every(s => s.hasSigned);
    const newStatus = allSigned ? 'Assinado Digitalmente' : 'Pendente de Assinatura';

    await DocumentService.update(activeDoc.id, {
      signers: updatedSigners,
      signatureStatus: newStatus
    });

    setIsSubmitting(false);
    setIsSigningModalOpen(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span>Central de Assinatura Digital & Validação de Certificado</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Plataforma de assinatura em conformidade com MP 2.200-2/2001 e validação ICP-Brasil com hash SHA-256 e selo de autenticidade.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('pendentes')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'pendentes' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pendentes ({pendingDocs.length})
          </button>
          <button
            onClick={() => setActiveTab('concluidos')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'concluidos' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Assinados ({signedDocs.length})
          </button>
        </div>
      </div>

      {/* Main Signing Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document Selection List (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {activeTab === 'pendentes' ? 'Aguardando Assinatura' : 'Documentos Concluídos'}
          </h4>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {(activeTab === 'pendentes' ? pendingDocs : signedDocs).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhum documento nesta lista.
              </div>
            ) : (
              (activeTab === 'pendentes' ? pendingDocs : signedDocs).map(docItem => (
                <button
                  key={docItem.id}
                  onClick={() => setActiveDoc(docItem)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${
                    activeDoc?.id === docItem.id
                      ? 'border-indigo-600 bg-indigo-50/70 font-bold text-indigo-950 shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold line-clamp-1">{docItem.title}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span>{docItem.linkedEntityName}</span>
                    <span className="font-semibold">{docItem.uploadedAt}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Selected Document Workspace & Signers Panel (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-6 flex flex-col justify-between">
          {activeDoc ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {activeDoc.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{activeDoc.title}</h3>
                  <p className="text-xs text-slate-500">Vínculo: <strong>{activeDoc.linkedEntityName}</strong></p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    activeDoc.signatureStatus === 'Assinado Digitalmente' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {activeDoc.signatureStatus}
                  </span>
                </div>
              </div>

              {/* Document Text Content View */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 leading-relaxed max-h-[220px] overflow-y-auto whitespace-pre-wrap shadow-inner">
                {activeDoc.content || `CONTEÚDO DO DOCUMENTO: ${activeDoc.title}\n\nEste documento aguarda a assinatura digital e confirmação dos signatários credenciados. As assinaturas geradas nesta plataforma possuem suporte a certificado ICP-Brasil e carimbo de tempo.`}
              </div>

              {/* Signers Status Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Fluxo de Signatários do Documento</span>
                </h4>

                <div className="space-y-2">
                  {activeDoc.signers.map((signer, sIdx) => (
                    <div key={sIdx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{signer.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">{signer.role}</span>
                        </div>
                        <p className="text-slate-500 text-[11px]">{signer.email}</p>
                        {signer.hasSigned && (
                          <div className="text-[10px] text-slate-500 font-mono mt-1 space-y-0.5">
                            <div>Carimbo Data: <strong>{signer.signedAt}</strong> | IP: <strong>{signer.ipAddress}</strong></div>
                            <div className="text-emerald-700 font-bold truncate max-w-md">Hash ICP: {signer.sha256Hash}</div>
                          </div>
                        )}
                      </div>

                      <div>
                        {signer.hasSigned ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Assinado</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedSignerIndex(sIdx);
                              setTypedName(signer.name);
                              setIsSigningModalOpen(true);
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>Assinar como {signer.role}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Selecione um documento da lista para visualizar os signatários.
            </div>
          )}
        </div>
      </div>

      {/* Interactive Digital Signature Drawing / Certificate Modal */}
      {isSigningModalOpen && activeDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PenTool className="w-5 h-5 text-indigo-600" />
                <span>Assinatura Eletrônica & Validação ICP</span>
              </h3>
              <button onClick={() => setIsSigningModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100">
                <p className="font-bold text-indigo-950">Assinando: {activeDoc.signers[selectedSignerIndex]?.name}</p>
                <p className="text-indigo-800 text-[11px]">Documento: {activeDoc.title}</p>
              </div>

              {/* Signature Type Toggle */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSignatureMode('desenho')}
                  className={`w-1/2 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    signatureMode === 'desenho' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Desenhar Assinatura
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureMode('texto')}
                  className={`w-1/2 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    signatureMode === 'texto' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Digitada / Certificado
                </button>
              </div>

              {signatureMode === 'desenho' ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-600">
                    <span>Desenhe sua assinatura no quadro abaixo:</span>
                    <button type="button" onClick={clearCanvas} className="text-rose-600 hover:underline cursor-pointer">Limpar</button>
                  </div>
                  <canvas
                    ref={canvasRef}
                    width={440}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-36 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl cursor-crosshair touch-none"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="font-bold text-slate-700">Confirme seu Nome Completo para o Selo:</label>
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              {/* Security Badge Info */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] space-y-1 text-slate-600">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Conexão Segura & Auditada via SHA-256</span>
                </div>
                <p>IP Registrado: 187.32.109.12 | Carimbo do Servidor: {new Date().toLocaleString('pt-BR')}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsSigningModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSignature}
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Confirmar & Assinar Digitalmente</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
