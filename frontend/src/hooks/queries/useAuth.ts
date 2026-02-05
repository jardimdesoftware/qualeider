import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { producerService } from "@/services/producerService";
import { associationService } from "@/services/associationService";
import { LoginData } from "@/schemas/auth";
import { ProducerData, AssociationData } from "@/schemas/registration";

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginData) => authService.login(data),
    onSuccess: (data) => {
      // Invalidate user query to force re-fetch of user state
      queryClient.invalidateQueries({ queryKey: ["user"] });
      
      const routes = {
        association: "/dashboardAssociation",
        user: "/dashboardUser",
      } as const;

      const targetRoute = routes[data.userType];
      if (targetRoute) {
        router.push(targetRoute);
      }
    },
  });
}

export function useCreateProducer() {
  return useMutation({
    mutationFn: (data: ProducerData) => producerService.create(data),
  });
}

export function useCreateAssociation() {
  return useMutation({
    mutationFn: (data: AssociationData) => associationService.create(data),
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
