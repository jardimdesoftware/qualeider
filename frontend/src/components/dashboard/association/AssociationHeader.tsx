"use client";

import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

interface AssociationHeaderProps {
  totalAssociates: number;
}

export function AssociationHeader({ totalAssociates }: AssociationHeaderProps) {
  const router = useRouter();

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10">
      <div>
        <h2 className="text-2xl md:text-3xl font-black text-[#1e3a29] brand-font">
          Gerenciar Associados
        </h2>
        <p className="text-slate-500">
          Total de Produtores Ativos: <strong>{totalAssociates}</strong>
        </p>
      </div>
      <button
        onClick={() => router.push("/dashboardAssociation/associates/invite")}
        className="bg-[#1e3a29] hover:bg-[#142920] text-white font-bold py-3 px-6 rounded-lg shadow-md flex items-center gap-2 transition-transform active:scale-95"
      >
        <UserPlus className="w-5 h-5 text-[#4ade80]" />
        Novo Produtor
      </button>
    </header>
  );
}
