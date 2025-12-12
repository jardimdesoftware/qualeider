import Link from "next/link";
import { User } from "lucide-react";

export function LandingNavbar() {
  return (
    <nav className="fixed w-full z-50 bg-[#1e3a29]/95 backdrop-blur-sm border-b border-[#ffffff10] shadow-lg">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="#1e3a29"
              stroke="#fceeb5"
              strokeWidth="4"
            />
            <path
              d="M30 45 C25 35 30 25 35 25 L40 30 H60 L65 25 C70 25 75 35 70 45 L70 70 C70 80 45 80 45 80 C45 80 30 80 30 70 Z"
              fill="white"
            />
          </svg>
          <span className="text-2xl font-black text-white brand-font tracking-wide">
            QualeiDer
          </span>
        </div>

        {/* Botão Entrar */}
        <Link
          href="/login"
          className="bg-[#d97706] hover:bg-[#b45309] text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md flex items-center gap-2"
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Área do Produtor</span>
        </Link>
      </div>
    </nav>
  );
}
