import React from 'react';
import { UserCheck, Award, Briefcase } from 'lucide-react';
import { ResponsibleSummary } from '../types/dashboard';
import { Card } from '../../shared';

export interface ResponsibleBreakdownCardProps {
  responsibles: ResponsibleSummary[];
}

export const ResponsibleBreakdownCard: React.FC<ResponsibleBreakdownCardProps> = ({
  responsibles,
}) => {
  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Desempenho por Responsável</h3>
            <p className="text-xs text-slate-500">Carga de trabalho e contratações do mês</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {responsibles.map((resp) => (
          <div
            key={resp.id}
            className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3 hover:bg-slate-100/70 transition-all"
          >
            <img
              src={resp.avatar}
              alt={resp.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
            />

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <h4 className="text-xs font-extrabold text-slate-900 truncate">{resp.name}</h4>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                  +{resp.completedHiresThisMonth} adms
                </span>
              </div>

              <p className="text-[11px] text-slate-500 truncate">{resp.role}</p>

              <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 pt-0.5">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-indigo-500" />
                  {resp.activeJobsCount} vagas
                </span>
                <span>•</span>
                <span>{resp.activeCandidatesCount} cands</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
