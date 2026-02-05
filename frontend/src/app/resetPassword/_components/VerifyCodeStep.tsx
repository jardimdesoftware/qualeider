"use client";

import { useForm } from "react-hook-form";
import { InputField, Button } from "@/components/ui";
import { useVerifyResetCode } from "@/hooks/queries/useAuth";

interface VerifyCodeStepProps {
  emailParam: string;
  onVerifySuccess: (code: string, email: string) => void;
  onError: (error: unknown) => void;
}

export function VerifyCodeStep({
  emailParam,
  onVerifySuccess,
  onError,
}: VerifyCodeStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string; code: string }>({
    mode: "onBlur",
    defaultValues: {
      email: "",
    },
  });

  const { mutateAsync: verifyCode, isPending } = useVerifyResetCode();
  const formIsSubmitting = isSubmitting || isPending;

  const onVerifyCode = async (data: { email: string; code: string }) => {
    try {
      const emailToSend = emailParam || data.email;
      const codeToSend = data.code;

      if (!emailToSend) {
        throw new Error(
          "Email não identificado. Por favor, volte e tente novamente."
        );
      }

      if (!codeToSend || codeToSend.length !== 6) {
        throw new Error("Código inválido. Verifique se digitou os 6 números.");
      }

      await verifyCode({ email: emailToSend, code: codeToSend });

      onVerifySuccess(codeToSend, emailToSend);
    } catch (err) {
      onError(err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onVerifyCode)} className="space-y-6">
      {emailParam ? (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center mb-4">
          <p className="text-xs text-blue-600 uppercase font-bold tracking-wide mb-1">
            Verificando conta
          </p>
          <p className="text-gray-900 font-medium break-all">{emailParam}</p>
        </div>
      ) : (
        <InputField
          label="Confirme seu Email"
          type="email"
          placeholder="seu@email.com"
          error={errors.email?.message}
          {...register("email", { required: "Email é obrigatório" })}
        />
      )}

      <InputField
        label="Código de Verificação"
        type="text"
        placeholder="000000"
        className="text-center tracking-[0.5em] font-mono text-lg"
        maxLength={6}
        disabled={isSubmitting}
        error={errors.code?.message}
        {...register("code", { required: "Código obrigatório" })}
      />

      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={formIsSubmitting}
      >
        {formIsSubmitting ? "VALIDANDO..." : "VERIFICAR CÓDIGO"}
      </Button>
    </form>
  );
}
