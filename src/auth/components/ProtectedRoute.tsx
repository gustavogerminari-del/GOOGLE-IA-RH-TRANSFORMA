import React from 'react';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ScreenRouteKey, SystemActionKey } from '../types/auth';
import { UserRoleBadge } from './UserRoleBadge';
import { Button, Card } from '../../shared';

export interface ProtectedRouteProps {
  screenKey?: ScreenRouteKey;
  actionKey?: SystemActionKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  screenKey,
  actionKey,
  children,
  fallback,
}) => {
  const { user, isAuthenticated, hasScreenAccess, hasActionAccess } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <Card className="max-w-md mx-auto my-12 text-center p-8 space-y-4">
        <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-black text-slate-900">Sessão Não Autenticada</h3>
        <p className="text-xs text-slate-500">
          Você precisa estar logado para acessar esta página ou recurso.
        </p>
      </Card>
    );
  }

  const isScreenAllowed = screenKey ? hasScreenAccess(screenKey) : true;
  const isActionAllowed = actionKey ? hasActionAccess(actionKey) : true;

  if (!isScreenAllowed || !isActionAllowed) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="max-w-xl mx-auto my-10 p-6 bg-white rounded-3xl border border-rose-200 shadow-sm space-y-4 text-center">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-black text-rose-900">Acesso não autorizado.</h3>
          <p className="text-xs text-slate-600">
            Este módulo não está contratado para a sua empresa ou seu usuário não possui permissão de acesso.
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-left">
          <p className="font-bold text-slate-700">Seu usuário:</p>
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-900">{user.name} ({user.email})</span>
            <UserRoleBadge role={user.role} />
          </div>
        </div>

        <div className="pt-2 flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
