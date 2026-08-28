import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, ChevronRight, ShieldAlert } from 'lucide-react';
import { ProcessAlert } from '../types/dashboard';
import { Card, Button } from '../../shared';
import { formatDateBR } from '../../core';

export interface PendingAlertsCardProps {
  alerts: ProcessAlert[];
  onResolveAlert?: (alertId: string) => void;
  canManageAlerts?: boolean;
}

export const PendingAlertsCard: React.FC<PendingAlertsCardProps> = ({
  alerts,
  onResolveAlert,
  canManageAlerts = true,
}) => {
  const getSeverityBadge = (severity: ProcessAlert['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'WARNING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'INFO':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getSeverityLabel = (severity: ProcessAlert['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'SLA Crítico';
      case 'WARNING':
        return 'Pendente Validação';
      case 'INFO':
      default:
        return 'Informativo';
    }
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Alertas & Processos Pendentes</h3>
            <p className="text-xs text-slate-500">Ações prioritárias para evitar gargalos em R&S</p>
          </div>
        </div>

        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          {alerts.length} pendência(s)
        </span>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs font-bold text-slate-700">Nenhum processo pendente no momento!</p>
            <p className="text-[11px] text-slate-400">Todos os SLAs de vagas e aprovações estão em dia.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200 transition-all space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${getSeverityBadge(
                        alert.severity
                      )}`}
                    >
                      {getSeverityLabel(alert.severity)}
                    </span>
                    <span className="text-xs font-extrabold text-slate-800">{alert.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{alert.description}</p>
                </div>

                {alert.daysPending > 0 && (
                  <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                    <Clock className="w-3 h-3 text-amber-500" />
                    {alert.daysPending}d pendentes
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs gap-2">
                <span className="text-[11px] font-semibold text-slate-500">
                  Ação: <span className="text-slate-800 font-bold">{alert.actionRequired}</span>
                </span>

                {canManageAlerts && onResolveAlert && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onResolveAlert(alert.id)}
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  >
                    Resolver
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
