/**
 * Módulo NÚCLEO - Funções Genéricas de Formatação
 * Sem nenhuma regra específica de negócio de RH.
 */

/**
 * Formata um valor numérico em moeda Real Brasileiro (R$)
 */
export const formatCurrencyBRL = (value: number | string | undefined | null): string => {
  if (value === undefined || value === null || value === '') return 'R$ 0,00';
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) : value;
  if (isNaN(numericValue)) return 'R$ 0,00';

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue);
};

/**
 * Formata data no padrão brasileiro (DD/MM/AAAA)
 */
export const formatDateBR = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

/**
 * Formata data e hora no padrão brasileiro (DD/MM/AAAA HH:mm)
 */
export const formatDateTimeBR = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Formata pluralização e contagem de itens de forma genérica
 */
export const formatCountPlural = (
  count: number,
  singularLabel: string,
  pluralLabel: string
): string => {
  if (count === 0) return `Nenhum ${singularLabel}`;
  if (count === 1) return `1 ${singularLabel}`;
  return `${count} ${pluralLabel}`;
};

/**
 * Formata número com separadores de milhar
 */
export const formatNumberBR = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '0';
  return new Intl.NumberFormat('pt-BR').format(value);
};

/**
 * Aplica máscara de CPF (000.000.000-00)
 */
export const formatCPF = (cpf: string): string => {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Aplica máscara de Telefone celular/fixo
 */
export const formatPhoneBR = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
};
