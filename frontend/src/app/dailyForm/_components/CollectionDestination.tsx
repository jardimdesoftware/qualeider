"use client";

import React from "react";
import { Check, Milk, Truck } from "lucide-react";
import { Destination } from "@/interfaces/destination";

interface CollectionDestinationProps {
  totalMilk: number;
  milkedCows: number;
  destinations: Destination[];
  isLoading: boolean;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

/**
 * Fim da coleta do dia: total de leite coletado e para onde ele vai. Com
 * destinos cadastrados, escolher um é obrigatório; sem nenhum, a coleta segue
 * sem destino.
 */
export function CollectionDestination({
  totalMilk,
  milkedCows,
  destinations,
  isLoading,
  selectedId,
  onSelect,
}: CollectionDestinationProps) {
  return (
    <section
      aria-label="Total coletado e destino do leite"
      className="bg-white rounded-xl border-2 border-[#d97706] shadow-sm overflow-hidden"
    >
      <div className="flex items-center gap-3 bg-amber-50 px-4 py-4 border-b border-amber-100">
        <Milk className="w-6 h-6 text-[#d97706]" />
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
            Total de leite coletado
          </p>
          <p className="text-3xl font-black text-slate-800">
            {totalMilk.toFixed(1)} L
            <span className="ml-2 text-sm font-semibold text-slate-500">
              {milkedCows} {milkedCows === 1 ? "vaca" : "vacas"}
            </span>
          </p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <Truck className="w-4 h-4" />
          Para onde vai o leite?
        </p>

        {isLoading && (
          <p className="text-sm text-slate-400">Carregando destinos...</p>
        )}

        {!isLoading && destinations.length === 0 && (
          <p className="text-sm text-slate-500">
            Nenhum destino cadastrado. A coleta será registrada sem destino.
          </p>
        )}

        {destinations.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {destinations.map((destination) => {
              const isActive = selectedId === destination.id;
              return (
                <button
                  key={destination.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onSelect(isActive ? null : destination.id)}
                  className={`flex items-center justify-center gap-1.5 py-3 px-2 rounded-xl border-2 font-bold text-sm transition-all ${
                    isActive
                      ? "bg-[#d97706] border-[#b45309] text-white"
                      : "bg-amber-50 border-amber-200 text-amber-900 hover:border-[#d97706]"
                  }`}
                >
                  {destination.name}
                  {isActive && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
