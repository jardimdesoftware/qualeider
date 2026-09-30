"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, History, ArrowLeft } from "lucide-react";

import { getUserRoleFromToken } from "@/utils/auth";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import { EmptyState } from "@/components/ui";
import { useUser } from "@/hooks/queries/useUsers";
import { useActivityLogs } from "@/hooks/queries/useActivityLogs";
import { ActivityEventType } from "@/interfaces/activity-log";

const EVENT_LABELS: Record<ActivityEventType, string> = {
  [ActivityEventType.LOGIN]: "Login no sistema",
  [ActivityEventType.DAILY_COLLECTION_CREATED]: "Registrou uma coleta diária",
  [ActivityEventType.DAILY_COLLECTION_UPDATED]: "Editou uma coleta diária",
  [ActivityEventType.ANIMAL_CREATED]: "Cadastrou um animal",
  [ActivityEventType.ANIMAL_UPDATED]: "Editou um animal",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function UserActivityLog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id") ? Number(searchParams.get("id")) : null;
  const [page, setPage] = useState(1);

  const { data: user } = useUser(userId);
  const { data: logs, isLoading, isError } = useActivityLogs(userId, page);

  if (!userId) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">
        ID de funcionário não informado.{" "}
        <button
          onClick={() => router.push("/manageUsers")}
          className="text-slate-800 hover:underline"
        >
          Voltar à lista
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-4">
      <Link
        href="/manageUsers"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-slate-900"
      >
        <ArrowLeft size={14} />
        Voltar à lista de funcionários
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            {user ? `Atividade de ${user.name}` : "Histórico de atividade"}
          </h2>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16 text-gray-500 text-sm gap-2">
            <Loader2 size={18} className="animate-spin" />
            Carregando histórico...
          </div>
        )}

        {isError && (
          <div className="p-8 text-center text-red-500 text-sm">
            Não foi possível carregar o histórico de atividade.
          </div>
        )}

        {!isLoading && !isError && logs && logs.data.length === 0 && (
          <EmptyState
            icon={<History size={40} className="text-slate-400" />}
            title="Nenhuma atividade registrada"
            description="Ainda não há eventos registrados para este funcionário."
          />
        )}

        {!isLoading && !isError && logs && logs.data.length > 0 && (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">
                    Evento
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-600">
                    Data/Hora
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.data.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-3 text-gray-900">
                      {EVENT_LABELS[log.eventType] ?? log.eventType}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {formatDateTime(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {logs.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 text-xs text-gray-500">
                <span>
                  Página {logs.page} de {logs.totalPages} ({logs.total} eventos)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!logs.hasPreviousPage}
                    className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!logs.hasNextPage}
                    className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function UserActivityPage() {
  const router = useRouter();

  useEffect(() => {
    const role = getUserRoleFromToken();
    if (role && role !== "ADMIN") {
      router.replace("/dashboardUser");
    }
  }, [router]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Histórico de Atividade"
        subtitle="Acompanhe as ações registradas por este funcionário"
      />
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20 text-gray-500 text-sm gap-2">
            <Loader2 size={18} className="animate-spin" />
            Carregando...
          </div>
        }
      >
        <UserActivityLog />
      </Suspense>
    </DashboardLayout>
  );
}
