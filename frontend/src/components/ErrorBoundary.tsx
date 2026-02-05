'use client';

import React, { Component, ReactNode } from 'react';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary para capturar erros em componentes React
 * Previne que erros quebrem toda a aplicação
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log do erro com contexto completo
    logger.error('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI customizado ou padrão
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-2">
                Ops! Algo deu errado
              </h1>
              <p className="text-gray-600 mb-4">
                Encontramos um erro inesperado. Nossa equipe já foi notificada.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-[#1e3a29] text-white px-6 py-2 rounded-lg hover:bg-[#2d5a3e] transition-colors"
              >
                Recarregar página
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-xs text-left">
                <summary className="cursor-pointer text-gray-700 font-semibold">
                  Detalhes do erro (dev only)
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-48">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
