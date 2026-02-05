/**
 * Sentry Error Tracking Integration
 * Configuração para rastreamento de erros em produção
 */

import * as Sentry from "@sentry/nextjs";

export function initSentry() {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      
      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% das transações
      
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% das sessões normais
      replaysOnErrorSampleRate: 1.0, // 100% quando há erro
      
      environment: process.env.NODE_ENV,
      
      // Filtros e sanitização
      beforeSend(event, hint) {
        // Não enviar erros de desenvolvimento
        if (event.environment === 'development') {
          return null;
        }
        
        // Remover informações sensíveis
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers;
        }
        
        return event;
      },
      
      // Ignorar erros comuns do browser
      ignoreErrors: [
        'Network request failed',
        'NetworkError',
        'Failed to fetch',
        'Load failed',
        'AbortError',
      ],
    });
  }
}

/**
 * Captura exceção manualmente
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}

/**
 * Captura mensagem personalizada
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  }
}

/**
 * Define contexto do usuário para rastreamento
 */
export function setUserContext(userId: number | null, email?: string) {
  if (userId) {
    Sentry.setUser({
      id: userId.toString(),
      email,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Adiciona breadcrumb (rastro de ações do usuário)
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
  });
}
