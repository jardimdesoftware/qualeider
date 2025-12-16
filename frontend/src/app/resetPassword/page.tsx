"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { BrandHeader, ContentCard, ErrorModal } from "@/components/ui";
import { PageFooter } from "@/components/layout";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";
import { VerifyCodeStep } from "./_components/VerifyCodeStep";
import { NewPasswordStep } from "./_components/NewPasswordStep";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawEmail = searchParams.get("email");
  const emailParam = rawEmail ? rawEmail.trim() : "";

  const [step, setStep] = useState<"verify-code" | "reset-password">(
    "verify-code"
  );
  const [resetData, setResetData] = useState<{ email: string; code: string }>({
    email: "",
    code: "",
  });

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "success" as "success" | "error",
    message: "",
  });

  const handleVerifySuccess = (code: string, email: string) => {
    setResetData({ email, code });
    setStep("reset-password");
  };

  const handleResetSuccess = () => {
    setModalState({
      isOpen: true,
      type: "success",
      message: "Sua senha foi alterada com sucesso. Faça login agora.",
    });
  };

  const handleError = (err: unknown) => {
    console.error("Erro no processo:", err);
    setModalState({
      isOpen: true,
      type: "error",
      message: getFriendlyErrorMessage(err),
    });
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
        title={modalState.type === "success" ? "Sucesso" : "Atenção"}
        message={modalState.message}
        type={modalState.type}
      />

      <ContentCard className="max-w-md w-full">
        <BrandHeader
          title={step === "verify-code" ? "Verificar Código" : "Nova Senha"}
          subtitle={
            step === "verify-code"
              ? "Confirme o código recebido"
              : "Crie uma nova senha"
          }
        />

        <div className="p-8 pb-6">
          {step === "verify-code" && (
            <VerifyCodeStep
              emailParam={emailParam}
              onVerifySuccess={handleVerifySuccess}
              onError={handleError}
            />
          )}

          {step === "reset-password" && (
            <NewPasswordStep
              email={resetData.email}
              code={resetData.code}
              onResetSuccess={handleResetSuccess}
              onError={handleError}
            />
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/login")}
              className="text-brand-primary hover:text-brand-primary-hover font-semibold text-sm transition-colors"
            >
              Voltar ao Login
            </button>
          </div>
        </div>

        <PageFooter />
      </ContentCard>
    </main>
  );
}

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-10">Carregando formulário...</div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
