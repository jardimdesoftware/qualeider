"use client";

import { useAuthGuard } from "@/hooks/useAuthGuard";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { Bell, CheckCircle, MailOpen } from "lucide-react";
import { formatDateTimeBR } from "@/utils/date";
import { ICON_SIZES } from "@/constants/ui";
import { useUserNotifications, useMarkNotificationAsRead } from "@/hooks/queries/useNotifications";
import { logger } from "@/utils/logger";

export default function UserNotificationsPage() {
  const { userId, isLoading: authLoading } = useAuthGuard("user");
  const { data: notifications = [], isLoading: loading } = useUserNotifications();
  const markAsRead = useMarkNotificationAsRead();

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead.mutateAsync(id);
    } catch (error) {
      logger.error("Erro ao marcar notificação como lida", error, { notificationId: id });
    }
  };

  if (authLoading || loading) return <DashboardLoading />;

  return (
    <div className="flex-1 overflow-y-auto bg-[#fdfbf7] min-h-screen">
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 md:px-8 py-6">
        <div className="flex items-center gap-3">
          <Bell className="text-[#1e3a29]" size={ICON_SIZES.LG} />
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-[#1e3a29]">
              Minhas Notificações
            </h2>
            <p className="text-slate-500">
              Comunicados e mensagens da sua associação
            </p>
          </div>
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <MailOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Você não possui notificações no momento.</p>
          </div>
        ) : (
          notifications.map((item) => (
            <div 
              key={item.id} 
              className={`bg-white rounded-lg p-5 border transition-all ${
                item.read ? 'border-gray-200 opacity-80' : 'border-l-4 border-l-green-500 border-gray-200 shadow-md'
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
                  <h3 className={`text-lg font-bold mb-2 ${item.read ? 'text-gray-700' : 'text-[#1e3a29]'}`}>
                    {item.notification.subject}
                  </h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {item.notification.message}
                  </p>
                </div>

                {!item.read && (
                  <button 
                    onClick={() => handleMarkAsRead(item.id)}
                    className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-full transition-colors"
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
    </div>
  );
}
