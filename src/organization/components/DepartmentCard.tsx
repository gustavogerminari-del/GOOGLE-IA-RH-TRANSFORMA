import React from 'react';
import {
  Users,
  DollarSign,
  Briefcase,
  Layers,
  UserCheck,
  Edit3,
  Trash2,
  Mail,
  PieChart,
} from 'lucide-react';
import { Department } from '../types/department';
import { Card, Button } from '../../shared';

export interface DepartmentCardProps {
  department: Department;
  onEditDepartment?: (department: Department) => void;
  onDeleteDepartment?: (departmentId: string) => void;
  canManageStructure?: boolean;
}

export const DepartmentCard: React.FC<DepartmentCardProps> = ({
  department,
  onEditDepartment,
  onDeleteDepartment,
  canManageStructure = true,
}) => {
  const budgetRatio = department.monthlyBudgetLimit > 0
    ? (department.monthlyBudgetSpent / department.monthlyBudgetLimit) * 100
    : 0;

  const budgetRatioFormatted = Math.min(Math.round(budgetRatio), 100);

  return (
    <Card className="p-5 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all group">
      <div className="space-y-4">
        {/* Header: Dept Name, Code & Open Jobs Badge */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md font-mono border border-indigo-200">
                {department.code}
              </span>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {department.name}
              </h3>
            </div>
            {department.costCenter && (
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Centro de Custo: {department.costCenter}
              </p>
            )}
          </div>

          <span className="bg-indigo-50 text-indigo-700 text-[11px] font-extrabold px-2.5 py-1 rounded-full border border-indigo-200 shrink-0">
            {department.openJobsCount} Vagas Abertas
          </span>
        </div>

        {/* Manager / Leader Section */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center gap-3">
          {department.manager.avatar ? (
            <img
              src={department.manager.avatar}
              alt={department.manager.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-300 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs border border-slate-300 shrink-0">
              {department.manager.name ? department.manager.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'LD'}
            </div>
          )}
          <div className="min-w-0 flex-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Líder do Departamento</span>
            <h4 className="font-extrabold text-slate-900 truncate">{department.manager.name}</h4>
            <p className="text-indigo-700 font-semibold truncate text-[11px]">{department.manager.role}</p>
          </div>
        </div>

        {/* Metrics Grid: Headcount & Budget */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase">
              <span>Colaboradores</span>
              <Users className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <p className="text-base font-black text-slate-900">
              {department.employeeCount} <span className="text-xs font-semibold text-slate-500">ativos</span>
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase">
              <span>Orçamento Mensal</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-sm font-black text-slate-900 truncate">
              R$ {(department.monthlyBudgetLimit / 1000).toFixed(0)}k <span className="text-[10px] text-slate-400 font-normal">/mês</span>
            </p>
          </div>
        </div>

        {/* Budget Execution Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span>Execução Orçamentária</span>
            <span>
              R$ {department.monthlyBudgetSpent.toLocaleString('pt-BR')} ({budgetRatioFormatted}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                budgetRatio > 90
                  ? 'bg-rose-500'
                  : budgetRatio > 75
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${budgetRatioFormatted}%` }}
            />
          </div>
        </div>

        {/* Sectors List */}
        {department.sectors && department.sectors.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-600" /> Setores Internos ({department.sectors.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {department.sectors.map((sec) => (
                <span
                  key={sec.id}
                  className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200"
                >
                  {sec.name} ({sec.activeEmployeeCount})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {canManageStructure && onEditDepartment && (
            <button
              type="button"
              onClick={() => onEditDepartment(department)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Editar Departamento & Setores"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          {canManageStructure && onDeleteDepartment && (
            <button
              type="button"
              onClick={() => onDeleteDepartment(department.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Excluir Departamento"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {canManageStructure && onEditDepartment && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditDepartment(department)}
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
          >
            Gerenciar Depto
          </Button>
        )}
      </div>
    </Card>
  );
};
