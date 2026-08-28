import React, { useState } from 'react';
import { Lock, Unlock, AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface ReopenPeriodModalProps {
  periodName: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export const ReopenPeriodModal: React.FC<ReopenPeriodModalProps> = ({
  periodName,
  onConfirm,
  onClose
}) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5 text-amber-600">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center font-black">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Reabrir Folha Fechada</h3>
              <p className="text-[11px] text-slate-500">{periodName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
          <p className="font-extrabold flex items-center gap-1">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            Trava de Segurança Trabalhista Ativa
          </p>
          <p className="text-[11px] text-amber-800">
            A alteração de uma folha já encerrada pode afetar guias de INSS e FGTS já recolhidas. Esta ação requer permissão de Administrador/Master e será registrada no histórico de auditoria.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Justificativa Obrigatória para Reabertura *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Ex: Inclusão de horas extras retroativas solicitadas pela diretoria com autorização expressa..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 font-extrabold text-white cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Unlock className="w-4 h-4" />
              <span>Confirmar Reabertura Especial</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
