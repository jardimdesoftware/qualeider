"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  BrandHeader,
  ContentCard,
  InputField,
  Button,
  ErrorModal,
} from "@/components/ui";
import { PageFooter } from "@/components/layout";
import { resetPasswordSchema, ResetPasswordData } from "@/schemas/auth";
import { authService } from "@/services/authService";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";

export default function ResetPassword() {
  const router = useRouter();

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "success" as "success" | "error",
    message: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: ResetPasswordData) => {
    try {
      await authService.resetPassword(data.code, data.password);

      setModalState({
        isOpen: true,
        type: "success",
        message: "Sua senha foi alterada com sucesso. Faça login agora.",
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
      router.push("/login");
    }
  };

  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <ErrorModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        title={modalState.type === "success" ? "Senha Redefinida!" : "Erro"}
        message={modalState.message}
        type={modalState.type}
      />

      <ContentCard className="max-w-md">
        <BrandHeader
          title="Nova Senha"
          subtitle="Digite o código recebido por email"
        />

        <div className="p-8 pb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <InputField
              label="Código de Verificação"
              type="text"
              placeholder="000000"
              disabled={isSubmitting}
              error={errors.code?.message}
              {...register("code")}
            />

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
              disabled={isSubmitting}
              className="mt-6"
            >
              {isSubmitting ? "REDEFININDO..." : "REDEFINIR SENHA"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-brand-primary hover:text-brand-primary-hover font-semibold text-sm transition-colors"
            >
              Voltar ao Login
            </Link>
          </div>
        </div>

        <PageFooter />
      </ContentCard>
    </main>
  );
}
