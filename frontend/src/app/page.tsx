"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Logo from "@/assets/Logo.png";
import Button from "@/components/global/button";
import Wave from "@/components/global/waveFooter";
import Footer from "@/components/global/Footer";
import WelcomeInfo from "@/components/global/WelcomeInfo";

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
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
    // Função para verificar o tamanho da tela
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md no Tailwind equivale a 768px
    };

    checkScreenSize(); // Checa o tamanho ao carregar a página
    window.addEventListener("resize", checkScreenSize); // Atualiza ao redimensionar

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <main
      className={`flex justify-center items-center min-h-screen p-8 ${
        isMobile ? "bg-green-background" : ""
      }`}
    >
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
            O que você deseja fazer?
          </h1>

          {/* Botão "ACESSAR CONTA" */}
          <Button
            text="ACESSAR CONTA"
            href="/login"
            bgColor="bg-green-800"
            textColor="text-white"
            hoverColor="hover:bg-green-900"
          />

          {/* Divisor "OU" */}
          <div className="flex items-center justify-center my-4">
            <div className="border-t border-gray-300 flex-grow"></div>
            <span className="mx-4 text-gray-500">OU</span>
            <div className="border-t border-gray-300 flex-grow"></div>
          </div>

          {/* Botão "CADASTRAR CONTA" */}
          <Button
            text="CADASTRAR CONTA"
            href="/createAccount"
            bgColor="bg-gray-600"
            textColor="text-white"
            hoverColor="hover:bg-gray-700"
          />

          <Footer className="mt-6" />
        </div>

        {/* Seção Direita - Informações */}
        <div className="hidden md:flex w-full md:w-1/2 bg-green-background p-12 flex-col justify-between items-center relative">
          <div className="text-center">
            <h1 className="text-2xl text-white mb-4">
              Bem-vindo ao{" "}
              <span className="font-bold text-white">QualeiDer!</span>
            </h1>

            {/* Parágrafos de texto */}
            <WelcomeInfo />
          </div>

          {/* Selo na parte inferior */}
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
