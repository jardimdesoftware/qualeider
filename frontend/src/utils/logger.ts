/**
 * Sistema de logging centralizado para produção.
 * Em desenvolvimento: exibe logs no console
 * Em produção: integra com Sentry e outros serviços
 */

import { captureException, captureMessage, addBreadcrumb } from '@/lib/sentry';

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
      console.log(`ℹ️ [INFO] ${message}`, context || '');
    }
    
    // Breadcrumb para rastrear ações do usuário
    addBreadcrumb(message, 'info', context);
  }

  /**
   * Log de aviso (média prioridade)
   */
  warn(message: string, context?: LogContext): void {
    if (this.isDev) {
      console.warn(`⚠️ [WARN] ${message}`, context || '');
    }
    
    // Registrar warning no Sentry
    if (!this.isDev) {
      captureMessage(message, 'warning', context);
    }
    
    addBreadcrumb(message, 'warning', context);
  }

  /**
   * Log de erro (alta prioridade)
   * Deve ser usado para exceções e erros inesperados
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.isDev) {
      console.error(`❌ [ERROR] ${message}`, error, context || '');
    }

    // Capturar erro no Sentry com contexto
    if (!this.isDev && error) {
      if (error instanceof Error) {
        captureException(error, { ...context, message });
      } else {
        captureMessage(message, 'error', { ...context, error });
      }
    }
    
    addBreadcrumb(message, 'error', context);
  }

  /**
   * Log de debug (apenas desenvolvimento)
   */
  debug(message: string, data?: any): void {
    if (this.isDev) {
      console.debug(`🐛 [DEBUG] ${message}`, data || '');
    }
  }

  /**
   * Tracking de performance
   */
  time(label: string): void {
    if (this.isDev) {
      console.time(label);
    }
  }

  timeEnd(label: string, context?: LogContext): void {
    if (this.isDev) {
      console.timeEnd(label);
    }
    
    addBreadcrumb(`Performance: ${label}`, 'performance', context);
  }

  /**
   * Track user actions para analytics
   */
  trackAction(action: string, context?: LogContext): void {
    this.info(`User action: ${action}`, { ...context, action });
    
    // Aqui pode ser integrado com Google Analytics, Amplitude, etc
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', action, context);
    }
  }
}

export const logger = new Logger();
