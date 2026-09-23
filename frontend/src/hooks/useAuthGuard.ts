import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./useUser";

/**
 * Custom hook to protect routes and verify user authentication
 * @returns Object with userId and loading state
 */
export function useAuthGuard() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  return {
    userId: user
      ? typeof user.sub === "string"
        ? parseInt(user.sub, 10)
        : user.sub
      : null,
    isLoading,
  };
}
