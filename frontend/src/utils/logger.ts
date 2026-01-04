/**
 * Sistema de logging centralizado para produção.
 * Em desenvolvimento: exibe logs no console
 * Em produção: pode ser integrado com Sentry, LogRocket, etc.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogContext {
  userId?: number;
  route?: string;
  action?: string;
  component?: string;
  [key: string]: any;
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development';

  /**
   * Log informativo (baixa prioridade)
   */
  info(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.log(`ℹ[INFO] ${message}`, context || '');
    }
    // Em produção: enviar para serviço de analytics
  }

  /**
   * Log de aviso (média prioridade)
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.warn(`[WARN] ${message}`, context || '');
    }
    // Em produção: enviar para serviço de monitoring
  }

  /**
   * Log de erro (alta prioridade)
   * Deve ser usado para exceções e erros inesperados
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.isDev) {
      console.error(`[ERROR] ${message}`, error, context || '');
    }

    // Em produção: enviar para Sentry, LogRocket, etc.
  }

  /**
   * Log de debug (apenas desenvolvimento)
   */
  debug(message: string, data?: any): void {
    if (this.isDev) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }
}

export const logger = new Logger();
