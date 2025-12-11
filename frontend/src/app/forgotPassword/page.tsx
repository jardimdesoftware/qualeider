"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  BrandHeader,
  ContentCard,
  InputField,
  Button,
  ErrorModal,
} from "@/components/ui";
import { PageFooter } from "@/components/layout";
import { apiBase } from "@/services/baseApi";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("E-mail é obrigatório");
      return false;
    } else if (!regex.test(email)) {
      setEmailError("E-mail inválido");
      return false;
    } else {
      setEmailError("");
      return true;
    }
  };

  const handleResetPassword = async () => {
    if (!validateEmail(email)) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiBase.post("/auth/forgot-password", {
        email,
      });

      if (response.status === 201) {
        localStorage.setItem("resetEmail", email);
        router.push("/resetPassword");
      } else {
        throw new Error(
          response.data.message || "Erro ao enviar e-mail de recuperação"
        );
      }
    } catch (err: any) {
      console.error("Erro no frontend:", err);

      if (err.response) {
        if (err.response.status === 404) {
          setErrorMessage(
            "E-mail não encontrado no sistema. Verifique o endereço digitado."
          );
        } else if (err.response.status === 500) {
          setErrorMessage(
            "Erro ao enviar e-mail de recuperação. Tente novamente mais tarde."
          );
        } else {
          setErrorMessage(
            err.response.data.message || "Ocorreu um erro inesperado."
          );
        }
      } else {
        setErrorMessage(
          "Erro ao conectar com o servidor. Verifique sua conexão."
        );
      }

      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />

      <ContentCard className="max-w-md">
        <BrandHeader
          title="QualeiDer"
          subtitle="Controle de sua produção leiteira"
        />

        <div className="p-8 pb-6">
          <Link
            href="/login"
            className="inline-flex items-center text-brand-primary hover:text-brand-primary-hover font-semibold text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={18} className="mr-1" />
            Voltar
          </Link>

          <h2 className="text-brand-primary text-2xl font-bold text-center mb-2">
            Esqueceu a senha?
          </h2>
          <p className="text-gray-600 text-center mb-6 text-sm">
            Insira seu e-mail para recuperar o acesso
          </p>

          <InputField
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) validateEmail(e.target.value);
            }}
            onBlur={(e) => validateEmail(e.target.value)}
            error={emailError}
            placeholder="seu@email.com"
            disabled={loading}
          />

          <Button
            variant="primary"
            fullWidth
            onClick={handleResetPassword}
            loading={loading}
            disabled={!!emailError}
            className="mt-6"
          >
            RECUPERAR SENHA
          </Button>

          <p className="text-center text-gray-600 text-sm mt-6">
            Não tem uma conta?{" "}
            <Link
              href="/createAccount"
              className="text-brand-primary hover:text-brand-primary-hover font-semibold transition-colors"
            >
              Registre-se
            </Link>
          </p>
        </div>

        <PageFooter />
      </ContentCard>
    </main>
  );
}
