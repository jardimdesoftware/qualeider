"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout";
import { EmptyState } from "@/components/ui";
import { UserPlus } from "lucide-react";

export default function AddUser() {
  return (
    <div className="flex flex-col lg:flex-row bg-[#fdfbf7] min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-6 md:px-8 py-6">
          <h2 className="text-2xl md:text-3xl font-black text-[#1e3a29]">
            Adicionar Usuário
          </h2>
          <p className="text-slate-500">Cadastre um novo produtor</p>
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          <EmptyState
            icon={<UserPlus size={48} className="text-slate-400" />}
            title="Funcionalidade em desenvolvimento"
            description="O cadastro de usuários será implementado em breve."
            actionHref="/manageUsers"
            actionLabel="Voltar"
          />
        </div>
      </div>
    </div>
  );
}
