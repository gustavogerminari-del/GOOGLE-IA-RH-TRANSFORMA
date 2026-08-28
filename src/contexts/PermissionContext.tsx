import React, { createContext, useContext } from 'react';
import { useAuth } from '../auth/context/AuthContext';
import { PermissionService, SystemRole } from '../services/PermissionService';
import { isMasterProfile } from '../auth/profile';

export interface PermissionContextType {
  role: SystemRole;
  isMaster: boolean;
  isEmpresaAdmin: boolean;
  isRH: boolean;
  isGestor: boolean;
  isColaborador: boolean;
  hasPermission: (permission: string) => boolean;
  canAccessRoute: (route: string) => boolean;
  permissions: string[];
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, activeModules, userPermissions } = useAuth();

  const userRoleRaw = isMasterProfile(user)
    ? 'MASTER' 
    : user?.role || user?.tipoUsuario || 'COLABORADOR';

  const role = PermissionService.normalizeRole(userRoleRaw);
  const permissions = PermissionService.getPermissionsForRole(role);

  const isMaster = isMasterProfile(user);
  const isEmpresaAdmin = PermissionService.isEmpresaAdmin(userRoleRaw);
  const isRH = PermissionService.isRH(userRoleRaw);
  const isGestor = PermissionService.isGestor(userRoleRaw);
  const isColaborador = role === 'COLABORADOR';

  const hasPermission = (permission: string): boolean => {
    return PermissionService.checkAccess(permission, {
      userRole: userRoleRaw,
      isMaster,
      companyModules: activeModules,
      userPermissions
    }).allowed;
  };

  const canAccessRoute = (route: string): boolean => {
    return PermissionService.checkAccess(route, {
      userRole: userRoleRaw,
      isMaster,
      companyModules: activeModules,
      userPermissions
    }).allowed;
  };

  return (
    <PermissionContext.Provider
      value={{
        role,
        isMaster,
        isEmpresaAdmin,
        isRH,
        isGestor,
        isColaborador,
        hasPermission,
        canAccessRoute,
        permissions
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission deve ser usado dentro de um PermissionProvider');
  }
  return context;
};
