import { STALE_TIMES } from "@/constants/query";
import { useQuery } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";

export interface TokenPayload {
  sub: string | number;
  userType: "user" | "association";
  role?: "ADMIN" | "VAQUEIRO" | null;
  name?: string;
  email?: string;
  exp?: number;
}

const getUser = (): TokenPayload | null => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("authToken");
  if (!token) return null;

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("authToken");
      return null;
    }
    return decoded;
  } catch (error) {
    console.error("Invalid token:", error);
    localStorage.removeItem("authToken");
    return null;
  }
};

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: getUser,
    staleTime: STALE_TIMES.SHORT,
    retry: false,
  });
}
