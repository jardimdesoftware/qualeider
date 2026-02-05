/**
 * Performance monitoring utilities
 * Track page load times, API calls, and user interactions
 */

import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  context?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();

  /**
   * Marca o início de uma medição
   */
  mark(label: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${label}-start`);
    }
    this.metrics.set(label, Date.now());
  }

  /**
   * Marca o fim e calcula a duração
   */
  measure(label: string, context?: Record<string, any>): number | null {
    const startTime = this.metrics.get(label);
    
    if (!startTime) {
      logger.warn(`Performance mark not found: ${label}`);
      return null;
    }

    const duration = Date.now() - startTime;
    this.metrics.delete(label);

    // Log da métrica
    logger.info(`Performance: ${label}`, {
      duration,
      unit: 'ms',
      ...context,
    });

    // Usar Performance API se disponível
    if (typeof window !== 'undefined' && window.performance) {
      try {
        window.performance.mark(`${label}-end`);
        window.performance.measure(label, `${label}-start`, `${label}-end`);
      } catch (error) {
        // Ignorar erros de Performance API
      }
    }

    return duration;
  }

  /**
   * Reporta métrica customizada
   */
  reportMetric(metric: PerformanceMetric): void {
    logger.info(`Metric: ${metric.name}`, {
      value: metric.value,
      unit: metric.unit,
      ...metric.context,
    });

    // Integração com analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: metric.name,
        value: metric.value,
        metric_unit: metric.unit,
      });
    }
  }

  /**
   * Captura Core Web Vitals
   */
  reportWebVitals(metric: any): void {
    const { id, name, label, value } = metric;

    logger.info(`Web Vital: ${name}`, {
      id,
      label,
      value,
      rating: this.getRating(name, value),
    });

    // Send to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', name, {
        event_category: label === 'web-vital' ? 'Web Vitals' : 'Next.js custom metric',
        value: Math.round(name === 'CLS' ? value * 1000 : value),
        event_label: id,
        non_interaction: true,
      });
    }
  }

  /**
   * Rating baseado nos thresholds do Core Web Vitals
   */
  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, [number, number]> = {
      FCP: [1800, 3000],
      LCP: [2500, 4000],
      FID: [100, 300],
      CLS: [0.1, 0.25],
      TTFB: [800, 1800],
      INP: [200, 500],
    };

    const [good, poor] = thresholds[name] || [0, 0];

    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook para medir performance de componentes React
 */
export function usePerformance(componentName: string) {
  const mark = () => performanceMonitor.mark(componentName);
  const measure = () => performanceMonitor.measure(componentName, { component: componentName });

  return { mark, measure };
}
