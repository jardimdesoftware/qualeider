"use client";

import { useAuthGuard } from "@/hooks/useAuthGuard";
import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { CheckCircle, MailOpen } from "lucide-react";
import { formatDateTimeBR } from "@/utils/date";
import { ICON_SIZES } from "@/constants/ui";
import {
  useUserNotifications,
  useMarkNotificationAsRead,
} from "@/hooks/queries/useNotifications";
import { logger } from "@/utils/logger";

export default function UserNotificationsPage() {
  const { isLoading: authLoading } = useAuthGuard();
  const { data: notifications = [], isLoading: loading } =
    useUserNotifications();
  const markAsRead = useMarkNotificationAsRead();

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead.mutateAsync(id);
    } catch (error) {
      logger.error("Erro ao marcar notificação como lida", error, {
        notificationId: id,
      });
    }
  };

  if (authLoading || loading) return <DashboardLoading />;

  return (
    <DashboardLayout>
      <PageHeader
        title="Notificações"
        subtitle="Comunicados e mensagens da sua fazenda"
      />

      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-slate-100">
            <MailOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Você não possui notificações no momento.
            </p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-lg p-5 border border-gray-200 transition-all ${
                item.read ? "opacity-80" : "shadow-md"
              }`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {formatDateTimeBR(item.createdAt)}
                    </span>
                    {!item.read && (
                      <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        NOVA
                      </span>
                    )}
                  </div>
                  <h3
                    className={`text-lg font-bold mb-2 ${item.read ? "text-gray-700" : "text-slate-800"}`}
                  >
                    {item.notification.subject}
                  </h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {item.notification.message}
                  </p>
                </div>

                {!item.read && (
                  <button
                    onClick={() => handleMarkAsRead(item.id)}
                    className="text-slate-800 hover:text-slate-900 hover:bg-green-50 p-2 rounded-full transition-colors"
                    title="Marcar como lida"
                  >
                    <CheckCircle size={ICON_SIZES.MD} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
