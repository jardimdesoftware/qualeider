"use client";

import { ProducerRanking } from "@/interfaces/report";
import { Trophy, Medal, Award } from "lucide-react";

interface ProducerRankingTableProps {
  data: ProducerRanking[];
}

export default function ProducerRankingTable({ data }: ProducerRankingTableProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-slate-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-700" />;
      default:
        return <span className="text-lg font-bold text-slate-600">#{rank}</span>;
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
        <p className="text-slate-500">Nenhum produtor encontrado no período selecionado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 bg-[#1e3a29] text-white">
        <h3 className="text-xl font-bold">Ranking de Produtores</h3>
        <p className="text-sm text-slate-200">Top {data.length} produtores por volume de produção</p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Posição
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Produtor
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Localização
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                Animais
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                Total (L)
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                Média/Dia (L)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((producer) => (
              <tr 
                key={producer.id} 
                className={`hover:bg-slate-50 transition-colors ${
                  producer.rank <= 3 ? 'bg-amber-50/30' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-center w-12">
                    {getRankIcon(producer.rank)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-slate-900">{producer.name}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-700">
                  {producer.city && producer.state ? (
                    `${producer.city}, ${producer.state}`
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {producer.animalsCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-semibold text-slate-900">
                  {producer.totalProduction.toFixed(1)}
                </td>
                <td className="px-6 py-4 text-right text-slate-700">
                  {producer.avgProductionPerDay.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-slate-200">
        {data.map((producer) => (
          <div 
            key={producer.id} 
            className={`p-4 ${producer.rank <= 3 ? 'bg-amber-50/30' : ''}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {getRankIcon(producer.rank)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{producer.name}</p>
                  {producer.city && producer.state && (
                    <p className="text-xs text-slate-400">{producer.city}, {producer.state}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-200">
              <div>
                <p className="text-xs text-slate-500">Animais</p>
                <p className="text-sm font-semibold text-green-600">{producer.animalsCount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total (L)</p>
                <p className="text-sm font-semibold text-slate-900">{producer.totalProduction.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Média/Dia (L)</p>
                <p className="text-sm font-semibold text-slate-700">{producer.avgProductionPerDay.toFixed(1)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
