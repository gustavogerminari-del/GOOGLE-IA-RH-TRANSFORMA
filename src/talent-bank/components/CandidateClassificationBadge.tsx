import React from 'react';
import { CandidateClassification, CandidateStatus } from '../types/candidate';

export interface CandidateClassificationBadgeProps {
  classification: CandidateClassification;
  size?: 'sm' | 'md';
}

export const CandidateClassificationBadge: React.FC<CandidateClassificationBadgeProps> = ({
  classification,
  size = 'sm',
}) => {
  const stylesMap: Record<CandidateClassification, string> = {
    'Recomendado': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Alto Potencial': 'bg-indigo-50 text-indigo-800 border-indigo-200',
    'Alto potencial': 'bg-indigo-50 text-indigo-800 border-indigo-200',
    'Pendente': 'bg-amber-50 text-amber-800 border-amber-200',
    'Arquivado': 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 rounded-md font-extrabold',
    md: 'text-xs px-2.5 py-1 rounded-lg font-extrabold',
  };

  return (
    <span
      className={`border ${stylesMap[classification] || 'bg-slate-100 text-slate-700 border-slate-200'} ${
        sizeStyles[size]
      } inline-flex items-center gap-1 shrink-0`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {classification}
    </span>
  );
};

export interface CandidateStatusBadgeProps {
  status: CandidateStatus;
}

export const CandidateStatusBadge: React.FC<CandidateStatusBadgeProps> = ({ status }) => {
  const stylesMap: Record<CandidateStatus, string> = {
    'Ativo': 'bg-blue-50 text-blue-700 border-blue-200',
    'Em Processo': 'bg-amber-50 text-amber-700 border-amber-200',
    'Contratado': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Banco de Reserva': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Desqualificado': 'bg-rose-50 text-rose-700 border-rose-200',
    'Indisponível': 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${stylesMap[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
      {status}
    </span>
  );
};
