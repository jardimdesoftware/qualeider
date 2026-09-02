"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Dna,
  FileText,
  LogOut,
  Menu,
  Milk,
  PieChart,
  Users,
  X,
} from "lucide-react";
import {
  clearAuthToken,
  getUserRoleFromToken,
  getUserTypeFromToken,
} from "@/utils/auth";
import { debounce } from "@/utils/debounce";
import { BREAKPOINTS, ICON_SIZES, LOGO_SIZES, TIMING } from "@/constants/ui";
import AppVersionBadge from "@/components/global/AppVersionBadge";
import { IfpeBrand } from "@/components/ui";

const menuItemsBase = [
  {
    name: "Início",
    link: "/dashboardUser",
    icon: <PieChart size={ICON_SIZES.SM} />,
    adminOnly: false,
  },
  {
    name: "Dados diários",
    link: "/dailyForm",
    icon: <Milk size={ICON_SIZES.SM} />,
    adminOnly: false,
  },
  {
    name: "Meus Animais",
    link: "/manageMyAnimals",
    icon: <FileText size={ICON_SIZES.SM} />,
    adminOnly: false,
  },
  {
    name: "Raças",
    link: "/dashboardUser/breeds",
    icon: <Dna size={ICON_SIZES.SM} />,
    adminOnly: true,
  },
  {
    name: "Tipos de Animal",
    link: "/dashboardUser/animalSpecies",
    icon: <Dna size={ICON_SIZES.SM} />,
    adminOnly: true,
  },
  {
    name: "Funcionários",
    link: "/manageUsers",
    icon: <Users size={ICON_SIZES.SM} />,
    adminOnly: true,
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<"association" | "user" | null>(
    null,
  );
  const [userPermRole, setUserPermRole] = useState<"ADMIN" | "VAQUEIRO" | null>(
    null,
  );
  const [mounted, setMounted] = useState(false);

  const debouncedCheckScreenSize = useMemo(
    () =>
      debounce(() => {
        setIsMobile(window.innerWidth < BREAKPOINTS.MOBILE);
      }, TIMING.DEBOUNCE_SHORT),
    [],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- window/token so existem no client, roda 1x no mount
    setMounted(true);
    setUserRole(getUserTypeFromToken());
    setUserPermRole(getUserRoleFromToken());
    debouncedCheckScreenSize();
    window.addEventListener("resize", debouncedCheckScreenSize);

    return () => window.removeEventListener("resize", debouncedCheckScreenSize);
  }, [debouncedCheckScreenSize]);

  const handleLogout = () => {
    clearAuthToken();
    router.push("/login");
  };

  const isAdmin = userPermRole === "ADMIN";
  const menuItems = menuItemsBase.filter((item) => !item.adminOnly || isAdmin);
  const activeClasses = isAdmin
    ? "border-gov-blue bg-blue-50 text-gov-blue"
    : "border-brand-primary bg-brand-accent text-brand-primary";

  if (!mounted) return <div className="w-72" />;

  const brandBlock = (
    <div className="p-4">
      <IfpeBrand />
      <div className="mt-5 flex items-center gap-3 border-t border-brand-border pt-5">
        <Image
          src="/logo_cow.png"
          alt="Logo QuaLeiDer"
          className="h-10 w-10 rounded-md border border-brand-border bg-white p-1"
          width={LOGO_SIZES.MD}
          height={LOGO_SIZES.MD}
        />
        <div>
          <h2 className="text-lg font-extrabold leading-tight text-gray-950">
            QuaLeiDer
          </h2>
          <p className="text-[11px] font-semibold text-brand-muted">
            {userRole === "association" ? "Associação" : "Sistema pecuário"}
          </p>
          {isAdmin && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-gov-blue">
              Administrador
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const nav = (
    <nav className="mt-4 space-y-2">
      {menuItems.map((item) => (
        <Link
          key={item.link}
          href={item.link}
          onClick={() => setMenuOpen(false)}
          className={`flex items-center gap-2 rounded-md border-l-4 px-3 py-3 text-sm font-semibold transition-colors duration-200 ${
            pathname === item.link
              ? activeClasses
              : "border-transparent text-brand-muted hover:bg-gray-50 hover:text-brand-primary"
          }`}
        >
          {item.icon}
          {item.name}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="space-y-1 p-4">
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded-md p-3 text-sm font-semibold text-brand-secondary transition-colors hover:bg-red-50"
      >
        <LogOut size={ICON_SIZES.SM} />
        Sair
      </button>
      <p className="px-3 text-[10px] text-brand-muted">
        <AppVersionBadge />
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <div className="relative">
        <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-brand-border bg-white px-4 py-3 shadow-sm">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-full border border-brand-border p-2 text-brand-muted"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {menuOpen ? <X size={ICON_SIZES.MD} /> : <Menu size={ICON_SIZES.MD} />}
          </button>
          <IfpeBrand compact />
        </div>

        {menuOpen && (
          <button
            className="fixed inset-0 z-40 bg-black/30"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          />
        )}

        <aside
          className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col justify-between border-r border-brand-border bg-white shadow-lg transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute right-4 top-4 rounded-full border border-brand-border p-2 text-brand-muted"
            aria-label="Fechar menu"
          >
            <X size={ICON_SIZES.MD} />
          </button>
          <div>
            {brandBlock}
            {nav}
          </div>
          {footer}
        </aside>
      </div>
    );
  }

  return (
    <aside className="flex h-screen w-72 flex-col justify-between border-r border-brand-border bg-white shadow-[0_1px_3px_rgba(16,24,16,0.06)]">
      <div>
        {brandBlock}
        {nav}
      </div>
      {footer}
    </aside>
  );
}
