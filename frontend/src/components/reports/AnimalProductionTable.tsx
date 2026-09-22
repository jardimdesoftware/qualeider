"use client";

import { AnimalProductionSummary } from "@/interfaces/animal";
import { Milk } from "lucide-react";

interface AnimalProductionTableProps {
  data: AnimalProductionSummary[];
}

function animalLabel(a: AnimalProductionSummary): string {
  if (a.tagNumber) return `#${a.tagNumber}${a.name ? ` - ${a.name}` : ""}`;
  return a.name || `Animal ID ${a.animalId}`;
}

export default function AnimalProductionTable({
  data,
}: AnimalProductionTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
        <p className="text-slate-500">Nenhum animal cadastrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-xl font-bold text-slate-800">Detalhamento</h3>
        <p className="text-sm text-slate-500">
          {data.length} animal{data.length !== 1 ? "is" : ""} no período
          selecionado
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Animal
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                Coletas
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                Total (L)
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                Média/Coleta (L)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((animal) => (
              <tr
                key={animal.animalId}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-900">
                    {animalLabel(animal)}
                  </p>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {animal.collectionsCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-semibold text-slate-900">
                  {animal.totalProduction.toFixed(1)}
                </td>
                <td className="px-6 py-4 text-right text-slate-700">
                  {animal.avgProduction.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-slate-200">
        {data.map((animal) => (
          <div key={animal.animalId} className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Milk size={16} className="text-slate-800" />
              <p className="font-semibold text-slate-900">
                {animalLabel(animal)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-200">
              <div>
                <p className="text-xs text-slate-500">Coletas</p>
                <p className="text-sm font-semibold text-green-600">
                  {animal.collectionsCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total (L)</p>
                <p className="text-sm font-semibold text-slate-900">
                  {animal.totalProduction.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Média/Coleta (L)</p>
                <p className="text-sm font-semibold text-slate-700">
                  {animal.avgProduction.toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
