/**
 * Módulo COMPARTILHADO - Funções Auxiliares Genéricas
 * Sem nenhuma regra de negócio específica.
 */

export type SortOrder = 'asc' | 'desc';

/**
 * Ordena uma lista de objetos de forma genérica por qualquer propriedade
 */
export function sortList<T>(
  items: T[],
  key: keyof T,
  order: SortOrder = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const valA = a[key];
    const valB = b[key];

    if (valA === valB) return 0;
    if (valA === undefined || valA === null) return 1;
    if (valB === undefined || valB === null) return -1;

    let comparison = 0;
    if (typeof valA === 'string' && typeof valB === 'string') {
      comparison = valA.localeCompare(valB, 'pt-BR', { sensitivity: 'base' });
    } else if (typeof valA === 'number' && typeof valB === 'number') {
      comparison = valA - valB;
    } else {
      comparison = String(valA).localeCompare(String(valB));
    }

    return order === 'asc' ? comparison : -comparison;
  });
}

export interface PaginationResult<T> {
  data: T[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Pagina uma lista em memória de forma genérica
 */
export function paginateList<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 10
): PaginationResult<T> {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const currentPage = Math.max(1, Math.min(page, totalPages));

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const data = items.slice(startIndex, endIndex);

  return {
    data,
    totalItems,
    currentPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}

/**
 * Capitaliza a primeira letra de cada palavra
 */
export function capitalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Trunca um texto adicionando reticências se exceder o limite
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || '';
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Transforma uma string em um slug para URLs ou IDs
 */
export function slugifyText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
