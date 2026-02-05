"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Cat, Settings, LogOut, Bell, BarChart3 } from "lucide-react";
import { associationService } from "@/services/associationService";
import { getUserIdFromToken, clearAuthToken } from "@/utils/auth";
import { useAssociation } from "@/hooks/queries/useAssociation";

export function AssociationSidebar() {
  const pathname = usePathname();
  /* 
     NOTE: We are using a client-side only hook here, but relying on the token 
     availability. Ideally this ID should come from a context or auth hook.
  */
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    // We still need this effect only to get the ID from local storage once on mount
    const id = getUserIdFromToken();
    if (id) setUserId(id);
  }, []);

  const { data: association, isLoading } = useAssociation(userId);

  const handleLogout = () => {
    clearAuthToken();
    window.location.href = "/";
  };

  return (
    <aside className="w-64 bg-white flex-shrink-0 hidden md:flex flex-col border-r border-slate-200 shadow-sm h-screen sticky top-0 z-20">
      
      {/* Área da Logo */}
      <div className="p-6 flex flex-col items-center border-b border-slate-100">
        <div className="mb-3">
          <img 
            src="/logo_icon.svg" 
            alt="Logo Associação" 
            className="h-12 w-12 object-contain"
          />
        </div>
        <h1 className="brand-font font-bold text-xl tracking-wide text-center text-[#1e3a29]">
          {isLoading ? "Carregando..." : (association?.name || "Associação")}
        </h1>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2 bg-slate-50 px-2 py-1 rounded border border-slate-100">
          Administrador
        </p>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-6 space-y-1 px-3">
        <Link
          href="/dashboardAssociation"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
            pathname === "/dashboardAssociation"
              ? "bg-[#fff7ed] text-[#d97706] border-l-4 border-[#d97706] font-bold"
              : "text-slate-600 hover:bg-slate-50 hover:text-[#1e3a29]"
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${pathname === "/dashboardAssociation" ? "text-[#d97706]" : "group-hover:text-[#d97706] transition-colors"}`} />
          <span className="font-medium">Visão Regional</span>
        </Link>

        <Link
          href="/dashboardAssociation/associates"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
            pathname === "/dashboardAssociation/associates"
              ? "bg-[#fff7ed] text-[#d97706] border-l-4 border-[#d97706] font-bold"
              : "text-slate-600 hover:bg-slate-50 hover:text-[#1e3a29]"
          }`}
        >
          <Users className={`w-5 h-5 ${pathname === "/dashboardAssociation/associates" ? "text-[#d97706]" : "group-hover:text-[#d97706] transition-colors"}`} />
          <span className="font-medium">Associados</span>
        </Link>

        <Link
          href="/dashboardAssociation/herd"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
            pathname === "/dashboardAssociation/herd"
              ? "bg-[#fff7ed] text-[#d97706] border-l-4 border-[#d97706] font-bold"
              : "text-slate-600 hover:bg-slate-50 hover:text-[#1e3a29]"
          }`}
        >
          <Cat className={`w-5 h-5 ${pathname === "/dashboardAssociation/herd" ? "text-[#d97706]" : "group-hover:text-[#d97706] transition-colors"}`} />
          <span className="font-medium">Rebanho Regional</span>
        </Link>

        <Link
          href="/dashboardAssociation/reports"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
            pathname === "/dashboardAssociation/reports"
              ? "bg-[#fff7ed] text-[#d97706] border-l-4 border-[#d97706] font-bold"
              : "text-slate-600 hover:bg-slate-50 hover:text-[#1e3a29]"
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${pathname === "/dashboardAssociation/reports" ? "text-[#d97706]" : "group-hover:text-[#d97706] transition-colors"}`} />
          <span className="font-medium">Relatórios</span>
        </Link>
        
        <Link
          href="/dashboardAssociation/notifications"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
            pathname === "/dashboardAssociation/notifications"
              ? "bg-[#fff7ed] text-[#d97706] border-l-4 border-[#d97706] font-bold"
              : "text-slate-600 hover:bg-slate-50 hover:text-[#1e3a29]"
          }`}
        >
          <Bell className={`w-5 h-5 ${pathname === "/dashboardAssociation/notifications" ? "text-[#d97706]" : "group-hover:text-[#d97706] transition-colors"}`} />
          <span className="font-medium">Notificações</span>
        </Link>

        <div className="pt-4 mt-4 border-t border-slate-100">
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
              pathname === "/settings"
                ? "bg-[#fff7ed] text-[#d97706] border-l-4 border-[#d97706] font-bold"
                : "text-slate-600 hover:bg-slate-50 hover:text-[#1e3a29]"
            }`}
          >
            <Settings className={`w-5 h-5 ${pathname === "/settings" ? "text-[#d97706]" : "group-hover:text-[#d97706] transition-colors"}`} />
            <span className="font-medium">Configurações</span>
          </Link>
        </div>
      </nav>

      {/* Footer da Sidebar */}
      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-all w-full text-left"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
}
