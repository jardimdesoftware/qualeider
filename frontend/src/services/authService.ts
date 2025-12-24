import { apiBase, STORAGE_KEY } from "./baseApi";
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  userType: "association" | "user";
  sub: string;
  name?: string;
  email?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  userType: "association" | "user";
  payload: TokenPayload;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await apiBase.post("/auth/login", credentials);
    const token = data?.access_token;

    if (!token) {
      throw new Error("Token não fornecido pela API");
    }

    localStorage.setItem(STORAGE_KEY, token);

    const payload = jwtDecode<TokenPayload>(token);

    return { token, userType: payload.userType, payload };
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  getToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEY);
  },

  getPayload: (): TokenPayload | null => {
    const token = authService.getToken();
    if (!token) return null;

    try {
      return jwtDecode<TokenPayload>(token);
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return !!authService.getToken();
  },

  sendResetCode: async (email: string) => {
    const { data } = await apiBase.post("/auth/forgot-password", { email });
    return data;
  },

  validateResetToken: async (email: string, code: string) => {
    const { data } = await apiBase.post("/auth/validate-reset-token", {
      email,
      token: code,
    });
    return data;
  },

  resetPassword: async (email: string, code: string, newPassword: string) => {
    const { data } = await apiBase.post("/auth/reset-password", {
      email,
      token: code,
      newPassword,
    });
    return data;
  },
};
