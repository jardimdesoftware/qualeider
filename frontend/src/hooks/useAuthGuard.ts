import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./useUser";

/**
 * Custom hook to protect routes and verify user authentication
 * @param requiredType - Required user type to access the route
 * @returns Object with userId and loading state
 */
export function useAuthGuard(requiredType: "user" | "association" = "user") {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (user.userType !== requiredType) {
      const dashboardRoute =
        user.userType === "user" ? "/dashboardUser" : "/dashboardAssociation";
      router.push(dashboardRoute);
    }
  }, [user, isLoading, requiredType, router]);

  return {
    userId: user
      ? typeof user.sub === "string"
        ? parseInt(user.sub, 10)
        : user.sub
      : null,
    isLoading,
  };
}
