/**
 * Design Tokens - Cores do Sistema QualeiDer
 * 
 * Este arquivo centraliza todas as cores utilizadas no sistema,
 * facilitando manutenção e garantindo consistência visual.
 * 
 * Boas práticas:
 * - Nome semântico (ex: 'primary' ao invés de 'green')
 * - Agrupamento por propósito (brand, neutral, feedback)
 * - Documentação de uso
 */

export const colors = {
  // Brand Colors
  brand: {
    primary: '#1e3a29',        // Verde escuro principal
    primaryHover: '#2d5a42',   // Verde escuro hover
    secondary: '#d97706',      // Laranja/Âmbar destaque
    accent: '#fbbf24',         // Amarelo/Dourado claro
  },

  neutral: {
    white: '#ffffff',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
  },

  feedback: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
} as const;

export type ColorToken = typeof colors;
