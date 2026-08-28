import React from 'react';
import { Shield, Crown, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRoleBadge } from './UserRoleBadge';

export const ProfileSwitchSelector: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isMasterActive = user.role === 'Super Administrador' || user.tipoUsuario === 'MASTER';

  return (
    <div className="bg-slate-900 text-slate-100 px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border-b border-slate-800">
      <div className="flex items-center gap-2.5 flex-wrap">
        <Shield className="w-4 h-4 text-emerald-400" />
        <span className="font-bold text-slate-300">Sessão Autenticada:</span>
        <span className="text-white font-extrabold flex items-center gap-1.5">
          {user.name}
          <span className="text-slate-400 font-normal">({user.email})</span>
        </span>
        <UserRoleBadge role={user.role} size="sm" />
        {isMasterActive && (
          <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-black text-[10px] uppercase tracking-wider">
            <Crown className="w-3 h-3 text-amber-400" />
            Acesso Master Global
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 px-3 py-1 rounded-lg transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Encerrar Sessão</span>
        </button>
      </div>
    </div>
  );
};
