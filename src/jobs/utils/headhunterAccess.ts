import { UserProfile } from '../../auth/types/auth';
import { PermissionService } from '../../services/PermissionService';
import { isMasterProfile } from '../../auth/profile';

export interface HeadhunterVisibilityResult {
  moduloHeadhunterAtivo: boolean;
  usuarioPossuiPermissao: boolean;
  empresaIdValida: boolean;
  usuarioAtivo: boolean;
  mostrarFiltroHeadhunter: boolean;
}

/**
 * Regra oficial unificada de visibilidade do Módulo/Filtro Headhunter:
 * mostrarFiltroHeadhunter = moduloHeadhunterAtivo === true && usuarioPossuiPermissao === true
 */
export function checkHeadhunterVisibility(
  user: UserProfile | null | undefined,
  activeModules: Record<string, boolean> = {},
  userPermissions?: any
): HeadhunterVisibilityResult {
  if (!user) {
    return {
      moduloHeadhunterAtivo: false,
      usuarioPossuiPermissao: false,
      empresaIdValida: false,
      usuarioAtivo: false,
      mostrarFiltroHeadhunter: false,
    };
  }

  const isMaster = isMasterProfile(user);

  // 1. Status ativo do usuário
  const userAny = user as any;
  const usuarioAtivo =
    userAny.ativo !== false &&
    String(userAny.status || '').toUpperCase() !== 'INATIVO' &&
    String(userAny.status || '').toUpperCase() !== 'BLOQUEADO';

  // 2. empresaId da sessão atual
  const empresaId = user.empresaId || user.companyId;
  const empresaIdValida = Boolean(empresaId || isMaster);

  // 3. Módulo Headhunter ativo para a empresa (Level 1)
  const moduloHeadhunterAtivo = PermissionService.isCompanyModuleActive(
    'headhunter',
    activeModules
  );

  // 4. Permissão do usuário para acessar o módulo (Level 2)
  const usuarioPossuiPermissao = PermissionService.isUserPermissionActive(
    'headhunter',
    {
      userRole: user.role,
      isMaster,
      userPermissions,
    }
  );

  // Regra unificada de visibilidade
  const mostrarFiltroHeadhunter = Boolean(
    usuarioAtivo &&
      empresaIdValida &&
      moduloHeadhunterAtivo &&
      usuarioPossuiPermissao
  );

  return {
    moduloHeadhunterAtivo,
    usuarioPossuiPermissao,
    empresaIdValida,
    usuarioAtivo,
    mostrarFiltroHeadhunter,
  };
}

/**
 * Sanitizes commercial and headhunter fields from job data when Headhunter is inactive
 */
export function sanitizeCommercialFields<T extends Record<string, any>>(
  jobData: T,
  canAccessHeadhunter: boolean
): T {
  if (canAccessHeadhunter) return jobData;

  const sanitized: any = { ...jobData };

  delete sanitized.valorNegociado;
  delete sanitized.valorCobrado;
  delete sanitized.feePercentual;
  delete sanitized.percentualHonorarios;
  delete sanitized.percentualComissao;
  delete sanitized.comissaoRecrutador;
  delete sanitized.comissao;
  delete sanitized.regraCobranca;
  delete sanitized.vencimentoPrazo;
  delete sanitized.prazoGarantia;
  delete sanitized.prazoGarantiaDias;
  delete sanitized.responsavelComercial;
  delete sanitized.situacaoPagamento;
  delete sanitized.observacoesComerciais;

  if (
    sanitized.origemProcesso === 'headhunter' ||
    sanitized.origem === 'headhunter' ||
    sanitized.isHeadhunter ||
    sanitized.projetoHeadhunter
  ) {
    sanitized.origemProcesso = 'vaga_interna';
    sanitized.origem = 'vaga_interna';
    sanitized.isHeadhunter = false;
    sanitized.projetoHeadhunter = false;
  }

  return sanitized as T;
}
