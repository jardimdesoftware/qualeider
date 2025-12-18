"use client";

import { useState } from "react";

interface ReportFiltersProps {
  onFilterChange: (startDate: string | null, endDate: string | null, period: string) => void;
}

export default function ReportFilters({ onFilterChange }: ReportFiltersProps) {
  const [period, setPeriod] = useState<string>("month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const handlePeriodChange = (selectedPeriod: string) => {
    setPeriod(selectedPeriod);
    
    const now = new Date();
    let start: Date, end: Date;

    switch (selectedPeriod) {
      case "today":
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        break;
      case "week":
        end = new Date();
        start = new Date();
        start.setDate(end.getDate() - 7);
        break;
      case "month":
        end = new Date();
        start = new Date();
        start.setDate(end.getDate() - 30);
        break;
      case "custom":
        // Usuário definirá as datas
        onFilterChange(null, null, "custom");
        return;
      default:
        start = new Date();
        end = new Date();
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    onFilterChange(start.toISOString(), end.toISOString(), selectedPeriod);
  };

  const handleCustomFilter = () => {
    if (startDate && endDate) {
      onFilterChange(
        new Date(startDate).toISOString(),
        new Date(endDate).toISOString(),
        "custom"
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-[#1e3a29] mb-4">Filtros de Período</h3>
      
      <div className="flex flex-wrap gap-4">
        {/* Botões de período rápido */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handlePeriodChange("today")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === "today"
                ? "bg-[#1e3a29] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => handlePeriodChange("week")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === "week"
                ? "bg-[#1e3a29] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Últimos 7 dias
          </button>
          <button
            onClick={() => handlePeriodChange("month")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === "month"
                ? "bg-[#1e3a29] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Últimos 30 dias
          </button>
          <button
            onClick={() => {
              setPeriod("custom");
              handleCustomFilter();
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === "custom"
                ? "bg-[#1e3a29] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Personalizado
          </button>
        </div>

        {/* Date pickers para período personalizado */}
        {period === "custom" && (
          <div className="flex flex-wrap gap-4 w-full mt-2">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1e3a29] focus:border-transparent"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1e3a29] focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCustomFilter}
                className="px-6 py-2 bg-[#d97706] text-white rounded-lg font-medium hover:bg-[#b85c00] transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
