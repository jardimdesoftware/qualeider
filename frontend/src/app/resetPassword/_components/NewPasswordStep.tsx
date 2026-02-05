"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputField, Button } from "@/components/ui";
import { useResetPassword } from "@/hooks/queries/useAuth";
import { resetPasswordSchema, ResetPasswordData } from "@/schemas/auth";

interface NewPasswordStepProps {
  email: string;
  code: string;
  onResetSuccess: () => void;
  onError: (error: unknown) => void;
}

export function NewPasswordStep({
  email,
  code,
  onResetSuccess,
  onError,
}: NewPasswordStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
  });

  const { mutateAsync: resetPassword, isPending } = useResetPassword();
  const formIsSubmitting = isSubmitting || isPending;

  const onResetPassword = async (data: ResetPasswordData) => {
    try {
      if (!email || !code) {
        throw new Error("Dados de verificação perdidos. Reinicie o processo.");
      }

      await resetPassword({ email, code, password: data.password });

      onResetSuccess();
    } catch (err) {
      onError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onResetPassword)} className="space-y-4">
      <InputField
        label="Nova Senha"
        showPasswordToggle
        placeholder="••••••••"
        disabled={isSubmitting}
        error={errors.password?.message}
        {...register("password")}
      />

      <InputField
        label="Confirmar Senha"
        showPasswordToggle
        placeholder="••••••••"
        disabled={isSubmitting}
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={formIsSubmitting}
        className="mt-6"
      >
        {formIsSubmitting ? "SALVAR NOVA SENHA" : "REDEFINIR SENHA"}
      </Button>
    </form>
  );
}
