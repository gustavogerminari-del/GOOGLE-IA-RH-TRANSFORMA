export function requireTenantId(value: unknown, operation = 'realizar esta operação'): string {
  const companyId = typeof value === 'string' ? value.trim() : '';
  if (!companyId) throw new Error(`Não foi possível ${operation}: empresaId é obrigatório.`);
  return companyId;
}

export function normalizeTenantFields<T extends Record<string, any>>(data: T, operation?: string): T & {
  companyId: string;
  empresaId: string;
} {
  const companyId = requireTenantId(data.companyId || data.empresaId || data.tenantId, operation);
  return { ...data, companyId, empresaId: companyId };
}
