/**
 * Módulo NÚCLEO - Tipos Fundamentais do Sistema RH TRANSFORMA
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: ApiErrorDetail;
  meta?: PaginationMeta;
  timestamp: string;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
  token?: string;
}

export type UserRole = 'ADMIN' | 'GESTOR' | 'RECRUTADOR' | 'COLABORADOR';

export interface AuthSession {
  userId: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  permissions: string[];
  token: string;
  expiresAt: string;
}
