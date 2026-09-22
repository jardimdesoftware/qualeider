import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { producerService } from "@/services/producerService";
import { LoginData } from "@/schemas/auth";
import { ProducerData } from "@/schemas/registration";

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginData) => authService.login(data),
    onSuccess: () => {
      // Invalidate user query to force re-fetch of user state
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.push("/dashboardUser");
    },
  });
}

export function useCreateProducer() {
  return useMutation({
    mutationFn: (data: ProducerData) => producerService.create(data),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authService.sendResetCode(email),
  });
}

export function useVerifyResetCode() {
  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) =>
      authService.validateResetToken(email, code),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({
      email,
      code,
      password,
    }: {
      email: string;
      code: string;
      password: string;
    }) => authService.resetPassword(email, code, password),
  });
}
