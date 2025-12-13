import Link from "next/link";
import { Instagram, Facebook, Youtube, Phone, Mail } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="bg-[#0f1f15] text-slate-400 py-12 border-t border-[#ffffff10]">
      <div className="container mx-auto px-6 grid md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl font-black text-white brand-font">
              QualeiDer
            </span>
          </div>
          <p className="text-sm max-w-xs mb-6">
            Desenvolvido com tecnologia de ponta e conhecimento de campo para
            impulsionar a pecuária leiteira.
          </p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition">
              <Instagram className="w-6 h-6" />
            </a>
            <a href="#" className="hover:text-white transition">
              <Facebook className="w-6 h-6" />
            </a>
            <a href="#" className="hover:text-white transition">
              <Youtube className="w-6 h-6" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">
            Acesso Rápido
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/login" className="hover:text-[#d97706] transition">
                Login
              </Link>
            </li>
            <li>
              <Link
                href="/createAccount"
                className="hover:text-[#d97706] transition"
              >
                Cadastro
              </Link>
            </li>
            <li>
              <a href="#" className="hover:text-[#d97706] transition">
                Suporte
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">
            Contato
          </h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4" /> (81) 9999-9999
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4" /> contato@qualeider.com
            </li>
          </ul>
          <div className="mt-6 pt-6 border-t border-[#ffffff10]">
            <p className="text-xs">© 2025 IFPE - Campus Belo Jardim</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
