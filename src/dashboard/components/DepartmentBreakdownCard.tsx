import React from 'react';
import { Building2 } from 'lucide-react';
import { DepartmentSummary } from '../types/dashboard';
import { Card, Table, Column } from '../../shared';

export interface DepartmentBreakdownCardProps {
  departments: DepartmentSummary[];
}

export const DepartmentBreakdownCard: React.FC<DepartmentBreakdownCardProps> = ({ departments }) => {
  const getBudgetBadge = (status: DepartmentSummary['budgetStatus']) => {
    switch (status) {
      case 'Atenção':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Excedido':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Dentro do Limite':
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const columns: Column<DepartmentSummary>[] = [
    {
      key: 'name',
      header: 'Departamento',
      render: (item) => (
        <span className="font-extrabold text-slate-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-600" />
          {item.name}
        </span>
      ),
    },
    {
      key: 'openJobs',
      header: 'Vagas Abertas',
      className: 'text-center',
      render: (item) => (
        <span className="font-extrabold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
          {item.openJobs}
        </span>
      ),
    },
    {
      key: 'activeCandidates',
      header: 'Candidatos',
      className: 'text-center',
      render: (item) => <span className="font-bold text-slate-700">{item.activeCandidates}</span>,
    },
    {
      key: 'managerName',
      header: 'Gestor Responsável',
      render: (item) => <span className="text-slate-600 font-medium">{item.managerName}</span>,
    },
    {
      key: 'budgetStatus',
      header: 'Orçamento',
      className: 'text-center',
      render: (item) => (
        <span
          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${getBudgetBadge(
            item.budgetStatus
          )}`}
        >
          {item.budgetStatus}
        </span>
      ),
    },
  ];

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Visão por Departamento</h3>
            <p className="text-xs text-slate-500">Distribuição de vagas e status orçamentário</p>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={departments}
        keyExtractor={(item) => item.id}
      />
    </Card>
  );
};
