import React from 'react';
import { InterviewStatus, InterviewType } from '../types/interview';
import { Video, MapPin, Phone, Clock } from 'lucide-react';
import { normalizeInterviewStatus } from '../utils/interviewUtils';

export interface InterviewStatusBadgeProps {
  status: InterviewStatus | string;
  size?: 'sm' | 'md';
}

export const InterviewStatusBadge: React.FC<InterviewStatusBadgeProps> = ({
  status,
  size = 'sm',
}) => {
  const normStatus = normalizeInterviewStatus(status);

  const stylesMap: Record<InterviewStatus, string> = {
    'Agendada': 'bg-amber-50 text-amber-800 border-amber-200',
    'Aguardando início': 'bg-amber-50 text-amber-800 border-amber-200',
    'Em andamento': 'bg-blue-50 text-blue-800 border-blue-200',
    'Realizada': 'bg-blue-50 text-blue-800 border-blue-200',
    'Aguardando gravação': 'bg-violet-50 text-violet-800 border-violet-200',
    'Aguardando transcrição': 'bg-violet-50 text-violet-800 border-violet-200',
    'Processando IA': 'bg-indigo-50 text-indigo-800 border-indigo-200',
    'Diagnóstico disponível': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Aprovada': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Reprovada': 'bg-rose-50 text-rose-800 border-rose-200',
    'Em Análise': 'bg-indigo-50 text-indigo-800 border-indigo-200',
    'Cancelada': 'bg-slate-100 text-slate-700 border-slate-200',
    'Reagendada': 'bg-amber-50 text-amber-800 border-amber-200',
    'Concluída': 'bg-blue-50 text-blue-800 border-blue-200',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 rounded-full font-extrabold',
    md: 'text-xs px-2.5 py-1 rounded-full font-extrabold',
  };

  return (
    <span
      className={`border ${stylesMap[normStatus] || 'bg-slate-100 text-slate-700 border-slate-200'} ${
        sizeStyles[size]
      } inline-flex items-center gap-1 shrink-0`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {normStatus}
    </span>
  );
};

export interface InterviewTypeBadgeProps {
  type: InterviewType;
}

export const InterviewTypeBadge: React.FC<InterviewTypeBadgeProps> = ({ type }) => {
  const safeType = String(type || 'Entrevista RH');
  const getIcon = () => {
    if (safeType.includes('Google Meet') || safeType.includes('Teams') || safeType.includes('Online')) {
      return <Video className="w-3 h-3 text-indigo-600" />;
    }
    if (safeType === 'Presencial') {
      return <MapPin className="w-3 h-3 text-emerald-600" />;
    }
    return <Phone className="w-3 h-3 text-amber-600" />;
  };

  return (
    <span className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border border-slate-200 inline-flex items-center gap-1.5 shrink-0">
      {getIcon()}
      {safeType}
    </span>
  );
};
