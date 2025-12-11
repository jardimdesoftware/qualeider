"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout";
import { EmptyState } from "@/components/ui";
import { Cat } from "lucide-react";

export default function ManageAnimals() {
  return (
    <div className="flex flex-col lg:flex-row bg-[#fdfbf7] min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 md:px-8 py-6">
          <h2 className="text-2xl md:text-3xl font-black text-[#1e3a29]">
            Gerenciar Animais
          </h2>
          <p className="text-slate-500">
            Visualize todos os animais cadastrados na associação
          </p>
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          <EmptyState
            icon={<Cat size={48} className="text-slate-400" />}
            title="Dashboard em desenvolvimento"
            description="Esta funcionalidade será implementada em breve."
            actionHref="/dashboard Associação"
            actionLabel="Voltar ao Dashboard"
          />
        </div>
      </div>
    </div>
  );
}
