import { apiBase } from "./baseApi";
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
    const token = data?.data?.access_token;

    if (!token) {
      throw new Error("Token não fornecido pela API");
    }

    // Salva o token
    localStorage.setItem("authToken", token);

    // Decodifica para saber quem é o usuário
    const payload = jwtDecode<TokenPayload>(token);

    return { token, userType: payload.userType, payload };
  },

  logout: () => {
    localStorage.removeItem("authToken");
  },

  getToken: (): string | null => {
    return localStorage.getItem("authToken");
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

  /**
   * Send password reset code to email
   */
  sendResetCode: async (email: string) => {
    const { data } = await apiBase.post("/auth/send-reset-code", { email });
    return data;
  },

  /**
   * Reset password with code
   */
  resetPassword: async (code: string, newPassword: string) => {
    const { data } = await apiBase.post("/auth/reset-password", {
      code,
      newPassword,
    });
    return data;
  },
};
