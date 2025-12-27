"use client";

import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import { EmptyState } from "@/components/ui";
import { UserPlus } from "lucide-react";
import { LOGO_SIZES } from "@/constants/ui";

export default function AddUser() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Adicionar Usuário"
        subtitle="Cadastre um novo produtor"
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <EmptyState
          icon={<UserPlus size={LOGO_SIZES.LG} className="text-slate-400" />}
          title="Funcionalidade em desenvolvimento"
          description="O cadastro de usuários será implementado em breve."
          actionHref="/manageUsers"
          actionLabel="Voltar"
        />
      </div>
    </DashboardLayout>
  );
}
