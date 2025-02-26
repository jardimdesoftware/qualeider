"use client";

import { useState, useEffect } from "react";
import Logo from "@/assets/Logo.png";
import Button from "@/components/global/button";
import Wave from "@/components/global/waveFooter";
import { Eye, EyeOff } from "lucide-react";
import { apiBase } from "@/services/baseApi";

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
    } catch (error) {
      setErrorMessage("Erro ao fazer login. Verifique suas credenciais.");
      setShowErrorPopup(true); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`flex justify-center items-center min-h-screen p-8 ${isMobile ? "bg-green-background" : ""}`}>
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
              <h1 className="text-2xl font-bold text-gray-900 mt-2">QuaLeiDer</h1>
              <img src={Logo.src} alt="Logo do sistema" className="w-20 h-20" />
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
              {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
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
              {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
            </div>
          </div>

          {/* Esqueci minha senha */}
          <a href="/forgotPassword" className="text-green-700 font-semibold text-sm mt-2 inline-block">
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
            <a href="/createAccount" className="text-green-700 font-semibold">Registre-se</a>
          </p>

          {/* Rodapé */}
          <div className="text-center mt-6 text-gray-500 text-sm">
            <p>© 2025 IFPE - Campus Belo Jardim</p>
            <p>Todos os direitos reservados ao IFPE - Campus Belo Jardim</p>
          </div>
        </div>

        {/* Seção Direita - Informações */}
        <div className="hidden md:flex w-full md:w-1/2 bg-green-background p-16 flex-col justify-between items-center relative">
          <div className="text-center">
            <h1 className="text-2xl text-white mb-4">
              Bem-vindo ao <span className="font-bold">QualeiDer!</span>
            </h1>

            {/* Parágrafos de texto */}
            <div className="text-white space-y-2 text-sm">
              <p>Sua ferramenta essencial para o gerenciamento da produção leiteira.</p>
              <p>Com o <strong>QualeiDer</strong>, você pode:</p>
              <ul className="list-disc list-inside">
                <li><strong>Cadastrar e gerenciar</strong> seus animais de forma simples e organizada.</li>
                <li><strong>Monitorar a produção diária</strong> de leite com precisão e facilidade.</li>
                <li><strong>Acessar gráficos detalhados</strong> para tomar decisões mais inteligentes.</li>
              </ul>
            </div>
          </div>

          {/* Selo na parte inferior */}
          <div className="absolute bottom-4 right-4">
            <img src={Logo.src} alt="Logo do sistema" className="w-20 h-20" />
          </div>
        </div>
      </div>
      <Wave />
    </main>
  );
}