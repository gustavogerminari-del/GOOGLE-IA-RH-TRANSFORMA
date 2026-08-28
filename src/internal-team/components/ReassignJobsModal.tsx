/**
 * MÓDULO EQUIPE INTERNA - Modal de Transferência e Realocação de Processos e Vagas
 * RH TRANSFORMA - Sistema de Gestão de Pessoas
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowRightLeft, 
  Briefcase, 
  User, 
  CheckCircle2, 
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { InternalTeamMember } from '../types/team';

interface ReassignJobsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceMember: InternalTeamMember | null;
  allMembers: InternalTeamMember[];
  onConfirmReassign: (jobId: string, sourceMemberId: string, targetMemberId: string) => void;
}

export const ReassignJobsModal: React.FC<ReassignJobsModalProps> = ({
  isOpen,
  onClose,
  sourceMember,
  allMembers,
  onConfirmReassign,
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [targetMemberId, setTargetMemberId] = useState<string>('');
  const [reason, setReason] = useState<string>('Redistribuição de Carga de Trabalho');

  useEffect(() => {
    if (sourceMember && sourceMember.processControl.assignedProcesses.length > 0) {
      setSelectedJobId(sourceMember.processControl.assignedProcesses[0].id);
    } else {
      setSelectedJobId('');
    }

    // Sugere outro membro ativo diferente do origem
    const eligibleTargets = allMembers.filter(
      m => m.id !== sourceMember?.id && m.status === 'Ativo'
    );
    if (eligibleTargets.length > 0) {
      setTargetMemberId(eligibleTargets[0].id);
    } else {
      setTargetMemberId('');
    }
  }, [sourceMember, allMembers, isOpen]);

  if (!isOpen || !sourceMember) return null;

  const eligibleTargets = allMembers.filter(
    m => m.id !== sourceMember.id && m.status === 'Ativo'
  );

  const selectedProcess = sourceMember.processControl.assignedProcesses.find(p => p.id === selectedJobId);
  const selectedTarget = allMembers.find(m => m.id === targetMemberId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId || !targetMemberId) {
      alert('Por favor, selecione a vaga/processo e o profissional de destino.');
      return;
    }

    onConfirmReassign(selectedJobId, sourceMember.id, targetMemberId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30">
              <ArrowRightLeft className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Realocar Responsabilidade de Vaga</h2>
              <p className="text-xs text-slate-300">
                Transfira processos seletivos para redistribuir a carga de trabalho ou cobrir ausências
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Source Member Banner */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={sourceMember.avatar}
                alt={sourceMember.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Profissional de Origem</p>
                <h4 className="font-bold text-slate-900 text-sm">{sourceMember.name}</h4>
                <p className="text-xs text-slate-500">{sourceMember.jobTitle}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800">
              {sourceMember.processControl.activeJobsCount} vagas ativas
            </span>
          </div>

          {/* Step 1: Select Process / Job */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. Selecione a Vaga / Processo a Transferir
            </label>
            {sourceMember.processControl.assignedProcesses.length > 0 ? (
              <select
                value={selectedJobId}
                onChange={e => setSelectedJobId(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold bg-white focus:ring-2 focus:ring-indigo-500"
              >
                {sourceMember.processControl.assignedProcesses.map(proc => (
                  <option key={proc.id} value={proc.id}>
                    [{proc.code}] {proc.title} - {proc.departmentName} ({proc.slaDaysLeft}d SLA)
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 text-xs text-slate-500 bg-rose-50 border border-rose-200 rounded-xl">
                Este profissional não possui nenhuma vaga ativa para transferir.
              </div>
            )}
          </div>

          {/* Selected Process Detail Box */}
          {selectedProcess && (
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs space-y-1">
              <span className="font-bold text-indigo-900">Detalhes da Vaga Selecionada:</span>
              <p className="text-indigo-800">
                • {selectedProcess.title} | {selectedProcess.openings} vaga(s) | {selectedProcess.applicantsCount} candidatos inscritos
              </p>
            </div>
          )}

          {/* Step 2: Select Target Member */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              2. Selecione o Profissional de Destino
            </label>
            {eligibleTargets.length > 0 ? (
              <select
                value={targetMemberId}
                onChange={e => setTargetMemberId(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold bg-white focus:ring-2 focus:ring-indigo-500"
              >
                {eligibleTargets.map(target => (
                  <option key={target.id} value={target.id}>
                    {target.name} ({target.jobTitle}) - Carga Atual: {target.processControl.activeJobsCount}/{target.processControl.maxJobCapacity}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-xl">
                Nenhum outro profissional ativo disponível na equipe no momento.
              </div>
            )}
          </div>

          {/* Target Member Workload Check */}
          {selectedTarget && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
              <div>
                <p className="text-slate-500 font-medium">Novo limite do destino após transferência:</p>
                <p className="font-bold text-slate-800">
                  {selectedTarget.name}: {selectedTarget.processControl.activeJobsCount + 1} / {selectedTarget.processControl.maxJobCapacity} vagas
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                (selectedTarget.processControl.activeJobsCount + 1) > selectedTarget.processControl.maxJobCapacity
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {(selectedTarget.processControl.activeJobsCount + 1) > selectedTarget.processControl.maxJobCapacity ? 'Alerta: Acima da Capacidade' : 'Dentro da Capacidade'}
              </span>
            </div>
          )}

          {/* Reason Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Motivo da Reorganização
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
            >
              <option value="Redistribuição de Carga de Trabalho">Redistribuição de Carga de Trabalho</option>
              <option value="Saída em Período de Férias / Licença">Saída em Período de Férias / Licença</option>
              <option value="Especialização do Profissional no Perfil da Vaga">Especialização no Perfil da Vaga</option>
              <option value="Ajuste de Prioridade Corporativa">Ajuste de Prioridade Corporativa</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedJobId || !targetMemberId}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Realocação</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
