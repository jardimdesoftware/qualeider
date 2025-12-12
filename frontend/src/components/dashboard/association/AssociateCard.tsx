"use client";

import { Tractor, Pencil, ChevronRight } from "lucide-react";

export interface AssociateProps {
  name: string;
  farmName: string;
  location: string;
  status: "Ativo" | "Pendente" | "Inadimplente";
  lastAccess?: string;
  animalsCount: number | null;
  dailyProduction: string | null;
  initials?: string;
}

export function AssociateCard({
  name,
  farmName,
  location,
  status,
  lastAccess,
  animalsCount,
  dailyProduction,
  initials,
}: AssociateProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo":
        return "bg-green-100 text-green-800";
      case "Pendente":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getBorderColor = (status: string) => {
      switch (status) {
          case "Ativo":
            return "border-[#4ade80]";
          case "Pendente":
            return "border-[#d97706]";
          default:
            return "border-slate-300";
        }
  }

  return (
    <div className={`bg-white rounded-xl shadow-md border-l-8 ${getBorderColor(status)} p-6 hover:shadow-lg transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
          {initials ? (
            <span className="text-xl font-black text-slate-300">{initials}</span>
          ) : (
             <Tractor className="w-8 h-8 text-[#1e3a29]" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#1e3a29] brand-font">
            {name}
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            {farmName} • {location}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`${getStatusColor(
                status
              )} text-xs font-bold px-2 py-0.5 rounded-full`}
            >
              {status}
            </span>
            <span className="text-xs text-slate-400">
              {lastAccess ? `Último acesso: ${lastAccess}` : "Cadastro incompleto"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
        <div className="text-center">
          <p className="text-xs text-slate-400 uppercase font-bold">Animals</p>
          <p className={`text-xl font-black ${animalsCount ? "text-[#1e3a29]" : "text-slate-300"}`}>
            {animalsCount || "-"}
          </p>
        </div>
        <div className="text-center px-4 border-l border-slate-200">
          <p className="text-xs text-slate-400 uppercase font-bold">
            Prod. Diária
          </p>
          <p className={`text-xl font-black ${dailyProduction ? "text-[#1e3a29]" : "text-slate-300"}`}>
            {dailyProduction || "-"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="p-2 text-slate-400 hover:text-[#d97706] hover:bg-orange-50 rounded-lg transition"
            title="Editar"
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button
            className="p-2 text-slate-400 hover:text-[#1e3a29] hover:bg-green-50 rounded-lg transition"
            title="Ver Detalhes"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
