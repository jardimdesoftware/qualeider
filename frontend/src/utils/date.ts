/**
 * Get current local date in YYYY-MM-DD format
 * Handles timezone offset to ensure correct local date
 */
export const getLocalDate = (): string => {
  const now = new Date();
  // Adjust timezone offset to get correct local date
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
};

/**
 * Format date to Brazilian Portuguese format (dd/MM/yyyy)
 */
export const formatDateBR = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Format date to long Brazilian Portuguese format
 */
export const formatDateLongBR = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};
