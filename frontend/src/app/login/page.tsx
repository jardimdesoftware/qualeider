"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  BrandHeader,
  ContentCard,
  InputField,
  Button,
  Divider,
  ErrorModal,
} from "@/components/ui";
import { PageFooter } from "@/components/layout";
import { authService } from "@/services/authService";
import { loginSchema, LoginData } from "@/schemas/auth";
import { getFriendlyErrorMessage } from "@/utils/errorMessage";
import { useLogin } from "@/hooks/queries/useAuth";

export default function Login() {
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { mutate: login, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const isSubmitting = isPending || isFormSubmitting;

  const onSubmit = (data: LoginData) => {
    login(data, {
      onError: (err: any) => {
        console.error(err);
        setErrorMessage(getFriendlyErrorMessage(err));
        setShowErrorModal(true);
      },
    });
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
          <h2 className="text-brand-primary text-2xl font-bold text-center mb-6">
            Entrar
          </h2>

          {/* Uso da tag FORM para suporte nativo a 'Enter' */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <InputField
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              disabled={isSubmitting}
              error={errors.email?.message}
              {...register("email")}
            />

            <InputField
              label="Senha"
              showPasswordToggle
              placeholder="••••••••"
              disabled={isSubmitting}
              error={errors.password?.message}
              {...register("password")}
            />

            <div className="mt-3 text-right">
              <Link
                href="/forgotPassword"
                className="text-brand-primary hover:text-brand-primary-hover font-semibold text-sm transition-colors"
              >
                Esqueci minha senha
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isSubmitting}
              className="mt-6"
            >
              {isSubmitting ? "ENTRANDO..." : "ENTRAR"}
            </Button>
          </form>

          <Divider text="OU" />

          <p className="text-center text-gray-600 text-sm mt-4">
            Não tem uma conta?{" "}
            <Link
              href="/createAccount"
              className="text-brand-primary hover:text-brand-primary-hover font-semibold transition-colors"
            >
              Criar Conta
            </Link>
          </p>
        </div>

        <PageFooter />
      </ContentCard>
    </main>
  );
}
