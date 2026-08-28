import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  Calendar, 
  UserCheck, 
  FileText, 
  Info,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ColaboradorCompleto } from '../../types/dp';
import { 
  TipoDesligamento, 
  TipoAvisoPrevio, 
  OpcaoReducaoJornada,
  ProcessoRescisaoCompleto 
} from '../../types/terminationTypes';

interface NovaSolicitacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  colaboradores: ColaboradorCompleto[];
  existingProcesses: ProcessoRescisaoCompleto[];
  onSubmit: (data: {
    employeeId: string;
    terminationType: TipoDesligamento;
    plannedTerminationDate: string;
    lastWorkingDay: string;
    reason: string;
    notes?: string;
    notice: {
      noticeType: TipoAvisoPrevio;
      reductionOption: OpcaoReducaoJornada;
    };
  }) => Promise<void>;
}

const TIPOS_DESLIGAMENTO: TipoDesligamento[] = [
  'Dispensa sem justa causa',
  'Pedido de demissão',
  'Dispensa por justa causa',
  'Rescisão por acordo (Art. 484-A CLT)',
  'Término de contrato por prazo determinado',
  'Término de contrato de experiência',
  'Rescisão antecipada pelo empregador',
  'Rescisão antecipada pelo empregado',
  'Rescisão indireta',
  'Aposentadoria',
  'Falecimento',
  'Abandono de emprego',
  'Transferência entre empresas do grupo',
  'Desligamento personalizado'
];

export const NovaSolicitacaoModal: React.FC<NovaSolicitacaoModalProps> = ({
  isOpen,
  onClose,
  colaboradores,
  existingProcesses,
  onSubmit
}) => {
  const [selectedColabId, setSelectedColabId] = useState(colaboradores[0]?.id || '');
  const [terminationType, setTerminationType] = useState<TipoDesligamento>('Dispensa sem justa causa');
  const [plannedTerminationDate, setPlannedTerminationDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [lastWorkingDay, setLastWorkingDay] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [noticeType, setNoticeType] = useState<TipoAvisoPrevio>('Indenizado');
  const [reductionOption, setReductionOption] = useState<OpcaoReducaoJornada>('2 horas diárias');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const colabSelected = colaboradores.find(c => c.id === selectedColabId);

  // Validations
  const colabStatus = colabSelected?.profissionais?.status || 'Ativo';
  const isAlreadyRescinded = colabStatus === 'Rescindido';
  const hasActiveProcess = existingProcesses.some(
    p => p.employeeId === selectedColabId && p.status !== 'Concluída' && p.status !== 'Cancelada'
  );
  const isOnLeave = colabStatus === 'Afastado' || colabStatus === 'Férias';

  // Warnings
  let warningMessage = '';
  if (isAlreadyRescinded) {
    warningMessage = 'Este colaborador já se encontra no status RESCINDIDO/DESLIGADO.';
  } else if (hasActiveProcess) {
    warningMessage = 'Este colaborador já possui um processo de desligamento em andamento.';
  } else if (isOnLeave) {
    warningMessage = `Atenção: O colaborador encontra-se com status "${colabStatus}". Verifique estabilidade provisória ou afastamento em vigor.`;
  }

  const handleConfirm = async () => {
    if (isAlreadyRescinded || hasActiveProcess) return;
    if (!reason.trim()) {
      setFormError('Por favor, descreva o motivo do desligamento.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      await onSubmit({
        employeeId: selectedColabId,
        terminationType,
        plannedTerminationDate,
        lastWorkingDay,
        reason,
        notes,
        notice: {
          noticeType,
          reductionOption
        }
      });
    } catch (err: any) {
      setFormError(err?.message || 'Não foi possível iniciar a solicitação de desligamento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Nova Solicitação de Desligamento</h3>
              <p className="text-xs text-slate-400">Inicie o fluxo rescisório completo do colaborador</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {formError && (
            <div className="p-3.5 rounded-xl border bg-rose-50 border-rose-200 text-rose-900 text-xs flex items-start gap-2" role="alert">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}
          {/* Warning Banner */}
          {warningMessage && (
            <div className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
              isAlreadyRescinded || hasActiveProcess
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Alerta de Elegibilidade:</span>
                <span>{warningMessage}</span>
              </div>
            </div>
          )}

          {/* Colaborador Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Colaborador *
            </label>
            <select
              value={selectedColabId}
              onChange={e => setSelectedColabId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              {colaboradores.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nomeCompleto} — {c.profissionais?.cargo || 'Cargo N/A'} ({c.profissionais?.departamento || 'Depto N/A'})
                </option>
              ))}
            </select>

            {colabSelected && (
              <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Admissão:</span>
                  <span className="font-semibold text-slate-700">{colabSelected.profissionais?.dataAdmissao || '01/01/2023'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Salário Base:</span>
                  <span className="font-semibold text-slate-700 font-mono">
                    {(colabSelected.profissionais?.salarioBase || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Status Cadastral:</span>
                  <span className="font-bold text-emerald-700">{colabSelected.profissionais?.status || 'Ativo'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tipo de Desligamento */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tipo de Desligamento *
            </label>
            <select
              value={terminationType}
              onChange={e => setTerminationType(e.target.value as TipoDesligamento)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              {TIPOS_DESLIGAMENTO.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data Prevista do Desligamento *
              </label>
              <input
                type="date"
                value={plannedTerminationDate}
                onChange={e => {
                  setPlannedTerminationDate(e.target.value);
                  setLastWorkingDay(e.target.value);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Último Dia Trabalhado *
              </label>
              <input
                type="date"
                value={lastWorkingDay}
                onChange={e => setLastWorkingDay(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          </div>

          {/* Aviso Prévio Configuration */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-rose-600" />
              <span>Configuração do Aviso-Prévio</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Tipo de Aviso:</label>
                <select
                  value={noticeType}
                  onChange={e => setNoticeType(e.target.value as TipoAvisoPrevio)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800"
                >
                  <option value="Indenizado">Indenizado pelo Empregador</option>
                  <option value="Trabalhado">Trabalhado</option>
                  <option value="Dispensado">Dispensado / Não Exigido</option>
                  <option value="Cumprido parcialmente">Cumprido Parcialmente</option>
                  <option value="Não aplicável">Não Aplicável</option>
                </select>
              </div>

              {noticeType === 'Trabalhado' && (
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Opção de Redução de Jornada:</label>
                  <select
                    value={reductionOption}
                    onChange={e => setReductionOption(e.target.value as OpcaoReducaoJornada)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    <option value="2 horas diárias">Redução de 2 Horas Diárias</option>
                    <option value="7 dias corridos">Ausência por 7 Dias Corridos</option>
                    <option value="Sem redução">Sem Redução</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Reason & Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Motivo e Justificativa do Desligamento *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Descreva o motivo principal do desligamento, acordos realizados ou observações do gestor..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Observações Adicionais (Internas DP)
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Posição substituída por contratação em andamento..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            disabled={isAlreadyRescinded || hasActiveProcess || isSubmitting}
            onClick={handleConfirm}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Iniciar Solicitação</span>
          </button>
        </div>
      </div>
    </div>
  );
};
