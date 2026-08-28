import React from 'react';
import { ShieldAlert, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../../contexts/PermissionContext';
import { useModuleContext } from '../../contexts/ModuleContext';
import { Card, Button } from '../../shared';

export interface RouteGuardProps {
  children: React.ReactNode;
  moduleKey?: string;
  requiredPermission?: string;
}

export const MasterRoute: React.FC<RouteGuardProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { isMaster } = usePermission();

  if (!isAuthenticated || !user) {
    return <UnauthorizedCard message="Você precisa estar autenticado como Super Administrador." />;
  }

  if (!isMaster) {
    return <AccessDeniedCard title="Acesso Exclusivo Super Administrador (Master)" message="Apenas o Super Administrador pode acessar este painel de gestão SaaS." />;
  }

  return <>{children}</>;
};

export const CompanyRoute: React.FC<RouteGuardProps> = ({ children, moduleKey, requiredPermission }) => {
  const { user, isAuthenticated } = useAuth();
  const { isEmpresaAdmin, hasPermission } = usePermission();
  const { isModuleEnabled } = useModuleContext();

  if (!isAuthenticated || !user) {
    return <UnauthorizedCard message="Você precisa estar autenticado para acessar este recurso." />;
  }

  if (!isEmpresaAdmin) {
    return <AccessDeniedCard title="Acesso Restrito à Administração" message="Seu perfil não possui acesso de Administrador da Empresa." />;
  }

  if (moduleKey && !isModuleEnabled(moduleKey)) {
    return <AccessDeniedCard title="Módulo Não Contratado" message={`O módulo '${moduleKey}' não está ativado no plano atual da sua empresa.`} />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <AccessDeniedCard title="Permissão Insuficiente" message="Você não possui a permissão necessária para esta ação." />;
  }

  return <>{children}</>;
};

export const RHRoute: React.FC<RouteGuardProps> = ({ children, moduleKey, requiredPermission }) => {
  const { user, isAuthenticated } = useAuth();
  const { isRH, hasPermission } = usePermission();
  const { isModuleEnabled } = useModuleContext();

  if (!isAuthenticated || !user) {
    return <UnauthorizedCard message="Você precisa estar autenticado para acessar este recurso." />;
  }

  if (!isRH) {
    return <AccessDeniedCard title="Acesso Restrito ao RH" message="Apenas a equipe de Recursos Humanos pode acessar este recurso." />;
  }

  if (moduleKey && !isModuleEnabled(moduleKey)) {
    return <AccessDeniedCard title="Módulo Não Contratado" message={`O módulo '${moduleKey}' não está ativo para a sua empresa.`} />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <AccessDeniedCard title="Permissão Insuficiente" message="Sua conta RH não tem a permissão específica necessária." />;
  }

  return <>{children}</>;
};

export const ManagerRoute: React.FC<RouteGuardProps> = ({ children, moduleKey }) => {
  const { user, isAuthenticated } = useAuth();
  const { isGestor } = usePermission();
  const { isModuleEnabled } = useModuleContext();

  if (!isAuthenticated || !user) {
    return <UnauthorizedCard message="Você precisa estar autenticado para acessar este recurso." />;
  }

  if (!isGestor) {
    return <AccessDeniedCard title="Acesso Restrito à Gestão" message="Apenas Gestores ou Lideranças têm permissão para visualizar esta área." />;
  }

  if (moduleKey && !isModuleEnabled(moduleKey)) {
    return <AccessDeniedCard title="Módulo Desativado" message="Este recurso não está disponível no plano contratado." />;
  }

  return <>{children}</>;
};

export const EmployeeRoute: React.FC<RouteGuardProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <UnauthorizedCard message="Você precisa estar autenticado no Portal do Colaborador." />;
  }

  return <>{children}</>;
};

const UnauthorizedCard: React.FC<{ message: string }> = ({ message }) => (
  <Card className="max-w-md mx-auto my-12 text-center p-8 space-y-4">
    <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto">
      <Lock className="w-6 h-6" />
    </div>
    <h3 className="text-lg font-black text-slate-900">Autenticação Necessária</h3>
    <p className="text-xs text-slate-500">{message}</p>
  </Card>
);

const AccessDeniedCard: React.FC<{ title: string; message: string }> = ({ title, message }) => (
  <div className="max-w-xl mx-auto my-10 p-6 bg-white rounded-3xl border border-rose-200 shadow-sm space-y-4 text-center">
    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
      <ShieldAlert className="w-6 h-6" />
    </div>
    <div className="space-y-1">
      <h3 className="text-lg font-black text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500">{message}</p>
    </div>
  </div>
);
