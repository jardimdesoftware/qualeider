"use client";

import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Users,
  FileText,
  PieChart,
  LogOut,
  Milk,
  Dna,
} from "lucide-react";
import { getUserTypeFromToken, clearAuthToken } from "@/utils/auth";
import { debounce } from "@/utils/debounce";
import { BREAKPOINTS, ICON_SIZES, LOGO_SIZES, TIMING } from "@/constants/ui";

export default function Sidebar() {
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<"association" | "user" | null>(null);
  const [pathname, setPathname] = useState("");
  const [mounted, setMounted] = useState(false);

  const debouncedCheckScreenSize = useMemo(
    () =>
      debounce(() => {
        setIsMobile(window.innerWidth < BREAKPOINTS.MOBILE);
      }, TIMING.DEBOUNCE_SHORT),
    []
  );

  useEffect(() => {
    setMounted(true);
    setPathname(window.location.pathname);

    const role = getUserTypeFromToken();
    setUserRole(role);

    debouncedCheckScreenSize();
    window.addEventListener("resize", debouncedCheckScreenSize);

    return () => window.removeEventListener("resize", debouncedCheckScreenSize);
  }, [debouncedCheckScreenSize]);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleLogout = () => {
    clearAuthToken();
    window.location.href = "/login";
  };

  /**
   * Menu do usuário logado (ADMIN ou VAQUEIRO).
   * Notificações e Configurações removidos do fluxo principal.
   * O menu de Associação está em stand-by — não é exibido.
   */
  const menuItems = [
    { name: "Início", link: "/dashboardUser", icon: <PieChart size={ICON_SIZES.SM} /> },
    { name: "Dados diários", link: "/dailyForm", icon: <Milk size={ICON_SIZES.SM} /> },
    { name: "Meus Animais", link: "/manageMyAnimals", icon: <FileText size={ICON_SIZES.SM} /> },
    { name: "Raças", link: "/dashboardUser/breeds", icon: <Dna size={ICON_SIZES.SM} /> },
    { name: "Funcionários", link: "/manageUsers", icon: <Users size={ICON_SIZES.SM} /> },
  ];

  if (!mounted) return <div className="w-64" />;

  return (
    <div>
      {isMobile ? (
        <div className="relative">
          {/* Barra superior mobile */}
          <div className="fixed top-0 left-0 right-0 bg-green-background p-4 flex justify-between items-center z-40 shadow-md">
            <button onClick={toggleMenu} className="text-white">
              {menuOpen ? <X size={ICON_SIZES.MD} /> : <Menu size={ICON_SIZES.MD} />}
            </button>
            <h2 className="text-white font-bold text-lg">QualeiDer</h2>
          </div>

          {/* Gaveta lateral mobile */}
          <div
            className={`fixed top-0 left-0 h-screen w-64 bg-green-background shadow-lg p-4 transition-transform duration-300 z-50 ${
              menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <button
              onClick={toggleMenu}
              className="absolute top-4 right-4 text-white"
            >
              <X size={ICON_SIZES.MD} />
            </button>

            <div className="flex items-center gap-2 p-4">
              <Image
                src="/logo_icon.svg"
                alt="Logo"
                className="w-10 h-10"
                width={LOGO_SIZES.MD}
                height={LOGO_SIZES.MD}
              />
              <h2 className="text-white font-bold text-lg">QualeiDer</h2>
            </div>

            <nav className="mt-6 space-y-4">
              {menuItems.map((item) => (
                <Link
                  key={item.link}
                  href={item.link}
                  className={`flex items-center gap-2 p-3 rounded-lg transition-colors duration-200 ${
                    pathname === item.link
                      ? "text-gray-900 bg-white"
                      : "text-white hover:bg-gray-200 hover:text-gray-900"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="absolute bottom-4 left-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-white p-3 rounded-lg hover:bg-red-600"
              >
                <LogOut size={ICON_SIZES.SM} />
                Sair
              </button>
            </div>
          </div>
        </div>
      ) : (
        <aside className="h-screen w-64 bg-green-background shadow-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 p-4">
              <Image
                src="/logo_icon.svg"
                alt="Logo"
                className="w-10 h-10"
                width={LOGO_SIZES.MD}
                height={LOGO_SIZES.MD}
              />
              <h2 className="text-white font-bold text-lg">QualeiDer</h2>
            </div>

            <nav className="mt-6 space-y-4">
              {menuItems.map((item) => (
                <Link
                  key={item.link}
                  href={item.link}
                  className={`flex items-center gap-2 p-3 rounded-lg transition-colors duration-200 ${
                    pathname === item.link
                      ? "text-gray-900 bg-white"
                      : "text-white hover:bg-gray-200 hover:text-gray-900"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="p-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-white p-3 rounded-lg hover:bg-red-600 hover:text-white w-full transition-colors duration-200"
            >
              <LogOut size={ICON_SIZES.SM} />
              Sair
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
