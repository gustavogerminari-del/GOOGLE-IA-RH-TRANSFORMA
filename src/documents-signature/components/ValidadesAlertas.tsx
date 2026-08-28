import React from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Send, 
  Bell, 
  Calendar, 
  User, 
  FileText, 
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { HRDocument } from '../types';

interface ValidadesAlertasProps {
  documents: HRDocument[];
  onOpenDocument: (doc: HRDocument) => void;
}

export const ValidadesAlertas: React.FC<ValidadesAlertasProps> = ({
  documents,
  onOpenDocument
}) => {
  const expiredDocs = documents.filter(d => d.validityStatus === 'Vencido');
  const expiringDocs = documents.filter(d => d.validityStatus === 'A Vencer');
  const validDocs = documents.filter(d => d.validityStatus === 'Válido');

  const handleSendRenewalReminder = (docTitle: string, personName: string) => {
    alert(`Lembrete de renovação enviado com sucesso para ${personName} referente a "${docTitle}".`);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-rose-50/80 border border-rose-200/80 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Documentos Vencidos</span>
            <div className="text-2xl font-black text-rose-950 mt-1">{expiredDocs.length}</div>
            <p className="text-[11px] text-rose-800 mt-1">Exigem renovação imediata (ASO, CNH, Contratos)</p>
          </div>
          <div className="p-3 bg-rose-200/80 text-rose-700 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-amber-50/80 border border-amber-200/80 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">A Vencer (Próximos 30 Dias)</span>
            <div className="text-2xl font-black text-amber-950 mt-1">{expiringDocs.length}</div>
            <p className="text-[11px] text-amber-800 mt-1">Requerem notificação dos colaboradores</p>
          </div>
          <div className="p-3 bg-amber-200/80 text-amber-700 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-emerald-50/80 border border-emerald-200/80 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Documentos Válidos</span>
            <div className="text-2xl font-black text-emerald-950 mt-1">{validDocs.length}</div>
            <p className="text-[11px] text-emerald-800 mt-1">Regulares e com prazos em dia</p>
          </div>
          <div className="p-3 bg-emerald-200/80 text-emerald-700 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Expired / Expiring Detailed Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <span>Fila de Acompanhamento de Validades e Vencimentos</span>
          </h3>

          <span className="text-xs text-slate-500 font-semibold">
            Total de {expiredDocs.length + expiringDocs.length} itens requerendo atenção
          </span>
        </div>

        {expiredDocs.length + expiringDocs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Nenhum documento vencido ou a vencer no momento. Todos os prazos estão em dia!
          </div>
        ) : (
          <div className="space-y-3">
            {[...expiredDocs, ...expiringDocs].map(docItem => (
              <div key={docItem.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:border-slate-300 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      docItem.validityStatus === 'Vencido' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {docItem.validityStatus}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{docItem.title}</span>
                  </div>

                  <p className="text-slate-600 flex items-center gap-2">
                    <span>Pessoa: <strong className="text-slate-800">{docItem.linkedEntityName}</strong></span>
                    <span>•</span>
                    <span>Categoria: <strong>{docItem.category}</strong></span>
                  </p>

                  <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1">
                    <span className="flex items-center gap-1 font-semibold text-rose-700">
                      <Calendar className="w-3.5 h-3.5" />
                      Vencimento: {docItem.expirationDate}
                    </span>
                    <span>Status Assinatura: {docItem.signatureStatus}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSendRenewalReminder(docItem.title, docItem.linkedEntityName)}
                    className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Notificar Colaborador</span>
                  </button>

                  <button
                    onClick={() => onOpenDocument(docItem)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <span>Ver Detalhes</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
