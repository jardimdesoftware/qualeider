import axios from "axios";
import { logger } from "@/utils/logger";
import { addLoggingInterceptors } from "@/utils/api-logger";

export const STORAGE_KEY = "authToken";

export const apiBase = axios.create({
  baseURL:
    typeof window === "undefined"
      ? "http://backend:3000/api" 
      : process.env.NEXT_PUBLIC_API_URL || "/api", 
});

// Interceptor: Adiciona o token automaticamente em TODA requisição
apiBase.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    // Only in browser
    const token = localStorage.getItem(STORAGE_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor: Extrai dados do envelope padrão do backend e respostas paginadas
apiBase.interceptors.response.use(
  (response) => {
    // Caso 1: Resposta envelopada { statusCode, message, data }
    if (
      response.data &&
      typeof response.data === "object" &&
      "statusCode" in response.data &&
      "message" in response.data &&
      "data" in response.data
    ) {
      const envelope = {
        statusCode: response.data.statusCode,
        message: response.data.message,
      };

      return {
        ...response,
        data: response.data.data,
        _envelope: envelope,
      };
    }

    // Caso 2: Resposta paginada { data: [], total: number, ... }
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data &&
      "total" in response.data &&
      Array.isArray(response.data.data)
    ) {
      const pagination = {
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
      };

      return {
        ...response,
        data: response.data.data,
        _pagination: pagination,
      };
    }

    // Caso 3: Resposta simples - retorna como está
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      logger.warn("Token inválido ou expirado");
    }
    return Promise.reject(error);
  },
);

// Adicionar interceptors de logging
addLoggingInterceptors(apiBase);
