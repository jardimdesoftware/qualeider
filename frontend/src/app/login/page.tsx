"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "/api";

function GoogleLoginError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (!error) return null;

  return (
    <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-700">
      {error}
    </p>
  );
}

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
    <main className="campus-page-shell flex min-h-screen items-center justify-center px-4 py-10">
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

        <div className="px-6 pb-6 pt-6 md:px-8 md:py-8">
          <h2 className="mb-6 text-center text-2xl font-extrabold text-gray-950">
            Entrar
          </h2>

          <Suspense fallback={null}>
            <GoogleLoginError />
          </Suspense>

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

          <a
            href={`${API_ORIGIN}/auth/google`}
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
              <path
                fill="#4285F4"
                d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3.02h3.89c2.28-2.1 3.6-5.2 3.6-8.84z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.89-3.02c-1.08.72-2.45 1.15-4.04 1.15-3.11 0-5.74-2.1-6.68-4.92H1.3v3.09C3.26 21.3 7.3 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.32 14.31A7.2 7.2 0 0 1 4.93 12c0-.8.14-1.58.39-2.31V6.6H1.3A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.3 5.4l4.02-3.09z"
              />
              <path
                fill="#EA4335"
                d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.3 0 3.26 2.7 1.3 6.6l4.02 3.09C6.26 6.87 8.89 4.77 12 4.77z"
              />
            </svg>
            Entrar com Google (email @ifpe.edu.br)
          </a>

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
