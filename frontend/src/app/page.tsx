"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { ArrowRight, Sparkles, Shield, TrendingUp } from "lucide-react";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a29] via-[#2d5a40] to-[#1e3a29]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        
        <div className="relative container mx-auto px-6 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo/Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 mb-8">
              <Sparkles className="w-5 h-5 text-[#d97706]" />
              <span className="text-white font-semibold">Gestão Rural Inteligente</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              QualeiDer
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-12 font-light leading-relaxed">
              Plataforma completa para gerenciamento de produção leiteira.
              <br className="hidden md:block" />
              Transforme dados em resultados.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button
                onClick={() => router.push("/login")}
                variant="primary"
                className="bg-white hover:bg-slate-100 text-[#1e3a29] px-8 py-6 text-lg font-bold rounded-xl shadow-2xl hover:shadow-xl transition-all"
              >
                Acessar Sistema
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                onClick={() => router.push("/createAccount")}
                variant="outline"
                className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-bold rounded-xl backdrop-blur-sm"
              >
                Criar Conta
              </Button>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all">
                <div className="bg-[#d97706] w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Aumente a Produtividade
                </h3>
                <p className="text-white/80 text-sm">
                  Monitore coletas, animais e tome decisões baseadas em dados reais
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all">
                <div className="bg-[#4ade80] w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Gestão Segura
                </h3>
                <p className="text-white/80 text-sm">
                  Seus dados protegidos com tecnologia de ponta
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 hover:bg-white/15 transition-all">
                <div className="bg-[#d97706] w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Interface Moderna
                </h3>
                <p className="text-white/80 text-sm">
                  Fácil de usar, rápida e intuitiva para todos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-white/60 text-sm">
            © 2025 QualeiDer. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
