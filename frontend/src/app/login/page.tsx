"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BrandHeader,
  ContentCard,
  InputField,
  Button,
  Divider,
  ErrorModal,
} from "@/components/ui";
import { PageFooter } from "@/components/layout";
import { apiBase } from "@/services/baseApi";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email é obrigatório");
      return false;
    } else if (!regex.test(email)) {
      setEmailError("Email inválido");
      return false;
    } else {
      setEmailError("");
      return true;
    }
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError("Senha é obrigatória");
      return false;
    } else if (password.length < 6) {
      setPasswordError("Senha deve ter pelo menos 6 caracteres");
      return false;
    } else {
      setPasswordError("");
      return true;
    }
  };

  const handleLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiBase.post("/auth/login", {
        email,
        password,
      });

      const { data } = response.data;
      const { access_token } = data;

      if (!access_token) {
        throw new Error("Token de acesso inválido ou ausente.");
      }

      localStorage.setItem("authToken", access_token);

      const tokenParts = access_token.split(".");
      if (tokenParts.length < 2) {
        throw new Error("Formato de token inválido.");
      }

      const tokenPayload = JSON.parse(atob(tokenParts[1]));
      const userType = tokenPayload.userType;

      if (userType === "association") {
        router.push("/dashboardAssociation");
      } else if (userType === "user") {
        router.push("/dashboardUser");
      } else {
        throw new Error("Tipo de usuário desconhecido");
      }
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      setErrorMessage("Erro ao fazer login. Verifique suas credenciais.");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
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
        <BrandHeader title="QualeiDer" subtitle="Controle de sua produção leiteira" />

        <div className="p-8 pb-6">
          <h2 className="text-brand-primary text-2xl font-bold text-center mb-6">
            Entrar
          </h2>

          <div className="space-y-4">
            <InputField
              label="E-mail"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) validateEmail(e.target.value);
              }}
              onBlur={(e) => validateEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              error={emailError}
              placeholder="seu@email.com"
              disabled={loading}
            />

            <InputField
              label="Senha"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) validatePassword(e.target.value);
              }}
              onBlur={(e) => validatePassword(e.target.value)}
              onKeyPress={handleKeyPress}
              error={passwordError}
              placeholder="••••••••"
              showPasswordToggle
              disabled={loading}
            />
          </div>

          <div className="mt-3 text-right">
            <Link
              href="/forgotPassword"
              className="text-brand-primary hover:text-brand-primary-hover font-semibold text-sm transition-colors"
            >
              Esqueci minha senha
            </Link>
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={handleLogin}
            loading={loading}
            disabled={!!emailError || !!passwordError}
            className="mt-6"
          >
            ENTRAR
          </Button>

          <Divider text="OU" />

          <p className="text-center text-gray-600 text-sm">
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
