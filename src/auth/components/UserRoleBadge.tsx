import React from 'react';
import { RoleProfile } from '../types/auth';

export interface UserRoleBadgeProps {
  role: RoleProfile;
  size?: 'sm' | 'md';
}

export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({ role, size = 'sm' }) => {
  const badgeStyles: Record<RoleProfile, string> = {
    'Super Administrador': 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-xs',
    'Administrador': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Gestor de Seleção': 'bg-purple-100 text-purple-800 border-purple-200',
    'Recrutador Sênior': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Analista de RH': 'bg-amber-100 text-amber-800 border-amber-200',
    'Colaborador': 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 rounded-md font-extrabold',
    md: 'text-xs px-2.5 py-1 rounded-lg font-extrabold',
  };

  return (
    <span className={`border ${badgeStyles[role]} ${sizeStyles[size]} inline-flex items-center gap-1`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
      {role}
    </span>
  );
};
