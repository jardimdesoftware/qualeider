"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, User } from "lucide-react";
import { BrandHeader, ContentCard } from "@/components/ui";
import { PageFooter } from "@/components/layout";

export default function CreateAccount() {
  const router = useRouter();

  return (
    <main className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <ContentCard className="max-w-2xl">
        <BrandHeader
          title="QualeiDer"
          subtitle="Controle de sua produção leiteira"
        />

        <div className="p-8 pb-6">
          <h2 className="text-brand-primary text-2xl font-bold text-center mb-2">
            Bem-vindo!
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Escolha o tipo de cadastro
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push("/createProducer")}
              className="group bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 
                border-2 border-green-300 hover:border-brand-primary rounded-xl p-6 transition-all duration-300 
                transform hover:scale-105 hover:shadow-lg"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-brand-primary group-hover:bg-brand-primary-hover rounded-full p-4 transition-colors duration-300 mb-3">
                  <User size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-brand-primary mb-2">
                  Sou Produtor
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Gerencie sua produção, animais e métricas
                </p>
                <div className="flex items-center text-brand-primary font-semibold text-sm">
                  <span>Continuar</span>
                  <svg
                    className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
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
              </div>
            </button>

            <button
              onClick={() => router.push("/createAssociation")}
              className="group bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 
                border-2 border-amber-300 hover:border-brand-secondary rounded-xl p-6 transition-all duration-300 
                transform hover:scale-105 hover:shadow-lg"
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-brand-secondary group-hover:bg-[#b45309] rounded-full p-4 transition-colors duration-300 mb-3">
                  <Building2 size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-brand-secondary mb-2">
                  Sou Associação
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  Gerencie associados e análises regionais
                </p>
                <div className="flex items-center text-brand-secondary font-semibold text-sm">
                  <span>Continuar</span>
                  <svg
                    className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
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
              </div>
            </button>
          </div>

          <p className="text-center text-gray-600 text-sm mt-6">
            Já possui uma conta?{" "}
            <Link
              href="/login"
              className="text-brand-primary hover:text-brand-primary-hover font-semibold transition-colors"
            >
              Faça login
            </Link>
          </p>
        </div>

        <PageFooter />
      </ContentCard>
    </main>
  );
}
