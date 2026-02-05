export const STALE_TIMES = {
  NONE: 0,
  SHORT: 1000 * 30,
  MEDIUM: 1000 * 60 * 5,
  LONG: 1000 * 60 * 10,
  VERY_LONG: 1000 * 60 * 60,
  INFINITE: 1000 * 60 * 60 * 24,
} as const;
