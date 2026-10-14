"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";

import { InputField, Button, ErrorModal } from "@/components/ui";
import { AuthLayout } from "@/components/layout";
import { forgotPasswordSchema, ForgotPasswordData } from "@/schemas/auth";
import { useForgotPassword } from "@/hooks/queries/useAuth";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";

export default function ForgotPassword() {
  const router = useRouter();

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "success" as "success" | "error",
    message: "",
  });

  const { mutateAsync: sendResetCode, isPending } = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
  });

  const isSubmitting = isFormSubmitting || isPending;

  const onSubmit = async (data: ForgotPasswordData) => {
    try {
      await sendResetCode(data.email);

      setModalState({
        isOpen: true,
        type: "success",
        message: "Verifique seu email para o código de recuperação.",
      });
    } catch (err) {
      console.error(err);
      setModalState({
        isOpen: true,
        type: "error",
        message: getFriendlyErrorMessage(err),
      });
    }
  };

  const handleModalClose = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (modalState.type === "success") {
      router.push("/resetPassword");
    }
  };

  return (
    <AuthLayout
      title="Recuperar Senha"
      subtitle="Digite seu email para receber o código"
      variant="login"
    >
      <ErrorModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        title={modalState.type === "success" ? "Código Enviado!" : "Erro"}
        message={modalState.message}
        type={modalState.type}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <InputField
          label="E-mail"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          leadingIcon={<Mail size={16} strokeWidth={1.8} />}
          disabled={isSubmitting}
          error={errors.email?.message}
          className="h-10 rounded-md shadow-none"
          {...register("email")}
        />

        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={isSubmitting}
          className="h-11 rounded-md py-2.5 text-sm font-semibold shadow-sm"
        >
          {isSubmitting ? "Enviando..." : "Enviar código"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        Lembrou da senha?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#237a32] transition-colors hover:text-[#185924] hover:underline"
        >
          Fazer Login
        </Link>
      </p>
    </AuthLayout>
  );
}
