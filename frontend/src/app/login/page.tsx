"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Logo from "@/assets/Logo.png";
import Button from "@/components/global/button";
import Wave from "@/components/global/waveFooter";
import { Eye, EyeOff } from "lucide-react";
import { apiBase } from "@/services/baseApi";
import InfoSidebar from "@/components/global/InfoSidebar";
import { loginSidebarData } from "@/constants/sidebarData";
import Footer from "@/components/global/Footer";

export default function Login() {
  const [isMobile, setIsMobile] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showWave, setShowWave] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollThreshold = 0.8;
      setShowWave(scrollPosition > maxScroll * scrollThreshold);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email é obrigatório");
    } else if (!regex.test(email)) {
      setEmailError("Email inválido");
    } else {
      setEmailError("");
    }
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError("Senha é obrigatória");
    } else if (password.length < 6) {
      setPasswordError("Senha deve ter pelo menos 6 caracteres");
    } else {
      setPasswordError("");
    }
  };

  const handleLogin = async () => {
    validateEmail(email);
    validatePassword(password);

    if (emailError || passwordError) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiBase.post("/auth/login", {
        email,
        password,
      });

      const { access_token } = response.data;

      localStorage.setItem("authToken", access_token);

      const tokenPayload = JSON.parse(atob(access_token.split(".")[1]));
      const userRole = tokenPayload.role;

      if (userRole === "Admin") {
        window.location.href = "/dashboardAdmin";
      } else if (userRole === "Common") {
        window.location.href = "/dashboardCommon";
      } else {
        throw new Error("Tipo de usuário desconhecido");
      }

      console.log("Token recebido:", access_token);
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      setErrorMessage("Erro ao fazer login. Verifique suas credenciais.");
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
      {/* Popout de Erro */}
      {showErrorPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">Erro</h2>
            <p className="text-gray-700 mb-4">{errorMessage}</p>
            <button
              onClick={() => setShowErrorPopup(false)}
              className="bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-green-900"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Container Central */}
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden flex flex-col md:flex-row">
        {/* Seção Esquerda - Login */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
          {/* Exibe a logo e o nome QuaLeiDer apenas no mobile */}
          {isMobile && (
            <div className="flex flex-col items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                QuaLeiDer
              </h1>
              <Image
                src={Logo}
                alt="Logo do sistema"
                className="w-20 h-20"
                width={80}
                height={80}
              />
            </div>
          )}

          {/* Título */}
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Login
          </h1>

          {/* Campos de entrada */}
          <div className="space-y-4">
            <div>
              <label className="text-gray-700 font-medium">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  validateEmail(e.target.value);
                }}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              {emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
              )}
            </div>
            <div className="relative">
              <label className="text-gray-700 font-medium">Senha</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  validatePassword(e.target.value);
                }}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>
          </div>

          {/* Esqueci minha senha */}
          <a
            href="/forgotPassword"
            className="text-green-700 font-semibold text-sm mt-2 inline-block"
          >
            Esqueci minha senha
          </a>

          {/* Botão "ENTRAR" */}
          <Button
            text={loading ? "Entrando..." : "ENTRAR"}
            onClick={handleLogin}
            bgColor="bg-green-800"
            textColor="text-white"
            hoverColor="hover:bg-green-900"
            className="w-full mt-4"
            disabled={loading || !!emailError || !!passwordError}
          />

          {/* Link de registro */}
          <p className="text-center text-gray-700 mt-4 text-sm">
            Não tem uma conta?{" "}
            <a href="/createAccount" className="text-green-700 font-semibold">
              Criar Conta
            </a>
          </p>

          <p className="text-center text-gray-700 mt-2 text-sm opacity-0">
            É uma associação?{" "}
            <a
              href="/createAssociation"
              className="text-green-700 font-semibold"
            >
              Cadastre sua Associação
            </a>
          </p>

          <Footer className="mt-6" />
        </div>

        {/* Seção Direita - Informações */}
        {!isMobile && (
          <InfoSidebar
            title={loginSidebarData.title}
            subtitle={loginSidebarData.subtitle}
            items={loginSidebarData.items}
          />
        )}
      </div>
      {/* Wave - Aparece apenas ao scroll */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
          showWave ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <Wave />
      </div>
    </main>
  );
}
