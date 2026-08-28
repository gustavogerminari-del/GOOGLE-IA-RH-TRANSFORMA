import React, { useState } from 'react';
import { 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  Lock, 
  UserX, 
  Gift, 
  FileCheck, 
  Briefcase 
} from 'lucide-react';
import { ProcessoRescisaoCompleto } from '../../types/terminationTypes';

interface ModalConcluirDesligamentoProps {
  isOpen: boolean;
  onClose: () => void;
  process: ProcessoRescisaoCompleto;
  onConfirm: () => Promise<void>;
}

export const ModalConcluirDesligamento: React.FC<ModalConcluirDesligamentoProps> = ({
  isOpen,
  onClose,
  process,
  onConfirm
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Check Readiness Conditions
  const hasPendingApprovals = process.approvals.some(a => a.decision === 'Pendente');
  const pendingChecklist = process.checklist.filter(c => c.required && c.status !== 'Concluído');
  const isAsoApto = process.medicalExam?.result === 'Apto';
  const unreturnedAssets = process.assets.filter(a => !a.returned);

  const canComplete = !hasPendingApprovals && pendingChecklist.length === 0;

  const handleExecute = async () => {
    if (!canComplete) return;
    try {
      setIsSubmitting(true);
      await onConfirm();
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="bg-rose-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <UserX className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Ação Definitiva: CONCLUIR DESLIGAMENTO</h3>
              <p className="text-xs text-rose-100">Encerramento formal do vínculo trabalhista e bloqueio de acessos</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Target Employee Info */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Colaborador</span>
              <span className="font-bold text-slate-900 text-sm block">{process.employeeName}</span>
              <span className="text-slate-500">{process.employeeRole} — {process.employeeDepartment}</span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Valor Líquido TRCT</span>
              <span className="font-mono font-black text-rose-700 text-sm block">
                {process.totalNet.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>

          {/* Readiness Checklist Verification */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 text-xs">Verificação de Requisitos Obrigatórios:</h4>

            <div className="space-y-1.5">
              <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                hasPendingApprovals ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <span className="font-semibold">1. Fluxo de Aprovação Multinível</span>
                <span className="font-bold">{hasPendingApprovals ? '❌ Pendente' : '✓ Totalmente Aprovado'}</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                pendingChecklist.length > 0 ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <span className="font-semibold">2. Checklist de Desligamento</span>
                <span className="font-bold">
                  {pendingChecklist.length > 0 ? `❌ ${pendingChecklist.length} pendentes` : '✓ 100% Concluído'}
                </span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                !isAsoApto ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <span className="font-semibold">3. Exame Médico Demissional (ASO)</span>
                <span className="font-bold">{isAsoApto ? '✓ Apto' : '⚠️ Pendente ASO Apto'}</span>
              </div>

              <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                unreturnedAssets.length > 0 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <span className="font-semibold">4. Devolução de Equipamentos</span>
                <span className="font-bold">
                  {unreturnedAssets.length > 0 ? `⚠️ ${unreturnedAssets.length} não devolvidos` : '✓ Todos Devolvidos'}
                </span>
              </div>
            </div>
          </div>

          {/* Automatic Actions Summary */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2">
            <h4 className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Ações Executadas Automaticamente ao Confirmar:</span>
            </h4>

            <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside font-medium">
              <li>Alteração do status do colaborador para <strong className="text-rose-400">RESISTIDO / DESLIGADO</strong></li>
              <li>Bloqueio imediato do acesso ao portal RH TRANSFORMA e marcação de ponto</li>
              <li>Encerramento automático de <strong>todos os benefícios ativos do colaborador</strong></li>
              <li>Encerramento formal do contrato de trabalho e vigência</li>
              <li>Gravação irrestrita no Histórico do Colaborador e Logs de Auditoria</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            Voltar
          </button>

          <button
            disabled={!canComplete || isSubmitting}
            onClick={handleExecute}
            className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Confirmar e Concluir Desligamento</span>
          </button>
        </div>
      </div>
    </div>
  );
};
