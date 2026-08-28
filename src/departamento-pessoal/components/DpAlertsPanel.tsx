import React, { useState } from 'react';
import { formatFirestoreDate } from '../../lib/firestoreUtils';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  XCircle, 
  User, 
  Clock, 
  ArrowRight, 
  MessageSquare, 
  Filter, 
  Check, 
  X 
} from 'lucide-react';
import { DPAlertItem, AlertCategory, AlertStatus } from '../types/dp';

interface DpAlertsPanelProps {
  alerts: DPAlertItem[];
  onUpdateAlertStatus: (alertId: string, status: AlertStatus, ignoreReason?: string) => void;
  onNavigateSubTab?: (subTab: string) => void;
}

export const DpAlertsPanel: React.FC<DpAlertsPanelProps> = ({
  alerts,
  onUpdateAlertStatus,
  onNavigateSubTab
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [statusFilter, setStatusFilter] = useState<string>('Pendente');
  const [selectedAlertForIgnore, setSelectedAlertForIgnore] = useState<DPAlertItem | null>(null);
  const [ignoreReasonInput, setIgnoreReasonInput] = useState('');

  const filteredAlerts = alerts.filter(a => {
    if (categoryFilter !== 'Todos' && a.category !== categoryFilter) return false;
    if (statusFilter !== 'Todos' && a.status !== statusFilter) return false;
    return true;
  });

  const criticalCount = alerts.filter(a => a.category === 'Critico' && a.status !== 'Resolvido' && a.status !== 'Ignorado').length;
  const highCount = alerts.filter(a => a.category === 'Alto' && a.status !== 'Resolvido' && a.status !== 'Ignorado').length;

  const handleConfirmIgnore = () => {
    if (!selectedAlertForIgnore) return;
    if (!ignoreReasonInput.trim()) {
      alert('Por favor, informe a justificativa para ignorar este alerta.');
      return;
    }
    onUpdateAlertStatus(selectedAlertForIgnore.id, 'Ignorado', ignoreReasonInput.trim());
    setSelectedAlertForIgnore(null);
    setIgnoreReasonInput('');
  };

  const getCategoryBadge = (cat: AlertCategory) => {
    switch (cat) {
      case 'Critico':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> CRÍTICO</span>;
      case 'Alto':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> ALTO</span>;
      case 'Medio':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1"><Info className="w-3 h-3" /> MÉDIO</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1"><Info className="w-3 h-3" /> INFORMATIVO</span>;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900">Central Unificada de Alertas & Pendências DP</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Monitoramento inteligente de inconsistências trabalhistas, prazos legais, documentação vencida e provisões.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-black shadow-2xs flex items-center gap-1.5 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{criticalCount} Críticos Ativos</span>
            </span>
          )}
          {highCount > 0 && (
            <span className="px-3 py-1 rounded-xl bg-amber-500 text-white text-xs font-black shadow-2xs flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{highCount} Altos</span>
            </span>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl font-bold text-slate-600">
          <button
            onClick={() => setStatusFilter('Pendente')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'Pendente' ? 'bg-white text-rose-600 shadow-2xs font-black' : 'hover:text-slate-900'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setStatusFilter('Em Andamento')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'Em Andamento' ? 'bg-white text-amber-600 shadow-2xs font-black' : 'hover:text-slate-900'
            }`}
          >
            Em Andamento
          </button>
          <button
            onClick={() => setStatusFilter('Resolvido')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'Resolvido' ? 'bg-white text-emerald-600 shadow-2xs font-black' : 'hover:text-slate-900'
            }`}
          >
            Resolvidos
          </button>
          <button
            onClick={() => setStatusFilter('Todos')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              statusFilter === 'Todos' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'hover:text-slate-900'
            }`}
          >
            Todos os Status
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-bold">Categoria:</span>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
          >
            <option value="Todos">Todas as Categorias</option>
            <option value="Critico">Crítico</option>
            <option value="Alto">Alto</option>
            <option value="Medio">Médio</option>
            <option value="Informativo">Informativo</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="font-bold text-slate-700">Nenhum alerta encontrado para o filtro selecionado.</p>
            <p className="text-slate-400 text-xs">Sua operação de Departamento Pessoal está em conformidade.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div 
              key={alert.id}
              className={`p-4 rounded-2xl border transition-all space-y-3 ${
                alert.status === 'Resolvido'
                  ? 'bg-emerald-50/30 border-emerald-200/80'
                  : alert.status === 'Ignorado'
                  ? 'bg-slate-50 border-slate-200 opacity-60'
                  : alert.category === 'Critico'
                  ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                  : alert.category === 'Alto'
                  ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                  : 'bg-white border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getCategoryBadge(alert.category)}
                  <h3 className="font-bold text-slate-900 text-sm">{alert.title}</h3>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold shrink-0">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatFirestoreDate(alert.createdAt)}
                  </span>
                  <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                    {alert.assignedTo || 'DP'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-medium">
                {alert.description}
              </p>

              {alert.ignoreReason && (
                <div className="p-2.5 bg-slate-100 rounded-xl text-xs text-slate-600 italic border border-slate-200">
                  <strong>Justificativa para ignorar:</strong> {alert.ignoreReason}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs font-bold">
                <div className="flex items-center gap-2">
                  {onNavigateSubTab && (
                    <button
                      onClick={() => onNavigateSubTab(alert.originModule)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span>Abrir Origem ({alert.originModule})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {alert.status === 'Pendente' && (
                    <button
                      onClick={() => onUpdateAlertStatus(alert.id, 'Em Andamento')}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl transition-all cursor-pointer"
                    >
                      Marcar em Andamento
                    </button>
                  )}

                  {alert.status !== 'Resolvido' && (
                    <button
                      onClick={() => onUpdateAlertStatus(alert.id, 'Resolvido')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Resolver Alerta</span>
                    </button>
                  )}

                  {alert.status !== 'Ignorado' && alert.status !== 'Resolvido' && (
                    <button
                      onClick={() => setSelectedAlertForIgnore(alert)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                    >
                      Ignorar Alerta
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ignore Justification Modal */}
      {selectedAlertForIgnore && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-base">Justificativa de Descarte</h3>
              <button 
                onClick={() => setSelectedAlertForIgnore(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Para fins de auditoria, informe o motivo pelo qual este alerta está sendo ignorado:
            </p>
            <textarea
              rows={3}
              placeholder="Ex: Posição regularizada externamente / Processo sob liminar..."
              value={ignoreReasonInput}
              onChange={e => setIgnoreReasonInput(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedAlertForIgnore(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmIgnore}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-2xs"
              >
                Confirmar Descarte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
