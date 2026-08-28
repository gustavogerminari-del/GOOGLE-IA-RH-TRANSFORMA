import React from 'react';
import { JobStatus } from '../types/job';

export interface JobStatusBadgeProps {
  status: JobStatus | string;
  size?: 'sm' | 'md';
}

export const JobStatusBadge: React.FC<JobStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const stylesMap: Record<string, string> = {
    'Aberta': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'ativa': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Em andamento': 'bg-blue-50 text-blue-800 border-blue-200',
    'Pausada': 'bg-amber-50 text-amber-800 border-amber-200',
    'Fechada': 'bg-slate-100 text-slate-700 border-slate-200',
    'Concluída': 'bg-purple-50 text-purple-800 border-purple-200',
    'Cancelada': 'bg-rose-50 text-rose-800 border-rose-200',
    'Arquivada': 'bg-rose-50 text-rose-800 border-rose-200',
    'Rascunho': 'bg-indigo-50 text-indigo-800 border-indigo-200',
  };

  const defaultStyle = 'bg-slate-100 text-slate-800 border-slate-200';
  const badgeStyle = stylesMap[status] || defaultStyle;

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 rounded-md font-extrabold',
    md: 'text-xs px-2.5 py-1 rounded-lg font-extrabold',
  };

  return (
    <span className={`border ${badgeStyle} ${sizeStyles[size]} inline-flex items-center gap-1 shrink-0`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {status}
    </span>
  );
};
