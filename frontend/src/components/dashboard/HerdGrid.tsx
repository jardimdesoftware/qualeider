"use client";

import Link from "next/link";
import { Animal } from "@/interfaces/animal";
import { AnimalProductionSummary } from "@/interfaces/animal";
import { EmptyState } from "@/components/ui";
import { Cat, Crown } from "lucide-react";
import { ICON_SIZES } from "@/constants/ui";

interface HerdGridProps {
  animals: Animal[];
  productionByAnimalId: Map<number, AnimalProductionSummary>;
  topAnimalId?: number | null;
}

// Mesma paleta da marca (verde/âmbar/vermelho de ênfase) usada como avatar
// de cada vaca, ciclando quando há mais animais que cores.
const AVATAR_COLORS = ["#2f9e41", "#d97706", "#237a32", "#cd191e", "#5f6b58"];

function initials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function animalLabel(a: Animal): string {
  return a.name || (a.tagNumber ? `#${a.tagNumber}` : `Animal ${a.id}`);
}

export default function HerdGrid({
  animals,
  productionByAnimalId,
  topAnimalId,
}: HerdGridProps) {
  if (animals.length === 0) {
    return (
      <EmptyState
        icon={<Cat size={ICON_SIZES.XL} />}
        title="Nenhum animal cadastrado"
        description="Cadastre seu primeiro animal para ver o rebanho aqui."
        actionHref="/manageMyAnimals"
        actionLabel="Cadastrar animal"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {animals.map((animal, index) => {
        const production = productionByAnimalId.get(animal.id);
        const isTop = topAnimalId != null && animal.id === topAnimalId;
        return (
          <Link
            key={animal.id}
            href={`/manageMyAnimals/${animal.id}`}
            className={`relative bg-white border rounded-2xl p-4 text-center hover:shadow-md transition-all ${
              isTop
                ? "border-amber-300 ring-1 ring-amber-300"
                : "border-slate-100 hover:border-slate-200"
            }`}
          >
            {isTop && (
              <span
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow-sm"
                title="Maior produção do mês"
              >
                <Crown
                  size={ICON_SIZES.XXS}
                  className="text-white"
                  fill="currentColor"
                />
              </span>
            )}
            <div
              className="w-11 h-11 rounded-full mx-auto mb-2.5 flex items-center justify-center text-white text-sm font-bold"
              style={{
                backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
              }}
            >
              {initials(animal.name)}
            </div>
            <p className="text-sm font-bold text-slate-800 truncate">
              {animalLabel(animal)}
            </p>
            <p className="text-xs text-slate-400 mb-2">
              {animal.breed || animal.animalSpecies?.name || "—"}
              {animal.age ? ` · ${animal.age}a` : ""}
            </p>
            <p className="text-sm font-bold text-slate-800 tabular-nums">
              {(production?.totalProduction ?? 0).toFixed(0)}
              <span className="font-normal text-slate-400 text-xs"> L/mês</span>
            </p>
          </Link>
        );
      })}
    </div>
  );
}
