import React from 'react';
import { Filter, ArrowRight } from 'lucide-react';
import { FunnelStepSummary } from '../types/dashboard';
import { Card } from '../../shared';

export interface FunnelOverviewCardProps {
  steps: FunnelStepSummary[];
}

export const FunnelOverviewCard: React.FC<FunnelOverviewCardProps> = ({ steps }) => {
  const maxCount = Math.max(...steps.map((s) => s.candidateCount ?? (s as any).candidatesCount ?? 0), 1);

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Funil Consolidado de Atração</h3>
            <p className="text-xs text-slate-500">Fluxo geral de candidatos nas etapas seletivas</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const count = step.candidateCount ?? (step as any).candidatesCount ?? 0;
          const percentage = Math.round((count / maxCount) * 100);
          const itemKey = step.stageId || step.stageName || `step-${index}`;

          return (
            <div key={itemKey} className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-semibold">{index + 1}.</span>
                  {step.stageName}
                </span>
                <span className="text-slate-900">{count} candidatos</span>
              </div>

              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${step.colorClass || 'bg-blue-600'}`}
                  style={{ width: `${Math.max(percentage, 6)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
