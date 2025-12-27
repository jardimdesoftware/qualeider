"use client";

import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import { EmptyState } from "@/components/ui";
import { Users } from "lucide-react";
import { ICON_SIZES } from "@/constants/ui";

export default function ManageUsers() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Gerenciar Usuários"
        subtitle="Visualize e gerencie os produtores da associação"
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <EmptyState
          icon={<Users size={ICON_SIZES.LG} className="text-slate-400" />}
          title="Gerenciamento em desenvolvimento"
          description="Esta funcionalidade será implementada em breve."
          actionHref="/dashboardAssociation"
          actionLabel="Voltar ao Dashboard"
        />
      </div>
    </DashboardLayout>
  );
}
