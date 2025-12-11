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
import { forgotPasswordSchema, ForgotPasswordData } from "@/schemas/auth";

export default function ForgotPassword() {
  const router = useRouter();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    try {
      await apiBase.post("/auth/send-reset-code", data);
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.message ||
          "Erro ao enviar código. Tente novamente."
      );
      setShowErrorModal(true);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.push("/resetPassword");
  };

  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <ErrorModal
        isOpen={showSuccessModal}
        onClose={handleSuccessClose}
        title="Código Enviado!"
        message="Verifique seu email para o código de recuperação."
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
          title="Recuperar Senha"
          subtitle="Digite seu email para receber o código"
        />

        <div className="p-8 pb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <InputField
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              disabled={isSubmitting}
              error={errors.email?.message}
              {...register("email")}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isSubmitting}
              className="mt-6"
            >
              {isSubmitting ? "ENVIANDO..." : "ENVIAR CÓDIGO"}
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
