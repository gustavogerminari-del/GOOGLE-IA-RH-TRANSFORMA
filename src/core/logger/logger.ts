/**
 * Módulo NÚCLEO - Logger Estruturado Centralizado
 */

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  module?: string;
  metadata?: Record<string, unknown>;
}

class CoreLogger {
  private isDevelopment = true;

  private formatEntry(level: LogLevel, message: string, moduleName?: string, metadata?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      module: moduleName || 'CORE',
      metadata,
    };
  }

  public info(message: string, moduleName?: string, metadata?: Record<string, unknown>): void {
    const entry = this.formatEntry('INFO', message, moduleName, metadata);
    if (this.isDevelopment) {
      console.log(`[${entry.timestamp}] [INFO] [${entry.module}]: ${entry.message}`, metadata || '');
    }
  }

  public warn(message: string, moduleName?: string, metadata?: Record<string, unknown>): void {
    const entry = this.formatEntry('WARN', message, moduleName, metadata);
    console.warn(`[${entry.timestamp}] [WARN] [${entry.module}]: ${entry.message}`, metadata || '');
  }

  public error(message: string, moduleName?: string, metadata?: Record<string, unknown>): void {
    const entry = this.formatEntry('ERROR', message, moduleName, metadata);
    console.error(`[${entry.timestamp}] [ERROR] [${entry.module}]: ${entry.message}`, metadata || '');
  }

  public debug(message: string, moduleName?: string, metadata?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      const entry = this.formatEntry('DEBUG', message, moduleName, metadata);
      console.debug(`[${entry.timestamp}] [DEBUG] [${entry.module}]: ${entry.message}`, metadata || '');
    }
  }
}

export const logger = new CoreLogger();
