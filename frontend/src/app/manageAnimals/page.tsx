"use client";

import { DashboardLayout } from "@/components/layout";
import { PageHeader } from "@/components/dashboard";
import { EmptyState } from "@/components/ui";
import { Cat } from "lucide-react";

export default function ManageAnimals() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Gerenciar Animais"
        subtitle="Visualize todos os animais cadastrados na associação"
      />

      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <EmptyState
          icon={<Cat size={48} className="text-slate-400" />}
          title="Dashboard em desenvolvimento"
          description="Esta funcionalidade será implementada em breve."
          actionHref="/dashboardAssociation"
          actionLabel="Voltar ao Dashboard"
        />
      </div>
    </DashboardLayout>
  );
}
