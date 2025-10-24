"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Logo from "@/assets/Logo.png";
import Button from "@/components/global/button";
import Wave from "@/components/global/waveFooter";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { apiBase } from "@/services/baseApi";

export default function ForgotPassword() {
  const [isMobile, setIsMobile] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);

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
      setEmailError("E-mail é obrigatório");
    } else if (!regex.test(email)) {
      setEmailError("E-mail inválido");
    } else {
      setEmailError("");
    }
  };

  const handleResetPassword = async () => {
    validateEmail(email);

    if (emailError) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiBase.post("/auth/forgot-password", {
        email,
      });

      if (response.status === 201) {
        localStorage.setItem("resetEmail", email);
        window.location.href = "/resetPassword";
      } else {
        throw new Error(
          response.data.message || "Erro ao enviar e-mail de recuperação"
        );
      }
    } catch (error) {
      console.error("Erro no frontend:", error);
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
      {/* Popup de Erro */}
      {showErrorPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center z-50">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Erro ao Enviar E-mail
            </h2>
            <p className="text-gray-700 mb-4">
              Ocorreu um erro ao tentar enviar o e-mail de recuperação. Tente
              novamente mais tarde.
            </p>
            <button
              onClick={() => setShowErrorPopup(false)}
              className="bg-green-800 text-white px-4 py-2 rounded-lg hover:bg-green-900"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden flex flex-col md:flex-row">
        {/* Seção Esquerda - Recuperação de Senha */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
          <Link href="/login" className="flex items-center text-gray-700 mb-4">
            <ArrowLeft size={20} />
            <span className="ml-2 font-semibold">Voltar</span>
          </Link>
          {isMobile && (
            <div className="flex flex-col items-center mb-4">
              <Image src={Logo} alt="Logo do sistema" className="w-20 h-20" width={80} height={80} />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Esqueceu a Senha?
          </h1>
          <p className="text-center text-gray-700 mb-4">
            Insira seu e-mail para recuperar a senha de acesso da sua conta.
          </p>
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
          <Button
            text={loading ? "Enviando..." : "RECUPERAR SENHA"}
            onClick={handleResetPassword}
            bgColor="bg-green-800"
            textColor="text-white"
            hoverColor="hover:bg-green-900"
            className="w-full mt-4"
            disabled={loading || !!emailError}
          />
          <p className="text-center text-gray-700 mt-4 text-sm">
            Não tem uma conta?{" "}
            <Link
              href="/createAccount"
              className="text-green-700 font-semibold"
            >
              Registre-se
            </Link>
          </p>
        </div>
        {/* Seção Direita - Informações */}
        <div className="hidden md:flex w-full md:w-1/2 bg-green-background p-10 flex-col justify-between items-center relative">
          <div className="text-center">
            <h1 className="text-2xl text-white mb-4">
              Bem-vindo ao <span className="font-bold">QualeiDer!</span>
            </h1>
            <div className="text-white space-y-2 text-sm">
              <p>
                Esqueceu sua senha? Sem problemas! Siga os passos abaixo para
                redefinir sua senha e acessar sua conta novamente:
              </p>
              <ol className="list-decimal list-inside text-left">
                <li>Insira o e-mail cadastrado no campo.</li>
                <li>
                  Clique em &ldquo;Enviar&rdquo; para receber um link de
                  redefinição.
                </li>
                <li>
                  Acesse seu e-mail e siga as instruções para criar uma nova
                  senha.
                </li>
              </ol>
              <p>
                Se você não receber o e-mail em alguns minutos, verifique sua
                caixa de spam ou entre em contato conosco.
              </p>
            </div>
          </div>
          <div className="absolute bottom-4 right-4">
            <Image src={Logo} alt="Logo do sistema" className="w-20 h-20" width={80} height={80} />
          </div>
        </div>
      </div>
      <Wave />
    </main>
  );
}
