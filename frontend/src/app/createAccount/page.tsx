"use client";

import { useRouter } from "next/navigation";
import Wave from "@/components/global/waveFooter";
import { useIsMobile } from "@/hooks";
import { Building2, User } from "lucide-react";
import { useEffect, useState } from "react";
import InfoSidebar from "@/components/global/InfoSidebar";
import { accountSelectionSidebarData } from "@/constants/sidebarData";
import Footer from "@/components/global/Footer";

export default function CreateAccount() {
  const router = useRouter();
  const isMobile = useIsMobile();
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

  return (
    <main
      className={`flex justify-center items-center min-h-screen p-8 ${
        isMobile ? "bg-green-background" : ""
      }`}
    >
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg overflow-hidden flex flex-col md:flex-row">
        {/* Lado Esquerdo - Formulário */}
        <div className="w-full p-8 md:p-16 flex flex-col justify-center items-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
            Bem-vindo ao QualeiDer!
          </h1>
          <p className="text-gray-600 mb-8 text-center">
            Escolha o tipo de cadastro que deseja realizar
          </p>

          <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl items-stretch">
            {/* Card Produtor */}
            <button
              onClick={() => router.push("/createProducer")}
              className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-2 border-green-300 hover:border-green-500 rounded-xl p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex-1 flex flex-col"
            >
              <div className="flex flex-col items-center text-center flex-grow">
                <div className="bg-green-600 group-hover:bg-green-700 rounded-full p-6 transition-colors duration-300 mb-4">
                  <User size={48} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Sou Produtor
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  Cadastre-se como produtor de leite para gerenciar sua
                  produção, animais e acompanhar métricas detalhadas.
                </p>
              </div>
              <div className="mt-auto pt-4 flex items-center justify-center text-green-700 font-semibold">
                <span>Continuar</span>
                <svg
                  className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>

            {/* Card Associação */}
            <button
              onClick={() => router.push("/createAssociation")}
              className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-300 hover:border-blue-500 rounded-xl p-8 transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex-1 flex flex-col"
            >
              <div className="flex flex-col items-center text-center flex-grow">
                <div className="bg-blue-600 group-hover:bg-blue-700 rounded-full p-6 transition-colors duration-300 mb-4">
                  <Building2 size={48} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Sou Associação
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  Cadastre sua associação de produtores para gerenciar
                  associados, relatórios agregados e análises regionais.
                </p>
              </div>
              <div className="mt-auto pt-4 flex items-center justify-center text-blue-700 font-semibold">
                <span>Continuar</span>
                <svg
                  className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          </div>

          <p className="text-center text-gray-700 mt-8 text-sm">
            Já possui uma conta?{" "}
            <a
              href="/login"
              className="text-green-700 font-semibold hover:underline"
            >
              Faça login
            </a>
          </p>

          <Footer className="mt-8" />
        </div>

        {/* Lado Direito - Informações (Desktop) */}
        {!isMobile && (
          <InfoSidebar
            title={accountSelectionSidebarData.title}
            subtitle={accountSelectionSidebarData.subtitle}
            items={accountSelectionSidebarData.items}
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
