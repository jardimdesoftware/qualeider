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
import { apiBase } from "@/services/baseApi";
import { resetPasswordSchema, ResetPasswordData } from "@/schemas/auth";

export default function ResetPassword() {
  const router = useRouter();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
      await apiBase.post("/auth/reset-password", {
        code: data.code,
        newPassword: data.password,
      });
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message ||
          "Erro ao redefinir senha. Verifique o código."
      );
      setShowErrorModal(true);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.push("/login");
  };

  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <ErrorModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title="Senha Redefinida!"
        message="Sua senha foi alterada com sucesso. Faça login agora."
        type="success"
      />

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Erro"
        message={errorMessage}
        type="error"
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
