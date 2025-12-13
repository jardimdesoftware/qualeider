import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  sub: string | number;
  userType: "user" | "association";
  name?: string;
  email?: string;
}

/**
 * Custom hook to protect routes and verify user authentication
 * @param requiredType - Required user type to access the route
 * @returns Object with userId and loading state
 */
export function useAuthGuard(requiredType: "user" | "association" = "user") {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded = jwtDecode<TokenPayload>(token);

      // Verify if user type matches required type
      if (decoded.userType !== requiredType) {
        // Redirect to appropriate dashboard
        const dashboardRoute =
          decoded.userType === "user"
            ? "/dashboardUser"
            : "/dashboardAssociation";
        router.push(dashboardRoute);
        return;
      }

      const uid =
        typeof decoded.sub === "string"
          ? parseInt(decoded.sub, 10)
          : decoded.sub;
      setUserId(uid);
      setIsLoading(false);
    } catch (error) {
      console.error("Invalid token", error);
      localStorage.removeItem("authToken");
      router.push("/login");
    }
  }, [router, requiredType]);

  return { userId, isLoading };
}
