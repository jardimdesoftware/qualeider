"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Logo from "@/assets/Logo.png";
import Button from "@/components/global/button";
import Wave from "@/components/global/waveFooter";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiBase } from "@/services/baseApi";

export default function ResetPassword() {
  const [isMobile, setIsMobile] = useState(false);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [tokenError, setTokenError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    const storedEmail = localStorage.getItem("resetEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      alert("Nenhum e-mail encontrado. Tente novamente.");
      router.push("/forgotPassword");
    }
  }, [router]);

  // Função para validar o token
  const validateToken = (token: string) => {
    if (!token) {
      setTokenError("Token é obrigatório");
    } else {
      setTokenError("");
    }
  };

  // Função para validar a nova senha
  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError("Senha é obrigatória");
    } else if (password.length < 6) {
      setPasswordError("A senha deve ter no mínimo 6 caracteres");
    } else {
      setPasswordError("");
    }
  };

  // Função para validar a confirmação de senha
  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) {
      setConfirmPasswordError("Confirmação de senha é obrigatória");
    } else if (confirmPassword !== password) {
      setConfirmPasswordError("As senhas não coincidem");
    } else {
      setConfirmPasswordError("");
    }
  };

  const handleSubmit = async () => {
    validateToken(token);
    validatePassword(password);
    validateConfirmPassword(confirmPassword);

    if (tokenError || passwordError || confirmPasswordError) {
      return;
    }

    setLoading(true);

    try {
      const response = await apiBase.post("/auth/reset-password", {
        email,
        token,
        newPassword: password,
      });

      if (response.status === 201) {
        setShowSuccessPopup(true);
        localStorage.removeItem("resetEmail");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setErrorMessage("Erro ao redefinir a senha.");
        setShowErrorPopup(true);
      }
    } catch (err) {
      console.error("Erro ao conectar-se à API:", err);
      setErrorMessage("Erro ao conectar-se à API.");
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className={`flex justify-center items-center min-h-screen p-8 ${
        isMobile ? "bg-green-background" : ""
      }`}
    >
      {/* Popup de Sucesso */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-bold text-green-600 mb-4">
              Senha Redefinida!
            </h2>
            <p className="text-gray-700 mb-4">
              Sua senha foi redefinida com sucesso. Redirecionando para o
              login...
            </p>
          </div>
        </div>
      )}

      {/* Popup de Erro */}
      {showErrorPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Erro ao Redefinir Senha
            </h2>
            <p className="text-gray-700 mb-4">{errorMessage}</p>
            <button
              onClick={() => {
                setShowErrorPopup(false);
                router.push("/forgotPassword");
              }}
              className="bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-green-900"
            >
              Solicitar Novo Token
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden flex flex-col md:flex-row">
        {/* Seção Esquerda - Redefinição de Senha */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
          <Link href="/login" className="flex items-center text-gray-700 mb-4">
            <ArrowLeft size={20} />
            <span className="ml-2 font-semibold">Voltar</span>
          </Link>
          {isMobile && (
            <div className="flex flex-col items-center mb-4">
              <Image
                src={Logo}
                alt="Logo do sistema"
                className="w-20 h-20"
                width={80}
                height={80}
              />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Redefinir Senha
          </h1>
          <p className="text-center text-gray-700 mb-4">
            Por favor, insira no campo abaixo o código de ativação que você
            recebeu por e-mail e redefina sua senha.
          </p>
          <div>
            <label className="text-gray-700 font-medium">
              Código (Token) recebido no e-mail
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                validateToken(e.target.value);
              }}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            {tokenError && (
              <p className="text-red-500 text-sm mt-1">{tokenError}</p>
            )}
          </div>
          <div className="mt-4 relative">
            <label className="text-gray-700 font-medium">Nova Senha</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validatePassword(e.target.value);
              }}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}
          </div>
          <div className="mt-4 relative">
            <label className="text-gray-700 font-medium">
              Repita a Nova Senha
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                validateConfirmPassword(e.target.value);
              }}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {confirmPasswordError && (
              <p className="text-red-500 text-sm mt-1">
                {confirmPasswordError}
              </p>
            )}
          </div>
          <Button
            text={loading ? "Aguarde..." : "REDEFINIR SENHA"}
            onClick={handleSubmit}
            bgColor="bg-green-800"
            textColor="text-white"
            hoverColor="hover:bg-green-900"
            className="w-full mt-4"
            disabled={
              loading ||
              !!tokenError ||
              !!passwordError ||
              !!confirmPasswordError
            }
          />
        </div>
        {/* Seção Direita - Informações */}
        <div className="hidden md:flex w-full md:w-1/2 bg-green-background p-20 flex-col justify-between items-center relative">
          <div className="text-center">
            <h1 className="text-2xl text-white mb-4">
              Bem-vindo ao <span className="font-bold">QualeiDer!</span>
            </h1>
            <div className="text-white space-y-2 text-sm">
              <p>
                Redefina sua senha! Por favor, insira o token que você recebeu
                por e-mail e crie uma nova senha:
              </p>
              <ol className="list-decimal list-inside text-left">
                <li>Token: Insira o código enviado para o seu e-mail.</li>
                <li>Nova Senha: Crie uma senha segura.</li>
                <li>
                  Confirme a Nova Senha: Digite a senha novamente para
                  confirmar.
                </li>
              </ol>
              <p>
                Clique em <strong>&ldquo;Redefinir Senha&rdquo;</strong> para
                concluir o processo.
              </p>
            </div>
          </div>
          <div className="absolute bottom-4 right-4">
            <Image
              src={Logo}
              alt="Logo do sistema"
              className="w-20 h-20"
              width={80}
              height={80}
            />
          </div>
        </div>
      </div>
      <Wave />
    </main>
  );
}
