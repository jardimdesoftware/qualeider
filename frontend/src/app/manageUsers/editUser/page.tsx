"use client";

import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import { EmptyState } from "@/components/ui";
import { UserCog } from "lucide-react";

export default function EditUser() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Editar Usuário"
        subtitle="Atualize as informações do produtor"
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <EmptyState
          icon={<UserCog size={48} className="text-slate-400" />}
          title="Funcionalidade em desenvolvimento"
          description="A edição de usuários será implementada em breve."
          actionHref="/manageUsers"
          actionLabel="Voltar"
        />
      </div>
    </DashboardLayout>
  );
}
