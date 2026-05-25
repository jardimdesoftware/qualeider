import { jwtDecode } from "jwt-decode";
import { logger } from "./logger";

export interface TokenPayload {
  sub: string | number;
  userType: "user" | "association";
  role?: "ADMIN" | "VAQUEIRO" | null;
  name?: string;
  email?: string;
}

/**
 * Get the auth token from localStorage safely
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
}

/**
 * Decode JWT token safely using jwt-decode library
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwtDecode<TokenPayload>(token);
  } catch (error) {
    logger.error("Failed to decode token", error);
    return null;
  }
}

/**
 * Get user type from stored token
 */
export function getUserTypeFromToken(): "user" | "association" {
  const token = getAuthToken();
  if (!token) return "user";

  const decoded = decodeToken(token);
  return decoded?.userType || "user";
}

/**
 * Get user role from stored token (ADMIN | VAQUEIRO)
 */
export function getUserRoleFromToken(): "ADMIN" | "VAQUEIRO" | null {
  const token = getAuthToken();
  if (!token) return null;

  const decoded = decodeToken(token);
  return decoded?.role ?? null;
}

/**
 * Get user ID from stored token
 */
export function getUserIdFromToken(): number | null {
  const token = getAuthToken();
  if (!token) return null;

  const decoded = decodeToken(token);
  if (!decoded) return null;

  return typeof decoded.sub === "string"
    ? parseInt(decoded.sub, 10)
    : decoded.sub;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) return false;

  const decoded = decodeToken(token);
  return decoded !== null;
}

/**
 * Remove auth token (logout)
 */
export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("authToken");
}

/**
 * Store auth token
 */
export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("authToken", token);
}
