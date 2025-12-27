/**
 * UI Constants
 * Centralized UI-related constants to avoid magic numbers throughout the application
 */

export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
  MOBILE_SMALL: 400,
} as const;

export const ICON_SIZES = {
  XXS: 12,
  XS: 16,
  SM: 20,
  MD: 24,
  LG: 32,
  XL: 40,
} as const;

export const LOGO_SIZES = {
  SM: 32,
  MD: 40,
  LG: 48,
  XL: 80,
  XXL: 96,
} as const;

export const STROKE_WIDTH = {
  THIN: 1,
  NORMAL: 2,
  BOLD: 3,
} as const;

// milliseconds
export const TIMING = {
  DEBOUNCE_SHORT: 150,
  DEBOUNCE_MEDIUM: 300,
  DEBOUNCE_LONG: 500,
  ANIMATION_FAST: 200,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_PAGE: 1,
} as const;

export const ANIMALS_PAGINATION = {
  MOBILE_SMALL: 2,
  MOBILE_LARGE: 4,
  DESKTOP: 7,
} as const;

export const Z_INDEX = {
  DROPDOWN: 10,
  MODAL: 20,
  SIDEBAR: 30,
  MOBILE_MENU: 40,
  TOAST: 50,
} as const;
