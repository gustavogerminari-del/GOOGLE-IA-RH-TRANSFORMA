import React from 'react';
import { ShieldCheck, Clock, User, FileText, CheckCircle2 } from 'lucide-react';
import { PayrollAuditLog } from '../types/payroll';

interface PayrollAuditTabProps {
  logs: PayrollAuditLog[];
}

export const PayrollAuditTab: React.FC<PayrollAuditTabProps> = ({ logs }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Trilha de Auditoria & Segurança da Folha de Pagamento
          </h3>
          <p className="text-xs text-slate-500">
            Registro imutável de todas as ações de abertura, reprocessamento, fechamento, reabertura e assinaturas digitais.
          </p>
        </div>

        <span className="px-3 py-1 bg-indigo-50 text-indigo-800 rounded-full text-xs font-bold border border-indigo-200">
          {logs.length} Registros Gravados
        </span>
      </div>

      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Nenhum evento registrado na auditoria até o momento.
          </div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 hover:bg-slate-50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900">{log.action}</span>
                  <span className="px-2 py-0.2 bg-slate-200 text-slate-700 text-[10px] font-mono rounded font-bold">
                    Ref: {log.periodId}
                  </span>
                </div>
                <p className="text-slate-600 font-medium">{log.details}</p>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-500" />
                    {log.userName} ({log.userEmail})
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0 text-[10px] text-slate-500 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-500" />
                <span>{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
