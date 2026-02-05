/**
 * API Request/Response Interceptor para logging estruturado
 * Adiciona tracking automático de todas as chamadas HTTP
 */

import { AxiosInstance } from 'axios';
import { logger } from '@/utils/logger';
import { performanceMonitor } from '@/utils/performance';

/**
 * Adiciona interceptors de logging ao axios instance
 */
export function addLoggingInterceptors(axiosInstance: AxiosInstance) {
  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config) => {
      const requestId = `${config.method?.toUpperCase()}_${config.url}_${Date.now()}`;
      
      // Marca início da requisição para medir performance
      performanceMonitor.mark(requestId);
      
      // Salva requestId no config para usar no response
      (config as any).requestId = requestId;
      
      logger.debug('API Request', {
        method: config.method?.toUpperCase(),
        url: config.url,
        params: config.params,
        requestId,
      });
      
      return config;
    },
    (error) => {
      logger.error('API Request Error', error, {
        stage: 'request',
      });
      return Promise.reject(error);
    }
  );

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response) => {
      const requestId = (response.config as any).requestId;
      const duration = performanceMonitor.measure(requestId);
      
      logger.debug('API Response Success', {
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        status: response.status,
        duration,
        requestId,
      });
      
      // Log slow requests (> 3 segundos)
      if (duration && duration > 3000) {
        logger.warn('Slow API Request', {
          method: response.config.method?.toUpperCase(),
          url: response.config.url,
          duration,
          requestId,
        });
      }
      
      return response;
    },
    (error) => {
      const requestId = (error.config as any)?.requestId;
      const duration = requestId ? performanceMonitor.measure(requestId) : null;
      
      logger.error('API Response Error', error, {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        duration,
        requestId,
        responseData: error.response?.data,
      });
      
      return Promise.reject(error);
    }
  );
}
