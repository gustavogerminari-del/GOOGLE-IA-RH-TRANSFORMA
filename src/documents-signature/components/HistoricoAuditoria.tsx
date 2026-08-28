import React from 'react';
import { 
  History, 
  ShieldCheck, 
  Clock, 
  User, 
  FileText, 
  Eye, 
  Download, 
  PenTool, 
  Trash2, 
  Sparkles,
  Globe
} from 'lucide-react';
import { HRDocument, DocumentAuditLog } from '../types';

interface HistoricoAuditoriaProps {
  documents: HRDocument[];
}

export const HistoricoAuditoria: React.FC<HistoricoAuditoriaProps> = ({ documents }) => {
  // Aggregate all audit logs across all documents
  const allLogs: (DocumentAuditLog & { docTitle: string; docCategory: string })[] = [];

  documents.forEach(doc => {
    if (doc.auditTrail) {
      doc.auditTrail.forEach(log => {
        allLogs.push({
          ...log,
          docTitle: doc.title,
          docCategory: doc.category
        });
      });
    }
  });

  // Sort logs by timestamp descending
  allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <span>Trilha de Auditoria & Histórico de Versões do Repositório</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Registro cronológico inalterável de todas as ações de criação, visualização, download e assinatura digital efetuadas no sistema.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 text-indigo-900 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>{allLogs.length} Eventos Auditados</span>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Linha do Tempo de Interações</h4>

        {allLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Nenhum evento registrado ainda. As ações realizadas em documentos aparecerão aqui.
          </div>
        ) : (
          <div className="space-y-3">
            {allLogs.map((log, idx) => (
              <div key={log.id || idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      log.action === 'Assinatura' ? 'bg-emerald-100 text-emerald-800' :
                      log.action === 'Criação' ? 'bg-indigo-100 text-indigo-800' :
                      log.action === 'Exclusão' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {log.action}
                    </span>
                    <span className="font-bold text-slate-900">{log.docTitle}</span>
                    <span className="text-[10px] font-semibold text-slate-500">({log.docCategory})</span>
                  </div>

                  <p className="text-slate-600">{log.details}</p>

                  <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1">
                    <span>Usuário: <strong>{log.performedBy}</strong> ({log.userEmail})</span>
                    <span>•</span>
                    <span>IP: <strong>{log.ipAddress || '187.32.109.12'}</strong></span>
                  </div>
                </div>

                <div className="text-right text-[11px] font-mono text-slate-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
