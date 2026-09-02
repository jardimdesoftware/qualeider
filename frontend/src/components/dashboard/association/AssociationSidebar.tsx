"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  Cat,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { clearAuthToken, getUserIdFromToken } from "@/utils/auth";
import { useAssociation } from "@/hooks/queries/useAssociation";
import { IfpeBrand } from "@/components/ui";

const links = [
  {
    href: "/dashboardAssociation",
    label: "Visao Regional",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboardAssociation/associates",
    label: "Associados",
    icon: Users,
  },
  {
    href: "/dashboardAssociation/herd",
    label: "Rebanho Regional",
    icon: Cat,
  },
  {
    href: "/dashboardAssociation/reports",
    label: "Relatorios",
    icon: BarChart3,
  },
  {
    href: "/dashboardAssociation/notifications",
    label: "Notificacoes",
    icon: Bell,
  },
  {
    href: "/settings",
    label: "Configuracoes",
    icon: Settings,
  },
];

export function AssociationSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = getUserIdFromToken();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- token so existe no localStorage do client
    if (id) setUserId(id);
  }, []);

  const { data: association, isLoading } = useAssociation(userId);

  const handleLogout = () => {
    clearAuthToken();
    router.push("/");
  };

  const brandBlock = (
    <div className="p-4">
      <IfpeBrand />
      <div className="mt-5 flex items-center gap-3 border-t border-brand-border pt-5">
        <Image
          src="/logo_icon.svg"
          alt="Logo QuaLeiDer"
          className="h-10 w-10 rounded-md border border-brand-border bg-white p-1"
          width={40}
          height={40}
        />
        <div className="min-w-0">
          <h1 className="truncate text-base font-extrabold text-gray-950">
            {isLoading ? "Carregando..." : association?.name || "Associacao"}
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gov-blue">
            Administrador
          </p>
        </div>
      </div>
    </div>
  );

  const nav = (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      <div className="space-y-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-md border-l-4 px-4 py-3 text-sm font-semibold transition-colors ${
                active
                  ? "border-gov-blue bg-blue-50 text-gov-blue"
                  : "border-transparent text-brand-muted hover:bg-gray-50 hover:text-brand-primary"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  const footer = (
    <div className="border-t border-brand-border p-4">
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-semibold text-brand-secondary transition-colors hover:bg-red-50"
      >
        <LogOut className="h-5 w-5" />
        <span>Sair</span>
      </button>
    </div>
  );

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-brand-border bg-white px-4 py-3 shadow-sm md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-brand-border p-2 text-brand-muted"
          aria-label="Abrir menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <IfpeBrand compact />
      </div>

      {open && (
        <button
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-brand-border bg-white shadow-lg transition-transform duration-300 md:sticky md:top-0 md:z-20 md:translate-x-0 md:shadow-[0_1px_3px_rgba(16,24,16,0.06)] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 rounded-full border border-brand-border p-2 text-brand-muted md:hidden"
          aria-label="Fechar menu"
        >
          <X className="h-6 w-6" />
        </button>
        {brandBlock}
        {nav}
        {footer}
      </aside>
    </>
  );
}
