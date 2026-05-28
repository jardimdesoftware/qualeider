"use client";

import React from "react";
import { Check, Pencil, Droplets } from "lucide-react";
import { Animal } from "@/interfaces/animal";
import { ConfirmedItemMap } from "@/hooks/useDailyCollection";

interface ConfirmedCowsListProps {
  confirmedItems: ConfirmedItemMap;
  animals: Animal[];
  animalLabel: (a: Animal) => string;
  onEdit: (animalId: number) => void;
}

const CMT_BADGE: Record<string, string> = {
  Normal: "bg-green-100 text-green-700",
  Suspeito: "bg-yellow-100 text-yellow-700",
  Positivo: "bg-red-100 text-red-700",
};

export function ConfirmedCowsList({
  confirmedItems,
  animals,
  animalLabel,
  onEdit,
}: ConfirmedCowsListProps) {
  const entries = Object.entries(confirmedItems);
  if (entries.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
        <Check className="w-4 h-4 text-green-500" />
        Vacas confirmadas ({entries.length})
      </h3>
      <ul className="space-y-2">
        {entries.map(([animalIdStr, data]) => {
          const animalId = Number(animalIdStr);
          const animal = animals.find((a) => a.id === animalId);
          if (!animal) return null;

          return (
            <li
              key={animalId}
              className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Droplets className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1e3a29] text-sm truncate">
                  {animalLabel(animal)}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-black text-[#1e3a29]">
                    {data.quantity.toFixed(1)} L
                  </span>
                  {data.cmtResult && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        CMT_BADGE[data.cmtResult] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      CMT: {data.cmtResult}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onEdit(animalId)}
                className="text-slate-400 hover:text-[#d97706] transition-colors flex-shrink-0"
                aria-label="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
