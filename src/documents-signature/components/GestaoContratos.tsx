import React, { useState } from 'react';
import { 
  FileText, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  PlusCircle, 
  RotateCw, 
  FileCheck, 
  User, 
  Building, 
  DollarSign, 
  Calendar, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { HRDocument, ContractType, ContractStatus } from '../types';
import { DocumentService } from '../../services/DocumentService';
import { ColaboradorCompleto } from '../../departamento-pessoal/types/dp';

interface GestaoContratosProps {
  documents: HRDocument[];
  colaboradores: ColaboradorCompleto[];
  onRefresh: () => void;
  onOpenCreateContractModal: () => void;
}

export const GestaoContratos: React.FC<GestaoContratosProps> = ({
  documents,
  colaboradores,
  onRefresh,
  onOpenCreateContractModal
}) => {
  const [selectedType, setSelectedType] = useState<string>('Todos');
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedDocForRenew, setSelectedDocForRenew] = useState<HRDocument | null>(null);
  const [newEndDate, setNewEndDate] = useState('');
  const [addendumReason, setAddendumReason] = useState('Renovação de Contrato por Tempo Determinado');

  // Filter contract documents
  const contractDocs = documents.filter(d => 
    d.category === 'Contrato de Trabalho' || d.category === 'Aditivo Contratual' || d.contractDetails !== undefined
  );

  const filteredContracts = contractDocs.filter(c => {
    if (selectedType === 'Todos') return true;
    return c.contractDetails?.contractType === selectedType;
  });

  // Renew / Addendum Submission
  const handleConfirmRenewal = async () => {
    if (!selectedDocForRenew) return;

    const currentDetails = selectedDocForRenew.contractDetails || {
      contractType: 'CLT',
      status: 'Ativo',
      renewalCount: 0
    };

    const newRenewalCount = (currentDetails.renewalCount || 0) + 1;
    const nowIso = new Date().toISOString();

    // 1. Update original contract status
    await DocumentService.update(selectedDocForRenew.id, {
      contractDetails: {
        ...currentDetails,
        endDate: newEndDate || selectedDocForRenew.expirationDate,
        status: 'Renovado',
        renewalCount: newRenewalCount
      },
      expirationDate: newEndDate || selectedDocForRenew.expirationDate,
      validityStatus: 'Válido'
    });

    // 2. Create an Addendum document (Aditivo Contratual)
    await DocumentService.create({
      companyId: selectedDocForRenew.companyId,
      colaboradorId: selectedDocForRenew.colaboradorId,
      title: `Aditivo Contratual nº ${newRenewalCount} - ${selectedDocForRenew.linkedEntityName}`,
      fileName: `aditivo_contratual_v${newRenewalCount}.pdf`,
      fileSize: '650 KB',
      category: 'Aditivo Contratual',
      linkedEntityName: selectedDocForRenew.linkedEntityName,
      linkedType: 'Colaborador',
      uploadedAt: new Date().toISOString().split('T')[0],
      expirationDate: newEndDate,
      validityStatus: 'Válido',
      signatureStatus: 'Pendente de Assinatura',
      signers: selectedDocForRenew.signers.map(s => ({ ...s, hasSigned: false, signedAt: undefined })),
      content: `TERMO ADITIVO AO CONTRATO DE TRABALHO nº ${newRenewalCount}\n\nCOLABORADOR: ${selectedDocForRenew.linkedEntityName}\nEMPRESA: RH TRANSFORMA Tecnologias Ltda\n\nMOTIVO / CLAUSULA: ${addendumReason}\nNOVA DATA DE VENCIMENTO: ${newEndDate || 'Indeterminado'}\n\nAssinado digitalmente por ambas as partes.`,
      contractDetails: {
        contractType: 'Aditivo',
        status: 'Ativo',
        startDate: new Date().toISOString().split('T')[0],
        endDate: newEndDate
      }
    });

    setIsRenewModalOpen(false);
    setSelectedDocForRenew(null);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <span>Gestão de Contratos de Trabalho & Aditivos</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhamento do ciclo de vida contratual (CLT, PJ, Estágio, Trainee e Temporário) com renovações automáticas e aditivos.
          </p>
        </div>

        <button
          onClick={onOpenCreateContractModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Novo Contrato de Trabalho</span>
        </button>
      </div>

      {/* Contract Type Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Modalidade:</span>
        {['Todos', 'CLT', 'PJ', 'Estágio', 'Trainee', 'Temporário', 'Aditivo'].map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
              selectedType === type
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Contracts List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContracts.map(contract => {
          const details = contract.contractDetails || {
            contractType: 'CLT' as ContractType,
            salaryBase: 5000,
            status: 'Ativo' as ContractStatus,
            renewalCount: 0
          };

          return (
            <div key={contract.id} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-4 flex flex-col justify-between hover:border-indigo-300 transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-slate-900 text-white">
                    {details.contractType}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    details.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    details.status === 'Renovado' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {details.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{contract.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 font-semibold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{contract.linkedEntityName}</span>
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 text-xs">
                  {details.salaryBase && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Salário Base:</span>
                      <strong className="text-slate-900">R$ {details.salaryBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Início do Contrato:</span>
                    <span>{details.startDate || contract.uploadedAt}</span>
                  </div>
                  {contract.expirationDate ? (
                    <div className="flex items-center justify-between text-amber-700 font-semibold pt-1 border-t border-slate-200/60">
                      <span>Vencimento / Término:</span>
                      <span>{contract.expirationDate}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>Prazo:</span>
                      <span className="font-semibold text-emerald-700">Indeterminado</span>
                    </div>
                  )}
                  {details.renewalCount !== undefined && details.renewalCount > 0 && (
                    <div className="flex items-center justify-between text-indigo-600 font-semibold text-[11px]">
                      <span>Aditivos/Renovações:</span>
                      <span>{details.renewalCount} aditivo(s)</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Status Assinatura:</span>
                  <span className={`font-bold ${contract.signatureStatus === 'Assinado Digitalmente' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {contract.signatureStatus}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedDocForRenew(contract);
                    setNewEndDate(contract.expirationDate || '');
                    setIsRenewModalOpen(true);
                  }}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Renovar / Gerar Aditivo</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Renew / Addendum Modal */}
      {isRenewModalOpen && selectedDocForRenew && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <RotateCw className="w-5 h-5 text-indigo-600" />
                <span>Renovação e Gerador de Aditivo Contratual</span>
              </h3>
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
                <p className="font-bold text-indigo-950">Contrato Alvo: {selectedDocForRenew.title}</p>
                <p className="text-indigo-800 mt-0.5">Colaborador: {selectedDocForRenew.linkedEntityName}</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Motivo / Descrição do Aditivo:</label>
                <input
                  type="text"
                  value={addendumReason}
                  onChange={(e) => setAddendumReason(e.target.value)}
                  placeholder="Ex: Prorrogação de Prazo por mais 90 dias, Ajuste Salarial..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Nova Data de Vencimento:</label>
                <input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRenewal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Confirmar Renovação & Criar Aditivo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
