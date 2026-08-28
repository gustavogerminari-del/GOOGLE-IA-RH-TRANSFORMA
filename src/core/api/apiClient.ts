/**
 * Módulo NÚCLEO - Cliente de Conexão de API e Banco de Dados
 */

import { ApiResponse, HttpMethod, RequestOptions } from '../types';
import { AppError, logCentralizedError } from '../errors/appError';
import { logger } from '../logger/logger';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Executa requisição HTTP padrão com tratamento de erros centralizado
   */
  public async request<T = unknown>(
    endpoint: string,
    method: HttpMethod = 'GET',
    data?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, options.params);
    const timeoutMs = options.timeoutMs || 10000;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    logger.debug(`Iniciando ${method} para ${url}`, 'ApiClient', { method, url });

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let parsedError: unknown;
        try {
          parsedError = JSON.parse(errorText);
        } catch {
          parsedError = { message: errorText || response.statusText };
        }

        throw new AppError(
          (parsedError as { message?: string }).message || 'Erro na requisição para o servidor',
          response.status,
          `HTTP_${response.status}`
        );
      }

      const jsonResponse: ApiResponse<T> = await response.json();
      return jsonResponse;
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof DOMException && err.name === 'AbortError') {
        const timeoutError = new AppError('Tempo limite da requisição excedido', 408, 'TIMEOUT');
        logCentralizedError(timeoutError, 'ApiClient');
        throw timeoutError;
      }

      logCentralizedError(err, 'ApiClient');
      throw err;
    }
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'GET', undefined, options);
  }

  public post<T>(endpoint: string, data: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'POST', data, options);
  }

  public put<T>(endpoint: string, data: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'PUT', data, options);
  }

  public patch<T>(endpoint: string, data: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'PATCH', data, options);
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'DELETE', undefined, options);
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let fullUrl = `${this.baseUrl}${cleanEndpoint}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          searchParams.append(key, String(val));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        fullUrl += `?${queryString}`;
      }
    }

    return fullUrl;
  }
}

export const apiClient = new ApiClient();
