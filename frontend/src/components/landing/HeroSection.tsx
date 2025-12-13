import Link from "next/link";
import { ArrowRight, PlayCircle, ShieldCheck } from "lucide-react";

export function HeroSection() {
  return (
    <header className="hero-bg min-h-screen flex items-center relative">
      <div className="container mx-auto px-6 pt-20 text-center md:text-left flex flex-col md:flex-row items-center gap-12">
        {/* Texto Principal */}
        <div className="md:w-2/3 lg:w-1/2">
          <div className="inline-block bg-[#d97706] text-white font-bold px-4 py-1 rounded-full text-xs tracking-widest mb-6 uppercase shadow-lg">
            Gestão Rural Simplificada
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6 brand-font drop-shadow-lg">
            Transforme dados de <span className="text-[#fceeb5]">leite em lucro.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-200 mb-10 leading-relaxed max-w-lg mx-auto md:mx-0 font-light">
            A plataforma completa feita para o produtor rural. Controle seu
            rebanho, monitore a produção e tome decisões certas, sem complicação.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link
              href="/createAccount"
              className="bg-[#4ade80] hover:bg-[#22c55e] text-[#064e3b] font-black py-4 px-8 rounded-lg text-lg transition-transform hover:scale-105 shadow-xl flex items-center justify-center gap-2"
            >
              COMEÇAR AGORA
              <ArrowRight className="w-6 h-6" />
            </Link>
            <button className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-bold py-4 px-8 rounded-lg text-lg transition-colors flex items-center justify-center gap-2">
              <PlayCircle className="w-6 h-6" />
              Ver como funciona 
            </button>
            <p> Criar video depois</p>
          </div>

          <p className="mt-6 text-sm text-slate-400 flex items-center justify-center md:justify-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#4ade80]" />
            Sistema Seguro e Validado pelo IFPE
          </p>
        </div>

        {/* Imagem/Mockup */}
        {/* Escondido no mobile para focar na mensagem */}
        <div className="hidden md:block w-1/3 lg:w-1/2 relative">
          <div className="relative z-10 bg-white p-2 rounded-xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1605000797499-95a51c5269ae?q=80&w=2071&auto=format&fit=crop"
              alt="Dashboard Preview"
              className="rounded-lg w-full h-auto"
            />
            {/* Selo Flutuante */}
            <div className="absolute -bottom-6 -right-6 bg-[#1e3a29] text-white p-4 rounded-lg shadow-xl border-4 border-[#fceeb5]">
              <p className="font-bold text-2xl text-center brand-font">
                +20%
              </p>
              <p className="text-xs uppercase tracking-wider text-[#4ade80]">
                Produtividade
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Onda Divisória */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180">
        <svg
          className="relative block w-[calc(100%+1.3px)] h-[60px]"
          data-name="Layer 1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-[#fdfbf7]"
          ></path>
        </svg>
      </div>
    </header>
  );
}
