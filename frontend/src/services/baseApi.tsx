import axios from 'axios';

export const STORAGE_KEY = 'authToken';

export const apiBase = axios.create({
  baseURL:
    typeof window === "undefined"
      ? "http://backend:3000" // Server-side (Docker internal)
      : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080", // Client-side (Browser)
});

// Interceptor: Adiciona o token automaticamente em TODA requisição
apiBase.interceptors.request.use((config) => {
  if (typeof window !== "undefined") { // Only in browser
    const token = localStorage.getItem(STORAGE_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor: Tratamento global de erros
apiBase.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Token inválido ou expirado');
    }
    return Promise.reject(error);
  }
);
