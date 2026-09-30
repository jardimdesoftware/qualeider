"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { PageHeader, AllowedEmailsPanel } from "@/components/dashboard";
import { UserPlus, Users, Search, MapPin } from "lucide-react";
import { LOGO_SIZES } from "@/constants/ui";
import { useUsers } from "@/hooks/queries/useUsers";
import { User, UserRole, Status } from "@/interfaces/user";
import { EmptyState } from "@/components/ui";
import { getUserRoleFromToken } from "@/utils/auth";

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Admin",
  [UserRole.VAQUEIRO]: "Vaqueiro",
};

const ROLE_BADGE_CLASSES: Record<UserRole, string> = {
  [UserRole.ADMIN]: "bg-blue-100 text-blue-800 border border-blue-200",
  [UserRole.VAQUEIRO]: "bg-amber-100 text-amber-800 border border-amber-200",
};

const ROLE_AVATAR_CLASSES: Record<UserRole, string> = {
  [UserRole.ADMIN]: "bg-slate-700",
  [UserRole.VAQUEIRO]: "bg-amber-600",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function UserRow({ user }: { user: User }) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold ${
              ROLE_AVATAR_CLASSES[user.role] ?? "bg-slate-400"
            }`}
          >
            {initials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
            ROLE_BADGE_CLASSES[user.role] ?? "bg-gray-100 text-gray-700"
          }`}
        >
          {ROLE_LABELS[user.role] ?? user.role}
        </span>
      </td>
      <td className="px-6 py-4 hidden md:table-cell">
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
            user.status === Status.Active
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {user.status === Status.Active ? "Ativo" : "Inativo"}
        </span>
      </td>
      <td className="px-6 py-4 text-slate-500 hidden lg:table-cell">
        {user.city || user.state ? (
          <span className="inline-flex items-center gap-1 text-xs">
            <MapPin size={12} />
            {user.city}
            {user.city && user.state ? " / " : ""}
            {user.state}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/manageUsers/activity?id=${user.id}`}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline"
          >
            Ver atividade
          </Link>
          <Link
            href={`/manageUsers/editUser?id=${user.id}`}
            className="text-xs font-semibold text-slate-800 hover:underline"
          >
            Editar
          </Link>
        </div>
      </td>
    </tr>
  );
}

export default function ManageUsers() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  // Protege a rota: só ADMIN pode gerenciar funcionários
  useEffect(() => {
    const role = getUserRoleFromToken();
    if (role && role !== "ADMIN") {
      router.replace("/dashboardUser");
    }
  }, [router]);

  const { data: users = [], isLoading, isError } = useUsers();

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="Funcionários"
        subtitle="Gerencie os membros da sua fazenda"
      />

      <div className="flex-1 min-h-0 flex flex-col w-full p-4 md:p-6 max-w-5xl mx-auto gap-4">
        {/* Barra de ações */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          <Link
            href="/manageUsers/addUser"
            className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors shrink-0"
          >
            <UserPlus size={16} />
            Adicionar Funcionário
          </Link>
        </div>

        {/* Conteúdo */}
        {isLoading && (
          <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
            Carregando funcionários...
          </div>
        )}

        {isError && (
          <div className="text-center py-20 text-red-500 text-sm">
            Erro ao carregar funcionários. Tente novamente.
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState
            icon={<Users size={LOGO_SIZES.LG} className="text-slate-400" />}
            title={
              search
                ? "Nenhum funcionário encontrado"
                : "Nenhum funcionário cadastrado"
            }
            description={
              search
                ? `Não há resultados para "${search}".`
                : "Adicione o primeiro funcionário da sua fazenda."
            }
            actionHref="/manageUsers/addUser"
            actionLabel="Adicionar Funcionário"
          />
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-0 flex-1">
              <div className="overflow-auto min-h-0 flex-1">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-50">
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left font-semibold text-gray-600">
                        Funcionário
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-600">
                        Função
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-600 hidden md:table-cell">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-600 hidden lg:table-cell">
                        Local
                      </th>
                      <th className="px-6 py-4 text-right font-semibold text-gray-600">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((user) => (
                      <UserRow key={user.id} user={user} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              {filtered.length} funcionário{filtered.length !== 1 ? "s" : ""}{" "}
              {search ? "encontrado" : "cadastrado"}
              {filtered.length !== 1 ? "s" : ""}
            </p>
          </>
        )}

        <AllowedEmailsPanel />
      </div>
    </DashboardLayout>
  );
}
