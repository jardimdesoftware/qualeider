"use client";

import { Search } from "lucide-react";

export function AssociationFilterBar() {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por nome, fazenda ou CPF..."
          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#d97706] focus:border-[#d97706] outline-none"
        />
      </div>
      <select className="border border-slate-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-[#d97706] outline-none">
        <option>Todos os Status</option>
        <option>Ativos</option>
        <option>Pendentes</option>
        <option>Inadimplentes</option>
      </select>
    </div>
  );
}
