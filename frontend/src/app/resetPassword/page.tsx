"use client";

import { useState, useEffect } from "react";
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

export default function ResetPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  const [tokenError, setTokenError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const storedEmail = localStorage.getItem("resetEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      alert("Nenhum e-mail encontrado. Tente novamente.");
      router.push("/forgotPassword");
    }
  }, [router]);

  const handleValidateToken = async () => {
    if (!token) {
      setTokenError("Código é obrigatório");
      return;
    }

    if (!/^\d{6}$/.test(token)) {
      setTokenError("O código deve ter exatamente 6 dígitos");
      return;
    }

    if (attempts >= maxAttempts) {
      setErrorMessage(
        "Você excedeu o número máximo de tentativas. Solicite um novo código."
      );
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    setTokenError("");

    try {
      const response = await apiBase.post("/auth/validate-reset-token", {
        email,
        token,
      });

      if (response.status === 200 || response.status === 201) {
        setAttempts(0);
        setStep(2);
      }
    } catch (err: any) {
      console.error("Erro ao validar token:", err);

      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (err.response) {
        if (err.response.status === 401) {
          if (newAttempts >= maxAttempts) {
            setErrorMessage(
              `Código inválido ou expirado. Você excedeu o número máximo de tentativas (${maxAttempts}). Solicite um novo código.`
            );
            setShowErrorModal(true);
          } else {
            setTokenError(
              `Código inválido ou expirado. Tentativa ${newAttempts} de ${maxAttempts}.`
            );
            setToken("");
          }
        } else if (err.response.status === 404) {
          setErrorMessage("Usuário não encontrado.");
          setShowErrorModal(true);
        } else {
          setErrorMessage(
            err.response.data.message || "Erro ao validar código."
          );
          setShowErrorModal(true);
        }
      } else {
        setErrorMessage("Erro ao conectar com o servidor.");
        setShowErrorModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError("Senha é obrigatória");
      return false;
    } else if (password.length < 6) {
      setPasswordError("A senha deve ter no mínimo 6 caracteres");
      return false;
    } else {
      setPasswordError("");
      return true;
    }
  };

  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) {
      setConfirmPasswordError("Confirmação de senha é obrigatória");
      return false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError("As senhas não coincidem");
      return false;
    } else {
      setConfirmPasswordError("");
      return true;
    }
  };

  const handleSubmit = async () => {
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      const response = await apiBase.post("/auth/reset-password", {
        email,
        token,
        newPassword: password,
      });

      if (response.status === 200 || response.status === 201) {
        setShowSuccessModal(true);
        localStorage.removeItem("resetEmail");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err: any) {
      console.error("Erro ao redefinir senha:", err);

      if (err.response) {
        if (err.response.status === 401) {
          setErrorMessage("Código inválido ou expirado.");
        } else {
          setErrorMessage(
            err.response.data.message || "Erro ao redefinir senha."
          );
        }
      } else {
        setErrorMessage("Erro ao conectar com o servidor.");
      }

      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <ErrorModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Sucesso!"
        message="Sua senha foi redefinida com sucesso. Redirecionando para o login..."
      />

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => {
          setShowErrorModal(false);
          router.push("/forgotPassword");
        }}
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

          <h2 className="text-brand-primary text-2xl font-bold text-center mb-6">
            Redefinir Senha
          </h2>

          {step === 1 && (
            <>
              <p className="text-center text-gray-600 mb-4 text-sm">
                Insira o código de 6 dígitos enviado por e-mail
              </p>

              <InputField
                label="Código de Verificação (6 dígitos)"
                type="text"
                value={token}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setToken(value);
                  if (tokenError) setTokenError("");
                }}
                maxLength={6}
                placeholder="000000"
                error={tokenError}
                disabled={loading}
                className="text-center text-2xl tracking-widest"
              />

              {attempts > 0 && attempts < maxAttempts && !tokenError && (
                <p className="text-amber-600 text-xs mt-2 text-center">
                  Tentativas restantes: {maxAttempts - attempts}
                </p>
              )}

              <Button
                variant="primary"
                fullWidth
                onClick={handleValidateToken}
                loading={loading}
                disabled={token.length !== 6 || attempts >= maxAttempts}
                className="mt-6"
              >
                VALIDAR CÓDIGO
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-center text-gray-600 mb-6 text-sm">
                Código validado! Defina sua nova senha
              </p>

              <div className="space-y-4">
                <InputField
                  label="Nova Senha"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) validatePassword(e.target.value);
                  }}
                  onBlur={(e) => validatePassword(e.target.value)}
                  error={passwordError}
                  showPasswordToggle
                  disabled={loading}
                  placeholder="••••••••"
                />

                <InputField
                  label="Confirmar Nova Senha"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError)
                      validateConfirmPassword(e.target.value);
                  }}
                  onBlur={(e) => validateConfirmPassword(e.target.value)}
                  error={confirmPasswordError}
                  showPasswordToggle
                  disabled={loading}
                  placeholder="••••••••"
                />
              </div>

              <Button
                variant="primary"
                fullWidth
                onClick={handleSubmit}
                loading={loading}
                disabled={!!passwordError || !!confirmPasswordError}
                className="mt-6"
              >
                REDEFINIR SENHA
              </Button>
            </>
          )}
        </div>

        <PageFooter />
      </ContentCard>
    </main>
  );
}
